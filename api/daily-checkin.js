import { createClient } from '@supabase/supabase-js'

// الاتصال بقاعدة البيانات باستخدام متغيرات البيئة الآمنة
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

export default async function handler(req, res) {
  // السماح بطلبات POST فقط
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { telegramId } = req.body

  if (!telegramId) {
    return res.status(400).json({ error: 'Telegram ID is required' })
  }

  try {
    // التحقق مما إذا كان اللاعب موجوداً مسبقاً في جدول players
    let { data: player, error } = await supabase
      .from('players')
      .select('*')
      .eq('telegram_id', telegramId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    // إذا لم يكن اللاعب موجوداً، نقوم بإنشائه برصيد نقاط مبدئي
    if (!player) {
      const { data: newPlayer, error: insertError } = await supabase
        .from('players')
        .insert([{ telegram_id: telegramId, points: 10 }])
        .select()
        .single()

      if (insertError) throw insertError
      return res.status(200).json({ success: true, player: newPlayer, message: 'Welcome! Bonus points added.' })
    }

    // إذا كان اللاعب موجوداً، نقوم بزيادة النقاط (مثلاً 5 نقاط عند كل تفقد يومي)
    const updatedPoints = (player.points || 0) + 5
    const { data: updatedPlayer, error: updateError } = await supabase
      .from('players')
      .update({ points: updatedPoints })
      .eq('telegram_id', telegramId)
      .select()
      .single()

    if (updateError) throw updateError

    return res.status(200).json({ success: true, player: updatedPlayer, message: 'Points updated successfully!' })

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
