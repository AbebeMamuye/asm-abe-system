import { UserRole } from '../store/types'

export type TabId =
  | 'dashboard'
  | 'user-management'
  | 'hierarchies'
  | 'registered-assets'
  | 'distributed-assets'
  | 'owned-assets'
  | 'transfer-assets'
  | 'maintained-assets'
  | 'disposed-assets'
  | 'asset-history'
  | 'vouchers-m19'
  | 'vouchers-m20'
  | 'vouchers-m22'
  | 'reports'
  | 'reports-m19'
  | 'reports-m22'
  | 'reports-balance'
  | 'approvals'
  | 'inventory-count'
  | 'employee-clearance'
  | 'my-assets'
  | 'settings'

export interface RolePermissions {
  // Navigation
  allowedTabs: TabId[]

  // Asset Master Registry
  canRegisterAsset: boolean
  canEditAsset: boolean
  canDeleteAsset: boolean
  canReturnToStore: boolean

  // Asset Operations
  canRecordDisposal: boolean
  canReportMaintenance: boolean
  canManageMaintenance: boolean // Start work, complete repair
  canInitiateTransfer: boolean
  canRespondTransfer: boolean

  // Government Vouchers
  canCreateM19: boolean      // Stock-in Receipt (Storekeeper/Admin)
  canCreateM20: boolean      // Requisition Request (Staff, Manager, Admin)
  canAuthorizeM22: boolean   // Issue Voucher Authorization (Admin, Manager)

  // Institutional Management
  canApproveRequests: boolean
  canManageInventoryCount: boolean
  canManageUsers: boolean    // Add, edit, delete users, reset passwords
  canManageHierarchy: boolean
  canEditBranding: boolean
  canResetDatabase: boolean
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  Admin: {
    allowedTabs: [
      'dashboard',
      'user-management',
      'hierarchies',
      'registered-assets',
      'distributed-assets',
      'owned-assets',
      'transfer-assets',
      'maintained-assets',
      'disposed-assets',
      'asset-history',
      'vouchers-m19',
      'vouchers-m20',
      'vouchers-m22',
      'reports',
      'reports-m19',
      'reports-m22',
      'reports-balance',
      'approvals',
      'inventory-count',
      'employee-clearance',
      'my-assets',
      'settings'
    ],
    canRegisterAsset: true,
    canEditAsset: true,
    canDeleteAsset: true,
    canReturnToStore: true,
    canRecordDisposal: true,
    canReportMaintenance: true,
    canManageMaintenance: true,
    canInitiateTransfer: true,
    canRespondTransfer: true,
    canCreateM19: true,
    canCreateM20: true,
    canAuthorizeM22: true,
    canApproveRequests: true,
    canManageInventoryCount: true,
    canManageUsers: true,
    canManageHierarchy: true,
    canEditBranding: true,
    canResetDatabase: true
  },

  Manager: {
    allowedTabs: [
      'dashboard',
      'user-management', // read-only directory
      'hierarchies',     // view-only
      'registered-assets',
      'distributed-assets',
      'owned-assets',
      'transfer-assets',
      'maintained-assets',
      'disposed-assets',
      'asset-history',
      'vouchers-m19',
      'vouchers-m20',
      'vouchers-m22',
      'reports',
      'reports-m19',
      'reports-m22',
      'reports-balance',
      'approvals',
      'inventory-count',
      'employee-clearance',
      'my-assets'
    ],
    canRegisterAsset: true,
    canEditAsset: true,
    canDeleteAsset: false, // Managers cannot delete master asset records
    canReturnToStore: true,
    canRecordDisposal: true,
    canReportMaintenance: true,
    canManageMaintenance: true,
    canInitiateTransfer: true,
    canRespondTransfer: true,
    canCreateM19: false,   // Storekeeper (Admin) creates stock-in receipts
    canCreateM20: true,
    canAuthorizeM22: true,
    canApproveRequests: true,
    canManageInventoryCount: true,
    canManageUsers: false,
    canManageHierarchy: false,
    canEditBranding: false,
    canResetDatabase: false
  },

