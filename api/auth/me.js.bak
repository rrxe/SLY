import crypto from 'node:crypto'
import { supabase } from '../../lib/supabase.js'
import { authenticateRequest } from '../../lib/telegram-auth.js'
import { getAppSettings } from '../../lib/settings.js'

const ENERGY_MAX = 5
const ENERGY_REGEN_MS = 30 * 60 * 1000
const ONLINE_THRESHOLD_MINUTES = 2

const BASE_WITHDRAW_ADS = 10
const EXTRA_ADS_PER_WITHDRAWAL = 10

function isSameUtcDay(dateA, dateB) {
  return (
    dateA.getUTCFullYear() === dateB.getUTCFullYear() &&
    dateA.getUTCMonth() === dateB.getUTCMonth() &&
    dateA.getUTCDate() === dateB.getUTCDate()
  )
}

function getTodayBaghdad() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Baghdad',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

// نستخرج IP الحقيقي تبع المستخدم من هيدرز فيرسل. x-forwarded-for
// ممكن تحتوي أكثر من IP مفصولة بفاصلة (سلسلة البروكسيات) - أول وحدة
// هي عنوان المستخدم الحقيقي.
function normalizeIp(value) {
  if (!value) return null

  const ip = String(value).trim()

  if (!ip || ip.length > 120) {
    return null
  }

  if (ip.startsWith('::ffff:')) {
    return ip.slice(7)
  }

  return ip
}

function getClientIp(req) {
  const realIp =
    normalizeIp(
      req.headers['x-real-ip']
    )

  if (realIp) {
    return realIp
  }

  const forwarded =
    req.headers['x-forwarded-for']

  if (forwarded) {
    const first =
      String(forwarded)
        .split(',')[0]
        .trim()

    const normalized =
      normalizeIp(first)

    if (normalized) {
      return normalized
    }
  }

  return normalizeIp(
    req.socket?.remoteAddress
  )
}

// معرّف الجهاز يوصلنا من الواجهة عبر هيدر X-Device-Id (مولّد ومخزّن
// بـ localStorage تبع الـ WebView - يبقى ثابت حتى لو تغيرت الشبكة أو
// حساب تيليجرام على نفس الجهاز).

function getSecuritySalt() {
  const salt =
    process.env.ANTI_ABUSE_SALT

  if (!salt) {
    throw new Error(
      'ANTI_ABUSE_SALT is not configured'
    )
  }

  return salt
}

function hashSecurityValue(value) {
  if (!value) return null

  return crypto
    .createHash('sha256')
    .update(
      `${getSecuritySalt()}::${String(value)}`,
      'utf8'
    )
    .digest('hex')
}

function getUserAgentHash(req) {
  const userAgent =
    req.headers['user-agent']

  if (!userAgent) return null

  return hashSecurityValue(
    String(userAgent)
  )
}

function appendSecurityHistory(
  history,
  value,
  limit = 20
) {
  const current =
    Array.isArray(history)
      ? history.filter(Boolean)
      : []

  if (!value) {
    return current.slice(-limit)
  }

  const next =
    current.filter(
      item => item !== value
    )

  next.push(value)

  return next.slice(-limit)
}

function getDeviceId(req) {
  const deviceId = req.headers['x-device-id']
  if (!deviceId) return null

  const trimmed = String(deviceId).trim()
  return trimmed.length > 0 && trimmed.length <= 200 ? trimmed : null
}

function getRequiredWithdrawalAds(withdrawalsToday) {
  const count = Number(withdrawalsToday || 0)

  if (!Number.isFinite(count) || count <= 0) {
    return BASE_WITHDRAW_ADS
  }

  return (
    BASE_WITHDRAW_ADS +
    Math.trunc(count) * EXTRA_ADS_PER_WITHDRAWAL
  )
}

async function getWithdrawalDailyState(player) {
  const today = getTodayBaghdad()

  let withdrawalsToday = Number(
    player.withdrawals_today || 0
  )

  if (
    !Number.isFinite(withdrawalsToday) ||
    withdrawalsToday < 0
  ) {
    withdrawalsToday = 0
  }

  withdrawalsToday = Math.trunc(
    withdrawalsToday
  )

  let withdrawalCountDate =
    player.withdrawal_count_date || today

  if (
    withdrawalCountDate !== today
  ) {
    withdrawalsToday = 0
    withdrawalCountDate = today

    const { error } = await supabase
      .from('players')
      .update({
        withdrawals_today: 0,
        withdrawal_count_date: today,
      })
      .eq(
        'telegram_id',
        player.telegram_id
      )

    if (error) {
      throw error
    }
  }

  return {
    withdrawalsToday,
    withdrawalCountDate,
    withdrawalAdsRequired:
      getRequiredWithdrawalAds(
        withdrawalsToday
      ),
  }
}


function getMiningState(player, settings) {
  const active = player.mining_active === true

  const startedAt =
    player.mining_started_at
      ? new Date(player.mining_started_at)
      : null

  const startedAtMs =
    startedAt &&
    !Number.isNaN(startedAt.getTime())
      ? startedAt.getTime()
      : null

  const miningCycleMs =
    settings.miningCycleHours *
    60 *
    60 *
    1000

  const claimAvailableAtMs =
    startedAtMs !== null
      ? startedAtMs + miningCycleMs
      : null

  const now = Date.now()

  const claimReady =
    active &&
    claimAvailableAtMs !== null &&
    now >= claimAvailableAtMs

  return {
    active,
    reward: settings.miningRewardCoins,
    cycleHours: settings.miningCycleHours,
    startedAt:
      startedAt
        ? startedAt.toISOString()
        : null,
    claimAvailableAt:
      claimAvailableAtMs !== null
        ? new Date(
            claimAvailableAtMs
          ).toISOString()
        : null,
    claimReady,
    startAdVerified:
      player.mining_start_ad_verified === true,
    claimAdVerified:
      player.mining_claim_ad_verified === true,
  }
}

