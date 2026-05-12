// 협찬 관리 도구 모음 (Phase 1에서 포팅)
// 중복 체크, 시세 조회, 독소조항 감지

import type Anthropic from "@anthropic-ai/sdk";

export interface SponsorshipRecord {
  id: string;
  brand: string;
  product: string;
  date: string;
  recommendation: "수락" | "조건협상" | "거절";
  score: number;
  type: "무상제공" | "유상협찬" | "원고료";
}

export interface CheckDuplicateInput { brand: string; history: SponsorshipRecord[]; }
export interface GetMarketRateInput { category: string; followerCount?: number; }
export interface DetectRedFlagsInput { dmText: string; }

export const checkDuplicateToolDef: Anthropic.Tool = {
  name: "check_duplicate",
  description: "같은 브랜드의 이전 협찬 기록이 있는지 확인합니다.",
  input_schema: {
    type: "object" as const,
    properties: {
      brand: { type: "string", description: "확인할 브랜드명" },
      history: { type: "array", description: "이전 협찬 기록 배열", items: { type: "object" } },
    },
    required: ["brand", "history"],
  },
};

export const getMarketRateToolDef: Anthropic.Tool = {
  name: "get_market_rate",
  description: "육아용품 카테고리별 협찬 시세를 조회합니다.",
  input_schema: {
    type: "object" as const,
    properties: {
      category: { type: "string", description: '제품 카테고리 (예: "이유식용품", "아기옷", "유모차")' },
      followerCount: { type: "number", description: "팔로워 수 (기본값: 2000)" },
    },
    required: ["category"],
  },
};

export const detectRedFlagsToolDef: Anthropic.Tool = {
  name: "detect_red_flags",
  description: "협찬 DM에서 독소조항이나 불리한 조건을 감지합니다.",
  input_schema: {
    type: "object" as const,
    properties: {
      dmText: { type: "string", description: "분석할 협찬 DM 텍스트" },
    },
    required: ["dmText"],
  },
};

// 시세 데이터
interface MarketRate {
  category: string;
  typicalProductValue: string;
  paidRate: string;
  commonType: string;
  expectation: string;
  notes: string;
}

const MARKET_RATES: Record<string, MarketRate> = {
  이유식용품: { category: "이유식용품", typicalProductValue: "3만~15만원", paidRate: "5만~10만원", commonType: "무상제공이 대부분", expectation: "팔로워 2천이면 무상제공 주류", notes: "아기 안전 관련 솔직 리뷰 가능 여부 확인" },
  아기옷: { category: "아기옷", typicalProductValue: "2만~8만원", paidRate: "3만~5만원", commonType: "무상제공 + 할인코드", expectation: "대부분 무상제공", notes: "사이즈 맞지 않는 제품 주의" },
  유모차: { category: "유모차/카시트", typicalProductValue: "30만~100만원+", paidRate: "10만~30만원", commonType: "무상대여 또는 무상제공 + 원고료", expectation: "무상제공만으로도 좋은 조건", notes: "반납 조건 반드시 확인" },
  스킨케어: { category: "아기 스킨케어", typicalProductValue: "1만~5만원", paidRate: "3만~5만원", commonType: "무상제공이 대부분", expectation: "제품 단가 낮아 유상 드묾", notes: "아토피/민감성 피부 알레르기 확인" },
  장난감: { category: "장난감/교구", typicalProductValue: "2만~10만원", paidRate: "3만~8만원", commonType: "무상제공", expectation: "월령별 발달 교구 협찬 많음", notes: "안전인증(KC) 마크 확인 필수" },
  분유: { category: "분유/이유식", typicalProductValue: "3만~10만원 (한달분)", paidRate: "5만~10만원", commonType: "1~2개월분 무상제공", expectation: "식품 협찬은 신뢰도가 중요", notes: "아기 알레르기/소화 문제 가능성" },
  가전: { category: "육아 가전", typicalProductValue: "10만~50만원", paidRate: "10만~20만원", commonType: "무상대여 or 무상제공 + 원고료", expectation: "고가 제품이라 무상제공 자체가 좋은 조건", notes: "반납 여부 확인" },
};

// 독소조항 패턴
interface RedFlag {
  pattern: string;
  severity: "높음" | "보통" | "낮음";
  description: string;
  suggestion: string;
}

