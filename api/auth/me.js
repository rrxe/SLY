import { supabase } from '../../lib/supabase.js'
import { authenticateRequest } from '../../lib/telegram-auth.js'

const ENERGY_MAX = 5
const ENERGY_REGEN_MS = 30 * 60 * 1000
const REFERRAL_REWARD_USDT = 0.01
const REFERRAL_REQUIRED_TASKS = 10
const ONLINE_THRESHOLD_MINUTES = 2
const WITHDRAWAL_COOLDOWN_MS = 24 * 60 * 60 * 1000
const REQUIRED_WITHDRAW_ADS = 10

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
      is_banned: false,
      withdrawal_ads_watched: 0,
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

    // لا يتم منح مكافأة الإحالة عند التسجيل.
    // تُمنح فقط بعد إكمال المُحال 10 Tasks.
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

async function processQualifiedReferral(player) {
  if (
    !player?.referred_by ||
    player.referral_reward_claimed === true
  ) {
    return false
  }

  const { data: completions, error: completionsError } = await supabase
    .from('task_completions')
    .select('completion_count')
    .eq('telegram_id', player.telegram_id)

  if (completionsError) {
    throw completionsError
  }

  const completedTasks = (completions || []).reduce((sum, row) => {
    const count = Number(row.completion_count || 0)

    if (!Number.isFinite(count) || count <= 0) {
      return sum
    }

    return sum + Math.trunc(count)
  }, 0)

  if (completedTasks < REFERRAL_REQUIRED_TASKS) {
    return false
  }

  const { data: claimedRows, error: claimError } = await supabase
    .from('players')
    .update({
      referral_reward_claimed: true,
    })
    .eq('telegram_id', player.telegram_id)
    .eq('referral_reward_claimed', false)
    .not('referred_by', 'is', null)
    .select('referred_by')
    .limit(1)

  if (claimError) {
    throw claimError
  }

  const claimed = Array.isArray(claimedRows)
    ? claimedRows[0]
    : null

  if (!claimed?.referred_by) {
    return false
  }

  const { data: referrer, error: referrerError } = await supabase
    .from('players')
    .select('telegram_id, usdt_balance')
    .eq('telegram_id', claimed.referred_by)
    .single()

  if (referrerError || !referrer) {
    await supabase
      .from('players')
      .update({
        referral_reward_claimed: false,
      })
      .eq('telegram_id', player.telegram_id)

    if (referrerError) {
      throw referrerError
    }

    return false
  }

  const newUsdtBalance = Number(
    ((referrer.usdt_balance || 0) + REFERRAL_REWARD_USDT).toFixed(6)
  )

  const { error: rewardError } = await supabase
    .from('players')
    .update({
      usdt_balance: newUsdtBalance,
    })
    .eq('telegram_id', referrer.telegram_id)

  if (rewardError) {
    await supabase
      .from('players')
      .update({
        referral_reward_claimed: false,
      })
      .eq('telegram_id', player.telegram_id)

    throw rewardError
  }

  console.log(
    `[Referral] ${player.telegram_id} qualified after ${completedTasks} tasks. ` +
    `Referrer ${referrer.telegram_id} received ${REFERRAL_REWARD_USDT} USDT.`
  )

  return true
}

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

  const consumedRegenTime = regenerated * ENERGY_REGEN_MS
  let newUpdatedAtMs = updatedAt.getTime() + consumedRegenTime

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

async function touchLastSeen(telegramId) {
  try {
    await supabase
      .from('players')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('telegram_id', telegramId)
  } catch (err) {
    console.error('touchLastSeen error:', err)
  }
}

