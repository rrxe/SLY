import { supabase } from './supabase.js'

function readNumber(settings, key, fallback, min = 0, max = Number.MAX_SAFE_INTEGER, integer = false) {
  const raw = settings[key]
  const parsed = raw === undefined || raw === null || raw === '' ? fallback : Number(raw)
  if (!Number.isFinite(parsed)) return fallback
  const bounded = Math.min(max, Math.max(min, parsed))
  return integer ? Math.trunc(bounded) : bounded
}

/**
 * يقرأ إعدادات التطبيق من app_settings.
 * هذه هي نقطة القراءة الموحدة لإعدادات المكافآت والتحويل على السيرفر.
 */
export async function getAppSettings() {
  const { data, error } = await supabase
    .from('app_settings')
    .select('key, value')

  if (error) throw error

  const settings = {}
  for (const row of data || []) settings[row.key] = row.value

  return {
    miningRewardCoins: readNumber(settings, 'mining_reward_coins', 2500, 1, 100000000, true),
    miningCycleHours: readNumber(settings, 'mining_cycle_hours', 2, 1, 168),
    referralRewardUsdt: readNumber(settings, 'referral_reward_usdt', 0.01, 0, 1000000),
    referralRequiredTasks: readNumber(settings, 'referral_required_tasks', 5, 1, 1000000, true),

    referralBonusTier1Referrals: readNumber(settings, 'referral_bonus_tier1_referrals', 10, 1, 1000000, true),
    referralBonusTier1Percent: readNumber(settings, 'referral_bonus_tier1_percent', 50, 0, 100000),
    referralBonusTier2Referrals: readNumber(settings, 'referral_bonus_tier2_referrals', 20, 1, 1000000, true),
    referralBonusTier2Percent: readNumber(settings, 'referral_bonus_tier2_percent', 100, 0, 100000),
    referralBonusDays: readNumber(settings, 'referral_bonus_days', 7, 1, 3650),

    // مثال: 1000 كوين = 1 USDT.
    coinsPerUsdt: readNumber(settings, 'coins_per_usdt', 1000, 1, 1000000000, true),
    minimumExchangeCoins: readNumber(settings, 'minimum_exchange_coins', 1000, 1, 1000000000, true),

    laserEscapeRewards: {
      easy: readNumber(settings, 'laser_easy_reward_coins', 250, 1, 100000000, true),
      normal: readNumber(settings, 'laser_normal_reward_coins', 500, 1, 100000000, true),
      hard: readNumber(settings, 'laser_hard_reward_coins', 750, 1, 100000000, true),
    },

    cometRunScoreStep: readNumber(settings, 'comet_run_score_step', 500, 100, 200000, true),
    cometRunCoinsPerStep: readNumber(settings, 'comet_run_coins_per_step', 300, 1, 100000, true),

    dailyCheckinRewardCoins: readNumber(settings, 'daily_checkin_reward_coins', 250, 0, 100000000, true),
    nativeTaskAdRewardCoins: readNumber(settings, 'native_task_ad_reward_coins', 10, 0, 100000000, true),
    nativeTask2AdRewardCoins: readNumber(settings, 'native_task2_ad_reward_coins', 10, 0, 100000000, true),
  }
}
