import { supabase } from '../../lib/supabase.js'

// ============================================================
// البرودكاست (إرسال جماعي لكل اللاعبين)
//
// أسباب "ما يوصل للكل" اللي انصلحت هنا:
//
// 1) حد 1000 صف بـ Supabase: نقرأ اللاعبين بصفحات (pagination).
// 2) حد تيليجرام 429: قبل كنا نرسل 30 رسالة بنفس الثانية بالضبط وأي
//    رسالة ترجع 429 تنحسب "فشلت" وتضيع. هسه: 25 بالثانية + لو رجع 429
//    نوقف الإرسال كله المدة اللي يطلبها تيليجرام (retry_after) ونعيد
//    نفس الرسالة (لين 3 محاولات)، وفشل الشبكة/5xx نعيده كمان.
// 3) خطأ HTML: لو الرسالة فيها رمز مثل < أو & أو وسم غلط، تيليجرام يرفض
//    الرسالة لكل الناس (can't parse entities). هسه أول ما يصير هالخطأ
//    نكمل الإرسال كنص عادي بدل ما تفشل للكل.
// 4) الصورة: كانت ترفع كاملة (multipart) لكل لاعب لحاله! هسه نرفعها مرة
//    وحدة بس، نأخذ file_id من تيليجرام، ونستخدمه لباقي اللاعبين (أسرع
//    بكثير وما تنتهي المهلة).
// 5) كابشن الصورة أطول من 1024 حرف: تيليجرام يرفضه، هسه نرسل الصورة
//    وبعدها النص برسالة مستقلة.
// 6) اللي حظروا البوت (403) نعلّمهم bot_blocked ونستثنيهم من الإرسالات
//    القادمة (يتفك الحظر تلقائياً لما يفتح اللاعب التطبيق).
// 7) forceReset كان يخلي إرسالين يشتغلوا مع بعض: هسه كل إرسال له رقم
//    (runId) والقديم يوقف نفسه لو انبدأ إرسال جديد.
// 8) لو فشل كل شي، نعرض سبب تيليجرام الحقيقي للأدمن بدل "فشل N".
// ============================================================

const BATCH_SIZE = 25 // أقل شوي من حد تيليجرام (~30/ثانية)
const BATCH_INTERVAL_MS = 1000
const REQUEST_TIMEOUT_MS = 15000
const PHOTO_UPLOAD_TIMEOUT_MS = 60000
const STALL_RESET_MS = 180000 // لو ما فيه أي تقدم لهالمدة نعتبره عالق
const MAX_RETRIES = 3
const CAPTION_LIMIT = 1024
const TEXT_LIMIT = 4096
const PHOTO_MAX_BYTES = 10 * 1024 * 1024
const BLOCKED_UPDATE_CHUNK = 200

const BLOCKED_RE = /chat not found|user is deactivated|peer_id_invalid|bot was blocked|bot can't initiate/i

// حالة البرودكاست الحالية، محفوظة بالذاكرة طول ما السيرفر شغال
const state = {
  runId: 0,
  active: false,
  sentCount: 0,
  failedCount: 0,
  blockedCount: 0,
  totalPlayers: 0,
  processedSoFar: 0,
  done: true,
  error: null,
  lastError: null,
  startedAt: null,
  finishedAt: null,
  lastProgressAt: null,
}

let pauseUntil = 0 // توقف عام للإرسال بعد 429

