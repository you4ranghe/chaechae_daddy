// 주간 성과 분석 에이전트 (Phase 1에서 포팅)
// model: claude-sonnet-4-6 (비용 최적화)
// 수동 입력된 인스타 인사이트 → 성과 리포트 생성

import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-4-6";

export interface PostMetric {
  title: string;
  contentType: "릴스" | "캐러셀" | "단일이미지" | "스토리";
  likes: number;
  comments: number;
  saves: number;
  reach: number;
}

export interface WeeklyInsightInput {
  followers: number;
  followerChange: number;
  profileVisits: number;
  storyViews: number;
  posts: PostMetric[];
}

export interface AnalyticsReport {
  summary: { highlights: string[]; improvements: string[] };
  topPostAnalysis: { postTitle: string; whyItWorked: string; replicateStrategy: string };
  nextWeekStrategy: { contentMix: string; focusTopics: string[]; captionTips: string; hashtagAdvice: string };
  bestTimes: { weekday: string; weekend: string; reasoning: string };
  competitiveness: {
    overallScore: number;
    engagementRate: string;
    engagementVerdict: string;
    reachEfficiency: string;
    saveRate: string;
    growthRate: string;
    tier: string;
  };
}

interface AnalyticsResult {
  report: AnalyticsReport;
  tokensUsed: number;
  model: string;
}

const SYSTEM_PROMPT = `당신은 인스타그램 마이크로 인플루언서 성과 분석 전문가입니다.

═══ 분석 기준 (팔로워 2천명 규모 벤치마크) ═══
1. 참여율: (좋아요+댓글+저장)/팔로워×100. 8%↑ 우수, 5~8% 양호, 3~5% 개선, 3%↓ 위험
2. 도달률: 도달/팔로워×100. 60%↑ 우수, 40~60% 양호, 20~40% 개선, 20%↓ 위험
3. 저장률: 저장/도달×100. 5%↑ 우수, 3~5% 양호, 1~3% 개선, 1%↓ 위험
4. 주간 성장률: +1% 이상 건강, 0.5~1% 보통, 0.5% 미만 정체

═══ 경쟁력 점수 (1~100) ═══
90~100: 상위 5% | 75~89: 상위 20% | 60~74: 평균 이상 | 40~59: 평균 | 40 미만: 개선 필요

═══ 톤 ═══ 데이터 기반이되 따뜻하게. 격려 위주. "왜"와 "어떻게"에 집중.

반드시 아래 JSON 형식으로만 응답하세요:
{
  "summary": { "highlights": ["잘된 점1", "잘된 점2", "잘된 점3"], "improvements": ["개선할 점1", "개선할 점2"] },
  "topPostAnalysis": { "postTitle": "최고 성과 게시물", "whyItWorked": "분석 2~3문장", "replicateStrategy": "반복 전략 2~3문장" },
  "nextWeekStrategy": { "contentMix": "릴스 3, 캐러셀 2, 단일 2", "focusTopics": ["주제1", "주제2", "주제3"], "captionTips": "1~2문장", "hashtagAdvice": "1~2문장" },
  "bestTimes": { "weekday": "평일 추천 시간", "weekend": "주말 추천 시간", "reasoning": "이유 1~2문장" },
  "competitiveness": { "overallScore": 75, "engagementRate": "6.5%", "engagementVerdict": "1문장", "reachEfficiency": "1문장", "saveRate": "1문장", "growthRate": "1문장", "tier": "상위 20%" }
}`;

export async function analyzeWeeklyPerformance(
  input: WeeklyInsightInput
): Promise<AnalyticsResult> {
  const anthropic = new Anthropic();

  const totalLikes = input.posts.reduce((s, p) => s + p.likes, 0);
  const totalComments = input.posts.reduce((s, p) => s + p.comments, 0);
  const totalSaves = input.posts.reduce((s, p) => s + p.saves, 0);
  const totalReach = input.posts.reduce((s, p) => s + p.reach, 0);
  const postCount = input.posts.length;

  const avgEngagement = postCount > 0
    ? ((totalLikes + totalComments + totalSaves) / postCount / input.followers * 100).toFixed(2) : "0";
  const avgReachRate = postCount > 0 && input.followers > 0
    ? ((totalReach / postCount) / input.followers * 100).toFixed(1) : "0";
  const avgSaveRate = totalReach > 0 ? (totalSaves / totalReach * 100).toFixed(2) : "0";
  const growthRate = input.followers > 0 ? (input.followerChange / input.followers * 100).toFixed(2) : "0";

  const bestPost = input.posts.length > 0
    ? [...input.posts].sort((a, b) => b.likes + b.comments + b.saves - (a.likes + a.comments + a.saves))[0]
    : null;

  const userMessage = `아래 주간 인사이트 데이터를 분석해주세요.

═══ 기본 정보 ═══
- 팔로워: ${input.followers.toLocaleString()}명 (증감: ${input.followerChange >= 0 ? "+" : ""}${input.followerChange}명)
- 프로필 방문: ${input.profileVisits.toLocaleString()}회
- 스토리 평균 조회: ${input.storyViews.toLocaleString()}회

═══ 계산 지표 ═══
- 참여율: ${avgEngagement}% | 도달률: ${avgReachRate}% | 저장률: ${avgSaveRate}% | 성장률: ${growthRate}%

═══ 게시물별 성과 (${postCount}개) ═══
${input.posts.map((p, i) =>
  `${i + 1}. "${p.title}" (${p.contentType}) — 좋아요:${p.likes} 댓글:${p.comments} 저장:${p.saves} 도달:${p.reach.toLocaleString()}`
).join("\n")}
${bestPost ? `\n최고 성과: "${bestPost.title}" (${bestPost.contentType})` : ""}`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("텍스트 응답이 없습니다.");
  }

  let jsonText = textBlock.text.trim();
  const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonText = jsonMatch[1].trim();

  const rawMatch = jsonText.match(/\{[\s\S]*\}/);
  if (!rawMatch) throw new Error("JSON 파싱 실패");

  const report: AnalyticsReport = JSON.parse(rawMatch[0]);

  return { report, tokensUsed, model: MODEL };
}
