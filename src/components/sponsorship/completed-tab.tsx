"use client";

import Link from "next/link";
import type { Sponsorship } from "@/lib/types/sponsorship";
import { StatusActions } from "./status-actions";
import { PerformanceForm } from "./performance-form";

interface CompletedTabProps {
  sponsorships: Sponsorship[];
}

export function CompletedTab({ sponsorships }: CompletedTabProps) {
  // 통계 계산
  const totalCount = sponsorships.length;
  const totalRevenue = sponsorships.reduce(function (sum, sp) {
    return sum + (sp.payment_amount || 0);
  }, 0);

  if (sponsorships.length === 0) {
    return (
      <div className="space-y-4">
        {/* 통계 카드 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 text-center">
            <p className="text-xs text-gray-400">총 완료 건수</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">0건</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 text-center">
            <p className="text-xs text-gray-400">총 수익</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">₩0</p>
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="mx-auto h-10 w-10 text-gray-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <p className="mt-3 text-sm text-gray-500">
            완료된 협찬이 없습니다
          </p>
          <p className="mt-1 text-xs text-gray-400">
            협찬 포스팅이 완료되면 여기에서 히스토리를 확인할 수 있습니다
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 통계 카드 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-center">
          <p className="text-xs text-gray-400">총 완료 건수</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{totalCount}건</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-center">
          <p className="text-xs text-gray-400">총 수익</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            ₩{totalRevenue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* 히스토리 리스트 */}
      <div className="space-y-3">
        {sponsorships.map(function (sp) {
          const date = new Date(sp.created_at);
          const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;

          return (
            <div
              key={sp.id}
              className="rounded-xl border border-gray-200 bg-white p-5"
            >
              <Link
                href={`/dashboard/sponsorships/${sp.id}`}
                className="flex items-start justify-between -m-1 p-1 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <h3 className="font-semibold text-gray-900">{sp.brand_name}</h3>
                  <p className="mt-0.5 text-sm text-gray-500">{sp.product}</p>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                    완료
                  </span>
                  <p className="mt-1 text-xs text-gray-400">{dateStr}</p>
                  <p className="mt-0.5 text-xs text-indigo-500">상세 →</p>
                </div>
              </Link>
              {sp.payment_amount > 0 && (
                <p className="mt-2 text-sm font-medium text-indigo-600">
                  ₩{sp.payment_amount.toLocaleString()}
                </p>
              )}
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                <PerformanceForm sponsorshipId={sp.id} />
                <StatusActions sponsorshipId={sp.id} currentStatus={sp.status} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
