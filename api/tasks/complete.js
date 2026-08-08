import { supabase } from '../../lib/supabase.js'
import { authenticateRequest } from '../../lib/telegram-auth.js'

// مهام جاهزة من التطبيق
const BUILTIN_TASKS = {
  join_channel: 500,
  watch_ad: 150,
  game_run: null,
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const auth = authenticateRequest(req)

  if (!auth) {
    return res.status(401).json({
      error: 'Invalid or missing Telegram authentication',
    })
  }

  const telegramId = auth.id

  try {
    const {
      taskId,
      taskType,
      reward: clientReward,
    } = req.body || {}

    let reward = 0
    let progress = null

    // =========================
    // ADMIN TASK
    // =========================
    if (
      taskId !== undefined &&
      taskId !== null &&
      String(taskId).trim() !== ''
    ) {
      const normalizedTaskId = String(taskId).trim()

      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select(
          'id, reward, is_active, max_completions'
        )
        .eq('id', normalizedTaskId)
        .single()

      if (taskError || !task || !task.is_active) {
        return res.status(400).json({
          error: 'Task not found or inactive',
        })
      }

      const maxCompletions = Math.max(
        1,
        Number(task.max_completions || 1)
      )

      // =========================
      // GET PLAYER PROGRESS
      // =========================
      const { data: completionRow, error: completionError } =
        await supabase
          .from('task_completions')
          .select('completion_count')
          .eq('task_id', normalizedTaskId)
          .eq('telegram_id', telegramId)
          .maybeSingle()

      if (completionError) {
        throw completionError
      }

      const currentCount = Number(
        completionRow?.completion_count || 0
      )

      // =========================
      // LIMIT CHECK
      // =========================
      if (currentCount >= maxCompletions) {
        return res.status(400).json({
          error:
            'Task completion limit reached for this player',
        })
      }

      const nextCount = currentCount + 1

      // =========================
      // SAVE PROGRESS
      // =========================
      const { error: saveCompletionError } =
        await supabase
          .from('task_completions')
          .upsert(
            {
              task_id: normalizedTaskId,
              telegram_id: telegramId,
              completion_count: nextCount,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'task_id,telegram_id',
            }
          )

      if (saveCompletionError) {
        throw saveCompletionError
      }

      reward = Number(task.reward || 0)

      progress = {
        completed: nextCount,
        max_completions: maxCompletions,
      }
    }

    // =========================
    // BUILTIN TASK
    // =========================
    else if (
      taskType &&
      taskType in BUILTIN_TASKS
    ) {
      if (BUILTIN_TASKS[taskType] === null) {
        const val = Number(clientReward)

        if (
          !Number.isFinite(val) ||
          val <= 0 ||
          val > 5000
        ) {
          return res.status(400).json({
            error: 'Invalid reward amount',
          })
        }

        reward = val
      } else {
        reward = BUILTIN_TASKS[taskType]
      }
    }

    // =========================
    // INVALID TASK
    // =========================
    else {
      return res.status(400).json({
        error: 'Invalid task',
      })
    }

    // =========================
    // GET PLAYER
    // =========================
    const { data: player, error: fetchError } =
      await supabase
        .from('players')
        .select('coin')
        .eq('telegram_id', telegramId)
        .single()

    if (fetchError || !player) {
      return res.status(404).json({
        error: 'Player not found',
      })
    }

    // =========================
    // ADD COINS
    // =========================
    const newCoins =
      (player.coin || 0) + reward

    const { error: updateError } =
      await supabase
        .from('players')
        .update({
          coin: newCoins,
        })
        .eq('telegram_id', telegramId)

    if (updateError) {
      throw updateError
    }

    // =========================
    // RESPONSE
    // =========================
    return res.status(200).json({
      success: true,
      coins: newCoins,
      reward,
      ...(progress ? { progress } : {}),
    })
  } catch (err) {
    console.error(
      'tasks/complete error:',
      err
    )

    return res.status(500).json({
      error: err.message,
    })
  }
}
