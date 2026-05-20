"use client";

import { useState } from "react";
import Link from "next/link";
import { useModal } from "@/components/ui/alert-modal";

const PLAN_NAMES: Record<string, string> = {
  free_trial: "무료 체험",
  starter: "스타터",
  growth: "그로스",
  business: "비즈니스",
};

interface SubscriptionCardProps {
  plan: string;
  hasStripeCustomer: boolean;
  trialEndsAt: string | null;
}

export function SubscriptionCard({
  plan,
  hasStripeCustomer,
  trialEndsAt,
}: SubscriptionCardProps) {
  const [loading, setLoading] = useState(false);
  const { showAlert } = useModal();
  const planName = PLAN_NAMES[plan] || plan;
  const isFreeTrial = plan === "free_trial";

  const trialDaysLeft = trialEndsAt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  async function handlePortal() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        showAlert({ emoji: "⚙️", title: "구독 관리 오류", message: data.error || "포털을 열 수 없습니다.\n잠시 후 다시 시도해주세요.", variant: "error" });
      }
    } catch {
      showAlert({ emoji: "🌐", title: "네트워크 오류", message: "네트워크 연결을 확인하고\n다시 시도해주세요.", variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">구독 관리</h2>

      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-500">현재 플랜</p>
          <p className="text-lg font-bold text-gray-900">{planName}</p>
        </div>

        {isFreeTrial && trialEndsAt && (
          <div
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              trialDaysLeft <= 2
                ? "bg-red-50 text-red-700"
                : "bg-pink-50 text-pink-700"
            }`}
          >
            {trialDaysLeft > 0
              ? `체험 ${trialDaysLeft}일 남음`
              : "체험 기간 만료"}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {isFreeTrial ? (
          <Link
            href="/pricing"
            className="rounded-lg bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-pink-500 transition-colors"
          >
            플랜 업그레이드
          </Link>
        ) : hasStripeCustomer ? (
          <button
            type="button"
            onClick={handlePortal}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {loading ? "로딩 중..." : "결제 관리"}
          </button>
        ) : null}

        {!isFreeTrial && (
          <Link
            href="/pricing"
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            플랜 변경
          </Link>
        )}
      </div>
    </div>
  );
}
