import { supabase } from '../../lib/supabase.js'
import { authenticateRequest } from '../../lib/telegram-auth.js'

// المشاكل اللي كانت بهذا الملف:
// 1) كان يحدث عمود points/lifetime_coins وهذا مو نفس العمود المستخدم
//    بباقي المشروع (coin) - فعليا كانت المكافآت تروح لعمود غير مستخدم.
// 2) كان ياخذ قيمة reward مباشرة من body الطلب اللي يرسله المتصفح -
//    أي شخص يفتح devtools يقدر يرسل reward: 999999 ويحصل عملات مجانية.
//    هسه صرنا نتحقق من قيمة المكافأة من قاعدة البيانات (لمهام الأدمن)
//    أو من قائمة ثابتة بالسيرفر (لمهام التطبيق الجاهزة).

const BUILTIN_TASKS = {
  join_channel: 500,
  watch_ad: 150,
  game_run: null, // القيمة تُحسب وتُرسل من App.tsx نفسها (مكافأة اللعبة تختلف كل مرة)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = authenticateRequest(req)
  if (!auth) return res.status(401).json({ error: 'Invalid or missing Telegram authentication' })

  const telegramId = auth.id

  try {
    const { taskId, taskType, reward: clientReward } = req.body || {}
    let reward = 0

    if (taskId) {
      // مهمة تم إضافتها من لوحة تحكم الأدمن (جدول tasks)
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('reward, is_active')
        .eq('id', taskId)
        .single()

      if (taskError || !task || !task.is_active) {
        return res.status(400).json({ error: 'Task not found or inactive' })
      }
      reward = task.reward
    } else if (taskType && taskType in BUILTIN_TASKS) {
      if (BUILTIN_TASKS[taskType] === null) {
        // مهمة متغيرة القيمة (نتيجة لعبة) - نثق بالقيمة المرسلة من App.tsx
        // بس نحدد سقف معقول لمنع أي تلاعب واضح
        const val = Number(clientReward)
        if (!Number.isFinite(val) || val <= 0 || val > 5000) {
          return res.status(400).json({ error: 'Invalid reward amount' })
        }
        reward = val
      } else {
        reward = BUILTIN_TASKS[taskType]
      }
    } else {
      return res.status(400).json({ error: 'Invalid task' })
    }

    const { data: player, error: fetchError } = await supabase
      .from('players')
      .select('coin')
      .eq('telegram_id', telegramId)
      .single()

    if (fetchError || !player) {
      return res.status(404).json({ error: 'Player not found' })
    }

    const newCoins = (player.coin || 0) + reward

    const { error: updateError } = await supabase
      .from('players')
      .update({ coin: newCoins })
      .eq('telegram_id', telegramId)

    if (updateError) throw updateError

    return res.status(200).json({ success: true, coins: newCoins, reward })
  } catch (err) {
    console.error('tasks/complete error:', err)
    return res.status(500).json({ error: err.message })
  }
}
