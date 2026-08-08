import { supabase } from '../../lib/supabase.js'
import { authenticateRequest } from '../../lib/telegram-auth.js'

const BUILTIN_TASKS = {
  join_channel: 500,
  watch_ad: 150,
  game_run: null,
}

const AD_SESSION_WINDOW_MS = 10 * 60 * 1000

function toPositiveInt(value) {
  const raw = Array.isArray(value) ? value[0] : value
  const num = Number(raw)

  if (!Number.isFinite(num) || num <= 0) return null

  return Math.trunc(num)
}

function nowIso() {
  return new Date().toISOString()
}

function isFreshTimestamp(value) {
  if (!value) return false

  const timestamp = Date.parse(value)

  if (!Number.isFinite(timestamp)) return false

  const age = Date.now() - timestamp

  return age >= 0 && age <= AD_SESSION_WINDOW_MS
}

async function getTask(taskId) {
  return supabase
    .from('tasks')
    .select(
      'id, reward, is_active, max_completions, task_type'
    )
    .eq('id', taskId)
    .single()
}

async function getCompletionRow(taskId, telegramId) {
  return supabase
    .from('task_completions')
    .select('completion_count, opened_at')
    .eq('task_id', taskId)
    .eq('telegram_id', telegramId)
    .maybeSingle()
}

async function saveCompletionRow({
  taskId,
  telegramId,
  completionCount,
  openedAt,
}) {
  return supabase
    .from('task_completions')
    .upsert(
      {
        task_id: taskId,
        telegram_id: telegramId,
        completion_count: completionCount,
        opened_at: openedAt ?? null,
      },
      {
        onConflict: 'task_id,telegram_id',
      }
    )
}

async function addCoinsToPlayer(telegramId, reward) {
  const { data: player, error: fetchError } =
    await supabase
      .from('players')
      .select('coin')
      .eq('telegram_id', telegramId)
      .single()

  if (fetchError || !player) {
    return {
      error: 'Player not found',
    }
  }

  const currentCoins = Number(player.coin || 0)
  const newCoins = currentCoins + reward

  const { error: updateError } =
    await supabase
      .from('players')
      .update({
        coin: newCoins,
      })
      .eq('telegram_id', telegramId)

  if (updateError) {
    return {
      error:
        updateError.message ||
        'Failed to update coins',
    }
  }

  return {
    newCoins,
  }
}

/*
=========================================================
ADSGRAM REWARD CALLBACK
=========================================================

AdsGram sends:

GET /api/tasks/complete?taskId=123&userid=123456789

The [userId] part comes from AdsGram.

Example Reward URL:

https://YOUR-DOMAIN.com/api/tasks/complete?taskId=123&userid=[userId]

=========================================================
*/

