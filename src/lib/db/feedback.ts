import type { SupabaseClient } from "@supabase/supabase-js";

export type PerformanceContext = {
  highPerformers: Array<{
    caption: string;
    likes: number;
    comments: number;
    engagementRate: number;
    notes: string;
  }>;
  lowPerformers: Array<{
    caption: string;
    likes: number;
    comments: number;
    engagementRate: number;
    notes: string;
  }>;
  avgEngagementRate: number;
  sampleSize: number;
};

// 콘텐츠 생성 시점에 과거 성과를 가져와 컨텍스트로 만들기.
// 상위 3개 / 하위 2개를 캡션 길이 제한해서 LLM에 넘김.
export async function fetchPerformanceContext(
  supabase: SupabaseClient,
  userId: string,
): Promise<PerformanceContext | null> {
  const { data } = await supabase
    .from("post_performance")
    .select(`
      likes, comments, reach, impressions, user_notes,
      generated_contents (caption)
    `)
    .eq("user_id", userId)
    .gt("reach", 0)
    .order("posted_at", { ascending: false })
    .limit(30);

  const rows = (data || []) as Array<{
    likes: number;
    comments: number;
    reach: number;
    impressions: number;
    user_notes: string;
    generated_contents: { caption?: string } | null;
  }>;

  if (rows.length < 3) return null;

  const enriched = rows
    .filter((r) => r.generated_contents?.caption)
    .map((r) => {
      const denom = r.reach || r.impressions || 1;
      const engagementRate = ((r.likes + r.comments) / denom) * 100;
      return {
        caption: (r.generated_contents?.caption || "").slice(0, 280),
        likes: r.likes,
        comments: r.comments,
        engagementRate,
        notes: r.user_notes,
      };
    })
    .sort((a, b) => b.engagementRate - a.engagementRate);

  if (enriched.length < 3) return null;

  const avg = enriched.reduce((s, p) => s + p.engagementRate, 0) / enriched.length;

  return {
    highPerformers: enriched.slice(0, 3),
    lowPerformers: enriched.slice(-2).reverse(),
    avgEngagementRate: avg,
    sampleSize: enriched.length,
  };
}

export function performanceContextToPrompt(ctx: PerformanceContext): string {
  const formatPerformer = (p: PerformanceContext["highPerformers"][number]): string =>
    `- 인게이지먼트 ${p.engagementRate.toFixed(1)}% (좋아요 ${p.likes}, 댓글 ${p.comments})\n  캡션 발췌: "${p.caption}"${p.notes ? `\n  메모: ${p.notes}` : ""}`;

  return `[과거 포스팅 성과 데이터 — ${ctx.sampleSize}건 기준, 평균 인게이지먼트 ${ctx.avgEngagementRate.toFixed(1)}%]

성과 좋은 포스팅 톱 3:
${ctx.highPerformers.map(formatPerformer).join("\n\n")}

성과 낮았던 포스팅:
${ctx.lowPerformers.map(formatPerformer).join("\n\n")}

위 데이터를 참고해서, 성과 좋은 톤·구조·키워드를 살리고 성과 낮았던 패턴은 피해 주세요.`;
}
