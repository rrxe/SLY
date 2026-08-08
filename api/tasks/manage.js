import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Simple shared-secret admin check.
// Set ADMIN_SECRET in your environment variables (Vercel/hosting dashboard),
// and send it as the "x-admin-secret" header from your admin panel.
function isAuthorized(req) {
  const provided = req.headers['x-admin-secret'];
  const expected = process.env.ADMIN_SECRET;
  return Boolean(expected) && provided === expected;
}

export default async function handler(req, res) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json({ success: true, tasks: data });
    } catch (err) {
      console.error('GET /api/tasks/manage failed:', err);
      return res.status(500).json({ success: false, error: 'Failed to load tasks' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { id, title, reward, url, is_active } = req.body || {};

      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ success: false, error: 'Title is required' });
      }

      if (typeof url !== 'string' || !url.trim()) {
        return res.status(400).json({ success: false, error: 'URL is required' });
      }

      const rewardNum = Number(reward);
      if (!Number.isFinite(rewardNum) || rewardNum <= 0) {
        return res.status(400).json({ success: false, error: 'Reward must be a positive number' });
      }

      const MAX_REWARD = 100000; // adjust to your game's sane upper bound
      if (rewardNum > MAX_REWARD) {
        return res.status(400).json({ success: false, error: `Reward exceeds max allowed (${MAX_REWARD})` });
      }

      const payload = {
        title: title.trim(),
        reward: rewardNum,
        url: url.trim(),
        is_active: is_active ?? true,
      };

      let result;
      if (id) {
        result = await supabase
          .from('tasks')
          .update(payload)
          .eq('id', id)
          .select();
      } else {
        result = await supabase
          .from('tasks')
          .insert([payload])
          .select();
      }

      if (result.error) throw result.error;

      if (!result.data || result.data.length === 0) {
        return res.status(404).json({ success: false, error: 'Task not found' });
      }

      return res.status(200).json({ success: true, task: result.data[0] });
    } catch (err) {
      console.error('POST /api/tasks/manage failed:', err);
      return res.status(500).json({ success: false, error: 'Failed to save task' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed` });
}
