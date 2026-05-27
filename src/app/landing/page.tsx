import Link from "next/link";
import { MomsUpIcon } from "@/components/ui/momsup-icon";

const PAIN_POINTS = [
  {
    icon: <ClockIcon />,
    tone: "amber",
    title: "협찬 1건당 40분",
    body: "DM 하나하나 조건 확인하고 답장 작성하느라 매일 1~2시간씩 소비",
  },
  {
    icon: <AlertIcon />,
    tone: "rose",
    title: "요구사항 놓침",
    body: "광고주가 요청한 #광고 표시·태그·후기 포인트를 빠뜨릴까 늘 불안",
  },
  {
    icon: <PencilIcon />,
    tone: "indigo",
    title: "광고티 나는 캡션",
    body: "자연스럽게 녹여낸 광고 콘텐츠를 만드는 게 매번 까다로움",
  },
  {
    icon: <ScaleIcon />,
    tone: "purple",
    title: "규정 리스크",
    body: "공정위 표시광고 가이드라인을 매번 확인하기 어려워 늘 불안",
  },
];

const STEPS = [
  {
    n: "01",
    title: "협찬 DM 붙여넣기",
    body: "받은 협찬 DM을 그대로 복사해서 붙여넣어요",
    icon: <ChatIcon />,
  },
  {
    n: "02",
    title: "AI가 30초만에 분석",
    body: "조건·리스크·답장 초안 3종을 자동 생성해드려요",
    icon: <SparkleIcon />,
  },
  {
    n: "03",
    title: "수락하면 콘텐츠 완성",
    body: "체크리스트·캡션·해시태그가 한 번에 만들어져요",
    icon: <CheckIcon />,
  },
  {
    n: "04",
    title: "복사해서 바로 포스팅",
    body: "인스타에 붙여넣기만 하면 끝. 하루 평균 30분 절약",
    icon: <CopyIcon />,
  },
];

const PRICING = [
  {
    name: "스타터",
    price: "3.9",
    unit: "만원/월",
    description: "에이전트 100회",
    highlighted: false,
    tone: "gray" as const,
  },
  {
    name: "그로스",
    price: "9.9",
    unit: "만원/월",
    description: "에이전트 500회",
    highlighted: true,
    tone: "indigo" as const,
    badge: "가장 인기",
  },
  {
    name: "비즈니스",
    price: "19.9",
    unit: "만원/월",
    description: "에이전트 2,000회",
    highlighted: false,
    tone: "dark" as const,
  },
];

const TONE_PAIN: Record<
  "amber" | "rose" | "indigo" | "purple",
  { iconBg: string; iconText: string; ring: string }
> = {
  amber: { iconBg: "bg-amber-100", iconText: "text-amber-700", ring: "ring-amber-200/50" },
  rose: { iconBg: "bg-rose-100", iconText: "text-rose-700", ring: "ring-rose-200/50" },
  indigo: { iconBg: "bg-pink-100", iconText: "text-pink-700", ring: "ring-pink-200/50" },
  purple: { iconBg: "bg-fuchsia-100", iconText: "text-fuchsia-700", ring: "ring-fuchsia-200/50" },
};

