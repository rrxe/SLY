import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // جلب أعلى 50 لاعب حسب النقاط
    const { data: players, error } = await supabase
      .from('players')
      .select('telegram_id, points')
      .order('points', { ascending: false })
      .limit(50)

    if (error) throw error

    // تنسيق البيانات لتناسب الواجهة الأمامية
    const formattedLeaderboard = (players || []).map((player, index) => {
      const points = player.points || 0
      
      let tier = 'Common'
      if (points >= 10000) tier = 'Mythic'
      else if (points >= 5000) tier = 'Legendary'
      else if (points >= 1000) tier = 'Epic'

      return {
        rank: index + 1,
        name: `Player_${player.telegram_id ? String(player.telegram_id).slice(-4) : 'User'}`,
        coins: points.toLocaleString(),
        tier
      }
    })

    return res.status(200).json(formattedLeaderboard)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
