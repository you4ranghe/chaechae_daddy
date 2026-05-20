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
import { ContentGeneratingLoader } from "./content-generating-loader";
import { DownloadSponsorshipPdfButton } from "./download-sponsorship-pdf-button";
import { useAgentLimit } from "@/lib/agent-limit";

interface SponsorshipDetailProps {
  sponsorship: Sponsorship;
  latestContent: GeneratedContent | null;
  handle: string;
}

const STATUS_META: Record<
  Sponsorship["status"],
  { label: string; color: string; dot: string; gradient: string }
> = {
  pending: {
    label: "대기 중",
    color: "bg-amber-100 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
    gradient: "from-amber-300 to-orange-300",
  },
  accepted: {
    label: "진행 중",
    color: "bg-pink-100 text-pink-700 ring-pink-200",
    dot: "bg-pink-500",
    gradient: "from-pink-400 to-rose-400",
  },
  completed: {
    label: "완료",
    color: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
    gradient: "from-emerald-400 to-teal-400",
  },
  rejected: {
    label: "거절",
    color: "bg-rose-100 text-rose-700 ring-rose-200",
    dot: "bg-rose-500",
    gradient: "from-rose-300 to-pink-300",
  },
  analyzing: {
    label: "분석 중",
    color: "bg-gray-100 text-gray-600 ring-gray-200",
    dot: "bg-gray-400",
    gradient: "from-gray-300 to-gray-400",
  },
};

