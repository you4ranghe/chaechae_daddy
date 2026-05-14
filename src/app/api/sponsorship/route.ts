import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/supabase-server";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;

    const pageRaw = Number(searchParams.get("page"));
    const limitRaw = Number(searchParams.get("limit"));

    const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;
    const limit = Number.isFinite(limitRaw) && limitRaw >= 1
      ? Math.min(Math.floor(limitRaw), MAX_LIMIT)
      : DEFAULT_LIMIT;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // 일부 환경에 'product' 등 일부 컬럼이 누락된 sponsorships 테이블이 있을 수 있어
    // 명시적 컬럼 select 대신 "*"로 가져와 누락이 있어도 에러나지 않도록 함.
    const { data, count, error } = await supabase
      .from("sponsorships")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("sponsorship 목록 조회 실패:", error);
      return NextResponse.json({ error: "목록을 불러올 수 없습니다." }, { status: 500 });
    }

    const total = count ?? 0;
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return NextResponse.json({
      items: data ?? [],
      page,
      limit,
      total,
      totalPages,
    });
  } catch (error) {
    console.error("sponsorship GET 에러:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
