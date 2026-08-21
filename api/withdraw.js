import { supabase } from '../lib/supabase.js'
import { authenticateRequest } from '../lib/telegram-auth.js'

const MIN_WITHDRAW = 0.1
const MAX_WITHDRAW = 0.2
const REQUIRED_WITHDRAW_ADS = 10

// يجيب سعر BNB الحالي بالدولار من Binance (API عام، بدون مفتاح).
// نستخدم AbortController كمهلة أمان (5 ثواني) حتى ما يعلّق الطلب لو
// Binance بطيء أو مو متاح مؤقتاً.
async function getBnbPriceUsd() {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  try {
    const res = await fetch(
      'https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT',
      {
        signal: controller.signal,
      }
    )

    if (!res.ok) throw new Error('Price lookup failed')

    const data = await res.json()
    const price = Number(data.price)

    if (!Number.isFinite(price) || price <= 0) {
      throw new Error('Invalid BNB price received')
    }

    return price
  } finally {
    clearTimeout(timeout)
  }
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
        'usdt_balance, wallet_address, withdrawal_status, withdrawal_ads_watched'
      )
      .eq('telegram_id', telegramId)
      .single()

    if (fetchError || !player) {
      return res.status(404).json({
        error: 'Player not found',
      })
    }

    const withdrawalAdsWatched = Number(
      player.withdrawal_ads_watched || 0
    )

    if (withdrawalAdsWatched < REQUIRED_WITHDRAW_ADS) {
      return res.status(400).json({
        error:
          `Watch ${REQUIRED_WITHDRAW_ADS - withdrawalAdsWatched} more ad(s) to unlock withdrawal`,
        withdrawalAdsWatched,
        withdrawalAdsRequired: REQUIRED_WITHDRAW_ADS,
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

    let withdrawalTarget
    let bnbAmount = null
    let bnbPriceUsd = null

    if (method === 'binance') {
      const trimmedTarget =
        typeof target === 'string'
          ? target.trim()
          : ''

      if (!trimmedTarget) {
        return res.status(400).json({
          error: 'Binance ID is required',
        })
      }

      withdrawalTarget = trimmedTarget
    } else {
      // method === 'bnb' - نستخدم عنوان المحفظة المحفوظ بالسيرفر فقط
      // حتى ما يقدر أحد يغيّر الهدف من الفرونت اند.
      if (!player.wallet_address) {
        return res.status(400).json({
          error: 'Wallet address not connected',
        })
      }

      withdrawalTarget =
        player.wallet_address

      try {
        bnbPriceUsd = await getBnbPriceUsd()

        bnbAmount = Number(
          (amt / bnbPriceUsd).toFixed(8)
        )
      } catch (priceErr) {
        console.error(
          'BNB price lookup failed:',
          priceErr
        )

        return res.status(503).json({
          error:
            'Unable to fetch BNB price right now, try again shortly',
        })
      }
    }

    const newUsdtBalance = Number(
      (player.usdt_balance - amt).toFixed(4)
    )

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

      usdtBalance:
        newUsdtBalance,

      bnbAmount,

      bnbPriceUsd,

      withdrawalAdsWatched: 0,

      withdrawalAdsRequired:
        REQUIRED_WITHDRAW_ADS,

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
