import { supabase } from '../../lib/supabase.js'

// هذا الـ endpoint يرجع المهام المفعلة فقط للتطبيق
// مع بيانات الحد الأقصى للإكمال لكل لاعب.

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('id, title, reward, url, is_active, task_type, max_completions')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    return res.status(200).json({
      success: true,
      tasks: data || [],
    })
  } catch (err) {
    console.error('tasks/list error:', err)
    return res.status(500).json({
      success: false,
      error: err.message,
    })
  }
}
