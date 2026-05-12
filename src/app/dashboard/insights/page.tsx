import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { fetchInsights } from "@/lib/db/insights";
import { RevenueChart } from "@/components/insights/revenue-chart";
import { StatusDonut } from "@/components/insights/status-donut";
import { BrandList } from "@/components/insights/brand-list";
import { IndustryPrices } from "@/components/insights/industry-prices";

export default async function InsightsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const insights = await fetchInsights(supabase, user.id);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">협찬 인사이트</h1>
        <p className="mt-1 text-sm text-gray-500">
          최근 6개월 협찬 데이터를 모아 보여드려요
        </p>
      </div>

      {/* 요약 카드 */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-xs text-gray-400">총 수익 (6개월)</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            ₩{insights.totals.revenue.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-xs text-gray-400">완료된 협찬</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {insights.totals.completedCount}건
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-xs text-gray-400">수락률</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {insights.totals.acceptRate}%
          </p>
          <p className="mt-0.5 text-[10px] text-gray-400">
            의사결정한 협찬 기준
          </p>
        </div>
      </div>

      {/* 월별 수익 그래프 */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-gray-900">월별 협찬 수익</h2>
        <p className="mt-0.5 text-xs text-gray-400">완료 처리한 협찬만 집계해요</p>
        <div className="mt-6">
          <RevenueChart data={insights.monthlyRevenue} />
        </div>
      </div>

      {/* 상태 분포 + 브랜드 리스트 */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gray-900">수락 / 거절 비율</h2>
          <p className="mt-0.5 text-xs text-gray-400">전체 협찬 상태 분포</p>
          <div className="mt-6">
            <StatusDonut data={insights.statusBreakdown} />
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gray-900">브랜드별 통계</h2>
          <p className="mt-0.5 text-xs text-gray-400">2회 이상은 반복 브랜드 뱃지가 붙어요</p>
          <div className="mt-3">
            <BrandList brands={insights.brandStats} />
          </div>
        </div>
      </div>

      {/* 시세 비교 */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-gray-900">업종별 시세 비교</h2>
        <p className="mt-0.5 text-xs text-gray-400">
          내가 완료한 협찬의 업종별 금액 분포 — 다음 협상 때 참고하세요
        </p>
        <div className="mt-6">
          <IndustryPrices prices={insights.industryPrices} />
        </div>
      </div>
    </>
  );
}