async function handleAdsgramReward(req, res) {
  const taskId = toPositiveInt(
    req.query.taskId ||
    req.query.task_id
  )

  const telegramId = toPositiveInt(
    req.query.userid ||
    req.query.userId ||
    req.query.tgid
  )

  if (!taskId || !telegramId) {
    return res.status(400).json({
      error: 'Missing taskId or userid',
    })
  }

  try {
    // -----------------------------------------
    // GET TASK
    // -----------------------------------------

    const {
      data: task,
      error: taskError,
    } = await getTask(taskId)

    if (
      taskError ||
      !task ||
      !task.is_active
    ) {
      return res.status(400).json({
        error: 'Task not found or inactive',
      })
    }

    // -----------------------------------------
    // ONLY ADSGRAM TASKS
    // -----------------------------------------

    if (
      String(task.task_type || '')
        .toLowerCase() !== 'watch_ad'
    ) {
      return res.status(400).json({
        error:
          'Reward callback is only allowed for watch_ad tasks',
      })
    }

    const maxCompletions = Math.max(
      1,
      Number(task.max_completions || 1)
    )

    // -----------------------------------------
    // GET PLAYER COMPLETION
    // -----------------------------------------

    const {
      data: completionRow,
      error: completionError,
    } = await getCompletionRow(
      taskId,
      telegramId
    )

    if (completionError) {
      throw completionError
    }

    /*
      IMPORTANT:

      AdsGram callback can only reward if the
      player previously pressed Open.

      opened_at is the server-side session.
    */

    if (
      !completionRow ||
      !completionRow.opened_at
    ) {
      return res.status(400).json({
        error:
          'No active ad session for this player',
      })
    }

    if (
      !isFreshTimestamp(
        completionRow.opened_at
      )
    ) {
      return res.status(400).json({
        error:
          'Ad session expired. Open the ad again.',
      })
    }

    const currentCount = Number(
      completionRow.completion_count || 0
    )

    // -----------------------------------------
    // MAX COMPLETION CHECK
    // -----------------------------------------

    if (
      currentCount >= maxCompletions
    ) {
      return res.status(400).json({
        error:
          'Task completion limit reached for this player',
      })
    }

    const nextCount = currentCount + 1
    const reward = Number(
      task.reward || 0
    )

    /*
      Consume the session FIRST.

      This is what prevents the same callback
      from being used repeatedly.
    */

    const {
      error: consumeError,
    } = await saveCompletionRow({
      taskId,
      telegramId,
      completionCount: nextCount,
      openedAt: null,
    })

    if (consumeError) {
      throw consumeError
    }

    // -----------------------------------------
    // ADD COINS
    // -----------------------------------------

    const coinResult =
      await addCoinsToPlayer(
        telegramId,
        reward
      )

    if (coinResult.error) {
      throw new Error(
        coinResult.error
      )
    }

    // -----------------------------------------
    // SUCCESS
    // -----------------------------------------

    return res.status(200).json({
      success: true,
      reward,
      coins: coinResult.newCoins,
      progress: {
        completed: nextCount,
        max_completions: maxCompletions,
      },
    })
  } catch (err) {
    console.error(
      'AdsGram reward error:',
      err
    )

    return res.status(500).json({
      error:
        err.message ||
        'Failed to process reward',
    })
  }
}

