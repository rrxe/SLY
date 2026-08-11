import { supabase } from '../lib/supabase.js'
import { authenticateRequest } from '../lib/telegram-auth.js'

const MIN_WITHDRAW = 0.1

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = authenticateRequest(req)
  if (!auth) return res.status(401).json({ error: 'Invalid or missing Telegram authentication' })

  const telegramId = auth.id

  try {
    const { amount } = req.body || {}
    const amt = Number(amount)

    if (!Number.isFinite(amt) || amt < MIN_WITHDRAW) {
      return res.status(400).json({ error: `Minimum withdrawal is ${MIN_WITHDRAW} USDT` })
    }

    const { data: player, error: fetchError } = await supabase
      .from('players')
      .select('usdt_balance, wallet_address, withdrawal_status')
      .eq('telegram_id', telegramId)
      .single()

    if (fetchError || !player) return res.status(404).json({ error: 'Player not found' })

    if (!player.wallet_address) {
      return res.status(400).json({ error: 'Wallet address not connected' })
    }

    // امنع طلب سحب جديد إذا اكو طلب pending سابق لسه ما تعالج
    if (player.withdrawal_status === 'pending') {
      return res.status(400).json({ error: 'You already have a pending withdrawal request' })
    }

    if ((player.usdt_balance || 0) < amt) {
      return res.status(400).json({ error: 'Insufficient USDT balance' })
    }

    const newUsdtBalance = Number((player.usdt_balance - amt).toFixed(4))

    const { error: updateError } = await supabase
      .from('players')
      .update({
        usdt_balance: newUsdtBalance,
        withdrawal_status: 'pending',
        withdrawal_amount: amt,
      })
      .eq('telegram_id', telegramId)

    if (updateError) throw updateError

    return res.status(200).json({ success: true, usdtBalance: newUsdtBalance })
  } catch (err) {
    console.error('withdraw error:', err)
    return res.status(500).json({ error: err.message })
  }
}
