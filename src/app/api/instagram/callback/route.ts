import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/db/supabase-server";
import {
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  findInstagramBusinessAccount,
} from "@/lib/instagram/client";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const error = params.get("error");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("ig_oauth_state")?.value;
  cookieStore.delete("ig_oauth_state");

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/dashboard/settings?ig_error=${encodeURIComponent(error || "no_code")}`, request.url),
    );
  }

  if (!state || state !== expectedState) {
    return NextResponse.redirect(
      new URL("/dashboard/settings?ig_error=invalid_state", request.url),
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    // 1. code → 단기 토큰
    const short = await exchangeCodeForToken(code);
    // 2. 단기 → 장기 토큰 (60일)
    const long = await exchangeForLongLivedToken(short.access_token);
    // 3. 페이지 → 인스타 비즈니스 계정 찾기
    const ig = await findInstagramBusinessAccount(long.access_token);

    if (!ig) {
      return NextResponse.redirect(
        new URL("/dashboard/settings?ig_error=no_business_account", request.url),
      );
    }

    // 4. DB 저장 (페이지 액세스 토큰 — Insights/메시지 호출용)
    const expiresAt = new Date(Date.now() + long.expires_in * 1000).toISOString();
    await supabase.from("instagram_connections").upsert({
      user_id: user.id,
      ig_user_id: ig.igUserId,
      ig_username: ig.igUsername,
      access_token: ig.pageAccessToken,
      token_expires_at: expiresAt,
      page_id: ig.pageId,
      scopes: [],
      updated_at: new Date().toISOString(),
    });

    return NextResponse.redirect(new URL("/dashboard/settings?ig_connected=1", request.url));
  } catch (e) {
    console.error("Instagram OAuth callback 실패:", e);
    return NextResponse.redirect(
      new URL("/dashboard/settings?ig_error=oauth_failed", request.url),
    );
  }
}
