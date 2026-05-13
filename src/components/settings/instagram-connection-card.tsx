"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface InstagramConnectionCardProps {
  connection: {
    ig_username: string;
    last_synced_at: string | null;
    token_expires_at: string | null;
  } | null;
  errorParam: string | null;
  connectedParam: boolean;
  integrationReady: boolean;
}

export function InstagramConnectionCard({ connection, errorParam, connectedParam, integrationReady }: InstagramConnectionCardProps) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    connectedParam ? { type: "success", text: "인스타 계정이 연결됐어요!" }
    : errorParam ? { type: "error", text: errorMessage(errorParam) }
    : null,
  );

  async function handleSync() {
    setSyncing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/instagram/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "동기화 실패" });
        return;
      }
      setMessage({ type: "success", text: `팔로워 ${data.insights.followers.toLocaleString()}명으로 업데이트됐어요.` });
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "네트워크 오류" });
    } finally {
      setSyncing(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm("연결을 해제하시겠어요?")) return;
    setDisconnecting(true);
    try {
      await fetch("/api/instagram/sync", { method: "DELETE" });
      router.refresh();
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">인스타그램 연동</h2>
          <p className="mt-1 text-xs text-gray-400">
            팔로워 수, 게시물 인사이트, DM을 자동으로 동기화해요
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
          connection ? "bg-emerald-100 text-emerald-700"
          : !integrationReady ? "bg-amber-100 text-amber-700"
          : "bg-gray-100 text-gray-500"
        }`}>
          {connection ? "연결됨" : !integrationReady ? "준비 중" : "미연결"}
        </span>
      </div>

      {message && (
        <div className={`mt-4 rounded-lg px-3 py-2 text-xs ${
          message.type === "success"
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : "bg-red-50 text-red-600 border border-red-200"
        }`}>
          {message.text}
        </div>
      )}

      {connection ? (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">계정</span>
            <span className="font-medium text-gray-900">@{connection.ig_username || "(이름 없음)"}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">마지막 동기화</span>
            <span className="text-gray-900">
              {connection.last_synced_at
                ? new Date(connection.last_synced_at).toLocaleString("ko-KR")
                : "아직 없음"}
            </span>
          </div>
          {connection.token_expires_at && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">토큰 만료</span>
              <span className="text-gray-900">
                {new Date(connection.token_expires_at).toLocaleDateString("ko-KR")}
              </span>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {syncing ? "동기화 중…" : "지금 동기화"}
            </button>
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              연결 해제
            </button>
          </div>
        </div>
      ) : !integrationReady ? (
        <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
          Instagram 연동은 Meta Developer App 승인이 필요해 준비 중이에요. 승인이 완료되면 여기서 바로 연결할 수 있어요.
        </div>
      ) : (
        <a
          href="/api/instagram/connect"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
          </svg>
          인스타그램 비즈니스 계정 연결
        </a>
      )}
    </div>
  );
}

function errorMessage(error: string): string {
  switch (error) {
    case "no_business_account":
      return "비즈니스/크리에이터 계정을 페이스북 페이지와 연결한 뒤 다시 시도해 주세요.";
    case "invalid_state":
      return "세션이 만료됐어요. 다시 시도해 주세요.";
    case "oauth_failed":
      return "Meta 인증에 실패했어요. 잠시 후 다시 시도해 주세요.";
    case "no_code":
      return "인증이 취소됐어요.";
    default:
      return `연결 실패 (${error})`;
  }
}
