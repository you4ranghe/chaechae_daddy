import type { AnalyticsReport } from "@/lib/agents/analytics-agent";
import { DownloadAnalyticsPdfButton } from "./download-analytics-pdf-button";

export function AnalyticsReportView({
  report,
  reportDate,
}: {
  report: AnalyticsReport;
  reportDate?: Date;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <DownloadAnalyticsPdfButton report={report} reportDate={reportDate} size="sm" />
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
        <p className="text-sm text-gray-500">경쟁력 점수</p>
        <p className="mt-2 text-5xl font-bold text-indigo-600">{report.competitiveness.overallScore}</p>
        <p className="mt-1 text-sm font-medium text-gray-700">{report.competitiveness.tier}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-left">
          <div className="rounded-lg bg-gray-50 p-3"><p className="text-xs text-gray-400">참여율</p><p className="text-sm font-semibold">{report.competitiveness.engagementRate}</p><p className="text-xs text-gray-500">{report.competitiveness.engagementVerdict}</p></div>
          <div className="rounded-lg bg-gray-50 p-3"><p className="text-xs text-gray-400">도달 효율</p><p className="text-sm font-semibold">{report.competitiveness.reachEfficiency}</p></div>
          <div className="rounded-lg bg-gray-50 p-3"><p className="text-xs text-gray-400">저장률</p><p className="text-sm font-semibold">{report.competitiveness.saveRate}</p></div>
          <div className="rounded-lg bg-gray-50 p-3"><p className="text-xs text-gray-400">성장률</p><p className="text-sm font-semibold">{report.competitiveness.growthRate}</p></div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5">
          <h4 className="text-sm font-semibold text-emerald-700">잘한 점</h4>
          <ul className="mt-2 space-y-1.5">{report.summary.highlights.map((h, i) => <li key={i} className="flex items-start gap-2 text-sm text-emerald-800"><span className="shrink-0">+</span>{h}</li>)}</ul>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5">
          <h4 className="text-sm font-semibold text-amber-700">개선할 점</h4>
          <ul className="mt-2 space-y-1.5">{report.summary.improvements.map((im, i) => <li key={i} className="flex items-start gap-2 text-sm text-amber-800"><span className="shrink-0">-</span>{im}</li>)}</ul>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h4 className="text-sm font-medium text-gray-500">최고 성과 게시물 분석</h4>
        <p className="mt-2 font-semibold text-gray-900">{report.topPostAnalysis.postTitle}</p>
        <p className="mt-1 text-sm text-gray-600">{report.topPostAnalysis.whyItWorked}</p>
        <p className="mt-2 text-sm text-indigo-600">{report.topPostAnalysis.replicateStrategy}</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h4 className="text-sm font-medium text-gray-500">다음 주 추천 전략</h4>
        <p className="mt-2 text-sm font-semibold text-gray-900">{report.nextWeekStrategy.contentMix}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {report.nextWeekStrategy.focusTopics.map((t, i) => <span key={i} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">{t}</span>)}
        </div>
        <p className="mt-3 text-sm text-gray-600">{report.nextWeekStrategy.captionTips}</p>
        <p className="mt-1 text-sm text-gray-600">{report.nextWeekStrategy.hashtagAdvice}</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h4 className="text-sm font-medium text-gray-500">최적 업로드 시간</h4>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div><p className="text-xs text-gray-400">평일</p><p className="text-sm font-semibold">{report.bestTimes.weekday}</p></div>
          <div><p className="text-xs text-gray-400">주말</p><p className="text-sm font-semibold">{report.bestTimes.weekend}</p></div>
        </div>
        <p className="mt-2 text-sm text-gray-500">{report.bestTimes.reasoning}</p>
      </div>
    </div>
  );
}
