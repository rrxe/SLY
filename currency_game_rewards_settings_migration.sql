-- SLY: قابلية تعديل أسعار التحويل ومكافآت الألعاب من لوحة الأدمن.
-- شغّل هذا الملف مرة واحدة في Supabase SQL Editor قبل نشر نسخة التطبيق.

insert into public.app_settings (key, value, updated_at)
values
  ('referral_bonus_tier1_referrals', '10', now()),
  ('referral_bonus_tier1_percent', '50', now()),
  ('referral_bonus_tier2_referrals', '20', now()),
  ('referral_bonus_tier2_percent', '100', now()),
  ('referral_bonus_days', '7', now()),
  ('coins_per_usdt', '1000', now()),
  ('minimum_exchange_coins', '1000', now()),
  ('laser_easy_reward_coins', '250', now()),
  ('laser_normal_reward_coins', '500', now()),
  ('laser_hard_reward_coins', '750', now()),
  ('comet_run_score_step', '500', now()),
  ('comet_run_coins_per_step', '300', now()),
  ('daily_checkin_reward_coins', '250', now()),
  ('native_task_ad_reward_coins', '10', now()),
  ('native_task2_ad_reward_coins', '10', now())
on conflict (key) do nothing;

-- نخزّن قيمة الجائزة وإعدادات Comet Run وقت بدء الجولة،
-- كي لا يتغير حساب جولة بدأت إذا عدّل الأدمن الأسعار أثناء اللعب.
alter table public.players
  add column if not exists game_run_reward_coins bigint,
  add column if not exists game_run_score_step integer,
  add column if not exists game_run_coins_per_step integer;
