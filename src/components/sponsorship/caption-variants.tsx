"use client";

import { useState } from "react";
import type { GeneratedContent, SponsorshipAnalysis, ChecklistItem } from "@/lib/types/sponsorship";
import { CopyButton } from "./copy-button";

type ToneKey = "friendly" | "professional" | "emotional";

const TONE_META: Record<ToneKey, { label: string; emoji: string; color: string; bg: string; ring: string; desc: string }> = {
  friendly: {
    label: "친근",
    emoji: "💬",
    color: "text-rose-700",
    bg: "bg-gradient-to-br from-rose-50 to-pink-50",
    ring: "ring-rose-200",
    desc: "솔직한 선배맘 느낌",
  },
  professional: {
    label: "전문",
    emoji: "📋",
    color: "text-indigo-700",
    bg: "bg-gradient-to-br from-indigo-50 to-blue-50",
    ring: "ring-indigo-200",
    desc: "차분한 리뷰어 톤",
  },
  emotional: {
    label: "감성",
    emoji: "🌿",
    color: "text-emerald-700",
    bg: "bg-gradient-to-br from-emerald-50 to-teal-50",
    ring: "ring-emerald-200",
    desc: "잔잔한 에세이 톤",
  },
};

interface CaptionVariantsProps {
  sponsorshipId: string;
  analysis: SponsorshipAnalysis;
  checklist: ChecklistItem[];
}

interface Variant {
  tone: ToneKey;
  content: GeneratedContent | null;
  error?: string;
}

export function CaptionVariants({ sponsorshipId, analysis, checklist }: CaptionVariantsProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState<Variant[] | null>(null);
  const [active, setActive] = useState<ToneKey>("friendly");
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setVariants(null);
    try {
      const res = await fetch("/api/agent/content/variants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sponsorshipId, analysis, checklist }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "변형 생성에 실패했어요.");
        return;
      }
      setVariants(data.variants);
      const firstOk = (data.variants as Variant[]).find((v) => v.content);
      if (firstOk) setActive(firstOk.tone);
    } catch {
      setError("네트워크 오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  }

  const activeVariant = variants?.find((v) => v.tone === active);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          if (!variants) handleGenerate();
        }}
        className="group inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-bold text-indigo-700 transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-sm"
      >
        <SparkleIcon className="h-3.5 w-3.5" />
        다른 톤도 비교
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal>
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-3xl sm:rounded-3xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/95 px-5 py-4 backdrop-blur">
              <div>
                <h2 className="text-sm font-bold text-gray-900">캡션 A/B/C 비교</h2>
                <p className="text-[11px] text-gray-500">친근 · 전문 · 감성 톤으로 3개 동시 생성</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                aria-label="닫기"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              {/* 톤 탭 */}
              <div className="flex gap-2">
                {(Object.keys(TONE_META) as ToneKey[]).map((t) => {
                  const meta = TONE_META[t];
                  const isActive = active === t;
                  const v = variants?.find((x) => x.tone === t);
                  const ready = !!v?.content;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setActive(t)}
                      className={`flex-1 rounded-2xl px-3 py-2.5 text-left transition-all ${
                        isActive
                          ? `${meta.bg} ring-2 ring-inset ${meta.ring} shadow-sm`
                          : "bg-gray-50 ring-1 ring-inset ring-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{meta.emoji}</span>
                        <span className={`text-sm font-bold ${isActive ? meta.color : "text-gray-700"}`}>
                          {meta.label}
                        </span>
                        {ready && (
                          <span className="ml-auto inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        )}
                        {loading && !ready && (
                          <span className="ml-auto inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-gray-300" />
                        )}
                      </div>
                      <p className={`mt-0.5 text-[11px] ${isActive ? meta.color : "text-gray-500"}`}>{meta.desc}</p>
                    </button>
                  );
                })}
              </div>

              {/* 본문 */}
              <div className="mt-5">
                {loading && !variants && (
                  <div className="space-y-3">
                    <SkeletonBlock />
                    <SkeletonBlock />
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-[12.5px] text-rose-700 ring-1 ring-inset ring-rose-100">
                    {error}
                  </div>
                )}

                {activeVariant?.content && (
                  <div className="space-y-4">
                    <section>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-bold text-gray-700">
                          캡션 · {activeVariant.content.caption.length}자
                        </p>
                        <CopyButton text={activeVariant.content.caption} label="복사" />
                      </div>
                      <div className="rounded-xl bg-gray-50 p-4 ring-1 ring-inset ring-gray-100">
                        <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-gray-800">
                          {activeVariant.content.caption}
                        </p>
                      </div>
                    </section>

                    <section>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-bold text-gray-700">
                          해시태그 · {activeVariant.content.hashtags.length}개
                        </p>
                        <CopyButton
                          text={activeVariant.content.hashtags
                            .map((h) => (h.startsWith("#") ? h : `#${h}`))
                            .join(" ")}
                          label="복사"
                        />
                      </div>
                      <div className="flex flex-wrap gap-1.5 rounded-xl bg-gray-50 p-3 ring-1 ring-inset ring-gray-100">
                        {activeVariant.content.hashtags.map((tag, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[11.5px] font-semibold text-gray-700 ring-1 ring-inset ring-gray-200"
                          >
                            {tag.startsWith("#") ? tag : `#${tag}`}
                          </span>
                        ))}
                      </div>
                    </section>
                  </div>
                )}

                {activeVariant?.error && !activeVariant.content && (
                  <div className="rounded-xl bg-amber-50 px-3 py-2.5 text-[12.5px] text-amber-800 ring-1 ring-inset ring-amber-100">
                    이 톤은 생성에 실패했어요: {activeVariant.error}
                  </div>
                )}
              </div>

              {/* 재생성 */}
              {!loading && variants && (
                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={handleGenerate}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    <RefreshIcon className="h-3.5 w-3.5" />
                    다시 생성
                  </button>
                </div>
              )}
            </div>

            <p className="border-t border-gray-100 px-5 py-3 text-center text-[10.5px] text-gray-400">
              A/B 변형 1회 = 에이전트 사용량 3회 (톤 3종)
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function SkeletonBlock() {
  return (
    <div className="space-y-2 rounded-xl bg-gray-50 p-4">
      <div className="h-3 w-1/3 animate-pulse rounded-full bg-gray-200" />
      <div className="h-3 w-full animate-pulse rounded-full bg-gray-200" />
      <div className="h-3 w-5/6 animate-pulse rounded-full bg-gray-200" />
      <div className="h-3 w-2/3 animate-pulse rounded-full bg-gray-200" />
    </div>
  );
}

function SparkleIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5Z" clipRule="evenodd" />
    </svg>
  );
}

function CloseIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

function RefreshIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  );
}
