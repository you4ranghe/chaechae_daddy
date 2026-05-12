"use client";

import { useState } from "react";
import { CopyButton } from "@/components/sponsorship/copy-button";
import type { HashtagAnalysisResult } from "@/lib/agents/hashtag-agent";

const CATEGORY_PRESETS = ["육아", "이유식", "아기용품", "아기패션", "육아일상", "아기발달"];

export function HashtagForm() {
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<HashtagAnalysisResult | null>(null);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!category.trim()) {
      setError("카테고리를 입력하거나 선택해주세요.");
      return;
    }

    setError("");
    setAnalyzing(true);
    setResult(null);

    try {
      const res = await fetch("/api/agent/hashtag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: category.trim(), message }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "분석에 실패했습니다.");
        return;
      }

      setResult(data.analysis);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setAnalyzing(false);
    }
  }

  const tierLabels: Record<string, { label: string; color: string }> = {
    large: { label: "대형", color: "bg-red-100 text-red-700" },
    medium: { label: "중형", color: "bg-amber-100 text-amber-700" },
    niche: { label: "니치", color: "bg-emerald-100 text-emerald-700" },
  };

  if (result) {
    const allTags = result.recommendations.map((r) => r.tag).join(" ");

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-500">
            <span className="text-indigo-600 font-semibold">{result.category}</span> 해시태그 전략
          </h3>
          <button type="button" onClick={() => setResult(null)} className="text-sm text-gray-400 hover:text-gray-600">새로 분석하기</button>
        </div>

        {/* 전략 요약 */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-700 leading-relaxed">{result.strategy}</p>
        </div>

        {/* 전체 복사 */}
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-5">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-indigo-900">추천 해시태그 ({result.recommendations.length}개)</h4>
            <CopyButton text={allTags} label="전체 복사" />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {result.recommendations.map((r, i) => (
              <span key={i} className={`rounded-full px-2.5 py-1 text-xs font-medium ${tierLabels[r.tier]?.color || "bg-gray-100 text-gray-600"}`}>
                {r.tag}
              </span>
            ))}
          </div>
        </div>

        {/* 티어별 상세 */}
        {(["large", "medium", "niche"] as const).map((tier) => {
          const tags = result.recommendations.filter((r) => r.tier === tier);
          if (tags.length === 0) return null;
          const info = tierLabels[tier];
          return (
            <div key={tier} className="rounded-xl border border-gray-200 bg-white p-5">
              <h4 className="text-sm font-semibold text-gray-700">{info.label} 해시태그 ({tags.length}개)</h4>
              <div className="mt-3 space-y-2">
                {tags.map((t, i) => (
                  <div key={i} className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-sm font-medium text-gray-900">{t.tag}</span>
                      <p className="text-xs text-gray-500">{t.reason}</p>
                    </div>
                    <span className="shrink-0 text-xs text-gray-400">{t.estimatedPosts}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* 사용 팁 */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h4 className="text-sm font-medium text-gray-500">사용 팁</h4>
          <ul className="mt-2 space-y-1.5">
            {result.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleAnalyze} className="space-y-5">
      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <label className="block text-sm font-medium text-gray-700">카테고리</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {CATEGORY_PRESETS.map((cat) => (
            <button key={cat} type="button" onClick={() => setCategory(cat)} className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${category === cat ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {cat}
            </button>
          ))}
        </div>
        <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="또는 직접 입력" className="mt-3 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <label className="block text-sm font-medium text-gray-700">추가 요청 (선택)</label>
        <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="예: 6개월 아기 이유식 시작 관련 해시태그" className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm resize-none focus:border-indigo-500 focus:outline-none" />
      </div>

      <button type="submit" disabled={analyzing || !category.trim()} className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
        {analyzing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
            AI 분석 중...
          </span>
        ) : "해시태그 분석하기"}
      </button>
    </form>
  );
}
