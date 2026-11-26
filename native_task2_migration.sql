-- بلوك AdsGram Task الثاني (task-51800) على نفس Reward URL.
alter table players
  add column if not exists native_task2_ad_verified_at timestamptz,
  add column if not exists native_task2_armed_at timestamptz;
