import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

// 에이전트 API의 429 응답을 만나면 안내 후 /pricing으로 이동
// 반환값: 429 응답을 처리했다면 true (호출자는 후속 로직 중단)
export function handleAgentLimitReached(
  status: number,
  body: { error?: string },
  router: AppRouterInstance
): boolean {
  if (status !== 429) return false;

  const message = body.error || "이번 기간의 에이전트 사용량을 모두 소진했어요.";
  if (typeof window === "undefined") return true;

  const proceed = window.confirm(`${message}\n\n요금제 페이지로 이동할까요?`);
  if (proceed) {
    router.push("/pricing");
  }
  return true;
}
