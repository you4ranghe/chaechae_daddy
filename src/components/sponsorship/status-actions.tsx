"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Sponsorship } from "@/lib/types/sponsorship";

type Status = Sponsorship["status"];

const NEXT_ACTIONS: Record<Status, { status: Status; label: string; tone: "primary" | "success" | "danger" | "neutral" }[]> = {
  pending: [
    { status: "accepted", label: "수락", tone: "primary" },
    { status: "rejected", label: "거절", tone: "danger" },
  ],
  accepted: [
    { status: "completed", label: "완료 처리", tone: "success" },
    { status: "rejected", label: "취소", tone: "neutral" },
  ],
  rejected: [
    { status: "pending", label: "복구", tone: "neutral" },
  ],
  completed: [
    { status: "accepted", label: "되돌리기", tone: "neutral" },
  ],
  analyzing: [],
};

const TONE_CLASSES: Record<string, string> = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-500",
  success: "bg-emerald-600 text-white hover:bg-emerald-500",
  danger: "border border-red-200 text-red-600 hover:bg-red-50",
  neutral: "border border-gray-200 text-gray-600 hover:bg-gray-50",
};

interface StatusActionsProps {
  sponsorshipId: string;
  currentStatus: Status;
}

export function StatusActions({ sponsorshipId, currentStatus }: StatusActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<Status | null>(null);
  const [error, setError] = useState("");
  const [completeModal, setCompleteModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");

  const actions = NEXT_ACTIONS[currentStatus] || [];

  async function changeStatus(nextStatus: Status, payment?: number) {
    setLoading(nextStatus);
    setError("");
    try {
      const res = await fetch(`/api/sponsorship/${sponsorshipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          paymentAmount: payment,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "상태 변경 실패");
        return;
      }
      setCompleteModal(false);
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했어요");
    } finally {
      setLoading(null);
    }
  }

  function handleClick(nextStatus: Status) {
    if (nextStatus === "completed") {
      setCompleteModal(true);
      return;
    }
    changeStatus(nextStatus);
  }

  if (actions.length === 0) return null;

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <div className="flex flex-wrap items-center gap-2">
        {actions.map((action) => {
          const isLoading = loading === action.status;
          return (
            <button
              key={action.status}
              type="button"
              onClick={() => handleClick(action.status)}
              disabled={loading !== null}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${TONE_CLASSES[action.tone]}`}
            >
              {isLoading ? "처리 중…" : action.label}
            </button>
          );
        })}
      </div>
      {error && (
        <p className="mt-2 text-xs text-red-500">{error}</p>
      )}

      {completeModal && (
        <CompleteModal
          onCancel={() => setCompleteModal(false)}
          onConfirm={(amount) => changeStatus("completed", amount)}
          paymentAmount={paymentAmount}
          setPaymentAmount={setPaymentAmount}
          loading={loading === "completed"}
        />
      )}
    </div>
  );
}

function CompleteModal({
  onCancel,
  onConfirm,
  paymentAmount,
  setPaymentAmount,
  loading,
}: {
  onCancel: () => void;
  onConfirm: (amount: number) => void;
  paymentAmount: string;
  setPaymentAmount: (v: string) => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-gray-900">협찬 완료 처리</h3>
        <p className="mt-1 text-sm text-gray-500">
          최종 지급 받은 원고료를 입력해 주세요. 인사이트에 반영돼요.
        </p>
        <div className="mt-4">
          <label className="block text-xs text-gray-500">원고료 (₩)</label>
          <input
            type="number"
            min="0"
            step="1000"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            placeholder="100000"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
            autoFocus
          />
          <p className="mt-1 text-[10px] text-gray-400">무상 협찬이면 0으로 두세요.</p>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => onConfirm(parseInt(paymentAmount) || 0)}
            disabled={loading}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading ? "처리 중…" : "완료 처리"}
          </button>
        </div>
      </div>
    </div>
  );
}
