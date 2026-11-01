function getBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location) {
    if (window.location.port === '5173') {
      return `http://${window.location.hostname}:5002/api`
    }
    return `${window.location.origin}/api`
  }
  return 'http://127.0.0.1:5002/api'
}

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const baseUrl = getBaseUrl()
  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} ${errorText}`);
  }
  return response.json();
}

export const webAPI = {
  // ── User / Auth ────────────────────────────────────────────
  authenticate: (emailOrName: string, password: string) =>
    fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify({ emailOrName, password }) }),
  verifyPin: async (userId: number, pin: string) => {
    const res = await fetchAPI('/auth/verify-pin', {
      method: 'POST',
      body: JSON.stringify({ userId, pin })
    })
    return res.valid === true
  },
  registerUser: (user) => fetchAPI('/users/register', { method: 'POST', body: JSON.stringify(user) }),
  getAllUsers: () => fetchAPI('/users'),
  updateUser: (id: number, data: any) =>
    fetchAPI(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id: number) => fetchAPI(`/users/${id}`, { method: 'DELETE' }),
  getUserByEmail: async () => null,

  // ── Assets ────────────────────────────────────────────────
  addAsset: (data) => fetchAPI('/assets', { method: 'POST', body: JSON.stringify(data) }),
  getAssets: () => fetchAPI('/assets'),
  updateAsset: (id, data) => fetchAPI(`/assets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAsset: (id) => fetchAPI(`/assets/${id}`, { method: 'DELETE' }),

  // ── Vouchers — Model 19 ──────────────────────────────────
  createVoucherM19: (data) => fetchAPI('/vouchers/m19', { method: 'POST', body: JSON.stringify(data) }),
  getVouchersM19: () => fetchAPI('/vouchers/m19'),

  // ── Vouchers — Model 20 ──────────────────────────────────
  createVoucherM20: (data) => fetchAPI('/vouchers/m20', { method: 'POST', body: JSON.stringify(data) }),
  getVouchersM20: () => fetchAPI('/vouchers/m20'),

  // ── Vouchers — Model 22 ──────────────────────────────────
  createVoucherM22: (data) => fetchAPI('/vouchers/m22', { method: 'POST', body: JSON.stringify(data) }),
  getVouchersM22: () => fetchAPI('/vouchers/m22'),

  // ── Voucher Utilities ──────────────────────────────────────
  getNextVoucherNumber: async (type) => {
    const res = await fetchAPI(`/vouchers/nextNumber/${type}`);
    return res.nextNumber;
  },

  // ── Dashboard / Analytics ──────────────────────────────────
  getStats: () => fetchAPI('/stats'),

  // ── Transactions / Audit ───────────────────────────────────
  getTransactions: () => fetchAPI('/transactions'),

  // ── Maintenance ────────────────────────────────────────────
  getMaintenanceLogs: () => fetchAPI('/maintenance'),
  getMaintenance: () => fetchAPI('/maintenance'),
  addMaintenance: (data) => fetchAPI('/maintenance', { method: 'POST', body: JSON.stringify(data) }),
  updateMaintenance: (id, updates) => fetchAPI(`/maintenance/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),

  // ── System ────────────────────────────────────────────────
  resetDatabase: async () => fetchAPI('/system/reset', { method: 'POST' }),
  clearSystemData: async (options?: any) =>
    fetchAPI('/system/clear-data', { method: 'POST', body: JSON.stringify(options || { keepAdminOnly: true }) }),
  getDbPath: async () => 'http://127.0.0.1:5002/api',

  // ── Pending Requests (Approval Workflow) ──────────────────
  getPendingRequests: (status?: string) => fetchAPI(`/pending${status ? '?status=' + status : ''}`),
  createPendingRequest: (req: any) => fetchAPI('/pending', { method: 'POST', body: JSON.stringify(req) }),
  reviewPendingRequest: (id: number, action: string, reviewedBy: string, reviewNote?: string) =>
    fetchAPI(`/pending/${id}/review`, { method: 'PUT', body: JSON.stringify({ action, reviewedBy, reviewNote }) }),

  // ── Inventory Counts & Disposals ──────────────────────────
  getInventoryCounts: () => fetchAPI('/inventory-counts'),
  getInventoryCountById: (id: number) => fetchAPI(`/inventory-counts/${id}`),
  createInventoryCount: (data: any) => fetchAPI('/inventory-counts', { method: 'POST', body: JSON.stringify(data) }),
  getDisposals: () => fetchAPI('/disposals'),
  createDisposal: (data: any) => fetchAPI('/disposals', { method: 'POST', body: JSON.stringify(data) }),

  // ── AMIS Hierarchies, Transfers & Allocations ──────────────
  getHierarchies: () => fetchAPI('/hierarchies'),
  createHierarchy: (data: any) => fetchAPI('/hierarchies', { method: 'POST', body: JSON.stringify(data) }),
  deleteHierarchy: (id: number) => fetchAPI(`/hierarchies/${id}`, { method: 'DELETE' }),
  getTransfers: () => fetchAPI('/transfers'),
  createTransfer: (data: any) => fetchAPI('/transfers', { method: 'POST', body: JSON.stringify(data) }),
  respondTransfer: (id: number, status: string, note?: string) =>
    fetchAPI(`/transfers/${id}/respond`, { method: 'PUT', body: JSON.stringify({ status, note }) }),
  getAllocations: () => fetchAPI('/allocations'),
  createAllocation: (data: any) => fetchAPI('/allocations', { method: 'POST', body: JSON.stringify(data) }),
  changePassword: (userId: number, newPass: string) =>
    fetchAPI('/auth/change-password', { method: 'POST', body: JSON.stringify({ userId, newPassword: newPass }) }),
  getAssetHistory: (assetId?: number) => fetchAPI(`/asset-history${assetId ? '?assetId=' + assetId : ''}`),
  recordAssetHistory: (entry: any) => fetchAPI('/asset-history', { method: 'POST', body: JSON.stringify(entry) }),

  // ── Departments & Sectors ──────────────────────────────────
  getDepartments: () => fetchAPI('/departments'),
  createDepartment: (data: any) => fetchAPI('/departments', { method: 'POST', body: JSON.stringify(data) }),
  updateDepartment: (id: number, data: any) =>
    fetchAPI(`/departments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDepartment: (id: number) => fetchAPI(`/departments/${id}`, { method: 'DELETE' }),

  // ── System Settings & Feature Toggle ───────────────────────
  getSystemSettings: () => fetchAPI('/system/settings'),
  setSystemSetting: (key: string, value: string) =>
    fetchAPI('/system/settings', { method: 'POST', body: JSON.stringify({ key, value }) })
};

export function setupWebAPI() {
  if (typeof window !== 'undefined' && !window.api) {
    window.api = webAPI;
    console.log('Initialized Web API fallback for browser mode.');
  }
}
