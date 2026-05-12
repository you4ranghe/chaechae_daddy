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
    .select("instagram_handle")
    .eq("id", user.id)
    .single();

  if (!profile?.instagram_handle) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      {/* 메인 콘텐츠 영역 — 데스크톱에서는 사이드바 너비만큼 오프셋 */}
      <main className="md:pl-60">
        <div className="mx-auto max-w-5xl px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}
