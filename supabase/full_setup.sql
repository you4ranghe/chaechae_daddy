-- ════════════════════════════════════════════════════════════
-- CW Agent · DB 통합 셋업 스크립트
-- ────────────────────────────────────────────────────────────
-- 이 파일 하나만 Supabase SQL Editor 에서 실행하면
--   ① 새 DB 도 전부 세팅되고
--   ② 일부 컬럼/이름이 빠진 기존 DB 도 안전하게 보강됨
-- 모든 명령은 idempotent — 여러 번 실행해도 OK
-- ════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════
-- 1. profiles  (유저 프로필 · Auth users 확장)
-- ════════════════════════════════════════════════════════════

create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  instagram_handle text not null default '',
  follower_count integer not null default 0,
  categories text[] not null default '{}',
  plan text not null default 'free_trial',
  stripe_customer_id text,
  stripe_subscription_id text,
  trial_ends_at timestamptz default (now() + interval '7 days'),
  email_notifications jsonb not null default '{"trial_reminder": true, "analysis_complete": true}'::jsonb,
  trial_reminder_3day_sent_at timestamptz,
  trial_reminder_1day_sent_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 누락 컬럼 보강 (기존 DB 에서 일부만 존재하는 경우 대비)
alter table profiles add column if not exists instagram_handle text not null default '';
alter table profiles add column if not exists follower_count integer not null default 0;
alter table profiles add column if not exists categories text[] not null default '{}';
alter table profiles add column if not exists stripe_customer_id text;
alter table profiles add column if not exists stripe_subscription_id text;
alter table profiles add column if not exists email_notifications jsonb
  not null default '{"trial_reminder": true, "analysis_complete": true}'::jsonb;
alter table profiles add column if not exists trial_reminder_3day_sent_at timestamptz;
alter table profiles add column if not exists trial_reminder_1day_sent_at timestamptz;

-- 아이 정보 (선택사항). AI 에이전트의 시스템 프롬프트에 활용.
-- 구조: {
--   "name": "채채",
--   "birth_date": "2024-05-12",         -- YYYY-MM-DD, 분석 시 현재 - birth_date로 개월수 자동 계산
--   "gender": "female" | "male" | "other",
--   "height_cm": 65,                     -- nullable
--   "weight_kg": 7.2,                    -- nullable
--   "notes": "이유식 시작",                  -- nullable, 알레르기/특이사항
--   "measurements_updated_at": "..."     -- ISO timestamp, 30일 이상 지나면 height/weight를 프롬프트에서 제외
-- }
alter table profiles add column if not exists child_info jsonb;

-- 인플루언서 자기소개 / 선호하는 AI 답변 톤 (선택사항).
alter table profiles add column if not exists persona_bio text;

-- 신규 가입 시 자동으로 profiles row 생성
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- RLS
alter table profiles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profiles'
      and policyname='유저는 자신의 프로필만 조회 가능'
  ) then
    create policy "유저는 자신의 프로필만 조회 가능"
      on profiles for select using (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profiles'
      and policyname='유저는 자신의 프로필만 수정 가능'
  ) then
    create policy "유저는 자신의 프로필만 수정 가능"
      on profiles for update using (auth.uid() = id);
  end if;
end $$;

-- 인덱스
create unique index if not exists idx_profiles_stripe_customer
  on profiles (stripe_customer_id) where stripe_customer_id is not null;
create index if not exists idx_profiles_trial_ending
  on profiles (trial_ends_at) where plan = 'free_trial';


-- ════════════════════════════════════════════════════════════
-- 2. sponsorships  (협찬 본체)
-- ════════════════════════════════════════════════════════════

