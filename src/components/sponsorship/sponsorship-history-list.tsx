"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface HistoryItem {
  id: string;
  brand_name: string;
  // 일부 환경에서 product 컬럼이 누락되어 있을 수 있어 optional 처리
  product?: string | null;
  status: "analyzing" | "pending" | "accepted" | "rejected" | "completed";
  payment_amount?: number | null;
  deadline?: string | null;
  created_at: string;
}

interface HistoryResponse {
  items: HistoryItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const PAGE_SIZE = 10;

function statusBadge(status: HistoryItem["status"]) {
  if (status === "pending") {
    return { label: "대기", color: "bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200" };
  }
  if (status === "accepted") {
    return { label: "진행 중", color: "bg-indigo-100 text-indigo-700 ring-1 ring-inset ring-indigo-200" };
  }
  if (status === "rejected") {
    return { label: "거절", color: "bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200" };
  }
  if (status === "completed") {
    return { label: "완료", color: "bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200" };
  }
  return { label: "분석 중", color: "bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200" };
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export function SponsorshipHistoryList() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `/api/sponsorship?page=${page}&limit=${PAGE_SIZE}`,
          { cache: "no-store" },
        );
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(json.error || "목록을 불러올 수 없습니다.");
          setData(null);
          return;
        }
        setData(json as HistoryResponse);
      } catch {
        if (cancelled) return;
        setError("네트워크 오류가 발생했습니다.");
        setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [page]);

  // 처음 로딩이고 데이터가 비어있으면 섹션 자체를 숨김
  if (!loading && !error && data && data.total === 0) {
    return null;
  }

  const totalPages = data?.totalPages ?? 0;
  const items = data?.items ?? [];

  return (
    <section className="mt-8">
      <div className="flex items-end justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
              <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z" clipRule="evenodd" />
            </svg>
          </span>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">이전 분석 기록</h3>
            <p className="mt-0.5 text-[11px] text-gray-400">
              지금까지 분석한 협찬 DM을 다시 볼 수 있어요
            </p>
          </div>
        </div>
        {data && data.total > 0 && (
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-gray-600">
            총 {data.total}건
          </span>
        )}
      </div>

      {error && (
        <div className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600 ring-1 ring-inset ring-rose-100">
          {error}
        </div>
      )}

      {loading && !data && (
        <div className="mt-3 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-2xl border border-gray-100 bg-gray-50"
            />
          ))}
        </div>
      )}

      {!loading && items.length > 0 && (
        <ul className="mt-3 space-y-2">
          {items.map((sp) => {
            const badge = statusBadge(sp.status);
            return (
              <li key={sp.id}>
                <Link
                  href={`/dashboard/sponsorships/${sp.id}`}
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {sp.brand_name}
                      </p>
                      <span
                        className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.color}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {sp.product?.trim() || "제품 정보 없음"}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-[11px] tabular-nums text-gray-400">
                      {formatDate(sp.created_at)}
                    </p>
                    {sp.payment_amount != null && sp.payment_amount > 0 && (
                      <p className="mt-0.5 text-xs font-bold tabular-nums text-indigo-600">
                        ₩{sp.payment_amount.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <span className="hidden flex-shrink-0 rounded-full bg-gray-50 p-1.5 text-gray-300 transition-all group-hover:bg-indigo-50 group-hover:text-indigo-500 sm:inline-flex">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="h-3.5 w-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-all hover:-translate-x-0.5 hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-x-0 disabled:hover:border-gray-200 disabled:hover:text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="h-3 w-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            이전
          </button>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold tabular-nums text-gray-700">
            {page} <span className="text-gray-400">/</span> {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
            className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-all hover:translate-x-0.5 hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-x-0 disabled:hover:border-gray-200 disabled:hover:text-gray-600"
          >
            다음
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="h-3 w-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
}
