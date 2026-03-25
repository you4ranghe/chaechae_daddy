import Anthropic from "@anthropic-ai/sdk";

// 오케스트레이터: Opus가 사용자 요청을 판단하고 서브에이전트를 라우팅
// 비용 최적화 — Opus는 짧은 판단만 (max_tokens: 512), 실제 생성은 Sonnet이 수행

export type SubAgent = "sponsorship" | "content";

export interface OrchestratorDecision {
  agent: SubAgent;
  params: {
    category: string;
    userMessage: string;
    additionalInstructions?: string;
  };
  reasoning: string;
}

const ORCHESTRATOR_SYSTEM = `당신은 협찬 관리 AI 시스템의 오케스트레이터입니다.
사용자의 요청을 분석하여 어떤 서브에이전트를 호출할지 결정합니다.

[사용 가능한 에이전트]
1. "sponsorship" — 협찬 DM 분석 에이전트
   - 협찬 DM/메시지 분석, 브랜드 정보 추출, 조건 평가, 추천 점수, 응답 초안 생성
   - 키워드: DM, 협찬 제안, 브랜드, 제품 리뷰, 원고료, 제품 협찬

2. "content" — 협찬 콘텐츠 생성 에이전트
   - 인스타그램 캡션, 해시태그, 콘텐츠 플랜 생성
   - 키워드: 캡션, 해시태그, 포스팅, 콘텐츠 생성, 글쓰기

[판단 규칙]
- 협찬 DM을 붙여넣거나 "분석해줘"라고 하면 → "sponsorship"
- 캡션/해시태그/콘텐츠 생성 요청이면 → "content"
- 애매한 경우 입력 텍스트가 DM 형식(브랜드 담당자 톤)이면 → "sponsorship"
- 분석 결과를 기반으로 콘텐츠를 만들어달라는 요청이면 → "content"

반드시 아래 JSON 형식만 출력하세요. 다른 텍스트는 포함하지 마세요:
{
  "agent": "sponsorship" 또는 "content",
  "params": {
    "category": "추론된 카테고리 (육아, 뷰티, 푸드 등)",
    "userMessage": "사용자 원본 메시지 요약",
    "additionalInstructions": "서브에이전트에게 전달할 추가 지시사항 (선택)"
  },
  "reasoning": "이 에이전트를 선택한 이유 한 줄"
}`;

export async function orchestrate(
  input: string,
  userContext: {
    instagramHandle: string;
    followerCount?: number;
    categories: string[];
  }
): Promise<OrchestratorDecision> {
  const anthropic = new Anthropic();

  const contextStr = [
    `인플루언서: @${userContext.instagramHandle}`,
    userContext.followerCount
      ? `팔로워: ${userContext.followerCount.toLocaleString()}명`
      : null,
    `카테고리: ${userContext.categories.join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n");

  const message = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 512,
    system: ORCHESTRATOR_SYSTEM,
    messages: [
      {
        role: "user",
        content: `인플루언서 정보:\n${contextStr}\n\n사용자 입력:\n${input}`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("오케스트레이터 응답 파싱 실패");
  }

  return JSON.parse(jsonMatch[0]) as OrchestratorDecision;
}
