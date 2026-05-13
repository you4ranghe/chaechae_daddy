import Link from "next/link";

const PAIN_POINTS = [
  {
    icon: "⏰",
    text: "협찬 DM 하나하나 조건 확인하느라 시간 낭비",
  },
  {
    icon: "😰",
    text: "광고주 요구사항 빠뜨릴까 불안",
  },
  {
    icon: "✍️",
    text: "자연스러운 광고 캡션 쓰는 게 어려움",
  },
  {
    icon: "⚖️",
    text: "#광고 #협찬 표시 규정 놓칠까 걱정",
  },
];

const STEPS = [
  {
    step: "1",
    title: "협찬 DM 붙여넣기",
    description: "받은 협찬 DM을 그대로 붙여넣으면 AI가 조건을 자동 분석합니다.",
  },
  {
    step: "2",
    title: "요구사항 체크리스트",
    description: "수락하면 광고주 요구사항이 체크리스트로 자동 정리됩니다.",
  },
  {
    step: "3",
    title: "캡션 + 해시태그 생성",
    description:
      "요구사항을 반영한 자연스러운 광고 캡션과 해시태그가 자동 생성됩니다.",
  },
  {
    step: "4",
    title: "복사해서 바로 포스팅",
    description: "복사 버튼 하나로 인스타그램에 바로 붙여넣기하세요.",
  },
];

const PRICING = [
  {
    name: "스타터",
    price: "3.9",
    unit: "만원/월",
    description: "에이전트 100회",
    highlighted: false,
  },
  {
    name: "그로스",
    price: "9.9",
    unit: "만원/월",
    description: "에이전트 500회",
    highlighted: true,
  },
  {
    name: "비즈니스",
    price: "19.9",
    unit: "만원/월",
    description: "무제한",
    highlighted: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-full bg-white">
      {/* 네비게이션 */}
      <nav className="fixed top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold text-gray-900">
            CW Agent
          </span>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              무료로 시작
            </Link>
          </div>
        </div>
      </nav>

      {/* 히어로 */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-indigo-200/30 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <div className="inline-block rounded-full bg-indigo-100 px-4 py-1.5 text-sm font-medium text-indigo-700 mb-6">
            7일 무료 체험 — 카드 등록 없이
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 md:text-5xl lg:text-6xl">
            협찬 받고,
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              AI가 콘텐츠까지
            </span>{" "}
            만들어줍니다
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-lg text-gray-500 md:text-xl">
            협찬 DM 분석부터 광고 콘텐츠 완성까지 3분
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 hover:shadow-indigo-500/30 transition-all"
          >
            7일 무료로 시작하기
          </Link>
        </div>
      </section>

      {/* 문제 제시 */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-2xl font-bold text-gray-900 md:text-3xl">
            이런 고민, 매일 하고 있지 않나요?
          </h2>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {PAIN_POINTS.map(function (item) {
              return (
                <div
                  key={item.text}
                  className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-6"
                >
                  <span className="text-2xl shrink-0">{item.icon}</span>
                  <p className="text-gray-700 leading-relaxed">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 솔루션 */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-2xl font-bold text-gray-900 md:text-3xl">
            AI가{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              3분
            </span>{" "}
            만에 해결합니다
          </h2>
          <div className="mt-14 grid gap-8 md:grid-cols-2">
            {STEPS.map(function (item) {
              return (
                <div key={item.step} className="relative flex gap-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 사회적 증거 */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-indigo-600 to-purple-700">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="text-lg font-medium text-indigo-200">
            팔로워 2천명 육아 인플루언서가 직접 만들고 사용 중
          </p>
          <div className="mt-10 flex flex-col items-center gap-6 md:flex-row md:justify-center md:gap-16">
            <div>
              <p className="text-sm text-indigo-200">Before</p>
              <p className="mt-1 text-4xl font-extrabold text-white md:text-5xl">
                40분
              </p>
              <p className="mt-1 text-sm text-indigo-200">협찬 1건당</p>
            </div>
            <div className="text-3xl text-indigo-300">→</div>
            <div>
              <p className="text-sm text-indigo-200">After</p>
              <p className="mt-1 text-4xl font-extrabold text-white md:text-5xl">
                3분
              </p>
              <p className="mt-1 text-sm text-indigo-200">협찬 1건당</p>
            </div>
          </div>
          <p className="mt-10 text-2xl font-bold text-white md:text-3xl">
            93% 시간 절감
          </p>
        </div>
      </section>

      {/* 가격 */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-2xl font-bold text-gray-900 md:text-3xl">
            심플한 가격
          </h2>
          <p className="mt-3 text-center text-gray-500">
            7일 무료 체험 — 카드 등록 없이 시작하세요
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {PRICING.map(function (plan) {
              return (
                <div
                  key={plan.name}
                  className={`relative rounded-2xl border p-8 ${
                    plan.highlighted
                      ? "border-indigo-600 ring-2 ring-indigo-600/20 shadow-lg"
                      : "border-gray-200"
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-semibold text-white">
                      추천
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-gray-900">
                    {plan.name}
                  </h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-sm text-gray-500">{plan.unit}</span>
                  </div>
                  <p className="mt-3 text-sm text-gray-500">
                    {plan.description}
                  </p>
                  <Link
                    href="/signup"
                    className={`mt-6 block w-full rounded-lg py-2.5 text-center text-sm font-semibold transition-colors ${
                      plan.highlighted
                        ? "bg-indigo-600 text-white hover:bg-indigo-500"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    무료로 시작하기
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA 반복 */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
            협찬 관리, 더 이상 혼자 고민하지 마세요
          </h2>
          <p className="mt-4 text-gray-500">
            3분이면 협찬 콘텐츠가 완성됩니다
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 transition-all"
          >
            지금 무료로 시작하기
          </Link>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="border-t border-gray-200 py-10">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="text-sm font-semibold text-gray-900">
            CW Agent
          </p>
          <p className="mt-2 text-sm text-gray-400">
            문의: contact@example.com
          </p>
          <p className="mt-4 text-xs text-gray-300">
            © 2025 CW Agent. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
