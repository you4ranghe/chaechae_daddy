import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { getPlanLimit, getUsagePeriodStart } from "@/lib/db/usage";

// 분석/콘텐츠 실행 직후에도 카운트가 즉시 반영되도록 데이터 캐시 비활성화
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("instagram_handle, plan, trial_ends_at")
    .eq("id", user.id)
    .single();

  const instagramHandle =
    profile?.instagram_handle || user.user_metadata?.instagram_handle || "사용자";

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  let trialDaysLeft = 0;
  if ((profile?.plan || "free_trial") === "free_trial" && profile?.trial_ends_at) {
    const diff = new Date(profile.trial_ends_at).getTime() - now.getTime();
    trialDaysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  const [
    { count: totalSponsorships },
    { count: accepted },
    { count: rejected },
    { count: pending },
    { count: contentsCreated },
    { count: postsCompleted },
  ] = await Promise.all([
    supabase
      .from("sponsorships")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", monthStart),
    supabase
      .from("sponsorships")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "accepted")
      .gte("created_at", monthStart),
    supabase
      .from("sponsorships")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "rejected")
      .gte("created_at", monthStart),
    supabase
      .from("sponsorships")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "pending")
      .gte("created_at", monthStart),
    supabase
      .from("generated_contents")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", monthStart),
    supabase
      .from("sponsorships")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "completed")
      .gte("created_at", monthStart),
  ]);

  const plan = profile?.plan || "free_trial";
  const agentRunsTotal = getPlanLimit(plan);
  const agentPeriodStart = getUsagePeriodStart(plan, profile?.trial_ends_at);

  const { count: agentUsed } = await supabase
    .from("agent_usage")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", agentPeriodStart);

  const stats = {
    totalSponsorships: totalSponsorships || 0,
    accepted: accepted || 0,
    rejected: rejected || 0,
    pending: pending || 0,
    contentsCreated: contentsCreated || 0,
    postsCompleted: postsCompleted || 0,
    agentUsed: agentUsed || 0,
    agentRunsTotal,
  };
  const agentRunsLeft = Math.max(0, stats.agentRunsTotal - stats.agentUsed);
  const agentUsagePercent =
    stats.agentRunsTotal > 0
      ? Math.min(100, Math.round((stats.agentUsed / stats.agentRunsTotal) * 100))
      : 0;

  // 시간대별 따뜻한 인사
  const hour = now.getHours();
  const greeting =
    hour < 5
      ? "늦은 밤까지 수고 많으세요"
      : hour < 12
        ? "좋은 아침이에요"
        : hour < 18
          ? "오늘도 화이팅이에요"
          : "오늘 하루도 고생 많으셨어요";

  return (
    <div className="space-y-6">
      {/* 따뜻한 환영 헤더 */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 via-rose-50 to-indigo-50 px-6 py-7 sm:px-8">
        <DecorBubbles />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-amber-700/90">{greeting}</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-[26px]">
              <span className="text-indigo-700">{instagramHandle}</span>님,
              <br className="sm:hidden" /> 오늘은 어떤 협찬이 와있을까요? <span aria-hidden>🍼</span>
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
              협찬 DM을 분석하고, 콘텐츠 초안을 만들고, 인사이트까지 한 번에 도와드려요.
            </p>
          </div>
          {trialDaysLeft > 0 && (
            <div className="flex-shrink-0 self-start rounded-full bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200 backdrop-blur">
              <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-indigo-500 align-middle" />
              무료 체험 D-{trialDaysLeft}
            </div>
          )}
        </div>
      </section>

      {/* 메인 액션 + 처리 대기 알림 */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Link
          href="/dashboard/sponsorships"
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-purple-600 p-6 text-white shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/30 lg:col-span-2"
        >
          <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-8 -right-2 h-24 w-24 rounded-full bg-pink-400/20 blur-2xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur">
                <SparkleIcon className="h-3 w-3" />
                AI Agent
              </div>
              <h2 className="mt-3 text-xl font-bold sm:text-2xl">
                새 협찬 분석하기
              </h2>
              <p className="mt-1 text-sm text-indigo-100">
                협찬 DM을 붙여넣으면 AI가 조건·리스크·답장까지 만들어드려요
              </p>
            </div>
            <div className="flex-shrink-0 rounded-2xl bg-white/15 p-3 backdrop-blur transition-transform group-hover:scale-110">
              <SparkleIcon className="h-7 w-7" />
            </div>
          </div>
          <div className="relative mt-5 inline-flex items-center gap-1 text-sm font-semibold">
            지금 시작하기
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* 처리 대기 카드 */}
        <Link
          href="/dashboard/sponsorships"
          className="group rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-amber-100 p-2.5 ring-1 ring-inset ring-amber-200">
              <BellIcon className="h-5 w-5 text-amber-600" />
            </div>
            <ArrowRightIcon className="h-4 w-4 text-amber-700 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
          </div>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-amber-700">
            처리 대기
          </p>
          <p className="mt-1 text-3xl font-bold text-amber-900">
            {stats.pending}
            <span className="ml-0.5 text-base font-medium text-amber-700">건</span>
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-amber-800/80">
            {stats.pending > 0
              ? "수락 여부를 결정해 보세요"
              : "지금은 모두 정리됐어요 ☺"}
          </p>
        </Link>
      </section>

      {/* 이번 달 요약 — 3 카드 */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-sm font-semibold text-gray-900">이번 달 요약</h2>
          <p className="text-xs text-gray-400">
            {now.getFullYear()}년 {now.getMonth() + 1}월
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* 협찬 */}
          <Link
            href="/dashboard/sponsorships"
            className="group rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-indigo-50 p-2.5">
                <BriefcaseIcon className="h-5 w-5 text-indigo-600" />
              </div>
              <ArrowRightIcon className="h-4 w-4 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-indigo-500" />
            </div>
            <h3 className="mt-3 text-sm font-medium text-gray-500">협찬</h3>
            <p className="mt-1 text-3xl font-bold text-gray-900">
              {stats.totalSponsorships}
              <span className="ml-0.5 text-base font-normal text-gray-400">건</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs">
              <Dot color="bg-emerald-500" label="수락" value={stats.accepted} />
              <Dot color="bg-amber-400" label="대기" value={stats.pending} />
              <Dot color="bg-rose-400" label="거절" value={stats.rejected} />
            </div>
          </Link>

          {/* 콘텐츠 */}
          <Link
            href="/dashboard/sponsorships"
            className="group rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-pink-50 p-2.5">
                <PencilIcon className="h-5 w-5 text-pink-600" />
              </div>
              <ArrowRightIcon className="h-4 w-4 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-pink-500" />
            </div>
            <h3 className="mt-3 text-sm font-medium text-gray-500">생성된 콘텐츠</h3>
            <p className="mt-1 text-3xl font-bold text-gray-900">
              {stats.contentsCreated}
              <span className="ml-0.5 text-base font-normal text-gray-400">건</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs">
              <Dot color="bg-pink-500" label="생성" value={stats.contentsCreated} />
              <Dot color="bg-emerald-500" label="포스팅" value={stats.postsCompleted} />
            </div>
          </Link>

          {/* 에이전트 사용량 */}
          <Link
            href="/dashboard/usage"
            className="group rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-amber-50 p-2.5">
                <BatteryIcon className="h-5 w-5 text-amber-600" />
              </div>
              <ArrowRightIcon className="h-4 w-4 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-amber-500" />
            </div>
            <h3 className="mt-3 text-sm font-medium text-gray-500">남은 에이전트 횟수</h3>
            <p className="mt-1 text-3xl font-bold text-gray-900">
              {agentRunsLeft}
              <span className="ml-0.5 text-base font-normal text-gray-400">
                /{stats.agentRunsTotal}
              </span>
            </p>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full transition-all ${
                  agentUsagePercent >= 90
                    ? "bg-rose-500"
                    : agentUsagePercent >= 70
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                }`}
                style={{ width: `${agentUsagePercent}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-gray-400">
              {agentUsagePercent}% 사용 중
            </p>
          </Link>
        </div>
      </section>

      {/* 빠른 이동 — 자주 쓰는 도구 */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-sm font-semibold text-gray-900">바로가기</h2>
          <p className="text-xs text-gray-400">자주 쓰는 도구</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ShortcutCard
            href="/dashboard/hashtags"
            title="해시태그 분석"
            description="내 카테고리에 잘 맞는 태그 추천"
            icon={<HashtagIcon className="h-5 w-5" />}
            tone="rose"
          />
          <ShortcutCard
            href="/dashboard/content-plan"
            title="콘텐츠 플래너"
            description="이번 주 콘텐츠 일정 한눈에"
            icon={<CalendarIcon className="h-5 w-5" />}
            tone="indigo"
          />
          <ShortcutCard
            href="/dashboard/analytics"
            title="성과 분석"
            description="주간 인사이트 자동 리포트"
            icon={<ChartPieIcon className="h-5 w-5" />}
            tone="emerald"
          />
          <ShortcutCard
            href="/dashboard/insights"
            title="인사이트"
            description="협찬 데이터로 만든 팁"
            icon={<LightBulbIcon className="h-5 w-5" />}
            tone="amber"
          />
        </div>
      </section>

      {/* 따뜻한 풋노트 */}
      <section className="rounded-2xl border border-dashed border-gray-200 bg-white/60 p-4 text-center">
        <p className="text-xs text-gray-500">
          <span aria-hidden>💛</span> 오늘도 채채와 사랑이가 잠든 사이, 한 걸음씩 함께 정리해봐요
        </p>
      </section>
    </div>
  );
}

// ──────────────────────────────────────────────
// 하위 컴포넌트
// ──────────────────────────────────────────────

function Dot({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-gray-500">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      {label} {value}
    </span>
  );
}

const TONE_CLASSES: Record<
  "rose" | "indigo" | "emerald" | "amber",
  { bg: string; text: string; hover: string }
> = {
  rose: {
    bg: "bg-rose-50",
    text: "text-rose-600",
    hover: "hover:border-rose-200",
  },
  indigo: {
    bg: "bg-indigo-50",
    text: "text-indigo-600",
    hover: "hover:border-indigo-200",
  },
  emerald: {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    hover: "hover:border-emerald-200",
  },
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-600",
    hover: "hover:border-amber-200",
  },
};

