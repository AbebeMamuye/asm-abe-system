import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      // ── User / Auth ────────────────────────────────────────────
      authenticate: (emailOrName: string, password: string) => Promise<{ success: boolean; user?: any; error?: string }>
      verifyPin: (userId: number, pin: string) => Promise<boolean>
      registerUser: (user: any) => Promise<{ success: boolean; id?: number; error?: string }>
      getAllUsers: () => Promise<any[]>
      getUserByEmail: (email: string) => Promise<any>
      updateUser: (id: number, data: any) => Promise<{ changes: number }>
      deleteUser: (id: number) => Promise<{ changes: number }>

      // ── Assets ────────────────────────────────────────────────
      addAsset: (data: any) => Promise<{ id: number }>
      getAssets: () => Promise<any[]>
      updateAsset: (id: number, data: any) => Promise<{ changes: number }>
      deleteAsset: (id: number) => Promise<{ changes: number }>

      // ── Vouchers — Model 19 (Stock-In Receipt) ─────────────────
      createVoucherM19: (data: any) => Promise<{ success: boolean }>
      getVouchersM19: () => Promise<any[]>

      // ── Vouchers — Model 20 (Requisition) ─────────────────────
      createVoucherM20: (data: any) => Promise<{ success: boolean }>
      getVouchersM20: () => Promise<any[]>

      // ── Vouchers — Model 22 (Issue) ────────────────────────────
      createVoucherM22: (data: any) => Promise<{ success: boolean }>
      getVouchersM22: () => Promise<any[]>

      // ── Voucher Utilities ──────────────────────────────────────
      getNextVoucherNumber: (type: string) => Promise<string>

      // ── Dashboard / Analytics ──────────────────────────────────
      getStats: () => Promise<{
        totalAssets: number
        totalValue: number
        functional: number
        nonFunctional: number
        categories: { category: string; count: number }[]
      }>

      // ── Transactions / Audit ───────────────────────────────────
      getTransactions: () => Promise<any[]>

      // ── Maintenance ────────────────────────────────────────────
      getMaintenanceLogs: () => Promise<any[]>
      getMaintenance: () => Promise<any[]>
      addMaintenance: (data: any) => Promise<{ id: number }>
      updateMaintenance: (id: number, updates: any) => Promise<{ changes: number }>

      // ── System ────────────────────────────────────────────────
      resetDatabase: () => Promise<{ success: boolean }>
      getDbPath: () => Promise<string>

      // ── Pending Requests / Approvals ─────────────────────────
      getPendingRequests: (status?: string) => Promise<any[]>
      createPendingRequest: (req: any) => Promise<{ success: boolean; id?: number }>
      reviewPendingRequest: (id: number, action: string, reviewedBy: string, reviewNote?: string) => Promise<{ success: boolean }>
      getSystemSettings?: () => Promise<Record<string, string>>
      setSystemSetting?: (key: string, value: string) => Promise<{ success: boolean }>
    }
  }
}
