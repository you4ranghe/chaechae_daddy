"use client";

import { useState } from "react";
import { useModal } from "@/components/ui/alert-modal";

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
  const { showAlert } = useModal();

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
        showAlert({ emoji: "💳", title: "결제 오류", message: data.error || "결제 페이지를 열 수 없습니다.\n잠시 후 다시 시도해주세요.", variant: "error" });
      }
    } catch {
      showAlert({ emoji: "🌐", title: "네트워크 오류", message: "네트워크 연결을 확인하고\n다시 시도해주세요.", variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCheckout}
      disabled={loading}
      className={`group mt-7 flex w-full items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
        highlighted
          ? "bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg shadow-pink-500/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-pink-500/30 disabled:hover:translate-y-0"
          : "bg-gray-900 text-white hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-md disabled:hover:translate-y-0"
      }`}
    >
      {loading ? (
        <>
          <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          처리 중…
        </>
      ) : (
        <>
          {isLoggedIn ? "구독하기" : "무료로 시작하기"}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="h-4 w-4 transition-transform group-hover:translate-x-0.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </>
      )}
    </button>
  );
}
