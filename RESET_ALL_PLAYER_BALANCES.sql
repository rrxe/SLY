-- SLY: تصفير أرصدة كل اللاعبين.
-- تصفير الرصيد الحالي فقط؛ لا يحذف سجل السحوبات أو coin_ledger.
-- يُحفظ snapshot قبل كل تنفيذ في جدول النسخ الاحتياطية.
-- لا تشغّل الملف إلا عندما تريد فعلاً تصفير جميع اللاعبين.

begin;

create table if not exists public.sly_player_balance_backup_20261121 as
select telegram_id, coin, usdt_balance, now() as backed_up_at
from public.players
with no data;

insert into public.sly_player_balance_backup_20261121
  (telegram_id, coin, usdt_balance, backed_up_at)
select telegram_id, coin, usdt_balance, now()
from public.players;

update public.players
set coin = 0,
    usdt_balance = 0;

commit;

-- بعد التنفيذ، يجب أن تكون قيم coin و usdt_balance لجميع اللاعبين = 0.
-- النسخ محفوظة في public.sly_player_balance_backup_20261121.
