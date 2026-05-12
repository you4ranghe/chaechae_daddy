// 해시태그 전략 분석 에이전트 (Phase 1에서 포팅)
// model: claude-sonnet-4-6 (비용 최적화)
// 카테고리별 해시태그 전략 분석 + 15개 추천

import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-4-6";

export interface HashtagRecommendation {
  tag: string;
  tier: "large" | "medium" | "niche";
  estimatedPosts: string;
  reason: string;
}

export interface HashtagAnalysisResult {
  category: string;
  strategy: string;
  recommendations: HashtagRecommendation[];
  tips: string[];
}

interface HashtagResult {
  analysis: HashtagAnalysisResult;
  tokensUsed: number;
  model: string;
}

const SYSTEM_PROMPT = `당신은 인스타그램 해시태그 전략 전문가입니다.

반드시 아래 JSON 형식으로만 응답하세요:
{
  "strategy": "해시태그 전략 요약 (1~2문장)",
  "recommendations": [
    { "tag": "#해시태그", "tier": "large|medium|niche", "estimatedPosts": "예상 게시물 수", "reason": "추천 이유 1문장" }
  ],
  "tips": ["팁1", "팁2", "팁3"]
}

규칙:
- recommendations에 정확히 15개: large 5개(100만+), medium 5개(10만~100만), niche 5개(1만~10만)
- 해시태그는 # 기호로 시작
- 한국어 해시태그 위주, 영어는 브랜드명이나 범용 태그만
- tips는 정확히 3개의 실용적 팁`;

export async function analyzeHashtags(
  category: string,
  userMessage: string,
  additionalInstructions?: string
): Promise<HashtagResult> {
  const anthropic = new Anthropic();

  let fullMessage = `"${category}" 카테고리의 인스타그램 해시태그를 분석하고 추천해주세요.`;
  if (userMessage) fullMessage += `\n\n사용자 요청: ${userMessage}`;
  if (additionalInstructions) fullMessage += `\n\n추가 지시: ${additionalInstructions}`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: fullMessage }],
  });

  const tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("해시태그 에이전트가 텍스트 응답을 반환하지 않았습니다.");
  }

  let jsonText = textBlock.text.trim();
  const codeMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeMatch) jsonText = codeMatch[1].trim();

  const rawMatch = jsonText.match(/\{[\s\S]*\}/);
  if (!rawMatch) throw new Error("JSON 파싱 실패");

  const parsed: Omit<HashtagAnalysisResult, "category"> = JSON.parse(rawMatch[0]);

  return {
    analysis: { category, strategy: parsed.strategy, recommendations: parsed.recommendations, tips: parsed.tips ?? [] },
    tokensUsed,
    model: MODEL,
  };
}
