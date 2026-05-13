"use client";

import { useEffect, useState } from "react";
import type { HashtagAnalysisResult } from "@/lib/agents/hashtag-agent";
import { HashtagAnalysisView } from "@/components/hashtags/analysis-view";

interface HistoryItem {
  id: string;
  category: string;
  user_message: string;
  analysis: HashtagAnalysisResult;
  created_at: string;
}

interface ListResponse {
  items: HistoryItem[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function HashtagHistory() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/agent/hashtag?page=${page}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => !cancelled && setError("기록을 불러오지 못했습니다."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [page]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="mt-10">
      <h3 className="text-sm font-semibold text-gray-700">지난 해시태그 분석</h3>
      <p className="mt-0.5 text-xs text-gray-400">최근 분석부터 표시돼요</p>

      {loading && !data && (
        <div className="mt-3 rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-400">
          불러오는 중...
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {data && data.items.length === 0 && (
        <div className="mt-3 rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-400">
          아직 분석 기록이 없어요.
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="mt-3 space-y-2">
          {data.items.map((item) => {
            const expanded = expandedId === item.id;
            const tagCount = item.analysis?.recommendations?.length ?? 0;
            return (
              <div key={item.id} className="rounded-xl border border-gray-200 bg-white">
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : item.id)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      <span className="text-indigo-600">{item.category}</span>
                      {item.user_message ? ` · ${item.user_message}` : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {formatDate(item.created_at)} · 해시태그 {tagCount}개
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-gray-400">{expanded ? "접기" : "보기"}</span>
                </button>
                {expanded && (
                  <div className="border-t border-gray-100 px-4 py-4">
                    <HashtagAnalysisView result={item.analysis} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {data && data.total > data.pageSize && (
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            이전
          </button>
          <span className="text-xs text-gray-400">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={!data.hasMore || loading}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
