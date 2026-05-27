"use client";

import { useState } from "react";
import type { ChecklistItem, GeneratedContent, SponsorshipAnalysis } from "@/lib/types/sponsorship";
import { CopyButton } from "./copy-button";
import { PlatformLauncher } from "./platform-launcher";
import { CaptionVariants } from "./caption-variants";

interface ContentResultProps {
  checklist: ChecklistItem[];
  content: GeneratedContent;
  brandName?: string;
  sponsorshipId?: string;
  analysis?: SponsorshipAnalysis | null;
}

export function ContentResult({
  checklist,
  content,
  brandName,
  sponsorshipId,
  analysis,
}: ContentResultProps) {
  const [items, setItems] = useState(checklist);

  function toggleItem(id: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item,
      ),
    );
  }

  const completedCount = items.filter((i) => i.checked).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const allDone = totalCount > 0 && completedCount === totalCount;

  const hashtagText = content.hashtags
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
    .join(" ");

  return (
    <div className="space-y-4">
      {/* 체크리스트 */}
      <section className="bezel overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-pink-50/40 to-rose-50/40 px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-pink-100 text-pink-600">
              <ChecklistIcon className="h-3.5 w-3.5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-gray-900">광고주 요구사항</h3>
              <p className="text-[10.5px] text-gray-500">포스팅 전에 확인해주세요</p>
            </div>
          </div>
          <span
            className={`tabular-nums rounded-full px-2.5 py-1 text-[11px] font-bold ${
              allDone
                ? "bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {completedCount}/{totalCount}
          </span>
        </div>

        {/* 프로그레스 */}
        <div className="h-1 w-full overflow-hidden bg-gray-100">
          <div
            className={`h-full transition-[width] duration-500 ${
              allDone
                ? "bg-gradient-to-r from-emerald-400 to-teal-400"
                : "bg-gradient-to-r from-pink-400 to-rose-400"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <ul className="divide-y divide-gray-50">
          {items.map((item) => (
            <li key={item.id}>
              <label className="group flex cursor-pointer items-start gap-3 px-5 py-3 transition-colors hover:bg-gray-50">
                <span
                  className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                    item.checked
                      ? "border-emerald-500 bg-emerald-500"
                      : "border-gray-300 bg-white group-hover:border-pink-400"
                  }`}
                >
                  {item.checked && (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="h-3 w-3 text-white">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  )}
                </span>
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => toggleItem(item.id)}
                  className="sr-only"
                />
                <span
                  className={`text-sm leading-relaxed transition-all ${
                    item.checked
                      ? "text-gray-400 line-through"
                      : "text-gray-700"
                  }`}
                >
                  {item.text}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      {/* 캡션 */}
      <section className="bezel overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-pink-50/40 to-rose-50/40 px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-pink-100 text-pink-600">
              <CaptionIcon className="h-3.5 w-3.5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-gray-900">캡션</h3>
              <p className="text-[10.5px] text-gray-500">
                {content.caption.length}자 · 인스타 본문에 그대로 붙여넣기
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {sponsorshipId && analysis && (
              <CaptionVariants
                sponsorshipId={sponsorshipId}
                analysis={analysis}
                checklist={checklist}
              />
            )}
            <CopyButton text={content.caption} label="복사" />
          </div>
        </div>
        <div className="p-5">
          <div className="rounded-xl bg-gray-50 p-4 ring-1 ring-inset ring-gray-100">
            <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-gray-800">
              {content.caption}
            </p>
          </div>
        </div>
      </section>

      {/* 해시태그 */}
      <section className="bezel overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-amber-50/40 to-orange-50/40 px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-100 text-amber-600">
              <HashIcon className="h-3.5 w-3.5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-gray-900">해시태그</h3>
              <p className="text-[10.5px] text-gray-500">
                총 {content.hashtags.length}개 · 첫 댓글에 붙여넣기 추천
              </p>
            </div>
          </div>
          <CopyButton text={hashtagText} label="복사" />
        </div>
        <div className="p-5">
          <div className="flex flex-wrap gap-1.5">
            {content.hashtags.map((tag, i) => {
              const display = tag.startsWith("#") ? tag : `#${tag}`;
              return (
                <span
                  key={i}
                  className="inline-flex items-center rounded-full bg-gradient-to-br from-pink-50 to-rose-50 px-2.5 py-1 text-[12px] font-semibold text-pink-700 ring-1 ring-inset ring-pink-100 transition-colors hover:from-pink-100 hover:to-rose-100"
                >
                  {display}
                </span>
              );
            })}
          </div>
        </div>
      </section>

      {/* 플랫폼 런처 — 포스팅하러 가기 */}
      <PlatformLauncher
        caption={content.caption}
        hashtags={content.hashtags}
        brandName={brandName}
      />

      {/* 완료 안내 */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-5 ring-1 ring-inset ring-emerald-100">
        <span aria-hidden className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-200/40 blur-2xl" />
        <div className="relative flex items-start gap-3">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/30">
            <SparkleIcon className="h-4 w-4 text-white" />
          </span>
          <div>
            <p className="text-sm font-bold text-emerald-900">콘텐츠 준비 완료!</p>
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-emerald-700">
              체크리스트를 확인한 뒤 캡션과 해시태그를 인스타에 올려보세요.
              모두 체크되면 완료 처리할 수 있어요.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── 아이콘 ────────────────────────────────
function ChecklistIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M2.625 6.75a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Zm4.875 0A.75.75 0 0 1 8.25 6h12a.75.75 0 0 1 0 1.5h-12a.75.75 0 0 1-.75-.75ZM2.625 12a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0ZM7.5 12a.75.75 0 0 1 .75-.75h12a.75.75 0 0 1 0 1.5h-12A.75.75 0 0 1 7.5 12Zm-4.875 5.25a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Zm4.875 0a.75.75 0 0 1 .75-.75h12a.75.75 0 0 1 0 1.5h-12a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
    </svg>
  );
}
function CaptionIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32L19.513 8.2Z" />
    </svg>
  );
}
function HashIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M11.097 1.515a.75.75 0 0 1 .589.882L10.666 7.5h4.47l1.079-5.397a.75.75 0 1 1 1.47.294L16.665 7.5h3.585a.75.75 0 0 1 0 1.5h-3.885l-1.2 6h3.585a.75.75 0 0 1 0 1.5h-3.885l-1.08 5.397a.75.75 0 1 1-1.47-.294l1.02-5.103h-4.47l-1.08 5.397a.75.75 0 1 1-1.47-.294l1.02-5.103H3.75a.75.75 0 0 1 0-1.5h3.885l1.2-6H5.25a.75.75 0 0 1 0-1.5h3.885l1.08-5.397a.75.75 0 0 1 .882-.588ZM10.365 9l-1.2 6h4.47l1.2-6h-4.47Z" clipRule="evenodd" />
    </svg>
  );
}
function SparkleIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5Z" clipRule="evenodd" />
    </svg>
  );
}
