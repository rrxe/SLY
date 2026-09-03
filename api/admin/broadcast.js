import { supabase } from '../../lib/supabase.js'

// السبب الحقيقي لتعطل الإرسال الجماعي: كانت الرسائل ترسل وحدة وحدة
// (await داخل for loop) لكل لاعب بالتسلسل. مع عدد لاعبين كبير هذا
// يتجاوز مهلة تنفيذ الـ serverless function بفيرسل (غالباً تنتهي
// المهلة والدالة تنقتل بالنص قبل ما توصل لآخر اللاعبين)، فيرجع خطأ
// أو timeout بدل ما يخلص الإرسال. الحل: إرسال دفعات متوازية بدل
// التسلسل، مع رفع أقصى مدة تنفيذ مسموحة للدالة.
// خطة Vercel Hobby أقصى مدة تنفيذ لأي دالة هي 10 ثواني بالضبط، ما تنرفع
// بأي إعداد. فبدل ما نخاطر بقتل الدالة بالنص (ورجوع بلا رد أصلاً)، نحط
// سقف زمني آمن (DEADLINE_MS) نوقف عنده الحلقة، ونرجع "nextOffset" حتى
// الواجهة تقدر تكمل تلقائياً من وين وقفنا - بدون ما يحتاج الأدمن يضغط
// أكثر من مرة حتى لو عدد اللاعبين فوق 1000.
export const config = {
  maxDuration: 10,
}

const BATCH_SIZE = 30 // قريب من حد تيليجرام (~30 رسالة/ثانية لمستخدمين مختلفين)
const BATCH_DELAY_MS = 1000 // نبقى تحت حد تيليجرام
const DEADLINE_MS = 8500 // نوقف قبل الـ 10 ثواني بهامش أمان

export default async function handler(req, res) {
  if (req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { message, photoBase64, photoMime, offset } = req.body
    const startOffset = Number.isFinite(offset) ? Math.max(0, offset) : 0

    // لازم على الأقل نص أو صورة
    if (!message && !photoBase64) {
      return res.status(400).json({ success: false, error: 'Message or photo is required' })
    }

    const { data: allPlayers, error } = await supabase
      .from('players')
      .select('telegram_id')
      .order('telegram_id', { ascending: true })

    if (error) throw error

    const players = allPlayers.slice(startOffset)

    const botToken = process.env.TELEGRAM_BOT_TOKEN
    let sentCount = 0

    // لو فيه صورة، نحولها من base64 لـ Buffer مرة وحدة بس (مو داخل
    // اللوب) لتوفير المعالجة، وبعدين نبنيها كـ Blob لكل طلب إرسال
    let photoBuffer = null
    if (photoBase64) {
      try {
        photoBuffer = Buffer.from(photoBase64, 'base64')
      } catch (e) {
        return res.status(400).json({ success: false, error: 'Invalid photo data' })
      }
    }

    const sendOne = async (telegramId) => {
      try {
        let response

        if (photoBuffer) {
          // إرسال صورة (مع كابشن نصي اختياري) عبر sendPhoto
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
          // المسار القديم: رسالة نصية بس (بدون أي تغيير بالسلوك)
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

    // إرسال على شكل دفعات متوازية، مع توقف آمن قبل ما نضرب مهلة فيرسل
    const startedAt = Date.now()
    let processedCount = 0
    let reachedDeadline = false

    for (let i = 0; i < players.length; i += BATCH_SIZE) {
      if (Date.now() - startedAt > DEADLINE_MS) {
        reachedDeadline = true
        break
      }

      const batch = players.slice(i, i + BATCH_SIZE)

      const results = await Promise.allSettled(
        batch.map((player) => sendOne(player.telegram_id))
      )

      sentCount += results.filter((r) => r.status === 'fulfilled' && r.value).length
      processedCount += batch.length

      const isLastBatch = i + BATCH_SIZE >= players.length
      if (!isLastBatch && Date.now() - startedAt + BATCH_DELAY_MS < DEADLINE_MS) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS))
      }
    }

    const nextOffset = startOffset + processedCount
    const done = nextOffset >= allPlayers.length

    return res.status(200).json({
      success: true,
      sentCount,
      totalPlayers: allPlayers.length,
      processedSoFar: nextOffset,
      done,
      nextOffset: done ? null : nextOffset,
    })
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message })
  }
}
