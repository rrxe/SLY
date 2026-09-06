import { supabase } from '../lib/supabase.js'
import { authenticateRequest } from '../lib/telegram-auth.js'

const MIN_WITHDRAW = 0.1
const MAX_WITHDRAW = 0.2

const BASE_WITHDRAW_ADS = 10
const EXTRA_ADS_PER_WITHDRAW = 10

function getUtcDateString(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

function getRequiredWithdrawalAds(withdrawalsToday) {
  const count = Math.max(0, Math.trunc(Number(withdrawalsToday || 0)))

  return BASE_WITHDRAW_ADS + (
    count * EXTRA_ADS_PER_WITHDRAW
  )
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
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
    const { amount, method, target } = req.body || {}
    const amt = Number(amount)

    if (!Number.isFinite(amt) || amt < MIN_WITHDRAW) {
      return res.status(400).json({
        error: `Minimum withdrawal is ${MIN_WITHDRAW} USDT`,
      })
    }

    if (amt > MAX_WITHDRAW) {
      return res.status(400).json({
        error: `Maximum withdrawal is ${MAX_WITHDRAW} USDT per withdrawal`,
      })
    }

    if (method !== 'binance' && method !== 'bnb') {
      return res.status(400).json({
        error: 'Invalid withdrawal method',
      })
    }

    const { data: player, error: fetchError } = await supabase
      .from('players')
      .select(
        'usdt_balance, wallet_address, withdrawal_status, withdrawal_ads_watched, withdrawals_today, withdrawal_count_date'
      )
      .eq('telegram_id', telegramId)
      .single()

    if (fetchError || !player) {
      return res.status(404).json({
        error: 'Player not found',
      })
    }

    /*
     * DAILY WITHDRAWAL COUNTER
     *
     * إذا دخل يوم جديد:
     * withdrawals_today = 0
     *
     * وبالتالي أول سحبة في اليوم تحتاج:
     * 10 إعلانات
     *
     * ثاني سحبة:
     * 15 إعلان
     *
     * ثالث سحبة:
     * 20 إعلان
     */
    const today = getUtcDateString()

    let withdrawalsToday = Number(
      player.withdrawals_today || 0
    )

    if (
      !Number.isFinite(withdrawalsToday) ||
      withdrawalsToday < 0
    ) {
      withdrawalsToday = 0
    }

    withdrawalsToday = Math.trunc(withdrawalsToday)

    if (player.withdrawal_count_date !== today) {
      withdrawalsToday = 0
    }

    const requiredWithdrawalAds =
      getRequiredWithdrawalAds(withdrawalsToday)

    const withdrawalAdsWatched = Number(
      player.withdrawal_ads_watched || 0
    )

    if (withdrawalAdsWatched < requiredWithdrawalAds) {
      return res.status(400).json({
        error:
          `Watch ${requiredWithdrawalAds - withdrawalAdsWatched} more ad(s) to unlock withdrawal`,
        withdrawalAdsWatched,
        withdrawalAdsRequired: requiredWithdrawalAds,
        withdrawalsToday,
      })
    }

    // امنع طلب سحب جديد إذا اكو طلب pending سابق لسه ما تعالج
    if (player.withdrawal_status === 'pending') {
      return res.status(400).json({
        error: 'You already have a pending withdrawal request',
      })
    }

    if ((player.usdt_balance || 0) < amt) {
      return res.status(400).json({
        error: 'Insufficient USDT balance',
      })
    }

    // كلا الطريقتين (binance / bnb) الحين نفس المنطق: نطلب من
    // المستخدم "هدف" (Binance ID أو عنوان BNB) مباشرة بدون أي
    // محاولة لجلب سعر BNB أو الاعتماد على عنوان محفوظ بالسيرفر.
    const trimmedTarget =
      typeof target === 'string'
        ? target.trim()
        : ''

    if (!trimmedTarget) {
      return res.status(400).json({
        error:
          method === 'binance'
            ? 'Binance ID is required'
            : 'GRAM (TON) address is required',
      })
    }

    const withdrawalTarget = trimmedTarget
    const bnbAmount = null
    const bnbPriceUsd = null

    const newUsdtBalance = Number(
      (player.usdt_balance - amt).toFixed(4)
    )

    /*
     * السحبة الحالية تنحسب بعد نجاح العملية.
     *
     * مثال:
     * withdrawalsToday = 0
     * السحبة الأولى تنجح
     * يصبح withdrawalsToday = 1
     *
     * بعدها السحبة الثانية تحتاج:
     * 10 + (1 × 5) = 15 إعلان
     */
    const newWithdrawalsToday =
      withdrawalsToday + 1

    const { error: updateError } =
      await supabase
        .from('players')
        .update({
          usdt_balance: newUsdtBalance,

          withdrawal_status: 'pending',

          withdrawal_amount: amt,

          withdrawal_method: method,

          withdrawal_target:
            withdrawalTarget,

          withdrawal_bnb_amount:
            bnbAmount,

          withdrawal_bnb_price_usd:
            bnbPriceUsd,

          // بعد تسجيل السحبة بنجاح يبدأ عداد إعلانات جديد.
          withdrawal_ads_watched: 0,

          // عدد السحبات في اليوم الحالي.
          withdrawals_today:
            newWithdrawalsToday,

          // اليوم الذي ينتمي إليه العداد.
          withdrawal_count_date:
            today,
        })
        .eq(
          'telegram_id',
          telegramId
        )

    if (updateError) {
      throw updateError
    }

    // نسجل هذا الطلب بجدول السجل التاريخي حتى يشوفه اللاعب بصفحة
    // البروفايل (pending الحين، وبعدين يتحدث approved/rejected من
    // نفس السطر لما الأدمن يعالج الطلب).
    const { error: historyError } =
      await supabase
        .from('withdrawal_history')
        .insert({
          telegram_id: telegramId,
          amount: amt,
          method,
          target: withdrawalTarget,
          bnb_amount: bnbAmount,
          bnb_price_usd: bnbPriceUsd,
          status: 'pending',
        })

    if (historyError) {
      // فشل تسجيل السجل ما يوقف عملية السحب نفسها (المبلغ اتخصم
      // فعلاً وطلب pending موجود) - بس نسجل الخطأ للمتابعة.
      console.error(
        '[Withdrawal] history insert failed:',
        historyError
      )
    }

    const nextWithdrawalAds =
      getRequiredWithdrawalAds(
        newWithdrawalsToday
      )

    console.log(
      `[Withdrawal] ${telegramId} withdrawal #${newWithdrawalsToday} today. ` +
      `Next withdrawal requires ${nextWithdrawalAds} ads.`
    )

    return res.status(200).json({
      success: true,

      usdtBalance:
        newUsdtBalance,

      bnbAmount,

      bnbPriceUsd,

      withdrawalAdsWatched: 0,

      withdrawalAdsRequired:
        nextWithdrawalAds,

      withdrawalsToday:
        newWithdrawalsToday,

      minWithdraw:
        MIN_WITHDRAW,

      maxWithdraw:
        MAX_WITHDRAW,
    })
  } catch (err) {
    console.error(
      'withdraw error:',
      err
    )

    return res.status(500).json({
      error: err.message,
    })
  }
}
