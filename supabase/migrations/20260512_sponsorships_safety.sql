-- ────────────────────────────────────────────────────────────
-- 안전망: schema.sql 정의대로 sponsorships 테이블 컬럼이 모두 있는지 보장
-- (초기 마이그레이션 이력이 일부 환경에 안 적용되어
--  "Could not find the 'analysis' column" 같은 PGRST204 발생 사례 대응)
-- ────────────────────────────────────────────────────────────

-- 테이블 자체가 없으면 만든다
create table if not exists sponsorships (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  brand_name text not null,
  product text not null default '',
  status text not null default 'pending',
  raw_dm text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 누락된 컬럼 보강
alter table sponsorships add column if not exists analysis jsonb;
alter table sponsorships add column if not exists checklist jsonb;
alter table sponsorships add column if not exists payment_amount integer not null default 0;
alter table sponsorships add column if not exists deadline text;

-- status check 제약이 없을 수 있으니 add (있으면 무시)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'sponsorships_status_check'
  ) then
    alter table sponsorships add constraint sponsorships_status_check
      check (status in ('analyzing', 'pending', 'accepted', 'rejected', 'completed'));
  end if;
end $$;

-- RLS / 정책이 없으면 생성
alter table sponsorships enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'sponsorships' and policyname = '유저는 자신의 협찬만 조회 가능'
  ) then
    create policy "유저는 자신의 협찬만 조회 가능"
      on sponsorships for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'sponsorships' and policyname = '유저는 자신의 협찬만 생성 가능'
  ) then
    create policy "유저는 자신의 협찬만 생성 가능"
      on sponsorships for insert with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'sponsorships' and policyname = '유저는 자신의 협찬만 수정 가능'
  ) then
    create policy "유저는 자신의 협찬만 수정 가능"
      on sponsorships for update using (auth.uid() = user_id);
  end if;
end $$;

-- 인덱스
create index if not exists idx_sponsorships_user_status
  on sponsorships (user_id, status);
create index if not exists idx_sponsorships_user_created
  on sponsorships (user_id, created_at desc);

-- PostgREST 스키마 캐시 강제 리로드 (PGRST204 회피)
notify pgrst, 'reload schema';
