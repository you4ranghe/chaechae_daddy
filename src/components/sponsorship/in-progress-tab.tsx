"use client";

import Link from "next/link";
import type { Sponsorship } from "@/lib/types/sponsorship";
import { StatusActions } from "./status-actions";

interface InProgressTabProps {
  sponsorships: Sponsorship[];
}

export function InProgressTab({ sponsorships }: InProgressTabProps) {
  if (sponsorships.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="mx-auto h-10 w-10 text-gray-300">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
        </svg>
        <p className="mt-3 text-sm text-gray-500">
          진행 중인 협찬이 없습니다
        </p>
        <p className="mt-1 text-xs text-gray-400">
          새 협찬을 분석하고 수락하면 여기에 표시됩니다
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sponsorships.map(function (sp) {
        const checklistItems = sp.checklist || [];
        const completedCount = checklistItems.filter(function (item) {
          return item.checked;
        }).length;
        const totalCount = checklistItems.length;
        const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        // 마감일 계산
        let deadlineText = "";
        let deadlineColor = "text-gray-400";
        if (sp.deadline) {
          const deadline = new Date(sp.deadline);
          const now = new Date();
          const diff = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (diff < 0) {
            deadlineText = "마감 지남";
            deadlineColor = "text-red-500";
          } else if (diff <= 3) {
            deadlineText = `D-${diff}`;
            deadlineColor = "text-red-500";
          } else {
            deadlineText = `D-${diff}`;
          }
        }

        const statusLabel = sp.status === "pending" ? "대기" : sp.status === "accepted" ? "진행 중" : sp.status;
        const statusColor = sp.status === "pending"
          ? "bg-amber-100 text-amber-700"
          : "bg-indigo-100 text-indigo-700";

        return (
          <div
            key={sp.id}
            className="rounded-xl border border-gray-200 bg-white p-5 hover:border-indigo-200 hover:shadow-sm transition-all"
          >
            <Link
              href={`/dashboard/sponsorships/${sp.id}`}
              className="flex items-start justify-between gap-3 -m-1 p-1 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 truncate">{sp.brand_name}</h3>
                  <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColor}`}>
                    {statusLabel}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-gray-500 truncate">{sp.product}</p>
              </div>
              <div className="text-right flex-shrink-0">
                {deadlineText && (
                  <span className={`text-sm font-medium ${deadlineColor}`}>
                    {deadlineText}
                  </span>
                )}
                <p className="mt-0.5 text-xs text-indigo-500">상세 →</p>
              </div>
            </Link>
            {/* 체크리스트 진행률 */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>체크리스트 진행률</span>
                <span>{completedCount}/{totalCount}</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            {/* 상태 전환 버튼 */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <StatusActions sponsorshipId={sp.id} currentStatus={sp.status} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
