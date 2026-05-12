"use client";

import { useState } from "react";
import type { AnalyticsReport } from "@/lib/agents/analytics-agent";

interface PostInput {
  title: string;
  contentType: "릴스" | "캐러셀" | "단일이미지" | "스토리";
  likes: string;
  comments: string;
  saves: string;
  reach: string;
}

const EMPTY_POST: PostInput = { title: "", contentType: "단일이미지", likes: "", comments: "", saves: "", reach: "" };

export function AnalyticsForm() {
  const [followers, setFollowers] = useState("");
  const [followerChange, setFollowerChange] = useState("");
  const [profileVisits, setProfileVisits] = useState("");
  const [storyViews, setStoryViews] = useState("");
  const [posts, setPosts] = useState<PostInput[]>([{ ...EMPTY_POST }]);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState<AnalyticsReport | null>(null);

  function addPost() {
    if (posts.length >= 7) return;
    setPosts([...posts, { ...EMPTY_POST }]);
  }

  function removePost(index: number) {
    setPosts(posts.filter((_, i) => i !== index));
  }

  function updatePost(index: number, field: keyof PostInput, value: string) {
    setPosts(posts.map((p, i) => i === index ? { ...p, [field]: value } : p));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!followers || posts.length === 0) {
      setError("팔로워 수와 최소 1개 이상의 게시물 데이터를 입력해주세요.");
      return;
    }

    setError("");
    setAnalyzing(true);
    setReport(null);

    try {
      const res = await fetch("/api/agent/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          followers: parseInt(followers) || 0,
          followerChange: parseInt(followerChange) || 0,
          profileVisits: parseInt(profileVisits) || 0,
          storyViews: parseInt(storyViews) || 0,
          posts: posts.map((p) => ({
            title: p.title || "게시물",
            contentType: p.contentType,
            likes: parseInt(p.likes) || 0,
            comments: parseInt(p.comments) || 0,
            saves: parseInt(p.saves) || 0,
            reach: parseInt(p.reach) || 0,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "분석에 실패했습니다.");
        return;
      }

      setReport(data.report);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setAnalyzing(false);
    }
  }

  if (report) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-500">분석 리포트</h3>
          <button type="button" onClick={() => setReport(null)} className="text-sm text-gray-400 hover:text-gray-600">새로 분석하기</button>
        </div>

        {/* 경쟁력 점수 */}
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

        {/* 요약 */}
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

        {/* 최고 게시물 분석 */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h4 className="text-sm font-medium text-gray-500">최고 성과 게시물 분석</h4>
          <p className="mt-2 font-semibold text-gray-900">{report.topPostAnalysis.postTitle}</p>
          <p className="mt-1 text-sm text-gray-600">{report.topPostAnalysis.whyItWorked}</p>
          <p className="mt-2 text-sm text-indigo-600">{report.topPostAnalysis.replicateStrategy}</p>
        </div>

        {/* 다음 주 전략 */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h4 className="text-sm font-medium text-gray-500">다음 주 추천 전략</h4>
          <p className="mt-2 text-sm font-semibold text-gray-900">{report.nextWeekStrategy.contentMix}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {report.nextWeekStrategy.focusTopics.map((t, i) => <span key={i} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">{t}</span>)}
          </div>
          <p className="mt-3 text-sm text-gray-600">{report.nextWeekStrategy.captionTips}</p>
          <p className="mt-1 text-sm text-gray-600">{report.nextWeekStrategy.hashtagAdvice}</p>
        </div>

        {/* 업로드 시간 */}
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

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      {/* 기본 정보 */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-medium text-gray-700">기본 정보</h3>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500">팔로워 수</label>
            <input type="number" value={followers} onChange={(e) => setFollowers(e.target.value)} placeholder="2000" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs text-gray-500">증감</label>
            <input type="number" value={followerChange} onChange={(e) => setFollowerChange(e.target.value)} placeholder="+50" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs text-gray-500">프로필 방문</label>
            <input type="number" value={profileVisits} onChange={(e) => setProfileVisits(e.target.value)} placeholder="1500" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs text-gray-500">스토리 평균 조회</label>
            <input type="number" value={storyViews} onChange={(e) => setStoryViews(e.target.value)} placeholder="600" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
          </div>
        </div>
      </div>

      {/* 게시물 성과 */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">게시물 성과 ({posts.length}/7)</h3>
          {posts.length < 7 && (
            <button type="button" onClick={addPost} className="text-sm text-indigo-600 hover:text-indigo-500">+ 게시물 추가</button>
          )}
        </div>
        <div className="mt-3 space-y-4">
          {posts.map((post, index) => (
            <div key={index} className="rounded-lg bg-gray-50 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-500">게시물 {index + 1}</span>
                {posts.length > 1 && (
                  <button type="button" onClick={() => removePost(index)} className="text-xs text-red-400 hover:text-red-600">삭제</button>
                )}
              </div>
              <div className="grid gap-3">
                <input type="text" value={post.title} onChange={(e) => updatePost(index, "title", e.target.value)} placeholder="게시물 제목" className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                <select value={post.contentType} onChange={(e) => updatePost(index, "contentType", e.target.value)} className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
                  <option value="릴스">릴스</option>
                  <option value="캐러셀">캐러셀</option>
                  <option value="단일이미지">단일이미지</option>
                  <option value="스토리">스토리</option>
                </select>
                <div className="grid grid-cols-4 gap-2">
                  <input type="number" value={post.likes} onChange={(e) => updatePost(index, "likes", e.target.value)} placeholder="좋아요" className="block w-full rounded-lg border border-gray-200 px-2 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                  <input type="number" value={post.comments} onChange={(e) => updatePost(index, "comments", e.target.value)} placeholder="댓글" className="block w-full rounded-lg border border-gray-200 px-2 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                  <input type="number" value={post.saves} onChange={(e) => updatePost(index, "saves", e.target.value)} placeholder="저장" className="block w-full rounded-lg border border-gray-200 px-2 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                  <input type="number" value={post.reach} onChange={(e) => updatePost(index, "reach", e.target.value)} placeholder="도달" className="block w-full rounded-lg border border-gray-200 px-2 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button type="submit" disabled={analyzing} className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
        {analyzing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
            AI 분석 중...
          </span>
        ) : "주간 성과 분석하기"}
      </button>
    </form>
  );
}
