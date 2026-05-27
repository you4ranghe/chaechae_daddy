import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { fetchInsights } from "@/lib/db/insights";
import { RevenueChart } from "@/components/insights/revenue-chart";
import { StatusDonut } from "@/components/insights/status-donut";
import { BrandList } from "@/components/insights/brand-list";
import { IndustryPrices } from "@/components/insights/industry-prices";
import { DownloadInsightsPdfButton } from "@/components/insights/download-pdf-button";
import { ShareCard } from "@/components/insights/share-card";

export default async function InsightsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const insights = await fetchInsights(supabase, user.id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("instagram_handle")
    .eq("id", user.id)
    .single();

  const handle =
    profile?.instagram_handle || user.user_metadata?.instagram_handle || "사용자";

  // 이번 달(monthlyRevenue의 마지막 항목) 데이터
  const thisMonth = insights.monthlyRevenue[insights.monthlyRevenue.length - 1];
  const shareMonth = thisMonth?.month || defaultShareMonth();
  const shareCompleted = thisMonth?.count || 0;
  const shareRevenue = thisMonth?.revenue || 0;

  return (
    <div className="space-y-6 animate-fade-up">
      {/* 헤더 */}
      <section className="bezel relative overflow-hidden bg-gradient-to-br from-pink-50 via-white to-rose-50 px-6 py-7 sm:px-8">
        <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-pink-300/30 blur-[60px] animate-glow" />
        <span aria-hidden className="pointer-events-none absolute -bottom-12 right-20 h-28 w-28 rounded-full bg-rose-200/40 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl cta-gradient">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-white">
                <path d="M12 .75a8.25 8.25 0 0 0-4.135 15.39c.686.398 1.115 1.008 1.134 1.623a.75.75 0 0 0 .577.706c.352.083.71.148 1.074.195.323.041.6-.218.6-.544v-4.661a6.714 6.714 0 0 1-.937-.171.75.75 0 1 1 .374-1.453 5.261 5.261 0 0 0 2.626 0 .75.75 0 1 1 .374 1.452 6.712 6.712 0 0 1-.937.172v4.66c0 .327.277.586.6.545.364-.047.722-.112 1.074-.195a.75.75 0 0 0 .577-.706c.02-.615.448-1.225 1.134-1.623A8.25 8.25 0 0 0 12 .75Z" />
                <path fillRule="evenodd" d="M9.013 19.9a.75.75 0 0 1 .877-.597 11.319 11.319 0 0 0 4.22 0 .75.75 0 1 1 .28 1.473 12.819 12.819 0 0 1-4.78 0 .75.75 0 0 1-.597-.876Z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-pink-600">Insights</p>
              <h1 className="mt-0.5 text-[22px] font-black tracking-tight text-gray-900">협찬 인사이트</h1>
              <p className="mt-1 text-[13.5px] leading-relaxed text-gray-600">
                최근 6개월의 협찬 데이터를 그래프로 모아 보여드려요
              </p>
            </div>
          </div>
          <DownloadInsightsPdfButton data={insights} handle={handle} />
        </div>
      </section>

      {/* 요약 카드 */}
      <section className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          icon={<WonIcon />}
          label="총 수익 (6개월)"
          value={`₩${insights.totals.revenue.toLocaleString()}`}
          tone="indigo"
          big
        />
        <SummaryCard
          icon={<CheckIcon />}
          label="완료된 협찬"
          value={`${insights.totals.completedCount}건`}
          tone="emerald"
        />
        <SummaryCard
          icon={<PercentIcon />}
          label="수락률"
          value={`${insights.totals.acceptRate}%`}
          subtitle="의사결정한 협찬 기준"
          tone="rose"
        />
      </section>

      {/* 월별 수익 그래프 */}
      <ChartSection
        icon={<TrendingUpIcon />}
        title="월별 협찬 수익"
        subtitle="완료 처리한 협찬만 집계해요"
        tone="indigo"
      >
        <RevenueChart data={insights.monthlyRevenue} />
      </ChartSection>

      {/* 상태 분포 + 브랜드 리스트 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartSection
          icon={<DonutIcon />}
          title="수락 / 거절 비율"
          subtitle="전체 협찬 상태 분포"
          tone="emerald"
        >
          <StatusDonut data={insights.statusBreakdown} />
        </ChartSection>

        <ChartSection
          icon={<TagIcon />}
          title="브랜드별 통계"
          subtitle="2회 이상은 반복 브랜드 뱃지가 붙어요"
          tone="rose"
        >
          <BrandList brands={insights.brandStats} />
        </ChartSection>
      </div>

      {/* 시세 비교 */}
      <ChartSection
        icon={<ScaleIcon />}
        title="업종별 시세 비교"
        subtitle="내가 완료한 협찬의 업종별 금액 분포 — 다음 협상 때 참고하세요"
        tone="amber"
      >
        <IndustryPrices prices={insights.industryPrices} />
      </ChartSection>

      {/* 공유 카드 */}
      <ShareCard
        completed={shareCompleted}
        revenue={shareRevenue}
        acceptRate={insights.totals.acceptRate}
        handle={handle}
        month={shareMonth}
      />
    </div>
  );
}

function defaultShareMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ──────────────────────────────────────────────
// 요약 카드
// ──────────────────────────────────────────────

const SUMMARY_TONE: Record<
  "indigo" | "emerald" | "rose",
  { bg: string; iconBg: string; iconText: string; valueText: string }
> = {
  indigo: {
    bg: "from-pink-50 to-rose-50",
    iconBg: "bg-pink-100",
    iconText: "text-pink-600",
    valueText: "text-pink-700",
  },
  emerald: {
    bg: "from-emerald-50 to-teal-50",
    iconBg: "bg-emerald-100",
    iconText: "text-emerald-600",
    valueText: "text-emerald-700",
  },
  rose: {
    bg: "from-rose-50 to-pink-50",
    iconBg: "bg-rose-100",
    iconText: "text-rose-600",
    valueText: "text-rose-700",
  },
};

function SummaryCard({
  icon,
  label,
  value,
  subtitle,
  tone,
  big = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  tone: keyof typeof SUMMARY_TONE;
  big?: boolean;
}) {
  const t = SUMMARY_TONE[tone];
  return (
    <div
      className={`bezel bezel-hover relative overflow-hidden bg-gradient-to-br ${t.bg} p-5 transition-spring`}
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${t.iconBg} ${t.iconText} ring-1 ring-inset ring-white/60 shadow-sm`}
      >
        {icon}
      </span>
      <p className="mt-3 text-[10.5px] font-bold uppercase tracking-[0.14em] text-gray-500">
        {label}
      </p>
      <p
        className={`mt-1 font-black tabular-nums tracking-tight ${t.valueText} ${big ? "text-2xl" : "text-xl"}`}
      >
        {value}
      </p>
      {subtitle && (
        <p className="mt-1 text-[10.5px] text-gray-500">{subtitle}</p>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// 차트 섹션 공통
// ──────────────────────────────────────────────

const SECTION_TONE: Record<
  "indigo" | "emerald" | "rose" | "amber",
  { iconBg: string; iconText: string }
> = {
  indigo: { iconBg: "bg-pink-100", iconText: "text-pink-600" },
  emerald: { iconBg: "bg-emerald-100", iconText: "text-emerald-600" },
  rose: { iconBg: "bg-rose-100", iconText: "text-rose-600" },
  amber: { iconBg: "bg-amber-100", iconText: "text-amber-600" },
};

function ChartSection({
  icon,
  title,
  subtitle,
  tone,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  tone: keyof typeof SECTION_TONE;
  children: React.ReactNode;
}) {
  const t = SECTION_TONE[tone];
  return (
    <section className="bezel p-5">
      <div className="flex items-center gap-2.5">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-xl ${t.iconBg} ${t.iconText} ring-1 ring-inset ring-white/60`}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-bold tracking-tight text-gray-900">{title}</h2>
          <p className="text-[10.5px] text-gray-500">{subtitle}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

// ──────────────────────────────────────────────
// 아이콘
// ──────────────────────────────────────────────

function WonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M3.5 4h2.7l1.6 6.5L9.4 4h2.6l1.6 6.5L15.2 4h2.7l-3 11h-2.6l-1.5-6-1.5 6H6.7L3.5 4Z" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
    </svg>
  );
}
function PercentIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path fillRule="evenodd" d="M5.79 21.697a.75.75 0 0 1-.486-.943l5.25-15.75a.75.75 0 0 1 1.422.475l-5.25 15.75a.75.75 0 0 1-.936.468ZM5.625 6a2.625 2.625 0 1 1 0 5.25 2.625 2.625 0 0 1 0-5.25Zm12.75 6.75a2.625 2.625 0 1 1 0 5.25 2.625 2.625 0 0 1 0-5.25Z" clipRule="evenodd" />
    </svg>
  );
}
function TrendingUpIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path fillRule="evenodd" d="M15.22 6.268a.75.75 0 0 1 .968-.432l5.942 2.28a.75.75 0 0 1 .431.97l-2.28 5.94a.75.75 0 1 1-1.4-.537l1.63-4.251-1.086.483a11.2 11.2 0 0 0-5.45 5.173.75.75 0 0 1-1.199.19L9 12.31l-6.22 6.22a.75.75 0 1 1-1.06-1.06l6.75-6.75a.75.75 0 0 1 1.06 0l3.606 3.605a12.694 12.694 0 0 1 5.68-4.973l1.086-.484-4.251-1.631a.75.75 0 0 1-.432-.97Z" clipRule="evenodd" />
    </svg>
  );
}
function DonutIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path fillRule="evenodd" d="M2.25 13.5a8.25 8.25 0 0 1 8.25-8.25.75.75 0 0 1 .75.75v6.75H18a.75.75 0 0 1 .75.75 8.25 8.25 0 0 1-16.5 0Z" clipRule="evenodd" />
      <path fillRule="evenodd" d="M12.75 3a.75.75 0 0 1 .75-.75 8.25 8.25 0 0 1 8.25 8.25.75.75 0 0 1-.75.75h-7.5a.75.75 0 0 1-.75-.75V3Z" clipRule="evenodd" />
    </svg>
  );
}
function TagIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path fillRule="evenodd" d="M5.25 2.25a3 3 0 0 0-3 3v4.318a3 3 0 0 0 .879 2.121l9.58 9.581c.92.92 2.39 1.186 3.548.428a18.849 18.849 0 0 0 5.441-5.44c.758-1.16.492-2.629-.428-3.548l-9.58-9.581a3 3 0 0 0-2.122-.879H5.25ZM6.375 7.5a1.125 1.125 0 1 0 0-2.25 1.125 1.125 0 0 0 0 2.25Z" clipRule="evenodd" />
    </svg>
  );
}
function ScaleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v.756a49.106 49.106 0 0 1 9.152 1 .75.75 0 0 1-.152 1.485h-1.918l2.474 10.124a.75.75 0 0 1-.375.84A6.723 6.723 0 0 1 18.75 18a6.723 6.723 0 0 1-3.181-.795.75.75 0 0 1-.375-.84l2.474-10.124H12.75v13.28c1.293.076 2.534.343 3.697.776a.75.75 0 0 1-.262 1.453h-8.37a.75.75 0 0 1-.262-1.453c1.162-.433 2.404-.7 3.697-.775V6.24H6.332l2.474 10.124a.75.75 0 0 1-.375.84A6.723 6.723 0 0 1 5.25 18a6.723 6.723 0 0 1-3.181-.795.75.75 0 0 1-.375-.84L4.168 6.241H2.25a.75.75 0 0 1-.152-1.485 49.105 49.105 0 0 1 9.152-1V3a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
    </svg>
  );
}
