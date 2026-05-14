-- ────────────────────────────────────────────────────────────
-- 안전망: 일부 환경의 sponsorships 테이블에 옛 컬럼명 dm_text (NOT NULL)
-- 가 남아있어, 코드가 raw_dm 에만 insert 하면
-- "null value in column 'dm_text' violates not-null constraint" (23502) 발생.
-- → dm_text 만 있는 경우: raw_dm 으로 rename
-- → 둘 다 있는 경우: dm_text NOT NULL 해제 + default '' 부여
-- → 어느 쪽도 없는 경우: raw_dm 새로 추가
-- ────────────────────────────────────────────────────────────

do $$
declare
  has_dm_text boolean;
  has_raw_dm boolean;
begin
  select exists(
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'sponsorships'
      and column_name = 'dm_text'
  ) into has_dm_text;

  select exists(
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'sponsorships'
      and column_name = 'raw_dm'
  ) into has_raw_dm;

  if has_dm_text and not has_raw_dm then
    -- dm_text 만 있음 → raw_dm 으로 rename
    execute 'alter table sponsorships rename column dm_text to raw_dm';
  elsif has_dm_text and has_raw_dm then
    -- 둘 다 있음 → dm_text 의 NOT NULL 해제 + default ''
    execute 'alter table sponsorships alter column dm_text drop not null';
    execute 'alter table sponsorships alter column dm_text set default ''''';
  end if;
end $$;

-- raw_dm 컬럼이 없는 환경 대비 (rename 못한 경우 등) — 없으면 만듦
alter table sponsorships add column if not exists raw_dm text not null default '';

-- PostgREST 스키마 캐시 강제 리로드
notify pgrst, 'reload schema';
