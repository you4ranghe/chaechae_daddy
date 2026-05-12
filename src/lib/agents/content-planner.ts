import Anthropic from "@anthropic-ai/sdk";
import type {
  ChecklistItem,
  GeneratedContent,
  SponsorshipAnalysis,
} from "@/lib/types/sponsorship";

// 협찬 콘텐츠 생성 에이전트
// model: claude-sonnet-4-6 (비용 최적화)
// 페르소나: 6개월 아기 채원이 엄마, 첫째맘

const MODEL = "claude-sonnet-4-6";

const CONTENT_SYSTEM = `당신은 인스타그램 육아 인플루언서의 협찬 콘텐츠를 만드는 전문 카피라이터입니다.

[인플루언서 페르소나]
- 6개월 아기 "채원이" 엄마 (첫째맘)
- 톤: 친근하고 공감가는 선배맘 느낌
- 말투: "~했어요", "~더라고요", "~인 것 같아요" (편안한 존댓말)
- 특징: 솔직한 사용 후기, 일상 속 자연스러운 제품 노출
- 팔로워: 약 2,000명의 마이크로 인플루언서
- 진정성 있는 리뷰로 팬층이 탄탄함

[한국 광고 표시 규정 — 반드시 준수]
- 공정거래위원회 「추천·보증 등에 관한 표시·광고 심사지침」에 따라
  경제적 대가를 받은 게시물은 반드시 광고임을 명시해야 합니다
- 캡션 첫 줄 또는 잘 보이는 위치에 #광고 #협찬 을 삽입하세요
- 브랜드로부터 제품/금전을 제공받았음을 자연스럽게 언급하세요
- 해시태그에도 #광고 #협찬 중 하나 이상 포함하세요

[캡션 작성 규칙]
1. 첫 줄에 #광고 표시 + 자연스러운 인트로 (예: "#광고 요즘 채원이가 빠진 것...🍼")
2. 채원이와의 일상 에피소드를 녹여 제품/서비스 사용 경험 서술
3. 엄마로서의 고민 → 제품 발견 → 사용 후기 스토리라인
4. 광고주 요구사항(태그, 멘션, 키워드 등)을 자연스럽게 녹여내기
5. 과장 표현 지양 — 솔직한 장단점 언급이 오히려 신뢰감 부여
6. CTA는 자연스럽게 (예: "궁금한 거 있으면 DM 주세요~")
7. 줄바꿈을 적절히 활용해 가독성 확보

[해시태그 규칙]
- 정확히 30개 생성
- 구성: #광고 + #협찬 + 브랜드 관련(5~8개) + 육아 카테고리(10~15개) + 일반 인기태그(나머지)
- 한국어 해시태그 위주, 영어는 브랜드명이나 범용 태그만
- 트렌디한 육아 해시태그 포함 (예: #신생아맘, #아기스타그램, #육아템추천 등)

[콘텐츠 타입 판단]
- 제품 리뷰: 실제 사용 후기 중심 → "product_review"
- 언박싱: 제품 개봉/첫 사용 → "unboxing"
- 일상 속 노출: 자연스러운 일상 사진과 함께 → "lifestyle"
- 비교/추천: 여러 제품 비교나 TOP 리스트 → "recommendation"
- 이벤트/체험: 체험단, 이벤트 참여 → "event"

반드시 아래 JSON 형식만 출력하세요:
{
  "caption": "캡션 전체 내용 (줄바꿈은 \\n으로)",
  "hashtags": ["광고", "협찬", "해시태그3", ... (총 30개)],
  "contentType": "product_review | unboxing | lifestyle | recommendation | event",
  "checklist": ["광고주 요구사항 기반 체크리스트 항목1", "항목2", ...],
  "adDisclosure": "#광고 #협찬 — 본 게시물은 브랜드명으로부터 제품/원고료를 제공받아 작성되었습니다."
}`;

// 분석 결과에서 체크리스트 자동 생성
export function generateChecklist(
  analysis: SponsorshipAnalysis
): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  let id = 1;

  // 광고 표시 의무 (법적 필수)
  items.push({
    id: String(id++),
    text: "#광고 #협찬 표시 삽입",
    checked: false,
  });

  // 브랜드 태그
  items.push({
    id: String(id++),
    text: `@${analysis.brand.name} 태그`,
    checked: false,
  });

  // 요구사항에서 체크리스트 추출
  for (const req of analysis.conditions.requirements) {
    items.push({
      id: String(id++),
      text: req,
      checked: false,
    });
  }

  // 마감일
  if (
    analysis.conditions.deadline &&
    analysis.conditions.deadline !== "미정"
  ) {
    items.push({
      id: String(id++),
      text: `마감일: ${analysis.conditions.deadline}까지 포스팅`,
      checked: false,
    });
  }

  return items;
}