async function getOrCreatePlayer(auth, telegramId, req) {
  let { data: player, error } = await supabase
    .from('players')
    .select('*')
    .eq('telegram_id', telegramId)
    .single()

  if (error && error.code !== 'PGRST116') throw error


  if (!player) {
    const signupIp =
      getClientIp(req)

    const signupDeviceId =
      getDeviceId(req)

    const signupIpHash =
      hashSecurityValue(
        signupIp
      )

    const signupDeviceHash =
      hashSecurityValue(
        signupDeviceId
      )

    const signupUaHash =
      getUserAgentHash(req)

    const newPlayerPayload = {
      telegram_id: telegramId,
      username: auth.username,
      coin: 0,
      usdt_balance: 0,
      energy: ENERGY_MAX,
      energy_updated_at: new Date().toISOString(),
      is_banned: false,
      withdrawal_ads_watched: 0,
      withdrawals_today: 0,
      withdrawal_count_date: getTodayBaghdad(),
      mining_active: false,
      mining_started_at: null,
      mining_ad_intent: null,
      mining_start_ad_verified: false,
      mining_claim_ad_verified: false,
      photo_url:
        auth.photoUrl || null,
      weekly_time_seconds: 0,
      weekly_time_last_ping:
        new Date().toISOString(),
      signup_ip:
        signupIp,

      signup_device_id:
        signupDeviceId,

      security_ip_hash:
        signupIpHash,

      security_device_hash:
        signupDeviceHash,

      security_ua_hash:
        signupUaHash,

      security_last_seen_at:
        new Date().toISOString(),

      security_ip_history:
        signupIpHash
          ? [signupIpHash]
          : [],

      is_duplicate_device:
        false,
    }

    let referrerId = null

    if (
      auth.startParam &&
      auth.startParam.startsWith('ref_')
    ) {
      const candidate =
        auth.startParam.replace(
          'ref_',
          ''
        )

      if (
        candidate &&
        String(candidate) !== String(telegramId)
      ) {
        referrerId = candidate
        newPlayerPayload.referred_by =
          candidate
      }
    }

    let duplicateFound = false

    // Primary: device ID. هذا أوثق مؤشر لأنه ثابت بجهاز
    // المستخدم نفسه (localStorage) وما يتأثر بمشاركة الشبكة.
    if (signupDeviceHash) {
      const {
        data: sameDeviceRows,
        error: sameDeviceError,
      } = await supabase
        .from('players')
        .select('telegram_id')
        .eq(
          'security_device_hash',
          signupDeviceHash
        )
        .limit(1)

      if (sameDeviceError) {
        throw sameDeviceError
      }

      if (
        sameDeviceRows &&
        sameDeviceRows.length > 0
      ) {
        duplicateFound = true
      }
    }

    // Secondary: نفس الـ IP + نفس الـ User-Agent مع بعض بنفس
    // الوقت. IP وحده مو كافي أبداً - أكو ناس كثيرة تشترك بنفس
    // الـ IP عبر شبكة الموبايل (Carrier-grade NAT) أو نفس الراوتر
    // بالبيت، وهذا كان يسبب حظر حسابات ناس مو سواة تعدد فعلاً.
    // فنطلب تطابق IP و User-Agent مع بعض حتى يصير المؤشر أقوى.
    if (
      !duplicateFound &&
      signupIpHash &&
      signupUaHash
    ) {
      const {
        data: sameIpUaRows,
        error: sameIpUaError,
      } = await supabase
        .from('players')
        .select('telegram_id')
        .eq(
          'security_ip_hash',
          signupIpHash
        )

        .eq(
          'security_ua_hash',
          signupUaHash
        )
        .limit(1)

      if (sameIpUaError) {
        throw sameIpUaError
      }

      if (
        sameIpUaRows &&
        sameIpUaRows.length > 0
      ) {
        duplicateFound = true
      }
    }

    if (duplicateFound) {
      newPlayerPayload.is_duplicate_device =
        true

      delete newPlayerPayload.referred_by

      referrerId = null
    }

    const {
      data: created,
      error: insertError,
    } = await supabase
      .from('players')
      .insert([
        newPlayerPayload,
      ])
      .select()
      .single()

    if (insertError) throw insertError

    player = created

    // لا يتم منح مكافأة الإحالة عند التسجيل.
    // تُمنح فقط بعد إكمال المُحال 5 Tasks.
  } else {
    const currentIp =
      getClientIp(req)

    const currentDeviceId =
      getDeviceId(req)

    const currentIpHash =
      hashSecurityValue(
        currentIp
      )

    const currentDeviceHash =
      hashSecurityValue(
        currentDeviceId
      )

    const currentUaHash =
      getUserAgentHash(req)

    const currentHistory =
      Array.isArray(
        player.security_ip_history
      )
        ? player.security_ip_history
        : []

    const securityUpdate = {
      security_ip_hash:
        currentIpHash ||
        player.security_ip_hash ||
        null,

      security_device_hash:
        currentDeviceHash ||
        player.security_device_hash ||
        null,

      security_ua_hash:
        currentUaHash ||
        player.security_ua_hash ||
        null,

      security_last_seen_at:
        new Date().toISOString(),

      security_ip_history:
        appendSecurityHistory(
          currentHistory,
          currentIpHash
        ),
    }

    const {
      error: securityError,
    } = await supabase
      .from('players')
      .update(
        securityUpdate
      )
      .eq(
        'telegram_id',
        telegramId
      )

    if (securityError) {
      throw securityError
    }

    player.security_ip_hash =
      securityUpdate.security_ip_hash

    player.security_device_hash =
      securityUpdate.security_device_hash

    player.security_ua_hash =
      securityUpdate.security_ua_hash

    player.security_ip_history =
      securityUpdate.security_ip_history

    if (
      auth.username &&
      auth.username !== player.username
    ) {
      await supabase
        .from('players')
        .update({
          username:
            auth.username,
        })
        .eq(
          'telegram_id',
          telegramId
        )


      player.username =
        auth.username
    }
  }

  return player
}

