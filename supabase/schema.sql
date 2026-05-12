-- 유저 프로필 (Supabase Auth의 users 테이블 확장)
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

-- 새 유저 가입 시 자동으로 프로필 생성
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

alter table profiles enable row level security;

create policy "유저는 자신의 프로필만 조회 가능"
  on profiles for select using (auth.uid() = id);

create policy "유저는 자신의 프로필만 수정 가능"
  on profiles for update using (auth.uid() = id);

-- 협찬 테이블
create table if not exists sponsorships (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  brand_name text not null,
  product text not null default '',
  status text not null default 'pending'
    check (status in ('analyzing', 'pending', 'accepted', 'rejected', 'completed')),
  raw_dm text not null,
  analysis jsonb,
  checklist jsonb,
  payment_amount integer not null default 0,
  deadline text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table sponsorships enable row level security;

create policy "유저는 자신의 협찬만 조회 가능"
  on sponsorships for select using (auth.uid() = user_id);

create policy "유저는 자신의 협찬만 생성 가능"
  on sponsorships for insert with check (auth.uid() = user_id);

create policy "유저는 자신의 협찬만 수정 가능"
  on sponsorships for update using (auth.uid() = user_id);

-- 생성된 콘텐츠 테이블 (협찬별 여러 버전 가능)
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

create policy "유저는 자신의 콘텐츠만 조회 가능"
  on generated_contents for select using (auth.uid() = user_id);

create policy "유저는 자신의 콘텐츠만 생성 가능"
  on generated_contents for insert with check (auth.uid() = user_id);

-- 에이전트 사용량 테이블
create table if not exists agent_usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  type text not null
    check (type in ('sponsorship_analysis', 'content_generation')),
  sponsorship_id uuid references sponsorships on delete set null,
  tokens_used integer not null default 0,
  model text not null default '',
  created_at timestamptz default now()
);

alter table agent_usage enable row level security;

create policy "유저는 자신의 사용량만 조회 가능"
  on agent_usage for select using (auth.uid() = user_id);

create policy "유저는 자신의 사용량만 생성 가능"
  on agent_usage for insert with check (auth.uid() = user_id);

-- 인덱스
create index if not exists idx_sponsorships_user_status
  on sponsorships (user_id, status);
create index if not exists idx_sponsorships_user_created
  on sponsorships (user_id, created_at desc);
create index if not exists idx_generated_contents_sponsorship
  on generated_contents (sponsorship_id, version desc);
create index if not exists idx_agent_usage_user_created
  on agent_usage (user_id, created_at);
create index if not exists idx_agent_usage_user_type_created
  on agent_usage (user_id, type, created_at);
