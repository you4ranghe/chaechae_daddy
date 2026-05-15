import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/supabase-server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("instagram_handle")
    .eq("id", user.id)
    .single();

  const handle =
    profile?.instagram_handle || user.user_metadata?.instagram_handle || "사용자";

  return NextResponse.json({ handle });
}

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
    const {
      instagramHandle,
      followerCount,
      categories,
      emailNotifications,
      childInfo,
      personaBio,
    } = body as {
      instagramHandle?: string;
      followerCount?: number;
      categories?: string[];
      emailNotifications?: { trial_reminder?: boolean; analysis_complete?: boolean };
      childInfo?: {
        name?: string | null;
        birth_date?: string | null;
        gender?: "female" | "male" | "other" | null;
        height_cm?: number | null;
        weight_kg?: number | null;
        notes?: string | null;
      } | null;
      personaBio?: string | null;
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
    if (childInfo !== undefined) {
      // null/빈 객체면 컬럼을 비움
      const hasAny =
        childInfo &&
        (childInfo.name ||
          childInfo.birth_date ||
          childInfo.gender ||
          childInfo.height_cm ||
          childInfo.weight_kg ||
          childInfo.notes);
      if (!hasAny) {
        updateData.child_info = null;
      } else {
        // 기존 child_info와 머지해서 measurements_updated_at을 정확히 관리
        const { data: existing } = await supabase
          .from("profiles")
          .select("child_info")
          .eq("id", user.id)
          .single();

        const prev =
          (existing?.child_info as Record<string, unknown> | null) || {};

        const heightChanged =
          childInfo.height_cm !== undefined &&
          childInfo.height_cm !== (prev as { height_cm?: number | null }).height_cm;
        const weightChanged =
          childInfo.weight_kg !== undefined &&
          childInfo.weight_kg !== (prev as { weight_kg?: number | null }).weight_kg;

        const measurementsUpdatedAt =
          heightChanged || weightChanged
            ? new Date().toISOString()
            : ((prev as { measurements_updated_at?: string }).measurements_updated_at ?? null);

        updateData.child_info = {
          name: childInfo.name ?? null,
          birth_date: childInfo.birth_date ?? null,
          gender: childInfo.gender ?? null,
          height_cm: childInfo.height_cm ?? null,
          weight_kg: childInfo.weight_kg ?? null,
          notes: childInfo.notes ?? null,
          measurements_updated_at: measurementsUpdatedAt,
        };
      }
    }
    if (personaBio !== undefined) {
      const trimmed = (personaBio || "").trim();
      updateData.persona_bio = trimmed.length > 0 ? trimmed.slice(0, 2000) : null;
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
