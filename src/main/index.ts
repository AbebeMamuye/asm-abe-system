import { app, shell, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import * as db from './database'
import express from 'express'
import cors from 'cors'
import http from 'http'

const PORT = 5001

// ── Single Instance Lock ──────────────────────────────────────
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  // Another instance already running — open browser and exit
  shell.openExternal(`http://localhost:${PORT}`)
  app.quit()
}

// ── Icon path (production uses process.resourcesPath) ─────────
function getIconPath(ext: 'ico' | 'png' = 'ico'): string {
  if (!is.dev) {
    return join(process.resourcesPath, `icon.${ext}`)
  }
  return join(__dirname, `../../resources/icon.${ext === 'ico' ? 'png' : ext}`)
}

function loadTrayImage(): Electron.NativeImage {
  // Try .ico first (Windows), fallback to .png
  let img = nativeImage.createFromPath(getIconPath('ico'))
  if (img.isEmpty()) {
    img = nativeImage.createFromPath(getIconPath('png'))
  }
  return img
}

// ── Dev window ───────────────────────────────────────────────
function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow.show())

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev) {
    let rendererUrl = process.env['ELECTRON_RENDERER_URL'] || 'http://localhost:5173'
    rendererUrl = rendererUrl.replace('localhost', '127.0.0.1')
    mainWindow.loadURL(rendererUrl)
  } else {
    mainWindow.loadURL(`http://localhost:${PORT}`)
  }
}

