"use client";

import { useEffect, useState } from "react";

const STEPS = [
  "협찬 조건을 다시 정리하고 있어요",
  "브랜드 톤에 맞는 어조를 고르고 있어요",
  "체크리스트 항목을 자연스럽게 녹여 넣고 있어요",
  "해시태그와 #광고 표시를 점검하고 있어요",
  "마지막으로 다듬는 중이에요",
] as const;

// 진행률 시뮬레이션: 보통 20~40초 걸리는 작업이라 0→80%까지 25초에 걸쳐 차고,
// 그 뒤로는 95%에 점근하도록 천천히. 100%는 완료 시점(컴포넌트 unmount)에 자연 종료.
function useFakeProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const start = Date.now();

    function tick() {
      if (cancelled) return;
      const elapsed = (Date.now() - start) / 1000;
      let next: number;
      if (elapsed < 25) {
        next = (elapsed / 25) * 80;
      } else {
        const extra = elapsed - 25;
        next = 80 + (15 * extra) / (extra + 15);
      }
      setProgress(Math.min(95, next));
      requestAnimationFrame(tick);
    }

    const raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  return progress;
}

function useStepRotation() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % STEPS.length);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  return stepIndex;
}

interface ContentGeneratingLoaderProps {
  // 외부에서 조건부 마운트를 강제하고 싶을 때만 false 전달. 기본은 항상 렌더.
  active?: boolean;
}

export function ContentGeneratingLoader({ active = true }: ContentGeneratingLoaderProps) {
  if (!active) return null;
  return <Inner />;
}

function Inner() {
  const progress = useFakeProgress();
  const stepIndex = useStepRotation();

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-10 flex-shrink-0">
          <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" />
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 shadow-md shadow-indigo-500/30">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5 text-white"
            >
              <path
                fillRule="evenodd"
                d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5ZM16.5 15a.75.75 0 0 1 .712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 0 1 0 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 0 1-1.422 0l-.395-1.183a1.5 1.5 0 0 0-.948-.948l-1.183-.395a.75.75 0 0 1 0-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0 1 16.5 15Z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-gray-900">
            AI가 콘텐츠를 만들고 있어요
          </h3>
          <p className="mt-0.5 text-xs text-gray-500">
            보통 20~40초 정도 걸려요. 페이지를 닫지 말고 잠시만 기다려 주세요.
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/70">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-600">
          <span className="flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-500 animate-pulse" />
          <span key={stepIndex} className="transition-opacity duration-500">
            {STEPS[stepIndex]}
          </span>
        </div>
      </div>
    </div>
  );
}
