import Stripe from "stripe";

// Stripe 클라이언트 — 런타임에서만 초기화 (빌드 시 env 없어도 안전)
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-03-25.dahlia",
    });
  }
  return _stripe;
}

// Stripe Price ID ↔ 내부 플랜 매핑
// Stripe 대시보드에서 Product/Price 생성 후 여기에 ID 입력
export function getPlanPriceMap(): Record<string, string> {
  return {
    starter: process.env.STRIPE_PRICE_STARTER || "",
    growth: process.env.STRIPE_PRICE_GROWTH || "",
    business: process.env.STRIPE_PRICE_BUSINESS || "",
  };
}

// Price ID → 플랜 이름 역매핑
export function getPlanFromPriceId(priceId: string): string | null {
  const map = getPlanPriceMap();
  for (const [plan, id] of Object.entries(map)) {
    if (id === priceId) return plan;
  }
  return null;
}
