"use client";

import type { IndustryPrice } from "@/lib/db/insights";

interface IndustryPricesProps {
  prices: IndustryPrice[];
}

export function IndustryPrices({ prices }: IndustryPricesProps) {
  if (prices.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-gray-400">
        시세 비교를 위한 데이터가 부족해요.
        <br className="hidden sm:inline" />
        완료된 협찬을 더 쌓아주세요.
      </div>
    );
  }

  const maxValue = Math.max(...prices.map((p) => p.max));

  return (
    <div className="space-y-4">
      {prices.map((p) => {
        const minLeft = (p.min / maxValue) * 100;
        const maxLeft = (p.max / maxValue) * 100;
        const medianLeft = (p.median / maxValue) * 100;
        return (
          <div key={p.industry}>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-900">{p.industry}</span>
              <span className="text-gray-500">
                중앙값 <span className="font-semibold text-gray-900">₩{p.median.toLocaleString()}</span>
                <span className="ml-1.5 text-[10px] text-gray-400">({p.count}건)</span>
              </span>
            </div>
            {/* min-max range bar */}
            <div className="mt-2 relative h-2 bg-gray-100 rounded-full">
              <div
                className="absolute h-full rounded-full bg-pink-200"
                style={{ left: `${minLeft}%`, width: `${maxLeft - minLeft}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 h-3 w-0.5 bg-pink-600 rounded-full"
                style={{ left: `${medianLeft}%` }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] text-gray-400">
              <span>최저 ₩{p.min.toLocaleString()}</span>
              <span>최고 ₩{p.max.toLocaleString()}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
