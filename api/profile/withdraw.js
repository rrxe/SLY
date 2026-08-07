import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const authHeader = req.headers.authorization || ''
    const initData = authHeader.replace('tga ', '')
    const urlParams = new URLSearchParams(initData)
    const userStr = urlParams.get('user')

    if (!userStr) return res.status(400).json({ error: 'No user data' })

    const telegramId = JSON.parse(userStr).id
    const { amount } = req.body

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid withdrawal amount' })
    }

    const { data: player, error: fetchError } = await supabase
      .from('players')
      .select('usdt_balance, wallet_address')
      .eq('telegram_id', telegramId)
      .single()

    if (fetchError || !player) {
      return res.status(404).json({ error: 'Player not found' })
    }

    if (!player.wallet_address) {
      return res.status(400).json({ error: 'Wallet address not connected' })
    }

    if ((player.usdt_balance || 0) < amount) {
      return res.status(400).json({ error: 'Insufficient USDT balance' })
    }

    const newUsdtBalance = player.usdt_balance - amount

    const { error: updateError } = await supabase
      .from('players')
      .update({
        usdt_balance: newUsdtBalance,
        withdrawal_status: 'pending',
        withdrawal_amount: amount
      })
      .eq('telegram_id', telegramId)

    if (updateError) throw updateError

    return res.status(200).json({ success: true, newUsdtBalance })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
