import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/supabase-server";

// 팀 생성
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await request.json();
  const name = String(body?.name || "").trim();
  if (!name || name.length > 100) {
    return NextResponse.json({ error: "팀 이름을 입력해 주세요." }, { status: 400 });
  }

  // 이미 owner인 팀이 있으면 거부 (1인 1팀 정책)
  const { data: existing } = await supabase
    .from("teams")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "이미 팀이 있어요." }, { status: 400 });
  }

  const { data: team, error } = await supabase
    .from("teams")
    .insert({ name, owner_id: user.id })
    .select()
    .single();

  if (error || !team) {
    console.error("팀 생성 실패:", error);
    return NextResponse.json({ error: "팀 생성에 실패했어요." }, { status: 500 });
  }

  await supabase.from("team_members").insert({
    team_id: team.id,
    user_id: user.id,
    role: "owner",
  });

  return NextResponse.json({ team });
}
