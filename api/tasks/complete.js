import { supabase } from '../../lib/supabase.js'
import { authenticateRequest } from '../../lib/telegram-auth.js'

const BUILTIN_TASKS = {
  join_channel: 500,
  game_run: null,
}

const AD_SESSION_WINDOW_MS = 10 * 60 * 1000
const NORMAL_TASK_WAIT_MS = 5000
const SMART_AD_TASK_WAIT_MS = 5000
const ADS_GALAXY_TASK_WAIT_MS = 0
const GIGA_PUB_TASK_WAIT_MS = 0  // إضافة زمن صفر لـ GigaPub
const ADSGRAM_TASK_WAIT_MS = 0   // زمن صفر لـ AdsGram أيضاً (إعلان لا يمكن تخطيه)

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

function getRequiredWaitMs(taskType) {
  const type = String(taskType || '').toLowerCase()
  if (type === 'smart_ad') return SMART_AD_TASK_WAIT_MS
  if (type === 'giga_pub') return GIGA_PUB_TASK_WAIT_MS   // صفر
  if (type === 'ads_galaxy') return ADS_GALAXY_TASK_WAIT_MS
  if (type === 'adsgram') return ADSGRAM_TASK_WAIT_MS     // صفر
  return NORMAL_TASK_WAIT_MS
}

async function getTask(taskId) {
  return supabase
    .from('tasks')
    .select('id, reward, is_active, max_completions, task_type')
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

async function saveCompletionRow({ taskId, telegramId, completionCount, openedAt }) {
  return supabase
    .from('task_completions')
    .upsert(
      {
        task_id: taskId,
        telegram_id: telegramId,
        completion_count: completionCount,
        opened_at: openedAt ?? null,
      },
      { onConflict: 'task_id,telegram_id' }
    )
}

async function addCoinsToPlayer(telegramId, reward) {
  const { data: player, error: fetchError } = await supabase
    .from('players')
    .select('coin')
    .eq('telegram_id', telegramId)
    .single()

  if (fetchError || !player) return { error: 'Player not found' }
  const currentCoins = Number(player.coin || 0)
  const newCoins = currentCoins + reward
  const { error: updateError } = await supabase
    .from('players')
    .update({ coin: newCoins })
    .eq('telegram_id', telegramId)
  if (updateError) return { error: updateError.message || 'Failed to update coins' }
  return { newCoins }
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
    const { taskId, taskType, reward: clientReward, action } = req.body || {}

    if (action === 'open') {
      const normalizedTaskId = toPositiveInt(taskId)
      if (!normalizedTaskId) {
        return res.status(400).json({ error: 'Task ID is required' })
      }
      const { data: task, error: taskError } = await getTask(normalizedTaskId)
      if (taskError || !task || !task.is_active) {
        return res.status(400).json({ error: 'Task not found or inactive' })
      }
      const { data: completionRow, error: completionError } = await getCompletionRow(normalizedTaskId, telegramId)
      if (completionError) throw completionError
      const currentCount = Number(completionRow?.completion_count || 0)
      const maxCompletions = Math.max(1, Number(task.max_completions || 1))
      if (currentCount >= maxCompletions) {
        return res.status(400).json({ error: 'Task completion limit reached for this player' })
      }
      const { error: saveError } = await saveCompletionRow({
        taskId: normalizedTaskId,
        telegramId,
        completionCount: currentCount,
        openedAt: nowIso(),
      })
      if (saveError) throw saveError
      return res.status(200).json({ success: true, message: 'Task open recorded' })
    }

    let reward = 0
    let progress = null

    if (taskId !== undefined && taskId !== null && String(taskId).trim() !== '') {
      const normalizedTaskId = toPositiveInt(taskId)
      if (!normalizedTaskId) {
        return res.status(400).json({ error: 'Invalid Task ID' })
      }
      const { data: task, error: taskError } = await getTask(normalizedTaskId)
      if (taskError || !task || !task.is_active) {
        return res.status(400).json({ error: 'Task not found or inactive' })
      }
      const maxCompletions = Math.max(1, Number(task.max_completions || 1))
      const { data: completionRow, error: completionError } = await getCompletionRow(normalizedTaskId, telegramId)
      if (completionError) throw completionError
      const currentCount = Number(completionRow?.completion_count || 0)
      if (currentCount >= maxCompletions) {
        return res.status(400).json({ error: 'Task completion limit reached for this player' })
      }
      if (!completionRow?.opened_at) {
        return res.status(400).json({ error: 'Open the task link first' })
      }
      const openedTimestamp = Date.parse(completionRow.opened_at)
      const requiredWaitMs = getRequiredWaitMs(task.task_type)
      if (!Number.isFinite(openedTimestamp) || Date.now() - openedTimestamp < requiredWaitMs) {
        return res.status(400).json({ error: `Wait ${requiredWaitMs / 1000} seconds after opening the task` })
      }
      const nextCount = currentCount + 1
      reward = Number(task.reward || 0)
      const { error: saveError } = await saveCompletionRow({
        taskId: normalizedTaskId,
        telegramId,
        completionCount: nextCount,
        openedAt: null,
      })
      if (saveError) throw saveError
      progress = { completed: nextCount, max_completions: maxCompletions }
    } else if (taskType && taskType in BUILTIN_TASKS) {
      if (BUILTIN_TASKS[taskType] === null) {
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

    const coinResult = await addCoinsToPlayer(telegramId, reward)
    if (coinResult.error) throw new Error(coinResult.error)

    return res.status(200).json({
      success: true,
      coins: coinResult.newCoins,
      reward,
      ...(progress ? { progress } : {}),
    })
  } catch (err) {
    console.error('tasks/complete error:', err)
    return res.status(500).json({ error: err.message || 'Failed to complete task' })
  }
}
