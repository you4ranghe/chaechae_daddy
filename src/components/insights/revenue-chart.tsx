"use client";

import type { MonthlyRevenue } from "@/lib/db/insights";

interface RevenueChartProps {
  data: MonthlyRevenue[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const allZero = data.every((d) => d.revenue === 0);

  if (allZero) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-gray-400">
        아직 완료된 협찬이 없어요. 협찬을 완료 처리하면 그래프가 채워져요.
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 h-48">
      {data.map((d) => {
        const heightPercent = (d.revenue / maxRevenue) * 100;
        return (
          <div key={d.month} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="relative w-full flex items-end justify-center" style={{ height: "160px" }}>
              {d.revenue > 0 && (
                <span className="absolute -top-5 text-[10px] font-medium text-gray-500 whitespace-nowrap">
                  {formatShort(d.revenue)}
                </span>
              )}
              <div
                className={`w-full max-w-[36px] rounded-t-md transition-all ${
                  d.revenue > 0 ? "bg-gradient-to-t from-indigo-600 to-indigo-400" : "bg-gray-100"
                }`}
                style={{ height: `${Math.max(d.revenue > 0 ? 8 : 2, heightPercent)}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-400 whitespace-nowrap">{d.month}</span>
            {d.count > 0 && (
              <span className="text-[10px] text-gray-300">{d.count}건</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function formatShort(n: number): string {
  if (n >= 10000000) return `${Math.round(n / 1000000) / 10}억`;
  if (n >= 10000) return `${Math.round(n / 1000) / 10}만`;
  if (n >= 1000) return `${Math.round(n / 100) / 10}천`;
  return n.toString();
}
