import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 유저 메타데이터에서 정보 추출
  const instagramHandle =
    user.user_metadata?.instagram_handle || "사용자";
  const createdAt = new Date(user.created_at);
  const trialEndDate = new Date(createdAt);
  trialEndDate.setDate(trialEndDate.getDate() + 7);

  const now = new Date();
  const diffTime = trialEndDate.getTime() - now.getTime();
  const trialDaysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  // TODO: 실제 데이터는 Supabase DB에서 조회 — 지금은 목업
  const stats = {
    totalSponsorships: 0,
    accepted: 0,
    rejected: 0,
    pending: 0,
    contentsCreated: 0,
    postsCompleted: 0,
    agentRunsLeft: 100,
    agentRunsTotal: 100,
  };

  return (
    <>
      {/* 인사말 + 체험 D-day */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            안녕하세요, {instagramHandle}님
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            오늘도 협찬 관리를 도와드릴게요
          </p>
        </div>
        {trialDaysLeft > 0 && (
          <div className="mt-2 sm:mt-0 inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            무료 체험 D-{trialDaysLeft}
          </div>
        )}
      </div>

      {/* 빠른 시작 */}
      <Link
        href="/dashboard/content"
        className="mt-6 flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all group"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-6 w-6 transition-transform group-hover:scale-110"
        >
          <path
            fillRule="evenodd"
            d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.966 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5ZM16.5 15a.75.75 0 0 1 .712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 0 1 0 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 0 1-1.422 0l-.395-1.183a1.5 1.5 0 0 0-.948-.948l-1.183-.395a.75.75 0 0 1 0-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0 1 16.5 15Z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-lg font-semibold">새 협찬 분석하기</span>
      </Link>

      {/* 통계 카드 그리드 */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* 카드 1: 이번 달 협찬 현황 */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-medium text-gray-500">
            이번 달 협찬 현황
          </h2>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {stats.totalSponsorships}건
          </p>
          <div className="mt-4 flex gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-gray-500">
                수락 {stats.accepted}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              <span className="text-gray-500">
                거절 {stats.rejected}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="text-gray-500">
                대기 {stats.pending}
              </span>
            </div>
          </div>
        </div>

        {/* 카드 2: 콘텐츠 */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-medium text-gray-500">콘텐츠</h2>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {stats.contentsCreated}건
          </p>
          <div className="mt-4 flex gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              <span className="text-gray-500">
                생성됨 {stats.contentsCreated}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-gray-500">
                포스팅 {stats.postsCompleted}
              </span>
            </div>
          </div>
        </div>

        {/* 카드 3: 에이전트 사용량 */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-medium text-gray-500">
            에이전트 실행 횟수
          </h2>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {stats.agentRunsLeft}
            <span className="text-base font-normal text-gray-400">
              /{stats.agentRunsTotal}
            </span>
          </p>
          {/* 프로그레스 바 */}
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all"
              style={{
                width: `${(stats.agentRunsLeft / stats.agentRunsTotal) * 100}%`,
              }}
            />
          </div>
          <p className="mt-2 text-xs text-gray-400">
            이번 달 남은 횟수
          </p>
        </div>
      </div>
    </>
  );
}
