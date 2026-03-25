import Anthropic from "@anthropic-ai/sdk";
import type { SponsorshipAnalysis } from "@/lib/types/sponsorship";
import { orchestrate, buildAnalysisPrompts } from "./orchestrator";

// DM 길이로 복잡도 판단 — 짧은 DM은 오케스트레이터 건너뛰기 (비용 최적화)
const COMPLEXITY_THRESHOLD = 500;

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
  }
): Promise<AnalysisResult> {
  const anthropic = new Anthropic();
  let systemPrompt: string;
  let userPrompt: string;
  let totalTokens = 0;
  const executionModel = "claude-sonnet-4-6";

  if (dmContent.length > COMPLEXITY_THRESHOLD) {
    // 복잡한 DM → Opus 오케스트레이터가 프롬프트 최적화
    try {
      const decision = await orchestrate("analyze", dmContent, userContext);
      systemPrompt = decision.systemPrompt;
      userPrompt = decision.userPrompt;
      // 오케스트레이터 토큰은 대략 추정 (실제로는 response.usage에서 가져올 수 있지만 여기서는 간소화)
      totalTokens += 500;
    } catch {
      // 오케스트레이터 실패 시 직접 프롬프트로 폴백
      const prompts = buildAnalysisPrompts(dmContent, userContext);
      systemPrompt = prompts.systemPrompt;
      userPrompt = prompts.userPrompt;
    }
  } else {
    // 단순 DM → 오케스트레이터 건너뛰고 직접 실행 (비용 절감)
    const prompts = buildAnalysisPrompts(dmContent, userContext);
    systemPrompt = prompts.systemPrompt;
    userPrompt = prompts.userPrompt;
  }

  // Sonnet으로 실제 분석 실행
  const message = await anthropic.messages.create({
    model: executionModel,
    max_tokens: 2500,
    messages: [{ role: "user", content: userPrompt }],
    system: systemPrompt,
  });

  totalTokens += (message.usage?.input_tokens || 0) + (message.usage?.output_tokens || 0);

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
    model: executionModel,
  };
}
