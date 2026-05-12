import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/supabase-server";
import { generateWeeklyPlan } from "@/lib/agents/weekly-planner";
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
    const { keywords } = body as { keywords: string };

    if (!keywords || typeof keywords !== "string" || keywords.trim().length < 2) {
      return NextResponse.json(
        { error: "키워드를 2자 이상 입력해주세요. (예: 이유식 시작, 6개월 발달)" },
        { status: 400 }
      );
    }

    // 4. 주간 플랜 생성
    const { plan, tokensUsed, model } = await generateWeeklyPlan(keywords.trim());

    // 5. 사용량 기록
    await recordUsage(supabase, user.id, "content_generation", null, tokensUsed, model);

    // 6. 이메일 알림 (fire-and-forget)
    void notifyAnalysisComplete(
      supabase,
      user.id,
      "content_plan",
      `"${keywords.trim()}" 키워드로 주간 콘텐츠 플랜이 생성됐어요.`
    );

    return NextResponse.json({ plan, remaining: usage.remaining - 1 });
  } catch (error) {
    console.error("콘텐츠 플랜 생성 에러:", error);
    const message = error instanceof Error && error.message.includes("rate_limit")
      ? "AI 서비스가 일시적으로 바쁩니다. 잠시 후 다시 시도해주세요."
      : "콘텐츠 플랜 생성 중 오류가 발생했습니다. 다시 시도해주세요.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
