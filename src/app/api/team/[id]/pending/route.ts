import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/supabase-server";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  // 권한: owner/manager만 대기 초대 조회
  const { data: mine } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!mine || !["owner", "manager"].includes(mine.role)) {
    return NextResponse.json({ invitations: [] });
  }

  const { data: invitations } = await supabase
    .from("team_invitations")
    .select("id, invited_email, role, created_at")
    .eq("team_id", id)
    .is("accepted_at", null);

  return NextResponse.json({ invitations: invitations || [] });
}
