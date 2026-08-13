import { supabase } from '../../lib/supabase.js'

export default async function handler(req, res) {
  if (req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { message, photoBase64, photoMime } = req.body

    // لازم على الأقل نص أو صورة
    if (!message && !photoBase64) {
      return res.status(400).json({ success: false, error: 'Message or photo is required' })
    }

    const { data: players, error } = await supabase.from('players').select('telegram_id')

    if (error) throw error

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

    for (const player of players) {
      try {
        let response

        if (photoBuffer) {
          // إرسال صورة (مع كابشن نصي اختياري) عبر sendPhoto
          const form = new FormData()
          form.append('chat_id', String(player.telegram_id))
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
              chat_id: player.telegram_id,
              text: message,
              parse_mode: 'HTML',
            }),
          })
        }

        const result = await response.json()
        if (result.ok) sentCount++
      } catch (e) {
        // نتجاوز أي رسالة فشلت (مثلاً مستخدم حظر البوت) ونكمل الباقي
      }
    }

    return res.status(200).json({ success: true, sentCount })
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message })
  }
}
