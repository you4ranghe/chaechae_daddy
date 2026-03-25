// 서버 사이드 환경 변수 검증 — 빌드/런타임에서 누락 시 즉시 에러
export function validateEnv() {
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "ANTHROPIC_API_KEY",
  ];

  const missing = required.filter(function (key) {
    return !process.env[key];
  });

  if (missing.length > 0) {
    throw new Error(
      `필수 환경 변수가 설정되지 않았습니다: ${missing.join(", ")}\n` +
        `.env.local 파일 또는 Vercel 대시보드에서 설정해주세요.`
    );
  }
}

// 타입 안전한 환경 변수 접근
export function getEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`환경 변수 ${key}가 설정되지 않았습니다.`);
  }
  return value;
}
