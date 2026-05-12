import { createClient } from "@supabase/supabase-js";

// Stripe Webhook 등 유저 세션 없이 DB에 접근해야 하는 경우 사용
// SUPABASE_SERVICE_ROLE_KEY는 절대 클라이언트에 노출되면 안 됨
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
