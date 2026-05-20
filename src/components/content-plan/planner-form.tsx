"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { WeeklyPlanResult } from "@/lib/agents/weekly-planner";
import { WeeklyPlanView } from "@/components/content-plan/plan-view";
import { useAgentLimit } from "@/lib/agent-limit";

const KEYWORD_PRESETS = [
  "이유식 시작",
  "6개월 발달",
  "수면교육",
  "육아용품 리뷰",
  "아기와 외출",
  "육퇴 후 루틴",
];

export function PlannerForm() {
  const router = useRouter();
  const { handleAgentLimitReached } = useAgentLimit();
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
        if (handleAgentLimitReached(res.status, data)) return;
        setError(data.error || "플랜 생성에 실패했습니다.");
        return;
      }

      setResult(data.plan);
      router.refresh();
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
            <span className="text-pink-600 font-semibold">{result.keywords}</span> 주간 플랜
          </h3>
          <button type="button" onClick={() => setResult(null)} className="text-sm text-gray-400 hover:text-gray-600">새로 생성하기</button>
        </div>
        <WeeklyPlanView result={result} />
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
        <input type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="예: 이유식 시작, 6개월 발달" className="mt-3 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-pink-500 focus:outline-none" />
        <p className="mt-2 text-xs text-gray-400">콤마(,)로 여러 키워드를 구분하세요</p>
      </div>

      <button type="submit" disabled={generating || keywords.trim().length < 2} className="w-full rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-pink-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
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
