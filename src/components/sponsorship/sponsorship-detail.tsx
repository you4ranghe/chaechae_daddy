"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type {
  Sponsorship,
  GeneratedContent,
  ChecklistItem,
} from "@/lib/types/sponsorship";
import { AnalysisResult } from "./analysis-result";
import { ContentResult } from "./content-result";
import { StatusActions } from "./status-actions";
import { handleAgentLimitReached } from "@/lib/agent-limit";

interface SponsorshipDetailProps {
  sponsorship: Sponsorship;
  latestContent: GeneratedContent | null;
}

export function SponsorshipDetail({
  sponsorship,
  latestContent,
}: SponsorshipDetailProps) {
  const router = useRouter();

  const [content, setContent] = useState<GeneratedContent | null>(latestContent);
  const [accepting, setAccepting] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [error, setError] = useState("");

  const analysis = sponsorship.analysis;
  const checklist: ChecklistItem[] = sponsorship.checklist ?? [];

  async function handleGenerateContent() {
    if (!analysis) return;

    setError("");
    setStreamingText("");
    setAccepting(true);

    try {
      const res = await fetch("/api/agent/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sponsorshipId: sponsorship.id,
          analysis,
          checklist,
          stream: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (handleAgentLimitReached(res.status, data, router)) return;
        setError(data.error || "콘텐츠 생성에 실패했습니다.");
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("스트림을 읽을 수 없습니다.");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "text_delta") {
              setStreamingText((prev) => prev + data.text);
            } else if (data.type === "done" && data.content) {
              setContent(data.content);
              setStreamingText("");
            } else if (data.type === "error") {
              setError(data.error);
            }
          } catch {
            // 부분 JSON 무시
          }
        }
      }

      // 서버에서 sponsorship.status를 accepted로 업데이트했을 수 있어 새로고침
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setAccepting(false);
    }
  }

  const statusLabel =
    sponsorship.status === "pending"
      ? "대기"
      : sponsorship.status === "accepted"
        ? "진행 중"
        : sponsorship.status === "completed"
          ? "완료"
          : sponsorship.status === "rejected"
            ? "거절"
            : sponsorship.status;

  const statusColor =
    sponsorship.status === "pending"
      ? "bg-amber-100 text-amber-700"
      : sponsorship.status === "accepted"
        ? "bg-indigo-100 text-indigo-700"
        : sponsorship.status === "completed"
          ? "bg-emerald-100 text-emerald-700"
          : "bg-gray-100 text-gray-600";

  return (
    <div>
      {/* 상단 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/dashboard/sponsorships"
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          ← 협찬 목록
        </Link>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          {sponsorship.brand_name}
        </h1>
        {sponsorship.product && (
          <p className="mt-0.5 text-sm text-gray-500">{sponsorship.product}</p>
        )}
        <p className="mt-1 text-xs text-gray-400">
          {new Date(sponsorship.created_at).toLocaleString("ko-KR")}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* 분석 결과 — pending이고 콘텐츠 없을 때만 수락 CTA 표시 */}
      {analysis && (
        <AnalysisResult
          analysis={analysis}
          checklist={checklist}
          onAccept={
            !content && sponsorship.status !== "rejected"
              ? handleGenerateContent
              : undefined
          }
          accepting={accepting}
        />
      )}

      {/* 스트리밍 중 */}
      {accepting && streamingText && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <svg
              className="h-5 w-5 animate-spin text-indigo-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <h3 className="text-sm font-medium text-indigo-600">
              AI가 콘텐츠를 생성하고 있어요...
            </h3>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {streamingText}
            </p>
            <span className="inline-block w-1.5 h-4 bg-indigo-500 animate-pulse ml-0.5 align-text-bottom" />
          </div>
        </div>
      )}

      {/* 생성된 콘텐츠 */}
      {content && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-700">생성된 콘텐츠</h3>
          <ContentResult checklist={checklist} content={content} />
        </div>
      )}

      {/* 상태 전환 액션 */}
      {sponsorship.status !== "completed" && sponsorship.status !== "rejected" && (
        <div className="mt-8 border-t border-gray-100 pt-6">
          <h3 className="text-sm font-medium text-gray-500">상태 변경</h3>
          <div className="mt-3">
            <StatusActions
              sponsorshipId={sponsorship.id}
              currentStatus={sponsorship.status}
            />
          </div>
        </div>
      )}
    </div>
  );
}
