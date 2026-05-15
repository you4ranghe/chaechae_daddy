import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { SponsorshipTabs } from "@/components/sponsorship/sponsorship-tabs";
import { DownloadSponsorshipsExcelButton } from "@/components/sponsorship/download-excel-button";
import type { Sponsorship } from "@/lib/types/sponsorship";

export const dynamic = "force-dynamic";

export default async function SponsorshipsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 진행 중인 협찬 조회
  const { data: inProgressData } = await supabase
    .from("sponsorships")
    .select("*")
    .eq("user_id", user.id)
    .in("status", ["pending", "accepted"])
    .order("created_at", { ascending: false });

  // 완료된 협찬 조회
  const { data: completedData } = await supabase
    .from("sponsorships")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  // Excel 다운로드용 전체 협찬 (거절 포함)
  const { data: allData } = await supabase
    .from("sponsorships")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const inProgress = (inProgressData || []) as Sponsorship[];
  const completed = (completedData || []) as Sponsorship[];
  const allRows = (allData || []) as Sponsorship[];

  const { data: profile } = await supabase
    .from("profiles")
    .select("instagram_handle")
    .eq("id", user.id)
    .single();
  const handle =
    profile?.instagram_handle || user.user_metadata?.instagram_handle || "사용자";

  // 이번 달 분석 총 건수
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { count: thisMonthAnalysed } = await supabase
    .from("sponsorships")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", monthStart);

  // 가장 가까운 마감(D-day) — pending/accepted 중 deadline이 미래인 것
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextDeadline = inProgress
    .map((sp) => sp.deadline)
    .filter((d): d is string => Boolean(d) && d !== "미정")
    .map((d) => new Date(d))
    .filter((d) => !isNaN(d.getTime()) && d.getTime() >= today.getTime())
    .sort((a, b) => a.getTime() - b.getTime())[0];

  let nextDeadlineLabel: string | null = null;
  if (nextDeadline) {
    const diff = Math.ceil(
      (nextDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    nextDeadlineLabel = diff === 0 ? "오늘 마감" : `D-${diff}`;
  }

  return (
    <div className="space-y-6">
      {/* 헤더 카드 */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-50 via-white to-pink-50 px-6 py-6 sm:px-7">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-indigo-200/40 blur-2xl"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-10 right-24 h-20 w-20 rounded-full bg-pink-200/40 blur-2xl"
        />
        <div className="relative">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-md shadow-indigo-500/30">
                <BriefcaseIcon className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-gray-900">협찬 관리</h1>
                <p className="mt-0.5 text-sm leading-relaxed text-gray-600">
                  협찬 DM을 분석하고, 콘텐츠 초안을 만들어드려요
                </p>
              </div>
            </div>
            {allRows.length > 0 && (
              <DownloadSponsorshipsExcelButton rows={allRows} handle={handle} />
            )}
          </div>

          {/* 미니 통계 */}
          <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
            <MiniStat
              icon={<SparkleIcon className="h-3.5 w-3.5" />}
              label="이번 달 분석"
              value={`${thisMonthAnalysed || 0}건`}
              tone="indigo"
            />
            <MiniStat
              icon={<ClockIcon className="h-3.5 w-3.5" />}
              label="진행 중"
              value={`${inProgress.length}건`}
              tone="amber"
            />
            <MiniStat
              icon={<FlagIcon className="h-3.5 w-3.5" />}
              label="다음 마감"
              value={nextDeadlineLabel || "없음"}
              tone="rose"
            />
          </div>
        </div>
      </section>

      <SponsorshipTabs inProgress={inProgress} completed={completed} />
    </div>
  );
}

// ──────────────────────────────────────────────
// 미니 통계 카드
// ──────────────────────────────────────────────

const MINI_TONE: Record<
  "indigo" | "amber" | "rose",
  { icon: string; value: string }
> = {
  indigo: { icon: "bg-indigo-100 text-indigo-600", value: "text-indigo-700" },
  amber: { icon: "bg-amber-100 text-amber-600", value: "text-amber-700" },
  rose: { icon: "bg-rose-100 text-rose-600", value: "text-rose-700" },
};

function MiniStat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: keyof typeof MINI_TONE;
}) {
  const t = MINI_TONE[tone];
  return (
    <div className="rounded-2xl bg-white/80 px-3 py-2.5 backdrop-blur ring-1 ring-white/60">
      <div className="flex items-center gap-1.5 text-[10.5px] font-medium text-gray-500">
        <span className={`flex h-5 w-5 items-center justify-center rounded-md ${t.icon}`}>
          {icon}
        </span>
        {label}
      </div>
      <p className={`mt-1 text-base font-bold tabular-nums ${t.value}`}>{value}</p>
    </div>
  );
}

// ──────────────────────────────────────────────
// 아이콘
// ──────────────────────────────────────────────

function BriefcaseIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M7.5 5.25a3 3 0 0 1 3-3h3a3 3 0 0 1 3 3v.205c.933.085 1.857.197 2.774.334 1.454.218 2.476 1.483 2.476 2.917v3.033c0 1.211-.734 2.352-1.936 2.752A24.726 24.726 0 0 1 12 15.75a24.726 24.726 0 0 1-7.814-1.259c-1.202-.4-1.936-1.541-1.936-2.752V8.706c0-1.434 1.022-2.7 2.476-2.917A48.814 48.814 0 0 1 7.5 5.455V5.25Zm7.5 0v.09a49.488 49.488 0 0 0-6 0v-.09a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5Zm-3 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
      <path d="M3 18.4v-2.796a4.3 4.3 0 0 0 .713.31A26.226 26.226 0 0 0 12 17.25c2.892 0 5.68-.468 8.287-1.335.252-.084.49-.189.713-.311V18.4c0 1.452-1.047 2.728-2.523 2.923-2.12.282-4.282.427-6.477.427a49.19 49.19 0 0 1-6.477-.427C4.047 21.128 3 19.852 3 18.4Z" />
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
function ClockIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z" clipRule="evenodd" />
    </svg>
  );
}
function FlagIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M3 2.25a.75.75 0 0 1 .75.75v.54l1.838-.46a9.75 9.75 0 0 1 6.725.738l.108.054A8.25 8.25 0 0 0 18 4.524l3.11-.732a.75.75 0 0 1 .917.81 47.784 47.784 0 0 0 .005 10.337.75.75 0 0 1-.574.812l-3.114.733a9.75 9.75 0 0 1-6.594-.77l-.108-.054a8.25 8.25 0 0 0-5.69-.625l-2.202.55V21a.75.75 0 0 1-1.5 0V3A.75.75 0 0 1 3 2.25Z" clipRule="evenodd" />
    </svg>
  );
}
