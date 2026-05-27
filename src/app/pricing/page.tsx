import Link from "next/link";
import { createClient } from "@/lib/db/supabase-server";
import { MomsUpIcon } from "@/components/ui/momsup-icon";
import { CheckoutButton } from "@/components/pricing/checkout-button";

type PlanTone = "gray" | "indigo" | "dark";

interface PlanDef {
  id: string;
  name: string;
  price: string;
  unit: string;
  description: string;
  features: string[];
  highlighted: boolean;
  tone: PlanTone;
  badge?: string;
}

const PLANS: PlanDef[] = [
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
    tone: "gray",
  },
  {
    id: "growth",
    name: "그로스",
    price: "9.9",
    unit: "만원/월",
    description: "에이전트 500회/월",
    features: [
      "스타터의 모든 기능",
      "협찬 히스토리·인사이트",
      "우선 AI 처리 (3배 빠름)",
      "카카오톡 지원",
    ],
    highlighted: true,
    tone: "indigo",
    badge: "가장 인기",
  },
  {
    id: "business",
    name: "비즈니스",
    price: "19.9",
    unit: "만원/월",
    description: "에이전트 2,000회/월",
    features: [
      "그로스의 모든 기능",
      "멀티 계정 관리",
      "전담 매니저",
      "API 연동",
    ],
    highlighted: false,
    tone: "dark",
  },
];

const TRUST_POINTS = [
  {
    title: "7일 무료 체험",
    body: "카드 등록 없이 모든 기능 그대로 사용해 보세요",
  },
  {
    title: "언제든 취소 가능",
    body: "구독 관리에서 클릭 한 번으로 해지할 수 있어요",
  },
  {
    title: "데이터는 영원히",
    body: "취소 후에도 그동안의 분석·콘텐츠는 그대로 보관돼요",
  },
];

const FAQS = [
  {
    q: "무료 체험은 어떻게 시작하나요?",
    a: "회원가입 후 자동으로 7일 무료 체험이 시작돼요. 카드 등록은 결제 시에만 필요해요.",
  },
  {
    q: "체험 기간이 끝나면 어떻게 되나요?",
    a: "자동으로 결제되지 않아요. 마음에 드시면 플랜을 선택하시고, 그 전까지는 계속 무료 체험 한도로 사용 가능합니다.",
  },
  {
    q: "플랜은 언제든 바꿀 수 있나요?",
    a: "네, 설정 페이지에서 언제든 상위 플랜으로 업그레이드하거나 다운그레이드 할 수 있어요.",
  },
];

