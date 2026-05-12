import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/supabase-server";

type SponsorshipStatus = "pending" | "accepted" | "rejected" | "completed";

const ALLOWED_TRANSITIONS: Record<SponsorshipStatus, SponsorshipStatus[]> = {
  pending: ["accepted", "rejected"],
  accepted: ["completed", "rejected"],
  rejected: ["pending"],
  completed: ["accepted"],
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const { status, paymentAmount } = body as {
      status?: SponsorshipStatus;
      paymentAmount?: number;
    };

    if (!status || !["pending", "accepted", "rejected", "completed"].includes(status)) {
      return NextResponse.json({ error: "유효하지 않은 상태입니다." }, { status: 400 });
    }

    if (paymentAmount !== undefined && (typeof paymentAmount !== "number" || paymentAmount < 0 || paymentAmount > 100000000)) {
      return NextResponse.json({ error: "금액이 올바르지 않습니다." }, { status: 400 });
    }

    // 현재 상태 조회 (전이 검증용)
    const { data: current, error: fetchError } = await supabase
      .from("sponsorships")
      .select("status")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !current) {
      return NextResponse.json({ error: "협찬을 찾을 수 없습니다." }, { status: 404 });
    }

    const allowed = ALLOWED_TRANSITIONS[current.status as SponsorshipStatus];
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { error: `${current.status} → ${status}로는 변경할 수 없어요.` },
        { status: 400 },
      );
    }

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (status === "completed" && paymentAmount !== undefined) {
      updateData.payment_amount = paymentAmount;
    }

    const { error: updateError } = await supabase
      .from("sponsorships")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("sponsorship 상태 변경 실패:", updateError);
      return NextResponse.json({ error: "상태 변경에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("sponsorship PATCH 에러:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
