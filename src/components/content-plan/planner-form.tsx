"use client";

import { useState } from "react";
import { CopyButton } from "@/components/sponsorship/copy-button";
import type { WeeklyPlanResult, DailyPlan } from "@/lib/agents/weekly-planner";

const KEYWORD_PRESETS = [
  "이유식 시작",
  "6개월 발달",
  "수면교육",
  "육아용품 리뷰",
  "아기와 외출",
  "육퇴 후 루틴",
];

const TYPE_COLORS: Record<string, string> = {
  "릴스": "bg-pink-100 text-pink-700",
  "캐러셀": "bg-blue-100 text-blue-700",
  "단일이미지": "bg-amber-100 text-amber-700",
};

function DayCard({ plan }: { plan: DailyPlan }) {
  const [expanded, setExpanded] = useState(false);
  const hashtagText = plan.hashtags.map((t) => t.startsWith("#") ? t : `#${t}`).join(" ");

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">{plan.day}</span>
          <div>
            <p className="text-sm font-semibold text-gray-900">{plan.topic}</p>
            <p className="text-xs text-gray-500">{plan.bestTime}</p>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_COLORS[plan.contentType] || "bg-gray-100 text-gray-600"}`}>
          {plan.contentType}
        </span>
      </div>

      <p className="mt-2 text-xs text-indigo-600">{plan.angle}</p>

      <button type="button" onClick={() => setExpanded(!expanded)} className="mt-3 text-sm text-gray-400 hover:text-gray-600">
        {expanded ? "접기" : "캡션 보기"}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">캡션</span>
              <CopyButton text={plan.caption} label="복사" />
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{plan.caption}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">해시태그 ({plan.hashtags.length}개)</span>
              <CopyButton text={hashtagText} label="복사" />
            </div>
            <div className="flex flex-wrap gap-1">
              {plan.hashtags.map((tag, i) => (
                <span key={i} className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600">
                  {tag.startsWith("#") ? tag : `#${tag}`}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function PlannerForm() {
  const [keywords, setKeywords] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<WeeklyPlanResult | null>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (keywords.trim().length < 2) {
      setError("키워드를 2자 이상 입력해주세요.");
      return;
    }

    setError("");
    setGenerating(true);
    setResult(null);

    try {
      const res = await fetch("/api/agent/content-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: keywords.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "플랜 생성에 실패했습니다.");
        return;
      }

      setResult(data.plan);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setGenerating(false);
    }
  }

  if (result) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-500">
            <span className="text-indigo-600 font-semibold">{result.keywords}</span> 주간 플랜
          </h3>
          <button type="button" onClick={() => setResult(null)} className="text-sm text-gray-400 hover:text-gray-600">새로 생성하기</button>
        </div>

        {/* 콘텐츠 믹스 요약 */}
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
          <div className="flex gap-4 text-sm">
            {Object.entries(
              result.weeklyPlan.reduce<Record<string, number>>((acc, p) => {
                acc[p.contentType] = (acc[p.contentType] || 0) + 1;
                return acc;
              }, {})
            ).map(([type, count]) => (
              <span key={type} className={`rounded-full px-3 py-1 font-medium ${TYPE_COLORS[type] || "bg-gray-100"}`}>
                {type} {count}개
              </span>
            ))}
          </div>
        </div>

        {/* 일별 카드 */}
        {result.weeklyPlan.map((plan, i) => (
          <DayCard key={i} plan={plan} />
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleGenerate} className="space-y-5">
      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <label className="block text-sm font-medium text-gray-700">이번 주 키워드</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {KEYWORD_PRESETS.map((kw) => (
            <button key={kw} type="button" onClick={() => setKeywords((prev) => prev ? `${prev}, ${kw}` : kw)} className="rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 transition-colors">
              {kw}
            </button>
          ))}
        </div>
        <input type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="예: 이유식 시작, 6개월 발달" className="mt-3 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
        <p className="mt-2 text-xs text-gray-400">콤마(,)로 여러 키워드를 구분하세요</p>
      </div>

      <button type="submit" disabled={generating || keywords.trim().length < 2} className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
        {generating ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
            AI가 플랜 생성 중... (트렌드 분석 포함)
          </span>
        ) : "주간 콘텐츠 플랜 생성하기"}
      </button>
    </form>
  );
}
