"use client";

import Link from "next/link";
import type { Sponsorship } from "@/lib/types/sponsorship";

interface InProgressTabProps {
  sponsorships: Sponsorship[];
}

export function InProgressTab({ sponsorships }: InProgressTabProps) {
  if (sponsorships.length === 0) {
    return <EmptyState />;
  }

  return (
    <ul className="space-y-3">
      {sponsorships.map((sp) => (
        <li key={sp.id}>
          <ProgressCard sponsorship={sp} />
        </li>
      ))}
    </ul>
  );
}

// ──────────────────────────────────────────────
// 카드
// ──────────────────────────────────────────────

function ProgressCard({ sponsorship: sp }: { sponsorship: Sponsorship }) {
  const checklistItems = sp.checklist || [];
  const completedCount = checklistItems.filter((item) => item.checked).length;
  const totalCount = checklistItems.length;
  const progress =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // 마감일 계산 (deadline은 text 컬럼)
  let deadlineBadge: { label: string; tone: "rose" | "amber" | "gray" } | null = null;
  if (sp.deadline && sp.deadline !== "미정") {
    const deadline = new Date(sp.deadline);
    if (!isNaN(deadline.getTime())) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diff = Math.ceil(
        (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diff < 0) {
        deadlineBadge = { label: "마감 지남", tone: "rose" };
      } else if (diff === 0) {
        deadlineBadge = { label: "오늘 마감", tone: "rose" };
      } else if (diff <= 3) {
        deadlineBadge = { label: `D-${diff}`, tone: "rose" };
      } else if (diff <= 7) {
        deadlineBadge = { label: `D-${diff}`, tone: "amber" };
      } else {
        deadlineBadge = { label: `D-${diff}`, tone: "gray" };
      }
    }
  }

  const isPending = sp.status === "pending";

  return (
    <Link
      href={`/dashboard/sponsorships/${sp.id}`}
      className="group bezel bezel-hover block overflow-hidden transition-spring"
    >
      {/* 상단 컬러 인디케이터 */}
      <div
        className={`h-1 w-full ${
          isPending
            ? "bg-gradient-to-r from-amber-300 to-orange-300"
            : "bg-gradient-to-r from-pink-400 to-rose-400"
        }`}
      />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-bold text-gray-900">
                {sp.brand_name}
              </h3>
              <StatusBadge status={sp.status} />
              {deadlineBadge && (
                <DeadlinePill label={deadlineBadge.label} tone={deadlineBadge.tone} />
              )}
            </div>
            <p className="mt-1 truncate text-sm text-gray-500">
              {sp.product?.trim() || "제품 정보 없음"}
            </p>
          </div>
          <span className="flex-shrink-0 rounded-full bg-gray-50 p-2 text-gray-400 transition-colors group-hover:bg-pink-50 group-hover:text-pink-600">
            <ArrowRightIcon />
          </span>
        </div>

        {/* 체크리스트 진행률 */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-medium text-gray-500">
              <ChecklistIcon className="mr-1 inline h-3 w-3 align-text-bottom text-gray-400" />
              체크리스트
            </span>
            <span className="font-semibold tabular-nums text-gray-700">
              {completedCount}/{totalCount}
              {totalCount > 0 && (
                <span className="ml-1 text-gray-400">· {progress}%</span>
              )}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progress === 100
                  ? "bg-gradient-to-r from-emerald-400 to-teal-400"
                  : "bg-gradient-to-r from-pink-400 to-rose-400"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 금액 */}
        {sp.payment_amount > 0 && (
          <div className="mt-3 flex items-center gap-1.5 text-sm">
            <WonIcon className="h-3.5 w-3.5 text-pink-500" />
            <span className="font-semibold text-pink-700 tabular-nums">
              ₩{sp.payment_amount.toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

// ──────────────────────────────────────────────
// 빈 상태
// ──────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-gray-300 bg-gradient-to-br from-gray-50 via-white to-pink-50/30 p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <BriefcaseIcon className="h-6 w-6 text-gray-300" />
      </div>
      <p className="mt-4 text-sm font-semibold text-gray-700">
        진행 중인 협찬이 없어요
      </p>
      <p className="mt-1 text-xs text-gray-400">
        새 협찬을 분석하고 수락하면 여기에 표시돼요
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────
// 작은 컴포넌트
// ──────────────────────────────────────────────

function StatusBadge({ status }: { status: Sponsorship["status"] }) {
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-inset ring-amber-200">
        <span className="h-1 w-1 rounded-full bg-amber-500" />
        대기
      </span>
    );
  }
  if (status === "accepted") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-bold text-pink-700 ring-1 ring-inset ring-pink-200">
        <span className="h-1 w-1 rounded-full bg-pink-500" />
        진행 중
      </span>
    );
  }
  return null;
}

const DEADLINE_TONES: Record<"rose" | "amber" | "gray", string> = {
  rose: "bg-rose-100 text-rose-700 ring-rose-200",
  amber: "bg-amber-100 text-amber-700 ring-amber-200",
  gray: "bg-gray-100 text-gray-600 ring-gray-200",
};

function DeadlinePill({ label, tone }: { label: string; tone: "rose" | "amber" | "gray" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${DEADLINE_TONES[tone]}`}
    >
      <FlagIcon className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}

// ─── 아이콘 ─────────────────────────────────
function ArrowRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  );
}
function ChecklistIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M2.625 6.75a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Zm4.875 0A.75.75 0 0 1 8.25 6h12a.75.75 0 0 1 0 1.5h-12a.75.75 0 0 1-.75-.75ZM2.625 12a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0ZM7.5 12a.75.75 0 0 1 .75-.75h12a.75.75 0 0 1 0 1.5h-12A.75.75 0 0 1 7.5 12Zm-4.875 5.25a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Zm4.875 0a.75.75 0 0 1 .75-.75h12a.75.75 0 0 1 0 1.5h-12a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
    </svg>
  );
}
function WonIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h13.5a3 3 0 0 0 3-3V13.5a3 3 0 0 0-3-3H8.25a.75.75 0 0 1-.75-.75V5.25a.75.75 0 0 0-.75-.75H5.25Z" clipRule="evenodd" />
      <path d="M8.25 5.25v3a2.25 2.25 0 0 1-2.25 2.25H2.625a3.74 3.74 0 0 0 .375.586L8.25 5.25Z" />
    </svg>
  );
}
function FlagIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M3 2.25a.75.75 0 0 1 .75.75v.54l1.838-.46a9.75 9.75 0 0 1 6.725.738l.108.054A8.25 8.25 0 0 0 18 4.524l3.11-.732a.75.75 0 0 1 .917.81 47.784 47.784 0 0 0 .005 10.337.75.75 0 0 1-.574.812l-3.114.733a9.75 9.75 0 0 1-6.594-.77l-.108-.054a8.25 8.25 0 0 0-5.69-.625l-2.202.55V21a.75.75 0 0 1-1.5 0V3A.75.75 0 0 1 3 2.25Z" clipRule="evenodd" />
    </svg>
  );
}
function BriefcaseIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M7.5 5.25a3 3 0 0 1 3-3h3a3 3 0 0 1 3 3v.205c.933.085 1.857.197 2.774.334 1.454.218 2.476 1.483 2.476 2.917v3.033c0 1.211-.734 2.352-1.936 2.752A24.726 24.726 0 0 1 12 15.75a24.726 24.726 0 0 1-7.814-1.259c-1.202-.4-1.936-1.541-1.936-2.752V8.706c0-1.434 1.022-2.7 2.476-2.917A48.814 48.814 0 0 1 7.5 5.455V5.25Zm7.5 0v.09a49.488 49.488 0 0 0-6 0v-.09a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5Z" clipRule="evenodd" />
      <path d="M3 18.4v-2.796a4.3 4.3 0 0 0 .713.31A26.226 26.226 0 0 0 12 17.25c2.892 0 5.68-.468 8.287-1.335.252-.084.49-.189.713-.311V18.4c0 1.452-1.047 2.728-2.523 2.923-2.12.282-4.282.427-6.477.427a49.19 49.19 0 0 1-6.477-.427C4.047 21.128 3 19.852 3 18.4Z" />
    </svg>
  );
}
