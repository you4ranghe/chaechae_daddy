"use client";

import { useModal } from "@/components/ui/alert-modal";

export function useAgentLimit() {
  const { showAlert } = useModal();

  function handleAgentLimitReached(status: number, body: { error?: string }): boolean {
    if (status !== 429) return false;
    showAlert({
      emoji: "🚫",
      title: "사용량 한도에 도달했어요",
      message: body.error || "이번 기간의 에이전트 사용량을 모두 소진했어요.",
      variant: "warning",
      action: { label: "플랜 업그레이드", href: "/pricing" },
    });
    return true;
  }

  return { handleAgentLimitReached };
}
