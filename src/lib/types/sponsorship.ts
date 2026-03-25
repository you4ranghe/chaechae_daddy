// 협찬 분석 결과 타입
export interface SponsorshipAnalysis {
  brand: {
    name: string;
    product: string;
    industry: string;
  };
  conditions: {
    type: "무상" | "유상" | "혼합";
    payment: string;
    requirements: string[];
    deadline: string;
  };
  score: {
    value: number; // 1~10
    recommendation: "수락" | "협상" | "거절";
    reasoning: string;
  };
  pros: string[];
  cons: string[];
  responses: {
    accept: string;
    negotiate: string;
    reject: string;
  };
}

// 체크리스트 항목
export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

// 콘텐츠 생성 결과
export interface GeneratedContent {
  caption: string;
  hashtags: string[];
}

// DB 저장용 협찬 레코드
export interface Sponsorship {
  id: string;
  user_id: string;
  brand_name: string;
  product: string;
  status: "analyzing" | "pending" | "accepted" | "rejected" | "completed";
  raw_dm: string;
  analysis: SponsorshipAnalysis | null;
  checklist: ChecklistItem[] | null;
  payment_amount: number;
  deadline: string | null;
  created_at: string;
  updated_at: string;
}

// DB 저장용 생성된 콘텐츠 레코드
export interface GeneratedContentRecord {
  id: string;
  sponsorship_id: string;
  user_id: string;
  caption: string;
  hashtags: string[];
  version: number;
  created_at: string;
}

// 에이전트 사용량 레코드
export interface AgentUsage {
  id: string;
  user_id: string;
  type: "sponsorship_analysis" | "content_generation";
  sponsorship_id: string | null;
  tokens_used: number;
  model: string;
  created_at: string;
}

// 오케스트레이터 판단 결과
export interface OrchestratorDecision {
  taskType: "simple_analysis" | "complex_analysis" | "content_generation";
  model: "claude-sonnet-4-6";
  reasoning: string;
  systemPrompt: string;
  userPrompt: string;
}

// 사용량 체크 결과
export interface UsageCheckResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  used: number;
  plan: string;
  message?: string;
}
