-- شغّل هذا الملف مرة واحدة في Supabase SQL Editor قبل نشر النسخة الجديدة.
alter table players
  add column if not exists game_run_mode text not null default 'comet_run',
  add column if not exists game_run_difficulty text;
