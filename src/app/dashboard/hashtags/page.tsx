import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { HashtagForm } from "@/components/hashtags/hashtag-form";
import { HashtagHistory } from "@/components/hashtags/hashtag-history";

export default async function HashtagsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">해시태그 분석</h1>
        <p className="mt-1 text-sm text-gray-500">
          카테고리별 최적의 해시태그 전략을 AI가 분석해드려요
        </p>
      </div>

      <HashtagForm />
      <HashtagHistory />
    </>
  );
}
