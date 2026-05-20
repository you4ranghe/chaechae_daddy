"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Variant = "error" | "warning" | "info" | "success";

interface AlertOptions {
  title?: string;
  message: string;
  emoji?: string;
  variant?: Variant;
  action?: { label: string; href: string };
}

interface ModalContextValue {
  showAlert: (opts: AlertOptions) => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

const DEFAULT_TITLES: Record<Variant, string> = {
  error: "오류가 발생했어요",
  warning: "잠깐요!",
  info: "알림",
  success: "완료됐어요!",
};

const DEFAULT_EMOJIS: Record<Variant, string> = {
  error: "😢",
  warning: "⚠️",
  info: "💡",
  success: "🎉",
};

const STYLES: Record<Variant, { bg: string; btn: string }> = {
  error: {
    bg: "from-rose-50 via-pink-50 to-rose-50",
    btn: "from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-rose-200",
  },
  warning: {
    bg: "from-amber-50 via-orange-50 to-amber-50",
    btn: "from-amber-500 to-orange-400 hover:from-amber-600 hover:to-orange-500 shadow-amber-200",
  },
  info: {
    bg: "from-pink-50 via-blue-50 to-pink-50",
    btn: "from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-pink-200",
  },
  success: {
    bg: "from-emerald-50 via-teal-50 to-emerald-50",
    btn: "from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-200",
  },
};

type ActiveAlert = Required<Pick<AlertOptions, "variant">> & AlertOptions;

export function ModalProvider({ children }: { children: ReactNode }) {
  const [alert, setAlert] = useState<ActiveAlert | null>(null);

  const showAlert = useCallback((opts: AlertOptions) => {
    setAlert({ variant: "error", ...opts });
  }, []);

  const close = useCallback(() => setAlert(null), []);

  useEffect(() => {
    if (!alert) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [alert, close]);

  const s = alert ? STYLES[alert.variant] : STYLES.error;

  return (
    <ModalContext.Provider value={{ showAlert }}>
      {children}

      {alert && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="alert-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={close}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Card */}
          <div
            className={`relative w-full max-w-sm overflow-hidden rounded-3xl bg-gradient-to-br ${s.bg} shadow-2xl ring-1 ring-black/5`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 배경 장식 */}
            <span className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/60 blur-2xl" />
            <span className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-white/50 blur-2xl" />

            {/* 닫기 버튼 */}
            <button
              onClick={close}
              aria-label="닫기"
              className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 transition hover:bg-black/5 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>

            {/* 내용 */}
            <div className="relative px-6 pt-10 pb-3 text-center">
              <div className="mb-4 text-5xl leading-none" aria-hidden>
                {alert.emoji ?? DEFAULT_EMOJIS[alert.variant]}
              </div>
              <h3 id="alert-modal-title" className="text-lg font-bold text-gray-900">
                {alert.title ?? DEFAULT_TITLES[alert.variant]}
              </h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                {alert.message}
              </p>
            </div>

            {/* 버튼 */}
            <div className="relative flex flex-col gap-2 px-6 py-6">
              {alert.action && (
                <Link
                  href={alert.action.href}
                  onClick={close}
                  className={`w-full rounded-2xl bg-gradient-to-r ${s.btn} py-3 text-center text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0`}
                >
                  {alert.action.label}
                </Link>
              )}
              <button
                onClick={close}
                className={`w-full rounded-2xl py-3 text-sm font-semibold transition-all hover:-translate-y-0.5 active:translate-y-0 ${
                  alert.action
                    ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    : `bg-gradient-to-r ${s.btn} text-white shadow-lg`
                }`}
              >
                {alert.action ? "닫기" : "확인"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

export function useModal(): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal은 ModalProvider 안에서만 사용할 수 있어요.");
  return ctx;
}
