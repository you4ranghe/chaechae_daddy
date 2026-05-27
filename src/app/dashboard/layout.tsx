import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { Sidebar } from "@/components/dashboard/sidebar";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 프로필 완성 여부 확인 — 인스타 핸들이 없으면 온보딩으로
  const { data: profile } = await supabase
    .from("profiles")
    .select("instagram_handle, plan, trial_ends_at")
    .eq("id", user.id)
    .single();

  if (!profile?.instagram_handle) {
    redirect("/onboarding");
  }

  const plan = profile.plan || "free_trial";
  let trialDaysLeft: number | null = null;
  if (plan === "free_trial" && profile.trial_ends_at) {
    const diff = new Date(profile.trial_ends_at).getTime() - new Date().getTime();
    trialDaysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  return (
    <div className="relative min-h-screen bg-[var(--background)]">
      {/* 미세한 배경 데코 — 대시보드 전체 톤 유지 */}
      <span
        aria-hidden
        className="pointer-events-none fixed -left-32 top-0 h-[32rem] w-[32rem] rounded-full bg-pink-200/20 blur-[120px]"
      />
      <span
        aria-hidden
        className="pointer-events-none fixed -right-32 bottom-0 h-[28rem] w-[28rem] rounded-full bg-amber-200/15 blur-[120px]"
      />

      <Sidebar
        instagramHandle={profile.instagram_handle}
        plan={plan}
        trialDaysLeft={trialDaysLeft}
        email={user.email || ""}
      />

      {/* 메인 콘텐츠 영역 */}
      <main className="relative md:pl-64">
        <div className="mx-auto max-w-5xl px-4 pt-16 pb-24 md:px-8 md:py-10 md:pt-10 md:pb-10">
          {children}
        </div>
      </main>
    </div>
  );
}
