import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/db/supabase-admin";
import { sendEmail } from "./send";
import { analysisCompleteEmail } from "./templates";

type EmailPrefs = {
  trial_reminder?: boolean;
  analysis_complete?: boolean;
};

type AnalysisKind = "sponsorship" | "analytics" | "hashtag" | "content_plan" | "content";

// 분석 완료 알림 — 라우트에서 fire-and-forget으로 호출
// 실패해도 사용자 요청은 성공으로 처리되도록 항상 안전하게 동작
export async function notifyAnalysisComplete(
  supabase: SupabaseClient,
  userId: string,
  kind: AnalysisKind,
  summary: string,
): Promise<void> {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email_notifications")
      .eq("id", userId)
      .single();

    const prefs = (profile?.email_notifications || {}) as EmailPrefs;
    if (prefs.analysis_complete === false) return;

    // auth.users에서 이메일을 가져오려면 admin client 필요 (RLS 우회)
    const admin = createAdminClient();
    const { data: userData } = await admin.auth.admin.getUserById(userId);
    const email = userData?.user?.email;
    if (!email) return;

    const { subject, html, text } = analysisCompleteEmail(kind, summary);
    await sendEmail({ to: email, subject, html, text });
  } catch (error) {
    console.error("[notify] 분석 완료 알림 실패:", error);
  }
}