// 콘텐츠 생성 입력 텍스트 구성
function buildContentInput(
  analysis: SponsorshipAnalysis,
  checklist: ChecklistItem[]
): string {
  return `브랜드: ${analysis.brand.name}
제품: ${analysis.brand.product}
업종: ${analysis.brand.industry}
보상: ${analysis.conditions.payment}

광고주 요구사항:
${analysis.conditions.requirements.map(function (r) { return `- ${r}`; }).join("\n")}

체크리스트:
${checklist.map(function (item) { return `- ${item.text}`; }).join("\n")}`;
}

// 일반 콘텐츠 생성 (JSON 응답)
interface ContentResult {
  content: GeneratedContent;
  tokensUsed: number;
  model: string;
}

export async function generateContent(
  analysis: SponsorshipAnalysis,
  checklist: ChecklistItem[],
  userContext: { instagramHandle: string; categories: string[]; performanceContext?: string }
): Promise<ContentResult> {
  const anthropic = new Anthropic();
  const input = buildContentInput(analysis, checklist);

  const userPrompt = `인플루언서: @${userContext.instagramHandle}
카테고리: ${userContext.categories.join(", ")}

${input}
${userContext.performanceContext ? `\n${userContext.performanceContext}\n` : ""}
위 정보를 기반으로 채원이 엄마 페르소나로 인스타그램 캡션과 해시태그 30개를 생성해주세요.
콘텐츠 타입도 판단하고, 광고 표시 문구도 포함해주세요.`;

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 3000,
    system: CONTENT_SYSTEM,
    messages: [{ role: "user", content: userPrompt }],
  });

  const tokensUsed =
    (message.usage?.input_tokens || 0) + (message.usage?.output_tokens || 0);

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("AI 응답에서 콘텐츠를 파싱할 수 없습니다.");
  }

  const content: GeneratedContent = JSON.parse(jsonMatch[0]);

  return { content, tokensUsed, model: MODEL };
}

// 스트리밍 콘텐츠 생성 — ReadableStream 반환
export function generateContentStream(
  analysis: SponsorshipAnalysis,
  checklist: ChecklistItem[],
  userContext: { instagramHandle: string; categories: string[]; performanceContext?: string }
): { stream: ReadableStream<Uint8Array>; model: string } {
  const input = buildContentInput(analysis, checklist);

  const userPrompt = `인플루언서: @${userContext.instagramHandle}
카테고리: ${userContext.categories.join(", ")}

${input}
${userContext.performanceContext ? `\n${userContext.performanceContext}\n` : ""}
위 정보를 기반으로 채원이 엄마 페르소나로 인스타그램 캡션과 해시태그 30개를 생성해주세요.
콘텐츠 타입도 판단하고, 광고 표시 문구도 포함해주세요.`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const anthropic = new Anthropic();

        const messageStream = anthropic.messages.stream({
          model: MODEL,
          max_tokens: 3000,
          system: CONTENT_SYSTEM,
          messages: [{ role: "user", content: userPrompt }],
        });

        // 스트리밍으로 텍스트 청크 전송
        messageStream.on("text", function (text) {
          const data = JSON.stringify({ type: "text_delta", text });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        });

        // 완료 시 최종 메시지
        const finalMessage = await messageStream.finalMessage();
        const tokensUsed =
          (finalMessage.usage?.input_tokens || 0) +
          (finalMessage.usage?.output_tokens || 0);

        const fullText =
          finalMessage.content[0].type === "text"
            ? finalMessage.content[0].text
            : "";

        // JSON 파싱 시도
        const jsonMatch = fullText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const content: GeneratedContent = JSON.parse(jsonMatch[0]);
          const doneData = JSON.stringify({
            type: "done",
            content,
            tokensUsed,
            model: MODEL,
          });
          controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));
        } else {
          const errorData = JSON.stringify({
            type: "error",
            error: "콘텐츠 파싱에 실패했습니다.",
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        }

        controller.close();
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "알 수 없는 오류";
        const errorData = JSON.stringify({ type: "error", error: errorMsg });
        controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        controller.close();
      }
    },
  });

  return { stream, model: MODEL };
}
