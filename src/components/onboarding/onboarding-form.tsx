"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = ["육아", "뷰티", "패션", "푸드", "라이프스타일"] as const;

interface OnboardingFormProps {
  defaultHandle: string;
  defaultFollowers: number;
  defaultCategories: string[];
}

export function OnboardingForm({
  defaultHandle,
  defaultFollowers,
  defaultCategories,
}: OnboardingFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [instagramHandle, setInstagramHandle] = useState(defaultHandle);
  const [followerCount, setFollowerCount] = useState(
    defaultFollowers ? String(defaultFollowers) : ""
  );
  const [selectedCategories, setSelectedCategories] =
    useState<string[]>(defaultCategories);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function toggleCategory(category: string) {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : prev.length < 5
          ? [...prev, category]
          : prev
    );
  }

  function handleNext() {
    setError("");
    if (step === 1 && !instagramHandle.trim()) {
      setError("인스타그램 핸들을 입력해주세요.");
      return;
    }
    if (step === 2 && selectedCategories.length === 0) {
      setError("카테고리를 최소 1개 이상 선택해주세요.");
      return;
    }
    setStep((s) => s + 1);
  }

  function handleBack() {
    setError("");
    setStep((s) => s - 1);
  }

  async function handleSubmit() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instagramHandle: instagramHandle.replace("@", ""),
          followerCount: parseInt(followerCount) || 0,
          categories: selectedCategories,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "저장에 실패했습니다.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
      {/* 진행 바 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                s <= step
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {s}
            </div>
          ))}
        </div>
        <div className="relative h-1 bg-gray-100 rounded-full">
          <div
            className="absolute h-1 bg-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Step 1: 인스타그램 핸들 + 팔로워 */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              인스타그램 정보
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              협찬 분석에 활용되는 기본 정보예요
            </p>
          </div>

          <div>
            <label
              htmlFor="instagram"
              className="block text-sm font-medium text-gray-700"
            >
              인스타그램 핸들
            </label>
            <div className="mt-1.5 flex rounded-lg border border-gray-300 shadow-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
              <span className="flex items-center pl-3.5 text-gray-400 text-sm">
                @
              </span>
              <input
                id="instagram"
                type="text"
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value)}
                placeholder="your_handle"
                className="block w-full rounded-r-lg border-0 px-2 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="followers"
              className="block text-sm font-medium text-gray-700"
            >
              팔로워 수
            </label>
            <input
              id="followers"
              type="number"
              min="0"
              value={followerCount}
              onChange={(e) => setFollowerCount(e.target.value)}
              placeholder="예: 15000"
              className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Step 2: 카테고리 선택 */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              콘텐츠 카테고리
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              주로 다루는 카테고리를 선택해주세요 (최대 5개)
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => toggleCategory(category)}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                  selectedCategories.includes(category)
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {selectedCategories.length > 0 && (
            <p className="text-xs text-gray-400">
              {selectedCategories.length}개 선택됨
            </p>
          )}
        </div>
      )}

      {/* Step 3: 확인 */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              설정 확인
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              입력한 정보를 확인해주세요
            </p>
          </div>

          <div className="space-y-3 rounded-lg bg-gray-50 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">인스타그램</span>
              <span className="font-medium text-gray-900">
                @{instagramHandle.replace("@", "")}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">팔로워</span>
              <span className="font-medium text-gray-900">
                {parseInt(followerCount) ? parseInt(followerCount).toLocaleString() : "0"}명
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">카테고리</span>
              <span className="font-medium text-gray-900">
                {selectedCategories.join(", ")}
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-indigo-50 p-4">
            <p className="text-sm text-indigo-700">
              7일 무료 체험이 시작됩니다. 체험 기간 동안 모든 기능을 이용할 수
              있어요.
            </p>
          </div>
        </div>
      )}

      {/* 버튼 영역 */}
      <div className="mt-8 flex gap-3">
        {step > 1 && (
          <button
            type="button"
            onClick={handleBack}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            이전
          </button>
        )}

        {step < 3 ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
          >
            다음
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            {loading ? "저장 중..." : "시작하기"}
          </button>
        )}
      </div>
    </div>
  );
}
