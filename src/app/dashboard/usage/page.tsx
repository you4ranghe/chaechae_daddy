import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { DailyChart } from "@/components/dashboard/daily-chart";

export const dynamic = "force-dynamic";

const PLAN_INFO: Record<
  string,
  {
    name: string;
    limit: number;
    price: string;
    gradient: string;
    badge: string;
    accent: string;
  }
> = {
  free_trial: {
    name: "무료 체험",
    limit: 10,
    price: "₩0",
    gradient: "from-amber-400 to-rose-400",
    badge: "TRIAL",
    accent: "text-amber-700",
  },
  starter: {
    name: "스타터",
    limit: 100,
    price: "₩39,000/월",
    gradient: "from-indigo-500 to-purple-500",
    badge: "STARTER",
    accent: "text-indigo-700",
  },
  growth: {
    name: "그로스",
    limit: 500,
    price: "₩99,000/월",
    gradient: "from-purple-500 to-pink-500",
    badge: "GROWTH",
    accent: "text-purple-700",
  },
  business: {
    name: "비즈니스",
    limit: 2000,
    price: "₩199,000/월",
    gradient: "from-gray-800 to-gray-900",
    badge: "PRO",
    accent: "text-gray-900",
  },
};

export default async function UsagePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, trial_ends_at")
    .eq("id", user.id)
    .single();

  const plan = profile?.plan || "free_trial";
  const info = PLAN_INFO[plan] || PLAN_INFO.free_trial;

  const now = new Date();

  let trialDaysLeft = 0;
  if (plan === "free_trial" && profile?.trial_ends_at) {
    const diff = new Date(profile.trial_ends_at).getTime() - now.getTime();
    trialDaysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  // 기간 시작일
  let periodStart: string;
  let periodLabel: string;
  if (plan === "free_trial" && profile?.trial_ends_at) {
    const trialEnd = new Date(profile.trial_ends_at);
    const trialStart = new Date(trialEnd);
    trialStart.setDate(trialStart.getDate() - 7);
    periodStart = trialStart.toISOString();
    periodLabel = "체험 기간";
  } else {
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    periodLabel = `${now.getFullYear()}년 ${now.getMonth() + 1}월`;
  }

  // 이번 기간 사용량 (병렬 조회)
  const [
    { count: totalUsed },
    { count: analysisCount },
    { count: contentCount },
  ] = await Promise.all([
    supabase
      .from("agent_usage")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", periodStart),
    supabase
      .from("agent_usage")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("type", "sponsorship_analysis")
      .gte("created_at", periodStart),
    supabase
      .from("agent_usage")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("type", "content_generation")
      .gte("created_at", periodStart),
  ]);

  const used = totalUsed || 0;
  const remaining = Math.max(0, info.limit - used);
  const usagePercent =
    info.limit > 0 ? Math.min(100, Math.round((used / info.limit) * 100)) : 0;

  // 일별 사용량 (최근 14일)
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
  fourteenDaysAgo.setHours(0, 0, 0, 0);

  const { data: dailyRaw } = await supabase
    .from("agent_usage")
    .select("created_at")
    .eq("user_id", user.id)
    .gte("created_at", fourteenDaysAgo.toISOString())
    .order("created_at", { ascending: true });

  const dailyMap = new Map<string, number>();
  for (let i = 0; i < 14; i++) {
    const d = new Date(fourteenDaysAgo);
    d.setDate(d.getDate() + i);
    const key = `${d.getMonth() + 1}/${d.getDate()}`;
    dailyMap.set(key, 0);
  }
  for (const row of dailyRaw || []) {
    const d = new Date(row.created_at);
    const key = `${d.getMonth() + 1}/${d.getDate()}`;
    dailyMap.set(key, (dailyMap.get(key) || 0) + 1);
  }
  const dailyData = Array.from(dailyMap.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  // 14일 누적 합계
  const last14Total = dailyData.reduce((s, d) => s + d.count, 0);
  const avgPerDay = +(last14Total / 14).toFixed(1);

  // 사용량 톤 결정 (게이지 색)
  const usageTone =
    usagePercent >= 90
      ? { ring: "stroke-rose-500", text: "text-rose-600", soft: "text-rose-700" }
      : usagePercent >= 70
        ? { ring: "stroke-amber-500", text: "text-amber-600", soft: "text-amber-700" }
        : { ring: "stroke-emerald-500", text: "text-emerald-600", soft: "text-emerald-700" };

  const showTrialWarning =
    plan === "free_trial" && trialDaysLeft > 0 && trialDaysLeft <= 2;
  const showTrialExpired = plan === "free_trial" && trialDaysLeft === 0 && profile?.trial_ends_at;

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-50 via-white to-amber-50 px-6 py-6 sm:px-7">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-indigo-200/40 blur-3xl"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-10 right-20 h-24 w-24 rounded-full bg-amber-200/40 blur-2xl"
        />
        <div className="relative flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-md shadow-amber-500/30">
            <BatteryIcon className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900">사용량</h1>
            <p className="mt-0.5 text-sm leading-relaxed text-gray-600">
              {periodLabel} 에이전트 사용 현황을 한눈에 확인하세요
            </p>
          </div>
        </div>
      </section>

      {/* 플랜 + 라디얼 게이지 */}
      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white">
        <div className="grid gap-0 md:grid-cols-2">
          {/* 좌측: 라디얼 게이지 + 메인 수치 */}
          <div className="flex flex-col items-center justify-center gap-4 p-6 sm:p-8">
            <RadialGauge percent={usagePercent} ringClass={usageTone.ring}>
              <div className="text-center">
                <p className={`text-4xl font-bold tabular-nums ${usageTone.text}`}>
                  {used}
                </p>
                <p className="text-xs font-medium tabular-nums text-gray-400">
                  / {info.limit}회
                </p>
              </div>
            </RadialGauge>

            <div className="text-center">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                {periodLabel} 사용
              </p>
              <p className={`mt-0.5 text-sm font-semibold ${usageTone.soft}`}>
                {remaining > 0
                  ? `${remaining}회 남았어요`
                  : "이번 기간 사용량을 모두 사용했어요"}
              </p>
            </div>
          </div>

          {/* 우측: 플랜 정보 */}
          <div className="border-t border-gray-100 bg-gradient-to-br from-gray-50/60 to-white p-6 md:border-l md:border-t-0 sm:p-8">
            <div className="flex items-center justify-between">
              <span
                className={`rounded-md bg-gradient-to-br ${info.gradient} px-2 py-0.5 text-[10px] font-bold text-white shadow-sm`}
              >
                {info.badge}
              </span>
              {plan === "free_trial" && trialDaysLeft > 0 && (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ring-1 ring-inset ${
                    trialDaysLeft <= 2
                      ? "bg-rose-100 text-rose-700 ring-rose-200"
                      : "bg-indigo-100 text-indigo-700 ring-indigo-200"
                  }`}
                >
                  체험 D-{trialDaysLeft}
                </span>
              )}
            </div>
            <h2 className="mt-3 text-xl font-bold text-gray-900">{info.name} 플랜</h2>
            <p className="text-sm text-gray-500">{info.price}</p>

            <ul className="mt-4 space-y-2 text-[12.5px] text-gray-600">
              <PlanFeature>월 {info.limit}회 AI 에이전트 사용</PlanFeature>
              <PlanFeature>협찬 분석 · 콘텐츠 생성 무제한 조합</PlanFeature>
              <PlanFeature>해시태그 · 인사이트 도구 포함</PlanFeature>
            </ul>

            {plan !== "business" && (
              <Link
                href="/pricing"
                className="group mt-5 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/25 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/30"
              >
                <CrownIcon className="h-3.5 w-3.5 transition-transform group-hover:-rotate-12" />
                플랜 업그레이드
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* 트라이얼 경고 */}
      {showTrialWarning && (
        <div className="flex items-start gap-3 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-4 ring-1 ring-inset ring-amber-200">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <AlertIcon className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-amber-900">
              무료 체험이 {trialDaysLeft}일 후 종료돼요
            </p>
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-amber-800">
              스타터 플랜으로 업그레이드하시면 데이터가 유지되며 매달 100회까지 사용할 수 있어요.
            </p>
          </div>
          <Link
            href="/pricing"
            className="flex-shrink-0 self-center rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-amber-600"
          >
            업그레이드
          </Link>
        </div>
      )}
      {showTrialExpired && (
        <div className="flex items-start gap-3 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 p-4 ring-1 ring-inset ring-rose-200">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
            <AlertIcon className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-rose-900">무료 체험이 종료됐어요</p>
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-rose-800">
              그동안 만든 협찬 분석과 콘텐츠는 그대로 보관되어 있어요.
              유료 플랜으로 업그레이드하시면 다시 사용할 수 있어요.
            </p>
          </div>
          <Link
            href="/pricing"
            className="flex-shrink-0 self-center rounded-xl bg-rose-500 px-3 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-rose-600"
          >
            업그레이드
          </Link>
        </div>
      )}

      {/* 타입별 카드 */}
      <section className="grid gap-3 sm:grid-cols-2">
        <TypeBreakdownCard
          icon={<SparkleIcon />}
          label="협찬 분석"
          subtitle="DM 분석 + 응답 초안 생성"
          count={analysisCount || 0}
          total={used}
          tone="indigo"
        />
        <TypeBreakdownCard
          icon={<PencilIcon />}
          label="콘텐츠 생성"
          subtitle="캡션 + 해시태그 생성"
          count={contentCount || 0}
          total={used}
          tone="pink"
        />
      </section>

      {/* 일별 사용량 차트 */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 shadow-sm">
            <ChartBarIcon className="h-3.5 w-3.5 text-white" />
          </span>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-900">일별 사용량</h3>
            <p className="text-[10.5px] text-gray-500">최근 14일 · 일평균 {avgPerDay}회</p>
          </div>
        </div>
        <div className="mt-4">
          <DailyChart data={dailyData} />
        </div>
      </section>
    </div>
  );
}

// ──────────────────────────────────────────────
// 라디얼 게이지
// ──────────────────────────────────────────────

function RadialGauge({
  percent,
  ringClass,
  children,
}: {
  percent: number;
  ringClass: string;
  children: React.ReactNode;
}) {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex h-[150px] w-[150px] items-center justify-center">
      <svg className="-rotate-90 transform" width="150" height="150" viewBox="0 0 150 150">
        <circle
          cx="75"
          cy="75"
          r={radius}
          fill="none"
          stroke="rgb(243 244 246)"
          strokeWidth="12"
        />
        <circle
          cx="75"
          cy="75"
          r={radius}
          fill="none"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={ringClass}
          style={{ transition: "stroke-dashoffset 800ms ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// 작은 컴포넌트
// ──────────────────────────────────────────────

function PlanFeature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <CheckIcon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
      <span>{children}</span>
    </li>
  );
}

const TYPE_TONE: Record<
  "indigo" | "pink",
  { iconBg: string; iconText: string; bar: string; valueText: string }
> = {
  indigo: {
    iconBg: "bg-indigo-100",
    iconText: "text-indigo-600",
    bar: "from-indigo-500 to-purple-500",
    valueText: "text-indigo-700",
  },
  pink: {
    iconBg: "bg-pink-100",
    iconText: "text-pink-600",
    bar: "from-pink-500 to-rose-500",
    valueText: "text-pink-700",
  },
};

function TypeBreakdownCard({
  icon,
  label,
  subtitle,
  count,
  total,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle: string;
  count: number;
  total: number;
  tone: keyof typeof TYPE_TONE;
}) {
  const t = TYPE_TONE[tone];
  const ratio = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-start gap-3">
        <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${t.iconBg} ${t.iconText}`}>
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gray-900">{label}</p>
          <p className="text-[10.5px] text-gray-500">{subtitle}</p>
        </div>
        <p className={`text-2xl font-bold tabular-nums ${t.valueText}`}>{count}</p>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-[width] duration-500 ${t.bar}`}
          style={{ width: `${ratio}%` }}
        />
      </div>
      <p className="mt-1.5 text-[10.5px] tabular-nums text-gray-400">
        전체 사용량의 {ratio}%
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────
// 아이콘
// ──────────────────────────────────────────────

function BatteryIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M3.75 6.75a3 3 0 0 0-3 3v4.5a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3v-4.5a3 3 0 0 0-3-3h-15Zm15 1.5a1.5 1.5 0 0 1 1.5 1.5v4.5a1.5 1.5 0 0 1-1.5 1.5h-15a1.5 1.5 0 0 1-1.5-1.5v-4.5a1.5 1.5 0 0 1 1.5-1.5h15ZM22.5 12a.75.75 0 0 1 .75-.75v1.5a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
      <path d="M4.5 9.75h4.5v4.5h-4.5v-4.5Z" />
    </svg>
  );
}
function ChartBarIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75ZM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 0 1-1.875-1.875V8.625ZM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 0 1 3 19.875v-6.75Z" />
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
function PencilIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32L19.513 8.2Z" />
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
function CrownIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M3 17.25 5.25 6l4.5 4.5L12 5.25l2.25 5.25 4.5-4.5L21 17.25H3Zm0 2.25h18v2.25H3V19.5Z" />
    </svg>
  );
}
function AlertIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
    </svg>
  );
}
