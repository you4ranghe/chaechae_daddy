"use client";

import type { StatusBreakdown } from "@/lib/db/insights";

interface StatusDonutProps {
  data: StatusBreakdown;
}

const SEGMENTS = [
  { key: "completed" as const, label: "완료", color: "#10b981" },
  { key: "accepted" as const, label: "수락", color: "#6366f1" },
  { key: "pending" as const, label: "대기", color: "#f59e0b" },
  { key: "rejected" as const, label: "거절", color: "#ef4444" },
];

export function StatusDonut({ data }: StatusDonutProps) {
  const total = data.pending + data.accepted + data.rejected + data.completed;

  if (total === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-gray-400">
        분석한 협찬이 없어요
      </div>
    );
  }

  // SVG conic-gradient 대신 stroke-dasharray로 segment 그리기
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <div className="relative flex-shrink-0">
        <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
          <circle cx="80" cy="80" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="20" />
          {SEGMENTS.map((seg) => {
            const value = data[seg.key];
            if (value === 0) return null;
            const length = (value / total) * circumference;
            const el = (
              <circle
                key={seg.key}
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth="20"
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
              />
            );
            offset += length;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">{total}</span>
          <span className="text-xs text-gray-400">건</span>
        </div>
      </div>

      <div className="flex-1 space-y-2">
        {SEGMENTS.map((seg) => {
          const value = data[seg.key];
          const percent = total > 0 ? Math.round((value / total) * 100) : 0;
          return (
            <div key={seg.key} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                <span className="text-gray-600">{seg.label}</span>
              </div>
              <div className="text-gray-900">
                <span className="font-medium">{value}</span>
                <span className="ml-1 text-xs text-gray-400">({percent}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
