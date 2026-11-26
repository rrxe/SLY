import { supabase } from '../lib/supabase.js'
import { authenticateRequest } from '../lib/telegram-auth.js'
import { logLedger } from '../lib/ledger.js'

const MIN_WITHDRAW = 0.05
const MAX_WITHDRAW = 0.5

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

    if (!['bnb', 'sham_cash', 'binance'].includes(method)) {
      return res.status(400).json({
        error: 'Invalid withdrawal method',
      })
    }

    const { data: player, error: fetchError } = await supabase
      .from('players')
      .select(
        'usdt_balance, wallet_address, withdrawal_status'
      )
      .eq('telegram_id', telegramId)
      .single()

    if (fetchError || !player) {
      return res.status(404).json({
        error: 'Player not found',
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

    // كل طرق السحب تستقبل بيانات الاستلام مباشرة من المستخدم.
    const trimmedTarget =
      typeof target === 'string'
        ? target.trim()
        : ''

    if (!trimmedTarget) {
      return res.status(400).json({
        error:
            method === 'binance'
              ? 'Binance ID is required'
              : method === 'sham_cash'
                ? 'Sham Cash payment link is required'
                : 'GRAM (TON) address is required',
      })
    }

    const withdrawalTarget = trimmedTarget
    const bnbAmount = null
    const bnbPriceUsd = null

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

        })
        .eq(
          'telegram_id',
          telegramId
        )

    if (updateError) {
      throw updateError
    }

    await logLedger(telegramId, 'withdrawal', {
      usdt: -amt,
      detail: String(method || ''),
    })

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

    return res.status(200).json({
      success: true,

      usdtBalance:
        newUsdtBalance,

      bnbAmount,

      bnbPriceUsd,

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