  Auditor: {
    allowedTabs: [
      'dashboard',
      'registered-assets',
      'distributed-assets',
      'owned-assets',
      'maintained-assets',
      'disposed-assets',
      'asset-history',
      'vouchers-m19',
      'vouchers-m20',
      'vouchers-m22',
      'reports',
      'reports-m19',
      'reports-m22',
      'reports-balance',
      'approvals',
      'inventory-count'
    ],
    canRegisterAsset: false,
    canEditAsset: false,
    canDeleteAsset: false,
    canReturnToStore: false,
    canRecordDisposal: false,
    canReportMaintenance: false,
    canManageMaintenance: false,
    canInitiateTransfer: false,
    canRespondTransfer: false,
    canCreateM19: false,
    canCreateM20: false,
    canAuthorizeM22: false,
    canApproveRequests: false, // Inspect only
    canManageInventoryCount: false, // Inspect only
    canManageUsers: false,
    canManageHierarchy: false,
    canEditBranding: false,
    canResetDatabase: false
  },

  Staff: {
    allowedTabs: [
      'my-assets',
      'transfer-assets',
      'vouchers-m20',
      'maintained-assets'
    ],
    canRegisterAsset: false,
    canEditAsset: false,
    canDeleteAsset: false,
    canReturnToStore: false,
    canRecordDisposal: false,
    canReportMaintenance: true,
    canManageMaintenance: false,
    canInitiateTransfer: true,
    canRespondTransfer: true,
    canCreateM19: false,
    canCreateM20: true,
    canAuthorizeM22: false,
    canApproveRequests: false,
    canManageInventoryCount: false,
    canManageUsers: false,
    canManageHierarchy: false,
    canEditBranding: false,
    canResetDatabase: false
  },

  Guest: {
    allowedTabs: [
      'my-assets',
      'transfer-assets',
      'vouchers-m20'
    ],
    canRegisterAsset: false,
    canEditAsset: false,
    canDeleteAsset: false,
    canReturnToStore: false,
    canRecordDisposal: false,
    canReportMaintenance: false,
    canManageMaintenance: false,
    canInitiateTransfer: true,
    canRespondTransfer: true,
    canCreateM19: false,
    canCreateM20: true,
    canAuthorizeM22: false,
    canApproveRequests: false,
    canManageInventoryCount: false,
    canManageUsers: false,
    canManageHierarchy: false,
    canEditBranding: false,
    canResetDatabase: false
  },

  Viewer: {
    allowedTabs: [
      'dashboard',
      'registered-assets',
      'distributed-assets',
      'owned-assets',
      'asset-history',
      'reports',
      'reports-m19',
      'reports-m22',
      'reports-balance'
    ],
    canRegisterAsset: false,
    canEditAsset: false,
    canDeleteAsset: false,
    canReturnToStore: false,
    canRecordDisposal: false,
    canReportMaintenance: false,
    canManageMaintenance: false,
    canInitiateTransfer: false,
    canRespondTransfer: false,
    canCreateM19: false,
    canCreateM20: false,
    canAuthorizeM22: false,
    canApproveRequests: false,
    canManageInventoryCount: false,
    canManageUsers: false,
    canManageHierarchy: false,
    canEditBranding: false,
    canResetDatabase: false
  }
}

export function getRolePermissions(role?: string): RolePermissions {
  const normalizedRole = (role as UserRole) || 'Guest'
  return ROLE_PERMISSIONS[normalizedRole] || ROLE_PERMISSIONS.Guest
}

export function canAccessTab(role: string | undefined, tab: string, organizationMode?: 'single' | 'hierarchical'): boolean {
  if (organizationMode === 'single' && tab === 'hierarchies') {
    return false
  }
  const perms = getRolePermissions(role)
  if (tab === 'inventory') return perms.allowedTabs.includes('registered-assets')
  if (tab === 'disposal') return perms.allowedTabs.includes('disposed-assets')
  if (tab === 'maintenance') return perms.allowedTabs.includes('maintained-assets')
  if (tab.startsWith('vouchers')) {
    return perms.allowedTabs.some(t => t.startsWith('vouchers'))
  }
  if (tab.startsWith('reports')) {
    return perms.allowedTabs.some(t => t.startsWith('reports'))
  }
  return perms.allowedTabs.includes(tab as TabId)
}

export function getDefaultTabForRole(role?: string): TabId {
  const normalized = (role as UserRole) || 'Guest'
  if (normalized === 'Staff' || normalized === 'Guest') {
    return 'my-assets'
  }
  return 'dashboard'
}
