"use client";

import { useState } from "react";

const CATEGORY_OPTIONS = [
  "육아", "뷰티", "패션", "푸드", "라이프스타일",
  "여행", "인테리어", "교육", "건강", "반려동물",
];

interface ProfileFormProps {
  initialData: {
    instagramHandle: string;
    followerCount: number;
    categories: string[];
    email: string;
    plan: string;
  };
}

const PLAN_NAMES: Record<string, string> = {
  free_trial: "무료 체험",
  starter: "스타터",
  growth: "그로스",
  business: "비즈니스",
};

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [handle, setHandle] = useState(initialData.instagramHandle);
  const [followerCount, setFollowerCount] = useState(
    initialData.followerCount > 0 ? String(initialData.followerCount) : ""
  );
  const [categories, setCategories] = useState<string[]>(initialData.categories);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function toggleCategory(cat: string) {
    setCategories(function (prev) {
      if (prev.includes(cat)) {
        return prev.filter(function (c) { return c !== cat; });
      }
      if (prev.length >= 5) return prev;
      return [...prev, cat];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instagramHandle: handle.trim().replace(/^@/, ""),
          followerCount: parseInt(followerCount) || 0,
          categories,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "저장에 실패했습니다." });
        return;
      }

      setMessage({ type: "success", text: "프로필이 저장되었습니다." });
    } catch {
      setMessage({ type: "error", text: "네트워크 오류가 발생했습니다." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 메시지 */}
      {message && (
        <div className={`rounded-lg px-4 py-3 text-sm ${
          message.type === "success"
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : "bg-red-50 text-red-600 border border-red-200"
        }`}>
          {message.text}
        </div>
      )}

      {/* 계정 정보 (읽기 전용) */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-gray-900">계정 정보</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs text-gray-400">이메일</label>
            <p className="mt-1 text-sm text-gray-700">{initialData.email}</p>
          </div>
          <div>
            <label className="block text-xs text-gray-400">플랜</label>
            <p className="mt-1 text-sm text-gray-700">
              {PLAN_NAMES[initialData.plan] || initialData.plan}
            </p>
          </div>
        </div>
      </div>

      {/* 인스타그램 정보 */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-gray-900">인스타그램 정보</h2>
        <p className="mt-1 text-xs text-gray-400">
          AI가 협찬 분석과 콘텐츠 생성 시 참고합니다
        </p>

        <div className="mt-4 space-y-4">
          {/* 핸들 */}
          <div>
            <label htmlFor="handle" className="block text-sm font-medium text-gray-700">
              인스타그램 핸들
            </label>
            <div className="mt-1 flex rounded-lg border border-gray-300 shadow-sm focus-within:border-pink-500 focus-within:ring-2 focus-within:ring-pink-500/20">
              <span className="inline-flex items-center px-3 text-sm text-gray-400">@</span>
              <input
                id="handle"
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="chaewon_mom"
                className="flex-1 rounded-r-lg border-0 px-0 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
              />
            </div>
          </div>

          {/* 팔로워 수 */}
          <div>
            <label htmlFor="followers" className="block text-sm font-medium text-gray-700">
              팔로워 수
            </label>
            <input
              id="followers"
              type="number"
              value={followerCount}
              onChange={(e) => setFollowerCount(e.target.value)}
              placeholder="2000"
              min="0"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 focus:outline-none"
            />
          </div>

          {/* 카테고리 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              카테고리 (최대 5개)
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map(function (cat) {
                const selected = categories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      selected
                        ? "bg-pink-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
            {categories.length > 0 && (
              <p className="mt-2 text-xs text-gray-400">
                선택됨: {categories.join(", ")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 저장 버튼 */}
      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-pink-600 px-6 py-3 text-sm font-semibold text-white hover:bg-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? "저장 중..." : "프로필 저장"}
      </button>
    </form>
  );
}
