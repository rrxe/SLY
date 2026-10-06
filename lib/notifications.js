import { supabase } from './supabase.js'
import { getAppSettings } from './settings.js'

// ============================================================
// إشعارات البوت (تعدين جاهز / جاهز لتعدين جديد)
//
// يشتغل داخل سيرفر Node الدائم (server.js) بمؤقت كل دقيقة، ويرسل عبر
// Telegram Bot API مباشرة (نفس أسلوب broadcast.js).
//
// القواعد:
// 1) "تعدينك جاهز": رسالة وحدة لكل دورة تعدين (نخزّن وقت بداية الدورة
//    بـ notify_ready_for، فما تتكرر لنفس الدورة).
// 2) "جاهز لتعدين جديد": رسائل خمول تتباعد: بعد 3 ساعات من بداية الخمول،
//    ثم بعد يوم، ثم بعد 3 أيام، وبعدها نوقف (notify_idle_stage = 3).
//    أول ما يبدأ تعدين جديد تتصفّر العدّادات.
// 3) كل رسالة "تُحجز" بقاعدة البيانات أولاً بتحديث مشروط (compare-and-swap)
//    وبعدها تُرسل، فحتى لو اشتغل أكثر من سيرفر ما ينرسل نفس الشي مرتين.
// 4) اللي حظر البوت (403 وأمثاله) نعلّمه bot_blocked ونوقف الإرسال له نهائياً.
// 5) فشل مؤقت (شبكة / 429 / 5xx): نفك الحجز ونوقف الدورة الحالية ونعيد
//    المحاولة بالدورة اللي بعدها، بدل ما نحرق التذكير.
// ============================================================

const TICK_MS = 60 * 1000
const FIRST_TICK_DELAY_MS = 30 * 1000
const PAGE_SIZE = 1000
const SEND_INTERVAL_MS = 40 // ~25 رسالة/ثانية، تحت حد تيليجرام (~30/ثانية)
const REQUEST_TIMEOUT_MS = 10000
const BULK_UPDATE_CHUNK = 200

const HOUR_MS = 60 * 60 * 1000

// الفاصل قبل كل تذكير خمول: 3 ساعات من بداية الخمول، ثم يوم، ثم 3 أيام
const IDLE_DELAYS_MS = [3 * HOUR_MS, 24 * HOUR_MS, 72 * HOUR_MS]
const IDLE_MAX_STAGE = IDLE_DELAYS_MS.length

// ما نلاحق دورات انتهت من أكثر من 7 أيام (تبقى الاستعلامات محدودة)
const READY_LOOKBACK_MS = 7 * 24 * HOUR_MS

const PLAYER_COLUMNS =
  'telegram_id, mining_active, mining_started_at, language_code, notify_state, notify_state_since, notify_ready_for, notify_idle_stage, notify_idle_last_at'

const TEXTS = {
  ar: {
    ready: 'تعدينك جاهز، استلم 💰',
    idle: 'جاهز لبدء تعدين جديد ⛏️ ابدأ الآن',
    button: 'افتح التطبيق',
  },
  en: {
    ready: 'Your mining is ready, claim it 💰',
    idle: 'Ready to start a new mining cycle ⛏️ Start now',
    button: 'Open app',
  },
}

