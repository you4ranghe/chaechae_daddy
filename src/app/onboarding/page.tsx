import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 이미 프로필이 완성된 유저는 대시보드로
  const { data: profile } = await supabase
    .from("profiles")
    .select("instagram_handle")
    .eq("id", user.id)
    .single();

  if (profile?.instagram_handle) {
    redirect("/dashboard");
  }

  // 회원가입 시 입력한 메타데이터 가져오기 (프리필용)
  const metadata = user.user_metadata ?? {};

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            프로필 설정
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            채채대디를 시작하기 위해 기본 정보를 입력해주세요
          </p>
        </div>

        <OnboardingForm
          defaultHandle={metadata.instagram_handle ?? ""}
          defaultFollowers={metadata.follower_count ?? 0}
          defaultCategories={metadata.categories ?? []}
        />
      </div>
    </div>
  );
}
