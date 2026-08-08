import { supabase } from '../lib/supabase.js'
import { authenticateRequest } from '../lib/telegram-auth.js'

// المشكلة الأصلية: هذا الملف كان يتوقع telegramId جوه body الطلب، بس
// الفرونت اند (Home.tsx) يرسل initData جوه هيدر Authorization فقط ولا
// يرسل أي body فيه telegramId. النتيجة: كل ضغطة "Claim" كانت ترجع
// خطأ 400 "Telegram ID is required" دائماً ولا يشتغل تسجيل الحضور أبداً.
// صار الحل: نستخرج ونتحقق من telegram_id من initData متل باقي الملفات.

const DAILY_REWARD = 250

function isSameUtcDay(dateA, dateB) {
  return (
    dateA.getUTCFullYear() === dateB.getUTCFullYear() &&
    dateA.getUTCMonth() === dateB.getUTCMonth() &&
    dateA.getUTCDate() === dateB.getUTCDate()
  )
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const auth = authenticateRequest(req)
  if (!auth) {
    return res.status(401).json({ error: 'Invalid or missing Telegram authentication' })
  }

  const telegramId = auth.id

  try {
    let { data: player, error } = await supabase
      .from('players')
      .select('*')
      .eq('telegram_id', telegramId)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    if (!player) {
      const { data: created, error: insertError } = await supabase
        .from('players')
        .insert([{ telegram_id: telegramId, username: auth.username, coin: 0, usdt_balance: 0 }])
        .select()
        .single()

      if (insertError) throw insertError
      player = created
    }

    const now = new Date()

    if (player.last_checkin && isSameUtcDay(new Date(player.last_checkin), now)) {
      return res.status(400).json({ success: false, error: 'You already claimed today.' })
    }

    let newStreak = 1
    if (player.last_checkin) {
      const diffDays = Math.floor((now - new Date(player.last_checkin)) / (1000 * 60 * 60 * 24))
      newStreak = diffDays === 1 ? (player.streak || 0) + 1 : 1
    }

    const newCoins = (player.coin || 0) + DAILY_REWARD

    const { data: updated, error: updateError } = await supabase
      .from('players')
      .update({ coin: newCoins, last_checkin: now.toISOString(), streak: newStreak })
      .eq('telegram_id', telegramId)
      .select()
      .single()

    if (updateError) throw updateError

    return res.status(200).json({
      success: true,
      coins: updated.coin,
      streak: newStreak,
      reward: DAILY_REWARD,
    })
  } catch (err) {
    console.error('daily-checkin error:', err)
    return res.status(500).json({ error: err.message })
  }
}
