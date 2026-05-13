-- ────────────────────────────────────────────────────────────
-- 에이전트 실행 결과 히스토리: 주간 분석 / 해시태그 / 콘텐츠 플랜
-- (협찬 콘텐츠는 generated_contents 테이블에 이미 저장됨)
-- ────────────────────────────────────────────────────────────

-- ── 1. 주간 성과 분석 ──────────────────────────────────────
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

create policy "본인 분석 리포트 조회"
  on analytics_reports for select using (auth.uid() = user_id);
create policy "본인 분석 리포트 생성"
  on analytics_reports for insert with check (auth.uid() = user_id);
create policy "본인 분석 리포트 삭제"
  on analytics_reports for delete using (auth.uid() = user_id);

create index if not exists idx_analytics_reports_user_created
  on analytics_reports (user_id, created_at desc);

-- ── 2. 해시태그 분석 ───────────────────────────────────────
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

create policy "본인 해시태그 분석 조회"
  on hashtag_analyses for select using (auth.uid() = user_id);
create policy "본인 해시태그 분석 생성"
  on hashtag_analyses for insert with check (auth.uid() = user_id);
create policy "본인 해시태그 분석 삭제"
  on hashtag_analyses for delete using (auth.uid() = user_id);

create index if not exists idx_hashtag_analyses_user_created
  on hashtag_analyses (user_id, created_at desc);

-- ── 3. 주간 콘텐츠 플랜 ────────────────────────────────────
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

create policy "본인 콘텐츠 플랜 조회"
  on content_plans for select using (auth.uid() = user_id);
create policy "본인 콘텐츠 플랜 생성"
  on content_plans for insert with check (auth.uid() = user_id);
create policy "본인 콘텐츠 플랜 삭제"
  on content_plans for delete using (auth.uid() = user_id);

create index if not exists idx_content_plans_user_created
  on content_plans (user_id, created_at desc);
