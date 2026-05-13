import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/supabase-server";
import { analyzeHashtags } from "@/lib/agents/hashtag-agent";
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
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, count, error } = await supabase
    .from("hashtag_analyses")
    .select("id, category, user_message, analysis, created_at", { count: "exact" })
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
    const { category, message: userMessage } = body as {
      category: string;
      message?: string;
    };

    if (!category || typeof category !== "string") {
      return NextResponse.json(
        { error: "카테고리를 입력해주세요." },
        { status: 400 }
      );
    }

    // 4. 해시태그 분석 실행
    const { analysis, tokensUsed, model } = await analyzeHashtags(
      category.trim(),
      userMessage || "",
    );

    // 5. 결과를 hashtag_analyses 히스토리에 저장
    const { data: saved } = await supabase
      .from("hashtag_analyses")
      .insert({
        user_id: user.id,
        category: category.trim(),
        user_message: userMessage || "",
        analysis,
        tokens_used: tokensUsed,
        model,
      })
      .select("id, created_at")
      .single();

    // 6. 사용량 기록
    await recordUsage(supabase, user.id, "content_generation", null, tokensUsed, model);

    // 7. 이메일 알림 (fire-and-forget)
    void notifyAnalysisComplete(
      supabase,
      user.id,
      "hashtag",
      `"${category.trim()}" 카테고리 해시태그 분석이 완료됐어요.`
    );

    return NextResponse.json({
      analysis,
      id: saved?.id ?? null,
      createdAt: saved?.created_at ?? null,
      remaining: usage.remaining - 1,
    });
  } catch (error) {
    console.error("해시태그 분석 에러:", error);
    const message = error instanceof Error && error.message.includes("rate_limit")
      ? "AI 서비스가 일시적으로 바쁩니다. 잠시 후 다시 시도해주세요."
      : "해시태그 분석 중 오류가 발생했습니다. 다시 시도해주세요.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