function publicState() {
  return {
    active: state.active,
    sentCount: state.sentCount,
    failedCount: state.failedCount,
    blockedCount: state.blockedCount,
    totalPlayers: state.totalPlayers,
    processedSoFar: state.processedSoFar,
    done: state.done,
    error: state.error,
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function clearIfStalled() {
  if (!state.active) return

  const reference = state.lastProgressAt || state.startedAt || 0
  if (Date.now() - reference > STALL_RESET_MS) {
    state.runId += 1 // يلغي الحلقة العالقة لو صحيت لاحقاً
    state.active = false
    state.done = true
    state.error =
      'توقف الإرسال بسبب تعليق بالشبكة (Timeout) وتم إعادة الضبط تلقائياً.'
    state.finishedAt = Date.now()
  }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

// يجيب كل اللاعبين (ما عدا اللي حاظرين البوت) بصفحات من 1000
async function fetchAllTelegramIds() {
  async function run(skipBlocked) {
    const ids = []
    const PAGE_SIZE = 1000
    let from = 0

    while (true) {
      let query = supabase.from('players').select('telegram_id')
      if (skipBlocked) query = query.eq('bot_blocked', false)

      const pageQuery = query
        .order('telegram_id', { ascending: true })
        .range(from, from + PAGE_SIZE - 1)

      let timeoutId
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error('انتهت مهلة الاتصال بقاعدة البيانات')),
          REQUEST_TIMEOUT_MS
        )
      })

      let result
      try {
        result = await Promise.race([pageQuery, timeoutPromise])
      } finally {
        clearTimeout(timeoutId)
      }

      const { data, error } = result
      if (error) throw error
      if (!data || data.length === 0) break

      for (const row of data) ids.push(row.telegram_id)

      if (data.length < PAGE_SIZE) break
      from += PAGE_SIZE
    }

    return ids
  }

  try {
    return await run(true)
  } catch (err) {
    // العمود bot_blocked ما انضاف بعد (لسا ما شغلت الـ SQL): نكمل بدون فلتر
    if (err?.code === '42703' || /bot_blocked/i.test(err?.message || '')) {
      console.error('[broadcast] bot_blocked غير موجود، شغّل ملف SQL')
      return await run(false)
    }
    throw err
  }
}

// استدعاء واحد لتيليجرام. يرجع { ok, code, description, retryAfter, data }
async function callTelegram(botToken, method, body, timeoutMs) {
  try {
    const isForm = typeof FormData !== 'undefined' && body instanceof FormData

    const response = await fetchWithTimeout(
      `https://api.telegram.org/bot${botToken}/${method}`,
      isForm
        ? { method: 'POST', body }
        : {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          },
      timeoutMs
    )

    let data = null
    try {
      data = await response.json()
    } catch {
      data = null
    }

    if (data?.ok) return { ok: true, code: 200, data }

    return {
      ok: false,
      code: Number(data?.error_code || response.status || 0),
      description: String(data?.description || ''),
      retryAfter: Number(data?.parameters?.retry_after) || 0,
      data,
    }
  } catch (err) {
    // شبكة / مهلة
    return { ok: false, code: 0, description: err?.message || 'network error' }
  }
}

// يرسل الرسالة/الصورة للاعب واحد (محاولة وحدة)
async function deliver(ctx, telegramId) {
  const parse = ctx.useHtml ? { parse_mode: 'HTML' } : {}
  const markup = ctx.replyMarkup ? { reply_markup: ctx.replyMarkup } : {}

  // ---- نص فقط ----
  if (!ctx.photoBuffer) {
    return callTelegram(ctx.botToken, 'sendMessage', {
      chat_id: telegramId,
      text: ctx.message,
      disable_web_page_preview: true,
      ...parse,
      ...markup,
    })
  }

  // ---- صورة ----
  const captionFits = !!ctx.message && ctx.message.length <= CAPTION_LIMIT

  let photoResult

  if (ctx.fileId) {
    photoResult = await callTelegram(ctx.botToken, 'sendPhoto', {
      chat_id: telegramId,
      photo: ctx.fileId,
      ...(captionFits ? { caption: ctx.message, ...parse } : {}),
      ...(captionFits || !ctx.message ? markup : {}),
    })
  } else {
    // أول رفع: نرسل الملف نفسه مرة وحدة ونأخذ file_id
    const form = new FormData()
    form.append('chat_id', String(telegramId))
    if (captionFits) {
      form.append('caption', ctx.message)
      if (ctx.useHtml) form.append('parse_mode', 'HTML')
    }
    if (ctx.replyMarkup && (captionFits || !ctx.message)) {
      form.append('reply_markup', JSON.stringify(ctx.replyMarkup))
    }
    form.append(
      'photo',
      new Blob([ctx.photoBuffer], { type: ctx.photoMime || 'image/jpeg' }),
      'broadcast.jpg'
    )

    photoResult = await callTelegram(
      ctx.botToken,
      'sendPhoto',
      form,
      PHOTO_UPLOAD_TIMEOUT_MS
    )

    if (photoResult.ok) {
      const sizes = photoResult.data?.result?.photo
      const fileId = Array.isArray(sizes) ? sizes[sizes.length - 1]?.file_id : null
      if (fileId) ctx.fileId = fileId
    }
  }

  if (!photoResult.ok) return photoResult

  // نص طويل ما يدخل بالكابشن: نرسله برسالة مستقلة بعد الصورة
  if (ctx.message && !captionFits) {
    const textResult = await callTelegram(ctx.botToken, 'sendMessage', {
      chat_id: telegramId,
      text: ctx.message,
      disable_web_page_preview: true,
      ...parse,
      ...markup,
    })

    // الصورة وصلت أصلاً، فنعتبره نجاح حتى لو النص فشل (ما نكرر الصورة)
    if (!textResult.ok && textResult.code === 429) return textResult
  }

  return photoResult
}

