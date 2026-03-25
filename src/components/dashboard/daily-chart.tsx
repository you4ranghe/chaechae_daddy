"use client";

interface DailyChartProps {
  data: { date: string; count: number }[];
}

export function DailyChart({ data }: DailyChartProps) {
  const maxCount = Math.max(...data.map(function (d) { return d.count; }), 1);

  if (data.every(function (d) { return d.count === 0; })) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-gray-400">
        아직 사용 기록이 없습니다
      </div>
    );
  }

  return (
    <div className="flex items-end gap-1.5 h-40">
      {data.map(function (d) {
        const heightPercent = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
        const minHeight = d.count > 0 ? 8 : 2;

        return (
          <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
            {/* 바 */}
            <div className="relative w-full flex items-end justify-center" style={{ height: "120px" }}>
              {d.count > 0 && (
                <span className="absolute -top-5 text-xs font-medium text-gray-500">
                  {d.count}
                </span>
              )}
              <div
                className={`w-full max-w-[28px] rounded-t transition-all ${
                  d.count > 0 ? "bg-indigo-500" : "bg-gray-100"
                }`}
                style={{ height: `${Math.max(minHeight, heightPercent)}%` }}
              />
            </div>
            {/* 날짜 라벨 */}
            <span className="text-[10px] text-gray-400 whitespace-nowrap">{d.date}</span>
          </div>
        );
      })}
    </div>
  );
}
