import express from 'express'
import cors from 'cors'
import { join } from 'path'
import { existsSync } from 'fs'
import os from 'os'
import * as db from '../main/database'

const app = express()
const PORT = parseInt(
  process.env.AMS_PORT || (process.env.PORT && process.env.PORT !== '8085' && process.env.PORT !== '5001' ? process.env.PORT : '5002'),
  10
)
const HOST = process.env.HOST || '0.0.0.0'

// Helper to open browser automatically
function openBrowser(url: string) {
  if (process.env.NO_OPEN || process.env.CI) return
  const cmd =
    process.platform === 'win32'
      ? `start "" "${url}"`
      : process.platform === 'darwin'
      ? `open "${url}"`
      : `xdg-open "${url}"`

  try {
    const { exec } = require('child_process')
    exec(cmd, () => {})
  } catch {}
}

// ── Database Initialization ─────────────────────────────────
db.initDatabase()
console.log('[AMS] SQLite Database initialized at:', db.getDbPath())

// ── Middlewares ─────────────────────────────────────────────
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Request logging in development/server mode
app.use((req, _res, next) => {
  if (req.path.startsWith('/api/')) {
    console.log(`[AMS API] ${req.method} ${req.path}`)
  }
  next()
})

// ── Auth & User Routes ──────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const { emailOrName, password } = req.body
  if (!emailOrName || !password) {
    return res.status(400).json({ success: false, error: 'Credentials required' })
  }
  res.json(db.authenticateUser(emailOrName, password))
})

app.post('/api/auth/verify-pin', (req, res) => {
  const { userId, pin } = req.body
  if (!userId || !pin) return res.status(400).json({ valid: false, error: 'User ID and PIN required' })
  const result = db.verifyUserSigningPin(userId, pin)
  res.json(result)
})

app.post('/api/auth/set-signing-pin', (req, res) => {
  const { userId, pin } = req.body
  if (!userId || !pin) return res.status(400).json({ success: false, error: 'User ID and PIN required' })
  const result = db.setUserSigningPin(userId, pin)
  res.json(result)
})

app.post('/api/auth/change-password', (req, res) => {
  const { userId, newPassword } = req.body
  if (!userId || !newPassword) return res.status(400).json({ success: false, error: 'User ID and password required' })
  res.json(db.changeUserPassword(userId, newPassword))
})

app.post('/api/users/register', (req, res) => res.json(db.registerUser(req.body)))
app.get('/api/users', (_req, res) => res.json(db.getAllUsers()))
app.put('/api/users/:id', (req, res) =>
  res.json(db.updateUser(parseInt(req.params.id, 10), req.body))
)
app.delete('/api/users/:id', (req, res) =>
  res.json(db.deleteUser(parseInt(req.params.id, 10)))
)

// ── Asset Routes ────────────────────────────────────────────
app.get('/api/assets', (req, res) => res.json(db.getAllAssets(req.query.scope as string)))
app.post('/api/assets', (req, res) => res.json(db.addAsset(req.body)))
app.put('/api/assets/:id', (req, res) =>
  res.json(db.updateAsset(parseInt(req.params.id, 10), req.body))
)
app.delete('/api/assets/:id', (req, res) =>
  res.json(db.deleteAsset(parseInt(req.params.id, 10)))
)

// ── Voucher Routes (Model 19, 20, 22) ────────────────────────
app.get('/api/vouchers/m19', (_req, res) => res.json(db.getAllVouchersM19()))
app.post('/api/vouchers/m19', (req, res) => res.json(db.createVoucherM19(req.body)))
app.get('/api/vouchers/m20', (_req, res) => res.json(db.getAllVouchersM20()))
app.post('/api/vouchers/m20', (req, res) => res.json(db.createVoucherM20(req.body)))
app.get('/api/vouchers/m22', (_req, res) => res.json(db.getAllVouchersM22()))
app.post('/api/vouchers/m22', (req, res) => res.json(db.createVoucherM22(req.body)))
app.get('/api/vouchers/nextNumber/:type', (req, res) =>
  res.json({ nextNumber: db.getNextVoucherNumber(req.params.type) })
)