create table if not exists sponsorships (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  brand_name text not null,
  product text not null default '',
  status text not null default 'pending',
  raw_dm text not null default '',
  analysis jsonb,
  checklist jsonb,
  payment_amount integer not null default 0,
  deadline text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 누락 컬럼 보강
alter table sponsorships add column if not exists product text not null default '';
alter table sponsorships add column if not exists analysis jsonb;
alter table sponsorships add column if not exists checklist jsonb;
alter table sponsorships add column if not exists payment_amount integer not null default 0;
alter table sponsorships add column if not exists deadline text;

-- ▼ 옛 컬럼명 dm_text → raw_dm 마이그레이션
do $$
declare
  has_dm_text boolean;
  has_raw_dm boolean;
begin
  select exists(
    select 1 from information_schema.columns
    where table_schema='public' and table_name='sponsorships' and column_name='dm_text'
  ) into has_dm_text;

  select exists(
    select 1 from information_schema.columns
    where table_schema='public' and table_name='sponsorships' and column_name='raw_dm'
  ) into has_raw_dm;

  if has_dm_text and not has_raw_dm then
    execute 'alter table sponsorships rename column dm_text to raw_dm';
  elsif has_dm_text and has_raw_dm then
    execute 'alter table sponsorships alter column dm_text drop not null';
    execute 'alter table sponsorships alter column dm_text set default ''''';
  end if;
end $$;

alter table sponsorships add column if not exists raw_dm text not null default '';

-- status check 제약
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname='sponsorships_status_check'
  ) then
    alter table sponsorships add constraint sponsorships_status_check
      check (status in ('analyzing','pending','accepted','rejected','completed'));
  end if;
end $$;

-- RLS
alter table sponsorships enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='sponsorships' and policyname='유저는 자신의 협찬만 조회 가능') then
    create policy "유저는 자신의 협찬만 조회 가능"
      on sponsorships for select using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='sponsorships' and policyname='유저는 자신의 협찬만 생성 가능') then
    create policy "유저는 자신의 협찬만 생성 가능"
      on sponsorships for insert with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='sponsorships' and policyname='유저는 자신의 협찬만 수정 가능') then
    create policy "유저는 자신의 협찬만 수정 가능"
      on sponsorships for update using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists idx_sponsorships_user_status
  on sponsorships (user_id, status);
create index if not exists idx_sponsorships_user_created
  on sponsorships (user_id, created_at desc);


-- ════════════════════════════════════════════════════════════
-- 3. generated_contents  (협찬별 생성 콘텐츠 버전 관리)
-- ════════════════════════════════════════════════════════════

create table if not exists generated_contents (
  id uuid default gen_random_uuid() primary key,
  sponsorship_id uuid references sponsorships on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  caption text not null,
  hashtags jsonb not null default '[]',
  version integer not null default 1,
  created_at timestamptz default now()
);

alter table generated_contents enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='generated_contents' and policyname='유저는 자신의 콘텐츠만 조회 가능') then
    create policy "유저는 자신의 콘텐츠만 조회 가능"
      on generated_contents for select using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='generated_contents' and policyname='유저는 자신의 콘텐츠만 생성 가능') then
    create policy "유저는 자신의 콘텐츠만 생성 가능"
      on generated_contents for insert with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists idx_generated_contents_sponsorship
  on generated_contents (sponsorship_id, version desc);


-- ════════════════════════════════════════════════════════════
-- 4. agent_usage  (에이전트 사용량 — 플랜 차감 카운트)
-- ════════════════════════════════════════════════════════════

create table if not exists agent_usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  type text not null default 'sponsorship_analysis',
  sponsorship_id uuid references sponsorships on delete set null,
  tokens_used integer not null default 0,
  model text not null default '',
  created_at timestamptz default now()
);

-- ▼ 옛 컬럼명 agent_type → type 마이그레이션
do $$
declare
  has_agent_type boolean;
  has_type boolean;
begin
  select exists(
    select 1 from information_schema.columns
    where table_schema='public' and table_name='agent_usage' and column_name='agent_type'
  ) into has_agent_type;

  select exists(
    select 1 from information_schema.columns
    where table_schema='public' and table_name='agent_usage' and column_name='type'
  ) into has_type;

  if has_agent_type and not has_type then
    execute 'alter table agent_usage rename column agent_type to type';
  elsif has_agent_type and has_type then
    execute 'alter table agent_usage alter column agent_type drop not null';
    execute 'alter table agent_usage alter column agent_type set default ''sponsorship_analysis''';
  end if;
end $$;

-- 누락 컬럼 보강
alter table agent_usage add column if not exists type text not null default 'sponsorship_analysis';
alter table agent_usage add column if not exists sponsorship_id uuid references sponsorships on delete set null;
alter table agent_usage add column if not exists tokens_used integer not null default 0;
alter table agent_usage add column if not exists model text not null default '';
alter table agent_usage add column if not exists created_at timestamptz default now();

-- 값 정규화 후 check 제약
update agent_usage
  set type = 'sponsorship_analysis'
  where type is null or type not in ('sponsorship_analysis','content_generation');

do $$
begin
  if not exists (select 1 from pg_constraint where conname='agent_usage_type_check') then
    alter table agent_usage add constraint agent_usage_type_check
      check (type in ('sponsorship_analysis','content_generation'));
  end if;
end $$;

-- RLS
alter table agent_usage enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='agent_usage' and policyname='유저는 자신의 사용량만 조회 가능') then
    create policy "유저는 자신의 사용량만 조회 가능"
      on agent_usage for select using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='agent_usage' and policyname='유저는 자신의 사용량만 생성 가능') then
    create policy "유저는 자신의 사용량만 생성 가능"
      on agent_usage for insert with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists idx_agent_usage_user_created
  on agent_usage (user_id, created_at);
