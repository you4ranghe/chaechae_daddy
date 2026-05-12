import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/supabase-server";
import { analyzeWeeklyPerformance } from "@/lib/agents/analytics-agent";
import type { WeeklyInsightInput } from "@/lib/agents/analytics-agent";
import { checkUsageLimit, recordUsage } from "@/lib/db/usage";
import { notifyAnalysisComplete } from "@/lib/email/notify";

export async function POST(request: NextRequest) {
  try {
    // 1. 인증 체크
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    // 2. 사용량 제한 체크
    const usage = await checkUsageLimit(supabase, user.id);
    if (!usage.allowed) {
      return NextResponse.json(
        { error: usage.message, remaining: 0, plan: usage.plan, limit: usage.limit },
        { status: 429 }
      );
    }

    // 3. 입력 검증
    const body = await request.json();
    const input = body as WeeklyInsightInput;

    if (!input.followers || !Array.isArray(input.posts) || input.posts.length === 0) {
      return NextResponse.json(
        { error: "팔로워 수와 게시물 성과 데이터를 입력해주세요." },
        { status: 400 }
      );
    }

    // 4. 분석 실행
    const { report, tokensUsed, model } = await analyzeWeeklyPerformance(input);

    // 5. 사용량 기록
    await recordUsage(supabase, user.id, "sponsorship_analysis", null, tokensUsed, model);

    // 6. 이메일 알림 (fire-and-forget)
    void notifyAnalysisComplete(
      supabase,
      user.id,
      "analytics",
      "지난 주 성과 분석 리포트가 준비됐어요."
    );

    return NextResponse.json({ report, remaining: usage.remaining - 1 });
  } catch (error) {
    console.error("성과 분석 에러:", error);
    const message = error instanceof Error && error.message.includes("rate_limit")
      ? "AI 서비스가 일시적으로 바쁩니다. 잠시 후 다시 시도해주세요."
      : "분석 중 오류가 발생했습니다. 다시 시도해주세요.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
