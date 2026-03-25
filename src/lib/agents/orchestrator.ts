import Anthropic from "@anthropic-ai/sdk";
import type { OrchestratorDecision } from "@/lib/types/sponsorship";

// 오케스트레이터: Opus가 태스크를 판단하고 서브에이전트(Sonnet)에게 전달할 프롬프트를 구성
// 비용 최적화 — Opus는 짧은 판단만, 실제 생성은 Sonnet이 수행

const ORCHESTRATOR_SYSTEM = `당신은 협찬 관리 AI 시스템의 오케스트레이터입니다.
사용자의 요청을 분석하여 서브에이전트에게 전달할 최적의 프롬프트를 구성합니다.

반드시 아래 JSON 형식만 출력하세요:
{
  "taskType": "simple_analysis | complex_analysis | content_generation",
  "model": "claude-sonnet-4-6",
  "reasoning": "이 태스크를 왜 이렇게 분류했는지 한 줄 설명",
  "systemPrompt": "서브에이전트에게 전달할 시스템 프롬프트 전체",
  "userPrompt": "서브에이전트에게 전달할 유저 프롬프트 전체"
}

판단 기준:
- simple_analysis: 명확한 조건이 있는 단순 협찬 DM (브랜드, 금액, 요구사항이 명시됨)
- complex_analysis: 모호하거나 복잡한 협찬 제안 (조건이 불분명, 여러 옵션, 장기 계약 등)
- content_generation: 캡션/해시태그 생성 요청

중요:
- 시스템 프롬프트에는 반드시 JSON 출력 형식을 명시하세요
- 유저의 인플루언서 정보를 유저 프롬프트에 포함하세요
- 콘텐츠 생성 시 한국 광고 표시 규정(#광고 #협찬)을 시스템 프롬프트에 반드시 포함하세요`;

export async function orchestrate(
  task: "analyze" | "generate_content",
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
    max_tokens: 1500,
    messages: [
      {
        role: "user",
        content: `태스크: ${task}\n\n인플루언서 정보:\n${contextStr}\n\n입력:\n${input}`,
      },
    ],
    system: ORCHESTRATOR_SYSTEM,
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("오케스트레이터 응답 파싱 실패");
  }

  return JSON.parse(jsonMatch[0]) as OrchestratorDecision;
}

// Opus 호출 없이 직접 프롬프트를 구성하는 경량 모드
// (비용 절감 — 패턴이 명확한 경우 오케스트레이터를 건너뜀)
export function buildAnalysisPrompts(
  dmContent: string,
  userContext: {
    instagramHandle: string;
    followerCount: number;
    categories: string[];
  }
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `당신은 인스타그램 인플루언서의 협찬 DM을 분석하는 전문가입니다.
협찬 DM 내용을 받으면 아래 JSON 형식으로 정확히 분석해주세요.

반드시 아래 JSON 형식만 출력하세요. 다른 텍스트는 포함하지 마세요.

{
  "brand": {
    "name": "브랜드명",
    "product": "제품/서비스명",
    "industry": "업종 (뷰티, 육아, 패션, 푸드, 라이프스타일 등)"
  },
  "conditions": {
    "type": "무상 또는 유상 또는 혼합",
    "payment": "금액 또는 제품 제공 내용 (숫자가 있으면 원 단위 정수로 표시)",
    "requirements": ["요구사항1", "요구사항2"],
    "deadline": "마감일 (없으면 '미정')"
  },
  "score": {
    "value": 7,
    "recommendation": "수락 또는 협상 또는 거절",
    "reasoning": "추천 이유 설명"
  },
  "pros": ["장점1", "장점2"],
  "cons": ["단점1", "단점2"],
  "responses": {
    "accept": "수락 응답 초안 (정중하고 프로페셔널하게, DM 톤)",
    "negotiate": "협상 응답 초안 (구체적 조건 제시, DM 톤)",
    "reject": "거절 응답 초안 (정중하게 거절, DM 톤)"
  }
}

분석 기준:
- 팔로워 대비 적절한 보상인지 평가 (팔로워 1,000명당 1~3만원이 시장 평균)
- 브랜드 신뢰도와 인플루언서 카테고리 적합성
- 요구사항의 합리성 (포스팅 수, 기간, 수정 횟수 등)
- 숨겨진 조건이나 주의사항 식별
- 응답 초안은 인스타그램 DM 톤으로 자연스럽게`;

  const userPrompt = `인플루언서 정보:
- 인스타그램: @${userContext.instagramHandle}
- 팔로워: ${userContext.followerCount.toLocaleString()}명
- 카테고리: ${userContext.categories.join(", ")}

협찬 DM 내용:
${dmContent}`;

  return { systemPrompt, userPrompt };
}

export function buildContentPrompts(
  analysisInput: string,
  userContext: {
    instagramHandle: string;
    categories: string[];
  }
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `당신은 인스타그램 인플루언서의 협찬 콘텐츠를 만드는 전문 카피라이터입니다.

광고주 요구사항을 기반으로 인스타그램 캡션과 해시태그를 생성합니다.

[한국 광고 표시 규정 — 반드시 준수]
- 공정거래위원회 「추천·보증 등에 관한 표시·광고 심사지침」에 따라
  경제적 대가를 받은 게시물은 반드시 광고임을 명시해야 합니다.
- 캡션 첫 줄 또는 잘 보이는 위치에 #광고 #협찬 을 삽입하세요.
- 브랜드로부터 제품/금전을 제공받았음을 자연스럽게 언급하세요.
- 해시태그에도 #광고 #협찬 #sponsored 중 하나 이상 포함하세요.

[캡션 작성 규칙]
1. 첫 줄에 #광고 표시 + 자연스러운 인트로
2. 제품/서비스 사용 경험을 일상 톤으로 서술
3. 광고주 요구사항(태그, 멘션, 키워드 등)을 자연스럽게 녹여내기
4. 너무 광고 같은 과장 표현 지양
5. 인플루언서 카테고리에 맞는 문체 사용
6. CTA(Call to Action)를 자연스럽게 포함

[해시태그 규칙]
- 정확히 30개 생성
- 구성: #광고 #협찬 + 브랜드 관련 5~8개 + 카테고리 관련 10~15개 + 일반 인기태그 나머지
- 한국어 해시태그 위주, 영어는 브랜드명이나 범용 태그만

반드시 아래 JSON 형식만 출력하세요:
{
  "caption": "캡션 전체 내용 (줄바꿈은 \\n으로)",
  "hashtags": ["광고", "협찬", "해시태그3", ... (총 30개)]
}`;

  const userPrompt = `인플루언서: @${userContext.instagramHandle}
카테고리: ${userContext.categories.join(", ")}

${analysisInput}

위 정보를 기반으로 인스타그램 캡션과 해시태그 30개를 생성해주세요.`;

  return { systemPrompt, userPrompt };
}
