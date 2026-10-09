import { supabase } from './supabase.js'
import { getAppSettings } from './settings.js'

// ============================================================
// إشعارات البوت
//
// 1) "تعدينك جاهز": رسالة وحدة لكل دورة تعدين (تتخزن بـ notify_ready_for).
// 2) تذكير كل 5 ساعات (NOTIFY_REMINDER_HOURS) للاعب اللي ما فتح التطبيق:
//      - لو تعدينه خلص ولسا ما استلم  -> تذكير "استلم"
//      - لو ما عنده تعدين شغال        -> تذكير "ابدأ تعدين جديد"
//      - لو تعدينه شغال ولسا ما خلص    -> ما نرسل (رسالة "جاهز" بتوصله)
//    يتوقف التذكير بعد NOTIFY_MAX_REMINDERS رسائل ورا بعض بدون ما يفتح
//    التطبيق (0 = بدون حد). أول ما يفتح التطبيق العدّاد يتصفّر (من me.js).
// 3) كل رسالة "تُحجز" بقاعدة البيانات أولاً بتحديث مشروط (compare-and-swap)
//    وبعدها تُرسل، فحتى لو اشتغل أكثر من سيرفر ما ينرسل نفس الشي مرتين.
// 4) اللي حظر البوت (403) نعلّمه bot_blocked ونوقف الإرسال له.
//    (me.js يفك العلامة أول ما يفتح التطبيق مرة ثانية.)
// 5) فشل مؤقت (شبكة / 429 / 5xx): نفك الحجز ونوقف الدورة الحالية.
//
// لغة الرسالة:
//   اللغة اللي اختارها اللاعب داخل التطبيق (app_language) ← لغة تيليجرام
//   (language_code) ← لو غير معروفة أو غير عربي/إنجليزي: عربي + إنجليزي مع بعض.
//   NOTIFY_LANG_MODE=both يجبر الرسائل تكون دايماً عربي + إنجليزي.
// ============================================================

const TICK_MS = 60 * 1000
const FIRST_TICK_DELAY_MS = 30 * 1000
const PAGE_SIZE = 1000
const SEND_INTERVAL_MS = 40 // ~25 رسالة/ثانية، تحت حد تيليجرام (~30/ثانية)
const REQUEST_TIMEOUT_MS = 10000
const MAX_SENDS_PER_PHASE = 3000 // حماية: لا نبقى بالدورة الواحدة للأبد

const HOUR_MS = 60 * 60 * 1000