// يرسل للاعب مع إعادة المحاولة. النتيجة: 'sent' | 'blocked' | 'failed'
async function sendOne(ctx, telegramId) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const wait = pauseUntil - Date.now()
    if (wait > 0) await sleep(wait)

    const r = await deliver(ctx, telegramId)
    if (r.ok) return 'sent'

    // تيليجرام يطلب نهدّي: نوقف الكل ونعيد نفس الرسالة
    if (r.code === 429) {
      const waitMs = (r.retryAfter || 5) * 1000 + 250
      pauseUntil = Math.max(pauseUntil, Date.now() + waitMs)
      continue
    }

    if (r.code === 403 || (r.code === 400 && BLOCKED_RE.test(r.description))) {
      return 'blocked'
    }

    // رمز HTML غلط بنص الأدمن: نكمل كنص عادي بدل ما تفشل للكل
    if (r.code === 400 && /can't parse entities|unsupported start tag/i.test(r.description)) {
      ctx.useHtml = false
      ctx.htmlFallback = true
      continue
    }

    // شبكة / 5xx
    if (r.code === 0 || r.code >= 500) {
      await sleep(500 * (attempt + 1))
      continue
    }

    // رفض نهائي (رابط غلط، صورة غلط ...): نسجل السبب
    if (!state.lastError) state.lastError = `${r.code}: ${r.description}`
    return 'failed'
  }

  if (!state.lastError) state.lastError = 'فشل الإرسال بعد عدة محاولات (شبكة أو ضغط من تيليجرام)'
  return 'failed'
}

async function markBlockedBulk(ids) {
  for (let i = 0; i < ids.length; i += BLOCKED_UPDATE_CHUNK) {
    const chunk = ids.slice(i, i + BLOCKED_UPDATE_CHUNK)
    const { error } = await supabase
      .from('players')
      .update({ bot_blocked: true })
      .in('telegram_id', chunk)

    if (error) {
      console.error('[broadcast] markBlocked failed:', error.message)
      return
    }
  }
}

async function runBroadcast(runId, params) {
  const { message, photoBuffer, photoMime, linkUrl, linkText } = params
  const botToken = process.env.TELEGRAM_BOT_TOKEN

  const ctx = {
    botToken,
    message: message || '',
    photoBuffer,
    photoMime,
    fileId: null,
    useHtml: true,
    htmlFallback: false,
    replyMarkup: linkUrl
      ? { inline_keyboard: [[{ text: linkText || 'فتح الرابط', url: linkUrl }]] }
      : null,
  }

  const blockedIds = []
  const isCurrent = () => runId === state.runId

  function record(id, status) {
    if (!isCurrent()) return
    if (status === 'sent') {
      state.sentCount += 1
    } else {
      state.failedCount += 1
      if (status === 'blocked') {
        state.blockedCount += 1
        blockedIds.push(id)
      }
    }
    state.processedSoFar += 1
    state.lastProgressAt = Date.now()
  }

  try {
    const telegramIds = [...new Set(await fetchAllTelegramIds())]
    if (!isCurrent()) return

    state.totalPlayers = telegramIds.length
    state.lastProgressAt = Date.now()

    let index = 0

    // لو فيه صورة: نرسل بالتتابع لين ينرفع الملف ونجيب file_id،
    // وبعدها كل الباقي يستخدم file_id (بدون رفع)
    while (photoBuffer && !ctx.fileId && index < telegramIds.length) {
      if (!isCurrent()) return
      const id = telegramIds[index]
      record(id, await sendOne(ctx, id))
      index += 1
    }

    for (let i = index; i < telegramIds.length; i += BATCH_SIZE) {
      if (!isCurrent()) return

      const batch = telegramIds.slice(i, i + BATCH_SIZE)
      const batchStartedAt = Date.now()

      const results = await Promise.allSettled(batch.map((id) => sendOne(ctx, id)))

      batch.forEach((id, k) => {
        const r = results[k]
        record(id, r.status === 'fulfilled' ? r.value : 'failed')
      })

      const isLastBatch = i + BATCH_SIZE >= telegramIds.length
      if (!isLastBatch) {
        const remainingMs = BATCH_INTERVAL_MS - (Date.now() - batchStartedAt)
        if (remainingMs > 0) await sleep(remainingMs)
      }
    }

    if (isCurrent() && state.sentCount === 0 && state.failedCount > 0 && state.lastError) {
      state.error = `ما وصلت أي رسالة. سبب تيليجرام: ${state.lastError}`
    }
  } catch (err) {
    if (isCurrent()) state.error = err?.message || 'حدث خطأ أثناء الإرسال'
  } finally {
    if (blockedIds.length > 0) {
      await markBlockedBulk(blockedIds).catch(() => {})
    }

    if (isCurrent()) {
      state.active = false
      state.done = true
      state.finishedAt = Date.now()
    }
  }
}

