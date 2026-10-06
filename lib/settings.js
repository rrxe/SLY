import { supabase } from './supabase.js'

/**
 * يقرأ جدول app_settings ويحوله إلى كائن إعدادات
 * جاهز للاستخدام في كل السيرفر (mining + referral).
 * أي endpoint يحتاج قيمة إعداد يجب أن يستدعي هذه
 * الدالة بدل تعريف رقم ثابت (hardcoded) بنفسه.
 */
export async function getAppSettings() {
  const { data, error } = await supabase
    .from('app_settings')
    .select('key, value')

  if (error) throw error

  const settings = {}

  for (const row of data || []) {
    settings[row.key] = row.value
  }

  return {
    miningRewardCoins: Math.max(
      1,
      Math.trunc(
        Number(
          settings.mining_reward_coins || 2500
        )
      )
    ),

    miningCycleHours: Math.max(
      1,
      Number(
        settings.mining_cycle_hours || 2
      )
    ),

    referralRewardUsdt: Math.max(
      0,
      Number(
        settings.referral_reward_usdt || 0.01
      )
    ),

    referralRequiredTasks: Math.max(
      1,
      Math.trunc(
        Number(
          settings.referral_required_tasks || 5
        )
      )
    ),

    // بونص التعدين مقابل الإحالات (الشريحة العليا تحل محل الأدنى، ما تتجمع)
    referralBonusTier1Referrals: Math.max(
      1,
      Math.trunc(
        Number(
          settings.referral_bonus_tier1_referrals || 10
        )
      )
    ),

    referralBonusTier1Percent: Math.max(
      0,
      Number(
        settings.referral_bonus_tier1_percent || 50
      )
    ),

    referralBonusTier2Referrals: Math.max(
      1,
      Math.trunc(
        Number(
          settings.referral_bonus_tier2_referrals || 20
        )
      )
    ),

    referralBonusTier2Percent: Math.max(
      0,
      Number(
        settings.referral_bonus_tier2_percent || 100
      )
    ),

    referralBonusDays: Math.max(
      1,
      Number(
        settings.referral_bonus_days || 7
      )
    ),
  }
}
