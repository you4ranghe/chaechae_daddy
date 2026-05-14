import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { PlannerForm } from "@/components/content-plan/planner-form";
import { PlannerHistory } from "@/components/content-plan/planner-history";

export default async function ContentPlanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 via-white to-orange-50 px-6 py-6 sm:px-7">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-amber-200/40 blur-3xl"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-10 right-20 h-20 w-20 rounded-full bg-orange-200/40 blur-2xl"
        />
        <div className="relative flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-md shadow-amber-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-white">
              <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900">콘텐츠 플래너</h1>
            <p className="mt-0.5 text-sm leading-relaxed text-gray-600">
              키워드 한 줄이면 AI가 월~일 7일치 콘텐츠 일정을 만들어드려요
            </p>
          </div>
        </div>
      </section>

      <PlannerForm />
      <PlannerHistory />
    </div>
  );
}
