"use client";

import type { SponsorshipAnalysis, ChecklistItem } from "@/lib/types/sponsorship";
import { CopyButton } from "./copy-button";

interface AnalysisResultProps {
  analysis: SponsorshipAnalysis;
  checklist: ChecklistItem[];
  onAccept: () => void;
  accepting: boolean;
}

function ScoreBadge({ score }: { score: number }) {
  let color = "bg-red-100 text-red-700";
  if (score >= 7) color = "bg-emerald-100 text-emerald-700";
  else if (score >= 4) color = "bg-amber-100 text-amber-700";

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ${color}`}>
      {score}/10
    </span>
  );
}

function RecommendationBadge({ rec }: { rec: string }) {
  const styles: Record<string, string> = {
    수락: "bg-emerald-600 text-white",
    협상: "bg-amber-500 text-white",
    거절: "bg-red-500 text-white",
  };
  return (
    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${styles[rec] || "bg-gray-200 text-gray-700"}`}>
      {rec} 추천
    </span>
  );
}

export function AnalysisResult({ analysis, checklist, onAccept, accepting }: AnalysisResultProps) {
  return (
    <div className="mt-6 space-y-4">
      {/* 브랜드/제품 정보 */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-medium text-gray-500">브랜드/제품 정보</h3>
        <div className="mt-3 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-400">브랜드</p>
            <p className="mt-0.5 font-semibold text-gray-900">{analysis.brand.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">제품</p>
            <p className="mt-0.5 font-semibold text-gray-900">{analysis.brand.product}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">업종</p>
            <p className="mt-0.5 font-semibold text-gray-900">{analysis.brand.industry}</p>
          </div>
        </div>
      </div>

      {/* 조건 요약 */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-medium text-gray-500">조건 요약</h3>
        <div className="mt-3 flex flex-wrap gap-3">
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
            {analysis.conditions.type}
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
            {analysis.conditions.payment}
          </span>
          {analysis.conditions.deadline !== "미정" && (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
              마감: {analysis.conditions.deadline}
            </span>
          )}
        </div>
        <ul className="mt-3 space-y-1.5">
          {analysis.conditions.requirements.map(function (req, i) {
            return (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                {req}
              </li>
            );
          })}
        </ul>
      </div>

      {/* AI 추천 점수 */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-medium text-gray-500">AI 추천</h3>
        <div className="mt-3 flex items-center gap-3">
          <ScoreBadge score={analysis.score.value} />
          <RecommendationBadge rec={analysis.score.recommendation} />
        </div>
        <p className="mt-3 text-sm text-gray-600 leading-relaxed">
          {analysis.score.reasoning}
        </p>
      </div>

      {/* 장단점 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5">
          <h3 className="text-sm font-semibold text-emerald-700">장점</h3>
          <ul className="mt-2 space-y-1.5">
            {analysis.pros.map(function (pro, i) {
              return (
                <li key={i} className="flex items-start gap-2 text-sm text-emerald-800">
                  <span className="shrink-0">+</span>
                  {pro}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-5">
          <h3 className="text-sm font-semibold text-red-700">단점</h3>
          <ul className="mt-2 space-y-1.5">
            {analysis.cons.map(function (con, i) {
              return (
                <li key={i} className="flex items-start gap-2 text-sm text-red-800">
                  <span className="shrink-0">-</span>
                  {con}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* 응답 초안 3종 */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-4">응답 초안</h3>
        <div className="space-y-4">
          {(
            [
              { key: "accept", label: "수락", color: "border-emerald-200" },
              { key: "negotiate", label: "협상", color: "border-amber-200" },
              { key: "reject", label: "거절", color: "border-red-200" },
            ] as const
          ).map(function (item) {
            const text = analysis.responses[item.key];
            return (
              <div key={item.key} className={`rounded-lg border ${item.color} p-4`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">
                    {item.label} 응답
                  </span>
                  <CopyButton text={text} />
                </div>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {text}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 수락 → 콘텐츠 만들기 */}
      <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50/50 p-5">
        <h3 className="font-semibold text-indigo-900">이 협찬을 수락하시겠어요?</h3>
        <p className="mt-1 text-sm text-indigo-600">
          수락하면 체크리스트와 콘텐츠를 자동으로 생성합니다.
        </p>
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
          <span className="font-medium">체크리스트 미리보기:</span>
          {checklist.slice(0, 3).map(function (item) {
            return (
              <span key={item.id} className="rounded bg-white px-2 py-0.5 text-xs border border-gray-200">
                {item.text}
              </span>
            );
          })}
          {checklist.length > 3 && (
            <span className="text-xs text-gray-400">+{checklist.length - 3}개</span>
          )}
        </div>
        <button
          type="button"
          onClick={onAccept}
          disabled={accepting}
          className="mt-4 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {accepting ? "콘텐츠 생성 중..." : "수락하고 콘텐츠 만들기"}
        </button>
      </div>
    </div>
  );
}