export function SponsorshipDetail({
  sponsorship,
  latestContent,
  handle,
}: SponsorshipDetailProps) {
  const router = useRouter();
  const { handleAgentLimitReached } = useAgentLimit();

  const [content, setContent] = useState<GeneratedContent | null>(latestContent);
  const [accepting, setAccepting] = useState(false);
  const [, setStreamingText] = useState("");
  const [error, setError] = useState("");

  const analysis = sponsorship.analysis;
  const checklist: ChecklistItem[] = sponsorship.checklist ?? [];
  const meta = STATUS_META[sponsorship.status];

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
        if (handleAgentLimitReached(res.status, data)) return;
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

      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setAccepting(false);
    }
  }

  const createdDate = new Date(sponsorship.created_at);
  const createdStr = `${createdDate.getFullYear()}.${String(createdDate.getMonth() + 1).padStart(2, "0")}.${String(createdDate.getDate()).padStart(2, "0")} ${String(createdDate.getHours()).padStart(2, "0")}:${String(createdDate.getMinutes()).padStart(2, "0")}`;

  // 마감 D-day
  let deadlineLabel: string | null = null;
  if (sponsorship.deadline && sponsorship.deadline !== "미정") {
    const d = new Date(sponsorship.deadline);
    if (!isNaN(d.getTime())) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diff < 0) deadlineLabel = "마감 지남";
      else if (diff === 0) deadlineLabel = "오늘 마감";
      else deadlineLabel = `D-${diff}`;
    }
  }

  return (
    <div className="space-y-5">
      {/* 뒤로가기 */}
      <Link
        href="/dashboard/sponsorships"
        className="group inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-pink-600"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="h-4 w-4 transition-transform group-hover:-translate-x-0.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        협찬 목록
      </Link>

      {/* 히어로 헤더 */}
      <section className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        {/* 상단 컬러 인디케이터 (상태별 그라데이션) */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${meta.gradient}`} />
        <div className="relative px-6 py-6 sm:px-7">
          <span
            aria-hidden
            className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-pink-100/50 blur-3xl"
          />
          <div className="relative flex items-start gap-4">
            {/* 브랜드 아바타 */}
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 text-base font-bold text-white shadow-md shadow-pink-500/30">
              {(sponsorship.brand_name || "?").slice(0, 2).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-bold text-gray-900 sm:text-[22px]">
                  {sponsorship.brand_name}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ring-inset ${meta.color}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                  {meta.label}
                </span>
                <div className="ml-auto">
                  <DownloadSponsorshipPdfButton
                    sponsorship={sponsorship}
                    content={content}
                    handle={handle}
                  />
                </div>
              </div>
              {sponsorship.product && (
                <p className="mt-1 truncate text-sm text-gray-600">
                  {sponsorship.product}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-gray-400">
                <span className="inline-flex items-center gap-1">
                  <ClockIcon className="h-3 w-3" />
                  {createdStr}
                </span>
                {deadlineLabel && (
                  <span className="inline-flex items-center gap-1 font-semibold text-rose-600">
                    <FlagIcon className="h-3 w-3" />
                    {deadlineLabel}
                  </span>
                )}
                {sponsorship.payment_amount > 0 && (
                  <span className="inline-flex items-center gap-1 font-semibold text-pink-600">
                    <WonIcon className="h-3 w-3" />₩{sponsorship.payment_amount.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 에러 */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-rose-50 px-4 py-3 ring-1 ring-inset ring-rose-100">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-500">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.706-1.442 1.146-2.034a.75.75 0 0 1 1.302.736l-1.014 1.798c.354.07.683.16.978.286.823.357 1.432.96 1.432 1.906 0 .896-.516 1.499-1.19 1.78-.291.121-.628.21-.996.262-.21.03-.434.052-.654.066V16.5a.75.75 0 0 1-1.5 0v-1.05c-.22-.014-.444-.036-.654-.066a4.815 4.815 0 0 1-.996-.262C8.516 14.84 8 14.237 8 13.34c0-.503.245-.949.624-1.272-.41-.087-.815-.215-1.186-.392-.737-.353-1.262-.86-1.262-1.62 0-.751.518-1.247 1.227-1.539.348-.142.74-.24 1.152-.302.246-.037.503-.063.764-.078V6.75a.75.75 0 0 1 1.5 0v.918Z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      )}

      {/* 분석 결과 */}
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

      {/* 콘텐츠 생성 중 */}
      <ContentGeneratingLoader active={accepting && !content} />

      {/* 생성된 콘텐츠 */}
      {content && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 shadow-sm">
              <PencilIcon className="h-3.5 w-3.5 text-white" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-gray-900">생성된 콘텐츠</h2>
              <p className="text-[11px] text-gray-500">캡션·해시태그·체크리스트를 한 번에</p>
            </div>
          </div>
          <ContentResult
            checklist={checklist}
            content={content}
            brandName={sponsorship.brand_name}
            sponsorshipId={sponsorship.id}
            analysis={analysis}
          />
        </section>
      )}

      {/* 상태 변경 액션 */}
      {sponsorship.status !== "completed" && sponsorship.status !== "rejected" && (
        <section className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 text-gray-600">
              <SwitchIcon className="h-3.5 w-3.5" />
            </span>
            <h3 className="text-sm font-semibold text-gray-900">상태 변경</h3>
          </div>
          <p className="mt-1 text-[11.5px] text-gray-500">
            협찬 진행 단계를 다음으로 넘겨보세요
          </p>
          <div className="mt-3">
            <StatusActions
              sponsorshipId={sponsorship.id}
              currentStatus={sponsorship.status}
            />
          </div>
        </section>
      )}
    </div>
  );
}

// ─── 아이콘 ────────────────────────────────
function ClockIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z" clipRule="evenodd" />
    </svg>
  );
}
function FlagIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M3 2.25a.75.75 0 0 1 .75.75v.54l1.838-.46a9.75 9.75 0 0 1 6.725.738l.108.054A8.25 8.25 0 0 0 18 4.524l3.11-.732a.75.75 0 0 1 .917.81 47.784 47.784 0 0 0 .005 10.337.75.75 0 0 1-.574.812l-3.114.733a9.75 9.75 0 0 1-6.594-.77l-.108-.054a8.25 8.25 0 0 0-5.69-.625l-2.202.55V21a.75.75 0 0 1-1.5 0V3A.75.75 0 0 1 3 2.25Z" clipRule="evenodd" />
    </svg>
  );
}
function WonIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M3.5 4h2.7l1.6 6.5L9.4 4h2.6l1.6 6.5L15.2 4h2.7l-3 11h-2.6l-1.5-6-1.5 6H6.7L3.5 4Z" />
    </svg>
  );
}
function PencilIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32L19.513 8.2Z" />
    </svg>
  );
}
function SwitchIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M15.97 2.47a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 1 1-1.06-1.06l3.22-3.22H7.5a.75.75 0 0 1 0-1.5h11.69l-3.22-3.22a.75.75 0 0 1 0-1.06Zm-7.94 9a.75.75 0 0 1 0 1.06l-3.22 3.22H16.5a.75.75 0 0 1 0 1.5H4.81l3.22 3.22a.75.75 0 1 1-1.06 1.06l-4.5-4.5a.75.75 0 0 1 0-1.06l4.5-4.5a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
    </svg>
  );
}
