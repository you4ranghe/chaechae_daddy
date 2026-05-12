-- ────────────────────────────────────────────────────────────
-- Phase 3: 인스타 연동 / DM 웹훅 / 팀 / 피드백 루프
-- ────────────────────────────────────────────────────────────

-- ── 1. 인스타그램 연결 (OAuth 토큰 저장) ───────────────────
create table if not exists instagram_connections (
  user_id uuid references auth.users on delete cascade primary key,
  ig_user_id text not null,
  ig_username text not null default '',
  access_token text not null,
  token_expires_at timestamptz,
  -- Meta Business Account ID (Page에 연결된 IG Business Account)
  page_id text,
  scopes text[] not null default '{}',
  last_synced_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table instagram_connections enable row level security;

create policy "본인 인스타 연결만 조회"
  on instagram_connections for select using (auth.uid() = user_id);

-- ── 2. 인스타그램 인사이트 (자동 수집) ─────────────────────
create table if not exists instagram_insights (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  -- 단일 시점 스냅샷
  follower_count integer not null default 0,
  follows_count integer not null default 0,
  media_count integer not null default 0,
  -- 최근 30일 합산
  total_impressions integer not null default 0,
  total_reach integer not null default 0,
  profile_views integer not null default 0,
  -- 수집 시점
  snapshot_at timestamptz default now()
);

alter table instagram_insights enable row level security;

create policy "본인 인사이트만 조회"
  on instagram_insights for select using (auth.uid() = user_id);

create index if not exists idx_instagram_insights_user_snapshot
  on instagram_insights (user_id, snapshot_at desc);

-- ── 3. 처리된 DM 추적 (웹훅 dedupe) ────────────────────────
create table if not exists processed_dms (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  ig_message_id text not null,
  sponsorship_id uuid references sponsorships on delete set null,
  processed_at timestamptz default now(),
  unique (user_id, ig_message_id)
);

alter table processed_dms enable row level security;

create policy "본인 DM 처리 기록만 조회"
  on processed_dms for select using (auth.uid() = user_id);

-- ── 4. 포스팅 성과 (피드백 루프) ───────────────────────────
create table if not exists post_performance (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  sponsorship_id uuid references sponsorships on delete cascade,
  generated_content_id uuid references generated_contents on delete set null,
  -- 인스타에서 가져왔거나 사용자가 입력한 데이터
  ig_media_id text,
  posted_at timestamptz,
  likes integer not null default 0,
  comments integer not null default 0,
  reach integer not null default 0,
  impressions integer not null default 0,
  saves integer not null default 0,
  -- 사용자가 직접 남긴 메모 (다음 콘텐츠 개선에 반영)
  user_notes text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table post_performance enable row level security;

create policy "본인 성과만 조회"
  on post_performance for select using (auth.uid() = user_id);
create policy "본인 성과만 생성"
  on post_performance for insert with check (auth.uid() = user_id);
create policy "본인 성과만 수정"
  on post_performance for update using (auth.uid() = user_id);

create index if not exists idx_post_performance_user_posted
  on post_performance (user_id, posted_at desc);
create index if not exists idx_post_performance_sponsorship
  on post_performance (sponsorship_id);

-- ── 5. 팀 기능 ────────────────────────────────────────────
create table if not exists teams (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  owner_id uuid references auth.users on delete cascade not null,
  created_at timestamptz default now()
);

create table if not exists team_members (
  team_id uuid references teams on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  role text not null check (role in ('owner', 'manager', 'influencer')),
  invited_email text,
  joined_at timestamptz default now(),
  primary key (team_id, user_id)
);

alter table teams enable row level security;
alter table team_members enable row level security;

-- 소속된 팀만 조회
create policy "내가 속한 팀 조회"
  on teams for select using (
    exists (
      select 1 from team_members
      where team_members.team_id = teams.id
        and team_members.user_id = auth.uid()
    )
  );

create policy "팀 owner는 팀 수정 가능"
  on teams for update using (owner_id = auth.uid());

create policy "본인 팀 멤버십 조회"
  on team_members for select using (
    user_id = auth.uid()
    or exists (
      select 1 from team_members tm
      where tm.team_id = team_members.team_id
        and tm.user_id = auth.uid()
        and tm.role in ('owner', 'manager')
    )
  );

create index if not exists idx_team_members_user
  on team_members (user_id);

-- 팀 초대 (이메일 기준)
create table if not exists team_invitations (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references teams on delete cascade not null,
  invited_email text not null,
  role text not null check (role in ('manager', 'influencer')),
  invited_by uuid references auth.users on delete cascade not null,
  accepted_at timestamptz,
  created_at timestamptz default now(),
  unique (team_id, invited_email)
);

alter table team_invitations enable row level security;

create policy "초대받은 사람 또는 팀 관리자가 초대 조회"
  on team_invitations for select using (
    invited_email = (select email from auth.users where id = auth.uid())
    or exists (
      select 1 from team_members
      where team_members.team_id = team_invitations.team_id
        and team_members.user_id = auth.uid()
        and team_members.role in ('owner', 'manager')
    )
  );

create index if not exists idx_team_invitations_email
  on team_invitations (invited_email);
