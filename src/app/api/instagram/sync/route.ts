import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/supabase-server";
import { fetchAccountInsights } from "@/lib/instagram/client";

// 수동 동기화 + (cron이 호출할 수도 있음)
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data: conn } = await supabase
    .from("instagram_connections")
    .select("ig_user_id, access_token")
    .eq("user_id", user.id)
    .single();

  if (!conn) {
    return NextResponse.json({ error: "인스타 연동이 안 되어 있어요." }, { status: 400 });
  }

  try {
    const insights = await fetchAccountInsights(conn.ig_user_id, conn.access_token);

    // 스냅샷 저장
    await supabase.from("instagram_insights").insert({
      user_id: user.id,
      follower_count: insights.followers,
      follows_count: insights.follows,
      media_count: insights.mediaCount,
      total_impressions: insights.impressions,
      total_reach: insights.reach,
      profile_views: insights.profileViews,
    });

    // profiles 테이블의 follower_count 갱신
    await supabase
      .from("profiles")
      .update({
        follower_count: insights.followers,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    // 마지막 동기화 시각 갱신
    await supabase
      .from("instagram_connections")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("user_id", user.id);

    return NextResponse.json({ ok: true, insights });
  } catch (e) {
    console.error("Instagram sync 실패:", e);
    return NextResponse.json(
      { error: "동기화에 실패했어요. 토큰이 만료됐을 수 있어요." },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  await supabase.from("instagram_connections").delete().eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
