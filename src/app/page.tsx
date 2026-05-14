import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";

export default async function Home() {
  // 로그인되어 있으면 대시보드로, 아니면 랜딩으로
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      redirect("/dashboard");
    }
  } catch {
    // Supabase 호출 실패 시에도 랜딩으로 떨어뜨림
  }
  redirect("/landing");
}
