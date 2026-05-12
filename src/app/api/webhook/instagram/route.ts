import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/db/supabase-admin";
import { analyzeSponsorshipDM } from "@/lib/agents/sponsorship-agent";
import { generateChecklist } from "@/lib/agents/content-planner";
import { notifyAnalysisComplete } from "@/lib/email/notify";

// ───────────────────────────────────────────────────────
// Meta Instagram Webhook
// 구독: messages, message_reactions, messaging_postbacks
// 필요 환경변수:
//   META_WEBHOOK_VERIFY_TOKEN — 검증용 (Meta 대시보드에 입력한 값)
//   META_APP_SECRET — 서명 검증
// ───────────────────────────────────────────────────────

// 1. 검증 — Meta가 GET으로 hub.challenge 보냄
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

// 2. 이벤트 수신 — POST
export async function POST(request: NextRequest) {
  const raw = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  // 서명 검증 (앱 시크릿으로 HMAC-SHA256)
  const secret = process.env.META_APP_SECRET;
  if (secret) {
    if (!signature || !verifySignature(raw, signature, secret)) {
      return new Response("Invalid signature", { status: 401 });
    }
  }

  let body: WebhookPayload;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // 응답은 빨리 (Meta는 20초 안에 200 받지 못하면 재시도)
  // 실제 처리는 백그라운드에서
  processEvents(body).catch((err) => console.error("[webhook] 처리 실패:", err));
  return NextResponse.json({ received: true });
}

interface WebhookPayload {
  object: string;
  entry?: Array<{
    id: string;
    time?: number;
    messaging?: Array<{
      sender: { id: string };
      recipient: { id: string };
      timestamp?: number;
      message?: {
        mid: string;
        text?: string;
      };
    }>;
  }>;
}

async function processEvents(payload: WebhookPayload): Promise<void> {
  if (payload.object !== "instagram") return;

  const supabase = createAdminClient();

  for (const entry of payload.entry || []) {
    for (const event of entry.messaging || []) {
      const text = event.message?.text;
      const messageId = event.message?.mid;
      const igAccountId = entry.id; // 메시지 받은 인스타 계정 (수신자)

      if (!text || !messageId || !igAccountId) continue;

      // 1. 어느 사용자에게 온 DM인지 매핑
      const { data: conn } = await supabase
        .from("instagram_connections")
        .select("user_id")
        .eq("ig_user_id", igAccountId)
        .maybeSingle();

      if (!conn) {
        console.log("[webhook] 매핑 안 된 IG 계정:", igAccountId);
        continue;
      }

      // 2. dedupe — 동일 message ID 이미 처리됨?
      const { data: existing } = await supabase
        .from("processed_dms")
        .select("id")
        .eq("user_id", conn.user_id)
        .eq("ig_message_id", messageId)
        .maybeSingle();

      if (existing) continue;

      // 3. 협찬 가능성 휴리스틱 — 너무 짧으면 분석 스킵
      if (text.trim().length < 30) {
        await supabase.from("processed_dms").insert({
          user_id: conn.user_id,
          ig_message_id: messageId,
        });
        continue;
      }

      // 4. 협찬 키워드 휴리스틱 — 일반 인사말 거르기
      if (!looksLikeSponsorship(text)) {
        await supabase.from("processed_dms").insert({
          user_id: conn.user_id,
          ig_message_id: messageId,
        });
        continue;
      }

      try {
        // 5. 유저 컨텍스트 + 분석 실행
        const { data: profile } = await supabase
          .from("profiles")
          .select("instagram_handle, follower_count, categories")
          .eq("id", conn.user_id)
          .single();

        const userContext = {
          instagramHandle: profile?.instagram_handle || "",
          followerCount: profile?.follower_count || 0,
          categories: profile?.categories || [],
        };

        const { analysis } = await analyzeSponsorshipDM(text, userContext);
        const checklist = generateChecklist(analysis);

        const { data: sponsorship } = await supabase
          .from("sponsorships")
          .insert({
            user_id: conn.user_id,
            brand_name: analysis.brand.name,
            product: analysis.brand.product,
            status: "pending",
            raw_dm: text,
            analysis,
            checklist,
            payment_amount: 0,
            deadline:
              analysis.conditions.deadline !== "미정"
                ? analysis.conditions.deadline
                : null,
          })
          .select()
          .single();

        // 6. dedupe 기록
        await supabase.from("processed_dms").insert({
          user_id: conn.user_id,
          ig_message_id: messageId,
          sponsorship_id: sponsorship?.id || null,
        });

        // 7. 알림 (admin client는 RLS 우회 → notify 헬퍼는 normal client 전제이므로 직접 호출 X)
        // 여기서는 분석 완료 알림을 안전하게 fire-and-forget으로 보내려면 admin context 필요
        // notifyAnalysisComplete는 select에 RLS만 우회하지 않으면 동작 안 함 — 대신 함수 안에서 admin 호출하므로 OK
        void notifyAnalysisComplete(
          supabase,
          conn.user_id,
          "sponsorship",
          `새 협찬 DM이 도착해 자동으로 분석했어요: ${analysis.brand.name}`,
        );
      } catch (err) {
        console.error("[webhook] DM 분석 실패:", err);
        // 분석 실패해도 dedupe 기록은 남겨 무한 재시도 방지
        await supabase.from("processed_dms").insert({
          user_id: conn.user_id,
          ig_message_id: messageId,
        });
      }
    }
  }
}

function verifySignature(body: string, signature: string, secret: string): boolean {
  const expected =
    "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");
  // timing-safe 비교
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

// 협찬 DM 휴리스틱 — 한국어 협찬 키워드 매칭
function looksLikeSponsorship(text: string): boolean {
  const keywords = [
    "협찬", "광고", "체험", "리뷰", "포스팅", "원고료", "제품 제공",
    "제휴", "브랜드", "마케팅", "캠페인", "체험단", "인플루언서",
    "DM", "@", "콜라보", "협업",
  ];
  const matched = keywords.filter((k) => text.includes(k));
  return matched.length >= 2; // 2개 이상 매칭 시 분석
}
