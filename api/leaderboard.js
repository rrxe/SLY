import { supabase } from '../lib/supabase.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { data: players, error } = await supabase
      .from('players')
      .select('telegram_id, username, coin')
      .order('coin', { ascending: false })
      .limit(50)

    if (error) throw error

    const formatted = (players || []).map((player, index) => {
      const coins = player.coin || 0
      let tier = 'Common'
      if (coins >= 10000) tier = 'Mythic'
      else if (coins >= 5000) tier = 'Legendary'
      else if (coins >= 1000) tier = 'Epic'

      return {
        rank: index + 1,
        name: player.username ? `@${player.username}` : `Player_${String(player.telegram_id).slice(-4)}`,
        coins: coins.toLocaleString(),
        tier,
      }
    })

    return res.status(200).json(formatted)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
