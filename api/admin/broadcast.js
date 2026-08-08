import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const { data: players, error } = await supabase
      .from('players')
      .select('telegram_id');

    if (error) throw error;

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    let sentCount = 0;

    for (const player of players) {
      try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: player.telegram_id,
            text: message,
            parse_mode: 'HTML'
          })
        });
        const result = await response.json();
        if (result.ok) sentCount++;
      } catch (e) {
        // Skip failed messages
      }
    }

    return res.status(200).json({ success: true, sentCount });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
