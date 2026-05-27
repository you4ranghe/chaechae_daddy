"use client";

import { useState } from "react";
import type { SponsorshipAnalysis, ChecklistItem } from "@/lib/types/sponsorship";
import { CopyButton } from "./copy-button";

interface AnalysisResultProps {
  analysis: SponsorshipAnalysis;
  checklist: ChecklistItem[];
  onAccept?: () => void;
  accepting?: boolean;
}

type ResponseKey = "accept" | "negotiate" | "reject";

export function AnalysisResult({
  analysis,
  checklist,
  onAccept,
  accepting,
}: AnalysisResultProps) {
  const [activeResponse, setActiveResponse] = useState<ResponseKey>(
    recommendationToKey(analysis.score.recommendation),
  );

  return (
    <div className="space-y-5">
      {/* AI 추천 점수 — 가장 눈에 띄게 위로 */}
      <ScoreCard
        score={analysis.score.value}
        recommendation={analysis.score.recommendation}
        reasoning={analysis.score.reasoning}
      />

      {/* 브랜드 / 제품 / 업종 */}
      <SectionCard
        icon={<BuildingIcon className="h-4 w-4" />}
        title="브랜드 정보"
        tone="indigo"
      >
        <div className="grid grid-cols-3 gap-3">
          <InfoBlock label="브랜드" value={analysis.brand.name} />
          <InfoBlock label="제품" value={analysis.brand.product} />
          <InfoBlock label="업종" value={analysis.brand.industry} />
        </div>
      </SectionCard>

      {/* 조건 요약 */}
      <SectionCard
        icon={<DocIcon className="h-4 w-4" />}
        title="협찬 조건"
        tone="purple"
      >
        <div className="flex flex-wrap gap-2">
          <ConditionChip type={analysis.conditions.type} variant="primary" />
          <ConditionChip type={analysis.conditions.payment} variant="default" icon={<WonIcon className="h-3 w-3" />} />
          {analysis.conditions.deadline !== "미정" && (
            <ConditionChip
              type={`마감 ${analysis.conditions.deadline}`}
              variant="default"
              icon={<CalendarIcon className="h-3 w-3" />}
            />
          )}
        </div>
        {analysis.conditions.requirements.length > 0 && (
          <ul className="mt-4 space-y-2 border-t border-gray-100 pt-4">
            {analysis.conditions.requirements.map((req, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="mt-1.5 inline-flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gradient-to-br from-pink-500 to-rose-500" />
                <span className="leading-relaxed">{req}</span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {/* 장단점 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <ProsConsCard
          tone="emerald"
          icon={<ThumbsUpIcon className="h-4 w-4" />}
          title="장점"
          items={analysis.pros}
          itemPrefix={<CheckIcon className="h-3.5 w-3.5 text-emerald-500" />}
        />
        <ProsConsCard
          tone="rose"
          icon={<ThumbsDownIcon className="h-4 w-4" />}
          title="주의할 점"
          items={analysis.cons}
          itemPrefix={<XIcon className="h-3.5 w-3.5 text-rose-500" />}
        />
      </div>

      {/* 응답 초안 */}
      <SectionCard
        icon={<ChatIcon className="h-4 w-4" />}
        title="응답 초안"
        tone="amber"
      >
        {/* 응답 종류 탭 */}
        <div className="flex gap-1 rounded-xl bg-gray-50 p-1">
          {(
            [
              { key: "accept" as const, label: "수락", color: "emerald" },
              { key: "negotiate" as const, label: "협상", color: "amber" },
              { key: "reject" as const, label: "거절", color: "rose" },
            ]
          ).map((r) => {
            const isActive = activeResponse === r.key;
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => setActiveResponse(r.key)}
                className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? r.color === "emerald"
                      ? "bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-100"
                      : r.color === "amber"
                        ? "bg-white text-amber-700 shadow-sm ring-1 ring-amber-100"
                        : "bg-white text-rose-700 shadow-sm ring-1 ring-rose-100"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50/60 p-4">
          <div className="flex items-center justify-end">
            <CopyButton text={analysis.responses[activeResponse]} label="복사" />
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
            {analysis.responses[activeResponse]}
          </p>
        </div>
      </SectionCard>

      {/* 수락 → 콘텐츠 만들기 CTA */}
      {onAccept && (
        <AcceptCTA
          checklist={checklist}
          onAccept={onAccept}
          accepting={Boolean(accepting)}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// 점수 카드 — 시각적으로 가장 강조
// ──────────────────────────────────────────────

function ScoreCard({
  score,
  recommendation,
  reasoning,
}: {
  score: number;
  recommendation: string;
  reasoning: string;
}) {
  const percent = Math.min(100, Math.max(0, score * 10));
  const tone =
    score >= 7
      ? {
          ring: "stroke-emerald-500",
          bg: "from-emerald-50 to-teal-50",
          text: "text-emerald-600",
          badge: "bg-emerald-500 text-white",
          softText: "text-emerald-700",
        }
      : score >= 4
        ? {
            ring: "stroke-amber-500",
            bg: "from-amber-50 to-orange-50",
            text: "text-amber-600",
            badge: "bg-amber-500 text-white",
            softText: "text-amber-700",
          }
        : {
            ring: "stroke-rose-500",
            bg: "from-rose-50 to-pink-50",
            text: "text-rose-600",
            badge: "bg-rose-500 text-white",
            softText: "text-rose-700",
          };

  const circumference = 2 * Math.PI * 28; // r=28
  const offset = circumference - (percent / 100) * circumference;

  return (
    <section
      className={`overflow-hidden rounded-3xl bg-gradient-to-br ${tone.bg} p-5 ring-1 ring-inset ring-white/60`}
    >
      <div className="flex items-start gap-4">
        {/* 원형 게이지 */}
        <div className="relative flex h-20 w-20 flex-shrink-0 items-center justify-center">
          <svg className="-rotate-90 transform" viewBox="0 0 64 64" width="80" height="80">
            <circle cx="32" cy="32" r="28" fill="none" stroke="white" strokeWidth="6" opacity="0.8" />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className={tone.ring}
              style={{ transition: "stroke-dashoffset 800ms ease-out" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
            <span className={`text-2xl font-bold tabular-nums ${tone.text}`}>{score}</span>
            <span className="text-[10px] font-medium text-gray-500">/ 10</span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wider text-gray-500">
              <SparkleIcon className="h-3 w-3" />
              AI 추천
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tone.badge}`}
            >
              {recommendation}
            </span>
          </div>
          <h3 className={`mt-1 text-[15px] font-bold ${tone.softText}`}>
            {scoreToLabel(score)}
          </h3>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-gray-700">
            {reasoning}
          </p>
        </div>
      </div>
    </section>
  );
}

function scoreToLabel(score: number): string {
  if (score >= 8) return "굉장히 매력적인 협찬이에요";
  if (score >= 6) return "괜찮은 협찬이에요";
  if (score >= 4) return "조건 협의가 필요해요";
  return "신중하게 검토해 보세요";
}

function recommendationToKey(rec: string): ResponseKey {
  if (rec === "수락") return "accept";
  if (rec === "거절") return "reject";
  return "negotiate";
}

// ──────────────────────────────────────────────
// 섹션 카드 — 공통 래퍼
// ──────────────────────────────────────────────

const SECTION_TONE: Record<
  "indigo" | "purple" | "amber",
  { iconBg: string; iconText: string }
> = {
  indigo: { iconBg: "bg-pink-100", iconText: "text-pink-600" },
  purple: { iconBg: "bg-rose-100", iconText: "text-rose-600" },
  amber: { iconBg: "bg-amber-100", iconText: "text-amber-600" },
};

function SectionCard({
  icon,
  title,
  tone,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  tone: keyof typeof SECTION_TONE;
  children: React.ReactNode;
}) {
  const t = SECTION_TONE[tone];
  return (
    <section className="bezel p-5">
      <div className="flex items-center gap-2">
        <span className={`flex h-6 w-6 items-center justify-center rounded-md ${t.iconBg} ${t.iconText}`}>
          {icon}
        </span>
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10.5px] font-medium uppercase tracking-wider text-gray-400">{label}</p>
      <p className="mt-0.5 truncate text-sm font-bold text-gray-900">{value}</p>
    </div>
  );
}

function ConditionChip({
  type,
  variant,
  icon,
}: {
  type: string;
  variant: "primary" | "default";
  icon?: React.ReactNode;
}) {
  if (variant === "primary") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
        {type}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 ring-1 ring-inset ring-gray-200">
      {icon}
      {type}
    </span>
  );
}

// ──────────────────────────────────────────────
// 장단점 카드
// ──────────────────────────────────────────────

function ProsConsCard({
  tone,
  icon,
  title,
  items,
  itemPrefix,
}: {
  tone: "emerald" | "rose";
  icon: React.ReactNode;
  title: string;
  items: string[];
  itemPrefix: React.ReactNode;
}) {
  const styles =
    tone === "emerald"
      ? {
          card: "border-emerald-100 bg-gradient-to-br from-emerald-50/60 to-teal-50/40",
          iconBg: "bg-emerald-100",
          iconText: "text-emerald-600",
          title: "text-emerald-700",
          itemText: "text-gray-700",
        }
      : {
          card: "border-rose-100 bg-gradient-to-br from-rose-50/60 to-pink-50/40",
          iconBg: "bg-rose-100",
          iconText: "text-rose-600",
          title: "text-rose-700",
          itemText: "text-gray-700",
        };

  return (
    <section className={`rounded-2xl border p-5 ${styles.card}`}>
      <div className="flex items-center gap-2">
        <span className={`flex h-6 w-6 items-center justify-center rounded-md ${styles.iconBg} ${styles.iconText}`}>
          {icon}
        </span>
        <h3 className={`text-sm font-bold ${styles.title}`}>{title}</h3>
        <span className="ml-auto text-[10.5px] font-semibold text-gray-400 tabular-nums">
          {items.length}개
        </span>
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((item, i) => (
          <li key={i} className={`flex items-start gap-2 text-sm leading-relaxed ${styles.itemText}`}>
            <span className="mt-0.5 flex-shrink-0">{itemPrefix}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ──────────────────────────────────────────────
// 수락 CTA
// ──────────────────────────────────────────────

function AcceptCTA({
  checklist,
  onAccept,
  accepting,
}: {
  checklist: ChecklistItem[];
  onAccept: () => void;
  accepting: boolean;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-600 via-pink-600 to-rose-600 p-6 text-white shadow-xl shadow-pink-500/25">
      <span aria-hidden className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <span aria-hidden className="absolute -bottom-10 -right-2 h-24 w-24 rounded-full bg-pink-400/20 blur-2xl" />
      <div className="relative">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-white/90 backdrop-blur">
          <SparkleIcon className="h-3 w-3" />
          AI 콘텐츠 생성
        </div>
        <h3 className="mt-3 text-lg font-bold sm:text-xl">이 협찬을 수락하시겠어요?</h3>
        <p className="mt-1 text-sm leading-relaxed text-pink-100">
          수락하면 광고주 요구사항 체크리스트와 인스타용 콘텐츠 초안을
          <br className="hidden sm:block" /> 자동으로 만들어드려요
        </p>

        {checklist.length > 0 && (
          <div className="mt-4">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-white/70">
              체크리스트 미리보기
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {checklist.slice(0, 4).map((item) => (
                <span
                  key={item.id}
                  className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur"
                >
                  {item.text}
                </span>
              ))}
              {checklist.length > 4 && (
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/70 backdrop-blur">
                  +{checklist.length - 4}개
                </span>
              )}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onAccept}
          disabled={accepting}
          className="group mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-pink-700 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
        >
          {accepting ? (
            <>
              <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              콘텐츠 생성 중…
            </>
          ) : (
            <>
              <SparkleIcon className="h-4 w-4 transition-transform group-hover:rotate-12" />
              수락하고 콘텐츠 만들기
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="h-4 w-4 transition-transform group-hover:translate-x-0.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </>
          )}
        </button>
      </div>
    </section>
  );
}

// ─── 아이콘 ────────────────────────────────
function SparkleIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5Z" clipRule="evenodd" />
    </svg>
  );
}
function BuildingIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M3 2.25a.75.75 0 0 0 0 1.5h.75v16.5h-.75a.75.75 0 0 0 0 1.5h17.25a.75.75 0 0 0 0-1.5h-.75V3.75H21a.75.75 0 0 0 0-1.5H3ZM6.75 19.5v-2.25a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-.75.75h-3a.75.75 0 0 1-.75-.75ZM6 6.75A.75.75 0 0 1 6.75 6h.75a.75.75 0 0 1 0 1.5h-.75A.75.75 0 0 1 6 6.75ZM6.75 9a.75.75 0 0 0 0 1.5h.75a.75.75 0 0 0 0-1.5h-.75ZM6 12.75a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 0 1.5h-.75a.75.75 0 0 1-.75-.75ZM10.5 6a.75.75 0 0 0 0 1.5h.75a.75.75 0 0 0 0-1.5h-.75Zm-.75 3.75A.75.75 0 0 1 10.5 9h.75a.75.75 0 0 1 0 1.5h-.75a.75.75 0 0 1-.75-.75ZM10.5 12a.75.75 0 0 0 0 1.5h.75a.75.75 0 0 0 0-1.5h-.75ZM14.25 6a.75.75 0 0 0 0 1.5H15a.75.75 0 0 0 0-1.5h-.75Zm-.75 3.75A.75.75 0 0 1 14.25 9H15a.75.75 0 0 1 0 1.5h-.75a.75.75 0 0 1-.75-.75ZM14.25 12a.75.75 0 0 0 0 1.5H15a.75.75 0 0 0 0-1.5h-.75Zm0 3.75a.75.75 0 0 0 0 1.5H15a.75.75 0 0 0 0-1.5h-.75Z" clipRule="evenodd" />
    </svg>
  );
}
function DocIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z" clipRule="evenodd" />
      <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
    </svg>
  );
}
function ChatIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 0 0 6 21.75a6.721 6.721 0 0 0 3.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 0 1-.814 1.686.75.75 0 0 0 .44 1.223ZM8.25 10.875a1.125 1.125 0 1 0 0 2.25 1.125 1.125 0 0 0 0-2.25ZM10.875 12a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Zm4.875-1.125a1.125 1.125 0 1 0 0 2.25 1.125 1.125 0 0 0 0-2.25Z" clipRule="evenodd" />
    </svg>
  );
}
function ThumbsUpIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 0 1 6 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V3a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23h-.777ZM2.331 10.977a11.969 11.969 0 0 0-.831 4.398 12 12 0 0 0 .52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 0 1-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227Z" />
    </svg>
  );
}
function ThumbsDownIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M15.73 5.25h1.035A7.465 7.465 0 0 1 18 9.375a7.465 7.465 0 0 1-1.235 4.125h-.148c-.806 0-1.534.446-2.031 1.08a9.04 9.04 0 0 1-2.861 2.4c-.723.384-1.35.956-1.653 1.715a4.499 4.499 0 0 0-.322 1.672V21a.75.75 0 0 1-.75.75 2.25 2.25 0 0 1-2.25-2.25c0-1.152.26-2.243.723-3.218.266-.558-.107-1.282-.725-1.282H3.622c-1.026 0-1.945-.694-2.054-1.715A12.137 12.137 0 0 1 1.5 12c0-2.848.992-5.464 2.649-7.521C4.537 3.997 5.136 3.75 5.754 3.75h4.305c.483 0 .964.078 1.423.23l3.114 1.04c.46.153.94.23 1.423.23Zm5.939 8.523c.536-1.362.831-2.845.831-4.398 0-1.22-.182-2.398-.52-3.507-.26-.85-1.084-1.368-1.973-1.368H19.1c-.445 0-.72.498-.523.898.591 1.2.924 2.55.924 3.977a8.958 8.958 0 0 1-1.302 4.666c-.245.403.028.959.5.959h1.053c.832 0 1.612-.453 1.918-1.227Z" />
    </svg>
  );
}
function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
    </svg>
  );
}
function XIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
    </svg>
  );
}
function WonIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M3.5 4h2.7l1.6 6.5L9.4 4h2.6l1.6 6.5L15.2 4h2.7l-3 11h-2.6l-1.5-6-1.5 6H6.7L3.5 4Z" />
    </svg>
  );
}
function CalendarIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z" clipRule="evenodd" />
    </svg>
  );
}
