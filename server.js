import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import authMe from './api/auth/me.js'
import dailyCheckin from './api/daily-checkin.js'
import tasksComplete from './api/tasks/complete.js'
import tasksManage from './api/tasks/manage.js'
import tasksList from './api/tasks/list.js'
import profileWallet from './api/profile/wallet.js'
import withdraw from './api/withdraw.js'
import exchange from './api/exchange.js'
import leaderboard from './api/leaderboard.js'
import adminBroadcast from './api/admin/broadcast.js'
import adminWithdrawals from './api/admin/withdrawals.js'
import adminWithdrawalsStatus from './api/admin/withdrawals/status.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
app.use(express.json())

const wrap = (handler) => (req, res) => {
  Promise.resolve(handler(req, res)).catch((err) => {
    console.error(err)
    if (!res.headersSent) res.status(500).json({ error: 'Internal server error' })
  })
}

app.all('/api/auth/me', wrap(authMe))
app.all('/api/daily-checkin', wrap(dailyCheckin))
app.all('/api/tasks/complete', wrap(tasksComplete))
app.all('/api/tasks/manage', wrap(tasksManage))
app.all('/api/tasks/list', wrap(tasksList))
app.all('/api/profile/wallet', wrap(profileWallet))
app.all('/api/withdraw', wrap(withdraw))
app.all('/api/exchange', wrap(exchange))
app.all('/api/leaderboard', wrap(leaderboard))
app.all('/api/admin/broadcast', wrap(adminBroadcast))
app.all('/api/admin/withdrawals/status', wrap(adminWithdrawalsStatus))
app.all('/api/admin/withdrawals', wrap(adminWithdrawals))

const distDir = path.join(__dirname, 'dist')
app.use(express.static(distDir))

app.get(/.*/, (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found' })
  }
  res.sendFile(path.join(distDir, 'index.html'))
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