export default async function handler(req, res) {
  if (req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  clearIfStalled()

  // استعلام عن حالة التقدم (تستخدمه واجهة الأدمن)
  if (req.method === 'GET') {
    return res.status(200).json({ success: true, ...publicState() })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const forceReset = !!(req.body && req.body.forceReset)

  if (state.active && !forceReset) {
    return res.status(409).json({
      success: false,
      error: 'فيه إرسال جماعي شغال حالياً، انتظر لين يخلص قبل ما تبدأ وحدة جديدة.',
    })
  }

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return res.status(500).json({ success: false, error: 'TELEGRAM_BOT_TOKEN غير مضبوط' })
  }

  try {
    const { message, photoBase64, photoMime, linkUrl, linkText } = req.body || {}

    if (!message && !photoBase64) {
      return res.status(400).json({ success: false, error: 'Message or photo is required' })
    }

    if (message && String(message).length > TEXT_LIMIT) {
      return res.status(400).json({
        success: false,
        error: `الرسالة طويلة (${String(message).length} حرف). الحد الأقصى ${TEXT_LIMIT}.`,
      })
    }

    if (linkUrl && !/^(https?:\/\/|tg:\/\/)/i.test(String(linkUrl).trim())) {
      return res.status(400).json({
        success: false,
        error: 'الرابط لازم يبدأ بـ https:// أو http:// أو tg://',
      })
    }

    let photoBuffer = null
    if (photoBase64) {
      const clean = String(photoBase64).replace(/^data:[^;]+;base64,/, '')
      photoBuffer = Buffer.from(clean, 'base64')

      if (photoBuffer.length === 0) {
        return res.status(400).json({ success: false, error: 'Invalid photo data' })
      }

      if (photoBuffer.length > PHOTO_MAX_BYTES) {
        return res.status(400).json({
          success: false,
          error: 'الصورة أكبر من 10MB (حد تيليجرام). صغّرها وجرب من جديد.',
        })
      }
    }

    // رقم جديد للإرسال: أي إرسال قديم عالق يوقف نفسه
    state.runId += 1
    const runId = state.runId

    pauseUntil = 0
    state.active = true
    state.sentCount = 0
    state.failedCount = 0
    state.blockedCount = 0
    state.totalPlayers = 0
    state.processedSoFar = 0
    state.done = false
    state.error = null
    state.lastError = null
    state.startedAt = Date.now()
    state.finishedAt = null
    state.lastProgressAt = Date.now()

    // يشتغل بالخلفية، ونرد فوراً على الأدمن
    runBroadcast(runId, {
      message: message ? String(message) : '',
      photoBuffer,
      photoMime,
      linkUrl: linkUrl ? String(linkUrl).trim() : '',
      linkText: linkText ? String(linkText).trim() : '',
    })

    return res.status(200).json({ success: true, started: true, ...publicState() })
  } catch (err) {
    state.active = false
    state.done = true
    return res.status(500).json({ success: false, error: err.message })
  }
}
