"use client";

import Link from "next/link";
import type { Sponsorship } from "@/lib/types/sponsorship";
import { PerformanceForm } from "./performance-form";

interface CompletedTabProps {
  sponsorships: Sponsorship[];
}

export function CompletedTab({ sponsorships }: CompletedTabProps) {
  const totalCount = sponsorships.length;
  const totalRevenue = sponsorships.reduce(
    (sum, sp) => sum + (sp.payment_amount || 0),
    0,
  );
  const paidCount = sponsorships.filter((sp) => (sp.payment_amount || 0) > 0).length;
  const avgRevenue = paidCount > 0 ? Math.round(totalRevenue / paidCount) : 0;

  if (totalCount === 0) {
    return (
      <div className="space-y-4">
        <StatGrid totalCount={0} totalRevenue={0} avgRevenue={0} />
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StatGrid
        totalCount={totalCount}
        totalRevenue={totalRevenue}
        avgRevenue={avgRevenue}
      />
      <ul className="space-y-3">
        {sponsorships.map((sp) => (
          <li key={sp.id}>
            <CompletedCard sponsorship={sp} />
          </li>
        ))}
      </ul>
    </div>
  );
}

// ──────────────────────────────────────────────
// 통계 그리드
// ──────────────────────────────────────────────

function StatGrid({
  totalCount,
  totalRevenue,
  avgRevenue,
}: {
  totalCount: number;
  totalRevenue: number;
  avgRevenue: number;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <StatCard
        label="완료 건수"
        value={`${totalCount}건`}
        icon={<CheckIcon />}
        tone="emerald"
      />
      <StatCard
        label="총 수익"
        value={`₩${totalRevenue.toLocaleString()}`}
        icon={<WonIcon />}
        tone="indigo"
        big
      />
      <StatCard
        label="평균 단가"
        value={avgRevenue > 0 ? `₩${avgRevenue.toLocaleString()}` : "—"}
        icon={<TrendingUpIcon />}
        tone="rose"
      />
    </div>
  );
}

const STAT_TONE: Record<
  "emerald" | "indigo" | "rose",
  { bg: string; iconBg: string; iconText: string; valueText: string }
> = {
  emerald: {
    bg: "from-emerald-50 to-teal-50",
    iconBg: "bg-emerald-100",
    iconText: "text-emerald-600",
    valueText: "text-emerald-700",
  },
  indigo: {
    bg: "from-pink-50 to-rose-50",
    iconBg: "bg-pink-100",
    iconText: "text-pink-600",
    valueText: "text-pink-700",
  },
  rose: {
    bg: "from-rose-50 to-pink-50",
    iconBg: "bg-rose-100",
    iconText: "text-rose-600",
    valueText: "text-rose-700",
  },
};

function StatCard({
  label,
  value,
  icon,
  tone,
  big = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: keyof typeof STAT_TONE;
  big?: boolean;
}) {
  const t = STAT_TONE[tone];
  return (
    <div
      className={`rounded-2xl bg-gradient-to-br ${t.bg} p-4 ring-1 ring-inset ring-white/60`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-xl ${t.iconBg} ${t.iconText}`}
        >
          {icon}
        </span>
      </div>
      <p className="mt-2 text-[11px] font-medium uppercase tracking-wider text-gray-500">
        {label}
      </p>
      <p
        className={`mt-0.5 font-bold tabular-nums ${t.valueText} ${big ? "text-xl" : "text-lg"}`}
      >
        {value}
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────
// 완료 카드
// ──────────────────────────────────────────────

function CompletedCard({ sponsorship: sp }: { sponsorship: Sponsorship }) {
  const date = new Date(sp.created_at);
  const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}.${String(date.getDate()).padStart(2, "0")}`;

  return (
    <div className="bezel bezel-hover overflow-hidden transition-spring">
      <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-teal-400" />
      <Link
        href={`/dashboard/sponsorships/${sp.id}`}
        className="group block px-5 pt-5 pb-3"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-bold text-gray-900">
                {sp.brand_name}
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                <CheckIcon className="h-2.5 w-2.5" />
                완료
              </span>
            </div>
            <p className="mt-1 truncate text-sm text-gray-500">
              {sp.product?.trim() || "제품 정보 없음"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
              <span className="inline-flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                {dateStr}
              </span>
              {sp.payment_amount > 0 && (
                <span className="inline-flex items-center gap-1 font-semibold text-pink-600">
                  <WonIcon className="h-3 w-3" />
                  ₩{sp.payment_amount.toLocaleString()}
                </span>
              )}
            </div>
          </div>
          <span className="flex-shrink-0 rounded-full bg-gray-50 p-2 text-gray-400 transition-colors group-hover:bg-emerald-50 group-hover:text-emerald-600">
            <ArrowRightIcon />
          </span>
        </div>
      </Link>
      <div className="border-t border-gray-100 bg-gray-50/40 px-5 py-3">
        <PerformanceForm sponsorshipId={sp.id} />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// 빈 상태
// ──────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-gray-300 bg-gradient-to-br from-emerald-50/30 via-white to-teal-50/30 p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <CheckIcon className="h-6 w-6 text-gray-300" />
      </div>
      <p className="mt-4 text-sm font-semibold text-gray-700">
        완료된 협찬이 아직 없어요
      </p>
      <p className="mt-1 text-xs text-gray-400">
        협찬 포스팅을 완료하면 여기에 히스토리가 쌓여요
      </p>
    </div>
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
function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
    </svg>
  );
}
function CalendarIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z" clipRule="evenodd" />
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
function TrendingUpIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M15.22 6.268a.75.75 0 0 1 .968-.432l5.942 2.28a.75.75 0 0 1 .431.97l-2.28 5.94a.75.75 0 1 1-1.4-.537l1.63-4.251-1.086.483a11.2 11.2 0 0 0-5.45 5.173.75.75 0 0 1-1.199.19L9 12.31l-6.22 6.22a.75.75 0 1 1-1.06-1.06l6.75-6.75a.75.75 0 0 1 1.06 0l3.606 3.605a12.694 12.694 0 0 1 5.68-4.973l1.086-.484-4.251-1.631a.75.75 0 0 1-.432-.97Z" clipRule="evenodd" />
    </svg>
  );
}
