#!/usr/bin/env python3
"""
تعديل: تسجيل كل إشعار (webhook) يوصل من AdsGram بقاعدة البيانات
----------------------------------------------------------------
الهدف: تقدر تعرف هل AdsGram أصلاً أرسلت إشعار المكافأة لمستخدم
معين أو لا، بدون ما تحتاج توصل للوگز الكاملة بـ Dokploy — فقط
استعلام SQL بسيط بـ Supabase.

شغّله من داخل مجلد SLY-main (نفس المستوى اللي فيه src/ و api/).
"""
import os
import shutil
import sys

if not os.path.isfile("api/auth/me.js"):
    print("❌ شغّل هذا السكربت من داخل مجلد SLY-main (لم أجد api/auth/me.js هنا).")
    sys.exit(1)

TARGET = "api/auth/me.js"

OLD = """    const telegramId =
      req.query.userid

    if (!telegramId) {
      return res.status(400).json({
        success: false,
        error: 'Missing userid',
      })
    }

    try {"""

NEW = """    const telegramId =
      req.query.userid

    if (!telegramId) {
      return res.status(400).json({
        success: false,
        error: 'Missing userid',
      })
    }

    // سجل كل نبضة (webhook) توصل من AdsGram بجدول خاص، بغض النظر
    // شنو راح يصير بعدها. هذا يخلينا نتأكد بسهولة (عبر استعلام SQL
    // بسيط بدل ما نحتاج لوگز Dokploy) هل AdsGram فعلاً أرسلت
    // إشعار المكافأة لمستخدم معين أو لا.
    try {
      const safeQuery = { ...req.query }
      delete safeQuery.secret

      await supabase
        .from('adsgram_reward_log')
        .insert({
          telegram_id: telegramId,
          query: safeQuery,
        })
    } catch (logErr) {
      console.error(
        'adsgram_reward_log insert failed:',
        logErr
      )
    }

    try {"""

shutil.copyfile(TARGET, TARGET + ".bak2")

with open(TARGET, "r", encoding="utf-8") as fh:
    content = fh.read()

if OLD not in content:
    print("⚠️  لم يتم العثور على النص المتوقع بـ api/auth/me.js.")
    print("    يحتمل أنك طبّقت هذا التعديل قبل هيك، أو الملف تغيّر يدويًا.")
    sys.exit(1)

content = content.replace(OLD, NEW, 1)

with open(TARGET, "w", encoding="utf-8") as fh:
    fh.write(content)

print("✅ تم تعديل api/auth/me.js")
print("\nلا تنسى: أنشئ الجدول التالي بـ Supabase (SQL Editor) قبل النشر:")
print("""
create table if not exists adsgram_reward_log (
  id bigint generated always as identity primary key,
  telegram_id text not null,
  query jsonb,
  created_at timestamptz not null default now()
);
""")
