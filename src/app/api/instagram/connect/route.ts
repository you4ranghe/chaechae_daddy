import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/db/supabase-server";
import { buildAuthUrl } from "@/lib/instagram/client";
import { randomBytes } from "crypto";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  // CSRF 방지용 state 토큰
  const state = randomBytes(24).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("ig_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  try {
    const url = buildAuthUrl(state);
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("OAuth URL 생성 실패:", error);
    return NextResponse.json(
      { error: "Instagram 연동이 아직 설정되지 않았습니다. 관리자에게 문의하세요." },
      { status: 503 },
    );
  }
}
