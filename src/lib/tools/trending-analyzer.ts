// 트렌딩 분석 + 경쟁 계정 패턴 분석 도구 (Phase 1에서 포팅)
// 주간 콘텐츠 플래너(weekly-planner)에서 사용

import type Anthropic from "@anthropic-ai/sdk";

export interface TrendingTopic {
  title: string;
  popularity: number;
  description: string;
  relatedHashtags: string[];
}

export interface CompetitorTheme {
  accountType: string;
  theme: string;
  engagement: "높음" | "보통" | "낮음";
  contentType: "릴스" | "캐러셀" | "단일이미지";
  description: string;
  exampleCaption: string;
}

export interface TrendingTopicsInput { category: string; count?: number; }
export interface CompetitorThemesInput { niche: string; count?: number; }

export const trendingTopicsToolDef: Anthropic.Tool = {
  name: "get_trending_topics",
  description:
    "육아/이유식/아기용품 등 카테고리별 인스타그램 트렌딩 주제를 분석합니다.",
  input_schema: {
    type: "object" as const,
    properties: {
      category: {
        type: "string",
        description: '조회할 카테고리 (예: "이유식", "아기발달", "육아용품")',
      },
      count: { type: "number", description: "가져올 트렌딩 주제 수 (1~10, 기본값 5)" },
    },
    required: ["category"],
  },
};

export const competitorThemesToolDef: Anthropic.Tool = {
  name: "get_competitor_themes",
  description:
    "경쟁 육아 인스타 계정들이 최근 올린 콘텐츠 패턴을 분석합니다.",
  input_schema: {
    type: "object" as const,
    properties: {
      niche: {
        type: "string",
        description: '분석할 니치 (예: "육아맘", "이유식", "아기옷")',
      },
      count: { type: "number", description: "가져올 경쟁 패턴 수 (1~10, 기본값 5)" },
    },
    required: ["niche"],
  },
};

// 목업 데이터
const TRENDING_DATA: Record<string, TrendingTopic[]> = {
  이유식: [
    { title: "초기 이유식 시작 (만 6개월)", popularity: 97, description: "WHO 권장 만 6개월 이유식 시작, 쌀미음부터 단계별 진행법", relatedHashtags: ["#이유식시작", "#초기이유식", "#6개월이유식", "#쌀미음"] },
    { title: "BLW vs 숟가락 이유식", popularity: 92, description: "아기주도이유식(BLW)과 전통 숟가락 이유식 비교", relatedHashtags: ["#BLW", "#아기주도이유식", "#핑거푸드"] },
    { title: "알레르기 식품 도전기", popularity: 88, description: "계란, 땅콩 등 알레르기 유발 식품 순서대로 도전하는 과정 공유", relatedHashtags: ["#이유식알레르기", "#식품알레르기"] },
    { title: "이유식 큐브 만들기", popularity: 85, description: "한번에 만들어 냉동하는 이유식 큐브 레시피", relatedHashtags: ["#이유식큐브", "#이유식냉동"] },
    { title: "이유식 거부 대처법", popularity: 82, description: "이유식 거부하는 아기 대처법", relatedHashtags: ["#이유식거부", "#편식아기"] },
  ],
  아기발달: [
    { title: "6개월 발달 체크리스트", popularity: 96, description: "앉기, 뒤집기, 옹알이 등 6개월 아기 발달 이정표", relatedHashtags: ["#6개월아기", "#아기발달", "#발달체크"] },
    { title: "대근육 발달 놀이", popularity: 90, description: "터미타임, 앉기 연습 등 대근육 발달 촉진 놀이법", relatedHashtags: ["#터미타임", "#대근육발달"] },
    { title: "소근육 발달 장난감", popularity: 86, description: "잡기, 옮기기 등 소근육 발달에 좋은 장난감", relatedHashtags: ["#소근육발달", "#아기장난감"] },
    { title: "수면 퇴행기 극복", popularity: 84, description: "4개월/6개월 수면 퇴행기 부모 대처법", relatedHashtags: ["#수면퇴행", "#아기수면"] },
    { title: "언어 발달 자극법", popularity: 80, description: "옹알이에서 첫 단어까지 월령별 자극법", relatedHashtags: ["#언어발달", "#옹알이"] },
  ],
  육아용품: [
    { title: "하이체어 비교 리뷰", popularity: 94, description: "스토케, 범보 등 이유식용 하이체어 비교", relatedHashtags: ["#하이체어", "#이유식의자"] },
    { title: "아기띠 vs 힙시트", popularity: 89, description: "외출 시 아기띠와 힙시트 장단점 비교", relatedHashtags: ["#아기띠", "#힙시트"] },
    { title: "카시트 전환 시기", popularity: 85, description: "바구니카시트에서 컨버터블로 전환 시기", relatedHashtags: ["#카시트", "#카시트추천"] },
    { title: "아기 보습제 성분 비교", popularity: 82, description: "아토피 피부 아기를 위한 보습제 성분 분석", relatedHashtags: ["#아기보습제", "#아토피보습"] },
    { title: "여름 쿨매트", popularity: 79, description: "여름철 아기 쿨매트, 냉감 이불 등", relatedHashtags: ["#아기쿨매트", "#여름육아"] },
  ],
  육아일상: [
    { title: "육퇴 후 루틴", popularity: 95, description: "아기 재운 후 엄마 자기계발/취미 시간", relatedHashtags: ["#육퇴", "#육퇴후", "#갓생"] },
    { title: "워킹맘 죄책감 극복", popularity: 91, description: "출근하는 엄마의 솔직한 감정", relatedHashtags: ["#워킹맘", "#직장맘"] },
    { title: "부부 육아 분담", popularity: 87, description: "공동육아 현실, 아빠 역할", relatedHashtags: ["#공동육아", "#아빠육아"] },
    { title: "첫째맘 시행착오", popularity: 84, description: "첫 아이 키우며 겪는 실수담", relatedHashtags: ["#첫째맘", "#초보맘"] },
    { title: "아기와 외출 꿀팁", popularity: 77, description: "기저귀 가방 필수템, 외출 주의사항", relatedHashtags: ["#아기외출", "#기저귀가방"] },
  ],
};