// ── Stats / Transactions / Maintenance / Pending Workflow ──
app.get('/api/stats', (_req, res) => res.json(db.getDashboardStats()))
app.get('/api/transactions', (_req, res) => res.json(db.getAllTransactions()))
app.get('/api/transactions/asset/:id', (req, res) =>
  res.json(db.getTransactionsByAsset(parseInt(req.params.id, 10)))
)

app.get('/api/maintenance', (_req, res) => res.json(db.getMaintenanceLogs()))
app.post('/api/maintenance', (req, res) => res.json(db.addMaintenance(req.body)))
app.put('/api/maintenance/:id', (req, res) =>
  res.json(db.updateMaintenance(parseInt(req.params.id, 10), req.body))
)

app.get('/api/pending', (req, res) =>
  res.json(db.getPendingRequests(req.query.status as string, req.query.scope as string))
)
app.post('/api/pending', (req, res) => res.json(db.createPendingRequest(req.body)))
app.put('/api/pending/:id/review', (req, res) => {
  const { action, reviewedBy, reviewNote, signerUserId } = req.body
  res.json(
    db.reviewPendingRequest(parseInt(req.params.id, 10), action, reviewedBy, reviewNote, signerUserId)
  )
})

// ── Inventory Counts & Disposals ────────────────────────────
app.get('/api/inventory-counts', (_req, res) => res.json(db.getAllInventoryCounts()))
app.get('/api/inventory-counts/:id', (req, res) =>
  res.json(db.getInventoryCountById(parseInt(req.params.id, 10)))
)
app.post('/api/inventory-counts', (req, res) =>
  res.json(db.createInventoryCount(req.body))
)
app.get('/api/disposals', (_req, res) => res.json(db.getAllDisposals()))
app.post('/api/disposals', (req, res) => res.json(db.createDisposal(req.body)))

// ── AMIS Hierarchies, Transfers & Allocations ───────────────
app.get('/api/hierarchies', (_req, res) => res.json(db.getAllHierarchies()))
app.post('/api/hierarchies', (req, res) => res.json(db.createHierarchy(req.body)))
app.delete('/api/hierarchies/:id', (req, res) =>
  res.json(db.deleteHierarchy(parseInt(req.params.id, 10)))
)

app.get('/api/transfers', (_req, res) => res.json(db.getAllTransfers()))
app.post('/api/transfers', (req, res) => res.json(db.createTransfer(req.body)))
app.put('/api/transfers/:id/respond', (req, res) => {
  const { status, note } = req.body
  res.json(db.respondTransfer(parseInt(req.params.id, 10), status, note))
})

app.get('/api/allocations', (_req, res) => res.json(db.getAllAllocations()))
app.post('/api/allocations', (req, res) => res.json(db.createAllocation(req.body)))

// ── Employee Clearance & Handover Workflow ──────────────────
app.get('/api/clearance', (_req, res) => res.json(db.getAllClearances()))
app.post('/api/clearance', (req, res) => res.json(db.createClearance(req.body)))
app.get('/api/clearance/employee-assets/:employeeName', (req, res) =>
  res.json(db.getEmployeeAssignedAssets(decodeURIComponent(req.params.employeeName)))
)
app.get('/api/clearance/employee-consumables/:employeeName', (req, res) =>
  res.json(db.getEmployeeConsumables(decodeURIComponent(req.params.employeeName)))
)
app.post('/api/clearance/return-asset', (req, res) => res.json(db.returnAssetToStore(req.body)))
app.post('/api/clearance/finalize', (req, res) => res.json(db.finalizeClearance(req.body)))

// ── Asset Lifecycle History ─────────────────────────────────
app.get('/api/asset-history', (req, res) => {
  const assetId = req.query.assetId ? parseInt(req.query.assetId as string, 10) : undefined
  res.json(db.getAssetHistory(assetId))
})
app.post('/api/asset-history', (req, res) => {
  db.recordAssetHistory(req.body)
  res.json({ success: true })
})

