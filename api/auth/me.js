import { supabase } from '../../lib/supabase.js'
import { authenticateRequest } from '../../lib/telegram-auth.js'

const ENERGY_MAX = 5
const ENERGY_REGEN_MS = 30 * 60 * 1000

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
    const newPlayerPayload = {
      telegram_id: telegramId,
      username: auth.username,
      coin: 0,
      usdt_balance: 0,
      energy: ENERGY_MAX,
      energy_updated_at: new Date().toISOString(),
    }

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
          .update({
            coin: (referrer.coin || 0) + 500,
          })
          .eq('telegram_id', referrerId)
      }
    }
  } else if (auth.username && auth.username !== player.username) {
    await supabase
      .from('players')
      .update({
        username: auth.username,
      })
      .eq('telegram_id', telegramId)

    player.username = auth.username
  }

  return player
}

/**
 * يحسب الطاقة المسترجعة من الوقت الذي مر.
 *
 * كل 30 دقيقة = +1 Energy
 * الحد الأقصى = 5
 */
async function regenerateEnergy(player) {
  let energy = Number(player.energy ?? ENERGY_MAX)

  if (!Number.isFinite(energy)) {
    energy = ENERGY_MAX
  }

  energy = Math.max(0, Math.min(ENERGY_MAX, Math.floor(energy)))

  let updatedAt = player.energy_updated_at
    ? new Date(player.energy_updated_at)
    : new Date()

  if (Number.isNaN(updatedAt.getTime())) {
    updatedAt = new Date()
  }

  const now = new Date()

  // إذا الطاقة ممتلئة، ما نحتاج نحسب Regen
  if (energy >= ENERGY_MAX) {
    if (!player.energy_updated_at) {
      await supabase
        .from('players')
        .update({
          energy: ENERGY_MAX,
          energy_updated_at: now.toISOString(),
        })
        .eq('telegram_id', player.telegram_id)
    }

    return {
      energy: ENERGY_MAX,
      energyUpdatedAt: updatedAt.toISOString(),
    }
  }

  const elapsedMs = Math.max(0, now.getTime() - updatedAt.getTime())
  const regenerated = Math.floor(elapsedMs / ENERGY_REGEN_MS)

  if (regenerated <= 0) {
    return {
      energy,
      energyUpdatedAt: updatedAt.toISOString(),
    }
  }

  const newEnergy = Math.min(
    ENERGY_MAX,
    energy + regenerated
  )

  /*
   * نحافظ على الوقت المتبقي الجزئي.
   *
   * مثال:
   * مرّت 65 دقيقة
   * يرجع +2
   * ويبقى 5 دقائق محسوبة للـ Energy القادمة.
   */
  const consumedRegenTime = regenerated * ENERGY_REGEN_MS

  let newUpdatedAtMs =
    updatedAt.getTime() + consumedRegenTime

  // إذا وصلنا للـ 5/5 نبدأ عداد جديد من الآن
  if (newEnergy >= ENERGY_MAX) {
    newUpdatedAtMs = now.getTime()
  }

  const newUpdatedAt = new Date(newUpdatedAtMs)

  const { error: updateError } = await supabase
    .from('players')
    .update({
      energy: newEnergy,
      energy_updated_at: newUpdatedAt.toISOString(),
    })
    .eq('telegram_id', player.telegram_id)

  if (updateError) throw updateError

  return {
    energy: newEnergy,
    energyUpdatedAt: newUpdatedAt.toISOString(),
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
    })
  }

  const auth = authenticateRequest(req)

  if (!auth) {
    return res.status(401).json({
      error: 'Invalid or missing Telegram authentication',
    })
  }

  const telegramId = auth.id

  try {
    /*
     * =========================
     * CONSUME ENERGY
     * =========================
     */
    if (req.method === 'POST') {
      const { action } = req.body || {}

      if (action === 'consume_energy') {
        const player = await getOrCreatePlayer(
          auth,
          telegramId
        )

        // أولاً نرجع أي Energy مستحقة بسبب مرور الوقت
        const regenerated = await regenerateEnergy(player)

        const currentEnergy = regenerated.energy

        if (currentEnergy <= 0) {
          return res.status(400).json({
            error: 'Not enough energy',
            energy: 0,
            energyMax: ENERGY_MAX,
            energyRegenMinutes: 30,
          })
        }

        const newEnergy = currentEnergy - 1

        /*
         * بعد الخصم نبدأ/نكمل عداد الـ 30 دقيقة
         * من وقت الخصم الحالي.
         */
        const now = new Date()

        const { data: updated, error: updateError } =
          await supabase
            .from('players')
            .update({
              energy: newEnergy,
              energy_updated_at: now.toISOString(),
            })
            .eq('telegram_id', telegramId)
            .select('energy, energy_updated_at')
            .single()

        if (updateError) throw updateError

        return res.status(200).json({
          success: true,
          energy: updated.energy ?? newEnergy,
          energyMax: ENERGY_MAX,
          energyRegenMinutes: 30,
          energyUpdatedAt: updated.energy_updated_at,
        })
      }

      return res.status(400).json({
        error: 'Unknown action',
      })
    }

    /*
     * =========================
     * GET PLAYER DATA
     * =========================
     */
    const player = await getOrCreatePlayer(
      auth,
      telegramId
    )

    // تحديث الطاقة تلقائياً حسب الوقت الذي مر
    const energyState = await regenerateEnergy(player)

    // حالة تسجيل الحضور اليومي
    let claimedToday = false

    if (player.last_checkin) {
      claimedToday = isSameUtcDay(
        new Date(player.last_checkin),
        new Date()
      )
    }

    // عدد الأشخاص الذين دخلوا برابط إحالة هذا اللاعب
    const { count: referralsCount } = await supabase
      .from('players')
      .select('telegram_id', {
        count: 'exact',
        head: true,
      })
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

      energy: energyState.energy,
      energyMax: ENERGY_MAX,
      energyUpdatedAt: energyState.energyUpdatedAt,
      energyRegenMinutes: 30,
    })
  } catch (err) {
    console.error('auth/me error:', err)

    return res.status(500).json({
      error: err.message,
    })
  }
}
