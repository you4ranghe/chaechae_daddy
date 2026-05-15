// 아이 정보를 AI 시스템 프롬프트에 안전하게 주입하기 위한 헬퍼.
//
// 규칙:
// 1) birth_date는 현재 시점 기준으로 "N개월"로 변환해서 전달
// 2) height/weight는 measurements_updated_at이 30일 이상 지났으면 stale로 간주, 제외

export interface ChildInfo {
  name?: string | null;
  birth_date?: string | null; // YYYY-MM-DD
  gender?: "female" | "male" | "other" | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  notes?: string | null;
  measurements_updated_at?: string | null; // ISO
}

const STALE_THRESHOLD_DAYS = 30;

function calcAgeMonths(birthDate: string, now: Date): number | null {
  const b = new Date(birthDate);
  if (isNaN(b.getTime())) return null;
  if (b.getTime() > now.getTime()) return null; // 미래 날짜 방어
  const years = now.getFullYear() - b.getFullYear();
  let months = years * 12 + (now.getMonth() - b.getMonth());
  if (now.getDate() < b.getDate()) months -= 1;
  return Math.max(0, months);
}

function isStale(updatedAt: string | null | undefined, now: Date): boolean {
  if (!updatedAt) return true; // 업데이트 시간 없으면 stale 취급
  const d = new Date(updatedAt);
  if (isNaN(d.getTime())) return true;
  const diffMs = now.getTime() - d.getTime();
  return diffMs > STALE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;
}

const GENDER_LABEL: Record<NonNullable<ChildInfo["gender"]>, string> = {
  female: "여아",
  male: "남아",
  other: "비공개",
};

/**
 * 아이 정보를 한국어 문자열로 변환. AI 시스템 프롬프트에 그대로 붙여 쓸 용도.
 * - 정보가 비어있으면 null 반환
 * - 키/몸무게는 30일 이상 미업데이트면 자동 제외
 */
export function buildChildContextBlock(
  child: ChildInfo | null | undefined,
  now: Date = new Date(),
): string | null {
  if (!child) return null;

  const parts: string[] = [];

  if (child.name) parts.push(`이름: ${child.name}`);

  if (child.birth_date) {
    const months = calcAgeMonths(child.birth_date, now);
    if (months !== null) {
      const years = Math.floor(months / 12);
      const rem = months % 12;
      const label =
        years === 0
          ? `${months}개월`
          : rem === 0
            ? `${years}세`
            : `${years}세 ${rem}개월 (총 ${months}개월)`;
      parts.push(`나이: ${label}`);
    }
  }

  if (child.gender) {
    parts.push(`성별: ${GENDER_LABEL[child.gender]}`);
  }

  const measurementsFresh = !isStale(child.measurements_updated_at, now);
  if (measurementsFresh) {
    if (typeof child.height_cm === "number" && child.height_cm > 0) {
      parts.push(`키: ${child.height_cm}cm`);
    }
    if (typeof child.weight_kg === "number" && child.weight_kg > 0) {
      parts.push(`몸무게: ${child.weight_kg}kg`);
    }
  }

  if (child.notes) parts.push(`특이사항: ${child.notes}`);

  if (parts.length === 0) return null;

  return `아이 정보:\n- ${parts.join("\n- ")}`;
}

/**
 * 인플루언서 자기소개 + 아이 정보를 합쳐 시스템 프롬프트에 끼울 블록으로 반환.
 * 양쪽 다 비어있으면 빈 문자열.
 */
export function buildPersonaContext(opts: {
  child: ChildInfo | null | undefined;
  personaBio?: string | null;
  now?: Date;
}): string {
  const now = opts.now ?? new Date();
  const blocks: string[] = [];

  const childBlock = buildChildContextBlock(opts.child, now);
  if (childBlock) blocks.push(childBlock);

  const bio = opts.personaBio?.trim();
  if (bio) blocks.push(`인플루언서 자기소개:\n${bio}`);

  if (blocks.length === 0) return "";

  return `\n\n[인플루언서 컨텍스트 — 응답·콘텐츠를 만들 때 자연스럽게 반영하세요]\n${blocks.join("\n\n")}\n`;
}