function envNumber(name, fallback) {
  const raw = process.env[name]
  if (raw === undefined || raw === '') return fallback
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

const REMINDER_INTERVAL_MS =
  Math.max(0.1, envNumber('NOTIFY_REMINDER_HOURS', 5)) * HOUR_MS

// أقصى عدد تذكيرات ورا بعض بدون ما يفتح اللاعب التطبيق (0 = بدون حد)
const MAX_REMINDERS = Math.trunc(envNumber('NOTIFY_MAX_REMINDERS', 12))

// ما نلاحق لاعبين غايبين من أكثر من هالمدة (أيام)
const REMINDER_LOOKBACK_MS =
  Math.max(1, envNumber('NOTIFY_LOOKBACK_DAYS', 14)) * 24 * HOUR_MS

// ما نلاحق دورات تعدين انتهت من أكثر من 7 أيام
const READY_LOOKBACK_MS = 7 * 24 * HOUR_MS

const LANG_MODE = String(process.env.NOTIFY_LANG_MODE || 'auto').toLowerCase()

const PLAYER_COLUMNS =
  'telegram_id, mining_active, mining_started_at, language_code, app_language, notify_ready_for, notify_last_reminder_at, notify_reminder_count'

const SEPARATOR = '━━━━━━━━━━━━'

// ---------------------------------------------------------------
// النصوص (HTML). كل نوع إله نسخة عربي ونسخة إنجليزي.
// ---------------------------------------------------------------
function fmtCoins(n) {
  return Number(n || 0).toLocaleString('en-US')
}

const TEXTS = {
  ready: {
    ar: (c) =>
      `⛏️ <b>تعدينك جاهز!</b>\n\n` +
      `💰 اكتملت دورة التعدين وأرباحك بانتظارك.\n` +
      `🎁 المكافأة: <b>${fmtCoins(c.reward)}</b> عملة\n\n` +
      `⏳ لا تخلي أرباحك تنتظر، افتح التطبيق الآن واستلمها، ثم ابدأ دورة جديدة لتواصل الجمع 🚀`,
    en: (c) =>
      `⛏️ <b>Your mining is ready!</b>\n\n` +
      `💰 Your mining cycle is complete and your rewards are waiting.\n` +
      `🎁 Reward: <b>${fmtCoins(c.reward)}</b> coins\n\n` +
      `⏳ Don't leave your earnings waiting. Open the app now, claim them, then start a new cycle to keep earning 🚀`,
  },
  claim: [
    {
      ar: (c) =>
        `⏰ <b>أرباحك ما زالت بانتظارك!</b>\n\n` +
        `💰 تعدينك خلص وفيه <b>${fmtCoins(c.reward)}</b> عملة جاهزة للاستلام.\n\n` +
        `👇 افتح التطبيق الآن واستلمها قبل لا تتأخر.`,
      en: (c) =>
        `⏰ <b>Your rewards are still waiting!</b>\n\n` +
        `💰 Your mining is done and <b>${fmtCoins(c.reward)}</b> coins are ready to claim.\n\n` +
        `👇 Open the app now and claim them.`,
    },
    {
      ar: (c) =>
        `🔔 <b>تذكير: التعدين جاهز للاستلام</b>\n\n` +
        `كل ساعة تمر بدون استلام تعني تعدين متوقف. استلم <b>${fmtCoins(c.reward)}</b> عملة وابدأ دورة جديدة 🚀`,
      en: (c) =>
        `🔔 <b>Reminder: your mining is ready to claim</b>\n\n` +
        `Every hour without claiming is mining time lost. Claim your <b>${fmtCoins(c.reward)}</b> coins and start a new cycle 🚀`,
    },
  ],
  start: [
    {
      ar: (c) =>
        `👋 <b>وينك؟ اشتقنا لك!</b>\n\n` +
        `⛏️ تعدينك متوقف حالياً، وكل ساعة بدون تعدين هي أرباح ضايعة.\n` +
        `💰 ابدأ دورة جديدة واجمع <b>${fmtCoins(c.reward)}</b> عملة.\n\n` +
        `👇 افتح التطبيق وابدأ الآن.`,
      en: (c) =>
        `👋 <b>We miss you!</b>\n\n` +
        `⛏️ Your mining is paused, and every hour without mining is lost earnings.\n` +
        `💰 Start a new cycle and earn <b>${fmtCoins(c.reward)}</b> coins.\n\n` +
        `👇 Open the app and start now.`,
    },
    {
      ar: (c) =>
        `🚀 <b>جاهز لدورة تعدين جديدة؟</b>\n\n` +
        `مكافأتك الجاهزة: <b>${fmtCoins(c.reward)}</b> عملة بانتظار أن تبدأ.\n` +
        `ادخل التطبيق، شغّل التعدين وخلّيه يشتغل عنك 💎`,
      en: (c) =>
        `🚀 <b>Ready for a new mining cycle?</b>\n\n` +
        `<b>${fmtCoins(c.reward)}</b> coins are waiting for you to begin.\n` +
        `Open the app, start mining and let it work for you 💎`,
    },
  ],
}

const BUTTON = {
  ar: 'افتح التطبيق 🚀',
  en: 'Open app 🚀',
  both: 'افتح التطبيق | Open app 🚀',
}

/** يحدد لغة الرسالة: 'ar' | 'en' | 'both' */
export function resolveLang(player) {
  if (LANG_MODE === 'both') return 'both'
  if (LANG_MODE === 'ar' || LANG_MODE === 'en') return LANG_MODE

  const chosen = String(player?.app_language || '').toLowerCase()
  if (chosen === 'ar' || chosen === 'en') return chosen

  const tg = String(player?.language_code || '').toLowerCase()
  if (tg.startsWith('ar')) return 'ar'
  if (tg.startsWith('en')) return 'en'

  return 'both'
}

/** يبني نص + نص الزر حسب النوع واللغة */
export function buildMessage(kind, player, ctx, variantIndex = 0) {
  let entry = TEXTS[kind]
  if (Array.isArray(entry)) {
    entry = entry[Math.abs(variantIndex) % entry.length]
  }

  const lang = resolveLang(player)

  const text =
    lang === 'both'
      ? `${entry.ar(ctx)}\n\n${SEPARATOR}\n\n${entry.en(ctx)}`
      : entry[lang](ctx)

  return { text, button: BUTTON[lang] }
}

let running = false
let timer = null

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getAppUrl() {
  const bot = process.env.BOT_USERNAME || 'SLYMintX_bot'
  const app = process.env.MINI_APP_SHORT_NAME || 'start'
  return `https://t.me/${bot}/${app}`
}

function toMs(value) {
  if (!value) return 0
  const ms = new Date(value).getTime()
  return Number.isFinite(ms) ? ms : 0
}

/**
 * يرسل رسالة واحدة. النتيجة:
 *  - 'sent'      تم
 *  - 'blocked'   المستخدم حظر البوت / الحساب محذوف / ما فيه محادثة
 *  - 'transient' فشل مؤقت (شبكة، 429، 5xx) → نعيد المحاولة لاحقاً
 *  - 'failed'    رفض نهائي لسبب ثاني (نسجله وما نعيد)
 */
async function sendTelegramMessage(botToken, chatId, text, buttonText) {
  const controller = new AbortController()
  const abortTimer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
          reply_markup: {
            inline_keyboard: [[{ text: buttonText, url: getAppUrl() }]],
          },
        }),
        signal: controller.signal,
      }
    )

    let data = null
    try {
      data = await res.json()
    } catch {
      data = null
    }

    if (data?.ok) return { status: 'sent' }

    const code = Number(data?.error_code || res.status)
    const description = String(data?.description || '')

    if (code === 403) return { status: 'blocked' }

    if (
      code === 400 &&
      /chat not found|user is deactivated|peer_id_invalid/i.test(description)
    ) {
      return { status: 'blocked' }
    }

    if (code === 429) {
      return {
        status: 'transient',
        retryAfterMs: (Number(data?.parameters?.retry_after) || 5) * 1000,
      }
    }

    if (code >= 500) return { status: 'transient' }

    console.error('[notifications] send failed:', code, description)
    return { status: 'failed' }
  } catch (err) {
    return { status: 'transient', error: err?.message }
  } finally {
    clearTimeout(abortTimer)
  }
}

