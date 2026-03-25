import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { DailyChart } from "@/components/dashboard/daily-chart";

// 플랜 정보
const PLAN_INFO: Record<string, { name: string; limit: number; price: string }> = {
  free_trial: { name: "무료 체험", limit: 10, price: "₩0" },
  starter: { name: "스타터", limit: 100, price: "₩39,000/월" },
  growth: { name: "그로스", limit: 500, price: "₩99,000/월" },
  business: { name: "비즈니스", limit: 2000, price: "₩199,000/월" },
};

export default async function UsagePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 프로필 조회
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, trial_ends_at")
    .eq("id", user.id)
    .single();

  const plan = profile?.plan || "free_trial";
  const info = PLAN_INFO[plan] || PLAN_INFO.free_trial;

  // 트라이얼 남은 일수
  let trialDaysLeft = 0;
  if (plan === "free_trial" && profile?.trial_ends_at) {
    const diff = new Date(profile.trial_ends_at).getTime() - Date.now();
    trialDaysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  // 기간 시작일 계산
  let periodStart: string;
  let periodLabel: string;
  if (plan === "free_trial" && profile?.trial_ends_at) {
    const trialEnd = new Date(profile.trial_ends_at);
    const trialStart = new Date(trialEnd);
    trialStart.setDate(trialStart.getDate() - 7);
    periodStart = trialStart.toISOString();
    periodLabel = "체험 기간";
  } else {
    const now = new Date();
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    periodLabel = `${now.getFullYear()}년 ${now.getMonth() + 1}월`;
  }

  // 이번 기간 사용량
  const { count: totalUsed } = await supabase
    .from("agent_usage")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", periodStart);

  const used = totalUsed || 0;
  const remaining = Math.max(0, info.limit - used);
  const usagePercent = info.limit > 0 ? Math.min(100, Math.round((used / info.limit) * 100)) : 0;

  // 타입별 사용량
  const { count: analysisCount } = await supabase
    .from("agent_usage")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("type", "sponsorship_analysis")
    .gte("created_at", periodStart);

  const { count: contentCount } = await supabase
    .from("agent_usage")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("type", "content_generation")
    .gte("created_at", periodStart);

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

  // 일별로 그룹핑
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
  const dailyData = Array.from(dailyMap.entries()).map(function ([date, count]) {
    return { date, count };
  });

  // 프로그레스 바 색상
  let barColor = "bg-indigo-500";
  if (usagePercent >= 90) barColor = "bg-red-500";
  else if (usagePercent >= 70) barColor = "bg-amber-500";

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">사용량</h1>
        <p className="mt-1 text-sm text-gray-500">{periodLabel} 에이전트 사용 현황</p>
      </div>

      {/* 현재 플랜 카드 */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-gray-900">{info.name} 플랜</h2>
              {plan === "free_trial" && trialDaysLeft > 0 && (
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  trialDaysLeft <= 2
                    ? "bg-red-100 text-red-700"
                    : "bg-indigo-100 text-indigo-700"
                }`}>
                  D-{trialDaysLeft}
                </span>
              )}
              {plan === "free_trial" && trialDaysLeft === 0 && (
                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">
                  만료됨
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500">{info.price}</p>
          </div>
          {plan !== "business" && (
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              플랜 업그레이드
            </Link>
          )}
        </div>

        {/* 트라이얼 만료 경고 */}
        {plan === "free_trial" && trialDaysLeft <= 2 && trialDaysLeft > 0 && (
          <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
            <p className="text-sm text-amber-800">
              무료 체험이 {trialDaysLeft}일 후 종료됩니다.
              스타터 플랜으로 업그레이드하시면 데이터가 유지되며 매달 100회까지 사용할 수 있어요.
            </p>
          </div>
        )}
      </div>

      {/* 사용량 메인 */}
      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-gray-500">에이전트 사용량</p>
            <p className="mt-1">
              <span className="text-3xl font-bold text-gray-900">{used}</span>
              <span className="text-lg text-gray-400"> / {info.limit}회</span>
            </p>
          </div>
          <p className="text-sm text-gray-500">남은 횟수: <span className="font-semibold text-gray-900">{remaining}회</span></p>
        </div>

        {/* 프로그레스 바 */}
        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full ${barColor} transition-all`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
        <p className="mt-2 text-right text-xs text-gray-400">{usagePercent}% 사용</p>

        {/* 타입별 분류 */}
        <div className="mt-5 grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs text-gray-400">협찬 분석</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{analysisCount || 0}회</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs text-gray-400">콘텐츠 생성</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{contentCount || 0}회</p>
          </div>
        </div>
      </div>

      {/* 일별 사용량 차트 */}
      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-medium text-gray-500 mb-4">일별 사용량 (최근 14일)</h3>
        <DailyChart data={dailyData} />
      </div>
    </>
  );
}
