import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/supabase-server";
import { generateContent, type ContentTone } from "@/lib/agents/content-planner";
import { checkUsageLimit, recordUsage } from "@/lib/db/usage";
import { fetchPerformanceContext, performanceContextToPrompt } from "@/lib/db/feedback";
import { buildPersonaContext, type ChildInfo } from "@/lib/persona/child-context";
import type { SponsorshipAnalysis, ChecklistItem, GeneratedContent } from "@/lib/types/sponsorship";

const TONES: ContentTone[] = ["friendly", "professional", "emotional"];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    // 사용량: 3개 톤이라 3회 차감
    const usage = await checkUsageLimit(supabase, user.id);
    if (!usage.allowed) {
      return NextResponse.json(
        { error: usage.message, remaining: 0, plan: usage.plan, limit: usage.limit },
        { status: 429 },
      );
    }
    if (usage.remaining < TONES.length) {
      return NextResponse.json(
        {
          error: `A/B 변형은 ${TONES.length}회 분량이 필요해요. 남은 ${usage.remaining}회로는 부족합니다.`,
          remaining: usage.remaining,
        },
        { status: 429 },
      );
    }

    const body = await request.json();
    const { sponsorshipId, analysis, checklist } = body as {
      sponsorshipId: string | null;
      analysis: SponsorshipAnalysis;
      checklist: ChecklistItem[];
    };
    if (!analysis || !checklist) {
      return NextResponse.json(
        { error: "분석 데이터와 체크리스트가 필요합니다." },
        { status: 400 },
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("instagram_handle, categories, child_info, persona_bio")
      .eq("id", user.id)
      .single();

    const perfCtx = await fetchPerformanceContext(supabase, user.id);
    const performanceContext = perfCtx ? performanceContextToPrompt(perfCtx) : undefined;
    const personaContext = buildPersonaContext({
      child: (profile?.child_info as ChildInfo | null) || null,
      personaBio: (profile?.persona_bio as string | null) || null,
    });

    const baseCtx = {
      instagramHandle: profile?.instagram_handle || user.user_metadata?.instagram_handle || "",
      categories: profile?.categories || user.user_metadata?.categories || [],
      performanceContext,
      personaContext,
    };

    // 3톤 병렬 호출
    const results = await Promise.allSettled(
      TONES.map((tone) =>
        generateContent(analysis, checklist, { ...baseCtx, tone }),
      ),
    );

    const variants: { tone: ContentTone; content: GeneratedContent | null; error?: string }[] = [];
    let totalTokens = 0;
    let modelUsed = "";

    for (let i = 0; i < TONES.length; i++) {
      const res = results[i];
      if (res.status === "fulfilled") {
        variants.push({ tone: TONES[i], content: res.value.content });
        totalTokens += res.value.tokensUsed;
        modelUsed = res.value.model;
      } else {
        variants.push({
          tone: TONES[i],
          content: null,
          error: res.reason instanceof Error ? res.reason.message : "생성 실패",
        });
      }
    }

    const successCount = variants.filter((v) => v.content).length;
    if (successCount === 0) {
      return NextResponse.json(
        { error: "모든 변형 생성에 실패했어요. 잠시 후 다시 시도해주세요." },
        { status: 500 },
      );
    }

    // 사용량 기록: 성공한 만큼만 차감
    for (let i = 0; i < successCount; i++) {
      await recordUsage(
        supabase,
        user.id,
        "content_generation",
        sponsorshipId,
        Math.round(totalTokens / Math.max(1, successCount)),
        modelUsed,
      );
    }

    return NextResponse.json({
      variants,
      remaining: usage.remaining - successCount,
    });
  } catch (error) {
    console.error("A/B 변형 생성 에러:", error);
    return NextResponse.json(
      { error: "변형 생성 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
