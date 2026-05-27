"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { MomsUpIcon } from "@/components/ui/momsup-icon";

// ──────────────────────────────────────────────
// 메뉴 정의
// ──────────────────────────────────────────────

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "워크스페이스",
    items: [
      { href: "/dashboard", label: "대시보드", icon: <HomeIcon /> },
      { href: "/dashboard/sponsorships", label: "협찬 관리", icon: <BriefcaseIcon /> },
    ],
  },
  {
    label: "AI 도구",
    items: [
      { href: "/dashboard/hashtags", label: "해시태그", icon: <HashtagIcon /> },
      { href: "/dashboard/content-plan", label: "콘텐츠 플래너", icon: <CalendarIcon /> },
      { href: "/dashboard/analytics", label: "성과 분석", icon: <ChartPieIcon /> },
      { href: "/dashboard/insights", label: "인사이트", icon: <LightBulbIcon /> },
      { href: "/dashboard/calculator", label: "정산 계산기", icon: <CalculatorIcon /> },
    ],
  },
  {
    label: "관리",
    items: [
      { href: "/dashboard/usage", label: "사용량", icon: <ChartBarIcon /> },
      { href: "/dashboard/team", label: "팀", icon: <UsersIcon /> },
      { href: "/dashboard/settings", label: "설정", icon: <CogIcon /> },
    ],
  },
];

// 모바일 바텀 탭에 노출할 핵심 5개
const MOBILE_BOTTOM_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "홈", icon: <HomeIcon /> },
  { href: "/dashboard/sponsorships", label: "협찬", icon: <BriefcaseIcon /> },
  { href: "/dashboard/content-plan", label: "플래너", icon: <CalendarIcon /> },
  { href: "/dashboard/usage", label: "사용량", icon: <ChartBarIcon /> },
];

const PLAN_INFO: Record<
  string,
  { name: string; badge: string; gradient: string; accent: string }
> = {
  free_trial: {
    name: "무료 체험",
    badge: "TRIAL",
    gradient: "from-amber-400 to-rose-400",
    accent: "text-amber-700",
  },
  starter: {
    name: "스타터",
    badge: "STARTER",
    gradient: "from-pink-400 to-rose-400",
    accent: "text-pink-700",
  },
  growth: {
    name: "그로스",
    badge: "GROWTH",
    gradient: "from-rose-400 to-pink-500",
    accent: "text-rose-600",
  },
  business: {
    name: "비즈니스",
    badge: "PRO",
    gradient: "from-gray-800 to-gray-900",
    accent: "text-gray-900",
  },
};

// ──────────────────────────────────────────────
// 컴포넌트
// ──────────────────────────────────────────────

interface SidebarProps {
  instagramHandle: string;
  plan: string;
  /** 서버에서 계산해 전달 (free_trial 일 때만 의미 있음). null이면 비표시 */
  trialDaysLeft: number | null;
  email: string;
}

