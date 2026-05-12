import type { SupabaseClient } from "@supabase/supabase-js";
import type { Sponsorship } from "@/lib/types/sponsorship";

export type MonthlyRevenue = {
  month: string;
  revenue: number;
  count: number;
};

export type BrandStat = {
  brand: string;
  count: number;
  revenue: number;
  lastDate: string;
};

export type StatusBreakdown = {
  pending: number;
  accepted: number;
  rejected: number;
  completed: number;
};

export type IndustryPrice = {
  industry: string;
  count: number;
  median: number;
  min: number;
  max: number;
};

export type InsightsData = {
  monthlyRevenue: MonthlyRevenue[];
  brandStats: BrandStat[];
  statusBreakdown: StatusBreakdown;
  industryPrices: IndustryPrice[];
  totals: {
    revenue: number;
    completedCount: number;
    acceptRate: number;
  };
};

// 최근 6개월 협찬 데이터를 한 번에 가져와 메모리에서 집계.
// 인플루언서 1명당 협찬 수가 보통 수십~수백 건이라 충분.
export async function fetchInsights(
  supabase: SupabaseClient,
  userId: string,
): Promise<InsightsData> {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const { data } = await supabase
    .from("sponsorships")
    .select("brand_name, status, payment_amount, analysis, created_at")
    .eq("user_id", userId)
    .gte("created_at", sixMonthsAgo.toISOString())
    .order("created_at", { ascending: false });

  const rows = (data || []) as Pick<
    Sponsorship,
    "brand_name" | "status" | "payment_amount" | "analysis" | "created_at"
  >[];

  return {
    monthlyRevenue: aggregateMonthlyRevenue(rows, now),
    brandStats: aggregateBrandStats(rows),
    statusBreakdown: aggregateStatus(rows),
    industryPrices: aggregateIndustryPrices(rows),
    totals: aggregateTotals(rows),
  };
}

function aggregateMonthlyRevenue(
  rows: Pick<Sponsorship, "status" | "payment_amount" | "created_at">[],
  now: Date,
): MonthlyRevenue[] {
  const months: MonthlyRevenue[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      month: `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`,
      revenue: 0,
      count: 0,
    });
  }

  for (const row of rows) {
    if (row.status !== "completed") continue;
    const d = new Date(row.created_at);
    const key = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
    const bucket = months.find((m) => m.month === key);
    if (!bucket) continue;
    bucket.revenue += row.payment_amount || 0;
    bucket.count += 1;
  }

  return months;
}

function aggregateBrandStats(
  rows: Pick<Sponsorship, "brand_name" | "status" | "payment_amount" | "created_at">[],
): BrandStat[] {
  const map = new Map<string, BrandStat>();

  for (const row of rows) {
    const brand = (row.brand_name || "").trim();
    if (!brand) continue;
    const key = brand.toLowerCase();
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
      if (row.status === "completed") existing.revenue += row.payment_amount || 0;
      if (row.created_at > existing.lastDate) existing.lastDate = row.created_at;
    } else {
      map.set(key, {
        brand,
        count: 1,
        revenue: row.status === "completed" ? row.payment_amount || 0 : 0,
        lastDate: row.created_at,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.count - a.count || b.revenue - a.revenue);
}

function aggregateStatus(
  rows: Pick<Sponsorship, "status">[],
): StatusBreakdown {
  const out: StatusBreakdown = { pending: 0, accepted: 0, rejected: 0, completed: 0 };
  for (const row of rows) {
    if (row.status === "pending") out.pending++;
    else if (row.status === "accepted") out.accepted++;
    else if (row.status === "rejected") out.rejected++;
    else if (row.status === "completed") out.completed++;
  }
  return out;
}

function aggregateIndustryPrices(
  rows: Pick<Sponsorship, "status" | "payment_amount" | "analysis">[],
): IndustryPrice[] {
  const buckets = new Map<string, number[]>();

  for (const row of rows) {
    if (row.status !== "completed") continue;
    const amount = row.payment_amount || 0;
    if (amount <= 0) continue;
    const industry = row.analysis?.brand?.industry?.trim();
    if (!industry || industry === "미정") continue;
    const arr = buckets.get(industry) || [];
    arr.push(amount);
    buckets.set(industry, arr);
  }

  return Array.from(buckets.entries())
    .map(([industry, amounts]) => {
      amounts.sort((a, b) => a - b);
      const mid = Math.floor(amounts.length / 2);
      const median = amounts.length % 2 === 0
        ? Math.round((amounts[mid - 1] + amounts[mid]) / 2)
        : amounts[mid];
      return {
        industry,
        count: amounts.length,
        median,
        min: amounts[0],
        max: amounts[amounts.length - 1],
      };
    })
    .sort((a, b) => b.median - a.median);
}

function aggregateTotals(
  rows: Pick<Sponsorship, "status" | "payment_amount">[],
): { revenue: number; completedCount: number; acceptRate: number } {
  let revenue = 0;
  let completed = 0;
  let acceptedOrCompleted = 0;
  let decided = 0; // accepted + rejected + completed (의사결정한 건)

  for (const row of rows) {
    if (row.status === "completed") {
      revenue += row.payment_amount || 0;
      completed++;
      acceptedOrCompleted++;
      decided++;
    } else if (row.status === "accepted") {
      acceptedOrCompleted++;
      decided++;
    } else if (row.status === "rejected") {
      decided++;
    }
  }

  return {
    revenue,
    completedCount: completed,
    acceptRate: decided > 0 ? Math.round((acceptedOrCompleted / decided) * 100) : 0,
  };
}