export default function LandingPage() {
  return (
    <div className="min-h-full bg-[var(--background)]">
      {/* ─────────── 플로팅 글래스 네비게이션 ─────────── */}
      <nav className="fixed top-3 left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-5xl -translate-x-1/2 rounded-2xl glass-nav">
        <div className="flex items-center justify-between px-5 py-3">
          <Link href="/landing" className="flex items-center gap-2 transition-spring hover:opacity-80">
            <MomsUpIcon className="h-7 w-7" />
            <span className="text-[15px] font-bold tracking-tight text-gray-900">
              MomsUp
            </span>
          </Link>
          <div className="flex items-center gap-2">
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
          </div>
        </div>
      </nav>

      {/* ─────────── 히어로 ─────────── */}
      <section className="relative overflow-hidden pt-36 pb-24 md:pt-48 md:pb-32">
        {/* 배경 데코 — 비대칭 floating blobs */}
        <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-pink-50 via-white to-rose-50" />
        <span aria-hidden className="pointer-events-none absolute -left-32 top-20 h-[28rem] w-[28rem] rounded-full bg-pink-300/35 blur-[100px] animate-blob" />
        <span aria-hidden className="pointer-events-none absolute -right-16 top-44 h-80 w-80 rounded-full bg-rose-300/30 blur-[80px] animate-blob-slow" />
        <span aria-hidden className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-amber-200/40 blur-[90px] animate-blob" />

        <div className="relative mx-auto max-w-5xl px-6">
          {/* 비대칭 정렬 — 텍스트는 가운데, 우측에 떠있는 카드 액센트 */}
          <div className="text-center">
            <div className="animate-fade-up inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-pink-700 shadow-[0_0_0_1px_rgb(244_63_125_/_0.12),0_8px_24px_-8px_rgb(244_63_125_/_0.3)] backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-pink-500" />
              </span>
              7일 무료 체험 · 카드 등록 불필요
            </div>

            <h1 className="animate-fade-up-1 mt-7 text-[36px] font-black leading-[1.05] tracking-tight text-gray-900 md:text-[56px] lg:text-[68px]">
              협찬 받고,
              <br />
              <span className="relative inline-block">
                <span className="text-brand-gradient">AI가 콘텐츠까지</span>
                <span aria-hidden className="absolute -bottom-1 left-0 h-1 w-full rounded-full bg-gradient-to-r from-pink-400 via-rose-400 to-pink-400 opacity-40" />
              </span>
              <br />
              만들어드려요
            </h1>

            <p className="animate-fade-up-2 mx-auto mt-6 max-w-xl text-base leading-relaxed text-gray-600 md:text-lg">
              DM 받자마자 <span className="font-semibold text-gray-900">3분 안에</span> 분석·체크리스트·캡션·해시태그까지.
              <br className="hidden sm:block" />
              아이가 잠든 사이에도 AI가 일하고 있어요.
            </p>

            <div className="animate-fade-up-3 mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 rounded-2xl cta-gradient px-7 py-4 text-base font-bold text-white transition-spring magnetic"
              >
                <SparkleIcon className="h-4 w-4 transition-transform group-hover:rotate-12" />
                7일 무료로 시작
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="#how"
                className="bezel-soft px-6 py-3.5 text-sm font-bold text-gray-700 transition-spring hover:-translate-y-0.5"
              >
                어떻게 작동하나요?
              </Link>
            </div>

            {/* 신뢰 시그널 */}
            <div className="animate-fade-up-4 mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12px] font-medium text-gray-500">
              <TrustBadge>카드 등록 없이 시작</TrustBadge>
              <span className="hidden h-3 w-px bg-gray-300 sm:inline-block" />
              <TrustBadge>언제든 취소 가능</TrustBadge>
              <span className="hidden h-3 w-px bg-gray-300 sm:inline-block" />
              <TrustBadge>데이터는 영원히 보관</TrustBadge>
            </div>
          </div>

          {/* 떠 있는 미리보기 카드 — 비대칭 액센트 */}
          <div className="animate-fade-up-4 relative mt-16 mx-auto max-w-3xl">
            <div className="bezel rounded-[28px] p-2">
              <div className="rounded-3xl bg-gradient-to-br from-pink-50 via-white to-rose-50 p-6 md:p-8">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  <span className="h-2 w-2 rounded-full bg-rose-400" />
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="ml-3">협찬 DM 분석 결과</span>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <PreviewStat label="브랜드" value="○○뷰티" icon="💄" />
                  <PreviewStat label="고료" value="20만원" icon="💰" />
                  <PreviewStat label="리스크" value="낮음" icon="✅" highlight />
                </div>
                <div className="mt-4 rounded-2xl bg-white/80 p-4 ring-1 ring-pink-100">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-pink-600">AI 추천 답장</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-700">
                    안녕하세요! 좋은 제안 감사합니다. 제 채널과 잘 맞는 브랜드 같아 긍정적으로 검토 중이에요. 다음 일정만 조율되면 진행 가능합니다.
                  </p>
                </div>
              </div>
            </div>
            <span aria-hidden className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-pink-400/20 blur-2xl animate-glow" />
            <span aria-hidden className="pointer-events-none absolute -left-8 -bottom-8 h-28 w-28 rounded-full bg-amber-300/30 blur-2xl animate-glow" />
          </div>
        </div>
      </section>

      {/* ─────────── 문제 제시 ─────────── */}
      <section className="relative bg-[var(--surface-2)] py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-rose-600">
              매일의 고민
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-gray-900 md:text-[40px]">
              협찬 관리, 이런 점이 힘들죠?
            </h2>
            <p className="mt-3 text-sm text-gray-500 md:text-base">
              팔로워 2천명 육아 인플루언서가 직접 겪고 정리한 문제들이에요
            </p>
          </div>

          {/* 비대칭 — 첫 카드가 살짝 크고 두 번째가 살짝 내려옴 */}
          <div className="mt-14 grid gap-4 md:grid-cols-2">
            {PAIN_POINTS.map((item, i) => {
              const t = TONE_PAIN[item.tone as keyof typeof TONE_PAIN];
              return (
                <div
                  key={i}
                  className={`bezel bezel-hover group flex items-start gap-4 p-6 md:p-7 ${
                    i % 2 === 1 ? "md:mt-8" : ""
                  }`}
                >
                  <span
                    className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${t.iconBg} ${t.iconText} ring-1 ring-inset ${t.ring} transition-transform group-hover:scale-110 group-hover:rotate-3`}
                  >
                    {item.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-bold text-gray-900">{item.title}</p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-gray-600">
                      {item.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────── 솔루션 / 작동 방식 ─────────── */}
      <section id="how" className="relative py-24 md:py-32">
        <span aria-hidden className="pointer-events-none absolute -top-20 right-0 h-80 w-80 rounded-full bg-pink-100/60 blur-[80px]" />
        <div className="relative mx-auto max-w-5xl px-6">
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-pink-600">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-gray-900 md:text-[40px]">
              AI가{" "}
              <span className="text-brand-gradient">3분</span>
              만에 해결해요
            </h2>
            <p className="mt-3 text-sm text-gray-500 md:text-base">
              복사 → 분석 → 콘텐츠 → 포스팅. 단 4단계.
            </p>
          </div>

          {/* 스텝 — 점선 connector 로 흐름 강조 */}
          <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div
                key={i}
                className="bezel bezel-hover group relative p-6"
              >
                <span className="absolute -top-3 left-6 inline-flex items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-600 px-2.5 py-1 text-[10px] font-black tracking-wider text-white shadow-[0_4px_12px_-2px_rgb(244_63_125_/_0.5)]">
                  STEP {s.n}
                </span>
                <div className="mt-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-50 to-rose-50 text-pink-600 ring-1 ring-inset ring-pink-200/50 transition-transform group-hover:scale-110 group-hover:rotate-6">
                  {s.icon}
                </div>
                <h3 className="mt-4 text-[15px] font-bold text-gray-900">{s.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-gray-500">
                  {s.body}
                </p>
                {/* 화살표 connector (마지막 카드 제외, 데스크톱) */}
                {i < STEPS.length - 1 && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white text-pink-400 ring-1 ring-pink-200 lg:flex"
                  >
                    <ArrowRightIcon className="h-3 w-3" />
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── 사회적 증거 ─────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-pink-600 via-rose-600 to-pink-800 py-24 md:py-32">
        <span aria-hidden className="pointer-events-none absolute -right-32 -top-10 h-96 w-96 rounded-full bg-pink-400/30 blur-[100px] animate-blob" />
        <span aria-hidden className="pointer-events-none absolute -left-10 bottom-0 h-72 w-72 rounded-full bg-amber-300/20 blur-[80px] animate-blob-slow" />
        <span aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgb(255_255_255_/_0.1),transparent_60%)]" />

        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-pink-200">
            실제 사용 사례
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white md:text-[40px]">
            육아 인플루언서가 직접 만들고
            <br className="hidden sm:block" />
            <span className="text-pink-100">매일 사용 중인 도구</span>예요
          </h2>

          <div className="mt-16 grid gap-4 sm:grid-cols-3">
            <BeforeAfter label="협찬 1건 처리" value="40분" suffix="Before" tone="muted" />
            <BeforeAfter label="협찬 1건 처리" value="3분" suffix="After" tone="bright" />
            <BeforeAfter label="시간 절감" value="93%" suffix="" tone="highlight" />
          </div>
        </div>
      </section>

      {/* ─────────── 가격 ─────────── */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-pink-600">
              가격
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-gray-900 md:text-[40px]">
              부담 없이 시작해보세요
            </h2>
            <p className="mt-3 text-sm text-gray-500 md:text-base">
              7일 무료 체험 후 마음에 들면 결제하세요
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-3 md:items-start">
            {PRICING.map((plan) => (
              <PlanCard key={plan.name} plan={plan} />
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── CTA 반복 ─────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-pink-50 py-24 md:py-28">
        <span aria-hidden className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-amber-200/40 blur-[80px] animate-blob" />
        <span aria-hidden className="pointer-events-none absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-pink-200/50 blur-[80px] animate-blob-slow" />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-black tracking-tight text-gray-900 md:text-[40px]">
            오늘부터, 협찬은 <span className="text-brand-gradient">AI에게</span> 맡겨보세요
          </h2>
          <p className="mt-4 text-base text-gray-600 md:text-lg">
            3분이면 협찬 1건의 분석과 콘텐츠 초안이 완성돼요.
          </p>
          <Link
            href="/signup"
            className="group mt-10 inline-flex items-center gap-2 rounded-2xl cta-gradient px-8 py-4 text-base font-bold text-white transition-spring magnetic"
          >
            <SparkleIcon className="h-4 w-4 transition-transform group-hover:rotate-12" />
            지금 무료로 시작하기
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* ─────────── 푸터 ─────────── */}
      <footer className="border-t border-gray-100 bg-white py-12">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <div className="inline-flex items-center gap-2">
            <MomsUpIcon className="h-6 w-6" />
            <span className="text-sm font-bold text-gray-900">MomsUp</span>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            문의:{" "}
            <a href="mailto:contact@example.com" className="font-medium text-pink-600 hover:underline">
              contact@example.com
            </a>
          </p>
          <p className="mt-4 text-[10.5px] text-gray-400">
            © 2026 MomsUp. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function TrustBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <CheckIcon className="h-3.5 w-3.5 text-emerald-500" />
      {children}
    </span>
  );
}

function PreviewStat({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-3.5 text-left ring-1 ring-inset ${
        highlight ? "bg-emerald-50 ring-emerald-200" : "bg-white ring-pink-100"
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-gray-900">
        <span>{icon}</span>
        {value}
      </p>
    </div>
  );
}

function BeforeAfter({
  label,
  value,
  suffix,
  tone,
}: {
  label: string;
  value: string;
  suffix: string;
  tone: "muted" | "bright" | "highlight";
}) {
  const valueClass =
    tone === "muted"
      ? "text-white/60"
      : tone === "highlight"
        ? "text-amber-200"
        : "text-white";
  const ring =
    tone === "highlight"
      ? "ring-amber-200/30 bg-white/10"
      : "ring-white/15 bg-white/5";
  return (
    <div
      className={`rounded-3xl p-6 backdrop-blur-md ring-1 ring-inset ${ring} transition-spring magnetic`}
    >
      {suffix && (
        <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-pink-200">
          {suffix}
        </p>
      )}
      <p className={`mt-1.5 text-5xl font-black tabular-nums tracking-tight ${valueClass}`}>
        {value}
      </p>
      <p className="mt-1.5 text-xs text-pink-100/80">{label}</p>
    </div>
  );
}

function PlanCard({
  plan,
}: {
  plan: {
    name: string;
    price: string;
    unit: string;
    description: string;
    highlighted: boolean;
    tone: "gray" | "indigo" | "dark";
    badge?: string;
  };
}) {
  const containerClass = plan.highlighted
    ? "relative md:-mt-4 overflow-hidden rounded-3xl bg-gradient-to-br from-pink-600 via-rose-600 to-pink-800 p-7 text-white shadow-[0_0_0_1px_rgb(244_63_125_/_0.3),0_24px_64px_-16px_rgb(244_63_125_/_0.5)] transition-spring magnetic"
    : plan.tone === "dark"
      ? "relative overflow-hidden rounded-3xl bg-gray-900 p-7 text-white bezel-hover transition-spring"
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
      {plan.badge && (
        <div className="absolute right-5 top-5">
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-pink-700 shadow-md">
            <SparkleIcon className="h-2.5 w-2.5" />
            {plan.badge}
          </span>
        </div>
      )}

      <div className="relative">
        <h3
          className={`text-[15px] font-bold ${
            plan.highlighted || plan.tone === "dark" ? "text-white" : "text-gray-900"
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
              plan.highlighted || plan.tone === "dark" ? "text-white" : "text-gray-900"
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

        <Link
          href="/signup"
          className={`group mt-7 flex w-full items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold transition-spring ${
            plan.highlighted
              ? "bg-white text-pink-700 hover:-translate-y-0.5 hover:shadow-xl"
              : plan.tone === "dark"
                ? "bg-white text-gray-900 hover:-translate-y-0.5 hover:shadow-lg"
                : "cta-gradient text-white hover:-translate-y-0.5"
          }`}
        >
          무료로 시작하기
          <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Icons
// ──────────────────────────────────────────────

function SparkleIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5Z" clipRule="evenodd" />
    </svg>
  );
}
function ArrowRightIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z" clipRule="evenodd" />
    </svg>
  );
}
function AlertIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
    </svg>
  );
}
function PencilIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32L19.513 8.2Z" />
    </svg>
  );
}
function ScaleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v.756a49.106 49.106 0 0 1 9.152 1 .75.75 0 0 1-.152 1.485h-1.918l2.474 10.124a.75.75 0 0 1-.375.84A6.723 6.723 0 0 1 18.75 18a6.723 6.723 0 0 1-3.181-.795.75.75 0 0 1-.375-.84l2.474-10.124H12.75v13.28c1.293.076 2.534.343 3.697.776a.75.75 0 0 1-.262 1.453h-8.37a.75.75 0 0 1-.262-1.453c1.162-.433 2.404-.7 3.697-.775V6.24H6.332l2.474 10.124a.75.75 0 0 1-.375.84A6.723 6.723 0 0 1 5.25 18a6.723 6.723 0 0 1-3.181-.795.75.75 0 0 1-.375-.84L4.168 6.241H2.25a.75.75 0 0 1-.152-1.485 49.105 49.105 0 0 1 9.152-1V3a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
    </svg>
  );
}
function ChatIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 0 0 6 21.75a6.721 6.721 0 0 0 3.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 0 1-.814 1.686.75.75 0 0 0 .44 1.223ZM8.25 10.875a1.125 1.125 0 1 0 0 2.25 1.125 1.125 0 0 0 0-2.25ZM10.875 12a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Zm4.875-1.125a1.125 1.125 0 1 0 0 2.25 1.125 1.125 0 0 0 0-2.25Z" clipRule="evenodd" />
    </svg>
  );
}
function CheckIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
    </svg>
  );
}
function CopyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path fillRule="evenodd" d="M17.663 3.118c.225.015.45.032.673.05C19.876 3.298 21 4.604 21 6.109v9.642a3 3 0 0 1-3 3V16.5c0-5.922-4.576-10.775-10.384-11.217.324-1.132 1.3-2.01 2.548-2.114.224-.019.448-.036.673-.051A3 3 0 0 1 13.5 1.5H15a3 3 0 0 1 2.663 1.618ZM12 4.5A1.5 1.5 0 0 1 13.5 3H15a1.5 1.5 0 0 1 1.5 1.5H12Z" clipRule="evenodd" />
      <path d="M3 8.625c0-1.036.84-1.875 1.875-1.875h.375A3.75 3.75 0 0 1 9 10.5v1.875c0 1.036.84 1.875 1.875 1.875h1.875A3.75 3.75 0 0 1 16.5 18v2.625c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 0 1 3 20.625v-12Z" />
      <path d="M10.5 10.5a5.23 5.23 0 0 0-1.279-3.434 9.768 9.768 0 0 1 6.963 6.963 5.23 5.23 0 0 0-3.434-1.279H10.5Z" />
    </svg>
  );
}
