import { supabase } from './supabase.js'

// ============================================================
// بونص التعدين مقابل الإحالات
//
// القواعد (كل الأرقام تجي من app_settings عبر getAppSettings):
// - 10 إحالات جديدة مؤهلة = +50% على مكافأة التعدين لمدة أسبوع
// - 20 إحالة جديدة مؤهلة = +100% لمدة أسبوع
// - النسبتان ما تتجمعان: الأعلى تحل محل الأقل
// - الإحالة "مؤهلة" إذا: أكملت شرط الإحالة الحالي (referral_reward_claimed)،
//   انسجلت بعد هذا التحديث (referral_bonus_eligible)، وما هي محظورة
//   ولا معلّمة "جهاز مكرر"
// - كل إحالة تنحسب مرة وحدة بس: لما ينتهي البونص تبدأ نافذة عدّ جديدة
//   (referral_bonus_window_start) فالإحالات القديمة ما ترجع تنحسب
//
// ملاحظة: ما نلمس دالة claim_mining_reward اللي بـ Supabase. البونص يُضاف
// من هنا بعد نجاح الاستلام الأصلي (انظر creditBonusCoins).
// ============================================================

const DAY_MS = 24 * 60 * 60 * 1000

const BONUS_COLUMNS =
  'telegram_id, referral_bonus_percent, referral_bonus_expires_at, referral_bonus_window_start'

function toMs(value) {
  if (!value) return 0
  const ms = new Date(value).getTime()
  return Number.isFinite(ms) ? ms : 0
}

/** نسبة البونص الفعّالة الحين (0 إذا ما فيه بونص أو انتهى) */
export function getActiveBonusPercent(player, now = Date.now()) {
  const percent = Number(player?.referral_bonus_percent || 0)
  if (!(percent > 0)) return 0
  return toMs(player?.referral_bonus_expires_at) > now ? percent : 0
}

/** المبلغ الإضافي فقط (بدون الأساس) */
export function getBonusExtra(baseReward, percent) {
  const base = Number(baseReward) || 0
  const pct = Number(percent) || 0
  if (base <= 0 || pct <= 0) return 0
  return Math.floor((base * pct) / 100)
}

async function countEligibleReferrals(telegramId, windowStart) {
  let query = supabase
    .from('players')
    .select('telegram_id', { count: 'exact', head: true })
    .eq('referred_by', telegramId)
    .eq('referral_reward_claimed', true)
    .eq('referral_bonus_eligible', true)
    .eq('is_banned', false)
    .eq('is_duplicate_device', false)
    .not('referral_qualified_at', 'is', null)

  if (windowStart) {
    query = query.gt('referral_qualified_at', windowStart)
  }

  const { count, error } = await query

  if (error) throw error

  return count || 0
}

/**
 * يحدّث حالة بونص اللاعب (انتهاء/ترقية/منح) ويرجع تقدمه.
 * `player` لازم يحتوي أعمدة referral_bonus_* (select * يكفي)، ونحدّث
 * نفس الكائن بالذاكرة عشان getMiningState يشوف القيم الجديدة.
 */
