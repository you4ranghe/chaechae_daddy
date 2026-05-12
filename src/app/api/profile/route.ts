import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/supabase-server";

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { instagramHandle, followerCount, categories, emailNotifications } = body as {
      instagramHandle?: string;
      followerCount?: number;
      categories?: string[];
      emailNotifications?: { trial_reminder?: boolean; analysis_complete?: boolean };
    };

    // 유효성 검사
    if (instagramHandle !== undefined && typeof instagramHandle !== "string") {
      return NextResponse.json(
        { error: "인스타그램 핸들이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    if (followerCount !== undefined && (typeof followerCount !== "number" || followerCount < 0)) {
      return NextResponse.json(
        { error: "팔로워 수가 올바르지 않습니다." },
        { status: 400 }
      );
    }

    if (categories !== undefined && (!Array.isArray(categories) || categories.length > 5)) {
      return NextResponse.json(
        { error: "카테고리는 최대 5개까지 선택할 수 있습니다." },
        { status: 400 }
      );
    }

    if (emailNotifications !== undefined && (typeof emailNotifications !== "object" || emailNotifications === null)) {
      return NextResponse.json(
        { error: "이메일 알림 설정이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    // profiles 테이블 업데이트
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (instagramHandle !== undefined) {
      updateData.instagram_handle = instagramHandle.replace(/^@/, "");
    }
    if (followerCount !== undefined) {
      updateData.follower_count = followerCount;
    }
    if (categories !== undefined) {
      updateData.categories = categories;
    }
    if (emailNotifications !== undefined) {
      // 화이트리스트한 키만 통과 — 임의 jsonb 주입 방지
      updateData.email_notifications = {
        trial_reminder: emailNotifications.trial_reminder !== false,
        analysis_complete: emailNotifications.analysis_complete !== false,
      };
    }

    const { error: dbError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id);

    if (dbError) {
      console.error("프로필 업데이트 실패:", dbError);
      return NextResponse.json(
        { error: "프로필 저장에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("프로필 API 에러:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
