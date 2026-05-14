-- ────────────────────────────────────────────────────────────
-- 안전망: 일부 환경에서 sponsorships.product 컬럼이 누락되어 있어
-- "column sponsorships.product does not exist" (42703) 에러가 발생.
-- 기존 safety 마이그레이션의 create table if not exists 블록은
-- 테이블이 이미 있으면 건너뛰므로 누락된 컬럼이 추가되지 않았음.
-- ────────────────────────────────────────────────────────────

alter table sponsorships
  add column if not exists product text not null default '';

-- PostgREST 스키마 캐시 강제 리로드
notify pgrst, 'reload schema';
