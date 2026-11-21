import crypto from 'node:crypto'
import { supabase } from './supabase.js'
import { getAppSettings } from './settings.js'
import { resolveLang } from './notifications.js'

// ============================================================
// استقبال تحديثات البوت (Webhook):
//  - /start  → رسالة ترحيب (عربي / إنجليزي / الاثنين) مع زر "افتح التطبيق"
//  - لو /start ref_123 نحافظ على رابط الإحالة داخل زر التطبيق
//  - my_chat_member → نعلّم bot_blocked لما اللاعب يحظر/يفك حظر البوت
//  - /start يفك علامة bot_blocked فوراً (صار يقدر يستقبل رسائل)
//
// الإعداد: ضع PUBLIC_URL=https://دومينك (أو APP_URL / RENDER_EXTERNAL_URL)
// والسيرفر يسجّل الـ webhook تلقائياً عند التشغيل.
// ============================================================

const REQUEST_TIMEOUT_MS = 10000
const APP_NAME = process.env.APP_NAME || 'SLY'

function getSecret() {
  if (process.env.TELEGRAM_WEBHOOK_SECRET) {
    return process.env.TELEGRAM_WEBHOOK_SECRET
  }

  return crypto
    .createHash('sha256')
    .update(`webhook:${process.env.TELEGRAM_BOT_TOKEN || ''}`)
    .digest('hex')
    .slice(0, 48)
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function getAppUrl(startParam) {
  const bot = process.env.BOT_USERNAME || 'SLYMintX_bot'
  const app = process.env.MINI_APP_SHORT_NAME || 'start'
  const base = `https://t.me/${bot}/${app}`
  return startParam ? `${base}?startapp=${encodeURIComponent(startParam)}` : base
}

const SEPARATOR = '━━━━━━━━━━━━'

const BUTTON = {
  ar: 'افتح التطبيق 🚀',
  en: 'Open app 🚀',
  both: 'افتح التطبيق | Open app 🚀',
}

const WELCOME = {
  ar: (c) =>
    `👋 أهلاً <b>${c.name}</b>، يا هلا بك في <b>${escapeHtml(APP_NAME)}</b>!\n\n` +
    `⛏️ ابدأ التعدين واجمع <b>${c.reward}</b> عملة في كل دورة\n` +
    `🎁 استلم مكافأتك اليومية وأنجز المهام\n` +
    `👥 ادعُ أصدقاءك واكسب من إحالاتهم\n` +
    `💸 اسحب أرباحك بكل سهولة\n\n` +
    `👇 اضغط الزر بالأسفل وابدأ رحلتك الآن!`,
  en: (c) =>
    `👋 Welcome <b>${c.name}</b> to <b>${escapeHtml(APP_NAME)}</b>!\n\n` +
    `⛏️ Start mining and collect <b>${c.reward}</b> coins every cycle\n` +
    `🎁 Claim your daily reward and complete tasks\n` +
    `👥 Invite friends and earn from their referrals\n` +
    `💸 Withdraw your earnings easily\n\n` +
    `👇 Tap the button below and start now!`,
}

export function buildWelcome(player, ctx) {
  const lang = resolveLang(player)

  const text =
    lang === 'both'
      ? `${WELCOME.ar(ctx)}\n\n${SEPARATOR}\n\n${WELCOME.en(ctx)}`
      : WELCOME[lang](ctx)

  return { text, button: BUTTON[lang] }
}

async function telegramCall(method, body) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      }
    )

    return await res.json().catch(() => null)
  } catch (err) {
    return { ok: false, description: err?.message }
  } finally {
    clearTimeout(timer)
  }
}

async function setBlocked(telegramId, blocked) {
  try {
    await supabase
      .from('players')
      .update({ bot_blocked: blocked })
      .eq('telegram_id', telegramId)
  } catch {
    // العمود غير موجود أو خطأ مؤقت: ما يهم
  }
}

async function handleStart(message, payload) {
  const from = message.from
  const chatId = message.chat.id

  await setBlocked(from.id, false)

  let stored = null
  try {
    const { data } = await supabase
      .from('players')
      .select('app_language, language_code')
      .eq('telegram_id', from.id)
      .maybeSingle()
    stored = data
  } catch {
    stored = null
  }

  let reward = '2,500'
  try {
    const settings = await getAppSettings()
    reward = Number(settings.miningRewardCoins || 0).toLocaleString('en-US')
  } catch {
    // نكمل بالقيمة الافتراضية
  }

  const player = {
    app_language: stored?.app_language,
    language_code: from.language_code || stored?.language_code,
  }

  const name = escapeHtml(from.first_name || from.username || '')
  const startParam = /^ref_\d+$/.test(payload) ? payload : ''
  const welcome = buildWelcome(player, { name, reward })

  const result = await telegramCall('sendMessage', {
    chat_id: chatId,
    text: welcome.text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [[{ text: welcome.button, url: getAppUrl(startParam) }]],
    },
  })

  if (!result?.ok) {
    console.error('[bot] welcome failed:', result?.description)
  }
}

async function processUpdate(update) {
  const message = update?.message

  if (message && message.chat?.type === 'private' && message.from && !message.from.is_bot) {
    const text = String(message.text || '').trim()
    const match = text.match(/^\/start(?:@\w+)?(?:\s+(.+))?$/i)

    if (match) {
      await handleStart(message, String(match[1] || '').trim())
    }
    return
  }

  const member = update?.my_chat_member
  if (member && member.chat?.type === 'private') {
    const status = member.new_chat_member?.status
    if (status === 'kicked') await setBlocked(member.chat.id, true)
    else if (status === 'member') await setBlocked(member.chat.id, false)
  }
}

export async function handleTelegramWebhook(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false })
  }

  if (req.headers['x-telegram-bot-api-secret-token'] !== getSecret()) {
    return res.status(401).json({ ok: false })
  }

  // نرد فوراً عشان تيليجرام ما يعيد الإرسال، والمعالجة تكمل بالخلفية
  res.status(200).json({ ok: true })

  processUpdate(req.body).catch((err) => {
    console.error('[bot] update failed:', err?.message || err)
  })
}

export async function setupTelegramWebhook() {
  if (process.env.TELEGRAM_WEBHOOK_ENABLED === 'false') return

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error('[bot] TELEGRAM_BOT_TOKEN غير مضبوط، الـ webhook متوقف')
    return
  }

  const base =
    process.env.PUBLIC_URL ||
    process.env.APP_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    (process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : '')

  if (!base) {
    console.error(
      '[bot] ضع PUBLIC_URL=https://دومينك عشان يشتغل /start (ما انسجّل webhook)'
    )
    return
  }

  const url = `${base.replace(/\/+$/, '')}/api/telegram/webhook`

  const result = await telegramCall('setWebhook', {
    url,
    secret_token: getSecret(),
    allowed_updates: ['message', 'my_chat_member'],
    max_connections: 40,
  })

  if (result?.ok) console.log(`[bot] webhook set: ${url}`)
  else console.error('[bot] setWebhook failed:', result?.description)
}