export default async function PricingPage() {
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
    // 비로그인 상태
  }

  return (
    <div className="min-h-full bg-[var(--background)]">
      {/* 플로팅 글래스 네비 */}
      <nav className="fixed top-3 left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-5xl -translate-x-1/2 rounded-2xl glass-nav">
        <div className="flex items-center justify-between px-5 py-3">
          <Link
            href={currentPlan ? "/dashboard" : "/landing"}
            className="flex items-center gap-2 transition-spring hover:opacity-80"
          >
            <MomsUpIcon className="h-7 w-7" />
            <span className="text-[15px] font-bold tracking-tight text-gray-900">MomsUp</span>
          </Link>
          <div className="flex items-center gap-2">
            {currentPlan ? (
              <Link
                href="/dashboard"
                className="rounded-xl px-3 py-2 text-[13px] font-semibold text-gray-600 transition-snap hover:bg-pink-50 hover:text-pink-700"
              >
                대시보드로
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl px-3 py-2 text-[13px] font-semibold text-gray-600 transition-snap hover:bg-pink-50 hover:text-pink-700"
                >
                  로그인
                </Link>
                <Link
                  href="/signup"
                  className="rounded-xl cta-gradient px-4 py-2 text-[13px] font-bold text-white transition-spring magnetic"
                >
                  무료로 시작
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* 히어로 */}
      <section className="relative overflow-hidden pt-28 md:pt-36">
        <span aria-hidden className="pointer-events-none absolute -left-32 top-20 h-[28rem] w-[28rem] rounded-full bg-pink-300/30 blur-[100px] animate-blob" />
        <span aria-hidden className="pointer-events-none absolute -right-20 top-40 h-80 w-80 rounded-full bg-rose-200/40 blur-[80px] animate-blob-slow" />
        <div className="mx-auto max-w-5xl px-6 pb-10">
          <div className="text-center">
            <div className="animate-fade-up inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-pink-700 shadow-[0_0_0_1px_rgb(244_63_125_/_0.12),0_8px_24px_-8px_rgb(244_63_125_/_0.3)] backdrop-blur">
              <SparkleIcon className="h-3 w-3" />
              7일 무료 체험 · 카드 등록 불필요
            </div>
            <h1 className="animate-fade-up-1 mt-6 text-3xl font-black tracking-tight text-gray-900 md:text-[44px] md:leading-tight">
              부담 없이 시작하고,
              <br className="hidden sm:block" />
              <span className="text-brand-gradient">편하게 키워가세요</span>
            </h1>
            <p className="animate-fade-up-2 mx-auto mt-5 max-w-xl text-sm leading-relaxed text-gray-600 md:text-base">
              협찬 분석부터 콘텐츠 생성까지, 아이가 잠든 사이에도 AI가 대신해드려요.
            </p>
          </div>
        </div>
      </section>

      {/* 가격 카드 */}
      <section className="relative">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-5 md:grid-cols-3 md:items-start">
            {PLANS.map((plan) => (
              <PlanCard key={plan.id} plan={plan} currentPlan={currentPlan} />
            ))}
          </div>
        </div>
      </section>

      {/* 트러스트 시그널 */}
      <section className="mt-14">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {TRUST_POINTS.map((t, i) => (
              <div
                key={i}
                className="bezel bezel-hover group p-5 transition-spring"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-[0_4px_12px_-2px_rgb(16_185_129_/_0.4)] transition-spring group-hover:scale-110 group-hover:rotate-6">
                  <CheckIcon className="h-4 w-4 text-white" />
                </div>
                <p className="mt-4 text-sm font-bold text-gray-900">{t.title}</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-gray-500">
                  {t.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-14 pb-20">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-wider text-pink-600">
              자주 묻는 질문
            </p>
            <h2 className="mt-1 text-xl font-bold text-gray-900">
              궁금한 점이 있으신가요?
            </h2>
          </div>
          <ul className="mt-8 space-y-3">
            {FAQS.map((faq, i) => (
              <li
                key={i}
                className="bezel p-5"
              >
                <p className="flex items-start gap-2.5 text-sm font-bold text-gray-900">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-100 to-rose-100 text-[10px] font-black text-pink-700 ring-1 ring-inset ring-pink-200/60">
                    Q
                  </span>
                  {faq.q}
                </p>
                <p className="mt-2.5 pl-7 text-[13px] leading-relaxed text-gray-600">
                  {faq.a}
                </p>
              </li>
            ))}
          </ul>

          <div className="bezel mt-10 bg-gradient-to-br from-pink-50 via-white to-rose-50 p-7 text-center">
            <p className="text-sm font-bold text-gray-900">
              여전히 망설여진다면?
            </p>
            <p className="mt-1.5 text-xs text-gray-600">
              궁금한 점은{" "}
              <a
                href="mailto:contact@example.com"
                className="font-semibold text-pink-600 hover:underline"
              >
                contact@example.com
              </a>
              으로 편하게 보내주세요.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

// ──────────────────────────────────────────────
// 플랜 카드
// ──────────────────────────────────────────────

function PlanCard({
  plan,
  currentPlan,
}: {
  plan: PlanDef;
  currentPlan: string | null;
}) {
  const isCurrent = currentPlan === plan.id;

  const containerClass = plan.highlighted
    ? "relative md:-mt-4 overflow-hidden rounded-3xl bg-gradient-to-br from-pink-600 via-rose-600 to-pink-800 p-7 text-white shadow-[0_0_0_1px_rgb(244_63_125_/_0.3),0_24px_64px_-16px_rgb(244_63_125_/_0.5)] transition-spring magnetic md:p-8"
    : plan.tone === "dark"
      ? "bezel bezel-hover relative overflow-hidden bg-gray-900 p-7 text-white transition-spring"
      : "bezel bezel-hover relative overflow-hidden p-7 transition-spring";

  return (
    <div className={containerClass}>
      {plan.highlighted && (
        <>
          <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl animate-glow" />
          <span aria-hidden className="pointer-events-none absolute -bottom-12 -right-4 h-32 w-32 rounded-full bg-pink-400/30 blur-2xl" />
          <span aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgb(255_255_255_/_0.15),transparent_50%)]" />
        </>
      )}

      {/* 뱃지 */}
      {plan.highlighted && plan.badge && !isCurrent && (
        <div className="absolute right-5 top-5">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-pink-700 shadow-sm">
            <SparkleIcon className="h-2.5 w-2.5" />
            {plan.badge}
          </span>
        </div>
      )}
      {isCurrent && (
        <div className="absolute right-5 top-5">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
            <CheckIcon className="h-2.5 w-2.5" />
            사용 중
          </span>
        </div>
      )}

      <div className="relative">
        <h3
          className={`text-base font-bold ${
            plan.highlighted || plan.tone === "dark"
              ? "text-white"
              : "text-gray-900"
          }`}
        >
          {plan.name}
        </h3>
        <p
          className={`mt-1 text-xs ${
            plan.highlighted
              ? "text-pink-100"
              : plan.tone === "dark"
                ? "text-gray-400"
                : "text-gray-500"
          }`}
        >
          {plan.description}
        </p>

        <div className="mt-6 flex items-baseline gap-1">
          <span
            className={`text-[56px] font-black tracking-tight tabular-nums ${
              plan.highlighted || plan.tone === "dark"
                ? "text-white"
                : "text-gray-900"
            }`}
          >
            {plan.price}
          </span>
          <span
            className={`text-sm font-medium ${
              plan.highlighted
                ? "text-pink-100"
                : plan.tone === "dark"
                  ? "text-gray-400"
                  : "text-gray-500"
            }`}
          >
            {plan.unit}
          </span>
        </div>

        <ul className="mt-6 space-y-2.5">
          {plan.features.map((f) => (
            <li
              key={f}
              className={`flex items-start gap-2 text-[13px] ${
                plan.highlighted
                  ? "text-pink-50"
                  : plan.tone === "dark"
                    ? "text-gray-300"
                    : "text-gray-600"
              }`}
            >
              <span
                className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full ${
                  plan.highlighted
                    ? "bg-white/20"
                    : plan.tone === "dark"
                      ? "bg-white/10"
                      : "bg-pink-100"
                }`}
              >
                <CheckIcon
                  className={`h-2.5 w-2.5 ${
                    plan.highlighted
                      ? "text-white"
                      : plan.tone === "dark"
                        ? "text-white"
                        : "text-pink-600"
                  }`}
                />
              </span>
              {f}
            </li>
          ))}
        </ul>

        {isCurrent ? (
          <div
            className={`mt-7 flex w-full items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold ${
              plan.highlighted
                ? "bg-white/15 text-white ring-1 ring-inset ring-white/30"
                : plan.tone === "dark"
                  ? "bg-white/10 text-white ring-1 ring-inset ring-white/20"
                  : "border border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            <CheckIcon className="h-3.5 w-3.5" />
            사용 중
          </div>
        ) : (
          <CheckoutButton
            plan={plan.id}
            highlighted={plan.highlighted}
            isLoggedIn={!!currentPlan}
          />
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// 아이콘
// ──────────────────────────────────────────────

function SparkleIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5Z" clipRule="evenodd" />
    </svg>
  );
}
function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
    </svg>
  );
}
