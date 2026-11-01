import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  FileOutput,
} from 'lucide-react';
import { STOCK_OPERATION_ROLES } from './permissions';

export type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  /** If set, user role must be listed to see this link */
  roles?: readonly string[];
};

export const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Inventory', href: '/inventory', icon: Package },
  {
    name: 'Model 19 — Receiving',
    href: '/stock-in',
    icon: ArrowDownLeft,
    roles: STOCK_OPERATION_ROLES,
  },
  {
    name: 'Model 20 — Requisition',
    href: '/stock-out',
    icon: ArrowUpRight,
    roles: STOCK_OPERATION_ROLES,
  },
  {
    name: 'Model 22 — Issue voucher',
    href: '/model22',
    icon: FileOutput,
    roles: STOCK_OPERATION_ROLES,
  },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
];

export function navItemsForRole(role: string | undefined): NavItem[] {
  return NAV_ITEMS.filter((item) => {
    if (!item.roles) return true;
    return role ? item.roles.includes(role) : false;
  });
}
