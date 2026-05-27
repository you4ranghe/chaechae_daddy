import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/db/supabase-server";
import { MomsUpIcon } from "@/components/ui/momsup-icon";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("instagram_handle")
    .eq("id", user.id)
    .single();

  if (profile?.instagram_handle) redirect("/dashboard");

  const metadata = user.user_metadata ?? {};

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-pink-50 via-[var(--background)] to-rose-50">
      <span aria-hidden className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-pink-300/40 blur-[80px] animate-blob" />
      <span aria-hidden className="pointer-events-none absolute -right-20 top-1/3 h-96 w-96 rounded-full bg-rose-200/40 blur-[100px] animate-blob-slow" />
      <span aria-hidden className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-amber-200/40 blur-[90px] animate-blob" />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* 로고 */}
          <div className="animate-fade-up text-center">
            <Link href="/" className="inline-flex items-center gap-2 transition-spring hover:opacity-80">
              <MomsUpIcon className="h-10 w-10" />
              <span className="text-lg font-bold tracking-tight text-gray-900">
                MomsUp
              </span>
            </Link>
          </div>

          {/* 환영 메시지 */}
          <div className="animate-fade-up-1 mt-7 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700 shadow-[0_0_0_1px_rgb(16_185_129_/_0.18),0_8px_20px_-8px_rgb(16_185_129_/_0.3)] backdrop-blur">
              <CheckIcon className="h-3 w-3" />
              가입 완료
            </span>
            <h1 className="mt-4 text-[26px] font-black tracking-tight text-gray-900">
              환영해요! <span aria-hidden>👋</span>
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              마지막 한 가지만 알려주시면 바로 시작할 수 있어요
            </p>
          </div>

          {/* 진행 단계 */}
          <div className="animate-fade-up-2 mt-7 flex items-center justify-center gap-1.5">
            <span className="h-1.5 w-8 rounded-full bg-emerald-500" />
            <span className="h-1.5 w-8 rounded-full bg-emerald-500" />
            <span className="h-1.5 w-8 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 animate-pulse shadow-[0_0_8px_rgb(244_63_125_/_0.5)]" />
            <span className="h-1.5 w-8 rounded-full bg-gray-200" />
          </div>
          <p className="mt-2 text-center text-[11px] font-bold uppercase tracking-wider text-gray-500">
            3 / 4 · 프로필 설정
          </p>

          {/* 더블 베젤 카드 */}
          <div className="animate-fade-up-3 bezel mt-6 p-6 sm:p-7">
            <OnboardingForm
              defaultHandle={metadata.instagram_handle ?? ""}
              defaultFollowers={metadata.follower_count ?? 0}
              defaultCategories={metadata.categories ?? []}
            />
          </div>

          {/* 트러스트 시그널 */}
          <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[11px] text-gray-500">
            <LockIcon className="h-3 w-3" />
            정보는 안전하게 암호화되어 저장돼요
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── 아이콘 ────────────────────────────────
function CheckIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
    </svg>
  );
}
function LockIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
    </svg>
  );
}
