import { supabase } from '../lib/supabase.js'

// أي طلب جاي بـ header x-admin-secret صحيح يتعامل معه كطلب أدمن
function isAdminRequest(req) {
  const secret = req.headers['x-admin-secret']
  return Boolean(secret && process.env.ADMIN_SECRET && secret === process.env.ADMIN_SECRET)
}

// اللوحة القديمة (الأكثر عملات) - ما تغيرت
async function handleCoinLeaderboard(req, res) {
  const { data: players, error } = await supabase
    .from('players')
    .select('telegram_id, username, coin')
    .order('coin', { ascending: false })
    .limit(10)

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
}

// لوحة "Stars" العامة: أعلى 10 حسب الوقت المتراكم هذا الأسبوع (weekly_time_seconds)
// + ترتيب المستخدم الحالي (me) حتى لو مو ضمن أعلى 10، عن طريق عد
// كم لاعب عنده وقت أكبر منه.
async function handleStarsLeaderboard(req, res) {
  const { data: players, error } = await supabase
    .from('players')
    .select('telegram_id, username, photo_url, weekly_time_seconds')
    .order('weekly_time_seconds', { ascending: false })
    .limit(10)

  if (error) throw error

  const formatted = (players || []).map((player, index) => {
    const seconds = player.weekly_time_seconds || 0

    return {
      rank: index + 1,
      telegramId: String(player.telegram_id),
      name: player.username ? `@${player.username}` : `Player_${String(player.telegram_id).slice(-4)}`,
      photoUrl: player.photo_url || null,
      minutes: Math.floor(seconds / 60),
      seconds,
    }
  })

  let me = null

  const requestedTelegramId =
    req.query.telegramId
      ? String(req.query.telegramId)
      : null

  if (requestedTelegramId) {
    const inTop = formatted.find(
      (p) => p.telegramId === requestedTelegramId
    )

    if (inTop) {
      me = inTop
    } else {
      const { data: meRow, error: meError } = await supabase
        .from('players')
        .select('telegram_id, username, photo_url, weekly_time_seconds')
        .eq('telegram_id', requestedTelegramId)
        .maybeSingle()

      if (!meError && meRow) {
        const mySeconds = meRow.weekly_time_seconds || 0

        const { count: aheadCount, error: countError } = await supabase
          .from('players')
          .select('telegram_id', { count: 'exact', head: true })
          .gt('weekly_time_seconds', mySeconds)

        if (!countError) {
          me = {
            rank: (aheadCount || 0) + 1,
            telegramId: String(meRow.telegram_id),
            name: meRow.username ? `@${meRow.username}` : `Player_${String(meRow.telegram_id).slice(-4)}`,
            photoUrl: meRow.photo_url || null,
            minutes: Math.floor(mySeconds / 60),
            seconds: mySeconds,
          }
        }
      }
    }
  }

  return res.status(200).json({ list: formatted, me })
}

// نسخة الأدمن: قائمة أطول (لعرضها بلوحة admin.html) - محمية بـ x-admin-secret
async function handleStarsAdminList(req, res) {
  const { data: players, error } = await supabase
    .from('players')
    .select('telegram_id, username, weekly_time_seconds')
    .order('weekly_time_seconds', { ascending: false })
    .limit(500)

  if (error) throw error

  return res.status(200).json({ success: true, players: players || [] })
}

// تصفير وقت الأسبوع لكل اللاعبين (يستدعيها الأدمن يدوياً بعد ما يوزع الجوائز)
async function handleResetWeeklyTime(req, res) {
  const { error } = await supabase
    .from('players')
    .update({
      weekly_time_seconds: 0,
      weekly_time_last_ping: new Date().toISOString(),
    })
    .gte('telegram_id', 0)

  if (error) throw error

  return res.status(200).json({ success: true })
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      if (req.query.type === 'stars') {
        if (req.query.admin === '1') {
          if (!isAdminRequest(req)) {
            return res.status(401).json({ error: 'Unauthorized' })
          }
          return await handleStarsAdminList(req, res)
        }

        return await handleStarsLeaderboard(req, res)
      }

      return await handleCoinLeaderboard(req, res)
    }

    if (req.method === 'POST') {
      if (!isAdminRequest(req)) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const action = req.body && req.body.action

      if (action === 'reset_weekly_time') {
        return await handleResetWeeklyTime(req, res)
      }

      return res.status(400).json({ error: 'Unknown action' })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
