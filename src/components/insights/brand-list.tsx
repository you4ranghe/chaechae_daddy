"use client";

import type { BrandStat } from "@/lib/db/insights";

interface BrandListProps {
  brands: BrandStat[];
}

export function BrandList({ brands }: BrandListProps) {
  if (brands.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-gray-400">
        브랜드 기록이 없어요
      </div>
    );
  }

  const top = brands.slice(0, 8);

  return (
    <div className="divide-y divide-gray-100">
      {top.map((b) => {
        const isRepeat = b.count >= 2;
        return (
          <div key={b.brand} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2 min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">{b.brand}</p>
              {isRepeat && (
                <span className="flex-shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                  {b.count}회 협찬
                </span>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {b.revenue > 0 ? `₩${b.revenue.toLocaleString()}` : "—"}
              </p>
              <p className="text-[10px] text-gray-400">
                최근 {formatDate(b.lastDate)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}
