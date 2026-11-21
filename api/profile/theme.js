import { supabase } from '../../lib/supabase.js'
import { authenticateRequest } from '../../lib/telegram-auth.js'

// مظهر التطبيق (ملوّن / أبيض وأسود) محفوظ على حساب اللاعب نفسه،
// فيبقى ثابت على أي جهاز أو نسخة تيليجرام يفتح منها.
// القيمة الفاضية (null) = اللاعب ما اختار قبل → التطبيق يبدأ ملوّن.
const THEMES = new Set(['color', 'mono'])

export default async function handler(req, res) {
  const auth = authenticateRequest(req)
  if (!auth) return res.status(401).json({ error: 'Invalid or missing Telegram authentication' })

  const telegramId = auth.id

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('players')
        .select('theme')
        .eq('telegram_id', telegramId)
        .maybeSingle()

      if (error) throw error
      return res.status(200).json({ theme: THEMES.has(data?.theme) ? data.theme : null })
    }

    if (req.method === 'POST') {
      const { theme } = req.body || {}
      if (!THEMES.has(theme)) return res.status(400).json({ error: 'Invalid theme' })

      const { error } = await supabase
        .from('players')
        .update({ theme })
        .eq('telegram_id', telegramId)

      if (error) throw error
      return res.status(200).json({ success: true, theme })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
