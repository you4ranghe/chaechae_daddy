// 정산·세금 계산 공통 로직. 자동(실제 협찬)/수동(시뮬레이션) 양쪽에서 재사용.

export type VatMode = "included" | "excluded" | "none";

// 2024 종합소득세 누진세율 (괄호 안은 누진공제)
const INCOME_TAX_BRACKETS: { upTo: number; rate: number; deduction: number }[] = [
  { upTo: 14_000_000, rate: 0.06, deduction: 0 },
  { upTo: 50_000_000, rate: 0.15, deduction: 1_080_000 },
  { upTo: 88_000_000, rate: 0.24, deduction: 5_220_000 },
  { upTo: 150_000_000, rate: 0.35, deduction: 14_900_000 },
  { upTo: 300_000_000, rate: 0.38, deduction: 19_400_000 },
  { upTo: 500_000_000, rate: 0.40, deduction: 25_400_000 },
  { upTo: 1_000_000_000, rate: 0.42, deduction: 35_400_000 },
  { upTo: Infinity, rate: 0.45, deduction: 65_400_000 },
];

export function calcIncomeTax(taxableIncome: number): number {
  for (const b of INCOME_TAX_BRACKETS) {
    if (taxableIncome <= b.upTo) {
      return Math.max(0, taxableIncome * b.rate - b.deduction);
    }
  }
  return 0;
}

export interface SettlementInput {
  gross: number; // 협찬 표기 금액
  vatMode: VatMode;
  withholding: boolean; // 원천세 3.3% 차감 여부
  agencyRate: number; // 0~1 (매니지먼트 수수료 비율)
}

export interface SettlementBreakdown {
  grossPayment: number; // 광고주가 실제 입금하는 총액
  supplyValue: number; // 공급가액 (부가세 분리 후)
  vat: number; // 부가세
  withholdingTax: number; // 원천세
  agencyDeduction: number; // 매니지먼트 차감
  netToWallet: number; // 본인 호주머니로 들어오는 돈
}

export function calcSettlement({
  gross,
  vatMode,
  withholding,
  agencyRate,
}: SettlementInput): SettlementBreakdown {
  let supplyValue = gross;
  let vat = 0;
  if (vatMode === "included") {
    supplyValue = Math.round(gross / 1.1);
    vat = gross - supplyValue;
  } else if (vatMode === "excluded") {
    vat = Math.round(gross * 0.1);
  }
  const grossPayment = vatMode === "excluded" ? supplyValue + vat : gross;
  const withholdingTax = withholding ? Math.round(supplyValue * 0.033) : 0;
  const agencyDeduction = Math.round(supplyValue * agencyRate);
  const netToWallet = supplyValue - withholdingTax - agencyDeduction;
  return { grossPayment, supplyValue, vat, withholdingTax, agencyDeduction, netToWallet };
}

export interface AnnualTaxInput {
  annualSupplyValue: number; // 연 총 공급가액 (사업소득)
  otherBusinessIncome: number; // 다른 사업소득
  withholdingTotal: number; // 이미 원천징수된 금액
  expenseRate?: number; // 경비율 (기본 0.3)
}

export interface AnnualTaxBreakdown {
  annualBusinessIncome: number;
  estimatedExpense: number;
  taxableIncome: number;
  incomeTax: number;
  localTax: number;
  totalAnnualTax: number;
  taxDifference: number; // 양수 추가납부, 음수 환급
}

export function calcAnnualTax({
  annualSupplyValue,
  otherBusinessIncome,
  withholdingTotal,
  expenseRate = 0.3,
}: AnnualTaxInput): AnnualTaxBreakdown {
  const annualBusinessIncome = annualSupplyValue + otherBusinessIncome;
  const estimatedExpense = Math.round(annualBusinessIncome * expenseRate);
  const taxableIncome = Math.max(0, annualBusinessIncome - estimatedExpense);
  const incomeTax = Math.round(calcIncomeTax(taxableIncome));
  const localTax = Math.round(incomeTax * 0.1);
  const totalAnnualTax = incomeTax + localTax;
  const taxDifference = totalAnnualTax - withholdingTotal;
  return {
    annualBusinessIncome,
    estimatedExpense,
    taxableIncome,
    incomeTax,
    localTax,
    totalAnnualTax,
    taxDifference,
  };
}

export function formatWon(n: number): string {
  return `₩${Math.round(n).toLocaleString("ko-KR")}`;
}