// ── Departments & Sectors (ሴክተር መስሪያ ቤቶች እና ክፍሎች) ─────
app.get('/api/departments', (_req, res) => res.json(db.getAllDepartments()))
app.post('/api/departments', (req, res) => res.json(db.createDepartment(req.body)))
app.put('/api/departments/:id', (req, res) =>
  res.json(db.updateDepartment(parseInt(req.params.id, 10), req.body))
)
app.delete('/api/departments/:id', (req, res) =>
  res.json(db.deleteDepartment(parseInt(req.params.id, 10)))
)

// ── System Utilities ────────────────────────────────────────
app.get('/api/system/info', (_req, res) => {
  res.json({
    status: 'online',
    version: '2.0.0',
    mode: 'web',
    dbPath: db.getDbPath(),
    uptime: process.uptime()
  })
})
app.get('/api/system/db-path', (_req, res) => {
  res.json({ dbPath: db.getDbPath() })
})
app.get('/api/system/settings', (_req, res) => {
  res.json(db.getAllSystemSettings())
})
app.post('/api/system/settings', (req, res) => {
  const { key, value } = req.body
  if (!key) return res.status(400).json({ error: 'Key is required' })
  db.setSystemSetting(key, String(value ?? ''))
  res.json({ success: true, key, value })
})
app.post('/api/system/clear-data', (req, res) => {
  const keepAdmin = req.body?.keepAdminOnly !== false
  res.json(db.clearSystemData({ keepAdminOnly: keepAdmin }))
})
app.post('/api/system/reset', (_req, res) => {
  res.json(db.clearSystemData({ keepAdminOnly: true }))
})

// ── Static Web Frontend (Vite Build Output) ─────────────────
// Check potential paths for the built React frontend
const possibleDistPaths = [
  join(process.cwd(), 'dist'),
  join(__dirname, '../../dist'),
  join(__dirname, '../dist'),
  join(__dirname, '../../out/renderer'),
  join(__dirname, '../renderer')
]
const webRoot = possibleDistPaths.find((p) => existsSync(join(p, 'index.html'))) || join(process.cwd(), 'dist')

console.log('[AMS] Serving web client from:', webRoot)
// Serve static assets (JS/CSS/images) with caching; but never cache index.html
app.use(express.static(webRoot, { index: false }))

// SPA Fallback — always serve fresh index.html (no browser cache)
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/')) {
    const indexPath = join(webRoot, 'index.html')
    if (existsSync(indexPath)) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
      res.setHeader('Pragma', 'no-cache')
      res.setHeader('Expires', '0')
      return res.sendFile(indexPath)
    }
  }
  next()
})

// Helper to discover IPv4 addresses for LAN access
function getLocalIpAddresses(): string[] {
  const interfaces = os.networkInterfaces()
  const addresses: string[] = []
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push(net.address)
      }
    }
  }
  return addresses
}

// ── Start HTTP Server ───────────────────────────────────────
function startServer(port: number, maxAttempts = 10) {
  const server = app.listen(port, HOST, () => {
    console.log('====================================================')
    console.log('🚀 Asset Management System (Web Edition)')
    console.log(`🌐 Local:        http://localhost:${port}`)
    console.log(`🌐 Local IP:     http://127.0.0.1:${port}`)
    const ips = getLocalIpAddresses()
    ips.forEach((ip) => {
      console.log(`🌐 Network:      http://${ip}:${port}`)
    })
    console.log('====================================================')
    openBrowser(`http://localhost:${port}`)
  })

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE' && maxAttempts > 0) {
      console.warn(`[AMS] Port ${port} is in use, trying port ${port + 1}...`)
      startServer(port + 1, maxAttempts - 1)
    } else {
      console.error('[AMS] Server listen error:', err.message)
    }
  })
}

startServer(PORT)

export default app