async function markBlocked(telegramId) {
  const { error } = await supabase
    .from('players')
    .update({ bot_blocked: true })
    .eq('telegram_id', telegramId)

  if (error) console.error('[notifications] markBlocked failed:', error.message)
}

// يقرأ صفحات اللاعبين اللي يطابقون الفلتر (تجنّب حد الـ 1000 صف)
async function fetchPlayers(applyFilters) {
  const all = []
  let from = 0

  while (true) {
    let query = supabase
      .from('players')
      .select(PLAYER_COLUMNS)
      .eq('bot_blocked', false)
      .eq('is_banned', false)

    query = applyFilters(query)

    const { data, error } = await query
      .order('telegram_id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw error
    if (!data || data.length === 0) break

    all.push(...data)

    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return all
}

/** يحجز رسالة "التعدين جاهز" لهالدورة. true إذا إحنا اللي حجزناها. */
async function reserveReady(player, startedMs, nowIso) {
  const { data, error } = await supabase
    .from('players')
    .update({
      notify_ready_for: String(startedMs),
      // التذكير القادم يبدأ العدّ من وقت رسالة "جاهز"
      notify_last_reminder_at: nowIso,
      notify_reminder_count: 0,
    })
    .eq('telegram_id', player.telegram_id)
    .eq('mining_active', true)
    .eq('bot_blocked', false)
    .or(`notify_ready_for.is.null,notify_ready_for.neq.${startedMs}`)
    .select('telegram_id')

  if (error) {
    console.error('[notifications] reserveReady failed:', error.message)
    return false
  }

  return Array.isArray(data) && data.length > 0
}

async function releaseReady(player) {
  await supabase
    .from('players')
    .update({
      notify_ready_for: player.notify_ready_for ?? null,
      notify_last_reminder_at: player.notify_last_reminder_at ?? null,
      notify_reminder_count: Number(player.notify_reminder_count || 0),
    })
    .eq('telegram_id', player.telegram_id)
}

/** يحجز التذكير رقم count+1. true إذا إحنا اللي حجزناه. */
async function reserveReminder(player, count, nowIso) {
  const { data, error } = await supabase
    .from('players')
    .update({
      notify_last_reminder_at: nowIso,
      notify_reminder_count: count + 1,
    })
    .eq('telegram_id', player.telegram_id)
    .eq('notify_reminder_count', count)
    .eq('bot_blocked', false)
    .select('telegram_id')

  if (error) {
    console.error('[notifications] reserveReminder failed:', error.message)
    return false
  }

  return Array.isArray(data) && data.length > 0
}

async function releaseReminder(player, count) {
  await supabase
    .from('players')
    .update({
      notify_last_reminder_at: player.notify_last_reminder_at ?? null,
      notify_reminder_count: count,
    })
    .eq('telegram_id', player.telegram_id)
}

/**
 * يتعامل مع نتيجة الإرسال. يرجع true إذا لازم نوقف باقي الدورة (فشل مؤقت).
 */
async function handleResult(result, player, release) {
  if (result.status === 'sent') return false

  if (result.status === 'blocked') {
    await markBlocked(player.telegram_id)
    return false
  }

  if (result.status === 'transient') {
    await release()
    if (result.retryAfterMs) await sleep(result.retryAfterMs)
    return true
  }

  // failed: رفض نهائي بسبب ثاني، ما نفك الحجز عشان ما نكرر المحاولة
  return false
}

export async function runNotificationTick(botToken) {
  const now = Date.now()
  const nowIso = new Date(now).toISOString()
  const settings = await getAppSettings()
  const cycleMs = settings.miningCycleHours * HOUR_MS
  const reward = settings.miningRewardCoins

  let sentReady = 0
  let sentReminder = 0
  let abort = false

  // ---------- 1) تعدين جاهز للاستلام (رسالة وحدة لكل دورة) ----------
  const readyUpper = new Date(now - cycleMs).toISOString()
  const readyLower = new Date(now - cycleMs - READY_LOOKBACK_MS).toISOString()

  const readyCandidates = await fetchPlayers((q) =>
    q
      .eq('mining_active', true)
      .lte('mining_started_at', readyUpper)
      .gte('mining_started_at', readyLower)
  )

  let phaseSends = 0

  for (const player of readyCandidates) {
    if (abort || phaseSends >= MAX_SENDS_PER_PHASE) break

    const startedMs = toMs(player.mining_started_at)
    if (!startedMs || now < startedMs + cycleMs) continue

    // تم إشعاره عن هالدورة قبل
    if (String(player.notify_ready_for) === String(startedMs)) continue

    if (!(await reserveReady(player, startedMs, nowIso))) continue

    const msg = buildMessage('ready', player, { reward })
    const result = await sendTelegramMessage(
      botToken,
      player.telegram_id,
      msg.text,
      msg.button
    )

    abort = await handleResult(result, player, () => releaseReady(player))
    if (result.status === 'sent') sentReady += 1

    phaseSends += 1
    await sleep(SEND_INTERVAL_MS)
  }

  // ---------- 2) تذكير كل 5 ساعات للاعب اللي ما فتح التطبيق ----------
  // (نجيب المرشحين بعد مرحلة "جاهز" عشان اللي استلم رسالة جاهز للتو
  //  ما يوصله تذكير بنفس الدقيقة)
  if (!abort) {
    const threshold = new Date(now - REMINDER_INTERVAL_MS).toISOString()
    const lookback = new Date(now - REMINDER_LOOKBACK_MS).toISOString()

    const reminderCandidates = await fetchPlayers((q) => {
      let query = q
        .lte('last_seen_at', threshold) // ما فتح التطبيق من 5 ساعات
        .gte('last_seen_at', lookback)
        .or(
          `notify_last_reminder_at.is.null,notify_last_reminder_at.lte.${threshold}`
        )

      if (MAX_REMINDERS > 0) {
        query = query.lt('notify_reminder_count', MAX_REMINDERS)
      }

      return query
    })

    phaseSends = 0

    for (const player of reminderCandidates) {
      if (abort || phaseSends >= MAX_SENDS_PER_PHASE) break

      const count = Number(player.notify_reminder_count || 0)
      if (MAX_REMINDERS > 0 && count >= MAX_REMINDERS) continue

      // أمان إضافي (نفس شرط الاستعلام)
      const lastReminderMs = toMs(player.notify_last_reminder_at)
      if (lastReminderMs && now - lastReminderMs < REMINDER_INTERVAL_MS) continue

      let kind
      if (player.mining_active === true) {
        const startedMs = toMs(player.mining_started_at)
        // تعدينه شغال ولسا ما خلص: ما نزعجه
        if (!startedMs || now < startedMs + cycleMs) continue
        kind = 'claim'
      } else {
        kind = 'start'
      }

      if (!(await reserveReminder(player, count, nowIso))) continue

      const msg = buildMessage(kind, player, { reward }, count)
      const result = await sendTelegramMessage(
        botToken,
        player.telegram_id,
        msg.text,
        msg.button
      )

      abort = await handleResult(result, player, () =>
        releaseReminder(player, count)
      )
      if (result.status === 'sent') sentReminder += 1

      phaseSends += 1
      await sleep(SEND_INTERVAL_MS)
    }
  }

  if (sentReady || sentReminder) {
    console.log(
      `[notifications] sent ready=${sentReady} reminders=${sentReminder}`
    )
  }
}

function scheduleNext(botToken, delayMs) {
  timer = setTimeout(async () => {
    if (!running) {
      running = true
      try {
        await runNotificationTick(botToken)
      } catch (err) {
        console.error('[notifications] tick failed:', err?.message || err)
      } finally {
        running = false
      }
    }

    scheduleNext(botToken, TICK_MS)
  }, delayMs)
}

export function startNotificationScheduler() {
  if (process.env.NOTIFICATIONS_ENABLED === 'false') {
    console.log('[notifications] disabled by NOTIFICATIONS_ENABLED=false')
    return
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN

  if (!botToken) {
    console.error(
      '[notifications] TELEGRAM_BOT_TOKEN غير مضبوط، الإشعارات متوقفة'
    )
    return
  }

  if (timer) return

  scheduleNext(botToken, FIRST_TICK_DELAY_MS)
  console.log(
    `[notifications] scheduler started (reminder every ${REMINDER_INTERVAL_MS / HOUR_MS}h, max ${MAX_REMINDERS || 'unlimited'})`
  )
}