async function processQualifiedReferral(player) {
  const settings = await getAppSettings()
  const REQUIRED_TASKS = settings.referralRequiredTasks

  if (
    !player?.referred_by ||
    player.referral_reward_claimed === true
  ) {
    return false
  }

  const {
    data: completions,
    error: completionsError,
  } = await supabase
    .from('task_completions')
    .select('completion_count')
    .eq(
      'telegram_id',
      player.telegram_id
    )

  if (completionsError) {
    throw completionsError
  }

  const completedTasks =
    (completions || []).reduce(
      (sum, row) => {
        const count =
          Number(
            row.completion_count || 0
          )

        if (
          !Number.isFinite(count) ||
          count <= 0
        ) {
          return sum
        }

        return (
          sum +
          Math.trunc(count)
        )
      },
      0
    )

  if (
    completedTasks <
    REQUIRED_TASKS
  ) {
    return false
  }

  const {
    data: claimedRows,
    error: claimError,
  } = await supabase
    .from('players')
    .update({
      referral_reward_claimed:
        true,
    })
    .eq(
      'telegram_id',
      player.telegram_id
    )
    .eq(
      'referral_reward_claimed',
      false
    )
    .not(
      'referred_by',
      'is',
      null
    )
    .select('referred_by')
    .limit(1)

  if (claimError) {
    throw claimError
  }

  const claimed =
    Array.isArray(
      claimedRows
    )
      ? claimedRows[0]
      : null

  if (
    !claimed?.referred_by
  ) {
    return false
  }

  const {
    data: referrer,
    error: referrerError,
  } = await supabase
    .from('players')
    .select(
      'telegram_id, usdt_balance'
    )
    .eq(
      'telegram_id',
      claimed.referred_by
    )
    .single()

  if (
    referrerError ||
    !referrer
  ) {
    await supabase
      .from('players')
      .update({
        referral_reward_claimed:
          false,
      })
      .eq(
        'telegram_id',
        player.telegram_id
      )

    if (referrerError) {
      throw referrerError
    }

    return false
  }

  const newUsdtBalance =
    Number(
      (
        Number(
          referrer.usdt_balance ||
            0
        ) +
        settings.referralRewardUsdt
      ).toFixed(6)
    )

  const {
    error: rewardError,
  } = await supabase
    .from('players')
    .update({
      usdt_balance:
        newUsdtBalance,
    })
    .eq(
      'telegram_id',
      referrer.telegram_id
    )

  if (rewardError) {
    await supabase
      .from('players')
      .update({
        referral_reward_claimed:
          false,
      })
      .eq(
        'telegram_id',
        player.telegram_id
      )

    throw rewardError
  }

  console.log(
    `[Referral] ${player.telegram_id} qualified with ${completedTasks} tasks`
  )

  return true
}

async function regenerateEnergy(player) {
  let energy =
    Number(
      player.energy ??
        ENERGY_MAX
    )

  if (
    !Number.isFinite(energy)
  ) {
    energy =
      ENERGY_MAX
  }

  energy = Math.max(
    0,
    Math.min(
      ENERGY_MAX,
      Math.floor(energy)
    )
  )

  let updatedAt =
    player.energy_updated_at
      ? new Date(
          player.energy_updated_at
        )
      : new Date()

  if (
    Number.isNaN(
      updatedAt.getTime()
    )
  ) {
    updatedAt =
      new Date()
  }

  const now =
    new Date()

  if (
    energy >=
    ENERGY_MAX
  ) {
    if (
      !player.energy_updated_at
    ) {

      await supabase
        .from('players')
        .update({
          energy:
            ENERGY_MAX,
          energy_updated_at:
            now.toISOString(),
        })
        .eq(
          'telegram_id',
          player.telegram_id
        )
    }

    return {
      energy:
        ENERGY_MAX,
      energyUpdatedAt:
        updatedAt.toISOString(),
    }
  }

  const elapsedMs =
    Math.max(
      0,
      now.getTime() -
        updatedAt.getTime()
    )

  const regenerated =
    Math.floor(
      elapsedMs /
        ENERGY_REGEN_MS
    )

  if (
    regenerated <= 0
  ) {
    return {
      energy,
      energyUpdatedAt:
        updatedAt.toISOString(),
    }
  }

  const newEnergy =
    Math.min(
      ENERGY_MAX,
      energy +
        regenerated
    )

  const consumedRegenTime =
    regenerated *
    ENERGY_REGEN_MS

  let newUpdatedAtMs =
    updatedAt.getTime() +
    consumedRegenTime


  if (
    newEnergy >=
    ENERGY_MAX
  ) {
    newUpdatedAtMs =
      now.getTime()
  }

  const newUpdatedAt =
    new Date(
      newUpdatedAtMs
    )

  const {
    error: updateError,
  } = await supabase
    .from('players')
    .update({
      energy:
        newEnergy,
      energy_updated_at:
        newUpdatedAt.toISOString(),
    })
    .eq(
      'telegram_id',
      player.telegram_id
    )

  if (updateError) {
    throw updateError
  }

  return {
    energy:
      newEnergy,
    energyUpdatedAt:
      newUpdatedAt.toISOString(),
  }
}

// نحدّث last_seen_at بس (لتتبع "أونلاين الآن"). احتساب وقت مسابقة
// Stars ما عاد يعتمد على فرق الوقت بين نبضتين - صار مرتبط مباشرة
// بظهور الإعلان التلقائي كل 40 ثانية (شوف action: 'credit_ad_time'
// تحت بالـ POST handler)، عشان الوقت المحسوب يعكس إعلان انعرض فعلاً.
import {
  extractChannelChatId,
  getChannelMembershipStatus,
  isConfirmedNotJoined,
} from '../../lib/telegram-membership.js'

const CHANNEL_JOIN_PENALTY_COINS = 1000