const RED_FLAG_PATTERNS: RedFlag[] = [
  { pattern: "부정적인 내용.*금지|부정.*리뷰.*불가|긍정적.*만", severity: "높음", description: "부정 리뷰 금지 조항", suggestion: "솔직한 사용 후기 작성 가능 여부를 확인하세요." },
  { pattern: "위약금|손해배상|계약.*위반", severity: "높음", description: "위약금/손해배상 조항", suggestion: "위약금 조항은 거절하거나 금액 확인 후 협상하세요." },
  { pattern: "수정.*무제한|수정.*3회.*이상|무한.*수정", severity: "높음", description: "무제한 수정 요구", suggestion: "수정 횟수를 최대 2회로 제한하세요." },
  { pattern: "검수.*후.*업로드|사전.*승인.*필수", severity: "보통", description: "사전 검수/승인 조항", suggestion: "1차 검수는 일반적. 전면 수정 요구 시 추가 비용 협의." },
  { pattern: "독점.*계약|경쟁.*브랜드.*금지", severity: "높음", description: "독점/경쟁 브랜드 금지 조항", suggestion: "독점 조항은 추가 원고료 없이 수락하지 마세요." },
  { pattern: "24시간.*이내|당일.*업로드|내일.*까지", severity: "보통", description: "촉박한 마감", suggestion: "최소 3~5일의 여유를 요청하세요." },
  { pattern: "삭제.*금지|영구.*게시|삭제.*불가", severity: "보통", description: "게시물 영구 유지 조항", suggestion: "최소 게시 유지 기간(1~3개월)으로 협상하세요." },
  { pattern: "초상권.*양도|사진.*자유.*사용|2차.*활용", severity: "높음", description: "아기 초상권 무제한 양도", suggestion: "아기 사진 2차 활용 범위를 반드시 제한하세요." },
];

export function executeCheckDuplicate(input: CheckDuplicateInput): string {
  const { brand, history } = input;
  const normalize = (s: string) => s.replace(/\s/g, "").toLowerCase();
  const normalizedBrand = normalize(brand);

  const matches = (history || []).filter(
    (record) =>
      normalize(record.brand).includes(normalizedBrand) ||
      normalizedBrand.includes(normalize(record.brand))
  );

  if (matches.length === 0) {
    return JSON.stringify({ isDuplicate: false, brand, message: "새로운 브랜드입니다.", previousRecords: [] });
  }

  return JSON.stringify({
    isDuplicate: true,
    brand,
    message: `"${brand}" 브랜드와 ${matches.length}건의 이전 협찬 기록이 있습니다.`,
    previousRecords: matches.map((m) => ({ date: m.date, product: m.product, recommendation: m.recommendation, score: m.score, type: m.type })),
  });
}

export function executeGetMarketRate(input: GetMarketRateInput): string {
  const { category, followerCount = 2000 } = input;

  let rate: MarketRate | undefined;
  const key = Object.keys(MARKET_RATES).find((k) => category.includes(k) || k.includes(category));
  rate = key ? MARKET_RATES[key] : undefined;

  if (!rate) {
    rate = { category, typicalProductValue: "2만~20만원", paidRate: "3만~10만원", commonType: "무상제공이 대부분", expectation: `팔로워 ${followerCount.toLocaleString()}명 기준 무상제공 주류`, notes: "일반적인 기준 적용" };
  }

  let tierNote = "";
  if (followerCount < 1000) tierNote = "팔로워 1천 미만: 무상제공도 받기 어려울 수 있습니다.";
  else if (followerCount < 3000) tierNote = "팔로워 1천~3천: 마이크로 인플루언서 초기. 무상제공 주류.";
  else if (followerCount < 10000) tierNote = "팔로워 3천~1만: 성장기. 소액 원고료 가능.";
  else tierNote = "팔로워 1만 이상: 유상협찬이 기본.";

  return JSON.stringify({ ...rate, followerCount, tierNote, fetchedAt: new Date().toISOString() });
}

export function executeDetectRedFlags(input: DetectRedFlagsInput): string {
  const { dmText } = input;
  const detected: Array<{ severity: string; description: string; suggestion: string; matchedText?: string }> = [];

  for (const flag of RED_FLAG_PATTERNS) {
    try {
      const regex = new RegExp(flag.pattern, "i");
      const match = dmText.match(regex);
      if (match) {
        detected.push({ severity: flag.severity, description: flag.description, suggestion: flag.suggestion, matchedText: match[0] });
      }
    } catch { /* regex 에러 무시 */ }
  }

  return JSON.stringify({
    totalFlags: detected.length,
    highSeverity: detected.filter((d) => d.severity === "높음").length,
    flags: detected,
    overallRisk: detected.filter((d) => d.severity === "높음").length >= 2 ? "높음" : detected.length > 0 ? "보통" : "낮음",
    summary: detected.length === 0 ? "독소조항이 감지되지 않았습니다." : `${detected.length}개의 주의사항이 감지되었습니다.`,
  });
}
