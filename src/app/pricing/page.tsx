import Link from "next/link";
import { createClient } from "@/lib/db/supabase-server";

const PLANS = [
  {
    id: "starter",
    name: "스타터",
    price: "3.9",
    unit: "만원/월",
    description: "에이전트 100회/월",
    features: [
      "협찬 DM AI 분석",
      "콘텐츠 자동 생성",
      "광고 표시 규정 자동 반영",
      "이메일 지원",
    ],
    highlighted: false,
  },
  {
    id: "growth",
    name: "그로스",
    price: "9.9",
    unit: "만원/월",
    description: "에이전트 500회/월",
    features: [
      "스타터 플랜의 모든 기능",
      "협찬 히스토리 분석",
      "우선 AI 처리",
      "카카오톡 지원",
    ],
    highlighted: true,
  },
  {
    id: "business",
    name: "비즈니스",
    price: "19.9",
    unit: "만원/월",
    description: "에이전트 2,000회/월",
    features: [
      "그로스 플랜의 모든 기능",
      "멀티 계정 관리",
      "전담 매니저",
      "API 연동",
    ],
    highlighted: false,
  },
];

export default async function PricingPage() {
  // 로그인 여부와 현재 플랜 확인 (비로그인도 접근 가능)
  let currentPlan: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .single();
      currentPlan = profile?.plan || "free_trial";
    }
  } catch {
    // 비로그인 상태 — 무시
  }

  return (
    <div className="min-h-full bg-white">
      {/* 헤더 */}
      <nav className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href={currentPlan ? "/dashboard" : "/landing"} className="text-lg font-bold text-gray-900">
            chaechae_daddy
          </Link>
          <div className="flex items-center gap-3">
            {currentPlan ? (
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                대시보드로 돌아가기
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  로그인
                </Link>
                <Link href="/signup" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors">
                  무료로 시작
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">
              심플한 가격, 확실한 효과
            </h1>
            <p className="mt-3 text-gray-500">
              7일 무료 체험 후 나에게 맞는 플랜을 선택하세요
            </p>
          </div>

          {/* 무료 체험 배너 */}
          {(!currentPlan || currentPlan === "free_trial") && (
            <div className="mt-10 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 p-6 text-center">
              <p className="text-sm font-semibold text-indigo-700">
                모든 플랜은 7일 무료 체험으로 시작합니다
              </p>
              <p className="mt-1 text-xs text-indigo-500">
                카드 등록 없이 — 체험 후 마음에 들면 결제하세요
              </p>
            </div>
          )}

          {/* 가격 카드 */}
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {PLANS.map(function (plan) {
              const isCurrent = currentPlan === plan.id;

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border p-8 ${
                    plan.highlighted
                      ? "border-indigo-600 ring-2 ring-indigo-600/20 shadow-lg"
                      : "border-gray-200"
                  }`}
                >
                  {/* 추천 뱃지 */}
                  {plan.highlighted && !isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-semibold text-white">
                      추천
                    </div>
                  )}
                  {/* 현재 플랜 뱃지 */}
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-3 py-0.5 text-xs font-semibold text-white">
                      현재 플랜
                    </div>
                  )}

                  <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                    <span className="text-sm text-gray-500">{plan.unit}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">{plan.description}</p>

                  {/* 기능 리스트 */}
                  <ul className="mt-6 space-y-3">
                    {plan.features.map(function (feature) {
                      return (
                        <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-indigo-500 mt-0.5">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                          </svg>
                          {feature}
                        </li>
                      );
                    })}
                  </ul>

                  {/* CTA 버튼 */}
                  {isCurrent ? (
                    <div className="mt-8 w-full rounded-lg border border-emerald-200 bg-emerald-50 py-2.5 text-center text-sm font-medium text-emerald-700">
                      사용 중
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className={`mt-8 block w-full rounded-lg py-2.5 text-center text-sm font-semibold transition-colors ${
                        plan.highlighted
                          ? "bg-indigo-600 text-white opacity-70 cursor-not-allowed"
                          : "bg-gray-100 text-gray-700 opacity-70 cursor-not-allowed"
                      }`}
                    >
                      곧 오픈 예정
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* MVP 안내 */}
          <div className="mt-10 rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
            <p className="text-sm font-medium text-gray-700">
              결제 기능은 곧 추가될 예정입니다
            </p>
            <p className="mt-1 text-xs text-gray-500">
              현재는 무료 체험으로 모든 기능을 사용해보실 수 있어요.
              출시 알림을 받으시려면{" "}
              <span className="text-indigo-600 font-medium">contact@chaechaedaddy.com</span>으로
              메일을 보내주세요.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
