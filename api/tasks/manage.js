import { supabase } from '../../lib/supabase.js'

function isAuthorized(req) {
  const provided = req.headers['x-admin-secret']
  const expected = process.env.ADMIN_SECRET
  return Boolean(expected) && provided === expected
}

function normalizeTaskType(value) {
  const type = String(value || 'normal').trim()
  // قبول جميع الأنواع المطلوبة
  const allowed = ['normal', 'watch_ad', 'smart_ad', 'ads_galaxy', 'join_channel', 'custom']
  return allowed.includes(type) ? type : 'normal'
}

function normalizeMaxCompletions(value) {
  const num = Number(value)
  if (!Number.isFinite(num) || num < 1) return 1
  return Math.floor(num)
}

function isAdTask(taskType) {
  const type = String(taskType || '').toLowerCase()
  return ['watch_ad', 'smart_ad', 'ads_galaxy'].includes(type)
}

export default async function handler(req, res) {
  if (!isAuthorized(req)) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
    })
  }

  // =========================
  // GET — جلب جميع المهام
  // =========================
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      return res.status(200).json({
        success: true,
        tasks: data || [],
      })
    } catch (err) {
      console.error('GET /api/tasks/manage failed:', err)
      return res.status(500).json({
        success: false,
        error: 'Failed to load tasks',
      })
    }
  }

  // =========================
  // POST — إضافة / تعديل / تفعيل / تعطيل / حذف
  // =========================
  if (req.method === 'POST') {
    try {
      const body = req.body || {}
      const { id, title, reward, url, is_active, action, task_type, max_completions } = body
      const normalizedType = normalizeTaskType(task_type)
      const isAd = isAdTask(normalizedType)

      // =========================
      // TOGGLE TASK
      // =========================
      if (action === 'toggle') {
        if (!id) {
          return res.status(400).json({
            success: false,
            error: 'Task ID is required',
          })
        }
        const normalizedId = String(id).trim()
        const { data: task, error: fetchError } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', normalizedId)
          .single()

        if (fetchError || !task) {
          return res.status(404).json({
            success: false,
            error: 'Task not found',
          })
        }

        const newStatus = !Boolean(task.is_active)
        const { data: updated, error: updateError } = await supabase
          .from('tasks')
          .update({ is_active: newStatus })
          .eq('id', normalizedId)
          .select()
          .single()

        if (updateError) throw updateError

        return res.status(200).json({
          success: true,
          task: updated,
          is_active: newStatus,
        })
      }

      // =========================
      // DELETE — حذف مهمة
      // =========================
      if (action === 'delete') {
        if (!id) {
          return res.status(400).json({
            success: false,
            error: 'Task ID is required',
          })
        }
        const normalizedId = String(id).trim()
        const { error: deleteError } = await supabase
          .from('tasks')
          .delete()
          .eq('id', normalizedId)

        if (deleteError) throw deleteError

        return res.status(200).json({
          success: true,
          message: 'Task deleted successfully',
        })
      }

      // =========================
      // CREATE / UPDATE
      // =========================
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Title is required',
        })
      }

      // المهام غير الإعلانية تتطلب رابطاً
      if (!isAd) {
        if (typeof url !== 'string' || !url.trim()) {
          return res.status(400).json({
            success: false,
            error: 'URL is required for non-ad tasks',
          })
        }
      }

      const rewardNum = Number(reward)
      if (!Number.isFinite(rewardNum) || rewardNum <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Reward must be a positive number',
        })
      }

      const MAX_REWARD = 100000
      if (rewardNum > MAX_REWARD) {
        return res.status(400).json({
          success: false,
          error: `Reward exceeds max allowed (${MAX_REWARD})`,
        })
      }

      const payload = {
        title: title.trim(),
        reward: rewardNum,
        url: isAd ? (url || '') : url.trim(),
        is_active: typeof is_active === 'boolean' ? is_active : true,
        task_type: normalizedType,
        max_completions: normalizeMaxCompletions(max_completions),
      }

      let result

      // UPDATE
      if (id !== undefined && id !== null && String(id).trim() !== '') {
        const normalizedId = String(id).trim()
        result = await supabase
          .from('tasks')
          .update(payload)
          .eq('id', normalizedId)
          .select()
      }
      // CREATE
      else {
        result = await supabase
          .from('tasks')
          .insert([payload])
          .select()
      }

      if (result.error) throw result.error

      if (!result.data || result.data.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Task not found',
        })
      }

      return res.status(200).json({
        success: true,
        task: result.data[0],
      })
    } catch (err) {
      console.error('POST /api/tasks/manage failed:', err)
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to save task',
      })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({
    success: false,
    error: `Method ${req.method} Not Allowed`,
  })
}
