// Resend REST API를 직접 호출 — SDK 의존성 없이 가볍게 유지
// 환경변수가 없으면 로그만 남기고 조용히 스킵 (개발 환경 편의)

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail(input: SendEmailInput): Promise<{ ok: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "chaechae daddy <noreply@chaechaedaddy.com>";

  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY 미설정 — 발송 스킵:", input.subject, "→", input.to);
    return { ok: false, error: "RESEND_API_KEY missing" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("[email] Resend 발송 실패:", res.status, errBody);
      return { ok: false, error: `${res.status}: ${errBody}` };
    }

    const data = (await res.json()) as { id?: string };
    return { ok: true, id: data.id };
  } catch (error) {
    console.error("[email] 발송 중 예외:", error);
    return { ok: false, error: error instanceof Error ? error.message : "unknown" };
  }
}
