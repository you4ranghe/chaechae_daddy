import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/supabase-server";
import { analyzeSponsorshipDM } from "@/lib/agents/sponsorship-agent";
import { generateChecklist } from "@/lib/agents/content-planner";
import { checkUsageLimit, recordUsage } from "@/lib/db/usage";
import { notifyAnalysisComplete } from "@/lib/email/notify";

export async function POST(request: NextRequest) {
  try {
    // 1. 인증 체크
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // 2. 사용량 제한 체크
    const usage = await checkUsageLimit(supabase, user.id);
    if (!usage.allowed) {
      return NextResponse.json(
        {
          error: usage.message,
          remaining: 0,
          plan: usage.plan,
          limit: usage.limit,
        },
        { status: 429 }
      );
    }

    // 3. 입력 검증
    const body = await request.json();
    const dmContent = body?.dmContent;

    if (!dmContent || typeof dmContent !== "string") {
      return NextResponse.json(
        { error: "협찬 DM 내용을 입력해주세요." },
        { status: 400 }
      );
    }

    const trimmed = dmContent.trim();
    if (trimmed.length < 10) {
      return NextResponse.json(
        { error: "DM 내용이 너무 짧습니다. 최소 10자 이상 입력해주세요." },
        { status: 400 }
      );
    }

    if (trimmed.length > 10000) {
      return NextResponse.json(
        { error: "DM 내용이 너무 깁니다. 10,000자 이내로 입력해주세요." },
        { status: 400 }
      );
    }

    // 4. 유저 컨텍스트 구성 (profiles 테이블 우선, 없으면 user_metadata 폴백)
    const { data: profile } = await supabase
      .from("profiles")
      .select("instagram_handle, follower_count, categories")
      .eq("id", user.id)
      .single();

    const userContext = {
      instagramHandle: profile?.instagram_handle || user.user_metadata?.instagram_handle || "",
      followerCount: profile?.follower_count || user.user_metadata?.follower_count || 0,
      categories: profile?.categories || user.user_metadata?.categories || [],
    };

    // 5. 오케스트레이터 → Sonnet 분석 실행
    const { analysis, tokensUsed, model } = await analyzeSponsorshipDM(
      trimmed,
      userContext
    );

    // 6. 체크리스트 생성
    const checklist = generateChecklist(analysis);

    // 7. 중복 브랜드 감지 — 동일 brand_name (대소문자 무시) 이전 협찬 조회
    let duplicateBrand: {
      count: number;
      lastStatus: string;
      lastAmount: number;
      lastDate: string;
    } | null = null;

    if (analysis.brand.name) {
      const { data: priorBrand } = await supabase
        .from("sponsorships")
        .select("status, payment_amount, created_at")
        .eq("user_id", user.id)
        .ilike("brand_name", analysis.brand.name)
        .order("created_at", { ascending: false });

      if (priorBrand && priorBrand.length > 0) {
        duplicateBrand = {
          count: priorBrand.length,
          lastStatus: priorBrand[0].status,
          lastAmount: priorBrand[0].payment_amount || 0,
          lastDate: priorBrand[0].created_at,
        };
      }
    }

    // 8. sponsorships 테이블에 저장
    const { data: sponsorship, error: dbError } = await supabase
      .from("sponsorships")
      .insert({
        user_id: user.id,
        brand_name: analysis.brand.name,
        product: analysis.brand.product,
        status: "pending",
        raw_dm: trimmed,
        analysis,
        checklist,
        payment_amount: 0,
        deadline:
          analysis.conditions.deadline !== "미정"
            ? analysis.conditions.deadline
            : null,
      })
      .select()
      .single();

    if (dbError) {
      console.error("sponsorships 저장 실패:", dbError);
    }

    // 9. agent_usage에 사용량 기록
    await recordUsage(
      supabase,
      user.id,
      "sponsorship_analysis",
      sponsorship?.id || null,
      tokensUsed,
      model
    );

    // 10. 분석 완료 이메일 알림 (fire-and-forget — 응답 지연 방지)
    void notifyAnalysisComplete(
      supabase,
      user.id,
      "sponsorship",
      `${analysis.brand.name}${analysis.brand.product ? ` (${analysis.brand.product})` : ""} 협찬 DM 분석이 완료됐어요.`
    );

    // 11. 응답
    return NextResponse.json({
      analysis,
      checklist,
      sponsorshipId: sponsorship?.id || null,
      remaining: usage.remaining - 1,
      duplicateBrand,
    });
  } catch (error) {
    console.error("협찬 분석 에러:", error);

    // Anthropic API 에러 구분
    const message =
      error instanceof Error && error.message.includes("rate_limit")
        ? "AI 서비스가 일시적으로 바쁩니다. 잠시 후 다시 시도해주세요."
        : "분석 중 오류가 발생했습니다. 다시 시도해주세요.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
