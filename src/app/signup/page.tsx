"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/db/supabase-client";
import { MomsUpIcon } from "@/components/ui/momsup-icon";

const CATEGORIES = ["육아", "뷰티", "패션", "푸드", "라이프스타일"] as const;

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [followerCount, setFollowerCount] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function toggleCategory(category: string) {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (!instagramHandle) {
      setError("인스타그램 핸들을 입력해주세요.");
      return;
    }
    if (selectedCategories.length === 0) {
      setError("카테고리를 최소 1개 이상 선택해주세요.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            instagram_handle: instagramHandle.replace("@", ""),
            follower_count: parseInt(followerCount) || 0,
            categories: selectedCategories,
          },
        },
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          setError("이미 가입된 이메일입니다.");
        } else if (authError.message.includes("valid email")) {
          setError("올바른 이메일 형식이 아닙니다.");
        } else {
          setError("회원가입에 실패했습니다. 다시 시도해주세요.");
        }
        return;
      }

      router.push("/onboarding");
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-amber-50 via-white to-pink-50">
      <span aria-hidden className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-amber-200/40 blur-3xl" />
      <span aria-hidden className="pointer-events-none absolute right-0 top-1/3 h-72 w-72 rounded-full bg-pink-200/40 blur-3xl" />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* 로고 */}
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <MomsUpIcon className="h-10 w-10" />
              <span className="text-lg font-bold tracking-tight text-gray-900">
                MomsUp
              </span>
            </Link>
          </div>

          {/* 혜택 미리보기 */}
          <div className="mt-5 flex items-center justify-center gap-2">
            <Bonus label="7일 무료 체험" />
            <Bonus label="카드 등록 불필요" />
          </div>

          {/* 카드 */}
          <div className="mt-5 rounded-3xl border border-gray-100 bg-white/80 p-6 shadow-xl shadow-pink-500/5 backdrop-blur-xl sm:p-7">
            <h1 className="text-xl font-bold text-gray-900">
              협찬 관리를 시작해볼까요?
            </h1>
            <p className="mt-1 text-xs text-gray-500">
              간단한 정보만 알려주시면 바로 시작할 수 있어요
            </p>

            <form onSubmit={handleSignup} className="mt-5 space-y-4">
              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-[12.5px] text-rose-700 ring-1 ring-inset ring-rose-100">
                  <AlertIcon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* 계정 정보 */}
              <Section title="계정 정보">
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
              </Section>

              {/* 프로필 */}
              <Section title="인스타 프로필">
                <InstagramField
                  value={instagramHandle}
                  onChange={setInstagramHandle}
                />
                <Field
                  id="followers"
                  label="팔로워 수"
                  type="number"
                  value={followerCount}
                  onChange={setFollowerCount}
                  placeholder="예: 15,000"
                  icon={<UsersIcon />}
                />
                <div>
                  <label className="block text-xs font-semibold text-gray-700">
                    카테고리 <span className="font-medium text-gray-400">(중복 선택)</span>
                  </label>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {CATEGORIES.map((category) => {
                      const active = selectedCategories.includes(category);
                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() => toggleCategory(category)}
                          className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                            active
                              ? "bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-sm"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {active && "✓ "}
                          {category}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Section>

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-pink-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-pink-500/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    가입 중…
                  </>
                ) : (
                  <>
                    무료로 시작하기
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="h-4 w-4 transition-transform group-hover:translate-x-0.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </>
                )}
              </button>

              <p className="text-center text-[10.5px] text-gray-400">
                가입하시면 이용약관과 개인정보처리방침에 동의하는 것으로 간주됩니다
              </p>
            </form>
          </div>

          {/* 로그인 링크 */}
          <p className="mt-5 text-center text-[13px] text-gray-500">
            이미 계정이 있으신가요?{" "}
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

// ──────────────────────────────────────────────
// 컴포넌트
// ──────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
        {title}
      </p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Bonus({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white/80 px-2.5 py-1 text-[10.5px] font-semibold text-emerald-700 shadow-sm backdrop-blur">
      <CheckIcon className="h-2.5 w-2.5" />
      {label}
    </span>
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
          required={type !== "number"}
          min={type === "number" ? "0" : undefined}
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

function InstagramField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label htmlFor="instagram" className="block text-xs font-semibold text-gray-700">
        인스타그램 핸들
      </label>
      <div className="mt-1.5 flex items-center rounded-xl border border-gray-200 bg-gray-50/40 shadow-sm transition-all focus-within:border-pink-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-pink-500/20">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center text-gray-400">
          <InstagramIcon />
        </span>
        <span className="text-sm font-medium text-gray-400">@</span>
        <input
          id="instagram"
          type="text"
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="your_handle"
          className="flex-1 bg-transparent py-2.5 pl-1 pr-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// 아이콘
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
function InstagramIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465.66.254 1.216.598 1.772 1.153.509.5.902 1.105 1.153 1.772.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 0 1-1.153 1.772c-.5.509-1.105.902-1.772 1.153-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 0 1-1.772-1.153 4.902 4.902 0 0 1-1.153-1.772c-.247-.636-.416-1.363-.465-2.427C2.013 15.785 2 15.445 2 12.685v-.08c0-2.643.012-2.987.06-4.043.049-1.064.218-1.791.465-2.427.254-.66.598-1.216 1.153-1.772A4.902 4.902 0 0 1 5.45 3.21c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.241 2 12 2h.315Zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 0 0-.748-1.15 3.098 3.098 0 0 0-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058ZM12 6.865a5.135 5.135 0 1 1 0 10.27 5.135 5.135 0 0 1 0-10.27Zm0 1.802a3.333 3.333 0 1 0 0 6.666 3.333 3.333 0 0 0 0-6.666Zm5.338-3.205a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z" clipRule="evenodd" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003Z" />
    </svg>
  );
}
function CheckIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
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
