import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/supabase-server";
import { sendEmail } from "@/lib/email/send";

// 팀 초대 발송
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await request.json();
  const { teamId, email, role } = body as {
    teamId?: string;
    email?: string;
    role?: "manager" | "influencer";
  };

  if (!teamId || !email || !role) {
    return NextResponse.json({ error: "필수 정보가 누락됐어요." }, { status: 400 });
  }
  if (!["manager", "influencer"].includes(role)) {
    return NextResponse.json({ error: "역할이 올바르지 않아요." }, { status: 400 });
  }
  const cleanEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return NextResponse.json({ error: "이메일 형식이 올바르지 않아요." }, { status: 400 });
  }

  // 초대 권한 검증 — owner 또는 manager만 가능
  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || !["owner", "manager"].includes(membership.role)) {
    return NextResponse.json({ error: "초대 권한이 없어요." }, { status: 403 });
  }

  const { data: invitation, error } = await supabase
    .from("team_invitations")
    .upsert(
      {
        team_id: teamId,
        invited_email: cleanEmail,
        role,
        invited_by: user.id,
      },
      { onConflict: "team_id,invited_email" },
    )
    .select()
    .single();

  if (error || !invitation) {
    console.error("초대 생성 실패:", error);
    return NextResponse.json({ error: "초대 생성에 실패했어요." }, { status: 500 });
  }

  // 초대 이메일 발송 — 실패해도 초대 자체는 성공
  const { data: team } = await supabase.from("teams").select("name").eq("id", teamId).single();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://chaechaedaddy.com";
  void sendEmail({
    to: cleanEmail,
    subject: `${team?.name || "팀"}에 초대받았어요`,
    html: `<p>${team?.name || "팀"}에서 ${role === "manager" ? "매니저" : "인플루언서"}로 초대했어요.</p>
           <p><a href="${appUrl}/dashboard/team">팀 초대 확인하기</a></p>`,
    text: `${team?.name || "팀"}에서 초대했어요. ${appUrl}/dashboard/team 에서 확인해 주세요.`,
  });

  return NextResponse.json({ invitation });
}
