-- AdsGram Reward URL: one-time server intents for exchange and admin-created ad tasks.
alter table public.players
  add column if not exists exchange_ad_intent boolean not null default false,
  add column if not exists exchange_ad_amount integer,
  add column if not exists exchange_ad_verified_at timestamptz,
  add column if not exists reward_task_id text,
  add column if not exists reward_task_started_at timestamptz,
  add column if not exists reward_task_verified_at timestamptz;