const COMPETITOR_DATA: Record<string, CompetitorTheme[]> = {
  육아맘: [
    { accountType: "팔로워 5만+ 육아 인플루언서", theme: "일상 + 정보 믹스", engagement: "높음", contentType: "캐러셀", description: "1장은 감성 사진, 2~5장은 정보 카드뉴스 형식", exampleCaption: "오늘도 이유식 전쟁 끝 🥄 6개월 아기 초기이유식 팁 정리했어요 →" },
    { accountType: "팔로워 1만 육아 블로거", theme: "Before/After 비교", engagement: "높음", contentType: "릴스", description: "아기 성장 비교(신생아 vs 현재), 반응 폭발", exampleCaption: "0개월 vs 6개월 🤍 시간아 천천히..." },
    { accountType: "팔로워 3만 이유식 전문", theme: "레시피 카드 + 과정샷", engagement: "높음", contentType: "캐러셀", description: "재료-과정-완성 3컷 구성", exampleCaption: "소고기브로콜리죽 🥦 철분 가득! 캡션에 레시피 👇" },
    { accountType: "팔로워 8만 대형 계정", theme: "육아 밈/공감 릴스", engagement: "높음", contentType: "릴스", description: "트렌딩 오디오 + 육아 공감 상황 연출", exampleCaption: "새벽 3시에 깨서 눈 마주치고 웃는 아기... 화낼 수가 없잖아 😭" },
    { accountType: "팔로워 1.5만 협찬 활발", theme: "솔직 제품 리뷰", engagement: "보통", contentType: "캐러셀", description: "장단점 솔직 비교, 실사용 사진", exampleCaption: "하이체어 3개 써본 솔직 후기 📝 (내돈내산!)" },
  ],
  이유식: [
    { accountType: "이유식 전문 계정", theme: "단계별 이유식 가이드", engagement: "높음", contentType: "캐러셀", description: "초기/중기/후기 단계별 식단표 + 주의사항", exampleCaption: "초기 이유식 1~2주차 식단표 공유해요 📋 저장 필수!" },
    { accountType: "영양사 자격 육아맘", theme: "영양 성분 분석", engagement: "높음", contentType: "캐러셀", description: "이유식 재료별 영양소 분석", exampleCaption: "6개월 아기에게 철분이 중요한 이유 🔬" },
    { accountType: "요리 전문 육아맘", theme: "이유식 먹방 릴스", engagement: "높음", contentType: "릴스", description: "아기가 이유식 먹는 귀여운 영상", exampleCaption: "첫 소고기죽 반응 🐄 쩝쩝하는 게 너무 귀여워..." },
  ],
};

export function executeTrendingTopics(input: TrendingTopicsInput): string {
  const { category, count = 5 } = input;

  let topics: TrendingTopic[] | undefined = TRENDING_DATA[category];
  if (!topics) {
    const key = Object.keys(TRENDING_DATA).find(
      (k) => category.includes(k) || k.includes(category)
    );
    topics = key ? TRENDING_DATA[key] : undefined;
  }

  if (topics) {
    return JSON.stringify({
      category,
      trending_topics: topics.slice(0, Math.min(count, 10)),
      source: "instagram_trend_analysis",
      fetched_at: new Date().toISOString(),
    });
  }

  const generic: TrendingTopic[] = Array.from(
    { length: Math.min(count, 10) },
    (_, i) => ({
      title: `${category} 트렌드 #${i + 1}`,
      popularity: 90 - i * 5,
      description: `${category} 분야에서 최근 주목받는 주제입니다.`,
      relatedHashtags: [`#${category}`, "#육아", "#아기"],
    })
  );

  return JSON.stringify({
    category,
    trending_topics: generic,
    source: "generated_fallback",
    fetched_at: new Date().toISOString(),
  });
}

export function executeCompetitorThemes(input: CompetitorThemesInput): string {
  const { niche, count = 5 } = input;

  let themes: CompetitorTheme[] | undefined = COMPETITOR_DATA[niche];
  if (!themes) {
    const key = Object.keys(COMPETITOR_DATA).find(
      (k) => niche.includes(k) || k.includes(niche)
    );
    themes = key ? COMPETITOR_DATA[key] : undefined;
  }

  if (themes) {
    return JSON.stringify({
      niche,
      competitor_themes: themes.slice(0, Math.min(count, 10)),
      analysis_date: new Date().toISOString(),
      insight: "캐러셀(정보형)과 릴스(공감형) 콘텐츠가 가장 높은 반응을 얻고 있습니다.",
    });
  }

  return JSON.stringify({
    niche,
    competitor_themes: [
      {
        accountType: "일반 육아 계정",
        theme: "일상 공유",
        engagement: "보통",
        contentType: "단일이미지",
        description: `${niche} 관련 일상 공유 콘텐츠`,
        exampleCaption: `오늘의 ${niche} 이야기`,
      },
    ],
    analysis_date: new Date().toISOString(),
    insight: "해당 니치에 대한 상세 경쟁 데이터를 수집 중입니다.",
  });
}
