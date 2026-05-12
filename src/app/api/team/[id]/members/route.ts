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

  // 권한: 내가 이 팀의 멤버여야 함 (RLS가 한 번 더 막아주지만 명시 검증)
  const { data: mine } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!mine) {
    return NextResponse.json({ error: "팀 멤버가 아니에요." }, { status: 403 });
  }

  const { data: members } = await supabase
    .from("team_members")
    .select("user_id, role, invited_email, joined_at")
    .eq("team_id", id);

  return NextResponse.json({ members: members || [] });
}
