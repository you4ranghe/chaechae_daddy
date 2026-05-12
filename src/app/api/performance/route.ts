import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/supabase-server";

// 포스팅 성과 등록 (수동 입력 또는 인스타 동기화에서 호출)
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await request.json();
  const {
    sponsorshipId,
    generatedContentId,
    igMediaId,
    postedAt,
    likes = 0,
    comments = 0,
    reach = 0,
    impressions = 0,
    saves = 0,
    userNotes = "",
  } = body as {
    sponsorshipId?: string;
    generatedContentId?: string;
    igMediaId?: string;
    postedAt?: string;
    likes?: number;
    comments?: number;
    reach?: number;
    impressions?: number;
    saves?: number;
    userNotes?: string;
  };

  // 입력 검증
  for (const [k, v] of [["likes", likes], ["comments", comments], ["reach", reach], ["impressions", impressions], ["saves", saves]] as const) {
    if (typeof v !== "number" || v < 0 || v > 100_000_000) {
      return NextResponse.json({ error: `${k} 값이 올바르지 않아요.` }, { status: 400 });
    }
  }
  if (userNotes && (typeof userNotes !== "string" || userNotes.length > 2000)) {
    return NextResponse.json({ error: "메모가 너무 길어요." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("post_performance")
    .insert({
      user_id: user.id,
      sponsorship_id: sponsorshipId || null,
      generated_content_id: generatedContentId || null,
      ig_media_id: igMediaId || null,
      posted_at: postedAt || new Date().toISOString(),
      likes,
      comments,
      reach,
      impressions,
      saves,
      user_notes: userNotes.slice(0, 2000),
    })
    .select()
    .single();

  if (error) {
    console.error("성과 등록 실패:", error);
    return NextResponse.json({ error: "저장에 실패했어요." }, { status: 500 });
  }

  return NextResponse.json({ performance: data });
}