export function Sidebar({
  instagramHandle,
  plan,
  trialDaysLeft,
  email,
}: SidebarProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const planInfo = PLAN_INFO[plan] || PLAN_INFO.free_trial;

  function isActive(href: string) {
    return href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
  }

  return (
    <>
      {/* ─────────── 데스크톱 사이드바 ─────────── */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:z-30 bg-white/80 backdrop-blur-xl shadow-[1px_0_0_0_var(--hairline),0_8px_32px_-8px_rgb(244_63_125_/_0.06)]">
        {/* 로고 영역 */}
        <div className="flex h-16 items-center justify-between border-b border-gray-100 px-5">
          <Link href="/dashboard" className="flex items-center gap-2 transition-spring hover:opacity-80">
            <MomsUpIcon className="h-8 w-8" />
            <span className="text-[15px] font-bold tracking-tight text-gray-900">
              MomsUp
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-md bg-gradient-to-br ${planInfo.gradient} px-1.5 py-0.5 text-[9px] font-black tracking-wider text-white shadow-[0_2px_6px_-2px_rgb(244_63_125_/_0.4)]`}
            >
              {planInfo.badge}
            </span>
            <ThemeToggle />
          </div>
        </div>

        {/* 네비게이션 */}
        <nav className="flex-1 overflow-y-auto px-3 pt-5 pb-3">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-6 last:mb-0">
              <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition-spring ${
                          active
                            ? "bg-gradient-to-r from-pink-50 to-rose-50 text-pink-700 shadow-[inset_0_0_0_1px_rgb(244_63_125_/_0.15)]"
                            : "text-gray-600 hover:bg-pink-50/60 hover:text-pink-700 hover:translate-x-0.5"
                        }`}
                      >
                        {/* 활성 표시 좌측 바 */}
                        <span
                          className={`absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r-full transition-spring ${
                            active
                              ? "bg-gradient-to-b from-pink-400 to-rose-500"
                              : "bg-transparent group-hover:bg-pink-200"
                          }`}
                        />
                        <span
                          className={`flex h-5 w-5 items-center justify-center transition-transform ${
                            active
                              ? "text-pink-600"
                              : "text-gray-400 group-hover:text-pink-500"
                          }`}
                        >
                          {item.icon}
                        </span>
                        <span className="flex-1 truncate">{item.label}</span>
                        {active && (
                          <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 shadow-[0_0_8px_rgb(244_63_125_/_0.5)]" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* 하단 유저 카드 */}
        <div className="border-t border-gray-100 p-3">
          {plan === "free_trial" && trialDaysLeft !== null && trialDaysLeft <= 7 && (
            <Link
              href="/pricing"
              className="mb-2.5 block rounded-2xl cta-gradient p-3 text-white transition-spring magnetic"
            >
              <div className="flex items-center gap-2">
                <CrownIcon className="h-4 w-4" />
                <span className="text-xs font-bold">
                  {trialDaysLeft === 0
                    ? "체험 종료"
                    : `체험 D-${trialDaysLeft}`}
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-snug text-pink-100">
                업그레이드하고 매달 100회 이상 사용하세요
              </p>
            </Link>
          )}

          <div className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-br from-pink-50/60 to-rose-50/60 px-2.5 py-2 ring-1 ring-inset ring-pink-100/60">
            <div
              className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${planInfo.gradient} text-xs font-bold text-white shadow-[0_2px_8px_-2px_rgb(244_63_125_/_0.4)]`}
              aria-hidden
            >
              {instagramHandle.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-bold text-gray-900">
                @{instagramHandle}
              </p>
              <p className={`truncate text-[10.5px] font-semibold ${planInfo.accent}`}>
                {planInfo.name} 플랜
              </p>
            </div>
            <Link
              href="/dashboard/settings"
              className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 transition-snap hover:bg-white hover:text-pink-600 hover:shadow-sm"
              aria-label="설정"
            >
              <CogIcon className="h-4 w-4" />
            </Link>
          </div>
          {email && (
            <p className="mt-1.5 px-1 text-[10px] text-gray-400 truncate">{email}</p>
          )}
        </div>
      </aside>

      {/* ─────────── 모바일 상단 바 ─────────── */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between glass-nav px-4 md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <MomsUpIcon className="h-7 w-7" />
          <span className="text-sm font-bold tracking-tight text-gray-900">MomsUp</span>
          <span
            className={`rounded-md bg-gradient-to-br ${planInfo.gradient} px-1.5 py-0.5 text-[9px] font-black tracking-wider text-white shadow-[0_2px_6px_-2px_rgb(244_63_125_/_0.4)]`}
          >
            {planInfo.badge}
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="rounded-lg p-2 text-gray-500 transition-snap hover:bg-pink-50 hover:text-pink-700"
            aria-label="메뉴 열기"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* ─────────── 모바일 바텀 탭 ─────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 glass-nav md:hidden">
        <div className="grid grid-cols-5">
          {MOBILE_BOTTOM_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-semibold transition-snap ${
                  active ? "text-pink-600" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <span className="h-5 w-5">{item.icon}</span>
                <span>{item.label}</span>
                {active && (
                  <span className="absolute top-0 h-0.5 w-8 rounded-b-full bg-gradient-to-r from-pink-400 to-rose-500" />
                )}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-semibold text-gray-400 transition-snap hover:text-gray-600"
          >
            <span className="h-5 w-5">
              <DotsIcon />
            </span>
            <span>더보기</span>
          </button>
        </div>
      </nav>

      {/* ─────────── 모바일 더보기 시트 ─────────── */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal>
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl animate-fade-up">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200" />
            {/* 유저 영역 */}
            <div className="mb-5 flex items-center gap-3 rounded-2xl bg-gradient-to-br from-pink-50/60 to-rose-50/60 p-3.5 ring-1 ring-inset ring-pink-100/60">
              <div
                className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${planInfo.gradient} text-sm font-bold text-white shadow-sm`}
                aria-hidden
              >
                {instagramHandle.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-gray-900">
                  @{instagramHandle}
                </p>
                <p className={`truncate text-xs font-semibold ${planInfo.accent}`}>
                  {planInfo.name} 플랜
                  {plan === "free_trial" &&
                    trialDaysLeft !== null &&
                    ` · D-${trialDaysLeft}`}
                </p>
              </div>
              {plan === "free_trial" && (
                <Link
                  href="/pricing"
                  onClick={() => setMoreOpen(false)}
                  className="flex-shrink-0 rounded-xl cta-gradient px-3 py-2 text-xs font-bold text-white"
                >
                  업그레이드
                </Link>
              )}
            </div>

            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="mb-4 last:mb-0">
                <p className="px-1 pb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                  {group.label}
                </p>
                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setMoreOpen(false)}
                          className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition-snap ${
                            active
                              ? "bg-gradient-to-r from-pink-50 to-rose-50 text-pink-700"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <span
                            className={`flex h-5 w-5 items-center justify-center ${
                              active ? "text-pink-600" : "text-gray-400"
                            }`}
                          >
                            {item.icon}
                          </span>
                          <span className="flex-1">{item.label}</span>
                          {active && (
                            <span className="h-1.5 w-1.5 rounded-full bg-pink-500" />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setMoreOpen(false)}
              className="mt-2 w-full rounded-2xl bg-gray-50 py-3 text-sm font-semibold text-gray-700 transition-snap hover:bg-gray-100"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ──────────────────────────────────────────────
// 아이콘 — Heroicons (solid)
// ──────────────────────────────────────────────

function HomeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
      <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
    </svg>
  );
}
function BriefcaseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path fillRule="evenodd" d="M7.5 5.25a3 3 0 0 1 3-3h3a3 3 0 0 1 3 3v.205c.933.085 1.857.197 2.774.334 1.454.218 2.476 1.483 2.476 2.917v3.033c0 1.211-.734 2.352-1.936 2.752A24.726 24.726 0 0 1 12 15.75a24.726 24.726 0 0 1-7.814-1.259c-1.202-.4-1.936-1.541-1.936-2.752V8.706c0-1.434 1.022-2.7 2.476-2.917A48.814 48.814 0 0 1 7.5 5.455V5.25Zm7.5 0v.09a49.488 49.488 0 0 0-6 0v-.09a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5Zm-3 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
      <path d="M3 18.4v-2.796a4.3 4.3 0 0 0 .713.31A26.226 26.226 0 0 0 12 17.25c2.892 0 5.68-.468 8.287-1.335.252-.084.49-.189.713-.311V18.4c0 1.452-1.047 2.728-2.523 2.923-2.12.282-4.282.427-6.477.427a49.19 49.19 0 0 1-6.477-.427C4.047 21.128 3 19.852 3 18.4Z" />
    </svg>
  );
}
function HashtagIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path fillRule="evenodd" d="M11.097 1.515a.75.75 0 0 1 .589.882L10.666 7.5h4.47l1.079-5.397a.75.75 0 1 1 1.47.294L16.665 7.5h3.585a.75.75 0 0 1 0 1.5h-3.885l-1.2 6h3.585a.75.75 0 0 1 0 1.5h-3.885l-1.08 5.397a.75.75 0 1 1-1.47-.294l1.02-5.103h-4.47l-1.08 5.397a.75.75 0 1 1-1.47-.294l1.02-5.103H3.75a.75.75 0 0 1 0-1.5h3.885l1.2-6H5.25a.75.75 0 0 1 0-1.5h3.885l1.08-5.397a.75.75 0 0 1 .882-.588ZM10.365 9l-1.2 6h4.47l1.2-6h-4.47Z" clipRule="evenodd" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z" clipRule="evenodd" />
    </svg>
  );
}
function ChartPieIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path fillRule="evenodd" d="M2.25 13.5a8.25 8.25 0 0 1 8.25-8.25.75.75 0 0 1 .75.75v6.75H18a.75.75 0 0 1 .75.75 8.25 8.25 0 0 1-16.5 0Z" clipRule="evenodd" />
      <path fillRule="evenodd" d="M12.75 3a.75.75 0 0 1 .75-.75 8.25 8.25 0 0 1 8.25 8.25.75.75 0 0 1-.75.75h-7.5a.75.75 0 0 1-.75-.75V3Z" clipRule="evenodd" />
    </svg>
  );
}
function LightBulbIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M12 .75a8.25 8.25 0 0 0-4.135 15.39c.686.398 1.115 1.008 1.134 1.623a.75.75 0 0 0 .577.706c.352.083.71.148 1.074.195.323.041.6-.218.6-.544v-4.661a6.714 6.714 0 0 1-.937-.171.75.75 0 1 1 .374-1.453 5.261 5.261 0 0 0 2.626 0 .75.75 0 1 1 .374 1.452 6.712 6.712 0 0 1-.937.172v4.66c0 .327.277.586.6.545.364-.047.722-.112 1.074-.195a.75.75 0 0 0 .577-.706c.02-.615.448-1.225 1.134-1.623A8.25 8.25 0 0 0 12 .75Z" />
      <path fillRule="evenodd" d="M9.013 19.9a.75.75 0 0 1 .877-.597 11.319 11.319 0 0 0 4.22 0 .75.75 0 1 1 .28 1.473 12.819 12.819 0 0 1-4.78 0 .75.75 0 0 1-.597-.876ZM9.754 22.344a.75.75 0 0 1 .824-.668 13.682 13.682 0 0 0 2.844 0 .75.75 0 1 1 .156 1.492 15.156 15.156 0 0 1-3.156 0 .75.75 0 0 1-.668-.824Z" clipRule="evenodd" />
    </svg>
  );
}
function ChartBarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75ZM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 0 1-1.875-1.875V8.625ZM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 0 1 3 19.875v-6.75Z" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003Z" />
    </svg>
  );
}
function CogIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 0 0-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 0 0-2.282.819l-.922 1.597a1.875 1.875 0 0 0 .432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 0 0 0 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 0 0-.432 2.385l.922 1.597a1.875 1.875 0 0 0 2.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 0 0 2.28-.819l.923-1.597a1.875 1.875 0 0 0-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 0 0 0-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 0 0-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 0 0-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 0 0-1.85-1.567h-1.843ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" clipRule="evenodd" />
    </svg>
  );
}
function MenuIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h7.5" />
    </svg>
  );
}
function DotsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M4.5 12a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm6 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm6 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" />
    </svg>
  );
}
function CalculatorIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path fillRule="evenodd" d="M6.32 1.827a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V19.5a3 3 0 0 1-3 3H6.75a3 3 0 0 1-3-3V4.757c0-1.47 1.073-2.756 2.57-2.93ZM7.5 11.25a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H8.25a.75.75 0 0 1-.75-.75v-.008Zm0 3a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H8.25a.75.75 0 0 1-.75-.75v-.008Zm0 3a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H8.25a.75.75 0 0 1-.75-.75v-.008Zm3.75-6a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H12a.75.75 0 0 1-.75-.75v-.008Zm0 3a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H12a.75.75 0 0 1-.75-.75v-.008Zm0 3a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H12a.75.75 0 0 1-.75-.75v-.008Zm3.75-6a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75h-.008a.75.75 0 0 1-.75-.75v-.008Zm0 3a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75h-.008a.75.75 0 0 1-.75-.75v-.008Zm0 3a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75h-.008a.75.75 0 0 1-.75-.75v-.008ZM6.75 5.25a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-.75.75h-9a.75.75 0 0 1-.75-.75V5.25Z" clipRule="evenodd" />
    </svg>
  );
}
function CrownIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M3 17.25 5.25 6l4.5 4.5L12 5.25l2.25 5.25 4.5-4.5L21 17.25H3Zm0 2.25h18v2.25H3V19.5Z" />
    </svg>
  );
}
