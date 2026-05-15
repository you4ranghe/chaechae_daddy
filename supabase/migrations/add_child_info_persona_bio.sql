-- ════════════════════════════════════════════════════════════
-- profiles 테이블에 아이 정보 + 인플루언서 자기소개 컬럼 추가
-- 적용 방법: Supabase 콘솔 → SQL Editor → 이 파일 전체 붙여넣고 RUN
-- ════════════════════════════════════════════════════════════

-- child_info: 아이 정보 (선택사항). AI 에이전트의 시스템 프롬프트에 활용.
-- 구조 (전부 nullable):
-- {
--   "name": "채채",
--   "birth_date": "2024-05-12",          -- 분석 시 현재 - birth_date로 개월수 자동 계산
--   "gender": "female" | "male" | "other",
--   "height_cm": 65,
--   "weight_kg": 7.2,
--   "notes": "이유식 시작",                  -- 알레르기/특이사항
--   "measurements_updated_at": "..."     -- ISO timestamp, 30일 이상 지나면 height/weight를 프롬프트에서 제외
-- }
alter table profiles
  add column if not exists child_info jsonb;

-- persona_bio: 자기소개 + 선호하는 AI 답변 톤 (선택사항, 자유 텍스트).
alter table profiles
  add column if not exists persona_bio text;
