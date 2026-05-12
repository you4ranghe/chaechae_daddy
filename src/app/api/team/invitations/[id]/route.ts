import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/supabase-server";

// 초대 수락 / 거절
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await request.json();
  const { action } = body as { action?: "accept" | "decline" };
  if (!action || !["accept", "decline"].includes(action)) {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }

  const { data: invitation } = await supabase
    .from("team_invitations")
    .select("*")
    .eq("id", id)
    .eq("invited_email", user.email.toLowerCase())
    .is("accepted_at", null)
    .maybeSingle();

  if (!invitation) {
    return NextResponse.json({ error: "초대를 찾을 수 없어요." }, { status: 404 });
  }

  if (action === "decline") {
    await supabase.from("team_invitations").delete().eq("id", id);
    return NextResponse.json({ ok: true });
  }

  // 수락 — team_members에 등록
  await supabase.from("team_members").insert({
    team_id: invitation.team_id,
    user_id: user.id,
    role: invitation.role,
    invited_email: invitation.invited_email,
  });

  await supabase
    .from("team_invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", id);

  return NextResponse.json({ ok: true });
}
