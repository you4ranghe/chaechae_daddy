// 육아 테마 로딩 인디케이터
// - 끈에 매달린 우유병이 좌우로 흔들리고, 안의 분유가 살짝 출렁
// - 위쪽에 작은 거품 방울이 떠오름
// - 텍스트가 필요하면 message prop

type BabyLoaderSize = "sm" | "md" | "lg";

interface BabyLoaderProps {
  size?: BabyLoaderSize;
  message?: string;
  /** true면 화면 가운데에 카드 형태로 렌더 (전체 페이지 로딩 용) */
  fullscreen?: boolean;
}

const SIZE_PX: Record<BabyLoaderSize, number> = {
  sm: 48,
  md: 80,
  lg: 112,
};

export function BabyLoader({
  size = "md",
  message,
  fullscreen = false,
}: BabyLoaderProps) {
  const px = SIZE_PX[size];

  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <BottleSvg size={px} />
      <DotsRow />
      {message && (
        <p className="text-xs font-medium text-gray-500 sm:text-sm">
          {message}
        </p>
      )}
    </div>
  );

  if (!fullscreen) return content;

  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center px-6">
      <div className="rounded-3xl bg-gradient-to-br from-amber-50 via-white to-pink-50 px-10 py-8 shadow-sm ring-1 ring-amber-100/60">
        {content}
      </div>
    </div>
  );
}

function DotsRow() {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 animate-baby-dot"
        style={{ animationDelay: "0s" }}
      />
      <span
        className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 animate-baby-dot"
        style={{ animationDelay: "0.2s" }}
      />
      <span
        className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 animate-baby-dot"
        style={{ animationDelay: "0.4s" }}
      />
    </div>
  );
}

function BottleSvg({ size }: { size: number }) {
  // 위 행거(끈)는 고정, 우유병 본체만 animate-baby-swing 으로 흔들리게 함
  return (
    <div className="relative" style={{ width: size, height: size * 1.35 }}>
      {/* 끈 */}
      <div
        className="absolute left-1/2 top-0 -translate-x-1/2 rounded-full bg-amber-200"
        style={{ width: 2, height: size * 0.18 }}
      />
      {/* 거품 */}
      <span
        aria-hidden
        className="absolute left-[40%] top-[8%] block h-1.5 w-1.5 rounded-full bg-white/90 animate-baby-bubble"
        style={{ boxShadow: "0 0 0 1px rgba(251, 191, 36, 0.4)", animationDelay: "0s" }}
      />
      <span
        aria-hidden
        className="absolute left-[58%] top-[14%] block h-1 w-1 rounded-full bg-white/90 animate-baby-bubble"
        style={{ boxShadow: "0 0 0 1px rgba(251, 191, 36, 0.4)", animationDelay: "0.6s" }}
      />

      {/* 우유병 본체 (스윙) */}
      <div
        className="absolute left-1/2 -translate-x-1/2 animate-baby-swing"
        style={{ top: size * 0.16, width: size, height: size * 1.15 }}
      >
        <svg
          viewBox="0 0 64 80"
          width="100%"
          height="100%"
          aria-hidden
          fill="none"
        >
          {/* 젖꼭지 */}
          <ellipse cx="32" cy="6" rx="9" ry="4" fill="#fcd34d" />
          {/* 캡(목) */}
          <rect x="22" y="9" width="20" height="8" rx="3" fill="#fbbf24" />
          {/* 병 외곽 */}
          <path
            d="M18 22 Q18 18 22 18 H42 Q46 18 46 22 V68 Q46 76 38 76 H26 Q18 76 18 68 Z"
            fill="#ffffff"
            stroke="#f59e0b"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          {/* 분유 (위에서 본 흐름) — translateY로 출렁 */}
          <g className="animate-baby-milk" style={{ transformOrigin: "50% 50%" }}>
            <path
              d="M20 38 Q26 34 32 38 T44 38 V66 Q44 74 38 74 H26 Q20 74 20 66 Z"
              fill="#fef3c7"
            />
          </g>
          {/* 눈금 */}
          <line x1="40" y1="44" x2="44" y2="44" stroke="#fbbf24" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="40" y1="54" x2="44" y2="54" stroke="#fbbf24" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="40" y1="64" x2="44" y2="64" stroke="#fbbf24" strokeWidth="1.6" strokeLinecap="round" />
          {/* 볼터치 (귀여움) */}
          <circle cx="26" cy="50" r="1.6" fill="#fda4af" opacity="0.9" />
          <circle cx="38" cy="50" r="1.6" fill="#fda4af" opacity="0.9" />
          {/* 미소 */}
          <path
            d="M28 56 Q32 59 36 56"
            stroke="#f43f5e"
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>
    </div>
  );
}
