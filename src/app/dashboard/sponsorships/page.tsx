import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { SponsorshipTabs } from "@/components/sponsorship/sponsorship-tabs";
import type { Sponsorship } from "@/lib/types/sponsorship";

export default async function SponsorshipsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 진행 중인 협찬 조회
  const { data: inProgressData } = await supabase
    .from("sponsorships")
    .select("*")
    .eq("user_id", user.id)
    .in("status", ["pending", "accepted"])
    .order("created_at", { ascending: false });

  // 완료된 협찬 조회
  const { data: completedData } = await supabase
    .from("sponsorships")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  const inProgress = (inProgressData || []) as Sponsorship[];
  const completed = (completedData || []) as Sponsorship[];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">협찬 관리</h1>
        <p className="mt-1 text-sm text-gray-500">
          협찬 DM을 분석하고, 콘텐츠를 자동으로 생성하세요
        </p>
      </div>

      <SponsorshipTabs inProgress={inProgress} completed={completed} />
    </>
  );
}
