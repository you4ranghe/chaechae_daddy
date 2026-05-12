// 주간 콘텐츠 플래너 에이전트 (Phase 1 content-planner에서 포팅)
// model: claude-sonnet-4-6 + Tool Use (trending-analyzer)
// 키워드 기반 월~일 7일치 콘텐츠 플랜 생성

import Anthropic from "@anthropic-ai/sdk";
import {
  trendingTopicsToolDef,
  competitorThemesToolDef,
  executeTrendingTopics,
  executeCompetitorThemes,
  type TrendingTopicsInput,
  type CompetitorThemesInput,
} from "@/lib/tools/trending-analyzer";

const MODEL = "claude-sonnet-4-6";
const MAX_TOOL_ROUNDS = 8;

export interface DailyPlan {
  day: string;
  topic: string;
  angle: string;
  caption: string;
  hashtags: string[];
  bestTime: string;
  contentType: "릴스" | "캐러셀" | "단일이미지";
}

export interface WeeklyPlanResult {
  keywords: string;
  weeklyPlan: DailyPlan[];
}

interface PlannerResult {
  plan: WeeklyPlanResult;
  tokensUsed: number;
  model: string;
}

const TOOL_REGISTRY: Record<string, (input: unknown) => string> = {
  get_trending_topics: (input) => executeTrendingTopics(input as TrendingTopicsInput),
  get_competitor_themes: (input) => executeCompetitorThemes(input as CompetitorThemesInput),
};

const tools: Anthropic.Tool[] = [trendingTopicsToolDef, competitorThemesToolDef];

const SYSTEM_PROMPT = `당신은 인스타그램 콘텐츠 전략 전문가이자 주간 플래너입니다.

═══ 페르소나 ═══
- 채원이 엄마 (첫째맘), 6개월 아기
- 팔로워 약 2천명, 육아일기 + 아기용품 리뷰 + 이유식 + 육아팁
- 톤: 친근하고 공감가는 선배맘. "~했어요", "~이에요" 체.

═══ 콘텐츠 믹스 (주간) ═══
- 릴스 2~3개 (도달률 극대화)
- 캐러셀 2~3개 (저장률 극대화, 정보형)
- 단일이미지 1~2개 (감성, 좋아요 위주)

═══ 업로드 시간 ═══
- 평일: 오전 9~10시, 오후 1~2시, 저녁 9~10시
- 주말: 오전 10~11시, 오후 8~9시
- 릴스는 저녁, 정보형 캐러셀은 오전~점심

═══ 도구 사용 ═══
1. get_trending_topics로 트렌드 확인
2. get_competitor_themes로 경쟁 패턴 분석
3. 결과 기반 차별화된 7일 플랜 생성

═══ 출력 (JSON만) ═══
{
  "weeklyPlan": [
    {
      "day": "월",
      "topic": "주제",
      "angle": "차별화 포인트 1문장",
      "caption": "캡션 전문 (줄바꿈: \\n, 2000자 이내)",
      "hashtags": ["#해시태그1", ...] (15~30개),
      "bestTime": "추천 업로드 시간",
      "contentType": "릴스|캐러셀|단일이미지"
    }
  ]
}

규칙: weeklyPlan 정확히 7개 (월~일), hashtags 15~30개 #으로 시작`;

export async function generateWeeklyPlan(keywords: string): Promise<PlannerResult> {
  const anthropic = new Anthropic();
  let totalTokens = 0;

  const userMessage = `이번 주 키워드: "${keywords}"

위 키워드로 채원이 엄마 인스타그램의 월~일 7일치 주간 콘텐츠 플랜을 만들어주세요.
먼저 트렌딩 주제와 경쟁 계정 패턴을 분석한 후 차별화된 플랜을 생성해주세요.`;

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userMessage },
  ];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      tools,
      messages,
    });

    totalTokens += (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

    if (response.stop_reason === "end_turn") {
      const textBlock = response.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("텍스트 응답이 없습니다.");
      }

      let jsonText = textBlock.text.trim();
      const codeMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeMatch) jsonText = codeMatch[1].trim();

      const rawMatch = jsonText.match(/\{[\s\S]*\}/);
      if (!rawMatch) throw new Error("JSON 파싱 실패");

      const parsed: { weeklyPlan: DailyPlan[] } = JSON.parse(rawMatch[0]);

      if (!Array.isArray(parsed.weeklyPlan) || parsed.weeklyPlan.length === 0) {
        throw new Error("응답에 유효한 weeklyPlan이 없습니다.");
      }

      return { plan: { keywords, weeklyPlan: parsed.weeklyPlan }, tokensUsed: totalTokens, model: MODEL };
    }

    // Tool Use 처리
    messages.push({ role: "assistant", content: response.content });

    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );

    if (toolUseBlocks.length === 0) {
      throw new Error(`예상치 못한 stop_reason: ${response.stop_reason}`);
    }

    const toolResults: Anthropic.ToolResultBlockParam[] = toolUseBlocks.map((block) => {
      const handler = TOOL_REGISTRY[block.name];
      if (!handler) {
        return { type: "tool_result" as const, tool_use_id: block.id, content: JSON.stringify({ error: `알 수 없는 도구: ${block.name}` }), is_error: true };
      }
      try {
        return { type: "tool_result" as const, tool_use_id: block.id, content: handler(block.input) };
      } catch (err) {
        return { type: "tool_result" as const, tool_use_id: block.id, content: JSON.stringify({ error: err instanceof Error ? err.message : "도구 실행 오류" }), is_error: true };
      }
    });

    messages.push({ role: "user", content: toolResults });
  }

  throw new Error(`도구 호출이 ${MAX_TOOL_ROUNDS}회를 초과했습니다.`);
}
