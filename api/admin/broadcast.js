import { supabase } from '../../lib/supabase.js'

// ============================================================
// ليش البرودكاست كان "غبي" وما يوصل لكل اللاعبين + الصورة ما ترسل:
//
// 1) الصورة ما ترسل: body-parser بالسيرفر (express.json) إله حد
//    افتراضي 100kb للطلب. أي صورة محوّلة base64 أكبر من هيك تنرفض
//    كاملة قبل لا توصل حتى لهالملف. (الحل بملف server.js: رفعنا
//    الحد لـ 15mb).
//
// 2) ما يوصل لكل اللاعبين: الاستعلام كان `select('telegram_id')`
//    بدون أي pagination. مكتبة Supabase تحدد تلقائياً أقصى 1000 صف
//    بكل استعلام. يعني لو عندك أكثر من 1000 لاعب، أي حد فوق الـ 1000
//    ما كان يوصله البرودكاست أبداً - بصمت وبدون أي خطأ ظاهر.
//
// 3) التصميم القديم كان مبني على افتراض إنه شغال على Vercel serverless
//    (حد 10 ثواني بالضبط للدالة)، فكان يعتمد على إن واجهة الأدمن تضل
//    فاتحة الصفحة وتستدعي نفس الـ endpoint عشرات المرات (offset تلو
//    offset) لين يخلص. لو الأدمن سكر التاب أو انقطع النت بالنص،
//    البرودكاست يوقف للأبد بدون أي طريقة يكمل فيها.
//    بما إن المشروع الحين يشتغل بسيرفر Node/Express دائم (مو serverless
//    مؤقت)، ما فيه داعي لكل هالتعقيد. صرنا نسوي كل شي بطلب وحد:
//    - الأدمن يضغط "إرسال للجميع" مرة وحدة بس
//    - السيرفر يرد فوراً "بدأ الإرسال" ويكمل الإرسال بالخلفية
//    - واجهة الأدمن تستعلم كل شوي عن حالة التقدم (progress) وتعرضها
// ============================================================

const BATCH_SIZE = 25 // قريب من حد تيليجرام (~30 رسالة/ثانية لمستخدمين مختلفين)
const BATCH_DELAY_MS = 1000 // نبقى تحت حد تيليجرام

// حالة البرودكاست الحالية، محفوظة بالذاكرة طول ما السيرفر شغال
// (يشتغل صح لأن هذا سيرفر Node دائم، مو دالة serverless تتصفر كل طلب)
const state = {
  active: false,
  sentCount: 0,
  failedCount: 0,
  totalPlayers: 0,
  processedSoFar: 0,
  done: true,
  error: null,
  startedAt: null,
  finishedAt: null,
}

function publicState() {
  return {
    active: state.active,
    sentCount: state.sentCount,
    failedCount: state.failedCount,
    totalPlayers: state.totalPlayers,
    processedSoFar: state.processedSoFar,
    done: state.done,
    error: state.error,
  }
}

// يجيب كل اللاعبين بدون أي حد أقصى، بصفحات من 1000 بالتتابع
// (هذا هو الحل لمشكلة الـ 1000 صف)
async function fetchAllTelegramIds() {
  const ids = []
  const PAGE_SIZE = 1000
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from('players')
      .select('telegram_id')
      .order('telegram_id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw error
    if (!data || data.length === 0) break

    for (const row of data) {
      ids.push(row.telegram_id)
    }

    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return ids
}

async function sendOne(telegramId, botToken, message, photoBuffer, photoMime) {
  try {
    let response

    if (photoBuffer) {
      const form = new FormData()
      form.append('chat_id', String(telegramId))
      if (message) {
        form.append('caption', message)
        form.append('parse_mode', 'HTML')
      }
      form.append(
        'photo',
        new Blob([photoBuffer], { type: photoMime || 'image/jpeg' }),
        'broadcast.jpg'
      )

      response = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
        method: 'POST',
        body: form,
      })
    } else {
      response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramId,
          text: message,
          parse_mode: 'HTML',
        }),
      })
    }

    const result = await response.json()
    return !!result.ok
  } catch (e) {
    // نتجاوز أي رسالة فشلت (مثلاً مستخدم حظر البوت) ونكمل الباقي
    return false
  }
}

async function runBroadcast(message, photoBuffer, photoMime) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN

  try {
    const telegramIds = await fetchAllTelegramIds()
    state.totalPlayers = telegramIds.length

    for (let i = 0; i < telegramIds.length; i += BATCH_SIZE) {
      const batch = telegramIds.slice(i, i + BATCH_SIZE)

      const results = await Promise.allSettled(
        batch.map((id) => sendOne(id, botToken, message, photoBuffer, photoMime))
      )

      for (const r of results) {
        if (r.status === 'fulfilled' && r.value) {
          state.sentCount += 1
        } else {
          state.failedCount += 1
        }
      }

      state.processedSoFar += batch.length

      const isLastBatch = i + BATCH_SIZE >= telegramIds.length
      if (!isLastBatch) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS))
      }
    }
  } catch (err) {
    state.error = err.message || 'حدث خطأ أثناء الإرسال'
  } finally {
    state.active = false
    state.done = true
    state.finishedAt = Date.now()
  }
}

export default async function handler(req, res) {
  if (req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  // استعلام عن حالة التقدم الحالية (تستخدمه واجهة الأدمن كل ثانية ونص
  // لتحديث الشريط لين ما يخلص الإرسال)
  if (req.method === 'GET') {
    return res.status(200).json({ success: true, ...publicState() })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  if (state.active) {
    return res.status(409).json({
      success: false,
      error: 'فيه إرسال جماعي شغال حالياً، انتظر لين يخلص قبل ما تبدأ وحدة جديدة.',
    })
  }

  try {
    const { message, photoBase64, photoMime } = req.body || {}

    if (!message && !photoBase64) {
      return res.status(400).json({ success: false, error: 'Message or photo is required' })
    }

    let photoBuffer = null
    if (photoBase64) {
      try {
        photoBuffer = Buffer.from(photoBase64, 'base64')
      } catch (e) {
        return res.status(400).json({ success: false, error: 'Invalid photo data' })
      }
    }

    // نصفّر الحالة ونبدأ الإرسال بالخلفية بدون ما ننتظره (fire-and-forget)،
    // ونرد فوراً على الأدمن حتى ما يعلّق الطلب
    state.active = true
    state.sentCount = 0
    state.failedCount = 0
    state.totalPlayers = 0
    state.processedSoFar = 0
    state.done = false
    state.error = null
    state.startedAt = Date.now()
    state.finishedAt = null

    runBroadcast(message, photoBuffer, photoMime)

    return res.status(200).json({ success: true, started: true, ...publicState() })
  } catch (err) {
    state.active = false
    state.done = true
    return res.status(500).json({ success: false, error: err.message })
  }
}
