"use client";

import { useState } from "react";

interface CheckoutButtonProps {
  plan: string;
  highlighted: boolean;
  isLoggedIn: boolean;
}

export function CheckoutButton({
  plan,
  highlighted,
  isLoggedIn,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    if (!isLoggedIn) {
      window.location.href = `/signup?redirect=/pricing`;
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "결제 페이지를 열 수 없습니다.");
      }
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCheckout}
      disabled={loading}
      className={`mt-8 block w-full rounded-lg py-2.5 text-center text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        highlighted
          ? "bg-indigo-600 text-white hover:bg-indigo-500"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
    >
      {loading ? "처리 중..." : isLoggedIn ? "구독하기" : "무료로 시작"}
    </button>
  );
}
