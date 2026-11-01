export const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: ['*'],
  MANAGER: [
    'items:read',
    'items:create',
    'items:update',
    'transactions:read',
    'transactions:create',
    'transactions:approve',
    'reports:read',
    'users:read',
  ],
  STAFF: [
    'items:read',
    'items:create',
    'items:update',
    'transactions:read',
    'transactions:create',
    'reports:read',
  ],
  VIEWER: ['items:read', 'transactions:read', 'reports:read'],
};

export function roleHasPermission(role: string | undefined, action: string): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role] || [];
  if (permissions.includes('*')) return true;
  return permissions.includes(action);
}

/** Roles allowed to record stock movements and issue vouchers */
export const STOCK_OPERATION_ROLES = ['ADMIN', 'MANAGER', 'STAFF'] as const;