function ShortcutCard({
  href,
  title,
  description,
  icon,
  tone,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  tone: keyof typeof TONE_CLASSES;
}) {
  const t = TONE_CLASSES[tone];
  return (
    <Link
      href={href}
      className={`group flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${t.hover}`}
    >
      <div
        className={`flex-shrink-0 rounded-xl p-2.5 transition-transform group-hover:scale-110 ${t.bg} ${t.text}`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{description}</p>
      </div>
    </Link>
  );
}

function DecorBubbles() {
  return (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-rose-200/40 blur-2xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-12 right-20 h-24 w-24 rounded-full bg-amber-200/40 blur-2xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -left-6 bottom-2 h-20 w-20 rounded-full bg-indigo-200/40 blur-2xl"
      />
    </>
  );
}

// ── 아이콘 ────────────────────────────────────
function SparkleIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5ZM16.5 15a.75.75 0 0 1 .712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 0 1 0 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 0 1-1.422 0l-.395-1.183a1.5 1.5 0 0 0-.948-.948l-1.183-.395a.75.75 0 0 1 0-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0 1 16.5 15Z" clipRule="evenodd" />
    </svg>
  );
}
function ArrowRightIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  );
}
function BellIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0 1 13.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 0 1-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 1 1-7.48 0 24.585 24.585 0 0 1-4.831-1.244.75.75 0 0 1-.298-1.205A8.217 8.217 0 0 0 5.25 9.75V9Zm4.502 8.9a2.25 2.25 0 1 0 4.496 0 25.057 25.057 0 0 1-4.496 0Z" clipRule="evenodd" />
    </svg>
  );
}
function BriefcaseIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M7.5 5.25a3 3 0 0 1 3-3h3a3 3 0 0 1 3 3v.205c.933.085 1.857.197 2.774.334 1.454.218 2.476 1.483 2.476 2.917v3.033c0 1.211-.734 2.352-1.936 2.752A24.726 24.726 0 0 1 12 15.75a24.726 24.726 0 0 1-7.814-1.259c-1.202-.4-1.936-1.541-1.936-2.752V8.706c0-1.434 1.022-2.7 2.476-2.917A48.814 48.814 0 0 1 7.5 5.455V5.25Zm7.5 0v.09a49.488 49.488 0 0 0-6 0v-.09a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5Zm-3 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
      <path d="M3 18.4v-2.796a4.3 4.3 0 0 0 .713.31A26.226 26.226 0 0 0 12 17.25c2.892 0 5.68-.468 8.287-1.335.252-.084.49-.189.713-.311V18.4c0 1.452-1.047 2.728-2.523 2.923-2.12.282-4.282.427-6.477.427a49.19 49.19 0 0 1-6.477-.427C4.047 21.128 3 19.852 3 18.4Z" />
    </svg>
  );
}
function PencilIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32L19.513 8.2Z" />
    </svg>
  );
}
function BatteryIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M3.75 6.75a3 3 0 0 0-3 3v4.5a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3v-4.5a3 3 0 0 0-3-3h-15Zm15 1.5a1.5 1.5 0 0 1 1.5 1.5v4.5a1.5 1.5 0 0 1-1.5 1.5h-15a1.5 1.5 0 0 1-1.5-1.5v-4.5a1.5 1.5 0 0 1 1.5-1.5h15ZM22.5 12a.75.75 0 0 1 .75-.75v1.5a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
      <path d="M4.5 9.75h4.5v4.5h-4.5v-4.5Z" />
    </svg>
  );
}
function HashtagIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M11.097 1.515a.75.75 0 0 1 .589.882L10.666 7.5h4.47l1.079-5.397a.75.75 0 1 1 1.47.294L16.665 7.5h3.585a.75.75 0 0 1 0 1.5h-3.885l-1.2 6h3.585a.75.75 0 0 1 0 1.5h-3.885l-1.08 5.397a.75.75 0 1 1-1.47-.294l1.02-5.103h-4.47l-1.08 5.397a.75.75 0 1 1-1.47-.294l1.02-5.103H3.75a.75.75 0 0 1 0-1.5h3.885l1.2-6H5.25a.75.75 0 0 1 0-1.5h3.885l1.08-5.397a.75.75 0 0 1 .882-.588ZM10.365 9l-1.2 6h4.47l1.2-6h-4.47Z" clipRule="evenodd" />
    </svg>
  );
}
function CalendarIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z" clipRule="evenodd" />
    </svg>
  );
}
function ChartPieIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M2.25 13.5a8.25 8.25 0 0 1 8.25-8.25.75.75 0 0 1 .75.75v6.75H18a.75.75 0 0 1 .75.75 8.25 8.25 0 0 1-16.5 0Z" clipRule="evenodd" />
      <path fillRule="evenodd" d="M12.75 3a.75.75 0 0 1 .75-.75 8.25 8.25 0 0 1 8.25 8.25.75.75 0 0 1-.75.75h-7.5a.75.75 0 0 1-.75-.75V3Z" clipRule="evenodd" />
    </svg>
  );
}
function LightBulbIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 .75a8.25 8.25 0 0 0-4.135 15.39c.686.398 1.115 1.008 1.134 1.623a.75.75 0 0 0 .577.706c.352.083.71.148 1.074.195.323.041.6-.218.6-.544v-4.661a6.714 6.714 0 0 1-.937-.171.75.75 0 1 1 .374-1.453 5.261 5.261 0 0 0 2.626 0 .75.75 0 1 1 .374 1.452 6.712 6.712 0 0 1-.937.172v4.66c0 .327.277.586.6.545.364-.047.722-.112 1.074-.195a.75.75 0 0 0 .577-.706c.02-.615.448-1.225 1.134-1.623A8.25 8.25 0 0 0 12 .75Z" />
      <path fillRule="evenodd" d="M9.013 19.9a.75.75 0 0 1 .877-.597 11.319 11.319 0 0 0 4.22 0 .75.75 0 1 1 .28 1.473 12.819 12.819 0 0 1-4.78 0 .75.75 0 0 1-.597-.876ZM9.754 22.344a.75.75 0 0 1 .824-.668 13.682 13.682 0 0 0 2.844 0 .75.75 0 1 1 .156 1.492 15.156 15.156 0 0 1-3.156 0 .75.75 0 0 1-.668-.824Z" clipRule="evenodd" />
    </svg>
  );
}
