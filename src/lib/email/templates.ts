// 이메일 본문 템플릿 — 간단한 inline CSS HTML, 클라이언트 호환성 우선

function appUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://chaechaedaddy.com";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

const wrapper = (body: string) => `
<!DOCTYPE html>
<html lang="ko">
  <body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Apple SD Gothic Neo','Noto Sans KR',sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 24px 32px;">
                <div style="font-size:18px;font-weight:700;color:#4f46e5;">chaechae daddy</div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px 32px;color:#111827;font-size:15px;line-height:1.7;">
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid #f3f4f6;color:#9ca3af;font-size:12px;">
                이 메일은 chaechae daddy 알림 설정에 따라 발송됐어요.
                <a href="${appUrl("/dashboard/settings")}" style="color:#6366f1;text-decoration:none;">알림 끄기</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

// ─── 트라이얼 만료 임박 ────────────────────────────────────────────
export function trialExpiringEmail(daysLeft: number): { subject: string; html: string; text: string } {
  const ctaUrl = appUrl("/pricing");
  const subject =
    daysLeft <= 1
      ? "내일 무료 체험이 끝나요"
      : `무료 체험이 ${daysLeft}일 남았어요`;

  const headline =
    daysLeft <= 1
      ? "내일이면 무료 체험이 종료돼요"
      : `무료 체험이 ${daysLeft}일 남았어요`;

  const body = `
    <h1 style="margin:0 0 12px 0;font-size:20px;font-weight:700;color:#111827;">${headline}</h1>
    <p style="margin:0 0 16px 0;color:#4b5563;">
      안녕하세요! 지금까지 협찬 DM 분석, 콘텐츠 생성, 성과 분석 같은 기능을 무료로 써 보셨죠.
    </p>
    <p style="margin:0 0 24px 0;color:#4b5563;">
      ${daysLeft <= 1
        ? "체험이 끝나면 일부 기능이 제한돼요. 지금 플랜을 선택하면 끊김 없이 이어 쓸 수 있어요."
        : "체험 종료 전에 플랜을 골라 두면 자동으로 전환돼요."}
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:#4f46e5;border-radius:10px;">
          <a href="${ctaUrl}" style="display:inline-block;padding:12px 24px;color:#ffffff;font-weight:600;text-decoration:none;font-size:14px;">
            플랜 보러 가기
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:24px 0 0 0;color:#9ca3af;font-size:13px;">
      질문이 있으면 이 메일에 그대로 답장해 주세요.
    </p>
  `;

  const text = [
    headline,
    "",
    daysLeft <= 1
      ? "체험이 끝나면 일부 기능이 제한돼요. 끊김 없이 이어 쓰려면 플랜을 골라주세요."
      : "체험 종료 전에 플랜을 골라 두면 자동으로 전환돼요.",
    "",
    `플랜 보기: ${ctaUrl}`,
  ].join("\n");

  return { subject, html: wrapper(body), text };
}

// ─── 분석 완료 ─────────────────────────────────────────────────────
type AnalysisKind = "sponsorship" | "analytics" | "hashtag" | "content_plan" | "content";

const KIND_META: Record<AnalysisKind, { label: string; path: string }> = {
  sponsorship: { label: "협찬 DM 분석", path: "/dashboard/sponsorships" },
  analytics: { label: "주간 성과 분석", path: "/dashboard/analytics" },
  hashtag: { label: "해시태그 분석", path: "/dashboard/hashtags" },
  content_plan: { label: "주간 콘텐츠 플랜", path: "/dashboard/content-plan" },
  content: { label: "콘텐츠 생성", path: "/dashboard/sponsorships" },
};

export function analysisCompleteEmail(kind: AnalysisKind, summary: string): { subject: string; html: string; text: string } {
  const meta = KIND_META[kind];
  const ctaUrl = appUrl(meta.path);
  const subject = `${meta.label}이 완료됐어요`;

  const body = `
    <h1 style="margin:0 0 12px 0;font-size:20px;font-weight:700;color:#111827;">${meta.label} 완료</h1>
    <p style="margin:0 0 16px 0;color:#4b5563;">
      요청하신 분석이 끝났어요. 대시보드에서 결과를 확인해 주세요.
    </p>
    <div style="margin:0 0 24px 0;padding:16px;background:#f9fafb;border-left:3px solid #4f46e5;border-radius:8px;color:#374151;font-size:14px;line-height:1.6;">
      ${escapeHtml(summary)}
    </div>
    <table role="presentation" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:#4f46e5;border-radius:10px;">
          <a href="${ctaUrl}" style="display:inline-block;padding:12px 24px;color:#ffffff;font-weight:600;text-decoration:none;font-size:14px;">
            결과 보러 가기
          </a>
        </td>
      </tr>
    </table>
  `;

  const text = [
    `${meta.label} 완료`,
    "",
    summary,
    "",
    `결과 보기: ${ctaUrl}`,
  ].join("\n");

  return { subject, html: wrapper(body), text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
