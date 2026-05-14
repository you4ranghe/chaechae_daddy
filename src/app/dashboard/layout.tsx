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
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        instagramHandle={profile.instagram_handle}
        plan={plan}
        trialDaysLeft={trialDaysLeft}
        email={user.email || ""}
      />

      {/* 메인 콘텐츠 영역 — 데스크톱에서는 사이드바 너비만큼 오프셋, 모바일 상단 바 만큼 padding-top */}
      <main className="md:pl-64">
        <div className="mx-auto max-w-5xl px-4 pt-16 pb-24 md:px-8 md:py-8 md:pt-8 md:pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}
