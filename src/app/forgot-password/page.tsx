"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/db/supabase-client";
import { MomsUpIcon } from "@/components/ui/momsup-icon";

type Step = "email" | "code" | "password" | "done";

const OTP_LIMIT_SECONDS = 180;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(OTP_LIMIT_SECONDS);

  useEffect(() => {
    if (step !== "code" || secondsLeft <= 0) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [step, secondsLeft]);

  async function requestCode(targetEmail: string): Promise<boolean> {
    const supabase = createClient();
    const { error: authError } = await supabase.auth.resetPasswordForEmail(targetEmail);
    if (authError) {
      setError("인증번호 발송에 실패했어요. 잠시 후 다시 시도해주세요.");
      return false;
    }
    return true;
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const ok = await requestCode(email);
      if (!ok) return;
      setStep("code");
      setCode("");
      setSecondsLeft(OTP_LIMIT_SECONDS);
      setInfo("입력하신 이메일로 6자리 인증번호를 보냈어요.");
    } catch {
      setError("네트워크 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (loading) return;
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const ok = await requestCode(email);
      if (!ok) return;
      setCode("");
      setSecondsLeft(OTP_LIMIT_SECONDS);
      setInfo("인증번호를 다시 보냈어요.");
    } catch {
      setError("네트워크 오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    if (secondsLeft <= 0) {
      setError("입력 시간이 지났어요. 인증번호를 다시 받아주세요.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: vErr } = await supabase.auth.verifyOtp({
        email,
        token: code.trim(),
        type: "recovery",
      });
      if (vErr) {
        setError("인증번호가 올바르지 않거나 만료됐어요.");
        return;
      }
      setStep("password");
    } catch {
      setError("네트워크 오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 해요.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않아요.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: uErr } = await supabase.auth.updateUser({ password });
      if (uErr) {
        setError("비밀번호 변경에 실패했어요. 다시 시도해주세요.");
        return;
      }
      await supabase.auth.signOut();
      setStep("done");
    } catch {
      setError("네트워크 오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  }

  const heading =
    step === "email"
      ? "비밀번호 찾기"
      : step === "code"
        ? "인증번호 입력"
        : step === "password"
          ? "새 비밀번호 설정"
          : "비밀번호가 변경됐어요";

  const subheading =
    step === "email"
      ? "가입하신 이메일로 인증번호를 보내드려요"
      : step === "code"
        ? `${email}로 보낸 6자리 코드를 입력해 주세요`
        : step === "password"
          ? "앞으로 사용할 비밀번호를 입력해 주세요"
          : "새 비밀번호로 다시 로그인해 주세요";

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-pink-50 via-white to-pink-50">
      <span aria-hidden className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-pink-200/40 blur-3xl" />
      <span aria-hidden className="pointer-events-none absolute right-0 top-1/3 h-72 w-72 rounded-full bg-pink-200/40 blur-3xl" />
      <span aria-hidden className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-amber-200/40 blur-3xl" />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <MomsUpIcon className="h-10 w-10" />
              <span className="text-lg font-bold tracking-tight text-gray-900">
                MomsUp
              </span>
            </Link>
            <p className="mt-3 text-sm text-gray-500">
              비밀번호를 잊으셨나요? <span aria-hidden>🔑</span>
            </p>
          </div>

          <div className="mt-6 rounded-3xl border border-gray-100 bg-white/80 p-6 shadow-xl shadow-pink-500/5 backdrop-blur-xl sm:p-7">
            <h1 className="text-xl font-bold text-gray-900">{heading}</h1>
            <p className="mt-1 text-xs text-gray-500">{subheading}</p>

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-[12.5px] text-rose-700 ring-1 ring-inset ring-rose-100">
                <AlertIcon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {info && !error && (
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-pink-50 px-3 py-2.5 text-[12.5px] text-pink-700 ring-1 ring-inset ring-pink-100">
                <InfoIcon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                <span>{info}</span>
              </div>
            )}

            {step === "email" && (
              <form onSubmit={handleSendCode} className="mt-5 space-y-4">
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
                <PrimaryButton loading={loading} label="인증번호 받기" loadingLabel="발송 중…" />
              </form>
            )}

            {step === "code" && (
              <form onSubmit={handleVerifyCode} className="mt-5 space-y-4">
                <CodeField
                  value={code}
                  onChange={setCode}
                  secondsLeft={secondsLeft}
                />
                <PrimaryButton
                  loading={loading}
                  label="인증하기"
                  loadingLabel="확인 중…"
                  disabled={secondsLeft <= 0 || code.length < 6}
                />
                <div className="flex items-center justify-between text-[12px] text-gray-500">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setError("");
                      setInfo("");
                    }}
                    className="font-semibold text-gray-500 hover:text-gray-700"
                  >
                    ← 이메일 다시 입력
                  </button>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading}
                    className="font-semibold text-pink-600 hover:text-pink-500 disabled:opacity-50"
                  >
                    인증번호 재발송
                  </button>
                </div>
              </form>
            )}

            {step === "password" && (
              <form onSubmit={handleResetPassword} className="mt-5 space-y-4">
                <Field
                  id="password"
                  label="새 비밀번호"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="최소 6자"
                  autoComplete="new-password"
                  icon={<LockIcon />}
                />
                <Field
                  id="passwordConfirm"
                  label="비밀번호 확인"
                  type="password"
                  value={passwordConfirm}
                  onChange={setPasswordConfirm}
                  placeholder="다시 입력"
                  autoComplete="new-password"
                  icon={<LockIcon />}
                />
                <PrimaryButton loading={loading} label="비밀번호 변경" loadingLabel="변경 중…" />
              </form>
            )}

            {step === "done" && (
              <div className="mt-5 space-y-4">
                <div className="flex items-center gap-3 rounded-xl bg-emerald-50 px-3 py-3 text-[13px] text-emerald-700 ring-1 ring-inset ring-emerald-100">
                  <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />
                  <span>비밀번호가 안전하게 변경됐어요.</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    router.push("/login");
                    router.refresh();
                  }}
                  className="group flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-pink-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-pink-500/30"
                >
                  로그인하러 가기
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="h-4 w-4 transition-transform group-hover:translate-x-0.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          <p className="mt-5 text-center text-[13px] text-gray-500">
            비밀번호가 기억나셨나요?{" "}
            <Link
              href="/login"
              className="font-bold text-pink-600 transition-colors hover:text-pink-500"
            >
              로그인 →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function PrimaryButton({
  loading,
  label,
  loadingLabel,
  disabled,
}: {
  loading: boolean;
  label: string;
  loadingLabel: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="group flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-pink-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-pink-500/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
    >
      {loading ? (
        <>
          <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {loadingLabel}
        </>
      ) : (
        <>
          {label}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="h-4 w-4 transition-transform group-hover:translate-x-0.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </>
      )}
    </button>
  );
}

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
      <label htmlFor={id} className="block text-xs font-semibold text-gray-700">
        {label}
      </label>
      <div className="mt-1.5 flex items-center rounded-xl border border-gray-200 bg-gray-50/40 shadow-sm transition-all focus-within:border-pink-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-pink-500/20">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center text-gray-400">
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
          className="flex-1 bg-transparent py-2.5 pr-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />
      </div>
    </div>
  );
}