create index if not exists idx_agent_usage_user_type_created
  on agent_usage (user_id, type, created_at);


-- ════════════════════════════════════════════════════════════
-- 5. Instagram 연동
-- ════════════════════════════════════════════════════════════

create table if not exists instagram_connections (
  user_id uuid references auth.users on delete cascade primary key,
  ig_user_id text not null,
  ig_username text not null default '',
  access_token text not null,
  token_expires_at timestamptz,
  page_id text,
  scopes text[] not null default '{}',
  last_synced_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table instagram_connections enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='instagram_connections' and policyname='본인 인스타 연결만 조회') then
    create policy "본인 인스타 연결만 조회"
      on instagram_connections for select using (auth.uid() = user_id);
  end if;
end $$;

create table if not exists instagram_insights (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  follower_count integer not null default 0,
  follows_count integer not null default 0,
  media_count integer not null default 0,
  total_impressions integer not null default 0,
  total_reach integer not null default 0,
  profile_views integer not null default 0,
  snapshot_at timestamptz default now()
);

alter table instagram_insights enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='instagram_insights' and policyname='본인 인사이트만 조회') then
    create policy "본인 인사이트만 조회"
      on instagram_insights for select using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists idx_instagram_insights_user_snapshot
  on instagram_insights (user_id, snapshot_at desc);


-- ════════════════════════════════════════════════════════════
-- 6. processed_dms  (웹훅 중복 처리 방지)
-- ════════════════════════════════════════════════════════════

create table if not exists processed_dms (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  ig_message_id text not null,
  sponsorship_id uuid references sponsorships on delete set null,
  processed_at timestamptz default now(),
  unique (user_id, ig_message_id)
);

alter table processed_dms enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='processed_dms' and policyname='본인 DM 처리 기록만 조회') then
    create policy "본인 DM 처리 기록만 조회"
      on processed_dms for select using (auth.uid() = user_id);
  end if;
end $$;


-- ════════════════════════════════════════════════════════════
-- 7. post_performance  (피드백 루프)
-- ════════════════════════════════════════════════════════════

create table if not exists post_performance (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  sponsorship_id uuid references sponsorships on delete cascade,
  generated_content_id uuid references generated_contents on delete set null,
  ig_media_id text,
  posted_at timestamptz,
  likes integer not null default 0,
  comments integer not null default 0,
  reach integer not null default 0,
  impressions integer not null default 0,
  saves integer not null default 0,
  user_notes text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table post_performance enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='post_performance' and policyname='본인 성과만 조회') then
    create policy "본인 성과만 조회"
      on post_performance for select using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='post_performance' and policyname='본인 성과만 생성') then
    create policy "본인 성과만 생성"
      on post_performance for insert with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='post_performance' and policyname='본인 성과만 수정') then
    create policy "본인 성과만 수정"
      on post_performance for update using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists idx_post_performance_user_posted
  on post_performance (user_id, posted_at desc);
create index if not exists idx_post_performance_sponsorship
  on post_performance (sponsorship_id);


-- ════════════════════════════════════════════════════════════
-- 8. Teams (팀 기능)
-- ════════════════════════════════════════════════════════════

create table if not exists teams (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  owner_id uuid references auth.users on delete cascade not null,
  created_at timestamptz default now()
);

create table if not exists team_members (
  team_id uuid references teams on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  role text not null check (role in ('owner','manager','influencer')),
  invited_email text,
  joined_at timestamptz default now(),
  primary key (team_id, user_id)
);

create table if not exists team_invitations (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references teams on delete cascade not null,
  invited_email text not null,
  role text not null check (role in ('manager','influencer')),
  invited_by uuid references auth.users on delete cascade not null,
  accepted_at timestamptz,
  created_at timestamptz default now(),
  unique (team_id, invited_email)
);

