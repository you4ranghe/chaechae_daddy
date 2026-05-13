import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { ProfileForm } from "@/components/settings/profile-form";
import { SubscriptionCard } from "@/components/settings/subscription-card";
import { EmailNotificationsCard } from "@/components/settings/email-notifications-card";
import { InstagramConnectionCard } from "@/components/settings/instagram-connection-card";

interface SettingsPageProps {
  searchParams: Promise<{ ig_connected?: string; ig_error?: string }>;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;

  // 프로필 + 인스타 연결 병렬 조회
  const [{ data: profile }, { data: igConnection }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "instagram_handle, follower_count, categories, plan, stripe_customer_id, trial_ends_at, email_notifications",
      )
      .eq("id", user.id)
      .single(),
    supabase
      .from("instagram_connections")
      .select("ig_username, last_synced_at, token_expires_at")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const emailPrefs =
    (profile?.email_notifications as { trial_reminder?: boolean; analysis_complete?: boolean } | null) || {};

  const initialData = {
    instagramHandle: profile?.instagram_handle || user.user_metadata?.instagram_handle || "",
    followerCount: profile?.follower_count || user.user_metadata?.follower_count || 0,
    categories: profile?.categories || user.user_metadata?.categories || [],
    email: user.email || "",
    plan: profile?.plan || "free_trial",
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">설정</h1>
        <p className="mt-1 text-sm text-gray-500">
          프로필 정보를 관리하세요. AI가 맞춤 분석에 활용합니다.
        </p>
      </div>

      <ProfileForm initialData={initialData} />

      <div className="mt-8">
        <InstagramConnectionCard
          connection={igConnection}
          errorParam={params.ig_error || null}
          connectedParam={params.ig_connected === "1"}
          integrationReady={Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET && process.env.META_REDIRECT_URI)}
        />
      </div>

      <div className="mt-8">
        <EmailNotificationsCard
          initialPrefs={{
            trial_reminder: emailPrefs.trial_reminder !== false,
            analysis_complete: emailPrefs.analysis_complete !== false,
          }}
          email={user.email || ""}
        />
      </div>

      <div className="mt-8">
        <SubscriptionCard
          plan={profile?.plan || "free_trial"}
          hasStripeCustomer={!!profile?.stripe_customer_id}
          trialEndsAt={profile?.trial_ends_at || null}
        />
      </div>
    </>
  );
}
