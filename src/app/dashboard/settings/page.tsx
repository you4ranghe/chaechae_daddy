import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { ProfileForm } from "@/components/settings/profile-form";
import { SubscriptionCard } from "@/components/settings/subscription-card";
import { EmailNotificationsCard } from "@/components/settings/email-notifications-card";
import { InstagramConnectionCard } from "@/components/settings/instagram-connection-card";
import { LogoutButton } from "@/components/settings/logout-button";
import { ChildInfoCard } from "@/components/settings/child-info-card";

interface SettingsPageProps {
  searchParams: Promise<{ ig_connected?: string; ig_error?: string }>;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;

  const [{ data: profile }, { data: igConnection }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "instagram_handle, follower_count, categories, plan, stripe_customer_id, trial_ends_at, email_notifications, child_info, persona_bio",
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
    (profile?.email_notifications as {
      trial_reminder?: boolean;
      analysis_complete?: boolean;
    } | null) || {};

  const initialData = {
    instagramHandle:
      profile?.instagram_handle || user.user_metadata?.instagram_handle || "",
    followerCount:
      profile?.follower_count || user.user_metadata?.follower_count || 0,
    categories: profile?.categories || user.user_metadata?.categories || [],
    email: user.email || "",
    plan: profile?.plan || "free_trial",
  };

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-50 via-white to-pink-50 px-6 py-6 sm:px-7">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gray-200/40 blur-3xl"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-10 right-20 h-20 w-20 rounded-full bg-pink-200/40 blur-2xl"
        />
        <div className="relative flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 shadow-md shadow-gray-900/20">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-white">
              <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 0 0-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 0 0-2.282.819l-.922 1.597a1.875 1.875 0 0 0 .432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 0 0 0 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 0 0-.432 2.385l.922 1.597a1.875 1.875 0 0 0 2.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 0 0 2.28-.819l.923-1.597a1.875 1.875 0 0 0-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 0 0 0-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 0 0-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 0 0-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 0 0-1.85-1.567h-1.843ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900">설정</h1>
            <p className="mt-0.5 text-sm leading-relaxed text-gray-600">
              프로필을 정확히 입력할수록 AI가 더 맞춤 분석을 해드려요
            </p>
          </div>
        </div>
      </section>

      <ProfileForm initialData={initialData} />

      <ChildInfoCard
        initialChildInfo={
          (profile?.child_info as React.ComponentProps<typeof ChildInfoCard>["initialChildInfo"]) || null
        }
        initialPersonaBio={(profile?.persona_bio as string | null) || ""}
      />

      <InstagramConnectionCard
        connection={igConnection}
        errorParam={params.ig_error || null}
        connectedParam={params.ig_connected === "1"}
        integrationReady={Boolean(
          process.env.META_APP_ID &&
            process.env.META_APP_SECRET &&
            process.env.META_REDIRECT_URI,
        )}
      />

      <EmailNotificationsCard
        initialPrefs={{
          trial_reminder: emailPrefs.trial_reminder !== false,
          analysis_complete: emailPrefs.analysis_complete !== false,
        }}
        email={user.email || ""}
      />

      <SubscriptionCard
        plan={profile?.plan || "free_trial"}
        hasStripeCustomer={!!profile?.stripe_customer_id}
        trialEndsAt={profile?.trial_ends_at || null}
      />

      <LogoutButton />
    </div>
  );
}
