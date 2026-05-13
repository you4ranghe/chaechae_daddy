-- Phase 2.1에서 추가됐지만 마이그레이션 파일이 빠져 있던 컬럼들
-- (schema.sql에는 있지만 기존 DB에는 없는 컬럼)

alter table profiles add column if not exists instagram_handle text not null default '';
alter table profiles add column if not exists follower_count integer not null default 0;
alter table profiles add column if not exists categories text[] not null default '{}';
