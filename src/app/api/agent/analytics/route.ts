import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/supabase-server";
import { analyzeWeeklyPerformance } from "@/lib/agents/analytics-agent";
import type { WeeklyInsightInput } from "@/lib/agents/analytics-agent";
import { checkUsageLimit, recordUsage } from "@/lib/db/usage";
import { notifyAnalysisComplete } from "@/lib/email/notify";

const PAGE_SIZE = 5;

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");

  if (mode === "trend") {
    const { data, error } = await supabase
      .from("analytics_reports")
      .select("id, report, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(500);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    type TrendRow = { id: string; report: { competitiveness?: { overallScore?: number; engagementRate?: string } } | null; created_at: string };
    const items = ((data ?? []) as TrendRow[]).map((r) => {
      const score = r.report?.competitiveness?.overallScore;
      const engRaw = r.report?.competitiveness?.engagementRate;
      const eng = typeof engRaw === "string" ? parseFloat(engRaw.replace(/[^0-9.\-]/g, "")) : 0;
      return {
        id: r.id,
        createdAt: r.created_at,
        overallScore: typeof score === "number" ? score : 0,
        engagementRate: Number.isFinite(eng) ? eng : 0,
      };
    });

    return NextResponse.json({ items });
  }

  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, count, error } = await supabase
    .from("analytics_reports")
    .select("id, report, created_at", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    items: data ?? [],
    page,
    pageSize: PAGE_SIZE,
    total: count ?? 0,
    hasMore: (count ?? 0) > page * PAGE_SIZE,
  });
}

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

    // 5. 결과를 analytics_reports 히스토리에 저장
    const { data: saved } = await supabase
      .from("analytics_reports")
      .insert({
        user_id: user.id,
        input,
        report,
        tokens_used: tokensUsed,
        model,
      })
      .select("id, created_at")
      .single();

    // 6. 사용량 기록
    await recordUsage(supabase, user.id, "sponsorship_analysis", null, tokensUsed, model);

    // 7. 이메일 알림 (fire-and-forget)
    void notifyAnalysisComplete(
      supabase,
      user.id,
      "analytics",
      "지난 주 성과 분석 리포트가 준비됐어요."
    );

    return NextResponse.json({
      report,
      id: saved?.id ?? null,
      createdAt: saved?.created_at ?? null,
      remaining: usage.remaining - 1,
    });
  } catch (error) {
    console.error("성과 분석 에러:", error);
    const message = error instanceof Error && error.message.includes("rate_limit")
      ? "AI 서비스가 일시적으로 바쁩니다. 잠시 후 다시 시도해주세요."
      : "분석 중 오류가 발생했습니다. 다시 시도해주세요.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
