import { supabase } from '../lib/supabase.js'
import { authenticateRequest } from '../lib/telegram-auth.js'
import { logLedger } from '../lib/ledger.js'
import { getAppSettings } from '../lib/settings.js'

// قيمة التحويل والحد الأدنى تُقرأ من app_settings، ولا توجد أسعار ثابتة هنا.

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = authenticateRequest(req)
  if (!auth) return res.status(401).json({ error: 'Invalid or missing Telegram authentication' })

  const telegramId = auth.id

  try {
    const settings = await getAppSettings()
    const minimumCoins = settings.minimumExchangeCoins
    const coinsPerUsdt = settings.coinsPerUsdt

    const { amountCoins } = req.body || {}
    const amount = Math.floor(Number(amountCoins))

    if (!Number.isFinite(amount) || amount < minimumCoins) {
      return res.status(400).json({ error: `Minimum exchange is ${minimumCoins} coins` })
    }

    const { data: player, error: fetchError } = await supabase
      .from('players')
      .select('coin, usdt_balance')
      .eq('telegram_id', telegramId)
      .single()

    if (fetchError || !player) return res.status(404).json({ error: 'Player not found' })

    if ((player.coin || 0) < amount) {
      return res.status(400).json({ error: 'Insufficient coin balance' })
    }

    const usdtGained = Number((amount / coinsPerUsdt).toFixed(6))
    const newCoins = (player.coin || 0) - amount
    const newUsdt = Number(((player.usdt_balance || 0) + usdtGained).toFixed(6))

    const { error: updateError } = await supabase
      .from('players')
      .update({ coin: newCoins, usdt_balance: newUsdt })
      .eq('telegram_id', telegramId)

    if (updateError) throw updateError

    await logLedger(telegramId, 'exchange', {
      coins: -amount,
      usdt: usdtGained,
      detail: 'تحويل عملات إلى USDT',
      balanceAfter: newCoins,
    })

    return res.status(200).json({ success: true, coins: newCoins, usdtBalance: newUsdt, usdtGained })
  } catch (err) {
    console.error('exchange error:', err)
    return res.status(500).json({ error: err.message })
  }
}
