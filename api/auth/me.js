import { supabase } from '../../lib/supabase.js'
import { authenticateRequest } from '../../lib/telegram-auth.js'

// هذا الملف كان ناقص بالكامل من مشروعك، وهو سبب أساسي إن صفحة Referrals
// ما تطلع (كانت تسوي fetch على /api/auth/me وترجع 404 دائماً).
// نفس الشي يستخدمه App.tsx لجلب رصيد اللاعب الحقيقي بدل الأرقام الوهمية
// اللي كانت مخزنة بالـ localStorage بالمتصفح.

const ENERGY_MAX = 5

function isSameUtcDay(dateA, dateB) {
  return (
    dateA.getUTCFullYear() === dateB.getUTCFullYear() &&
    dateA.getUTCMonth() === dateB.getUTCMonth() &&
    dateA.getUTCDate() === dateB.getUTCDate()
  )
}

async function getOrCreatePlayer(auth, telegramId) {
  let { data: player, error } = await supabase
    .from('players')
    .select('*')
    .eq('telegram_id', telegramId)
    .single()

  if (error && error.code !== 'PGRST116') throw error

  if (!player) {
    // لاعب جديد -> يبدأ دائماً برصيد 0 عملة و 0 USDT (حسب طلبك)
    const newPlayerPayload = {
      telegram_id: telegramId,
      username: auth.username,
      coin: 0,
      usdt_balance: 0,
      energy: ENERGY_MAX,
      energy_updated_at: new Date().toISOString(),
    }

    // ربط الإحالة: لو دخل عن طريق رابط صديق start_param = ref_<telegram_id>
    let referrerId = null
    if (auth.startParam && auth.startParam.startsWith('ref_')) {
      const candidate = auth.startParam.replace('ref_', '')
      if (candidate && String(candidate) !== String(telegramId)) {
        referrerId = candidate
        newPlayerPayload.referred_by = candidate
      }
    }

    const { data: created, error: insertError } = await supabase
      .from('players')
      .insert([newPlayerPayload])
      .select()
      .single()

    if (insertError) throw insertError
    player = created

    // مكافأة 500 عملة للمُحيل عند أول إحالة ناجحة
    if (referrerId) {
      const { data: referrer } = await supabase
        .from('players')
        .select('coin')
        .eq('telegram_id', referrerId)
        .single()

      if (referrer) {
        await supabase
          .from('players')
          .update({ coin: (referrer.coin || 0) + 500 })
          .eq('telegram_id', referrerId)
      }
    }
  } else if (auth.username && auth.username !== player.username) {
    await supabase
      .from('players')
      .update({ username: auth.username })
      .eq('telegram_id', telegramId)

    player.username = auth.username
  }

  return player
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const auth = authenticateRequest(req)
  if (!auth) {
    return res.status(401).json({
      error: 'Invalid or missing Telegram authentication',
    })
  }

  const telegramId = auth.id

  try {
    if (req.method === 'POST') {
      const { action } = req.body || {}

      if (action === 'consume_energy') {
        const player = await getOrCreatePlayer(auth, telegramId)

        const currentEnergy = Number(player.energy ?? ENERGY_MAX)

        if (!Number.isFinite(currentEnergy) || currentEnergy <= 0) {
          return res.status(400).json({
            error: 'Not enough energy',
            energy: 0,
            energyMax: ENERGY_MAX,
          })
        }

        const newEnergy = currentEnergy - 1

        const { data: updated, error: updateError } = await supabase
          .from('players')
          .update({
            energy: newEnergy,
            energy_updated_at: new Date().toISOString(),
          })
          .eq('telegram_id', telegramId)
          .select('energy')
          .single()

        if (updateError) throw updateError

        return res.status(200).json({
          success: true,
          energy: updated.energy ?? newEnergy,
          energyMax: ENERGY_MAX,
        })
      }

      return res.status(400).json({ error: 'Unknown action' })
    }

    const player = await getOrCreatePlayer(auth, telegramId)

    // حالة تسجيل الحضور اليومي
    let claimedToday = false
    if (player.last_checkin) {
      claimedToday = isSameUtcDay(new Date(player.last_checkin), new Date())
    }

    // عدد الأشخاص اللي دخلوا برابط إحالة هذا اللاعب
    const { count: referralsCount } = await supabase
      .from('players')
      .select('telegram_id', { count: 'exact', head: true })
      .eq('referred_by', telegramId)

    return res.status(200).json({
      telegramId: String(player.telegram_id),
      username: player.username,
      coins: player.coin || 0,
      usdtBalance: player.usdt_balance || 0,
      walletAddress: player.wallet_address || null,
      streak: player.streak || 0,
      claimedToday,
      referralsCount: referralsCount || 0,
      energy: player.energy ?? ENERGY_MAX,
      energyUpdatedAt: player.energy_updated_at || null,
    })
  } catch (err) {
    console.error('auth/me error:', err)
    return res.status(500).json({ error: err.message })
  }
}
