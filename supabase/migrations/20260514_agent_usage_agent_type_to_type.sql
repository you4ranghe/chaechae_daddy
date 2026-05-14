-- ────────────────────────────────────────────────────────────
-- 안전망: 일부 환경의 agent_usage 테이블에 옛 컬럼명 agent_type (NOT NULL)
-- 이 남아있어, 코드가 type 에만 insert 하면
-- "null value in column 'agent_type' violates not-null constraint" (23502) 발생.
-- → agent_type 만 있는 경우: type 으로 rename
-- → 둘 다 있는 경우: agent_type 의 NOT NULL 해제 + default 부여
-- → 어느 쪽도 없는 경우: type 새로 추가
-- ────────────────────────────────────────────────────────────

do $$
declare
  has_agent_type boolean;
  has_type boolean;
begin
  select exists(
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'agent_usage'
      and column_name = 'agent_type'
  ) into has_agent_type;

  select exists(
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'agent_usage'
      and column_name = 'type'
  ) into has_type;

  if has_agent_type and not has_type then
    execute 'alter table agent_usage rename column agent_type to type';
  elsif has_agent_type and has_type then
    execute 'alter table agent_usage alter column agent_type drop not null';
    execute 'alter table agent_usage alter column agent_type set default ''sponsorship_analysis''';
  end if;
end $$;

-- type 컬럼이 없는 환경 대비
alter table agent_usage add column if not exists type text not null default 'sponsorship_analysis';

-- type 값 정규화
update agent_usage
  set type = 'sponsorship_analysis'
  where type is null or type not in ('sponsorship_analysis', 'content_generation');

-- PostgREST 스키마 캐시 강제 리로드
notify pgrst, 'reload schema';
