import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { HashtagForm } from "@/components/hashtags/hashtag-form";
import { HashtagHistory } from "@/components/hashtags/hashtag-history";

export default async function HashtagsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-50 via-white to-pink-50 px-6 py-6 sm:px-7">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-rose-200/40 blur-3xl"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-10 right-20 h-20 w-20 rounded-full bg-pink-200/40 blur-2xl"
        />
        <div className="relative flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 shadow-md shadow-rose-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-white">
              <path fillRule="evenodd" d="M11.097 1.515a.75.75 0 0 1 .589.882L10.666 7.5h4.47l1.079-5.397a.75.75 0 1 1 1.47.294L16.665 7.5h3.585a.75.75 0 0 1 0 1.5h-3.885l-1.2 6h3.585a.75.75 0 0 1 0 1.5h-3.885l-1.08 5.397a.75.75 0 1 1-1.47-.294l1.02-5.103h-4.47l-1.08 5.397a.75.75 0 1 1-1.47-.294l1.02-5.103H3.75a.75.75 0 0 1 0-1.5h3.885l1.2-6H5.25a.75.75 0 0 1 0-1.5h3.885l1.08-5.397a.75.75 0 0 1 .882-.588ZM10.365 9l-1.2 6h4.47l1.2-6h-4.47Z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900">해시태그 분석</h1>
            <p className="mt-0.5 text-sm leading-relaxed text-gray-600">
              카테고리별로 효과적인 해시태그 전략을 AI가 분석해드려요
            </p>
          </div>
        </div>
      </section>

      <HashtagForm />
      <HashtagHistory />
    </div>
  );
}
