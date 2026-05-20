"use client";

import { useState } from "react";

interface DailyChartProps {
  data: { date: string; count: number }[];
}

export function DailyChart({ data }: DailyChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const avg = data.length > 0 ? +(total / data.length).toFixed(1) : 0;

  if (data.every((d) => d.count === 0)) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50/40">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-gray-300">
          <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75ZM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 0 1-1.875-1.875V8.625ZM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 0 1 3 19.875v-6.75Z" />
        </svg>
        <p className="text-xs text-gray-400">아직 사용 기록이 없어요</p>
      </div>
    );
  }

  return (
    <div>
      {/* 요약 라인 */}
      <div className="mb-3 flex items-center justify-between text-[11px]">
        <span className="text-gray-500">
          총 <span className="font-bold text-gray-900 tabular-nums">{total}회</span>
          <span className="mx-1.5 text-gray-300">·</span>
          일평균 <span className="font-bold text-gray-900 tabular-nums">{avg}회</span>
        </span>
        <span className="text-gray-400">최근 {data.length}일</span>
      </div>

      {/* 차트 */}
      <div className="relative">
        <div className="flex h-40 items-end gap-1">
          {data.map((d, i) => {
            const heightPercent = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
            const isHovered = hovered === i;
            const isToday = i === data.length - 1;

            return (
              <div
                key={d.date}
                className="group flex flex-1 flex-col items-center gap-1"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* 바 영역 */}
                <div className="relative flex w-full flex-1 items-end justify-center">
                  {/* 툴팁 */}
                  {isHovered && d.count > 0 && (
                    <div className="absolute -top-9 z-10 whitespace-nowrap rounded-lg bg-gray-900 px-2 py-1 text-[10.5px] font-semibold text-white shadow-md">
                      <span className="tabular-nums">{d.count}회</span>
                      <span className="ml-1 text-gray-300">{d.date}</span>
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                    </div>
                  )}

                  {/* 바 */}
                  {d.count > 0 ? (
                    <div
                      className={`w-full max-w-[26px] rounded-md bg-gradient-to-t transition-all duration-300 ${
                        isHovered
                          ? "from-pink-600 to-rose-500 shadow-md shadow-pink-500/30"
                          : "from-pink-500 to-rose-400"
                      }`}
                      style={{ height: `${Math.max(8, heightPercent)}%` }}
                    />
                  ) : (
                    <div
                      className="w-full max-w-[26px] rounded-md bg-gray-100"
                      style={{ height: "4%" }}
                    />
                  )}
                </div>

                {/* 날짜 라벨 */}
                <span
                  className={`whitespace-nowrap text-[9.5px] font-medium tabular-nums ${
                    isToday
                      ? "text-pink-600"
                      : isHovered
                        ? "text-gray-700"
                        : "text-gray-400"
                  }`}
                >
                  {d.date}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
