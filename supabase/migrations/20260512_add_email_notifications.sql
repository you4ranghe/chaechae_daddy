-- 이메일 알림 설정 + 트라이얼 만료 알림 중복 발송 방지 플래그
alter table profiles add column if not exists email_notifications jsonb
  not null default '{"trial_reminder": true, "analysis_complete": true}'::jsonb;

alter table profiles add column if not exists trial_reminder_3day_sent_at timestamptz;
alter table profiles add column if not exists trial_reminder_1day_sent_at timestamptz;

-- 트라이얼 종료일 기준으로 만료 임박 유저를 빠르게 찾기 위한 부분 인덱스
create index if not exists idx_profiles_trial_ending
  on profiles (trial_ends_at)
  where plan = 'free_trial';
