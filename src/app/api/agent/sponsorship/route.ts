import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/supabase-server";
import { analyzeSponsorshipDM } from "@/lib/agents/sponsorship-analyzer";
import { generateChecklist } from "@/lib/agents/content-generator";
import { checkUsageLimit, recordUsage } from "@/lib/db/usage";

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

    // 4. 유저 컨텍스트 구성
    const userContext = {
      instagramHandle: user.user_metadata?.instagram_handle || "",
      followerCount: user.user_metadata?.follower_count || 0,
      categories: user.user_metadata?.categories || [],
    };

    // 5. 오케스트레이터 → Sonnet 분석 실행
    const { analysis, tokensUsed, model } = await analyzeSponsorshipDM(
      trimmed,
      userContext
    );

    // 6. 체크리스트 생성
    const checklist = generateChecklist(analysis);

    // 7. sponsorships 테이블에 저장
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

    // 8. agent_usage에 사용량 기록
    await recordUsage(
      supabase,
      user.id,
      "sponsorship_analysis",
      sponsorship?.id || null,
      tokensUsed,
      model
    );

    // 9. 응답
    return NextResponse.json({
      analysis,
      checklist,
      sponsorshipId: sponsorship?.id || null,
      remaining: usage.remaining - 1,
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
