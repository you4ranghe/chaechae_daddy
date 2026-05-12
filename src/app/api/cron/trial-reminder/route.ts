import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/db/supabase-admin";
import { sendEmail } from "@/lib/email/send";
import { trialExpiringEmail } from "@/lib/email/templates";

// Vercel Cron (또는 외부 스케줄러)이 매일 호출하는 엔드포인트.
// vercel.json의 schedule을 설정하거나 외부 cron이 1일 1회 호출.
//
// 보안: CRON_SECRET 환경변수와 Authorization 헤더 비교.
// 외부 cron이 없는 환경에서는 수동 호출도 가능.

type ReminderWindow = {
  daysLeft: 3 | 1;
  flagColumn: "trial_reminder_3day_sent_at" | "trial_reminder_1day_sent_at";
};

const WINDOWS: ReminderWindow[] = [
  { daysLeft: 3, flagColumn: "trial_reminder_3day_sent_at" },
  { daysLeft: 1, flagColumn: "trial_reminder_1day_sent_at" },
];

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;

  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();
  const results: Array<{ window: number; sent: number; skipped: number; failed: number }> = [];

  for (const win of WINDOWS) {
    // 만료까지 (daysLeft - 1)일 ~ daysLeft일 사이 (24시간 윈도우)
    const upper = new Date(now.getTime() + win.daysLeft * 24 * 60 * 60 * 1000);
    const lower = new Date(now.getTime() + (win.daysLeft - 1) * 24 * 60 * 60 * 1000);

    const { data: profiles, error } = await supabase
      .from("profiles")
      .select(`id, email_notifications, ${win.flagColumn}`)
      .eq("plan", "free_trial")
      .lte("trial_ends_at", upper.toISOString())
      .gt("trial_ends_at", lower.toISOString())
      .is(win.flagColumn, null);

    if (error) {
      console.error("[cron] 프로필 조회 실패:", error);
      results.push({ window: win.daysLeft, sent: 0, skipped: 0, failed: 1 });
      continue;
    }

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const profile of profiles || []) {
      const prefs = (profile.email_notifications || {}) as { trial_reminder?: boolean };
      if (prefs.trial_reminder === false) {
        skipped++;
        continue;
      }

      const { data: userData } = await supabase.auth.admin.getUserById(profile.id);
      const email = userData?.user?.email;
      if (!email) {
        skipped++;
        continue;
      }

      const { subject, html, text } = trialExpiringEmail(win.daysLeft);
      const result = await sendEmail({ to: email, subject, html, text });

      if (!result.ok) {
        failed++;
        continue;
      }

      // 발송 성공 플래그 기록 (중복 발송 방지)
      await supabase
        .from("profiles")
        .update({ [win.flagColumn]: now.toISOString() })
        .eq("id", profile.id);

      sent++;
    }

    results.push({ window: win.daysLeft, sent, skipped, failed });
  }

  return NextResponse.json({ ok: true, results });
}
