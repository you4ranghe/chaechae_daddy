import Anthropic from "@anthropic-ai/sdk";
import type { SponsorshipAnalysis } from "@/lib/types/sponsorship";
import { orchestrate } from "./orchestrator";

// 협찬 DM 분석 에이전트
// model: claude-sonnet-4-6 (비용 최적화)
// DM 길이 500자 이상이면 Opus 오케스트레이터가 먼저 판단

const COMPLEXITY_THRESHOLD = 500;
const MODEL = "claude-sonnet-4-6";

const ANALYSIS_SYSTEM = `당신은 인스타그램 마이크로 인플루언서의 협찬 DM을 분석하는 전문가입니다.

[분석 대상 인플루언서 프로필]
- 팔로워 규모: 약 2,000명 수준의 마이크로 인플루언서
- 주요 카테고리: 육아 (6개월 아기맘)
- 특성: 팔로워 수는 적지만 참여율이 높고, 진정성 있는 리뷰로 팬층이 탄탄함

[육아용품 카테고리별 협찬 시세 기준 (팔로워 2,000명 기준)]
- 분유/이유식: 제품 제공 + 원고료 3~5만원
- 기저귀/물티슈: 제품 제공만 (소모품이므로 대량 제공이 보상)
- 유아 의류/잡화: 제품 제공 + 원고료 2~3만원
- 유모차/카시트 (고가): 대여 또는 제품 제공 (원고료 없이도 가치 높음)
- 장난감/교구: 제품 제공 + 원고료 2~5만원
- 스킨케어/바디워시: 제품 제공 + 원고료 3~5만원
- 육아 서비스/앱: 1~3개월 무료 이용권 + 원고료 3~5만원

[독소조항 감지 — 반드시 체크]
다음 항목이 DM에 포함되어 있으면 cons(단점)에 명시하고 score를 감점하세요:
1. 과도한 수정 요구: "수정 무제한", "광고주 최종 승인 필수" 등
2. 부정 리뷰 금지: "긍정적인 내용만", "단점 언급 금지" 등
3. 과도한 콘텐츠 요구: 피드 2회 이상 + 스토리 + 릴스 등 (팔로워 대비 과다)
4. 저작권 양도: "콘텐츠 2차 활용 무제한", "광고 소재로 사용" 등
5. 위약금/패널티 조항: "미이행 시 제품 비용 청구" 등
6. 비현실적 기한: 제품 수령 후 2~3일 내 포스팅 등
7. 경쟁사 제한: "3개월간 동종 협찬 금지" 등

[점수 기준]
- 8~10점: 조건이 좋고 독소조항 없음 → 수락 추천
- 5~7점: 조건이 보통이거나 협상 여지 있음 → 협상 추천
- 1~4점: 조건이 불합리하거나 독소조항 있음 → 거절 추천

반드시 아래 JSON 형식만 출력하세요. 다른 텍스트는 포함하지 마세요:
{
  "brand": {
    "name": "브랜드명",
    "product": "제품/서비스명",
    "industry": "업종 (육아, 뷰티, 패션, 푸드, 라이프스타일 등)"
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
    "reasoning": "추천 이유 상세 설명"
  },
  "pros": ["장점1", "장점2"],
  "cons": ["단점1 (독소조항이면 '⚠️ 독소조항:' 접두사 붙이기)", "단점2"],
  "responses": {
    "accept": "수락 응답 초안 (정중하고 프로페셔널하게, DM 톤으로 자연스럽게)",
    "negotiate": "협상 응답 초안 (구체적 조건 제시, 예: 원고료 인상, 수정 횟수 제한 등)",
    "reject": "거절 응답 초안 (정중하게 거절하면서 아쉬움 표현)"
  }
}

[분석 시 유의사항]
- 팔로워 2,000명 기준으로 보상의 적절성을 평가하세요
- 브랜드 신뢰도와 인플루언서 카테고리(육아) 적합성 반영
- 요구사항의 합리성 (포스팅 수, 기간, 수정 횟수 등)
- 숨겨진 조건이나 주의사항 식별
- 응답 초안은 인스타그램 DM 톤으로 자연스럽게 작성
- 협상 응답에는 반드시 구체적인 대안 조건을 제시하세요`;

interface AnalysisResult {
  analysis: SponsorshipAnalysis;
  tokensUsed: number;
  model: string;
}

export async function analyzeSponsorshipDM(
  dmContent: string,
  userContext: {
    instagramHandle: string;
    followerCount: number;
    categories: string[];
    personaContext?: string;
  }
): Promise<AnalysisResult> {
  const anthropic = new Anthropic();
  let totalTokens = 0;

  // 복잡한 DM → Opus 오케스트레이터가 먼저 판단
  if (dmContent.length > COMPLEXITY_THRESHOLD) {
    try {
      const decision = await orchestrate(dmContent, userContext);
      // 오케스트레이터가 content 에이전트를 추천해도, 여기서는 분석만 수행
      totalTokens += 300; // 오케스트레이터 토큰 추정
    } catch {
      // 오케스트레이터 실패 시 직접 진행
    }
  }

  const userPrompt = `인플루언서 정보:
- 인스타그램: @${userContext.instagramHandle}
- 팔로워: ${userContext.followerCount.toLocaleString()}명
- 카테고리: ${userContext.categories.join(", ")}
${userContext.personaContext || ""}
협찬 DM 내용:
${dmContent}`;

  // Sonnet으로 실제 분석 실행
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2500,
    system: ANALYSIS_SYSTEM,
    messages: [{ role: "user", content: userPrompt }],
  });

  totalTokens +=
    (message.usage?.input_tokens || 0) + (message.usage?.output_tokens || 0);

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("AI 응답에서 분석 결과를 파싱할 수 없습니다.");
  }

  const analysis: SponsorshipAnalysis = JSON.parse(jsonMatch[0]);

  return {
    analysis,
    tokensUsed: totalTokens,
    model: MODEL,
  };
}
