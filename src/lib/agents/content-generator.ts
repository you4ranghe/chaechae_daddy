import Anthropic from "@anthropic-ai/sdk";
import type {
  ChecklistItem,
  GeneratedContent,
  SponsorshipAnalysis,
} from "@/lib/types/sponsorship";
import { buildContentPrompts } from "./orchestrator";

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
  if (analysis.conditions.deadline && analysis.conditions.deadline !== "미정") {
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
  userContext: { instagramHandle: string; categories: string[] }
): Promise<ContentResult> {
  const anthropic = new Anthropic();
  const executionModel = "claude-sonnet-4-6";

  const input = buildContentInput(analysis, checklist);
  const { systemPrompt, userPrompt } = buildContentPrompts(input, userContext);

  const message = await anthropic.messages.create({
    model: executionModel,
    max_tokens: 2500,
    messages: [{ role: "user", content: userPrompt }],
    system: systemPrompt,
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

  return { content, tokensUsed, model: executionModel };
}

// 스트리밍 콘텐츠 생성 — ReadableStream 반환
export function generateContentStream(
  analysis: SponsorshipAnalysis,
  checklist: ChecklistItem[],
  userContext: { instagramHandle: string; categories: string[] }
): { stream: ReadableStream<Uint8Array>; model: string } {
  const executionModel = "claude-sonnet-4-6";
  const input = buildContentInput(analysis, checklist);
  const { systemPrompt, userPrompt } = buildContentPrompts(input, userContext);

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const anthropic = new Anthropic();

        const messageStream = anthropic.messages.stream({
          model: executionModel,
          max_tokens: 2500,
          messages: [{ role: "user", content: userPrompt }],
          system: systemPrompt,
        });

        // 스트리밍으로 텍스트 청크 전송
        messageStream.on("text", function (text) {
          // SSE 형식으로 전송
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
            model: executionModel,
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

  return { stream, model: executionModel };
}
