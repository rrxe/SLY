import { supabase } from '../../lib/supabase.js'

function maskTelegramId(value) {
  const text = String(value || '')
  if (!text) return 'Player'
  return `Player ••••${text.slice(-4)}`
}

function formatUsername(value, telegramId) {
  const username = String(value || '').trim()

  if (username) {
    return username.startsWith('@')
      ? username
      : `@${username}`
  }

  return maskTelegramId(telegramId)
}

function normalizeStatus(value) {
  const status = String(value || '').toLowerCase()

  if (
    status === 'completed' ||
    status === 'approved' ||
    status === 'paid'
  ) {
    return 'completed'
  }

  return 'pending'
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed',
    })
  }

  try {
    // 1) Get the real withdrawal records.
    // IMPORTANT:
    // username is NOT selected from withdrawal_history.
    const {
      data: withdrawalRows,
      error: withdrawalError,
    } = await supabase
      .from('withdrawal_history')
      .select(
        'id, telegram_id, amount, method, status, created_at'
      )
      .in(
        'status',
        ['pending', 'completed', 'approved', 'paid']
      )
      .order('created_at', {
        ascending: false,
      })
      .limit(10)

    if (withdrawalError) {
      throw withdrawalError
    }

    const rows = withdrawalRows || []

    // 2) Collect telegram IDs from the withdrawal records.
    const telegramIds = [
      ...new Set(
        rows
          .map((row) => row.telegram_id)
          .filter(
            (value) =>
              value !== null &&
              value !== undefined &&
              String(value).trim() !== ''
          )
          .map((value) => String(value))
      ),
    ]

    // 3) Fetch usernames from players.
    const usernameMap = new Map()

    if (telegramIds.length > 0) {
      const {
        data: players,
        error: playersError,
      } = await supabase
        .from('players')
        .select('telegram_id, username')
        .in('telegram_id', telegramIds)

      if (!playersError && Array.isArray(players)) {
        for (const player of players) {
          if (
            player.telegram_id !== null &&
            player.telegram_id !== undefined
          ) {
            usernameMap.set(
              String(player.telegram_id),
              player.username || ''
            )
          }
        }
      }
    }

    // 4) Build the public live feed.
    const withdrawals = rows.map((entry) => {
      const telegramId = String(
        entry.telegram_id || ''
      )

      return {
        id: String(entry.id),
        user: formatUsername(
          usernameMap.get(telegramId),
          telegramId
        ),
        amount: Number(entry.amount || 0),
        method:
          entry.method === 'binance'
            ? 'binance'
            : 'bnb',
        status: normalizeStatus(entry.status),
        createdAt: entry.created_at,
      }
    })

    res.setHeader(
      'Cache-Control',
      'no-store, max-age=0'
    )

    return res.status(200).json({
      withdrawals,
    })
  } catch (err) {
    console.error(
      '[withdrawals/live] error:',
      err
    )

    return res.status(500).json({
      error: 'Unable to load live withdrawals',
    })
  }
}
