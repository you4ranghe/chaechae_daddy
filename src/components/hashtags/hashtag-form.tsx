"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { HashtagAnalysisResult } from "@/lib/agents/hashtag-agent";
import { HashtagAnalysisView } from "@/components/hashtags/analysis-view";
import { useAgentLimit } from "@/lib/agent-limit";

const CATEGORY_PRESETS = ["육아", "이유식", "아기용품", "아기패션", "육아일상", "아기발달"];

export function HashtagForm() {
  const router = useRouter();
  const { handleAgentLimitReached } = useAgentLimit();
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
        if (handleAgentLimitReached(res.status, data)) return;
        setError(data.error || "분석에 실패했습니다.");
        return;
      }

      setResult(data.analysis);
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setAnalyzing(false);
    }
  }

  if (result) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-500">
            <span className="text-pink-600 font-semibold">{result.category}</span> 해시태그 전략
          </h3>
          <button type="button" onClick={() => setResult(null)} className="text-sm text-gray-400 hover:text-gray-600">새로 분석하기</button>
        </div>
        <HashtagAnalysisView result={result} />
      </div>
    );
  }

  return (
    <form onSubmit={handleAnalyze} className="space-y-5">
      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <div className="bezel p-5">
        <label className="block text-sm font-medium text-gray-700">카테고리</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {CATEGORY_PRESETS.map((cat) => (
            <button key={cat} type="button" onClick={() => setCategory(cat)} className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${category === cat ? "bg-pink-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {cat}
            </button>
          ))}
        </div>
        <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="또는 직접 입력" className="mt-3 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-pink-500 focus:outline-none" />
      </div>

      <div className="bezel p-5">
        <label className="block text-sm font-medium text-gray-700">추가 요청 (선택)</label>
        <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="예: 6개월 아기 이유식 시작 관련 해시태그" className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm resize-none focus:border-pink-500 focus:outline-none" />
      </div>

      <button type="submit" disabled={analyzing || !category.trim()} className="w-full rounded-2xl cta-gradient px-6 py-3.5 text-base font-bold text-white transition-spring magnetic disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:scale-100">
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
