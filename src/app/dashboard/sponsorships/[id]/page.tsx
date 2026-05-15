import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import type {
  GeneratedContent,
  Sponsorship,
} from "@/lib/types/sponsorship";
import { SponsorshipDetail } from "@/components/sponsorship/sponsorship-detail";

// 분석/콘텐츠 생성 직후 카드/콘텐츠가 즉시 반영되도록 캐시 비활성화
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SponsorshipDetailPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: sponsorship } = await supabase
    .from("sponsorships")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!sponsorship) notFound();

  const { data: contentRow } = await supabase
    .from("generated_contents")
    .select("caption, hashtags")
    .eq("sponsorship_id", id)
    .eq("user_id", user.id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const latestContent: GeneratedContent | null = contentRow
    ? {
        caption: contentRow.caption as string,
        hashtags: (contentRow.hashtags as string[]) ?? [],
      }
    : null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("instagram_handle")
    .eq("id", user.id)
    .single();
  const handle =
    profile?.instagram_handle || user.user_metadata?.instagram_handle || "사용자";

  return (
    <SponsorshipDetail
      sponsorship={sponsorship as Sponsorship}
      latestContent={latestContent}
      handle={handle}
    />
  );
}
