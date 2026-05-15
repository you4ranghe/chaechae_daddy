import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { AnalyticsForm } from "@/components/analytics/analytics-form";
import { AnalyticsHistory } from "@/components/analytics/analytics-history";
import { AnalyticsTrend } from "@/components/analytics/analytics-trend";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-6 py-6 sm:px-7">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-200/40 blur-3xl"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-10 right-20 h-20 w-20 rounded-full bg-teal-200/40 blur-2xl"
        />
        <div className="relative flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-white">
              <path fillRule="evenodd" d="M2.25 13.5a8.25 8.25 0 0 1 8.25-8.25.75.75 0 0 1 .75.75v6.75H18a.75.75 0 0 1 .75.75 8.25 8.25 0 0 1-16.5 0Z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M12.75 3a.75.75 0 0 1 .75-.75 8.25 8.25 0 0 1 8.25 8.25.75.75 0 0 1-.75.75h-7.5a.75.75 0 0 1-.75-.75V3Z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900">성과 분석</h1>
            <p className="mt-0.5 text-sm leading-relaxed text-gray-600">
              인스타그램 인사이트 데이터를 입력하면 AI가 주간 리포트를 만들어드려요
            </p>
          </div>
        </div>
      </section>

      <AnalyticsForm />
      <AnalyticsTrend />
      <AnalyticsHistory />
    </div>
  );
}
