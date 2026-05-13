import { SupabaseClient } from "@supabase/supabase-js";
import type { UsageCheckResult } from "@/lib/types/sponsorship";

// 플랜별 에이전트 실행 한도
const PLAN_LIMITS: Record<string, number> = {
  free_trial: 10,
  starter: 100,
  growth: 500,
  business: 2000,
};

// 플랜별 한국어 이름
const PLAN_NAMES: Record<string, string> = {
  free_trial: "무료 체험",
  starter: "스타터",
  growth: "그로스",
  business: "비즈니스",
};

// 다음 플랜 추천
const UPGRADE_PATH: Record<string, string> = {
  free_trial: "starter",
  starter: "growth",
  growth: "business",
};

// 사용량 제한 초과 시 안내 메시지 생성
function buildLimitMessage(plan: string, isTrialExpired: boolean): string {
  if (isTrialExpired) {
    return [
      "무료 체험 기간이 종료되었어요.",
      "그동안 만드신 협찬 분석과 콘텐츠는 그대로 보관되어 있습니다.",
      "",
      "스타터 플랜(월 3.9만원)으로 업그레이드하시면",
      "매달 100회까지 AI 에이전트를 사용할 수 있어요.",
    ].join("\n");
  }

  const currentName = PLAN_NAMES[plan] || plan;
  const nextPlan = UPGRADE_PATH[plan];

  if (!nextPlan) {
    // 비즈니스 플랜 (최상위)
    return [
      `${currentName} 플랜의 이번 달 사용량을 모두 소진했어요.`,
      "다음 달 1일에 사용량이 초기화됩니다.",
      "",
      "추가 사용이 필요하시면 contact@chaechaedaddy.com으로 문의해주세요.",
    ].join("\n");
  }

  const nextName = PLAN_NAMES[nextPlan];
  const nextLimit = PLAN_LIMITS[nextPlan];

  return [
    `${currentName} 플랜의 이번 달 사용량을 모두 소진했어요.`,
    "",
    `${nextName} 플랜으로 업그레이드하시면`,
    `매달 ${nextLimit.toLocaleString()}회까지 사용할 수 있어요.`,
  ].join("\n");
}

// 현재 사용량 기간의 시작 시점
// free_trial: 트라이얼 시작일 / 유료 플랜: 이번 달 1일
export function getUsagePeriodStart(
  plan: string,
  trialEndsAt: string | null | undefined
): string {
  if (plan === "free_trial") {
    const trialEnd = trialEndsAt ? new Date(trialEndsAt) : new Date();
    const trialStart = new Date(trialEnd);
    trialStart.setDate(trialStart.getDate() - 7);
    return trialStart.toISOString();
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export function getPlanLimit(plan: string): number {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free_trial;
}

// 에이전트 사용량 체크
export async function checkUsageLimit(
  supabase: SupabaseClient,
  userId: string
): Promise<UsageCheckResult> {
  // 유저 플랜 조회
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, trial_ends_at")
    .eq("id", userId)
    .single();

  const plan = profile?.plan || "free_trial";
  const limit = getPlanLimit(plan);

  // 트라이얼 만료 체크
  if (plan === "free_trial" && profile?.trial_ends_at) {
    const trialEnd = new Date(profile.trial_ends_at);
    if (new Date() > trialEnd) {
      return {
        allowed: false,
        remaining: 0,
        limit,
        used: limit,
        plan,
        message: buildLimitMessage(plan, true),
      };
    }
  }

  const periodStart = getUsagePeriodStart(plan, profile?.trial_ends_at);

  const { count } = await supabase
    .from("agent_usage")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", periodStart);

  const used = count || 0;
  const remaining = Math.max(0, limit - used);

  if (remaining <= 0) {
    return {
      allowed: false,
      remaining: 0,
      limit,
      used,
      plan,
      message: buildLimitMessage(plan, false),
    };
  }

  return { allowed: true, remaining, limit, used, plan };
}

// 에이전트 사용량 기록
export async function recordUsage(
  supabase: SupabaseClient,
  userId: string,
  type: "sponsorship_analysis" | "content_generation",
  sponsorshipId: string | null,
  tokensUsed: number,
  model: string
): Promise<void> {
  await supabase.from("agent_usage").insert({
    user_id: userId,
    type,
    sponsorship_id: sponsorshipId,
    tokens_used: tokensUsed,
    model,
  });
}
