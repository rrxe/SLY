import { supabase } from '../../../lib/supabase.js'

// هذا الملف مذكور بوصف مشروعك (تحديث حالة السحب) لكن ما كان مرفوع/موجود
// فعلياً، يعني زر "قبول/رفض" بلوحة التحكم ما اله وين يشتغل. أضفناه هنا.
// استدعيه من admin.html بـ:
//   POST /api/admin/withdrawals/status
//   headers: { "x-admin-secret": "...", "Content-Type": "application/json" }
//   body: { "telegramId": 123456789, "action": "approve" | "reject" }

export default async function handler(req, res) {
  if (req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { telegramId, action } = req.body || {}

    if (!telegramId || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid request' })
    }

    const { data: player, error: fetchError } = await supabase
      .from('players')
      .select('usdt_balance, withdrawal_amount, withdrawal_status')
      .eq('telegram_id', telegramId)
      .single()

    if (fetchError || !player) {
      return res.status(404).json({ error: 'Player not found' })
    }

    if (player.withdrawal_status !== 'pending') {
      return res.status(400).json({ error: 'No pending withdrawal for this player' })
    }

    if (action === 'approve') {
      // الموافقة: تصفير الطلب لأن المبلغ صار المفروض يترسل يدوياً للاعب
      const { error } = await supabase
        .from('players')
        .update({ withdrawal_status: 'completed', withdrawal_amount: 0 })
        .eq('telegram_id', telegramId)

      if (error) throw error
      return res.status(200).json({ success: true, status: 'completed' })
    }

    // الرفض: إعادة المبلغ تلقائياً لرصيد usdt_balance الخاص باللاعب
    const refundedBalance = Number(((player.usdt_balance || 0) + (player.withdrawal_amount || 0)).toFixed(4))

    const { error } = await supabase
      .from('players')
      .update({
        usdt_balance: refundedBalance,
        withdrawal_status: 'rejected',
        withdrawal_amount: 0,
      })
      .eq('telegram_id', telegramId)

    if (error) throw error

    return res.status(200).json({ success: true, status: 'rejected', usdtBalance: refundedBalance })
  } catch (err) {
    console.error('withdrawals/status error:', err)
    return res.status(500).json({ error: err.message })
  }
}
