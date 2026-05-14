-- ────────────────────────────────────────────────────────────
-- 안전망: 일부 환경에 agent_usage 테이블/컬럼이 누락되어 있어
-- recordUsage() 의 insert 가 silently 실패 → dashboard / usage 페이지에서
-- 차감 카운트가 0 으로 고정되는 현상 대응.
-- 모든 명령은 idempotent (반복 실행 안전).
-- ────────────────────────────────────────────────────────────

create table if not exists agent_usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  type text not null,
  sponsorship_id uuid references sponsorships on delete set null,
  tokens_used integer not null default 0,
  model text not null default '',
  created_at timestamptz default now()
);

-- 누락된 컬럼 보강 (기존 테이블이 있는 경우)
-- type 컬럼이 없는 환경 대응 → 기본값 'sponsorship_analysis' 로 backfill
alter table agent_usage add column if not exists type text not null default 'sponsorship_analysis';
alter table agent_usage add column if not exists sponsorship_id uuid references sponsorships on delete set null;
alter table agent_usage add column if not exists tokens_used integer not null default 0;
alter table agent_usage add column if not exists model text not null default '';
alter table agent_usage add column if not exists created_at timestamptz default now();

-- type 값이 잘못된 게 있으면 (NULL 또는 비허용 값) 'sponsorship_analysis' 로 정규화
update agent_usage
  set type = 'sponsorship_analysis'
  where type is null or type not in ('sponsorship_analysis', 'content_generation');

-- type check 제약 (없으면 추가)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'agent_usage_type_check'
  ) then
    alter table agent_usage add constraint agent_usage_type_check
      check (type in ('sponsorship_analysis', 'content_generation'));
  end if;
end $$;

-- RLS
alter table agent_usage enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'agent_usage'
      and policyname = '유저는 자신의 사용량만 조회 가능'
  ) then
    create policy "유저는 자신의 사용량만 조회 가능"
      on agent_usage for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'agent_usage'
      and policyname = '유저는 자신의 사용량만 생성 가능'
  ) then
    create policy "유저는 자신의 사용량만 생성 가능"
      on agent_usage for insert with check (auth.uid() = user_id);
  end if;
end $$;

-- 인덱스
create index if not exists idx_agent_usage_user_created
  on agent_usage (user_id, created_at);
create index if not exists idx_agent_usage_user_type_created
  on agent_usage (user_id, type, created_at);

-- PostgREST 스키마 캐시 리로드
notify pgrst, 'reload schema';