async function recheckJoinChannelTasks(telegramId) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN

  if (!botToken) return { leftChannelTaskIds: [] }

  const { data: joinTasks, error: tasksError } = await supabase
    .from('tasks')
    .select('id, url')
    .eq('task_type', 'join_channel')

  if (tasksError || !joinTasks || joinTasks.length === 0) {
    return { leftChannelTaskIds: [] }
  }

  const joinTaskIds = joinTasks.map((t) => t.id)

  const { data: completions, error: completionsError } = await supabase
    .from('task_completions')
    .select('task_id, completion_count')
    .eq('telegram_id', telegramId)
    .in('task_id', joinTaskIds)
    .gt('completion_count', 0)

  if (completionsError || !completions || completions.length === 0) {
    return { leftChannelTaskIds: [] }
  }

  const taskById = {}
  for (const t of joinTasks) taskById[t.id] = t

  const leftChannelTaskIds = []

  for (const completion of completions) {
    const task = taskById[completion.task_id]
    if (!task) continue

    const channelChatId = extractChannelChatId(task.url)
    if (!channelChatId) continue

    const membership = await getChannelMembershipStatus(
      botToken,
      channelChatId,
      telegramId
    )

    if (!membership.ok) continue
    if (!isConfirmedNotJoined(membership.status)) continue

    leftChannelTaskIds.push(task.id)
  }

  if (leftChannelTaskIds.length === 0) {
    return { leftChannelTaskIds: [] }
  }

  const totalPenalty =
    CHANNEL_JOIN_PENALTY_COINS * leftChannelTaskIds.length

  const { data: freshPlayer } = await supabase
    .from('players')
    .select('coin')
    .eq('telegram_id', telegramId)
    .single()

  const currentCoins = Number(freshPlayer?.coin || 0)
  const newCoins = Math.max(0, currentCoins - totalPenalty)

  await supabase
    .from('players')
    .update({ coin: newCoins })
    .eq('telegram_id', telegramId)

  await supabase
    .from('task_completions')
    .update({ completion_count: 0, opened_at: null })
    .eq('telegram_id', telegramId)
    .in('task_id', leftChannelTaskIds)

  return { leftChannelTaskIds, newCoins }
}

const STARS_CYCLE_DURATION_MS = 2 * 60 * 60 * 1000
const STARS_ADS_PER_CYCLE = 12

async function applyStarsCycleCredit(player, telegramId) {
  const cycleStartedAt =
    player.stars_cycle_started_at
      ? new Date(player.stars_cycle_started_at)
      : null

  if (!cycleStartedAt || Number.isNaN(cycleStartedAt.getTime())) {
    return
  }

  const elapsedMs = Date.now() - cycleStartedAt.getTime()

  const cappedElapsedSeconds = Math.min(
    Math.floor(Math.max(0, elapsedMs) / 1000),
    STARS_CYCLE_DURATION_MS / 1000
  )

  const alreadyCredited = player.stars_cycle_credited_seconds || 0
  const delta = cappedElapsedSeconds - alreadyCredited
  const cycleFinished = elapsedMs >= STARS_CYCLE_DURATION_MS

  if (delta <= 0 && !cycleFinished) {
    return
  }

  const updates = {
    weekly_time_seconds:
      (player.weekly_time_seconds || 0) + Math.max(0, delta),
    stars_cycle_credited_seconds: cappedElapsedSeconds,
  }

  if (cycleFinished) {
    updates.stars_cycle_started_at = null
    updates.stars_ad_batch_count = 0
    updates.stars_cycle_credited_seconds = 0
  }

  const { data: updatedRow, error } = await supabase
    .from('players')
    .update(updates)
    .eq('telegram_id', telegramId)
    .select(
      'weekly_time_seconds, stars_cycle_started_at, stars_ad_batch_count, stars_cycle_credited_seconds'
    )
    .single()

  if (error) {
    console.error('applyStarsCycleCredit failed:', error)
    return
  }

  if (updatedRow) {
    player.weekly_time_seconds = updatedRow.weekly_time_seconds
    player.stars_cycle_started_at = updatedRow.stars_cycle_started_at
    player.stars_ad_batch_count = updatedRow.stars_ad_batch_count
    player.stars_cycle_credited_seconds = updatedRow.stars_cycle_credited_seconds
  }
}

async function touchLastSeen(
  player,
  auth
) {
  try {
    const now = new Date()

    const updatePayload = {
      last_seen_at: now.toISOString(),
      weekly_time_last_ping: now.toISOString(),
    }

    if (auth?.photoUrl) {
      updatePayload.photo_url = auth.photoUrl
    }

    await supabase
      .from('players')
      .update(updatePayload)
      .eq(
        'telegram_id',
        player.telegram_id
      )
  } catch (err) {
    console.error(
      'touchLastSeen error:',
      err
    )
  }
}


async function getMandatorySubscriptionStatus(
  telegramId
) {
  const {
    data: channels,
    error,
  } = await supabase
    .from('mandatory_channels')
    .select(
      'id, title, channel_url, chat_id'
    )
    .eq(
      'is_active',
      true
    )
    .order(
      'sort_order',
      {
        ascending: true,
      }
    )
    .order(
      'created_at',
      {
        ascending: true,
      }
    )

  if (error) {
    throw error
  }

  if (
    !channels ||
    channels.length === 0
  ) {
    return {
      required: false,
      verified: true,
      channels: [],
      missing: [],
    }
  }

  const botToken =
    process.env.BOT_TOKEN ||
    process.env.TELEGRAM_BOT_TOKEN

  if (!botToken) {
    throw new Error(
      'BOT_TOKEN is not configured'
    )
  }

  const results = []
  const missing = []

  for (
    const channel
    of channels
  ) {
    let joined = false

    try {
      const controller =
        new AbortController()

      const timeoutId =
        setTimeout(
          () =>
            controller.abort(),
          5000
        )

      try {
        const response =
          await fetch(
            `https://api.telegram.org/bot${botToken}/getChatMember`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body: JSON.stringify({
                chat_id:
                  channel.chat_id,

                user_id:
                  Number(
                    telegramId
                  ),
              }),

              signal:
                controller.signal,
            }
          )

        const data =
          await response
            .json()
            .catch(
              () => ({})
            )

        if (
          data?.ok &&
          data?.result
        ) {
          const status =
            String(
              data.result.status ||
                ''
            )

          joined =
            status === 'member' ||
            status === 'administrator' ||
            status === 'creator' ||
            (
              status === 'restricted' &&
              data.result.is_member === true
            )
        }
      } finally {
        clearTimeout(
          timeoutId
        )
      }
    } catch (err) {
      console.error(
        `[MandatorySubscription] Failed checking ${channel.chat_id}:`,
        err
      )

      /*
       * A failed membership check is treated
       * as not verified rather than allowing access.
       */
      joined = false
    }

    const item = {
      id:
        String(channel.id),

      title:
        channel.title,

      url:
        channel.channel_url,

      joined,
    }

    results.push(item)

    if (!joined) {
      missing.push(item)
    }
  }

  return {
    required: true,

    verified:
      missing.length === 0,

    channels:
      results,

    missing:
      missing,
  }
}


