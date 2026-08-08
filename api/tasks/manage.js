import { supabase } from '../../lib/supabase.js'

function isAuthorized(req) {
  const provided = req.headers['x-admin-secret']
  const expected = process.env.ADMIN_SECRET
  return Boolean(expected) && provided === expected
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
  // POST — إضافة / تعديل / تفعيل / تعطيل
  // =========================
  if (req.method === 'POST') {
    try {
      const body = req.body || {}

      const {
        id,
        title,
        reward,
        url,
        is_active,
        action,
      } = body

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

        // أولاً نجيب الحالة الحالية
        const { data: task, error: fetchError } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', id)
          .single()

        if (fetchError || !task) {
          return res.status(404).json({
            success: false,
            error: 'Task not found',
          })
        }

        // نعكس الحالة
        const newStatus = !Boolean(task.is_active)

        const { data: updated, error: updateError } = await supabase
          .from('tasks')
          .update({
            is_active: newStatus,
          })
          .eq('id', id)
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

        const { error: deleteError } = await supabase
          .from('tasks')
          .delete()
          .eq('id', id)

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

      if (typeof url !== 'string' || !url.trim()) {
        return res.status(400).json({
          success: false,
          error: 'URL is required',
        })
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
        url: url.trim(),
        is_active:
          typeof is_active === 'boolean'
            ? is_active
            : true,
      }

      let result

      // UPDATE
      if (id) {
        result = await supabase
          .from('tasks')
          .update(payload)
          .eq('id', id)
          .select()
      }

      // CREATE
      else {
        result = await supabase
          .from('tasks')
          .insert([payload])
          .select()
      }

      if (result.error) {
        throw result.error
      }

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
