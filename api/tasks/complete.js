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
    const { reward } = req.body

    if (!reward || typeof reward !== 'number') {
      return res.status(400).json({ error: 'Invalid reward amount' })
    }

    const { data: player, error: fetchError } = await supabase
      .from('players')
      .select('points, lifetime_coins')
      .eq('telegram_id', telegramId)
      .single()

    if (fetchError || !player) {
      return res.status(404).json({ error: 'Player not found' })
    }

    const newPoints = (player.points || 0) + reward
    const newLifetime = (player.lifetime_coins || 0) + reward

    const { error: updateError } = await supabase
      .from('players')
      .update({ points: newPoints, lifetime_coins: newLifetime })
      .eq('telegram_id', telegramId)

    if (updateError) throw updateError

    return res.status(200).json({ success: true, newPoints })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