export default async function handler(
  req,
  res
) {
  // ==========================================
  // 0. Webhook آمن من AdsGram (Reward URL)
  // ==========================================
  if (
    req.method === 'GET' &&
    req.query.adsgram_reward === '1'
  ) {
    const providedSecret =
      req.query.secret

    const expectedSecret =
      process.env.ADSGRAM_REWARD_SECRET

    if (
      !expectedSecret ||
      providedSecret !==
        expectedSecret
    ) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
    }

    const telegramId =
      req.query.userid

    if (!telegramId) {
      return res.status(400).json({
        success: false,
        error: 'Missing userid',
      })
    }

    try {
      const {
        data: player,
        error: fetchError,
      } = await supabase
        .from('players')
        .select(
          'withdrawal_ads_watched, withdrawals_today, withdrawal_count_date, mining_active, mining_started_at, mining_ad_intent, mining_start_ad_verified, mining_claim_ad_verified, stars_ad_intent, stars_ad_batch_count, stars_cycle_started_at, stars_cycle_credited_seconds'
        )
        .eq(
          'telegram_id',
          telegramId
        )
        .single()

      if (
        fetchError ||
        !player
      ) {
        return res.status(404).json({
          success: false,
          error: 'Player not found',
        })
      }

      const today =
        getTodayBaghdad()

      let withdrawalsToday =
        Number(
          player.withdrawals_today ||
            0
        )

      if (
        !Number.isFinite(
          withdrawalsToday
        ) ||
        withdrawalsToday < 0
      ) {
        withdrawalsToday = 0
      }

      withdrawalsToday =
        Math.trunc(
          withdrawalsToday
        )

      const settings =
        await getAppSettings()

      const miningCycleMs =
        settings.miningCycleHours *
        60 *
        60 *
        1000

      const miningStartedAt =
        player.mining_started_at
          ? new Date(
              player.mining_started_at
            )
          : null

      const miningClaimReady =
        player.mining_active === true &&
        miningStartedAt &&
        !Number.isNaN(
          miningStartedAt.getTime()
        ) &&
        Date.now() >=
          miningStartedAt.getTime() +
            miningCycleMs

      /*
       * Mining AdsGram verification.
       *
       * The client first sets mining_ad_intent.
       * Only the real AdsGram webhook can verify it.
       */
      if (
        player.mining_ad_intent ===
          'start' &&
        player.mining_active !== true &&
        player.mining_start_ad_verified !== true
      ) {
        const {
          error: miningUpdateError,
        } = await supabase
          .from('players')
          .update({
            mining_start_ad_verified:
              true,
            mining_ad_intent:
              null,
          })
          .eq(
            'telegram_id',
            telegramId
          )

        if (miningUpdateError) {
          throw miningUpdateError
        }

        return res.status(200).json({
          success: true,
          type: 'mining_start',
          miningStartAdVerified:
            true,
          mining: true,
        })
      }

      if (
        player.mining_ad_intent ===
          'claim' &&
        player.mining_active === true &&
        miningClaimReady &&
        player.mining_claim_ad_verified !== true
      ) {
        const {
          error: miningUpdateError,
        } = await supabase
          .from('players')
          .update({
            mining_claim_ad_verified:
              true,
            mining_ad_intent:
              null,
          })
          .eq(
            'telegram_id',
            telegramId
          )

        if (miningUpdateError) {
          throw miningUpdateError
        }

        return res.status(200).json({
          success: true,
          type: 'mining_claim',
          miningClaimAdVerified:
            true,
          mining: true,
        })
      }

      /*
       * Stars ads (batch-of-12 → 2h cycle). Checked before the
       * withdrawal fallback, same priority pattern as mining above.
       */
      if (
        player.stars_ad_intent === true
      ) {
        const STARS_ADS_PER_CYCLE = 12
        const currentBatch = Number(
          player.stars_ad_batch_count || 0
        )
        const nextBatch = currentBatch + 1

        const starsUpdates = {
          stars_ad_intent: false,
          stars_ad_verified: true,
        }

        const cycleStarted = nextBatch >= STARS_ADS_PER_CYCLE

        if (cycleStarted) {
          starsUpdates.stars_ad_batch_count = 0
          starsUpdates.stars_cycle_started_at =
            new Date().toISOString()
          starsUpdates.stars_cycle_credited_seconds = 0
        } else {
          starsUpdates.stars_ad_batch_count = nextBatch
        }

        const {
          error: starsUpdateError,
        } = await supabase
          .from('players')
          .update(starsUpdates)
          .eq(
            'telegram_id',
            telegramId
          )

        if (starsUpdateError) {
          throw starsUpdateError
        }

        return res.status(200).json({
          success: true,
          type: 'stars_ad',
          starsAdBatchCount:
            starsUpdates.stars_ad_batch_count,
          cycleStarted,
        })
      }

      /*
       * Existing withdrawal ad logic.
       *
       * Mining ads are handled above and therefore
       * do not increase the withdrawal ad counter.
       */
      if (
        player.withdrawal_count_date !==
        today
      ) {
        withdrawalsToday = 0

        const {
          error: resetError,
        } = await supabase
          .from('players')
          .update({
            withdrawals_today: 0,
            withdrawal_count_date:
              today,
            withdrawal_ads_watched:
              0,
          })
          .eq(
            'telegram_id',
            telegramId
          )

        if (resetError) {
          throw resetError
        }
      }

      const requiredAds =
        getRequiredWithdrawalAds(
          withdrawalsToday
        )

      const currentWatched =
        Number(
          player.withdrawal_ads_watched ||
            0
        )

      const newWatched =
        Math.min(
          requiredAds,
          currentWatched + 1
        )

      const {
        error: updateError,
      } = await supabase
        .from('players')
        .update({
          withdrawal_ads_watched:
            newWatched,
          withdrawal_count_date:
            today,
          withdrawals_today:
            withdrawalsToday,
        })
        .eq(
          'telegram_id',
          telegramId
        )

      if (updateError) {
        throw updateError
      }

      return res.status(200).json({
        success: true,
        type: 'withdrawal',
        withdrawalAdsWatched:
          newWatched,
        withdrawalAdsRequired:
          requiredAds,
        withdrawalsToday,
      })
    } catch (err) {
      console.error(
        'adsgram_reward webhook error:',
        err
      )

      return res.status(500).json({
        success: false,
        error: err.message,
      })
    }
  }

  if (
    req.method !== 'GET' &&
    req.method !== 'POST'
  ) {
    return res.status(405).json({
      error: 'Method not allowed',
    })
  }

  // ==========================================
  // 1. نظام المشرف
  // ==========================================
  const adminSecret =
    req.headers[
      'x-admin-secret'
    ]

  if (
    adminSecret &&
    process.env.ADMIN_SECRET &&
    adminSecret ===
      process.env.ADMIN_SECRET
  ) {
    if (
      req.method === 'GET' &&
      req.query.admin ===
        'users'
    ) {
      const {
        data,
        error,
      } = await supabase
        .from('players')
        .select(
          'telegram_id, username, coin, is_banned, is_duplicate_device, weekly_time_seconds, photo_url'
        )
        .order(
          'coin',
          {
            ascending: false,
          }
        )
        .limit(2000)

      if (error) {
        return res.status(500).json({
          error:
            error.message,
        })
      }

      // نحسب عدد الإحالات لكل لاعب: كم شخص دخل عن طريق رابطه
      // (referralsTotal) وكم منهم أكمل الشرط واستحق المكافأة فعلاً
      // (referralsQualified). استعلام واحد فقط لكل اللاعبين المُحالين
      // بدل ما نسوي استعلام منفصل لكل لاعب بالقائمة (تجنّب N+1).
      const referralTotals = {}
      const referralQualified = {}

      const {
        data: referredRows,
        error: referredError,
      } = await supabase
        .from('players')
        .select('referred_by, referral_reward_claimed')
        .not('referred_by', 'is', null)

      if (!referredError && referredRows) {
        for (const row of referredRows) {
          const key = String(row.referred_by)
          referralTotals[key] = (referralTotals[key] || 0) + 1
          if (row.referral_reward_claimed === true) {
            referralQualified[key] = (referralQualified[key] || 0) + 1
          }
        }
      }

      const usersWithReferrals = (data || []).map((user) => {
        const key = String(user.telegram_id)
        return {
          ...user,
          referralsTotal: referralTotals[key] || 0,
          referralsQualified: referralQualified[key] || 0,
        }
      })

      return res.status(200).json({
        success: true,
        users:
          usersWithReferrals,
      })
    }

    if (
      req.method === 'GET' &&
      req.query.admin ===
        'stats'
    ) {
      const {
        count:
          totalPlayers,
        error:
          totalError,
      } = await supabase
        .from('players')
        .select(
          'telegram_id',
          {
            count: 'exact',
            head: true,
          }
        )

      if (totalError) {
        return res.status(500).json({
          success: false,
          error:
            totalError.message,
        })
      }

      const onlineSince =
        new Date(
          Date.now() -
            ONLINE_THRESHOLD_MINUTES *
              60 *
              1000
        ).toISOString()

      const {
        count: onlineNow,
        error: onlineError,
      } = await supabase
        .from('players')
        .select(
          'telegram_id',
          {
            count: 'exact',
            head: true,
          }
        )
        .gte(
          'last_seen_at',
          onlineSince
        )

      if (onlineError) {
        return res.status(500).json({
          success: false,
          error:
            onlineError.message,
        })
      }

      return res.status(200).json({
        success: true,
        totalPlayers:
          totalPlayers || 0,
        onlineNow:
          onlineNow || 0,
      })
    }

    if (
      req.method === 'POST'
    ) {
      const {
        action,
        targetTelegramId,
      } = req.body || {}

      if (
        action ===
          'admin_ban' ||
        action ===
          'admin_unban'
      ) {
        if (!targetTelegramId) {
          return res.status(400).json({
            error:
              'Missing targetTelegramId',
          })
        }

        const isBanned =
          action ===
          'admin_ban'

        const updateData = {
          is_banned:
            isBanned,
        }

        if (isBanned) {
          updateData.coin = 0
        }

        const {
          error,
        } = await supabase
          .from('players')
          .update(
            updateData
          )
          .eq(
            'telegram_id',
            targetTelegramId
          )

        if (error) {
          return res.status(500).json({
            error:
              error.message,
          })
        }

        return res.status(200).json({
          success: true,
          isBanned,
        })
      }
    }
  }

  // ==========================================
  // 2. نظام اللاعبين العادي
  // ==========================================
  const auth =
    authenticateRequest(
      req
    )

  if (!auth) {
    return res.status(401).json({
      error:
        'Invalid or missing Telegram authentication',
    })
  }

  const telegramId =
    auth.id

  try {
    const player =
      await getOrCreatePlayer(
        auth,
        telegramId,
        req
      )

    const settings =
      await getAppSettings()

    const mandatorySubscription =
      await getMandatorySubscriptionStatus(
        telegramId
      )

    await processQualifiedReferral(
      player
    )

    if (player.is_banned) {
      return res.status(403).json({
        error:
          'ACCOUNT_BANNED',
        message:
          'تم حظر حسابك بسبب استخدام سكربتات أو طرق غير مشروعة.',
      })
    }

    // ملاحظة: is_duplicate_device ما عاد يوقف الحساب بالكامل.
    // منع الإحالة صاير أصلاً وقت التسجيل (referred_by ما ينحفظ
    // للحساب المكرر)، فهذا الحقل هنا يبقى فقط للتوثيق/الإدارة
    // بدون ما يقفل التطبيق بوجه المستخدم.

    let channelRecheck = { leftChannelTaskIds: [] }

    if (req.method === 'GET') {
      channelRecheck = await recheckJoinChannelTasks(telegramId)

      if (typeof channelRecheck.newCoins === 'number') {
        player.coin = channelRecheck.newCoins
      }
    }

    await applyStarsCycleCredit(player, telegramId)

    touchLastSeen(
      player,
      auth
    )

    /*
     * MINING
     */

    if (req.method === 'POST') {
      const {
        action,
      } = req.body || {}

      if (
        action === 'mining_prepare_ad'
      ) {
        const mining =
          getMiningState(player, settings)

        const stage =
          String(
            req.body?.stage || ''
          )


        if (
          stage === 'start'
        ) {
          if (
            mining.active
          ) {
            return res.status(400).json({
              error:
                'Mining is already active',
            })
          }

          if (
            mining.startAdVerified
          ) {
            return res.status(200).json({
              success: true,
              stage: 'start',
              alreadyVerified: true,
            })
          }

          const {
            error: prepareError,
          } = await supabase
            .from('players')
            .update({
              mining_ad_intent:
                'start',
            })
            .eq(
              'telegram_id',
              telegramId
            )
            .eq(
              'mining_active',
              false
            )

          if (prepareError) {
            throw prepareError
          }

          return res.status(200).json({
            success: true,
            stage: 'start',
          })
        }

        if (
          stage === 'claim'
        ) {
          if (
            !mining.active
          ) {
            return res.status(400).json({
              error:
                'Mining is not active',
            })
          }

          if (
            !mining.claimReady
          ) {
            return res.status(400).json({
              error:
                'Mining cycle is not ready yet',
              claimAvailableAt:
                mining.claimAvailableAt,
            })
          }

          if (
            mining.claimAdVerified
          ) {
            return res.status(200).json({
              success: true,
              stage: 'claim',
              alreadyVerified: true,
            })
          }

          const {
            error: prepareError,
          } = await supabase
            .from('players')
            .update({
              mining_ad_intent:
                'claim',
            })
            .eq(
              'telegram_id',
              telegramId
            )
            .eq(
              'mining_active',
              true
            )

          if (prepareError) {
            throw prepareError
          }

          return res.status(200).json({
            success: true,
            stage: 'claim',
          })
        }

        return res.status(400).json({
          error:
            'Invalid mining stage',
        })
      }

      if (
        action ===
        'mining_cancel_ad'
      ) {
        const {
          error: cancelError,
        } = await supabase
          .from('players')
          .update({
            mining_ad_intent:
              null,
          })
          .eq(
            'telegram_id',
            telegramId
          )

        if (cancelError) {
          throw cancelError
        }

        return res.status(200).json({
          success: true,
        })
      }

      if (
        action === 'mining_start'
      ) {
        const {
          data: startedRows,
          error: startError,
        } = await supabase
          .from('players')
          .update({
            mining_active:
              true,
            mining_started_at:
              new Date().toISOString(),
            mining_ad_intent:
              null,
            mining_start_ad_verified:
              false,
            mining_claim_ad_verified:
              false,
          })
          .eq(
            'telegram_id',
            telegramId
          )
          .eq(
            'mining_active',
            false
          )
          .eq(
            'mining_start_ad_verified',
            true
          )
          .select(
            'mining_active, mining_started_at'
          )

        if (startError) {
          throw startError
        }

        if (
          !startedRows ||
          startedRows.length === 0
        ) {
          return res.status(400).json({
            error:
              'Watch the mining ad first',
          })
        }


        const mining =
          getMiningState(
            {
              ...player,
              mining_active:
                true,
              mining_started_at:
                startedRows[0].mining_started_at,
              mining_start_ad_verified:
                false,
              mining_claim_ad_verified:
                false,
            },
            settings
          )

        return res.status(200).json({
          success: true,
          mining,
        })
      }

      if (
        action === 'mining_claim'
      ) {
        const {
          data: result,
          error: claimError,
        } = await supabase.rpc(
          'claim_mining_reward',
          {
            p_telegram_id:
              telegramId,
            p_now:
              new Date().toISOString(),
          }
        )

        if (claimError) {
          throw claimError
        }

        const row =
          Array.isArray(result)
            ? result[0]
            : result

        if (
          !row?.success
        ) {
          return res.status(400).json({
            error:
              'Mining is not ready or the claim ad was not completed',
          })
        }

        return res.status(200).json({
          success: true,
          reward:
            settings.miningRewardCoins,
          coins:
            Number(
              row.new_coins
            ),
          mining: {
            active: false,
            reward:
              settings.miningRewardCoins,
            cycleHours:
              settings.miningCycleHours,
            startedAt: null,
            claimAvailableAt:
              null,
            claimReady:
              false,
            startAdVerified:
              false,
            claimAdVerified:
              false,
          },
        })
      }
    }

    /*
     * CONSUME ENERGY
     */
    if (
      req.method === 'POST'
    ) {
      const {
        action,
      } = req.body || {}

      if (
        action === 'stars_ad_prepare'
      ) {
        const cycleStartedAt =
          player.stars_cycle_started_at
            ? new Date(player.stars_cycle_started_at)
            : null

        const isLocked =
          cycleStartedAt &&
          !Number.isNaN(cycleStartedAt.getTime()) &&
          Date.now() - cycleStartedAt.getTime() < STARS_CYCLE_DURATION_MS

        if (isLocked) {
          return res.status(200).json({
            success: true,
            locked: true,
            batchCount: player.stars_ad_batch_count || 0,
            adsRequired: STARS_ADS_PER_CYCLE,
            cycleUnlocksAt: new Date(
              cycleStartedAt.getTime() + STARS_CYCLE_DURATION_MS
            ).toISOString(),
          })
        }

        // Legacy safety net: if this player still has a stale value in the
        // OLD heartbeat column, never let it leak into the stars cycle.
        if (player.last_ad_time_credit_at && !player.stars_cycle_started_at) {
          // no-op: stars_cycle_started_at is authoritative and independent now
        }

        const currentBatch = player.stars_ad_batch_count || 0

        if (currentBatch >= STARS_ADS_PER_CYCLE) {
          return res.status(400).json({
            error: 'Batch already complete',
          })
        }

        const { error: prepareError } = await supabase
          .from('players')
          .update({ stars_ad_intent: true })
          .eq('telegram_id', telegramId)

        if (prepareError) {
          throw prepareError
        }

        return res.status(200).json({
          success: true,
          locked: false,
          batchCount: currentBatch,
          adsRequired: STARS_ADS_PER_CYCLE,
        })
      }

      if (
        action === 'stars_ad_cancel'
      ) {
        await supabase
          .from('players')
          .update({ stars_ad_intent: false })
          .eq('telegram_id', telegramId)

        return res.status(200).json({ success: true })
      }

      if (
        action === 'stars_ad_ack'
      ) {
        await supabase
          .from('players')
          .update({ stars_ad_verified: false })
          .eq('telegram_id', telegramId)

        return res.status(200).json({ success: true })
      }

      if (
        action ===
        'consume_energy'
      ) {
        const regenerated =
          await regenerateEnergy(
            player
          )

        const currentEnergy =
          regenerated.energy

        if (
          currentEnergy <=
          0
        ) {
          return res.status(400).json({
            error:
              'Not enough energy',
            energy: 0,
            energyMax:
              ENERGY_MAX,
            energyRegenMinutes:
              30,
          })
        }

        const newEnergy =
          currentEnergy - 1

        const now =
          new Date()

        const {
          data: updated,
          error: updateError,
        } =
          await supabase
            .from('players')
            .update({
              energy:
                newEnergy,
              energy_updated_at:
                now.toISOString(),
            })
            .eq(
              'telegram_id',
              telegramId
            )
            .select(
              'energy, energy_updated_at'
            )
            .single()

        if (updateError) {
          throw updateError
        }

        return res.status(200).json({
          success: true,
          energy:
            updated.energy ??
            newEnergy,
          energyMax:
            ENERGY_MAX,
          energyRegenMinutes:
            30,
          energyUpdatedAt:
            updated.energy_updated_at,
        })
      }

      return res.status(400).json({
        error:
          'Unknown action',
      })
    }

    /*
     * GET PLAYER DATA
     */
    const energyState =
      await regenerateEnergy(
        player
      )

    let claimedToday =
      false

    if (
      player.last_checkin
    ) {
      claimedToday =
        isSameUtcDay(
          new Date(
            player.last_checkin
          ),
          new Date()
        )
    }

    const {
      count:
        referralsCount,
    } = await supabase
      .from('players')
      .select(
        'telegram_id',
        {
          count: 'exact',
          head: true,
        }
      )
      .eq(
        'referred_by',
        telegramId
      )
      .eq(
        'referral_reward_claimed',
        true
      )

    const withdrawalDailyState =
      await getWithdrawalDailyState(
        player
      )

    const {
      data:
        withdrawalHistoryRows,
    } = await supabase
      .from('withdrawal_history')
      .select(
        'id, amount, method, target, bnb_amount, status, created_at'
      )
      .eq(
        'telegram_id',
        telegramId
      )
      .order(
        'created_at',
        {
          ascending: false,
        }
      )
      .limit(20)

    const withdrawalHistory = (
      withdrawalHistoryRows ||
      []
    ).map((row) => ({
      id: row.id,
      amount: row.amount,
      method: row.method,
      target: row.target,
      bnbAmount:
        row.bnb_amount,
      status: row.status,
      createdAt:
        row.created_at,
    }))

    const mining =
      getMiningState(
        player,
        settings
      )

    return res.status(200).json({
      membershipRequired:
        mandatorySubscription.required,

      membershipVerified:
        mandatorySubscription.verified,

      requiredChannels:
        mandatorySubscription.channels,

      missingChannels:
        mandatorySubscription.missing,

      telegramId:
        String(
          player.telegram_id
        ),

      username:
        player.username,

      isDuplicateDevice:
        player.is_duplicate_device === true,

      coins:
        player.coin || 0,

      usdtBalance:
        player.usdt_balance ||
        0,

      walletAddress:
        player.wallet_address ||
        null,

      streak:
        player.streak || 0,

      claimedToday,

      referralsCount:
        referralsCount || 0,

      referralRewardUsdt:
        settings.referralRewardUsdt,

      referralRequiredTasks:
        settings.referralRequiredTasks,

      withdrawalHistory,

      energy:
        energyState.energy,

      energyMax:
        ENERGY_MAX,

      energyUpdatedAt:
        energyState.energyUpdatedAt,

      energyRegenMinutes:
        30,

      withdrawalAdsWatched:
        player.withdrawal_ads_watched ||
        0,

      weeklyTimeSeconds:
        player.weekly_time_seconds ||
        0,

      starsAdVerified:
        player.stars_ad_verified === true,

      starsAdBatchCount:
        player.stars_ad_batch_count || 0,

      starsAdsRequired: 12,

      starsCycleUnlocksAt:
        player.stars_cycle_started_at
          ? new Date(
              new Date(player.stars_cycle_started_at).getTime() +
                2 * 60 * 60 * 1000
            ).toISOString()
          : null,

      withdrawalAdsRequired:
        withdrawalDailyState.withdrawalAdsRequired,

      withdrawalsToday:
        withdrawalDailyState.withdrawalsToday,

      nextWithdrawalAvailableAt:
        null,

      mining,

      channelTasksReset:
        channelRecheck.leftChannelTaskIds,
    })
  } catch (err) {
    console.error(
      'auth/me error:',
      err
    )

    return res.status(500).json({
      error:
        err.message,
    })
  }
}