export async function refreshReferralBonus(player, settings, now = new Date()) {
  const telegramId = player.telegram_id
  const nowMs = now.getTime()

  let percent = Number(player.referral_bonus_percent || 0)
  let expiresAt = player.referral_bonus_expires_at || null
  let windowStart = player.referral_bonus_window_start || null

  // 1) انتهى البونص: نصفّره ونبدأ نافذة عدّ جديدة من لحظة انتهائه
  if (percent > 0 && toMs(expiresAt) <= nowMs) {
    const newWindowStart = expiresAt || now.toISOString()

    const { error } = await supabase
      .from('players')
      .update({
        referral_bonus_percent: 0,
        referral_bonus_expires_at: null,
        referral_bonus_window_start: newWindowStart,
      })
      .eq('telegram_id', telegramId)
      .eq('referral_bonus_percent', percent)

    if (error) throw error

    percent = 0
    expiresAt = null
    windowStart = newWindowStart
  }

  // 2) نعدّ الإحالات المؤهلة بالنافذة الحالية
  const count = await countEligibleReferrals(telegramId, windowStart)

  let target = 0
  if (count >= settings.referralBonusTier2Referrals) {
    target = settings.referralBonusTier2Percent
  } else if (count >= settings.referralBonusTier1Referrals) {
    target = settings.referralBonusTier1Percent
  }

  // 3) منح أو ترقية (الأعلى تحل محل الأقل وتبدأ أسبوع جديد)
  if (target > percent) {
    const newExpiresAt = new Date(
      nowMs + settings.referralBonusDays * DAY_MS
    ).toISOString()

    const { data: updatedRows, error } = await supabase
      .from('players')
      .update({
        referral_bonus_percent: target,
        referral_bonus_expires_at: newExpiresAt,
      })
      .eq('telegram_id', telegramId)
      .eq('referral_bonus_percent', percent)
      .select('referral_bonus_percent, referral_bonus_expires_at')

    if (error) throw error

    if (updatedRows && updatedRows.length > 0) {
      percent = target
      expiresAt = newExpiresAt
    } else {
      // طلب ثاني سبقنا بنفس اللحظة: نقرأ القيمة الفعلية
      const { data: fresh } = await supabase
        .from('players')
        .select(BONUS_COLUMNS)
        .eq('telegram_id', telegramId)
        .single()

      percent = Number(fresh?.referral_bonus_percent || 0)
      expiresAt = fresh?.referral_bonus_expires_at || null
    }
  }

  player.referral_bonus_percent = percent
  player.referral_bonus_expires_at = expiresAt
  player.referral_bonus_window_start = windowStart

  return {
    progress: count,
    tier1Referrals: settings.referralBonusTier1Referrals,
    tier1Percent: settings.referralBonusTier1Percent,
    tier2Referrals: settings.referralBonusTier2Referrals,
    tier2Percent: settings.referralBonusTier2Percent,
    durationDays: settings.referralBonusDays,
    activePercent: getActiveBonusPercent(player, nowMs),
    expiresAt: percent > 0 ? expiresAt : null,
  }
}

/** نفس refreshReferralBonus بس أي فشل ما يكسر العملية الأساسية */
export async function safeRefreshReferralBonus(player, settings) {
  try {
    return await refreshReferralBonus(player, settings)
  } catch (err) {
    console.error('[referral-bonus] refresh failed:', err?.message || err)

    return {
      progress: 0,
      tier1Referrals: settings.referralBonusTier1Referrals,
      tier1Percent: settings.referralBonusTier1Percent,
      tier2Referrals: settings.referralBonusTier2Referrals,
      tier2Percent: settings.referralBonusTier2Percent,
      durationDays: settings.referralBonusDays,
      activePercent: 0,
      expiresAt: null,
    }
  }
}

/** يجيب صف المُحيل ويحدّث بونصه (يُستدعى لما إحالته تتأهل) */
export async function refreshReferralBonusById(telegramId, settings) {
  try {
    const { data: referrer, error } = await supabase
      .from('players')
      .select(BONUS_COLUMNS)
      .eq('telegram_id', telegramId)
      .single()

    if (error || !referrer) return

    await refreshReferralBonus(referrer, settings)
  } catch (err) {
    console.error('[referral-bonus] refresh by id failed:', err?.message || err)
  }
}

/**
 * يضيف عملات البونص فوق رصيد الاستلام الأصلي.
 * الكود الحالي يقرأ ثم يكتب الرصيد، فنستخدم شرط مطابقة الرصيد (compare-and-swap)
 * مع إعادة المحاولة حتى ما نكتب فوق تغيير صار بنفس اللحظة.
 * يرجع الرصيد الجديد أو null لو فشل.
 */
export async function creditBonusCoins(telegramId, extraCoins) {
  const extra = Math.trunc(Number(extraCoins) || 0)
  if (extra <= 0) return null

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data: current, error: readError } = await supabase
      .from('players')
      .select('coin')
      .eq('telegram_id', telegramId)
      .single()

    if (readError || !current) {
      console.error('[referral-bonus] read coin failed:', readError?.message)
      return null
    }

    const currentCoins = Number(current.coin || 0)
    const newCoins = currentCoins + extra

    const { data: updated, error: writeError } = await supabase
      .from('players')
      .update({ coin: newCoins })
      .eq('telegram_id', telegramId)
      .eq('coin', currentCoins)
      .select('coin')

    if (writeError) {
      console.error('[referral-bonus] credit failed:', writeError.message)
      return null
    }

    if (updated && updated.length > 0) {
      return Number(updated[0].coin)
    }
  }

  console.error('[referral-bonus] credit gave up after retries for', telegramId)
  return null
}