alter table teams enable row level security;
alter table team_members enable row level security;
alter table team_invitations enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='teams' and policyname='내가 속한 팀 조회') then
    create policy "내가 속한 팀 조회"
      on teams for select using (
        exists (
          select 1 from team_members
          where team_members.team_id = teams.id
            and team_members.user_id = auth.uid()
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='teams' and policyname='팀 owner는 팀 수정 가능') then
    create policy "팀 owner는 팀 수정 가능"
      on teams for update using (owner_id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='team_members' and policyname='본인 팀 멤버십 조회') then
    create policy "본인 팀 멤버십 조회"
      on team_members for select using (
        user_id = auth.uid()
        or exists (
          select 1 from team_members tm
          where tm.team_id = team_members.team_id
            and tm.user_id = auth.uid()
            and tm.role in ('owner','manager')
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='team_invitations' and policyname='초대받은 사람 또는 팀 관리자가 초대 조회') then
    create policy "초대받은 사람 또는 팀 관리자가 초대 조회"
      on team_invitations for select using (
        invited_email = (select email from auth.users where id = auth.uid())
        or exists (
          select 1 from team_members
          where team_members.team_id = team_invitations.team_id
            and team_members.user_id = auth.uid()
            and team_members.role in ('owner','manager')
        )
      );
  end if;
end $$;

create index if not exists idx_team_members_user on team_members (user_id);
create index if not exists idx_team_invitations_email on team_invitations (invited_email);


-- ════════════════════════════════════════════════════════════
-- 9. AI 에이전트 결과물 히스토리
-- ════════════════════════════════════════════════════════════

-- 9.1 주간 성과 분석 리포트
create table if not exists analytics_reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  input jsonb not null,
  report jsonb not null,
  tokens_used integer not null default 0,
  model text not null default '',
  created_at timestamptz default now()
);

alter table analytics_reports enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='analytics_reports' and policyname='본인 분석 리포트 조회') then
    create policy "본인 분석 리포트 조회"
      on analytics_reports for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='analytics_reports' and policyname='본인 분석 리포트 생성') then
    create policy "본인 분석 리포트 생성"
      on analytics_reports for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='analytics_reports' and policyname='본인 분석 리포트 삭제') then
    create policy "본인 분석 리포트 삭제"
      on analytics_reports for delete using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists idx_analytics_reports_user_created
  on analytics_reports (user_id, created_at desc);

-- 9.2 해시태그 분석
create table if not exists hashtag_analyses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  category text not null,
  user_message text not null default '',
  analysis jsonb not null,
  tokens_used integer not null default 0,
  model text not null default '',
  created_at timestamptz default now()
);

alter table hashtag_analyses enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='hashtag_analyses' and policyname='본인 해시태그 분석 조회') then
    create policy "본인 해시태그 분석 조회"
      on hashtag_analyses for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='hashtag_analyses' and policyname='본인 해시태그 분석 생성') then
    create policy "본인 해시태그 분석 생성"
      on hashtag_analyses for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='hashtag_analyses' and policyname='본인 해시태그 분석 삭제') then
    create policy "본인 해시태그 분석 삭제"
      on hashtag_analyses for delete using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists idx_hashtag_analyses_user_created
  on hashtag_analyses (user_id, created_at desc);

-- 9.3 콘텐츠 플랜
create table if not exists content_plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  keywords text not null,
  plan jsonb not null,
  tokens_used integer not null default 0,
  model text not null default '',
  created_at timestamptz default now()
);

alter table content_plans enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='content_plans' and policyname='본인 콘텐츠 플랜 조회') then
    create policy "본인 콘텐츠 플랜 조회"
      on content_plans for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='content_plans' and policyname='본인 콘텐츠 플랜 생성') then
    create policy "본인 콘텐츠 플랜 생성"
      on content_plans for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='content_plans' and policyname='본인 콘텐츠 플랜 삭제') then
    create policy "본인 콘텐츠 플랜 삭제"
      on content_plans for delete using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists idx_content_plans_user_created
  on content_plans (user_id, created_at desc);


-- ════════════════════════════════════════════════════════════
-- 10. PostgREST 스키마 캐시 리로드 (PGRST204 회피)
-- ════════════════════════════════════════════════════════════

notify pgrst, 'reload schema';

-- ════════════════════════════════════════════════════════════
-- ✅ 완료
-- ════════════════════════════════════════════════════════════
