-- Stripe 결제 연동을 위한 컬럼 추가
alter table profiles add column if not exists stripe_customer_id text;
alter table profiles add column if not exists stripe_subscription_id text;

-- Stripe customer ID로 빠르게 조회하기 위한 인덱스
create unique index if not exists idx_profiles_stripe_customer
  on profiles (stripe_customer_id) where stripe_customer_id is not null;
