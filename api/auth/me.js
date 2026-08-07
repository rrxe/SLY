import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const authHeader = req.headers.authorization || ''
    const initData = authHeader.replace('tga ', '')
    const urlParams = new URLSearchParams(initData)
    const userStr = urlParams.get('user')

    if (!userStr) return res.status(400).json({ error: 'No user data' })

    const telegramId = JSON.parse(userStr).id

    const { data, error } = await supabase
      .from('players')
      .select('telegram_id, referrals_count')
      .eq('telegram_id', telegramId)
      .single()

    if (error) return res.status(200).json({ telegramId, referralsCount: 0 })

    return res.status(200).json({
      telegramId: data.telegram_id,
      referralsCount: data.referrals_count || 0
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