export default async function handler(
  req,
  res
) {
  /*
  ========================================================
  GET = AdsGram callback
  ========================================================
  */

  if (req.method === 'GET') {
    return handleAdsgramReward(
      req,
      res
    )
  }

  /*
  ========================================================
  POST ONLY BELOW THIS POINT
  ========================================================
  */

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
    })
  }

  const auth =
    authenticateRequest(req)

  if (!auth) {
    return res.status(401).json({
      error:
        'Invalid or missing Telegram authentication',
    })
  }

  const telegramId = auth.id

  try {
    const {
      taskId,
      taskType,
      reward: clientReward,
      action,
    } = req.body || {}

    // =====================================================
    // OPEN ADSGRAM TASK SESSION
    // =====================================================

    if (action === 'open') {
      const normalizedTaskId =
        toPositiveInt(taskId)

      if (!normalizedTaskId) {
        return res.status(400).json({
          error: 'Task ID is required',
        })
      }

      const {
        data: task,
        error: taskError,
      } = await getTask(
        normalizedTaskId
      )

      if (
        taskError ||
        !task ||
        !task.is_active
      ) {
        return res.status(400).json({
          error:
            'Task not found or inactive',
        })
      }

      if (
        String(task.task_type || '')
          .toLowerCase() !== 'watch_ad'
      ) {
        return res.status(400).json({
          error:
            'Open session is only for watch_ad tasks',
        })
      }

      const {
        data: completionRow,
        error: completionError,
      } = await getCompletionRow(
        normalizedTaskId,
        telegramId
      )

      if (completionError) {
        throw completionError
      }

      const currentCount = Number(
        completionRow?.completion_count || 0
      )

      const maxCompletions = Math.max(
        1,
        Number(task.max_completions || 1)
      )

      if (
        currentCount >= maxCompletions
      ) {
        return res.status(400).json({
          error:
            'Task completion limit reached for this player',
        })
      }

      /*
        Register a NEW ad session.

        This does NOT give coins.
      */

      const {
        error: saveError,
      } = await saveCompletionRow({
        taskId: normalizedTaskId,
        telegramId,
        completionCount: currentCount,
        openedAt: nowIso(),
      })

      if (saveError) {
        throw saveError
      }

      return res.status(200).json({
        success: true,
        message:
          'Ad session recorded',
      })
    }

    let reward = 0
    let progress = null

    // =====================================================
    // ADMIN TASK
    // =====================================================

    if (
      taskId !== undefined &&
      taskId !== null &&
      String(taskId).trim() !== ''
    ) {
      const normalizedTaskId =
        toPositiveInt(taskId)

      if (!normalizedTaskId) {
        return res.status(400).json({
          error: 'Invalid Task ID',
        })
      }

      const {
        data: task,
        error: taskError,
      } = await getTask(
        normalizedTaskId
      )

      if (
        taskError ||
        !task ||
        !task.is_active
      ) {
        return res.status(400).json({
          error:
            'Task not found or inactive',
        })
      }

      const maxCompletions = Math.max(
        1,
        Number(
          task.max_completions || 1
        )
      )

      // ===================================================
      // WATCH AD
      //
      // IMPORTANT:
      // No manual Claim for AdsGram.
      // Reward comes from GET callback only.
      // ===================================================

      if (
        String(task.task_type || '')
          .toLowerCase() === 'watch_ad'
      ) {
        return res.status(400).json({
          error:
            'watch_ad tasks are completed by AdsGram callback only',
        })
      }

      // ===================================================
      // NORMAL ADMIN TASK
      // ===================================================

      const {
        data: completionRow,
        error: completionError,
      } = await getCompletionRow(
        normalizedTaskId,
        telegramId
      )

      if (completionError) {
        throw completionError
      }

      const currentCount = Number(
        completionRow?.completion_count || 0
      )

      if (
        currentCount >= maxCompletions
      ) {
        return res.status(400).json({
          error:
            'Task completion limit reached for this player',
        })
      }

      /*
        Normal task requires an Open session.
      */

      if (
        !completionRow?.opened_at
      ) {
        return res.status(400).json({
          error:
            'Open the task link first',
        })
      }

      const openedTimestamp =
        Date.parse(
          completionRow.opened_at
        )

      if (
        !Number.isFinite(
          openedTimestamp
        ) ||
        Date.now() -
          openedTimestamp <
          3000
      ) {
        return res.status(400).json({
          error:
            'Wait 3 seconds after opening the task',
        })
      }

      const nextCount =
        currentCount + 1

      reward = Number(
        task.reward || 0
      )

      const {
        error: saveError,
      } = await saveCompletionRow({
        taskId: normalizedTaskId,
        telegramId,
        completionCount: nextCount,
        openedAt: null,
      })

      if (saveError) {
        throw saveError
      }

      progress = {
        completed: nextCount,
        max_completions: maxCompletions,
      }
    }

    // =====================================================
    // BUILTIN TASK
    // =====================================================

    else if (
      taskType &&
      taskType in BUILTIN_TASKS
    ) {
      if (
        BUILTIN_TASKS[taskType] === null
      ) {
        const val =
          Number(clientReward)

        if (
          !Number.isFinite(val) ||
          val <= 0 ||
          val > 5000
        ) {
          return res.status(400).json({
            error:
              'Invalid reward amount',
          })
        }

        reward = val
      } else {
        reward =
          BUILTIN_TASKS[taskType]
      }
    }

    // =====================================================
    // INVALID
    // =====================================================

    else {
      return res.status(400).json({
        error: 'Invalid task',
      })
    }

    // =====================================================
    // ADD COINS
    // =====================================================

    const coinResult =
      await addCoinsToPlayer(
        telegramId,
        reward
      )

    if (coinResult.error) {
      throw new Error(
        coinResult.error
      )
    }

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(200).json({
      success: true,
      coins: coinResult.newCoins,
      reward,
      ...(progress
        ? { progress }
        : {}),
    })
  } catch (err) {
    console.error(
      'tasks/complete error:',
      err
    )

    return res.status(500).json({
      error:
        err.message ||
        'Failed to complete task',
    })
  }
}