// ── Check if port is free ─────────────────────────────────────
function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const tester = http
      .createServer()
      .once('error', () => resolve(true))
      .once('listening', () => {
        tester.close()
        resolve(false)
      })
      .listen(port, '127.0.0.1')
  })
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.ams.asset-management')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // ── Database ─────────────────────────────────────────────────
  try {
    db.initDatabase()
    console.log('[AMS] Database initialized.')
  } catch (err) {
    console.error('[AMS] Database init failed:', err)
  }

  // ── Express Server ───────────────────────────────────────────
  const portBusy = await isPortInUse(PORT)
  if (portBusy) {
    console.log(`[AMS] Port ${PORT} already in use — opening existing server.`)
    if (!is.dev) shell.openExternal(`http://localhost:${PORT}`)
  } else {
    try {
      const server = express()
      server.use(cors())
      server.use(express.json())

      // ── Auth & user routes ──
      server.post('/api/auth/login', (req, res) => {
        const { emailOrName, password } = req.body
        if (!emailOrName || !password) {
          return res.status(400).json({ success: false, error: 'Credentials required' })
        }
        res.json(db.authenticateUser(emailOrName, password))
      })
      server.post('/api/auth/verify-pin', (req, res) => {
        const { userId, pin } = req.body
        if (!userId || !pin) return res.status(400).json({ valid: false })
        res.json({ valid: db.verifyUserPin(userId, pin) })
      })
      server.post('/api/users/register', (req, res) => res.json(db.registerUser(req.body)))
      server.get('/api/users', (_req, res) => res.json(db.getAllUsers()))
      server.put('/api/users/:id', (req, res) =>
        res.json(db.updateUser(parseInt(req.params.id), req.body))
      )
      server.delete('/api/users/:id', (req, res) =>
        res.json(db.deleteUser(parseInt(req.params.id)))
      )

      // ── Asset routes ──
      server.get('/api/assets', (_req, res) => res.json(db.getAllAssets()))
      server.post('/api/assets', (req, res) => res.json(db.addAsset(req.body)))
      server.put('/api/assets/:id', (req, res) =>
        res.json(db.updateAsset(parseInt(req.params.id), req.body))
      )
      server.delete('/api/assets/:id', (req, res) =>
        res.json(db.deleteAsset(parseInt(req.params.id)))
      )

      // ── Voucher routes ──
      server.get('/api/vouchers/m19', (_req, res) => res.json(db.getAllVouchersM19()))
      server.post('/api/vouchers/m19', (req, res) => res.json(db.createVoucherM19(req.body)))
      server.get('/api/vouchers/m20', (_req, res) => res.json(db.getAllVouchersM20()))
      server.post('/api/vouchers/m20', (req, res) => res.json(db.createVoucherM20(req.body)))
      server.get('/api/vouchers/m22', (_req, res) => res.json(db.getAllVouchersM22()))
      server.post('/api/vouchers/m22', (req, res) => res.json(db.createVoucherM22(req.body)))
      server.get('/api/vouchers/nextNumber/:type', (req, res) =>
        res.json({ nextNumber: db.getNextVoucherNumber(req.params.type) })
      )

      // ── Stats / Transactions / Maintenance / Pending ──
      server.get('/api/stats', (_req, res) => res.json(db.getDashboardStats()))
      server.get('/api/transactions', (_req, res) => res.json(db.getAllTransactions()))
      server.get('/api/transactions/asset/:id', (req, res) =>
        res.json(db.getTransactionsByAsset(parseInt(req.params.id)))
      )
      server.get('/api/maintenance', (_req, res) => res.json(db.getMaintenanceLogs()))
      server.post('/api/maintenance', (req, res) => res.json(db.addMaintenance(req.body)))
      server.put('/api/maintenance/:id', (req, res) =>
        res.json(db.updateMaintenance(parseInt(req.params.id), req.body))
      )
      server.get('/api/pending', (req, res) =>
        res.json(db.getPendingRequests(req.query.status as string))
      )
      server.post('/api/pending', (req, res) => res.json(db.createPendingRequest(req.body)))
      server.put('/api/pending/:id/review', (req, res) => {
        const { action, reviewedBy, reviewNote } = req.body
        res.json(
          db.reviewPendingRequest(parseInt(req.params.id), action, reviewedBy, reviewNote)
        )
      })

      // ── Inventory Counts & Disposals ──
      server.get('/api/inventory-counts', (_req, res) => res.json(db.getAllInventoryCounts()))
      server.get('/api/inventory-counts/:id', (req, res) =>
        res.json(db.getInventoryCountById(parseInt(req.params.id)))
      )
      server.post('/api/inventory-counts', (req, res) =>
        res.json(db.createInventoryCount(req.body))
      )
      server.get('/api/disposals', (_req, res) => res.json(db.getAllDisposals()))
      server.post('/api/disposals', (req, res) => res.json(db.createDisposal(req.body)))

      // ── AMIS Hierarchies, Transfers & Allocations ──
      server.get('/api/hierarchies', (_req, res) => res.json(db.getAllHierarchies()))
      server.post('/api/hierarchies', (req, res) => res.json(db.createHierarchy(req.body)))
      server.delete('/api/hierarchies/:id', (req, res) => res.json(db.deleteHierarchy(parseInt(req.params.id))))

      server.get('/api/transfers', (_req, res) => res.json(db.getAllTransfers()))
      server.post('/api/transfers', (req, res) => res.json(db.createTransfer(req.body)))
      server.put('/api/transfers/:id/respond', (req, res) => {
        const { status, note } = req.body
        res.json(db.respondTransfer(parseInt(req.params.id), status, note))
      })

      server.get('/api/allocations', (_req, res) => res.json(db.getAllAllocations()))
      server.post('/api/allocations', (req, res) => res.json(db.createAllocation(req.body)))

      server.post('/api/auth/change-password', (req, res) => {
        const { userId, newPassword } = req.body
        res.json(db.changeUserPassword(userId, newPassword))
      })

      // ── Asset Lifecycle History ──
      server.get('/api/asset-history', (req, res) => {
        const assetId = req.query.assetId ? parseInt(req.query.assetId as string) : undefined
        res.json(db.getAssetHistory(assetId))
      })
      server.post('/api/asset-history', (req, res) => {
        db.recordAssetHistory(req.body)
        res.json({ success: true })
      })

      // ── Bulk Assets & Clearance & Departments & System ──
      server.post('/api/assets/bulk', (req, res) => {
        const assets = Array.isArray(req.body) ? req.body : req.body?.assets
        res.json(db.addAssetsBulk(assets || []))
      })

      server.get('/api/clearance', (_req, res) => res.json(db.getAllClearances()))
      server.post('/api/clearance', (req, res) => res.json(db.createClearance(req.body)))
      server.get('/api/clearance/employee-assets/:name', (req, res) =>
        res.json(db.getEmployeeAssignedAssets(decodeURIComponent(req.params.name)))
      )
      server.get('/api/clearance/employee-consumables/:name', (req, res) =>
        res.json(db.getEmployeeConsumables(decodeURIComponent(req.params.name)))
      )
      server.post('/api/clearance/return-asset', (req, res) => res.json(db.returnAssetToStore(req.body)))
      server.post('/api/clearance/finalize', (req, res) => res.json(db.finalizeClearance(req.body)))

      server.get('/api/departments', (_req, res) => res.json(db.getAllDepartments()))
      server.post('/api/departments', (req, res) => res.json(db.createDepartment(req.body)))
      server.put('/api/departments/:id', (req, res) => res.json(db.updateDepartment(parseInt(req.params.id), req.body)))
      server.delete('/api/departments/:id', (req, res) => res.json(db.deleteDepartment(parseInt(req.params.id))))

      server.get('/api/system/settings', (_req, res) => res.json(db.getAllSystemSettings()))
      server.post('/api/system/settings', (req, res) => {
        db.setSystemSetting(req.body.key, String(req.body.value ?? ''))
        res.json({ success: true })
      })
      server.get('/api/system/backup/download', async (_req, res) => {
        const b = await db.createDatabaseBackup()
        if (b.success && b.filePath) res.download(b.filePath, b.filename)
        else res.status(500).json({ error: b.error })
      })
      server.get('/api/system/backups', (_req, res) => res.json(db.listBackups()))
      server.post('/api/system/restore/upload', (req, res) => {
        const buf = Buffer.from(req.body.dataBase64, 'base64')
        res.json(db.restoreDatabaseFromFile(buf))
      })
      server.get('/api/system/license', (_req, res) => res.json(db.getSystemLicenseStatus()))
      server.post('/api/system/license/activate', (req, res) => res.json(db.activateSystemLicense(req.body.key, req.body.clientName)))

      // ── Static renderer (built React app) ──
      // In production: app.asar/out/renderer — Electron patches fs to read from asar
      const rendererPath = join(__dirname, '../renderer')
      server.use(express.static(rendererPath))

      // SPA fallback — serve index.html for all non-API routes
      server.use((req, res, next) => {
        if (!req.path.startsWith('/api/')) {
          res.sendFile(join(rendererPath, 'index.html'))
        } else {
          next()
        }
      })

      const httpServer = server.listen(PORT, '127.0.0.1', () => {
        console.log(`[AMS] Server running on http://localhost:${PORT}`)
        if (!is.dev) {
          // Small delay so the server is fully ready before browser opens
          setTimeout(() => shell.openExternal(`http://localhost:${PORT}`), 500)
        }
      })

      httpServer.on('error', (err: NodeJS.ErrnoException) => {
        console.error('[AMS] Server listen error:', err.code, err.message)
        if (err.code === 'EADDRINUSE') {
          console.log('[AMS] Port busy — opening existing instance in browser.')
          if (!is.dev) shell.openExternal(`http://localhost:${PORT}`)
        }
      })
    } catch (err) {
      console.error('[AMS] Express setup failed:', err)
    }
  }

  // ── IPC Handlers ─────────────────────────────────────────────
  ipcMain.handle('db:add-asset', (_, data) => db.addAsset(data))
  ipcMain.handle('db:authenticate', (_, emailOrName, password) => db.authenticateUser(emailOrName, password))
  ipcMain.handle('db:verify-pin', (_, userId, pin) => db.verifyUserPin(userId, pin))
  ipcMain.handle('db:register-user', (_, user) => db.registerUser(user))
  ipcMain.handle('db:get-all-users', () => db.getAllUsers())
  ipcMain.handle('db:get-user-by-email', (_, email) => db.getUserByEmail(email))
  ipcMain.handle('db:get-assets', () => db.getAllAssets())
  ipcMain.handle('db:update-asset', (_, id, data) => db.updateAsset(id, data))
  ipcMain.handle('db:delete-asset', (_, id) => db.deleteAsset(id))
  ipcMain.handle('db:update-user', (_, id, data) => db.updateUser(id, data))
  ipcMain.handle('db:delete-user', (_, id) => db.deleteUser(id))
  ipcMain.handle('db:create-voucher-m19', (_, data) => db.createVoucherM19(data))
  ipcMain.handle('db:get-vouchers-m19', () => db.getAllVouchersM19())
  ipcMain.handle('db:create-voucher-m20', (_, data) => db.createVoucherM20(data))
  ipcMain.handle('db:seal-voucher-m20', (_, id, sealedBy, sealHash) => db.sealVoucherM20(id, sealedBy, sealHash))
  ipcMain.handle('db:get-vouchers-m20', () => db.getAllVouchersM20())
  ipcMain.handle('db:create-voucher-m22', (_, data) => db.createVoucherM22(data))
  ipcMain.handle('db:get-vouchers-m22', () => db.getAllVouchersM22())
  ipcMain.handle('db:next-voucher-number', (_, type) => db.getNextVoucherNumber(type))
  ipcMain.handle('db:get-stats', () => db.getDashboardStats())
  ipcMain.handle('db:get-transactions', () => db.getAllTransactions())
  ipcMain.handle('db:get-transactions-by-asset', (_, assetId) =>
    db.getTransactionsByAsset(assetId)
  )
  ipcMain.handle('db:get-maintenance', () => db.getMaintenanceLogs())
  ipcMain.handle('db:add-maintenance', (_, data) => db.addMaintenance(data))
  ipcMain.handle('db:update-maintenance', (_, id, updates) => db.updateMaintenance(id, updates))
  ipcMain.handle('db:get-pending', (_, status) => db.getPendingRequests(status))
  ipcMain.handle('db:create-pending', (_, req) => db.createPendingRequest(req))
  ipcMain.handle('db:review-pending', (_, id, action, reviewedBy, reviewNote) =>
    db.reviewPendingRequest(id, action, reviewedBy, reviewNote)
  )
  ipcMain.handle('db:reset', () => db.resetDatabase())
  ipcMain.handle('db:get-path', () => db.getDbPath())
  ipcMain.handle('db:get-inventory-counts', () => db.getAllInventoryCounts())
  ipcMain.handle('db:get-inventory-count-by-id', (_, id) => db.getInventoryCountById(id))
  ipcMain.handle('db:create-inventory-count', (_, data) => db.createInventoryCount(data))
  ipcMain.handle('db:get-disposals', () => db.getAllDisposals())
  ipcMain.handle('db:create-disposal', (_, data) => db.createDisposal(data))

  // ── AMIS Hierarchies, Transfers & Allocations IPC ──
  ipcMain.handle('db:get-hierarchies', () => db.getAllHierarchies())
  ipcMain.handle('db:create-hierarchy', (_, data) => db.createHierarchy(data))
  ipcMain.handle('db:delete-hierarchy', (_, id) => db.deleteHierarchy(id))
  ipcMain.handle('db:get-transfers', () => db.getAllTransfers())
  ipcMain.handle('db:create-transfer', (_, data) => db.createTransfer(data))
  ipcMain.handle('db:respond-transfer', (_, id, status, note) => db.respondTransfer(id, status, note))
  ipcMain.handle('db:get-allocations', () => db.getAllAllocations())
  ipcMain.handle('db:create-allocation', (_, data) => db.createAllocation(data))
  ipcMain.handle('db:change-password', (_, userId, newPassword) => db.changeUserPassword(userId, newPassword))
  ipcMain.handle('db:get-asset-history', (_, assetId) => db.getAssetHistory(assetId))
  ipcMain.handle('db:record-asset-history', (_, entry) => {
    db.recordAssetHistory(entry)
    return { success: true }
  })
  ipcMain.handle('db:get-departments', () => db.getAllDepartments())
  ipcMain.handle('db:create-department', (_, data) => db.createDepartment(data))
  ipcMain.handle('db:update-department', (_, id, data) => db.updateDepartment(id, data))
  ipcMain.handle('db:delete-department', (_, id) => db.deleteDepartment(id))
  ipcMain.handle('db:clear-data', (_, options) => db.clearSystemData(options))
  ipcMain.handle('db:get-system-settings', () => db.getAllSystemSettings())
  ipcMain.handle('db:set-system-setting', (_, key, value) => {
    db.setSystemSetting(key, value)
    return { success: true }
  })

  // ── Window / Tray ─────────────────────────────────────────────
  if (is.dev) {
    createWindow()
  } else {
    // Production: headless tray — browser is the UI
    const trayImage = loadTrayImage()
    const tray = new Tray(trayImage)

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Open Asset Management System',
        click: () => shell.openExternal(`http://localhost:${PORT}`)
      },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() }
    ])

    tray.setToolTip('Asset Management System')
    tray.setContextMenu(contextMenu)
    tray.on('double-click', () => shell.openExternal(`http://localhost:${PORT}`))
  }

  // Second instance → open browser instead of second server
  app.on('second-instance', () => {
    shell.openExternal(`http://localhost:${PORT}`)
  })

  app.on('activate', () => {
    if (is.dev && BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  // In dev: quit on close. In production: keep alive via Tray.
  if (is.dev && process.platform !== 'darwin') {
    app.quit()
  }
})
