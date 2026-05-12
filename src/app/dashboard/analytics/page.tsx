import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { AnalyticsForm } from "@/components/analytics/analytics-form";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">성과 분석</h1>
        <p className="mt-1 text-sm text-gray-500">
          인스타그램 인사이트 데이터를 입력하면 AI가 주간 성과를 분석해드려요
        </p>
      </div>

      <AnalyticsForm />
    </>
  );
}
