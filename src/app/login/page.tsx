"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/db/supabase-client";
import { MomsUpIcon } from "@/components/ui/momsup-icon";
import ForgotPasswordModal from "./forgot-password-modal";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes("Invalid login credentials")) {
          setError("이메일 또는 비밀번호가 올바르지 않습니다.");
        } else if (authError.message.includes("Email not confirmed")) {
          setError("이메일 인증이 완료되지 않았습니다. 메일함을 확인해주세요.");
        } else {
          setError("로그인에 실패했습니다. 다시 시도해주세요.");
        }
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get("redirect");
      const destination = !redirectTo || redirectTo === "/" ? "/dashboard" : redirectTo;
      router.push(destination);
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-pink-50 via-[var(--background)] to-rose-50">
      {/* 비대칭 떠다니는 블롭 */}
      <span aria-hidden className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-pink-300/40 blur-[80px] animate-blob" />
      <span aria-hidden className="pointer-events-none absolute -right-20 top-1/3 h-96 w-96 rounded-full bg-rose-200/40 blur-[100px] animate-blob-slow" />
      <span aria-hidden className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-amber-200/40 blur-[90px] animate-blob" />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {/* 로고 */}
          <div className="animate-fade-up text-center">
            <Link href="/" className="inline-flex items-center gap-2 transition-spring hover:opacity-80">
              <MomsUpIcon className="h-10 w-10" />
              <span className="text-lg font-bold tracking-tight text-gray-900">
                MomsUp
              </span>
            </Link>
            <p className="mt-4 text-sm text-gray-500">
              다시 만나서 반가워요 <span aria-hidden>👋</span>
            </p>
          </div>

          {/* 더블 베젤 카드 */}
          <div className="animate-fade-up-1 bezel mt-8 p-6 sm:p-7">
            <h1 className="text-xl font-bold tracking-tight text-gray-900">로그인</h1>
            <p className="mt-1.5 text-[13px] text-gray-500">
              이메일과 비밀번호로 계속 이어서 시작하세요
            </p>

            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              {error && (
                <div className="flex items-start gap-2 rounded-2xl bg-rose-50 px-3.5 py-3 text-[12.5px] text-rose-700 ring-1 ring-inset ring-rose-200/70">
                  <AlertIcon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Field
                id="email"
                label="이메일"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                autoComplete="email"
                icon={<MailIcon />}
              />
              <Field
                id="password"
                label="비밀번호"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                autoComplete="current-password"
                icon={<LockIcon />}
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-xs font-semibold text-pink-600 transition-colors hover:text-pink-500"
                >
                  비밀번호를 잊으셨나요?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-1.5 rounded-2xl cta-gradient px-4 py-3.5 text-sm font-bold text-white transition-spring magnetic disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:scale-100"
              >
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    로그인 중…
                  </>
                ) : (
                  <>
                    로그인
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="h-4 w-4 transition-transform group-hover:translate-x-0.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* 회원가입 링크 */}
          <p className="animate-fade-up-2 mt-6 text-center text-[13px] text-gray-500">
            아직 계정이 없으신가요?{" "}
            <Link
              href="/signup"
              className="font-bold text-pink-600 transition-colors hover:text-pink-500"
            >
              무료로 시작하기 →
            </Link>
          </p>
        </div>
      </div>

      <ForgotPasswordModal
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        initialEmail={email}
      />
    </div>
  );
}

// ──────────────────────────────────────────────
// Field
// ──────────────────────────────────────────────

function Field({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  icon,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  icon: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[11px] font-bold uppercase tracking-wider text-gray-500">
        {label}
      </label>
      <div className="mt-1.5 flex items-center rounded-2xl bg-[var(--surface-1)] ring-1 ring-inset ring-gray-200 transition-snap focus-within:bg-white focus-within:ring-2 focus-within:ring-pink-400 focus-within:shadow-[0_0_0_4px_rgb(244_63_125_/_0.1)]">
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center text-gray-400">
          {icon}
        </span>
        <input
          id={id}
          type={type}
          required
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent py-2.5 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Icons
// ──────────────────────────────────────────────

function MailIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.67Z" />
      <path d="M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908Z" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
    </svg>
  );
}
function AlertIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
    </svg>
  );
}