export default async function handler(req, res) {
  // ==========================================
  // 0. Webhook آمن من AdsGram (Reward URL) - يستدعيه سيرفر AdsGram
  //    مباشرة (server-to-server) بعد ما يتأكدوا المستخدم شاهد
  //    إعلان Reward فعلاً لين النهاية. هذا هو المصدر الوحيد
  //    الموثوق لزيادة عداد withdrawal_ads_watched - الفرونت اند
  //    ما عاد يقدر يزيده مباشرة (كان ثغرة أمنية سابقاً).
  // ==========================================
  if (req.method === 'GET' && req.query.adsgram_reward === '1') {
    const providedSecret = req.query.secret
    const expectedSecret = process.env.ADSGRAM_REWARD_SECRET

    if (!expectedSecret || providedSecret !== expectedSecret) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const telegramId = req.query.userid
    if (!telegramId) {
      return res.status(400).json({ success: false, error: 'Missing userid' })
    }

    try {
      const { data: player, error: fetchError } = await supabase
        .from('players')
        .select('withdrawal_ads_watched')
        .eq('telegram_id', telegramId)
        .single()

      if (fetchError || !player) {
        return res.status(404).json({ success: false, error: 'Player not found' })
      }

      const currentWatched = Number(player.withdrawal_ads_watched || 0)
      const newWatched = Math.min(REQUIRED_WITHDRAW_ADS, currentWatched + 1)

      const { error: updateError } = await supabase
        .from('players')
        .update({ withdrawal_ads_watched: newWatched })
        .eq('telegram_id', telegramId)

      if (updateError) throw updateError

      return res.status(200).json({ success: true, withdrawalAdsWatched: newWatched })
    } catch (err) {
      console.error('adsgram_reward webhook error:', err)
      return res.status(500).json({ success: false, error: err.message })
    }
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
    })
  }

  // ==========================================
  // 1. نظام المشرف (الإدارة والحظر والإحصائيات) المدمج
  // ==========================================
  const adminSecret = req.headers['x-admin-secret']
  
  if (adminSecret && process.env.ADMIN_SECRET && adminSecret === process.env.ADMIN_SECRET) {
    
    if (req.method === 'GET' && req.query.admin === 'users') {
      const { data, error } = await supabase
        .from('players')
        .select('telegram_id, username, coin, is_banned')
        .order('coin', { ascending: false })
        .limit(100)

      if (error) {
        return res.status(500).json({ error: error.message })
      }
      return res.status(200).json({ success: true, users: data || [] })
    }

    if (req.method === 'GET' && req.query.admin === 'stats') {
      const { count: totalPlayers, error: totalError } = await supabase
        .from('players')
        .select('telegram_id', { count: 'exact', head: true })

      if (totalError) {
        return res.status(500).json({ success: false, error: totalError.message })
      }

      const onlineSince = new Date(Date.now() - ONLINE_THRESHOLD_MINUTES * 60 * 1000).toISOString()

      const { count: onlineNow, error: onlineError } = await supabase
        .from('players')
        .select('telegram_id', { count: 'exact', head: true })
        .gte('last_seen_at', onlineSince)

      if (onlineError) {
        return res.status(500).json({ success: false, error: onlineError.message })
      }

      return res.status(200).json({
        success: true,
        totalPlayers: totalPlayers || 0,
        onlineNow: onlineNow || 0,
      })
    }

    if (req.method === 'POST') {
      const { action, targetTelegramId } = req.body || {}
      
      if (action === 'admin_ban' || action === 'admin_unban') {
        if (!targetTelegramId) {
          return res.status(400).json({ error: 'Missing targetTelegramId' })
        }
        
        const isBanned = action === 'admin_ban'
        const updateData = { is_banned: isBanned }
        
        if (isBanned) {
          updateData.coin = 0
        }

        const { error } = await supabase
          .from('players')
          .update(updateData)
          .eq('telegram_id', targetTelegramId)

        if (error) {
          return res.status(500).json({ error: error.message })
        }
        
        return res.status(200).json({ success: true, isBanned })
      }
    }
  }


  // ==========================================
  // 2. نظام اللاعبين العادي (اللعبة الأساسية)
  // ==========================================
  const auth = authenticateRequest(req)

  if (!auth) {
    return res.status(401).json({
      error: 'Invalid or missing Telegram authentication',
    })
  }

  const telegramId = auth.id

  try {
    const player = await getOrCreatePlayer(auth, telegramId)

    await processQualifiedReferral(player)

    if (player.is_banned) {
      return res.status(403).json({
        error: 'ACCOUNT_BANNED',
        message: 'تم حظر حسابك بسبب استخدام سكربتات أو طرق غير مشروعة.'
      })
    }

    touchLastSeen(telegramId)

    /*
     * CONSUME ENERGY
     */
    if (req.method === 'POST') {
      const { action } = req.body || {}

      if (action === 'consume_energy') {
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
     * GET PLAYER DATA
     */
    const energyState = await regenerateEnergy(player)
    let claimedToday = false

    if (player.last_checkin) {
      claimedToday = isSameUtcDay(
        new Date(player.last_checkin),
        new Date()
      )
    }

    const { count: referralsCount } = await supabase
      .from('players')
      .select('telegram_id', {
        count: 'exact',
        head: true,
      })
      .eq('referred_by', telegramId)
      .eq('referral_reward_claimed', true)

    let nextWithdrawalAvailableAt = null
    if (player.last_withdrawal_at) {
      const nextTime = new Date(player.last_withdrawal_at).getTime() + WITHDRAWAL_COOLDOWN_MS
      if (nextTime > Date.now()) {
        nextWithdrawalAvailableAt = new Date(nextTime).toISOString()
      }
    }

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

      withdrawalAdsWatched: player.withdrawal_ads_watched || 0,
      withdrawalAdsRequired: REQUIRED_WITHDRAW_ADS,
      nextWithdrawalAvailableAt,
    })
  } catch (err) {
    console.error('auth/me error:', err)

    return res.status(500).json({
      error: err.message,
    })
  }
}