function CodeField({
  value,
  onChange,
  secondsLeft,
}: {
  value: string;
  onChange: (v: string) => void;
  secondsLeft: number;
}) {
  const expired = secondsLeft <= 0;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div>
      <div className="flex items-center justify-between">
        <label htmlFor="code" className="block text-xs font-semibold text-gray-700">
          인증번호 <span className="font-medium text-gray-400">(6자리)</span>
        </label>
        <span
          className={`text-[11px] font-bold tabular-nums ${
            expired ? "text-rose-600" : secondsLeft <= 30 ? "text-amber-600" : "text-pink-600"
          }`}
          aria-live="polite"
        >
          {expired ? "시간 만료" : `${mm}:${ss}`}
        </span>
      </div>
      <div
        className={`mt-1.5 flex items-center rounded-xl border bg-gray-50/40 shadow-sm transition-all focus-within:ring-2 ${
          expired
            ? "border-rose-200 focus-within:border-rose-400 focus-within:ring-rose-500/20"
            : "border-gray-200 focus-within:border-pink-400 focus-within:bg-white focus-within:ring-pink-500/20"
        }`}
      >
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center text-gray-400">
          <ShieldIcon />
        </span>
        <input
          id="code"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          required
          disabled={expired}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="000000"
          className="flex-1 bg-transparent py-2.5 pr-3.5 text-sm tracking-[0.4em] text-gray-900 placeholder:tracking-[0.4em] placeholder:text-gray-300 focus:outline-none disabled:cursor-not-allowed"
        />
      </div>
      <p className="mt-1.5 text-[11px] text-gray-400">
        입력 제한 시간은 3분이에요. 시간이 지나면 재발송해 주세요.
      </p>
    </div>
  );
}

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
function ShieldIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 0 0-1.032 0 11.209 11.209 0 0 1-7.877 3.08.75.75 0 0 0-.722.515A12.74 12.74 0 0 0 2.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 0 0 .374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 0 0-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08Zm3.094 8.016a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
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
function InfoIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 0 1 .67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 1 1-.671-1.34l.041-.022ZM12 9a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
    </svg>
  );
}
function CheckCircleIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
    </svg>
  );
}
