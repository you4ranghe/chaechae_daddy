import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { CalculatorClient, type CompletedSponsorship } from "@/components/calculator/calculator-client";

export const dynamic = "force-dynamic";

interface RawRow {
  id: string;
  brand_name: string | null;
  product: string | null;
  payment_amount: number | null;
  created_at: string;
  analysis: { brand?: { industry?: string | null } | null } | null;
}

export default async function CalculatorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 올해 1월 1일부터의 completed 협찬만 (메모리 부담 최소화)
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();
  const { data: completedRaw } = await supabase
    .from("sponsorships")
    .select("id, brand_name, product, payment_amount, created_at, analysis")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .gte("created_at", yearStart)
    .order("created_at", { ascending: false });

  const completed: CompletedSponsorship[] = ((completedRaw as RawRow[]) || []).map((r) => ({
    id: r.id,
    brand_name: r.brand_name || "-",
    product: r.product,
    payment_amount: r.payment_amount || 0,
    created_at: r.created_at,
    industry: r.analysis?.brand?.industry || null,
  }));

  const { data: profile } = await supabase
    .from("profiles")
    .select("instagram_handle")
    .eq("id", user.id)
    .single();
  const handle =
    profile?.instagram_handle || user.user_metadata?.instagram_handle || "사용자";

  return (
    <div className="space-y-6 animate-fade-up">
      <section className="bezel relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-6 py-7 sm:px-8">
        <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-300/30 blur-[60px] animate-glow" />
        <span aria-hidden className="pointer-events-none absolute -bottom-12 right-20 h-28 w-28 rounded-full bg-teal-200/40 blur-2xl" />
        <div className="relative flex items-start gap-3.5">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-[0_4px_14px_-2px_rgb(16_185_129_/_0.45)]">
            <CalcIcon className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">Calculator</p>
            <h1 className="mt-0.5 text-[22px] font-black tracking-tight text-gray-900">정산 · 세금 계산기</h1>
            <p className="mt-1 text-[13.5px] leading-relaxed text-gray-600">
              협찬료를 받기 전에 부가세·원천세·수수료·종합소득세까지 미리 계산해 보세요
            </p>
          </div>
        </div>
      </section>

      <CalculatorClient completed={completed} handle={handle} />
    </div>
  );
}

function CalcIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M6.32 1.827a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V19.5a3 3 0 0 1-3 3H6.75a3 3 0 0 1-3-3V4.757c0-1.47 1.073-2.756 2.57-2.93ZM7.5 11.25a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H8.25a.75.75 0 0 1-.75-.75v-.008Zm0 3a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H8.25a.75.75 0 0 1-.75-.75v-.008Zm0 3a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H8.25a.75.75 0 0 1-.75-.75v-.008Zm3.75-6a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H12a.75.75 0 0 1-.75-.75v-.008Zm0 3a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H12a.75.75 0 0 1-.75-.75v-.008Zm0 3a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H12a.75.75 0 0 1-.75-.75v-.008Zm3.75-6a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75h-.008a.75.75 0 0 1-.75-.75v-.008Zm0 3a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75h-.008a.75.75 0 0 1-.75-.75v-.008Zm0 3a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75h-.008a.75.75 0 0 1-.75-.75v-.008ZM6.75 5.25a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-.75.75h-9a.75.75 0 0 1-.75-.75V5.25Z" clipRule="evenodd" />
    </svg>
  );
}