let running = false
let timer = null

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getTexts(languageCode) {
  return String(languageCode || '').toLowerCase().startsWith('ar')
    ? TEXTS.ar
    : TEXTS.en
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
        retryAfterMs:
          (Number(data?.parameters?.retry_after) || 5) * 1000,
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
async function reserveReady(player, startedMs) {
  const { data, error } = await supabase
    .from('players')
    .update({ notify_ready_for: String(startedMs) })
    .eq('telegram_id', player.telegram_id)
    .eq('mining_active', true)
    .eq('bot_blocked', false)
    .or(
      `notify_ready_for.is.null,notify_ready_for.neq.${startedMs}`
    )
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
    .update({ notify_ready_for: player.notify_ready_for ?? null })
    .eq('telegram_id', player.telegram_id)
}

/** يحجز تذكير الخمول رقم stage+1. true إذا إحنا اللي حجزناه. */
async function reserveIdle(player, stage) {
  const { data, error } = await supabase
    .from('players')
    .update({
      notify_idle_stage: stage + 1,
      notify_idle_last_at: new Date().toISOString(),
    })
    .eq('telegram_id', player.telegram_id)
    .eq('mining_active', false)
    .eq('bot_blocked', false)
    .eq('notify_state', 'idle')
    .eq('notify_idle_stage', stage)
    .select('telegram_id')

  if (error) {
    console.error('[notifications] reserveIdle failed:', error.message)
    return false
  }

  return Array.isArray(data) && data.length > 0
}

async function releaseIdle(player, stage) {
  await supabase
    .from('players')
    .update({
      notify_idle_stage: stage,
      notify_idle_last_at: player.notify_idle_last_at ?? null,
    })
    .eq('telegram_id', player.telegram_id)
}

async function bulkUpdate(ids, values, applyFilters) {
  for (let i = 0; i < ids.length; i += BULK_UPDATE_CHUNK) {
    const chunk = ids.slice(i, i + BULK_UPDATE_CHUNK)

    let query = supabase.from('players').update(values).in('telegram_id', chunk)
    query = applyFilters(query)

    const { error } = await query
    if (error) console.error('[notifications] bulk update failed:', error.message)
  }
}

/**
 * يرسل حسب نتيجة الإرسال. يرجع true إذا لازم نوقف باقي الدورة (فشل مؤقت).
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

  let sentReady = 0
  let sentIdle = 0
  let abort = false

  // ---------- 1) تعدين جاهز للاستلام ----------
  const readyUpper = new Date(now - cycleMs).toISOString()
  const readyLower = new Date(now - cycleMs - READY_LOOKBACK_MS).toISOString()

  const readyCandidates = await fetchPlayers((q) =>
    q
      .eq('mining_active', true)
      .lte('mining_started_at', readyUpper)
      .gte('mining_started_at', readyLower)
  )

  for (const player of readyCandidates) {
    if (abort) break

    const startedMs = toMs(player.mining_started_at)
    if (!startedMs || now < startedMs + cycleMs) continue

    // تم إشعاره عن هالدورة قبل
    if (String(player.notify_ready_for) === String(startedMs)) continue

    if (!(await reserveReady(player, startedMs))) continue

    const texts = getTexts(player.language_code)
    const result = await sendTelegramMessage(
      botToken,
      player.telegram_id,
      texts.ready,
      texts.button
    )

    abort = await handleResult(result, player, () => releaseReady(player))
    if (result.status === 'sent') sentReady += 1

    await sleep(SEND_INTERVAL_MS)
  }

  // ---------- 2) رجوع التعدين: نصفّر عدّادات الخمول ----------
  {
    const { error } = await supabase
      .from('players')
      .update({
        notify_state: 'active',
        notify_state_since: nowIso,
        notify_idle_stage: 0,
        notify_idle_last_at: null,
      })
      .eq('mining_active', true)
      .eq('notify_state', 'idle')

    if (error) console.error('[notifications] reset idle failed:', error.message)
  }

  // ---------- 3) خمول: جاهز لتعدين جديد ولم يبدأ ----------
  if (!abort) {
    const idleCandidates = await fetchPlayers((q) =>
      q.eq('mining_active', false).lt('notify_idle_stage', IDLE_MAX_STAGE)
    )

    // أول مرة نشوفه خامل: نسجّل بداية الخمول ونبدأ العدّ منها
    const newlyIdle = idleCandidates
      .filter((p) => p.notify_state !== 'idle')
      .map((p) => p.telegram_id)

    await bulkUpdate(
      newlyIdle,
      {
        notify_state: 'idle',
        notify_state_since: nowIso,
        notify_idle_stage: 0,
        notify_idle_last_at: null,
      },
      (q) => q.eq('mining_active', false)
    )

    for (const player of idleCandidates) {
      if (abort) break
      if (player.notify_state !== 'idle') continue

      const stage = Number(player.notify_idle_stage || 0)
      if (stage >= IDLE_MAX_STAGE) continue

      const reference =
        stage === 0
          ? toMs(player.notify_state_since)
          : toMs(player.notify_idle_last_at)

      if (!reference || now < reference + IDLE_DELAYS_MS[stage]) continue

      if (!(await reserveIdle(player, stage))) continue

      const texts = getTexts(player.language_code)
      const result = await sendTelegramMessage(
        botToken,
        player.telegram_id,
        texts.idle,
        texts.button
      )

      abort = await handleResult(result, player, () =>
        releaseIdle(player, stage)
      )
      if (result.status === 'sent') sentIdle += 1

      await sleep(SEND_INTERVAL_MS)
    }
  }

  if (sentReady || sentIdle) {
    console.log(
      `[notifications] sent ready=${sentReady} idle=${sentIdle}`
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
  console.log('[notifications] scheduler started')
}
