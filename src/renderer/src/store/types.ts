export type UserRole = 'Admin' | 'Manager' | 'Staff' | 'Auditor' | 'Viewer' | 'Guest'

export interface User {
  id?: number
  name: string
  email: string
  phone?: string
  position?: string
  locationCode?: string
  departmentCode?: string
  department?: string
  supervisorId?: number
  supervisorName?: string
  role?: UserRole
  avatar?: string
  forcePasswordChange?: number
  createdAt?: string
}

export interface UserHierarchy {
  id?: number
  userId: number
  userName: string
  userPhone?: string
  position?: string
  departmentCode?: string
  supervisorId?: number
  supervisorName?: string
  supervisorPhone?: string
  storeKeeperId?: number
  storeKeeperName?: string
  storeKeeperPhone?: string
  createdAt?: string
}

export interface AssetTransfer {
  id?: number
  assetId: number
  assetName: string
  tagNumber?: string
  fromUserId?: number
  fromUserName: string
  toUserId?: number
  toUserName: string
  department?: string
  reason: string
  status?: 'Pending' | 'Accepted' | 'Declined'
  transferDate?: string
  responseDate?: string
  note?: string
}

export interface ConsumableAllocation {
  id?: number
  assetId: number
  assetName: string
  departmentCode: string
  allocatedQty: number
  allocatedDate?: string
  approvedBy?: string
}

export interface Department {
  id?: number
  code: string
  name: string
  amharicName?: string
  type?: 'Sector' | 'Woreda' | 'Division' | 'Store' | 'Other'
  description?: string
  isActive?: number
  createdAt?: string
}

export type AssetLifecycleStatus = 'Registered' | 'Assigned' | 'Distributed' | 'Under Maintenance' | 'Disposed'

export interface AssetHistory {
  id?: number
  assetId: number
  assetName: string
  tagNumber?: string
  actionType: 'REGISTRATION' | 'ASSIGNMENT' | 'DISTRIBUTION' | 'TRANSFER' | 'MAINTENANCE' | 'DISPOSAL' | 'UPDATE'
  previousStatus?: string
  newStatus?: string
  performedBy?: string
  details?: string
  timestamp?: string
}

export interface Asset {
  id?: number
  name: string
  category:
    | 'Electronics'
    | 'Furniture'
    | 'Vehicles'
    | 'Machinery'
    | 'Appliances'
    | 'Stationery'
    | 'Construction'
    | 'Cleaning'
    | 'Others'
  fundSource: 'Budget' | 'Internal Revenue' | 'Donor/Grant' | 'Special Fund' | 'Others'
  quantity: number
  unitCost: number
  totalValue?: number
  unit: string
  location: string
  condition: 'Functional' | 'Under Maintenance' | 'Non-functional' | 'Disposed'
  serialNumber?: string
  supplier?: string
  purchaseDate?: string
  expiryDate?: string
  usefulLife?: number
  salvageValue?: number
  tagNumber?: string
  custodian?: string
  department?: string
  disposalStatus?: 'Active' | 'Disposed'
  disposalMethod?: string
  disposalDate?: string
  disposalValue?: number
  lifecycleStatus?: AssetLifecycleStatus
  lastUpdated?: string
}

export interface InventoryCountItem {
  id?: number
  countId?: number
  assetId: number
  assetName: string
  systemQty: number
  countedQty: number
  discrepancy: number
  discrepancyType: 'Match' | 'Shortage' | 'Surplus' | 'Damaged'
  condition?: string
  remarks?: string
}

export interface InventoryCount {
  id?: number
  fiscalYear: string
  countDate: string
  committeeChair: string
  committeeMembers: string
  status: 'In Progress' | 'Completed' | 'Reconciled'
  notes?: string
  createdAt?: string
  items?: InventoryCountItem[]
}

export interface Disposal {
  id?: number
  assetId: number
  assetName: string
  quantity: number
  disposalMethod: 'Public Auction' | 'Transfer' | 'Donation' | 'Destruction/Scrap'
  disposalDate: string
  committeeLeader: string
  approvedBy: string
  reason?: string
  recoveredAmount?: number
  status?: string
  createdAt?: string
}

export interface VoucherItem {
  id?: number
  voucherId?: number
  voucherType?: 'MODEL19' | 'MODEL20' | 'MODEL22'
  assetId?: number
  assetName: string
  description?: string
  model?: string
  serial?: string
  pageFrom?: string
  pageTo?: string
  unit: string
  quantity: number
  unitCost: number
  totalCost: number
}

export interface Voucher19 {
  id?: number
  voucherNumber: string
  receivedFrom: string
  receivedDate: string
  storeNo?: string
  shelfNo?: string
  classification?: string
  expenditureNo?: string
  incomingNo?: string
  approvedBy?: string
  receivedBy?: string
  note?: string
  items: VoucherItem[]
  createdAt?: string
}

export interface Voucher20 {
  id?: number
  voucherNumber: string
  issuedTo: string
  department: string
  issuedDate: string
  requestedBy?: string
  authorizedBy?: string
  items: VoucherItem[]
  createdAt?: string
}

export interface Voucher22 {
  id?: number
  voucherNumber: string
  recipientName: string
  issueDate: string
  storekeeperName?: string
  pageFrom?: string
  pageTo?: string
  items: VoucherItem[]
  createdAt?: string
}

export interface Transaction {
  id?: number
  assetId?: number
  assetName: string
  type: 'RECEIVED' | 'REQUISITION' | 'ISSUED'
  quantity: number
  voucherRef?: string
  note?: string
  createdAt?: string
}

export interface MaintenanceLog {
  id?: number
  assetId: number
  assetName?: string
  issueDescription: string
  status: 'Reported' | 'In Progress' | 'Resolved'
  reportedDate?: string
  completedDate?: string
  technicianName?: string
  cost?: number
}

export interface PendingRequest {
  id?: number
  type: string
  requestedBy: string
  department?: string
  description?: string
  payload: string
  status: 'Pending' | 'Approved' | 'Rejected'
  reviewedBy?: string
  reviewNote?: string
  createdAt?: string
  reviewedAt?: string
}

export interface DashboardStats {
  totalAssets: number
  totalValue: number
  functional: number
  nonFunctional: number
  categories: { category: string; count: number; val?: number }[]
  assignedAssets?: {
    count: number
    value: number
    staffCount: number
  }
  maintainedAssets?: {
    count: number
    totalCost: number
    totalTickets: number
  }
  distributedAssets?: {
    count: number
    value: number
    deptCount: number
  }
  disposedAssets?: {
    count: number
    recoveredAmount: number
  }
  ownedAssets?: {
    count: number
    value: number
  }
  lifecycleBreakdown?: {
    registered: number
    assigned: number
    distributed: number
    maintained: number
    disposed: number
  }
  departmentBreakdown?: { dept: string; count: number; val: number }[]
  recentHistory?: AssetHistory[]
}

export const DEFAULT_SYSTEM_USERS = [
  {
    name: 'AbeTech',
    email: 'abetech@ams.local',
    password: 'TechAbe@123',
    role: 'Admin' as UserRole
  },
  {
    name: 'System Admin',
    email: 'admin@ams.local',
    password: 'TechAbe@123',
    role: 'Admin' as UserRole
  },
  {
    name: 'System Auditor',
    email: 'auditor@ams.local',
    password: 'Auditor@AMS2026',
    role: 'Auditor' as UserRole
  },
  {
    name: 'Guest User',
    email: 'guest@ams.local',
    password: 'Guest@AMS2026',
    role: 'Guest' as UserRole
  }
] as const
