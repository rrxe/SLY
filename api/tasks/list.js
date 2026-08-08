import { supabase } from '../../lib/supabase.js'

// هذا الملف ناقص من مشروعك الأصلي. لوحة التحكم (admin.html) تضيف مهام
// بجدول tasks عن طريق manage.js، لكن ما اكو أي endpoint عام يقرا هاي
// المهام ويرسلها للتطبيق - عشان هيك كانت المهام اللي يضيفها الأدمن
// أبداً ما تظهر عند اللاعبين (Tasks.tsx كانت مهامها هاردكودد بالكامل).

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('id, title, reward, url, is_active')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    return res.status(200).json({ success: true, tasks: data || [] })
  } catch (err) {
    console.error('tasks/list error:', err)
    return res.status(500).json({ success: false, error: err.message })
  }
}
