// 트렌딩 주제 조회 도구 (Phase 1에서 포팅)
// 현재는 목업 데이터. 향후 네이버 데이터랩 / Instagram API로 교체 가능.

import type Anthropic from "@anthropic-ai/sdk";

export interface TrendingTopic {
  title: string;
  popularity: number;
  description: string;
}

export interface TrendingTopicsInput {
  category: string;
  count: number;
}

export const toolDefinition: Anthropic.Tool = {
  name: "get_trending_topics",
  description:
    "특정 카테고리의 현재 트렌딩 주제(인기 키워드)를 가져옵니다. " +
    "인스타그램 콘텐츠 기획 시 최신 트렌드를 반영하기 위해 사용합니다.",
  input_schema: {
    type: "object" as const,
    properties: {
      category: {
        type: "string",
        description: '조회할 카테고리 (예: "육아", "요리", "여행")',
      },
      count: {
        type: "number",
        description: "가져올 트렌딩 주제 수 (1~10, 기본값 5)",
      },
    },
    required: ["category"],
  },
};

const MOCK_DATA: Record<string, TrendingTopic[]> = {
  육아: [
    { title: "수면교육 타이밍", popularity: 95, description: "신생아~돌 전후 수면교육 시작 시기와 방법에 대한 관심 급증" },
    { title: "이유식 BLW", popularity: 88, description: "아기 주도 이유식(Baby-Led Weaning) 트렌드 지속" },
    { title: "육아번아웃 극복", popularity: 82, description: "부모 멘탈케어와 번아웃 예방 콘텐츠 수요 증가" },
    { title: "유아 감각놀이", popularity: 79, description: "집에서 하는 오감 자극 놀이 아이디어" },
    { title: "공동육아 팁", popularity: 75, description: "부부 공동육아, 역할 분담에 대한 솔직한 이야기" },
    { title: "어린이집 적응기", popularity: 72, description: "첫 어린이집 적응 과정과 부모 마음 다루기" },
    { title: "아이 독서습관", popularity: 68, description: "유아기 독서 습관 만들기, 추천 그림책 큐레이션" },
    { title: "육아 꿀템 리뷰", popularity: 65, description: "실사용 후기 기반 육아용품 추천" },
    { title: "소아과 방문 가이드", popularity: 62, description: "예방접종 스케줄과 자주 묻는 증상 대처법" },
    { title: "아빠 육아 일기", popularity: 58, description: "아빠 시점의 육아 경험담이 MZ 세대에게 인기" },
  ],
  요리: [
    { title: "15분 한 끼 레시피", popularity: 92, description: "바쁜 직장인을 위한 초스피드 요리" },
    { title: "에어프라이어 활용법", popularity: 87, description: "에어프라이어 하나로 만드는 다양한 요리" },
    { title: "건강 도시락", popularity: 83, description: "직장인·학생 도시락 싸기 트렌드" },
    { title: "비건 한식", popularity: 78, description: "채식 기반 한국 전통 요리 재해석" },
    { title: "홈카페 디저트", popularity: 74, description: "집에서 만드는 카페 수준 디저트" },
  ],
  여행: [
    { title: "아이와 국내여행", popularity: 93, description: "아이 동반 가족 여행지 추천" },
    { title: "감성 카페 투어", popularity: 86, description: "지역별 인생 카페 탐방기" },
    { title: "제주도 한 달 살기", popularity: 81, description: "워케이션·장기 체류 제주 생활기" },
    { title: "캠핑 초보 가이드", popularity: 77, description: "캠핑 입문자를 위한 장비·장소 추천" },
    { title: "당일치기 근교 여행", popularity: 73, description: "서울 근교 반나절 코스" },
  ],
};

export function executeTool(input: TrendingTopicsInput): string {
  const { category, count = 5 } = input;

  const topics = MOCK_DATA[category];
  if (topics) {
    return JSON.stringify({
      category,
      trending_topics: topics.slice(0, Math.min(count, 10)),
      source: "mock_data",
      fetched_at: new Date().toISOString(),
    });
  }

  // 매칭 안 되면 범용 데이터
  const generic: TrendingTopic[] = Array.from(
    { length: Math.min(count, 10) },
    (_, i) => ({
      title: `${category} 트렌드 #${i + 1}`,
      popularity: 90 - i * 5,
      description: `${category} 분야에서 최근 주목받는 주제입니다.`,
    })
  );

  return JSON.stringify({
    category,
    trending_topics: generic,
    source: "generated_fallback",
    fetched_at: new Date().toISOString(),
  });
}
