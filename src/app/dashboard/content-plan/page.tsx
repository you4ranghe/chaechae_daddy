import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { PlannerForm } from "@/components/content-plan/planner-form";

export default async function ContentPlanPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">콘텐츠 플래너</h1>
        <p className="mt-1 text-sm text-gray-500">
          키워드를 입력하면 AI가 월~일 7일치 콘텐츠 플랜을 생성해드려요
        </p>
      </div>

      <PlannerForm />
    </>
  );
}
