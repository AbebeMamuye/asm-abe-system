import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer — General-Purpose Asset Management System
const dbAPI = {
  // Assets
  addAsset: (data: any) => ipcRenderer.invoke('db:add-asset', data),
  authenticate: (emailOrName: string, password: string) =>
    ipcRenderer.invoke('db:authenticate', emailOrName, password),
  verifyPin: (userId: number, pin: string) => ipcRenderer.invoke('db:verify-pin', userId, pin),
  registerUser: (user) => ipcRenderer.invoke('db:register-user', user),
  getAllUsers: () => ipcRenderer.invoke('db:get-all-users'),
  getUserByEmail: (email) => ipcRenderer.invoke('db:get-user-by-email', email),
  updateUser: (id: number, data: any) => ipcRenderer.invoke('db:update-user', id, data),
  deleteUser: (id: number) => ipcRenderer.invoke('db:delete-user', id),
  getAssets: () => ipcRenderer.invoke('db:get-assets'),
  updateAsset: (id: number, data: any) => ipcRenderer.invoke('db:update-asset', id, data),
  deleteAsset: (id: number) => ipcRenderer.invoke('db:delete-asset', id),

  // Vouchers — Model 19 (Receipt)
  createVoucherM19: (data: any) => ipcRenderer.invoke('db:create-voucher-m19', data),
  getVouchersM19: () => ipcRenderer.invoke('db:get-vouchers-m19'),

  // Vouchers — Model 20 (Requisition)
  createVoucherM20: (data: any) => ipcRenderer.invoke('db:create-voucher-m20', data),
  getVouchersM20: () => ipcRenderer.invoke('db:get-vouchers-m20'),

  // Vouchers — Model 22 (Issuing)
  createVoucherM22: (data: any) => ipcRenderer.invoke('db:create-voucher-m22', data),
  getVouchersM22: () => ipcRenderer.invoke('db:get-vouchers-m22'),

  // Voucher utilities
  getNextVoucherNumber: (type: string) => ipcRenderer.invoke('db:next-voucher-number', type),

  // Analytics & Logs
  getStats: () => ipcRenderer.invoke('db:get-stats'),
  getTransactions: () => ipcRenderer.invoke('db:get-transactions'),
  getTransactionsByAsset: (assetId: number) => ipcRenderer.invoke('db:get-transactions-by-asset', assetId),
  getMaintenance: () => ipcRenderer.invoke('db:get-maintenance'),
  getMaintenanceLogs: () => ipcRenderer.invoke('db:get-maintenance'),
  addMaintenance: (data: any) => ipcRenderer.invoke('db:add-maintenance', data),
  updateMaintenance: (id: number, updates: any) => ipcRenderer.invoke('db:update-maintenance', id, updates),

  // System
  resetDatabase: () => ipcRenderer.invoke('db:reset'),
  getDbPath: () => ipcRenderer.invoke('db:get-path'),

  // Pending Requests
  getPendingRequests: (status?: string) => ipcRenderer.invoke('db:get-pending', status),
  createPendingRequest: (req: any) => ipcRenderer.invoke('db:create-pending', req),
  reviewPendingRequest: (id: number, action: string, reviewedBy: string, reviewNote?: string) => ipcRenderer.invoke('db:review-pending', id, action, reviewedBy, reviewNote),

  // Inventory Counts & Disposals
  getInventoryCounts: () => ipcRenderer.invoke('db:get-inventory-counts'),
  getInventoryCountById: (id: number) => ipcRenderer.invoke('db:get-inventory-count-by-id', id),
  createInventoryCount: (data: any) => ipcRenderer.invoke('db:create-inventory-count', data),
  getDisposals: () => ipcRenderer.invoke('db:get-disposals'),
  createDisposal: (data: any) => ipcRenderer.invoke('db:create-disposal', data),

  // AMIS Hierarchies, Transfers & Allocations
  getHierarchies: () => ipcRenderer.invoke('db:get-hierarchies'),
  createHierarchy: (data: any) => ipcRenderer.invoke('db:create-hierarchy', data),
  deleteHierarchy: (id: number) => ipcRenderer.invoke('db:delete-hierarchy', id),
  getTransfers: () => ipcRenderer.invoke('db:get-transfers'),
  createTransfer: (data: any) => ipcRenderer.invoke('db:create-transfer', data),
  respondTransfer: (id: number, status: string, note?: string) => ipcRenderer.invoke('db:respond-transfer', id, status, note),
  getAllocations: () => ipcRenderer.invoke('db:get-allocations'),
  createAllocation: (data: any) => ipcRenderer.invoke('db:create-allocation', data),
  changePassword: (userId: number, newPass: string) => ipcRenderer.invoke('db:change-password', userId, newPass),
  getAssetHistory: (assetId?: number) => ipcRenderer.invoke('db:get-asset-history', assetId),
  recordAssetHistory: (entry: any) => ipcRenderer.invoke('db:record-asset-history', entry),
  getDepartments: () => ipcRenderer.invoke('db:get-departments'),
  createDepartment: (data: any) => ipcRenderer.invoke('db:create-department', data),
  updateDepartment: (id: number, data: any) => ipcRenderer.invoke('db:update-department', id, data),
  deleteDepartment: (id: number) => ipcRenderer.invoke('db:delete-department', id),
  clearSystemData: (options?: any) => ipcRenderer.invoke('db:clear-data', options),
  getSystemSettings: () => ipcRenderer.invoke('db:get-system-settings'),
  setSystemSetting: (key: string, value: string) => ipcRenderer.invoke('db:set-system-setting', key, value)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if main world isolation is enabled, otherwise
// add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', dbAPI)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in d.ts)
  window.electron = electronAPI
  // @ts-ignore
  window.api = dbAPI
}
