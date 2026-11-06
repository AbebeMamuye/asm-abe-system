import Database from 'better-sqlite3'
import { existsSync, copyFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { hashPassword, verifyPassword, isPasswordHashed, hashPin, verifyPin, generateDocumentSignature } from './auth'

let db: Database.Database
const DB_FILENAME = 'asset-management.db'
const LEGACY_DB_FILENAME = 'property-management.db'

// ─── INTERFACES ─────────────────────────────────────────────

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
  lifecycleStatus?: 'Registered' | 'Assigned' | 'Distributed' | 'Under Maintenance' | 'Disposed'
  lastUpdated?: string
}

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
  role?: string
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

// ─── INITIALIZATION ─────────────────────────────────────────

function resolveDbPath(): string {
  // 1. Explicit environment variable
  if (process.env.AMS_DATA_DIR) {
    const customDir = process.env.AMS_DATA_DIR
    if (!existsSync(customDir)) {
      try { mkdirSync(customDir, { recursive: true }) } catch {}
    }
    return join(customDir, DB_FILENAME)
  }

  // 2. Project local 'data' folder (standard for web servers & self-contained deployments)
  const localDataDir = join(process.cwd(), 'data')
  const localDbPath = join(localDataDir, DB_FILENAME)
  if (existsSync(localDbPath)) {
    return localDbPath
  }

  // 3. Electron AppData fallback
  let electronData = ''
  try {
    if (process.versions && process.versions.electron && !process.env.ELECTRON_RUN_AS_NODE) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const electron = require('electron')
      if (electron?.app && typeof electron.app.getPath === 'function') {
        electronData = electron.app.getPath('userData')
      }
    }
  } catch {}

  if (electronData) {
    const electronDb = join(electronData, DB_FILENAME)
    if (existsSync(electronDb)) return electronDb
  }

  // 4. Default to local data folder and ensure it exists
  if (!existsSync(localDataDir)) {
    try { mkdirSync(localDataDir, { recursive: true }) } catch {}
  }
  return localDbPath
}

export const DEFAULT_SYSTEM_USERS = [
  { name: 'AbeTech', email: 'abetech@ams.local', phone: '0911000000', password: 'TechAbe@123', role: 'Admin', position: 'Super Admin', locationCode: 'AK-01', departmentCode: 'ADM' },
  { name: 'System Admin', email: 'admin@ams.local', phone: '0923000001', password: 'TechAbe@123', role: 'Admin', position: 'ሲስተም አድሚን', locationCode: 'AK-01', departmentCode: 'ADM' },
  { name: 'ተመስገን መርሻ', email: 'temesgen@ams.local', phone: '0923000003', password: 'TechAbe@123', role: 'Admin', position: 'የንብረት ግምጃ ቤት ኃላፊ', locationCode: 'AK-01', departmentCode: 'STORE' },
  { name: 'አንተነህ መኮንን', email: 'anteneh@ams.local', phone: '0923000004', password: 'TechAbe@123', role: 'Auditor', position: 'ርዕሰ መምህር', locationCode: 'AK-01', departmentCode: 'ADMIN' },
  { name: 'ዮሐንስ ጌታቸው', email: 'yohannes@ams.local', phone: '0923000005', password: 'TechAbe@123', role: 'Guest', position: 'የአይሲቲ መምህር', locationCode: 'AK-01', departmentCode: 'LT' },
  { name: 'አለሙ በቀለ', email: 'alemu@ams.local', phone: '0923000006', password: 'TechAbe@123', role: 'Guest', position: 'መምህር', locationCode: 'AK-01', departmentCode: 'LT' }
] as const

export const DEFAULT_DEPARTMENTS: Partial<Department>[] = [
  { code: 'WRD-01', name: 'Woreda 01 Administration', amharicName: 'ወረዳ 01 አስተዳደር ጽ/ቤት', type: 'Woreda', description: 'Woreda 01 Public Administration' },
  { code: 'WRD-02', name: 'Woreda 02 Administration', amharicName: 'ወረዳ 02 አስተዳደር ጽ/ቤት', type: 'Woreda', description: 'Woreda 02 Public Administration' },
  { code: 'WRD-03', name: 'Woreda 03 Administration', amharicName: 'ወረዳ 03 አስተዳደር ጽ/ቤት', type: 'Woreda', description: 'Woreda 03 Public Administration' },
  { code: 'WRD-04', name: 'Woreda 04 Administration', amharicName: 'ወረዳ 04 አስተዳደር ጽ/ቤት', type: 'Woreda', description: 'Woreda 04 Public Administration' },
  { code: 'WRD-05', name: 'Woreda 05 Administration', amharicName: 'ወረዳ 05 አስተዳደር ጽ/ቤት', type: 'Woreda', description: 'Woreda 05 Public Administration' },
  { code: 'STORE', name: 'Logistics & Central Store', amharicName: 'ዋና ንብረትና ግምጃ ቤት', type: 'Store', description: 'Central Property Storage & Inventory Hub' },
  { code: 'FIN', name: 'Finance & Economic Development', amharicName: 'ፋይናንስና ኢኮኖሚ ልማት ጽ/ቤት', type: 'Sector', description: 'Budget, Accounting & Procurement' },
  { code: 'EDU', name: 'Education Bureau / Office', amharicName: 'ትምህርት ጽ/ቤት', type: 'Sector', description: 'Schools, Teaching Materials & Academic Facilities' },
  { code: 'HEALTH', name: 'Health Bureau / Center', amharicName: 'ጤና ጽ/ቤት', type: 'Sector', description: 'Health Centers, Clinics & Medical Property' },
  { code: 'IT', name: 'Information Technology (IT)', amharicName: 'ኢንፎርሜሽን ኮሙኒኬሽን ቴክኖሎጂ', type: 'Division', description: 'ICT Infrastructure, Hardware & Systems' },
  { code: 'HR', name: 'Human Resources & Administration', amharicName: 'የሰው ኃይልና ጠቅላላ አገልግሎት', type: 'Division', description: 'Personnel, General Services & Facilities' },
  { code: 'AUD', name: 'Internal Audit & Inspection', amharicName: 'ውስጥ ኦዲትና ቁጥጥር', type: 'Division', description: 'Compliance, Audit Trails & Verification' }
]

export function initDatabase() {
  const dbPath = resolveDbPath()
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      fundSource TEXT NOT NULL DEFAULT 'Budget',
      quantity INTEGER DEFAULT 0,
      unitCost REAL DEFAULT 0,
      unit TEXT DEFAULT 'Piece',
      location TEXT DEFAULT '',
      condition TEXT DEFAULT 'Functional',
      serialNumber TEXT,
      supplier TEXT,
      purchaseDate TEXT,
      expiryDate TEXT,
      usefulLife INTEGER DEFAULT 5,
      salvageValue REAL DEFAULT 0,
      lastUpdated TEXT DEFAULT (datetime('now'))
    )
  `)

  const assetCols = [
    'purchaseDate TEXT',
    'expiryDate TEXT',
    'usefulLife INTEGER DEFAULT 5',
    'salvageValue REAL DEFAULT 0',
    'tagNumber TEXT',
    'custodian TEXT',
    'department TEXT',
    "disposalStatus TEXT DEFAULT 'Active'",
    'disposalMethod TEXT',
    'disposalDate TEXT',
    'disposalValue REAL DEFAULT 0',
    "lifecycleStatus TEXT DEFAULT 'Registered'"
  ]
  for (const col of assetCols) {
    try {
      db.exec(`ALTER TABLE assets ADD COLUMN ${col}`)
    } catch {}
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory_counts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fiscalYear TEXT NOT NULL,
      countDate TEXT NOT NULL,
      committeeChair TEXT NOT NULL,
      committeeMembers TEXT NOT NULL,
      status TEXT DEFAULT 'In Progress',
      notes TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory_count_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      countId INTEGER NOT NULL,
      assetId INTEGER NOT NULL,
      assetName TEXT NOT NULL,
      systemQty INTEGER NOT NULL,
      countedQty INTEGER NOT NULL,
      discrepancy INTEGER NOT NULL,
      discrepancyType TEXT NOT NULL,
      condition TEXT DEFAULT 'Functional',
      remarks TEXT,
      FOREIGN KEY (countId) REFERENCES inventory_counts (id) ON DELETE CASCADE
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS disposals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assetId INTEGER NOT NULL,
      assetName TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      disposalMethod TEXT NOT NULL,
      disposalDate TEXT NOT NULL,
      committeeLeader TEXT NOT NULL,
      approvedBy TEXT NOT NULL,
      reason TEXT,
      recoveredAmount REAL DEFAULT 0,
      status TEXT DEFAULT 'Completed',
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      phone TEXT UNIQUE,
      position TEXT,
      locationCode TEXT,
      departmentCode TEXT,
      password TEXT,
      role TEXT DEFAULT 'Guest',
      avatar TEXT,
      forcePasswordChange INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `)

  const userCols = [
    "role TEXT DEFAULT 'Guest'",
    'phone TEXT',
    'position TEXT',
    'locationCode TEXT',
    'departmentCode TEXT',
    'department TEXT',
    'supervisorId INTEGER',
    'supervisorName TEXT',
    'forcePasswordChange INTEGER DEFAULT 0',
    'signingPinHash TEXT',
    'pinFailedAttempts INTEGER DEFAULT 0',
    'pinLockedUntil TEXT',
    "orgPath TEXT DEFAULT '1/'"
  ]
  for (const col of userCols) {
    try {
      db.exec(`ALTER TABLE users ADD COLUMN ${col}`)
    } catch {}
  }

  // Ensure assets table has orgPath
  try {
    db.exec("ALTER TABLE assets ADD COLUMN orgPath TEXT DEFAULT '1/'")
  } catch {}

  // Ensure pending_requests has approval and digital signature columns
  const pendingCols = [
    "orgPath TEXT DEFAULT '1/'",
    'approvedByUserId INTEGER',
    'digitalSignatureHash TEXT',
    'approvalTimestamp TEXT'
  ]
  for (const col of pendingCols) {
    try {
      db.exec(`ALTER TABLE pending_requests ADD COLUMN ${col}`)
    } catch {}
  }

  // Ensure vouchers tables have digitalSignatureHash and verificationQrData
  for (const tbl of ['vouchers_model19', 'vouchers_model22']) {
    for (const c of ["orgPath TEXT DEFAULT '1/'", 'digitalSignatureHash TEXT', 'verificationQrData TEXT']) {
      try {
        db.exec(`ALTER TABLE ${tbl} ADD COLUMN ${c}`)
      } catch {}
    }
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS user_hierarchies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      userName TEXT NOT NULL,
      userPhone TEXT,
      position TEXT,
      departmentCode TEXT,
      supervisorId INTEGER,
      supervisorName TEXT,
      supervisorPhone TEXT,
      storeKeeperId INTEGER,
      storeKeeperName TEXT,
      storeKeeperPhone TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS asset_transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assetId INTEGER NOT NULL,
      assetName TEXT NOT NULL,
      tagNumber TEXT,
      fromUserId INTEGER,
      fromUserName TEXT NOT NULL,
      toUserId INTEGER,
      toUserName TEXT NOT NULL,
      department TEXT,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'Pending',
      transferDate TEXT DEFAULT (datetime('now')),
      responseDate TEXT,
      note TEXT
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS consumable_allocations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assetId INTEGER NOT NULL,
      assetName TEXT NOT NULL,
      departmentCode TEXT NOT NULL,
      allocatedQty INTEGER NOT NULL,
      allocatedDate TEXT DEFAULT (date('now')),
      approvedBy TEXT
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS vouchers_model19 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voucherNumber TEXT NOT NULL UNIQUE,
      receivedFrom TEXT NOT NULL,
      receivedDate TEXT NOT NULL,
      storeNo TEXT,
      shelfNo TEXT,
      classification TEXT,
      expenditureNo TEXT,
      incomingNo TEXT,
      approvedBy TEXT,
      receivedBy TEXT,
      note TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS vouchers_model20 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voucherNumber TEXT NOT NULL UNIQUE,
      issuedTo TEXT NOT NULL,
      department TEXT NOT NULL,
      issuedDate TEXT NOT NULL,
      requestedBy TEXT,
      authorizedBy TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS vouchers_model22 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voucherNumber TEXT NOT NULL UNIQUE,
      recipientName TEXT NOT NULL,
      issueDate TEXT NOT NULL,
      storekeeperName TEXT,
      pageFrom TEXT,
      pageTo TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS voucher_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voucherId INTEGER NOT NULL,
      voucherType TEXT NOT NULL,
      assetId INTEGER,
      assetName TEXT NOT NULL,
      model TEXT,
      serial TEXT,
      pageFrom TEXT,
      pageTo TEXT,
      unit TEXT,
      quantity INTEGER NOT NULL,
      unitCost REAL DEFAULT 0,
      totalCost REAL DEFAULT 0
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assetId INTEGER,
      assetName TEXT NOT NULL,
      type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      voucherRef TEXT,
      note TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `)

  try {
    db.exec(`ALTER TABLE transactions ADD COLUMN note TEXT`);
  } catch (e) {
    // Column might already exist
  }

  try {
    db.exec(`ALTER TABLE vouchers_model20 ADD COLUMN isSealed INTEGER DEFAULT 0`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE vouchers_model20 ADD COLUMN sealedBy TEXT`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE vouchers_model20 ADD COLUMN sealedAt TEXT`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE vouchers_model20 ADD COLUMN sealHash TEXT`);
  } catch (e) {}

  db.exec(`
    CREATE TABLE IF NOT EXISTS maintenance_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assetId INTEGER NOT NULL,
      issueDescription TEXT NOT NULL,
      status TEXT DEFAULT 'Reported',
      reportedDate TEXT DEFAULT (date('now')),
      completedDate TEXT,
      technicianName TEXT,
      cost REAL DEFAULT 0
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS pending_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      requestedBy TEXT NOT NULL,
      department TEXT,
      description TEXT,
      payload TEXT NOT NULL,
      status TEXT DEFAULT 'Pending',
      reviewedBy TEXT,
      reviewNote TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      reviewedAt TEXT
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS asset_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assetId INTEGER NOT NULL,
      assetName TEXT NOT NULL,
      tagNumber TEXT,
      actionType TEXT NOT NULL,
      previousStatus TEXT,
      newStatus TEXT,
      performedBy TEXT DEFAULT 'System Admin',
      details TEXT,
      timestamp TEXT DEFAULT (datetime('now'))
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      amharicName TEXT,
      type TEXT DEFAULT 'Sector',
      description TEXT,
      isActive INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `)

  // Ensure default sectors / woredas are seeded
  const deptCount = (db.prepare('SELECT COUNT(*) as count FROM departments').get() as { count: number }).count
  if (deptCount === 0) {
    const insertDept = db.prepare(`
      INSERT OR IGNORE INTO departments (code, name, amharicName, type, description, isActive)
      VALUES (?, ?, ?, ?, ?, 1)
    `)
    for (const d of DEFAULT_DEPARTMENTS) {
      insertDept.run(d.code, d.name, d.amharicName || d.name, d.type || 'Sector', d.description || '')
    }
  }

  // Employee Clearance Tables (የሰራተኞች ክሊራንስ ሰንጠረዦች)
  db.exec(`
    CREATE TABLE IF NOT EXISTS employee_clearances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clearanceNo TEXT UNIQUE NOT NULL,
      employeeId INTEGER,
      employeeName TEXT NOT NULL,
      department TEXT NOT NULL,
      position TEXT,
      reason TEXT NOT NULL DEFAULT 'Resignation',
      status TEXT DEFAULT 'IN_PROGRESS',
      initialAssetCount INTEGER DEFAULT 0,
      clearedAssetCount INTEGER DEFAULT 0,
      clearedAt TEXT,
      clearedByStorekeeperId INTEGER,
      clearedByStorekeeperName TEXT,
      approverSignatureHash TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS clearance_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clearanceId INTEGER,
      assetId INTEGER NOT NULL,
      assetName TEXT NOT NULL,
      tagNumber TEXT NOT NULL,
      actionType TEXT NOT NULL,
      conditionAtReturn TEXT DEFAULT 'Functional',
      returnedToStoreNo TEXT,
      transferredToUserId INTEGER,
      transferredToUserName TEXT,
      handledBy TEXT NOT NULL,
      timestamp TEXT DEFAULT (datetime('now'))
    )
  `)

  // Feature Toggle & System Configuration Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `)

  // Default settings
  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO system_settings (key, value) VALUES (?, ?)
  `)
  insertSetting.run('organizationMode', 'hierarchical')
  insertSetting.run('singleOrgType', 'Health Center')
  insertSetting.run('orgName', 'የንብረት አስተዳደር መቆጣጠሪያ ስርዓት')
  insertSetting.run('orgTagline', 'AMIS — ኃላፊነት፣ ግልፅነት እና ቁጥጥር!')

  // If old Addis Ababa or legacy text exists in system_settings, update to new default
  db.prepare(`
    UPDATE system_settings
    SET value = 'የንብረት አስተዳደር መቆጣጠሪያ ስርዓት'
    WHERE key = 'orgName' AND (value LIKE '%የአዲስ አበባ%' OR value LIKE '%አቃቂ ቃሊቲ%' OR value LIKE '%ከተማ አስተዳደር%' OR value = '')
  `).run()

  seedAmisData()
  return db
}

// ─── USER HANDLERS ──────────────────────────────────────────

function getUserRecord(emailOrNameOrPhone: string) {
  const trimmed = emailOrNameOrPhone.trim()
  const normalized = trimmed.toLowerCase()
  return db
    .prepare('SELECT * FROM users WHERE lower(email) = ? OR lower(name) = ? OR phone = ?')
    .get(normalized, normalized, trimmed) as (User & { password?: string }) | undefined
}

function toPublicUser(row: User & { password?: string }): User {
  const { password: _pw, ...user } = row
  return user
}

export function authenticateUser(emailOrNameOrPhone: string, plainPassword: string): { success: boolean; user?: User; error?: string } {
  const record = getUserRecord(emailOrNameOrPhone)
  if (!record?.password) return { success: false, error: 'Invalid credentials' }
  if (!verifyPassword(plainPassword, record.password)) return { success: false, error: 'Invalid credentials' }

  if (!isPasswordHashed(record.password)) {
    db.prepare('UPDATE users SET password=? WHERE id=?').run(hashPassword(plainPassword), record.id)
  }

  return { success: true, user: toPublicUser(record) }
}

export function setUserSigningPin(userId: number, plainPin: string): { success: boolean; message?: string } {
  if (!plainPin || plainPin.trim().length < 4) {
    return { success: false, message: 'PIN must be at least 4 digits' }
  }
  const hashed = hashPin(plainPin)
  const result = db.prepare(`
    UPDATE users 
    SET signingPinHash = ?, pinFailedAttempts = 0, pinLockedUntil = NULL 
    WHERE id = ?
  `).run(hashed, userId)
  return { success: result.changes > 0 }
}

export function verifyUserSigningPin(
  userId: number,
  plainPin: string
): { valid: boolean; error?: string; locked?: boolean; remainingAttempts?: number } {
  const user = db.prepare('SELECT id, password, signingPinHash, pinFailedAttempts, pinLockedUntil FROM users WHERE id = ?').get(userId) as
    | { id: number; password?: string; signingPinHash?: string; pinFailedAttempts?: number; pinLockedUntil?: string }
    | undefined

  if (!user) return { valid: false, error: 'User not found' }

  // Check lockout
  const now = new Date()
  if (user.pinLockedUntil && new Date(user.pinLockedUntil) > now) {
    const diffMins = Math.ceil((new Date(user.pinLockedUntil).getTime() - now.getTime()) / 60000)
    return {
      valid: false,
      locked: true,
      error: `PIN temporarily locked due to multiple failed attempts. Try again in ${diffMins} min(s).`
    }
  }

  const storedSecret = user.signingPinHash || user.password
  const isValid = verifyPin(plainPin, storedSecret)

  if (isValid) {
    // Reset failed counter
    db.prepare('UPDATE users SET pinFailedAttempts = 0, pinLockedUntil = NULL WHERE id = ?').run(userId)
    return { valid: true }
  } else {
    // Increment failed attempts
    const failed = (user.pinFailedAttempts || 0) + 1
    const maxAttempts = 3
    if (failed >= maxAttempts) {
      const lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 mins lock
      db.prepare('UPDATE users SET pinFailedAttempts = ?, pinLockedUntil = ? WHERE id = ?').run(failed, lockUntil, userId)
      return {
        valid: false,
        locked: true,
        remainingAttempts: 0,
        error: 'Too many incorrect attempts! Signing PIN is locked for 15 minutes.'
      }
    } else {
      db.prepare('UPDATE users SET pinFailedAttempts = ? WHERE id = ?').run(failed, userId)
      return {
        valid: false,
        remainingAttempts: maxAttempts - failed,
        error: `Incorrect PIN! ${maxAttempts - failed} attempt(s) remaining before security lockout.`
      }
    }
  }
}

export function verifyUserPin(userId: number, plainPasswordOrPin: string): boolean {
  const result = verifyUserSigningPin(userId, plainPasswordOrPin)
  return result.valid
}

export function registerUser(user: User & { password?: string }) {
  const stmt = db.prepare(`
    INSERT INTO users (name, email, phone, position, locationCode, departmentCode, department, supervisorId, supervisorName, password, role, avatar, forcePasswordChange)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  try {
    const hashed = user.password ? hashPassword(user.password) : null
    const result = stmt.run(
      user.name,
      user.email ? user.email.trim().toLowerCase() : `${user.phone || Date.now()}@ams.local`,
      user.phone || null,
      user.position || '',
      user.locationCode || 'AK-01',
      user.departmentCode || 'LT',
      user.department || null,
      user.supervisorId || null,
      user.supervisorName || null,
      hashed,
      user.role || 'Guest',
      user.avatar || null,
      user.forcePasswordChange ? 1 : 0
    )
    return { success: true, id: result.lastInsertRowid }
  } catch (err: any) {
    return { success: false, error: err.message || 'Email, Phone or Username already registered' }
  }
}

export function getAllUsers() {
  return db.prepare('SELECT id, name, email, phone, position, locationCode, departmentCode, department, supervisorId, supervisorName, role, avatar, forcePasswordChange, createdAt FROM users ORDER BY id ASC').all() as User[]
}

/** @deprecated Use authenticateUser — never exposes password */
export function getUserByEmail(emailOrName: string) {
  const record = getUserRecord(emailOrName)
  return record ? toPublicUser(record) : undefined
}

export function updateUser(id: number, user: User & { password?: string }) {
  const stmt = db.prepare(`
    UPDATE users SET name=?, email=?, phone=?, position=?, locationCode=?, departmentCode=?, department=?, supervisorId=?, supervisorName=?, role=?, avatar=?, forcePasswordChange=?
    WHERE id=?
  `)
  const result = stmt.run(
    user.name,
    user.email ? user.email.trim().toLowerCase() : '',
    user.phone || null,
    user.position || '',
    user.locationCode || 'AK-01',
    user.departmentCode || 'LT',
    user.department || null,
    user.supervisorId || null,
    user.supervisorName || null,
    user.role,
    user.avatar,
    user.forcePasswordChange ? 1 : 0,
    id
  )
  if (user.password) {
    db.prepare('UPDATE users SET password=? WHERE id=?').run(hashPassword(user.password), id)
  }
  return { changes: result.changes }
}

export function recordAssetHistory(entry: {
  assetId: number
  assetName: string
  tagNumber?: string
  actionType: 'REGISTRATION' | 'ASSIGNMENT' | 'DISTRIBUTION' | 'TRANSFER' | 'MAINTENANCE' | 'DISPOSAL' | 'UPDATE'
  previousStatus?: string
  newStatus?: string
  performedBy?: string
  details?: string
}) {
  try {
    db.prepare(`
      INSERT INTO asset_history (assetId, assetName, tagNumber, actionType, previousStatus, newStatus, performedBy, details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      entry.assetId,
      entry.assetName,
      entry.tagNumber || '',
      entry.actionType,
      entry.previousStatus || null,
      entry.newStatus || null,
      entry.performedBy || 'System Admin',
      entry.details || ''
    )
  } catch (err) {
    console.error('[AMS] Failed to record asset history:', err)
  }
}

export function getAssetHistory(assetId?: number) {
  if (assetId) {
    return db.prepare('SELECT * FROM asset_history WHERE assetId = ? ORDER BY timestamp DESC, id DESC').all(assetId) as AssetHistory[]
  }
  return db.prepare('SELECT * FROM asset_history ORDER BY timestamp DESC, id DESC LIMIT 500').all() as AssetHistory[]
}

export function deleteUser(id: number) {
  return db.prepare('DELETE FROM users WHERE id=?').run(id)
}

export function changeUserPassword(userId: number, newPassword: string) {
  const hashed = hashPassword(newPassword)
  const result = db.prepare('UPDATE users SET password = ?, forcePasswordChange = 0 WHERE id = ?').run(hashed, userId)
  return { success: result.changes > 0 }
}

export function getAllAssets(orgScope?: string) {
  let query = 'SELECT *, (quantity * unitCost) as totalValue FROM assets'
  const params: any[] = []
  if (orgScope && orgScope !== '%' && orgScope !== 'all') {
    query += ' WHERE orgPath LIKE ?'
    params.push(`${orgScope}%`)
  }
  query += ' ORDER BY lastUpdated DESC'

  return db
    .prepare(query)
    .all(...params)
    .map((a: any) => {
      const derivedLifecycle =
        a.disposalStatus === 'Disposed' || a.condition === 'Disposed' ? 'Disposed' :
        a.condition === 'Under Maintenance' || a.lifecycleStatus === 'Under Maintenance' ? 'Under Maintenance' :
        (a.custodian && a.custodian.trim()) ? 'Assigned' :
        (a.department && a.department.trim()) ? 'Distributed' : 'Registered'

      return {
        ...a,
        tagNumber: a.tagNumber || `ETH-AMS-${(a.id || 0).toString().padStart(5, '0')}`,
        custodian: a.custodian || '',
        department: a.department || '',
        disposalStatus: a.disposalStatus || 'Active',
        lifecycleStatus: derivedLifecycle
      }
    }) as Asset[]
}

export function addAsset(asset: Asset) {
  const computedStatus =
    asset.disposalStatus === 'Disposed' || asset.condition === 'Disposed' ? 'Disposed' :
    asset.condition === 'Under Maintenance' || asset.lifecycleStatus === 'Under Maintenance' ? 'Under Maintenance' :
    (asset.custodian && asset.custodian.trim()) ? 'Assigned' :
    (asset.department && asset.department.trim()) ? 'Distributed' : 'Registered'

  const stmt = db.prepare(`
    INSERT INTO assets (
      name, category, fundSource, quantity, unit, unitCost, location, condition,
      serialNumber, supplier, purchaseDate, expiryDate, usefulLife, salvageValue,
      tagNumber, custodian, department, disposalStatus, disposalMethod, disposalDate, disposalValue,
      lifecycleStatus
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(
    asset.name,
    asset.category,
    asset.fundSource,
    asset.quantity,
    asset.unit,
    asset.unitCost,
    asset.location,
    asset.condition,
    asset.serialNumber,
    asset.supplier,
    asset.purchaseDate,
    asset.expiryDate,
    asset.usefulLife || 5,
    asset.salvageValue || 0,
    asset.tagNumber || null,
    asset.custodian || null,
    asset.department || null,
    asset.disposalStatus || 'Active',
    asset.disposalMethod || null,
    asset.disposalDate || null,
    asset.disposalValue || 0,
    computedStatus
  )
  const assetId = result.lastInsertRowid as number
  const generatedTag = asset.tagNumber || `ETH-AMS-${assetId.toString().padStart(5, '0')}`

  if (!asset.tagNumber) {
    db.prepare('UPDATE assets SET tagNumber = ? WHERE id = ?').run(generatedTag, assetId)
  }

  if (asset.quantity > 0) {
    db.prepare(
      `INSERT INTO transactions (assetId, assetName, type, quantity, voucherRef, note) VALUES (?, ?, 'RECEIVED', ?, ?, ?)`
    ).run(assetId, asset.name, asset.quantity, 'INITIAL', 'Initial stock registration')
  }

  // Record initial registration in lifecycle history
  recordAssetHistory({
    assetId,
    assetName: asset.name,
    tagNumber: generatedTag,
    actionType: 'REGISTRATION',
    previousStatus: undefined,
    newStatus: computedStatus,
    performedBy: 'System Admin',
    details: `Registered asset into system (${asset.quantity} ${asset.unit || 'units'} @ ETB ${asset.unitCost.toFixed(2)})`
  })

  // If directly assigned to custodian upon registration, log assignment event
  if (asset.custodian) {
    recordAssetHistory({
      assetId,
      assetName: asset.name,
      tagNumber: generatedTag,
      actionType: 'ASSIGNMENT',
      previousStatus: 'Registered',
      newStatus: 'Assigned',
      performedBy: 'System Admin',
      details: `Asset directly assigned to custodian: ${asset.custodian} (${asset.department || 'General'})`
    })
  }

  return { id: assetId }
}

export function updateAsset(id: number, asset: Asset) {
  const prev = db.prepare('SELECT * FROM assets WHERE id = ?').get(id) as any

  const computedStatus =
    asset.disposalStatus === 'Disposed' || asset.condition === 'Disposed' ? 'Disposed' :
    asset.condition === 'Under Maintenance' || asset.lifecycleStatus === 'Under Maintenance' ? 'Under Maintenance' :
    (asset.custodian && asset.custodian.trim()) ? 'Assigned' :
    (asset.department && asset.department.trim()) ? 'Distributed' : 'Registered'

  const stmt = db.prepare(`
    UPDATE assets SET
      name=?, category=?, fundSource=?, quantity=?, unit=?, unitCost=?, location=?,
      condition=?, serialNumber=?, supplier=?, purchaseDate=?, expiryDate=?, usefulLife=?,
      salvageValue=?, tagNumber=?, custodian=?, department=?, disposalStatus=?,
      disposalMethod=?, disposalDate=?, disposalValue=?, lifecycleStatus=?, lastUpdated=datetime('now')
    WHERE id=?
  `)
  const result = stmt.run(
    asset.name,
    asset.category,
    asset.fundSource,
    asset.quantity,
    asset.unit,
    asset.unitCost,
    asset.location,
    asset.condition,
    asset.serialNumber,
    asset.supplier,
    asset.purchaseDate,
    asset.expiryDate,
    asset.usefulLife || 5,
    asset.salvageValue || 0,
    asset.tagNumber || `ETH-AMS-${id.toString().padStart(5, '0')}`,
    asset.custodian || '',
    asset.department || '',
    asset.disposalStatus || 'Active',
    asset.disposalMethod || null,
    asset.disposalDate || null,
    asset.disposalValue || 0,
    computedStatus,
    id
  )

  if (prev) {
    const finalTag = asset.tagNumber || prev.tagNumber || `ETH-AMS-${id.toString().padStart(5, '0')}`
    if (prev.custodian !== asset.custodian && asset.custodian) {
      recordAssetHistory({
        assetId: id,
        assetName: asset.name,
        tagNumber: finalTag,
        actionType: 'ASSIGNMENT',
        previousStatus: prev.custodian ? `Assigned to ${prev.custodian}` : 'Registered',
        newStatus: 'Assigned',
        performedBy: 'System Admin',
        details: `Custody assigned to ${asset.custodian} (${asset.department || 'General'})`
      })
    } else if (prev.department !== asset.department && asset.department) {
      recordAssetHistory({
        assetId: id,
        assetName: asset.name,
        tagNumber: finalTag,
        actionType: 'DISTRIBUTION',
        previousStatus: prev.department || 'Store',
        newStatus: 'Distributed',
        performedBy: 'System Admin',
        details: `Asset distributed to department: ${asset.department}`
      })
    } else if (prev.condition !== asset.condition) {
      recordAssetHistory({
        assetId: id,
        assetName: asset.name,
        tagNumber: finalTag,
        actionType: asset.condition === 'Under Maintenance' ? 'MAINTENANCE' : 'UPDATE',
        previousStatus: prev.condition,
        newStatus: asset.condition,
        performedBy: 'System Admin',
        details: `Condition updated from ${prev.condition} to ${asset.condition}`
      })
    } else {
      recordAssetHistory({
        assetId: id,
        assetName: asset.name,
        tagNumber: finalTag,
        actionType: 'UPDATE',
        previousStatus: prev.lifecycleStatus || 'Registered',
        newStatus: computedStatus,
        performedBy: 'System Admin',
        details: `Asset details and lifecycle metadata updated`
      })
    }
  }

  return { changes: result.changes }
}

export function deleteAsset(id: number) {
  return db.prepare('DELETE FROM assets WHERE id=?').run(id)
}

// ─── VOUCHER HANDLERS ───────────────────────────────────────

export function createVoucherM19(voucher: any) {
  const vId = db.prepare(`
    INSERT INTO vouchers_model19 (voucherNumber, receivedFrom, receivedDate, storeNo, shelfNo, classification, expenditureNo, incomingNo, approvedBy, receivedBy, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(voucher.voucherNumber, voucher.receivedFrom, voucher.receivedDate, voucher.storeNo, voucher.shelfNo, voucher.classification, voucher.expenditureNo, voucher.incomingNo, voucher.approvedBy, voucher.receivedBy, voucher.note).lastInsertRowid as number

  for (const item of voucher.items) {
    db.prepare(`
      INSERT INTO voucher_items (voucherId, voucherType, assetId, assetName, model, serial, pageFrom, pageTo, unit, quantity, unitCost, totalCost)
      VALUES (?, 'MODEL19', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      vId, item.assetId || null, item.assetName, 
      item.model || null, item.serial || null, item.pageFrom || null, item.pageTo || null,
      item.unit, item.quantity, item.unitCost, item.totalCost
    )
    if (item.assetId) db.prepare(`UPDATE assets SET quantity = quantity + ? WHERE id = ?`).run(item.quantity, item.assetId)
    db.prepare(`INSERT INTO transactions (assetId, assetName, type, quantity, voucherRef, note) VALUES (?, ?, 'RECEIVED', ?, ?, ?)`).run(item.assetId, item.assetName, item.quantity, voucher.voucherNumber, voucher.note || 'M19 Receipt')
  }
  return { success: true }
}

export function createVoucherM20(voucher: any) {
  const isSealed = voucher.isSealed ? 1 : 0
  const sealedBy = voucher.sealedBy || (isSealed ? (voucher.authorizedBy || voucher.requestedBy) : null)
  const sealedAt = voucher.sealedAt || (isSealed ? new Date().toISOString() : null)
  const sealHash = voucher.sealHash || (isSealed ? `SEAL-M20-${voucher.voucherNumber}-${Date.now().toString(36).toUpperCase()}` : null)

  const vId = db.prepare(`
    INSERT INTO vouchers_model20 (voucherNumber, issuedTo, department, issuedDate, requestedBy, authorizedBy, isSealed, sealedBy, sealedAt, sealHash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(voucher.voucherNumber, voucher.issuedTo, voucher.department, voucher.issuedDate, voucher.requestedBy, voucher.authorizedBy, isSealed, sealedBy, sealedAt, sealHash).lastInsertRowid as number

  for (const item of voucher.items) {
    db.prepare(`
      INSERT INTO voucher_items (voucherId, voucherType, assetId, assetName, model, serial, pageFrom, pageTo, unit, quantity, unitCost, totalCost)
      VALUES (?, 'MODEL20', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      vId, item.assetId || null, item.assetName, 
      item.model || null, item.serial || null, item.pageFrom || null, item.pageTo || null,
      item.unit, item.quantity, item.unitCost, item.totalCost
    )
    if (item.assetId) db.prepare(`UPDATE assets SET quantity = quantity - ? WHERE id = ?`).run(item.quantity, item.assetId)
    db.prepare(`INSERT INTO transactions (assetId, assetName, type, quantity, voucherRef, note) VALUES (?, ?, 'REQUISITION', ?, ?, ?)`).run(item.assetId, item.assetName, item.quantity, voucher.voucherNumber, `Requested by ${voucher.requestedBy}`)
  }
  return { success: true, id: vId, isSealed, sealedBy, sealedAt, sealHash }
}

export function sealVoucherM20(voucherId: number, sealedBy: string, customHash?: string) {
  const sealHash = customHash || `SEAL-M20-${voucherId}-${Date.now().toString(36).toUpperCase()}`
  const sealedAt = new Date().toISOString()
  db.prepare(`
    UPDATE vouchers_model20
    SET isSealed = 1, sealedBy = ?, sealedAt = ?, sealHash = ?
    WHERE id = ?
  `).run(sealedBy, sealedAt, sealHash, voucherId)
  return { success: true, voucherId, isSealed: 1, sealedBy, sealedAt, sealHash }
}

export function createVoucherM22(voucher: any) {
  const vId = db.prepare(`
    INSERT INTO vouchers_model22 (voucherNumber, recipientName, issueDate, storekeeperName, pageFrom, pageTo)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(voucher.voucherNumber, voucher.recipientName, voucher.issueDate, voucher.storekeeperName, voucher.pageFrom || null, voucher.pageTo || null).lastInsertRowid as number

  for (const item of voucher.items) {
    db.prepare(`
      INSERT INTO voucher_items (voucherId, voucherType, assetId, assetName, model, serial, unit, quantity, unitCost, totalCost)
      VALUES (?, 'MODEL22', ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      vId, item.assetId || null, item.assetName, 
      item.model || null, item.serial || null,
      item.unit, item.quantity, item.unitCost, item.totalCost
    )
    if (item.assetId) db.prepare(`UPDATE assets SET quantity = quantity - ? WHERE id = ?`).run(item.quantity, item.assetId)
    db.prepare(`INSERT INTO transactions (assetId, assetName, type, quantity, voucherRef, note) VALUES (?, ?, 'ISSUED', ?, ?, ?)`).run(item.assetId, item.assetName, item.quantity, voucher.voucherNumber, `Issued to ${voucher.recipientName}`)
  }
  return { success: true }
}

export function getAllVouchersM19() {
  const vs = db.prepare('SELECT * FROM vouchers_model19 ORDER BY createdAt DESC').all() as any[]
  return vs.map(v => ({ ...v, items: db.prepare("SELECT * FROM voucher_items WHERE voucherId=? AND voucherType='MODEL19'").all(v.id) }))
}

export function getAllVouchersM20() {
  const vs = db.prepare('SELECT * FROM vouchers_model20 ORDER BY createdAt DESC').all() as any[]
  return vs.map(v => ({ ...v, items: db.prepare("SELECT * FROM voucher_items WHERE voucherId=? AND voucherType='MODEL20'").all(v.id) }))
}

export function getAllVouchersM22() {
  const vs = db.prepare('SELECT * FROM vouchers_model22 ORDER BY createdAt DESC').all() as any[]
  return vs.map(v => ({ ...v, items: db.prepare("SELECT * FROM voucher_items WHERE voucherId=? AND voucherType='MODEL22'").all(v.id) }))
}

// ─── ANALYTICS & UTILS ──────────────────────────────────────

// ─── ANALYTICS & UTILS ──────────────────────────────────────

export function getDashboardStats() {
  const totalAssetsRow = db.prepare('SELECT COUNT(*) as count, COALESCE(SUM(quantity * unitCost), 0) as val FROM assets').get() as { count: number; val: number }

  // Owned Assets (active, not disposed)
  const ownedRow = db.prepare("SELECT COUNT(*) as count, COALESCE(SUM(quantity * unitCost), 0) as val FROM assets WHERE disposalStatus != 'Disposed' AND condition != 'Disposed'").get() as { count: number; val: number }

  // Disposed Assets
  const disposedCountRow = db.prepare("SELECT COUNT(*) as count, COALESCE(SUM(quantity * unitCost), 0) as val FROM assets WHERE disposalStatus = 'Disposed' OR condition = 'Disposed'").get() as { count: number; val: number }
  const disposedRevenueRow = db.prepare("SELECT COUNT(*) as logCount, COALESCE(SUM(recoveredAmount), 0) as revenue FROM disposals").get() as { logCount: number; revenue: number }
  const finalDisposedCount = disposedCountRow.count

  // Maintained Assets (under maintenance or repair)
  const maintainedCountRow = db.prepare("SELECT COUNT(*) as count, COALESCE(SUM(quantity * unitCost), 0) as val FROM assets WHERE (condition = 'Under Maintenance' OR lifecycleStatus = 'Under Maintenance') AND disposalStatus != 'Disposed' AND condition != 'Disposed'").get() as { count: number; val: number }
  const maintenanceExpenseRow = db.prepare("SELECT COALESCE(SUM(cost), 0) as totalCost, COUNT(*) as totalTickets FROM maintenance_logs").get() as { totalCost: number; totalTickets: number }

  // Assigned Assets (assigned to staff custodians and not disposed / not in maintenance)
  const assignedRow = db.prepare("SELECT COUNT(*) as count, COALESCE(SUM(quantity * unitCost), 0) as val, COUNT(DISTINCT custodian) as staffCount FROM assets WHERE custodian IS NOT NULL AND TRIM(custodian) != '' AND disposalStatus != 'Disposed' AND condition != 'Disposed' AND condition != 'Under Maintenance' AND lifecycleStatus != 'Under Maintenance'").get() as { count: number; val: number; staffCount: number }

  // Distributed Assets (distributed to departments without an individual custodian, not in maintenance, not disposed)
  const distributedRow = db.prepare("SELECT COUNT(*) as count, COALESCE(SUM(quantity * unitCost), 0) as val, COUNT(DISTINCT department) as deptCount FROM assets WHERE (custodian IS NULL OR TRIM(custodian) = '') AND department IS NOT NULL AND TRIM(department) != '' AND disposalStatus != 'Disposed' AND condition != 'Disposed' AND condition != 'Under Maintenance' AND lifecycleStatus != 'Under Maintenance'").get() as { count: number; val: number; deptCount: number }

  // In Store / Registered (in central store, not assigned, not distributed, not in maintenance, not disposed)
  const inStoreRow = db.prepare("SELECT COUNT(*) as count, COALESCE(SUM(quantity * unitCost), 0) as val FROM assets WHERE (custodian IS NULL OR TRIM(custodian) = '') AND (department IS NULL OR TRIM(department) = '') AND disposalStatus != 'Disposed' AND condition != 'Disposed' AND condition != 'Under Maintenance' AND lifecycleStatus != 'Under Maintenance'").get() as { count: number; val: number }

  // Categories Breakdown
  const categoriesTable = db.prepare("SELECT category, COUNT(*) as count, COALESCE(SUM(quantity * unitCost), 0) as val FROM assets GROUP BY category").all()

  // Department Breakdown
  const departmentBreakdown = db.prepare(`
    SELECT COALESCE(NULLIF(TRIM(department), ''), 'Central Storage') as dept, COUNT(*) as count, COALESCE(SUM(quantity * unitCost), 0) as val
    FROM assets WHERE disposalStatus != 'Disposed' AND condition != 'Disposed'
    GROUP BY dept ORDER BY count DESC LIMIT 8
  `).all()

  // Functional vs Non-functional
  const functionalNum = db.prepare("SELECT COUNT(*) as count FROM assets WHERE condition='Functional' AND disposalStatus != 'Disposed' AND condition != 'Disposed'").get() as { count: number }
  const nonFunctionalNum = db.prepare("SELECT COUNT(*) as count FROM assets WHERE (condition='Non-functional' OR condition='Under Maintenance') AND disposalStatus != 'Disposed' AND condition != 'Disposed'").get() as { count: number }

  // Recent History
  let recentHistory: any[] = []
  try {
    recentHistory = db.prepare("SELECT * FROM asset_history ORDER BY timestamp DESC, id DESC LIMIT 10").all()
  } catch {}

  return { 
    totalAssets: totalAssetsRow.count, 
    totalValue: totalAssetsRow.val || 0, 
    functional: functionalNum.count, 
    nonFunctional: nonFunctionalNum.count, 
    categories: categoriesTable,

    // Real-Time Analytics Panel Metrics
    assignedAssets: {
      count: assignedRow.count,
      value: assignedRow.val || 0,
      staffCount: assignedRow.staffCount || 0
    },
    maintainedAssets: {
      count: maintainedCountRow.count,
      totalCost: maintenanceExpenseRow.totalCost || 0,
      totalTickets: maintenanceExpenseRow.totalTickets || 0
    },
    distributedAssets: {
      count: distributedRow.count,
      value: distributedRow.val || 0,
      deptCount: distributedRow.deptCount || 0
    },
    disposedAssets: {
      count: finalDisposedCount,
      recoveredAmount: disposedRevenueRow.revenue || 0
    },
    ownedAssets: {
      count: ownedRow.count,
      value: ownedRow.val || 0
    },
    lifecycleBreakdown: {
      registered: inStoreRow.count,
      assigned: assignedRow.count,
      distributed: distributedRow.count,
      maintained: maintainedCountRow.count,
      disposed: finalDisposedCount
    },
    departmentBreakdown,
    recentHistory
  }
}

export function getNextVoucherNumber(type: string) {
  const tableMap = { MODEL19: 'vouchers_model19', MODEL20: 'vouchers_model20', MODEL22: 'vouchers_model22' }
  const prefixMap = { MODEL19: 'RCV', MODEL20: 'REQ', MODEL22: 'ISS' }
  try {
    const row = db.prepare(`SELECT COUNT(*) as count FROM ${tableMap[type]}`).get() as { count: number }
    return `${prefixMap[type]}-${new Date().getFullYear()}-${(row.count + 1).toString().padStart(5, '0')}`
  } catch { return `${prefixMap[type]}-${new Date().getFullYear()}-00001` }
}

export function getAllTransactions() {
  return db.prepare('SELECT * FROM transactions ORDER BY createdAt DESC').all()
}

export function getTransactionsInRange(startDate: string, endDate: string) {
  return db.prepare('SELECT * FROM transactions WHERE date(createdAt) >= date(?) AND date(createdAt) <= date(?) ORDER BY createdAt ASC').all(startDate, endDate)
}

export function getTransactionsByAsset(assetId: number) {
  return db.prepare('SELECT * FROM transactions WHERE assetId = ? ORDER BY createdAt ASC').all(assetId)
}

export function getMaintenanceLogs() {
  return db.prepare(
    'SELECT m.*, a.name as assetName, a.tagNumber as tagNumber FROM maintenance_logs m LEFT JOIN assets a ON m.assetId = a.id ORDER BY m.reportedDate DESC'
  ).all()
}

export function addMaintenance(log: any) {
  const stmt = db.prepare(`
    INSERT INTO maintenance_logs (assetId, issueDescription, status, reportedDate, technicianName, cost)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(
    log.assetId,
    log.issueDescription,
    log.status || 'Reported',
    log.reportedDate || new Date().toISOString().split('T')[0],
    log.technicianName || null,
    log.cost || 0
  )

  // Update asset status to Under Maintenance
  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(log.assetId) as any
  if (asset) {
    db.prepare("UPDATE assets SET condition = 'Under Maintenance', lifecycleStatus = 'Under Maintenance', lastUpdated = datetime('now') WHERE id = ?").run(log.assetId)

    recordAssetHistory({
      assetId: log.assetId,
      assetName: asset.name,
      tagNumber: asset.tagNumber || `ETH-AMS-${log.assetId.toString().padStart(5, '0')}`,
      actionType: 'MAINTENANCE',
      previousStatus: asset.condition,
      newStatus: 'Under Maintenance',
      performedBy: 'System Admin',
      details: `Reported issue: ${log.issueDescription}${log.technicianName ? ' (Assigned to: ' + log.technicianName + ')' : ''}`
    })
  }

  return result
}

export function updateMaintenance(id: number, updates: any) {
  const fields: string[] = []
  const values: any[] = []
  if (updates.status !== undefined)        { fields.push('status = ?');         values.push(updates.status) }
  if (updates.technicianName !== undefined) { fields.push('technicianName = ?'); values.push(updates.technicianName) }
  if (updates.completedDate !== undefined) { fields.push('completedDate = ?');  values.push(updates.completedDate) }
  if (updates.cost !== undefined)          { fields.push('cost = ?');            values.push(updates.cost) }
  if (fields.length === 0) return { changes: 0 }
  values.push(id)
  const res = db.prepare(`UPDATE maintenance_logs SET ${fields.join(', ')} WHERE id = ?`).run(...values)

  // Check if status is Completed, restore asset condition
  const log = db.prepare('SELECT * FROM maintenance_logs WHERE id = ?').get(id) as any
  if (log && updates.status === 'Completed') {
    const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(log.assetId) as any
    if (asset) {
      const restoredStatus = asset.custodian ? 'Assigned' : asset.department ? 'Distributed' : 'Registered'
      db.prepare("UPDATE assets SET condition = 'Functional', lifecycleStatus = ?, lastUpdated = datetime('now') WHERE id = ?").run(restoredStatus, log.assetId)

      recordAssetHistory({
        assetId: log.assetId,
        assetName: asset.name,
        tagNumber: asset.tagNumber || `ETH-AMS-${log.assetId.toString().padStart(5, '0')}`,
        actionType: 'MAINTENANCE',
        previousStatus: 'Under Maintenance',
        newStatus: 'Functional',
        performedBy: 'System Admin',
        details: `Maintenance completed. Repair cost: ETB ${(updates.cost || log.cost || 0).toFixed(2)}${updates.technicianName || log.technicianName ? ' by ' + (updates.technicianName || log.technicianName) : ''}`
      })
    }
  }

  return res
}


// ─── PENDING REQUEST HANDLERS ────────────────────────────────
export function createPendingRequest(req: any) {
  const stmt = db.prepare(`INSERT INTO pending_requests (type, requestedBy, department, description, payload) VALUES (?, ?, ?, ?, ?)`)
  const result = stmt.run(req.type, req.requestedBy, req.department || '', req.description || '', JSON.stringify(req.payload))
  return { success: true, id: result.lastInsertRowid }
}

export function getPendingRequests(status?: string, orgScope?: string) {
  let sql = 'SELECT * FROM pending_requests WHERE 1=1'
  const params: any[] = []

  if (status && status !== 'All' && status !== 'all') {
    sql += ' AND status = ?'
    params.push(status)
  }

  if (orgScope && orgScope !== '%' && orgScope !== 'all') {
    sql += ' AND orgPath LIKE ?'
    params.push(`${orgScope}%`)
  }

  sql += ' ORDER BY createdAt DESC'
  return db.prepare(sql).all(...params)
}

export function reviewPendingRequest(
  id: number,
  action: string,
  reviewedBy: string,
  reviewNote?: string,
  signerUserId?: number
) {
  const row = db.prepare(`SELECT * FROM pending_requests WHERE id = ?`).get(id) as any
  if (!row || row.status !== 'Pending') return { success: false, error: 'Not found or already reviewed' }

  try {
    let digitalSignature: string | null = null
    const approvalTime = new Date().toISOString()

    if (action === 'Approved') {
      digitalSignature = generateDocumentSignature(row.payload, signerUserId || 0, reviewedBy)
    }

    const runTransaction = db.transaction(() => {
      db.prepare(`
        UPDATE pending_requests 
        SET status = ?, reviewedBy = ?, reviewNote = ?, reviewedAt = datetime('now'),
            approvedByUserId = ?, digitalSignatureHash = ?, approvalTimestamp = ?
        WHERE id = ?
      `).run(action, reviewedBy, reviewNote || '', signerUserId || null, digitalSignature, approvalTime, id)

      if (action === 'Approved') {
        try {
          const payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload
          if (payload && Array.isArray(payload.items) && payload.voucherNumber) {
            payload.digitalSignatureHash = digitalSignature
            payload.approvalTimestamp = approvalTime
            if (row.type === 'Requisition' || row.type === 'MODEL20') createVoucherM20(payload)
            else if (row.type === 'Stock-In' || row.type === 'MODEL19') createVoucherM19(payload)
            else if (row.type === 'Issue' || row.type === 'MODEL22') createVoucherM22(payload)
          }
        } catch (vErr) {
          console.warn('Could not auto-generate voucher from pending request payload:', vErr)
        }
      }
    })
    runTransaction()
    return { success: true, digitalSignature, approvalTime }
  } catch (err: any) {
    console.error('Review error:', err)
    return { success: false, error: err.message || 'Error processing request' }
  }
}

// ─── INVENTORY COUNTS (ANNUAL VERIFICATION & RECONCILIATION) ─
export function getAllInventoryCounts() {
  const counts = db.prepare('SELECT * FROM inventory_counts ORDER BY createdAt DESC').all() as any[]
  return counts.map((c) => ({
    ...c,
    items: db.prepare('SELECT * FROM inventory_count_items WHERE countId = ?').all(c.id)
  }))
}

export function getInventoryCountById(id: number) {
  const count = db.prepare('SELECT * FROM inventory_counts WHERE id = ?').get(id) as any
  if (!count) return null
  count.items = db.prepare('SELECT * FROM inventory_count_items WHERE countId = ?').all(id)
  return count
}

export function createInventoryCount(data: any) {
  const stmt = db.prepare(`
    INSERT INTO inventory_counts (fiscalYear, countDate, committeeChair, committeeMembers, status, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(
    data.fiscalYear || `${new Date().getFullYear()} E.C.`,
    data.countDate || new Date().toISOString().split('T')[0],
    data.committeeChair || 'Committee Chair',
    data.committeeMembers || '',
    data.status || 'Completed',
    data.notes || ''
  )
  const countId = result.lastInsertRowid as number

  if (Array.isArray(data.items)) {
    const itemStmt = db.prepare(`
      INSERT INTO inventory_count_items (countId, assetId, assetName, systemQty, countedQty, discrepancy, discrepancyType, condition, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    for (const item of data.items) {
      const disc = Number(item.countedQty) - Number(item.systemQty)
      let discType = 'Match'
      if (disc < 0) discType = 'Shortage'
      else if (disc > 0) discType = 'Surplus'
      if (item.condition === 'Damaged' || item.condition === 'Non-functional') discType = 'Damaged'

      itemStmt.run(
        countId,
        item.assetId,
        item.assetName,
        item.systemQty,
        item.countedQty,
        disc,
        discType,
        item.condition || 'Functional',
        item.remarks || ''
      )

      if (data.status === 'Reconciled' && disc !== 0) {
        db.prepare('UPDATE assets SET quantity = ?, lastUpdated = datetime(\'now\') WHERE id = ?').run(item.countedQty, item.assetId)
        db.prepare(`
          INSERT INTO transactions (assetId, assetName, type, quantity, voucherRef, note)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          item.assetId,
          item.assetName,
          disc < 0 ? 'ISSUED' : 'RECEIVED',
          Math.abs(disc),
          `COUNT-${data.fiscalYear || new Date().getFullYear()}`,
          `Annual Count Reconciliation: ${discType} (${disc >= 0 ? '+' : ''}${disc})`
        )
      }
    }
  }
  return { success: true, id: countId }
}

// ─── DISPOSAL HANDLERS (ASSET DECOMMISSIONING) ───────────────
export function getAllDisposals() {
  return db.prepare('SELECT * FROM disposals ORDER BY createdAt DESC').all()
}

export function createDisposal(data: any) {
  const stmt = db.prepare(`
    INSERT INTO disposals (assetId, assetName, quantity, disposalMethod, disposalDate, committeeLeader, approvedBy, reason, recoveredAmount, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(
    data.assetId,
    data.assetName,
    data.quantity,
    data.disposalMethod,
    data.disposalDate || new Date().toISOString().split('T')[0],
    data.committeeLeader || '',
    data.approvedBy || '',
    data.reason || '',
    data.recoveredAmount || 0,
    data.status || 'Completed'
  )

  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(data.assetId) as any
  if (asset) {
    const newQty = Math.max(0, asset.quantity - data.quantity)
    const newCond = newQty === 0 ? 'Disposed' : asset.condition
    db.prepare(`
      UPDATE assets SET
        quantity = ?,
        condition = ?,
        disposalStatus = 'Disposed',
        disposalMethod = ?,
        disposalDate = ?,
        disposalValue = ?,
        lifecycleStatus = 'Disposed',
        lastUpdated = datetime('now')
      WHERE id = ?
    `).run(
      newQty,
      newCond,
      data.disposalMethod,
      data.disposalDate || new Date().toISOString().split('T')[0],
      data.recoveredAmount || 0,
      data.assetId
    )

    recordAssetHistory({
      assetId: data.assetId,
      assetName: data.assetName,
      tagNumber: asset.tagNumber || `ETH-AMS-${data.assetId.toString().padStart(5, '0')}`,
      actionType: 'DISPOSAL',
      previousStatus: asset.lifecycleStatus || 'Active',
      newStatus: 'Disposed',
      performedBy: data.approvedBy || 'Disposal Committee',
      details: `Disposed ${data.quantity} units via ${data.disposalMethod}. Committee Chair: ${data.committeeLeader}. Recovered: ETB ${data.recoveredAmount || 0}. Reason: ${data.reason || 'Decommissioned'}`
    })

    db.prepare(`
      INSERT INTO transactions (assetId, assetName, type, quantity, voucherRef, note)
      VALUES (?, ?, 'ISSUED', ?, ?, ?)
    `).run(
      data.assetId,
      data.assetName,
      data.quantity,
      `DISP-${data.disposalMethod.replace(/\\s+/g, '')}`,
      `Asset Disposed via ${data.disposalMethod}. Reason: ${data.reason || 'Decommissioned'}`
    )
  }

  return { success: true, id: result.lastInsertRowid }
}

// ─── AMIS HIERARCHY HANDLERS (ትስስር) ──────────────────────────

export function getAllHierarchies() {
  return db.prepare('SELECT * FROM user_hierarchies ORDER BY id DESC').all() as UserHierarchy[]
}

export function createHierarchy(data: Partial<UserHierarchy>) {
  const stmt = db.prepare(`
    INSERT INTO user_hierarchies (userId, userName, userPhone, position, departmentCode, supervisorId, supervisorName, supervisorPhone, storeKeeperId, storeKeeperName, storeKeeperPhone)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(
    data.userId,
    data.userName,
    data.userPhone || '',
    data.position || '',
    data.departmentCode || '',
    data.supervisorId || null,
    data.supervisorName || '',
    data.supervisorPhone || '',
    data.storeKeeperId || null,
    data.storeKeeperName || '',
    data.storeKeeperPhone || ''
  )
  return { success: true, id: result.lastInsertRowid }
}

export function deleteHierarchy(id: number) {
  return db.prepare('DELETE FROM user_hierarchies WHERE id = ?').run(id)
}

// ─── AMIS ASSET TRANSFERS (ንብረት ማስተላለፍ) ───────────────────

export function getAllTransfers() {
  return db.prepare('SELECT * FROM asset_transfers ORDER BY transferDate DESC').all() as AssetTransfer[]
}

export function createTransfer(data: Partial<AssetTransfer>) {
  const stmt = db.prepare(`
    INSERT INTO asset_transfers (assetId, assetName, tagNumber, fromUserId, fromUserName, toUserId, toUserName, department, reason, status, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)
  `)
  const result = stmt.run(
    data.assetId,
    data.assetName,
    data.tagNumber || '',
    data.fromUserId || null,
    data.fromUserName,
    data.toUserId || null,
    data.toUserName,
    data.department || '',
    data.reason,
    data.note || ''
  )

  // Also log into transactions
  db.prepare(`
    INSERT INTO transactions (assetId, assetName, type, quantity, voucherRef, note)
    VALUES (?, ?, 'ISSUED', 1, ?, ?)
  `).run(
    data.assetId,
    data.assetName,
    `XFER-${result.lastInsertRowid}`,
    `Peer Transfer requested from ${data.fromUserName} to ${data.toUserName}: ${data.reason}`
  )

  recordAssetHistory({
    assetId: data.assetId!,
    assetName: data.assetName!,
    tagNumber: data.tagNumber || '',
    actionType: 'TRANSFER',
    previousStatus: 'Assigned',
    newStatus: 'Transfer Pending',
    performedBy: data.fromUserName,
    details: `Transfer request initiated from ${data.fromUserName} to ${data.toUserName}. Reason: ${data.reason}`
  })

  return { success: true, id: result.lastInsertRowid }
}

export function respondTransfer(id: number, status: 'Accepted' | 'Declined', note?: string) {
  const xfer = db.prepare('SELECT * FROM asset_transfers WHERE id = ?').get(id) as AssetTransfer | undefined
  if (!xfer) return { success: false, error: 'Transfer record not found' }

  db.prepare(`
    UPDATE asset_transfers SET status = ?, responseDate = datetime('now'), note = ?
    WHERE id = ?
  `).run(status, note || '', id)

  if (status === 'Accepted') {
    // Update asset custodian to recipient!
    db.prepare(`
      UPDATE assets SET custodian = ?, department = COALESCE(NULLIF(?, ''), department), lifecycleStatus = 'Assigned', lastUpdated = datetime('now')
      WHERE id = ?
    `).run(xfer.toUserName, xfer.department || '', xfer.assetId)

    recordAssetHistory({
      assetId: xfer.assetId,
      assetName: xfer.assetName,
      tagNumber: xfer.tagNumber || '',
      actionType: 'TRANSFER',
      previousStatus: `Assigned to ${xfer.fromUserName}`,
      newStatus: `Assigned to ${xfer.toUserName}`,
      performedBy: xfer.toUserName,
      details: `Transfer ACCEPTED. Custody handed over from ${xfer.fromUserName} to ${xfer.toUserName}${xfer.department ? ' (' + xfer.department + ')' : ''}`
    })

    db.prepare(`
      INSERT INTO transactions (assetId, assetName, type, quantity, voucherRef, note)
      VALUES (?, ?, 'RECEIVED', 1, ?, ?)
    `).run(
      xfer.assetId,
      xfer.assetName,
      `XFER-${xfer.id}`,
      `Peer Transfer ACCEPTED by ${xfer.toUserName}. Custody transferred.`
    )
  } else {
    recordAssetHistory({
      assetId: xfer.assetId,
      assetName: xfer.assetName,
      tagNumber: xfer.tagNumber || '',
      actionType: 'TRANSFER',
      previousStatus: 'Transfer Pending',
      newStatus: 'Transfer Declined',
      performedBy: xfer.toUserName,
      details: `Transfer request DECLINED by ${xfer.toUserName}. Note: ${note || 'None'}`
    })
  }

  return { success: true }
}

// ─── AMIS CONSUMABLE ALLOCATIONS (አላቂቃ ማከፋፈል) ─────────────

export function getAllAllocations() {
  return db.prepare('SELECT * FROM consumable_allocations ORDER BY allocatedDate DESC').all() as ConsumableAllocation[]
}

export function createAllocation(data: Partial<ConsumableAllocation>) {
  const stmt = db.prepare(`
    INSERT INTO consumable_allocations (assetId, assetName, departmentCode, allocatedQty, allocatedDate, approvedBy)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(
    data.assetId,
    data.assetName,
    data.departmentCode,
    data.allocatedQty,
    data.allocatedDate || new Date().toISOString().split('T')[0],
    data.approvedBy || ''
  )
  return { success: true, id: result.lastInsertRowid }
}

// ─── AMIS DEPARTMENTS & SECTORS (ሴክተር መስሪያ ቤቶች እና ክፍሎች) ─────

export function getAllDepartments(): Department[] {
  return db.prepare('SELECT * FROM departments ORDER BY type ASC, code ASC').all() as Department[]
}

export function createDepartment(data: Partial<Department>) {
  if (!data.code || !data.name) {
    return { success: false, error: 'Department code and name are required' }
  }
  const cleanCode = data.code.trim().toUpperCase()
  const existing = db.prepare('SELECT id FROM departments WHERE code = ?').get(cleanCode)
  if (existing) {
    return { success: false, error: `Department/Sector with code "${cleanCode}" already exists` }
  }
  const stmt = db.prepare(`
    INSERT INTO departments (code, name, amharicName, type, description, isActive)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(
    cleanCode,
    data.name.trim(),
    data.amharicName?.trim() || data.name.trim(),
    data.type || 'Sector',
    data.description || '',
    data.isActive !== undefined ? data.isActive : 1
  )
  return { success: true, id: result.lastInsertRowid }
}

export function updateDepartment(id: number, data: Partial<Department>) {
  const current = db.prepare('SELECT * FROM departments WHERE id = ?').get(id) as Department | undefined
  if (!current) return { success: false, error: 'Department not found' }

  const code = (data.code || current.code).trim().toUpperCase()
  const name = (data.name || current.name).trim()
  const amharicName = data.amharicName !== undefined ? data.amharicName.trim() : current.amharicName
  const type = data.type || current.type
  const description = data.description !== undefined ? data.description : current.description
  const isActive = data.isActive !== undefined ? data.isActive : current.isActive

  db.prepare(`
    UPDATE departments SET code = ?, name = ?, amharicName = ?, type = ?, description = ?, isActive = ?
    WHERE id = ?
  `).run(code, name, amharicName, type, description, isActive, id)

  return { success: true }
}

export function deleteDepartment(id: number) {
  const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(id) as Department | undefined
  if (!dept) return { success: false, error: 'Department not found' }

  // Check if department is in use by assets or users
  const assetCount = (db.prepare('SELECT COUNT(*) as count FROM assets WHERE department = ? OR department = ?').get(dept.name, dept.code) as any).count
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users WHERE departmentCode = ? OR department = ?').get(dept.code, dept.name) as any).count

  if (assetCount > 0 || userCount > 0) {
    return {
      success: false,
      error: `Cannot delete: "${dept.name}" is currently assigned to ${assetCount} asset(s) and ${userCount} user(s). You can edit or deactivate it instead.`
    }
  }

  db.prepare('DELETE FROM departments WHERE id = ?').run(id)
  return { success: true }
}

// ─── SEED AMIS OFFICIAL DATA (ከቪዲዮው የተወሰደ) ────────────────

export function seedAmisData(options: { seedSampleData?: boolean } = { seedSampleData: false }) {
  // 1. Seed or ensure default AMIS users
  for (const u of DEFAULT_SYSTEM_USERS) {
    // In production (clean state), only ensure System Admin exists
    if (!options.seedSampleData && u.role !== 'Admin') {
      continue
    }
    const existing = db.prepare('SELECT id FROM users WHERE phone = ? OR lower(email) = ? OR lower(name) = ?')
      .get(u.phone, u.email.toLowerCase(), u.name.toLowerCase()) as { id: number } | undefined
    if (!existing) {
      registerUser({
        name: u.name,
        email: u.email,
        phone: u.phone,
        password: u.password,
        role: u.role,
        position: u.position,
        locationCode: u.locationCode,
        departmentCode: u.departmentCode,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=0f172a&color=fff`,
        forcePasswordChange: 0
      })
    } else {
      if (u.name === 'AbeTech') {
        db.prepare("UPDATE users SET password = ?, role = 'Admin', forcePasswordChange = 0, position = ? WHERE id = ?")
          .run(hashPassword('TechAbe@123'), u.position, existing.id)
      } else {
        db.prepare('UPDATE users SET phone = ?, position = ?, locationCode = ?, departmentCode = ? WHERE id = ?')
          .run(u.phone, u.position, u.locationCode, u.departmentCode, existing.id)
      }
    }
  }

  // 2. Ensure reporting chains / ትስስር exist (only when seedSampleData is true)
  if (options.seedSampleData) {
    const yohannes = db.prepare('SELECT id, name, phone, position, departmentCode FROM users WHERE phone = ?').get('0923000005') as any
    const alemu = db.prepare('SELECT id, name, phone, position, departmentCode FROM users WHERE phone = ?').get('0923000006') as any
    const anteneh = db.prepare('SELECT id, name, phone FROM users WHERE phone = ?').get('0923000004') as any
    const temesgen = db.prepare('SELECT id, name, phone FROM users WHERE phone = ?').get('0923000003') as any

    if (yohannes && anteneh && temesgen) {
      const h1 = db.prepare('SELECT id FROM user_hierarchies WHERE userId = ?').get(yohannes.id)
      if (!h1) {
        db.prepare(`
          INSERT INTO user_hierarchies (userId, userName, userPhone, position, departmentCode, supervisorId, supervisorName, supervisorPhone, storeKeeperId, storeKeeperName, storeKeeperPhone)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          yohannes.id, yohannes.name, yohannes.phone, yohannes.position, yohannes.departmentCode,
          anteneh.id, anteneh.name, anteneh.phone,
          temesgen.id, temesgen.name, temesgen.phone
        )
      }
    }

    if (alemu && anteneh && temesgen) {
      const h2 = db.prepare('SELECT id FROM user_hierarchies WHERE userId = ?').get(alemu.id)
      if (!h2) {
        db.prepare(`
          INSERT INTO user_hierarchies (userId, userName, userPhone, position, departmentCode, supervisorId, supervisorName, supervisorPhone, storeKeeperId, storeKeeperName, storeKeeperPhone)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          alemu.id, alemu.name, alemu.phone, alemu.position, alemu.departmentCode,
          anteneh.id, anteneh.name, anteneh.phone,
          temesgen.id, temesgen.name, temesgen.phone
        )
      }
    }
  }

  // 3. Ensure sample government assets (only when seedSampleData is true)
  if (options.seedSampleData) {
    const yAssets = db.prepare("SELECT COUNT(*) as count FROM assets WHERE custodian = 'ዮሐንስ ጌታቸው'").get() as { count: number }
    if (yAssets.count === 0) {
      const defaultAssets = [
        {
          name: 'Dell Latitude 5420 Laptop',
        category: 'Electronics' as const,
        fundSource: 'Budget' as const,
        quantity: 1,
        unitCost: 65000,
        unit: 'Piece',
        location: 'አዲስ ከተማ ሰብስቲ / AK-01',
        condition: 'Functional' as const,
        serialNumber: 'CN-0ABC12-70166',
        supplier: 'Ethiopian ICT Supply Agency',
        purchaseDate: '2025-09-15',
        usefulLife: 5,
        salvageValue: 3000,
        tagNumber: 'PPAA-104-LT-001',
        custodian: 'ዮሐንስ ጌታቸው',
        department: 'መማር ማስተማር (LT)'
      },
      {
        name: 'HP LaserJet Pro M404dn Printer',
        category: 'Electronics' as const,
        fundSource: 'Budget' as const,
        quantity: 1,
        unitCost: 28500,
        unit: 'Piece',
        location: 'አዲስ ከተማ ሰብስቲ / AK-01',
        condition: 'Functional' as const,
        serialNumber: 'VNB3K01923',
        supplier: 'Addis Office Machines',
        purchaseDate: '2025-10-01',
        usefulLife: 5,
        salvageValue: 1500,
        tagNumber: 'PPAA-104-LT-002',
        custodian: 'ዮሐንስ ጌታቸው',
        department: 'መማር ማስተማር (LT)'
      },
      {
        name: 'Dell OptiPlex 7090 Desktop Computer',
        category: 'Electronics' as const,
        fundSource: 'Budget' as const,
        quantity: 1,
        unitCost: 52000,
        unit: 'Piece',
        location: 'አዲስ ከተማ ሰብስቲ / AK-01',
        condition: 'Functional' as const,
        serialNumber: 'SN-OPT-8812',
        supplier: 'Ethiopian ICT Supply Agency',
        purchaseDate: '2025-08-20',
        usefulLife: 5,
        salvageValue: 2500,
        tagNumber: 'PPAA-104-LT-003',
        custodian: 'ዮሐንስ ጌታቸው',
        department: 'መማር ማስተማር (LT)'
      },
      {
        name: 'High-Back Ergonomic Swivel Chair',
        category: 'Furniture' as const,
        fundSource: 'Budget' as const,
        quantity: 1,
        unitCost: 9500,
        unit: 'Piece',
        location: 'አዲስ ከተማ ሰብስቲ / AK-01',
        condition: 'Functional' as const,
        serialNumber: 'CHR-SW-441',
        supplier: 'Wanza Furniture',
        purchaseDate: '2025-07-10',
        usefulLife: 7,
        salvageValue: 500,
        tagNumber: 'PPAA-104-LT-004',
        custodian: 'ዮሐንስ ጌታቸው',
        department: 'መማር ማስተማር (LT)'
      },
      {
        name: 'A4 Double-A Copy Paper (ወረቀት በካርቶን)',
        category: 'Stationery' as const,
        fundSource: 'Budget' as const,
        quantity: 50,
        unitCost: 5500,
        unit: 'Carton',
        location: 'ዋና ግምጃ ቤት / Main Store',
        condition: 'Functional' as const,
        supplier: 'Berhanena Selam Printing',
        purchaseDate: '2026-01-10',
        tagNumber: 'PPAA-M19-48201',
        custodian: 'ተመስገን መርሻ',
        department: 'ግምጃ ቤት (STORE)'
      },
      {
        name: 'Bic Ballpoint Pens Blue (እስክሪፕቶ በፓኬት)',
        category: 'Stationery' as const,
        fundSource: 'Budget' as const,
        quantity: 100,
        unitCost: 1150,
        unit: 'Pack',
        location: 'ዋና ግምጃ ቤት / Main Store',
        condition: 'Functional' as const,
        supplier: 'Addis Stationery Wholesalers',
        purchaseDate: '2026-01-10',
        tagNumber: 'PPAA-M19-48202',
        custodian: 'ተመስገን መርሻ',
        department: 'ግምጃ ቤት (STORE)'
      }
    ]

    for (const a of defaultAssets) {
      addAsset(a)
    }
  }

  // 4. Seed sample M19 Voucher (only if seedSampleData is true)
  if (options.seedSampleData) {
    const m19Count = (db.prepare('SELECT COUNT(*) as count FROM vouchers_model19').get() as any).count
    if (m19Count === 0) {
      const vId = db.prepare(`
        INSERT INTO vouchers_model19 (voucherNumber, receivedFrom, receivedDate, storeNo, shelfNo, classification, expenditureNo, incomingNo, approvedBy, receivedBy, note)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
      'M19-2026-001',
      'Ethiopian ICT & Stationery Supply Agency',
      '2026-01-10',
      'STORE-01',
      'SHELF-A4',
      'ቋሚ እና አላቂ ንብረት (Fixed & Consumable)',
      'EXP-49102',
      'INC-2026-88',
      'አንተነህ መኮንን',
      'ተመስገን መርሻ',
      'Public property annual bulk procurement per Directive 1095/2017'
    ).lastInsertRowid as number

    db.prepare(`
      INSERT INTO voucher_items (voucherId, voucherType, assetName, unit, quantity, unitCost, totalCost)
      VALUES (?, 'MODEL19', ?, ?, ?, ?, ?)
    `).run(vId, 'A4 Double-A Copy Paper (ወረቀት በካርቶን)', 'Carton', 50, 5500, 275000)

    db.prepare(`
      INSERT INTO voucher_items (voucherId, voucherType, assetName, unit, quantity, unitCost, totalCost)
      VALUES (?, 'MODEL19', ?, ?, ?, ?, ?)
    `).run(vId, 'Bic Ballpoint Pens Blue (እስክሪፕቶ በፓኬት)', 'Pack', 100, 1150, 115000)
  }

  // 5. Seed sample M22 Voucher if empty
  const m22Count = (db.prepare('SELECT COUNT(*) as count FROM vouchers_model22').get() as any).count
  if (m22Count === 0) {
    db.prepare(`
      INSERT INTO vouchers_model22 (voucherNumber, recipientName, issueDate, storekeeperName, pageFrom, pageTo)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      'M22-2026-001',
      'ዮሐንስ ጌታቸው (የአይሲቲ መምህር)',
      '2026-01-15',
      'ተመስገን መርሻ',
      '001',
      '004'
    )
  }

  // 6. Seed sample Inventory Count if empty
  const countCount = (db.prepare('SELECT COUNT(*) as count FROM inventory_counts').get() as any).count
  if (countCount === 0) {
    const cId = db.prepare(`
      INSERT INTO inventory_counts (fiscalYear, countDate, committeeChair, committeeMembers, status, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      '2017/2018 ዓ.ም',
      '2026-02-01',
      'አንተነህ መኮንን (ርዕሰ መምህር)',
      'ተመስገን መርሻ (ግምጃ ቤት)፣ ዮሐንስ ጌታቸው (አይሲቲ)፣ አለሙ በቀለ (መምህር)',
      'Reconciled',
      'የዓመቱ የቋሚና አላቂ ንብረት ቆጠራና ማረጋገጫ በንብረት አስተዳደር አዋጅ ቁጥር 1333/2016 መሰረት ተጠናቆ ተስተካክሏል።'
    ).lastInsertRowid as number

    db.prepare(`
      INSERT INTO inventory_count_items (countId, assetId, assetName, systemQty, countedQty, discrepancy, discrepancyType, condition, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(cId, 6, 'Dell Latitude 5420 Laptop', 1, 1, 0, 'Match', 'Functional', 'ጥሩ ቁመና ላይ ያለ')

    db.prepare(`
      INSERT INTO inventory_count_items (countId, assetId, assetName, systemQty, countedQty, discrepancy, discrepancyType, condition, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(cId, 10, 'A4 Double-A Copy Paper (ወረቀት በካርቶን)', 50, 50, 0, 'Match', 'Functional', 'በግምጃ ቤት የተቆጠረ')
  }

  // 7. Seed sample Disposal if empty
  const dispCount = (db.prepare('SELECT COUNT(*) as count FROM disposals').get() as any).count
  if (dispCount === 0) {
    db.prepare(`
      INSERT INTO disposals (assetId, assetName, quantity, disposalMethod, disposalDate, committeeLeader, approvedBy, reason, recoveredAmount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      0,
      'ያረጁና የተሰበሩ የቢሮ ጠረጴዛዎች እና ወንበሮች (Decommissioned Legacy Furniture)',
      8,
      'Public Auction',
      '2026-01-20',
      'ተመስገን መርሻ',
      'አንተነህ መኮንን',
      'ከጥቅም ውጭ የሆኑ ንብረቶች በቴክኒክ ኮሚቴ ውሳኔ በመመሪያ ቁጥር 1095/2017 ክፍል ሁለት መሰረት በግልፅ ጨረታ ተወግደዋል።',
      14200,
      'Completed'
    )
  }

  // 8. Seed sample Peer Transfer from Yohannes to Alemu if empty
  const xferCount = (db.prepare('SELECT COUNT(*) as count FROM asset_transfers').get() as any).count
  if (xferCount === 0) {
    db.prepare(`
      INSERT INTO asset_transfers (assetId, assetName, tagNumber, fromUserId, fromUserName, toUserId, toUserName, department, reason, status, transferDate, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      6,
      'Dell Latitude 5420 Laptop',
      'PPAA-104-LT-001',
      7,
      'ዮሐንስ ጌታቸው',
      8,
      'አለሙ በቀለ',
      'መማር ማስተማር (LT)',
      'ለ12ኛ ክፍል የአይሲቲ ብሔራዊ ፈተና ላቦራቶሪ ዝግጅት በጊዜያዊነት የተላለፈ',
      'Pending',
      '2026-02-10 09:30:00',
      'በ AMIS ሲስተም የአለሙ በቀለን ማረጋገጫ በመጠባበቅ ላይ'
    )
  }

  // 5. Seed initial asset lifecycle history if empty
  try {
    const histRow = db.prepare('SELECT COUNT(*) as count FROM asset_history').get() as { count: number }
    if (histRow.count === 0) {
      const allAssets = db.prepare('SELECT * FROM assets').all() as any[]
      for (const a of allAssets) {
        const tag = a.tagNumber || `ETH-AMS-${a.id.toString().padStart(5, '0')}`
        db.prepare(`
          INSERT INTO asset_history (assetId, assetName, tagNumber, actionType, previousStatus, newStatus, performedBy, details, timestamp)
          VALUES (?, ?, ?, 'REGISTRATION', NULL, 'Registered', 'System Admin', ?, datetime('now', '-30 days'))
        `).run(
          a.id,
          a.name,
          tag,
          `Initial asset registration: ${a.quantity} ${a.unit || 'units'} (${a.category}) acquired @ ETB ${a.unitCost}`
        )

        if (a.custodian) {
          db.prepare(`
            INSERT INTO asset_history (assetId, assetName, tagNumber, actionType, previousStatus, newStatus, performedBy, details, timestamp)
            VALUES (?, ?, ?, 'ASSIGNMENT', 'Registered', 'Assigned', 'System Admin', ?, datetime('now', '-15 days'))
          `).run(
            a.id,
            a.name,
            tag,
            `Assigned to staff custodian: ${a.custodian} (${a.department || 'General'})`
          )
        } else if (a.department) {
          db.prepare(`
            INSERT INTO asset_history (assetId, assetName, tagNumber, actionType, previousStatus, newStatus, performedBy, details, timestamp)
            VALUES (?, ?, ?, 'DISTRIBUTION', 'Registered', 'Distributed', 'System Admin', ?, datetime('now', '-20 days'))
          `).run(
            a.id,
            a.name,
            tag,
            `Distributed to institutional department: ${a.department}`
          )
        }

        if (a.condition === 'Under Maintenance') {
          db.prepare(`
            INSERT INTO asset_history (assetId, assetName, tagNumber, actionType, previousStatus, newStatus, performedBy, details, timestamp)
            VALUES (?, ?, ?, 'MAINTENANCE', 'Assigned', 'Under Maintenance', 'System Admin', ?, datetime('now', '-3 days'))
          `).run(
            a.id,
            a.name,
            tag,
            `Asset logged for scheduled hardware inspection and maintenance`
          )
        }

        if (a.disposalStatus === 'Disposed') {
          db.prepare(`
            INSERT INTO asset_history (assetId, assetName, tagNumber, actionType, previousStatus, newStatus, performedBy, details, timestamp)
            VALUES (?, ?, ?, 'DISPOSAL', 'Functional', 'Disposed', 'Disposal Board', ?, datetime('now', '-5 days'))
          `).run(
            a.id,
            a.name,
            tag,
            `Decommissioned and disposed via ${a.disposalMethod || 'Public Auction'}`
          )
        }
      }
    }
  } catch (e) {
    console.error('History seed error:', e)
  }
  }
}
}

export function clearSystemData(options: { keepAdminOnly?: boolean } = { keepAdminOnly: true }) {
  db.exec(`
    DELETE FROM asset_history;
    DELETE FROM inventory_count_items;
    DELETE FROM inventory_counts;
    DELETE FROM disposals;
    DELETE FROM voucher_items;
    DELETE FROM vouchers_model19;
    DELETE FROM vouchers_model20;
    DELETE FROM vouchers_model22;
    DELETE FROM transactions;
    DELETE FROM maintenance_logs;
    DELETE FROM pending_requests;
    DELETE FROM asset_transfers;
    DELETE FROM consumable_allocations;
    DELETE FROM assets;
  `)

  if (options.keepAdminOnly) {
    db.exec(`
      DELETE FROM user_hierarchies;
      DELETE FROM users WHERE role != 'Admin' AND phone != '0923000001';
    `)
  }

  try {
    db.exec(`
      DELETE FROM sqlite_sequence WHERE name IN (
        'assets', 'vouchers_model19', 'vouchers_model20', 'vouchers_model22',
        'voucher_items', 'transactions', 'asset_transfers', 'consumable_allocations',
        'inventory_counts', 'inventory_count_items', 'disposals', 'maintenance_logs',
        'pending_requests', 'asset_history'
      );
    `)
  } catch {}

  return { success: true, message: 'All default records have been cleared successfully.' }
}

export function resetDatabase() {
  return clearSystemData({ keepAdminOnly: true })
}

export function getDbPath() {
  return resolveDbPath()
}

// ── SYSTEM SETTINGS & FEATURE TOGGLE ─────────────────────────

export function getSystemSetting(key: string, defaultValue = ''): string {
  const row = db.prepare('SELECT value FROM system_settings WHERE key = ?').get(key) as { value: string } | undefined
  return row ? row.value : defaultValue
}

export function setSystemSetting(key: string, value: string): void {
  db.prepare(`
    INSERT INTO system_settings (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(key, value)
}

export function getAllSystemSettings(): Record<string, string> {
  const rows = db.prepare('SELECT key, value FROM system_settings').all() as { key: string; value: string }[]
  const result: Record<string, string> = {}
  for (const r of rows) {
    result[r.key] = r.value
  }
  return result
}

// ── EMPLOYEE CLEARANCE HANDLERS (የሰራተኞች ክሊራንስ) ─────────────

export interface ClearanceRecord {
  id?: number
  clearanceNo: string
  employeeId?: number
  employeeName: string
  department: string
  position?: string
  reason: string
  status: 'IN_PROGRESS' | 'CLEARED' | 'REJECTED'
  initialAssetCount: number
  clearedAssetCount: number
  clearedAt?: string
  clearedByStorekeeperId?: number
  clearedByStorekeeperName?: string
  approverSignatureHash?: string
  createdAt?: string
}

export function getAllClearances(): ClearanceRecord[] {
  return db.prepare('SELECT * FROM employee_clearances ORDER BY createdAt DESC').all() as ClearanceRecord[]
}

// Fixed assets categories required for clearance (ቋሚ ንብረቶች ብቻ)
// Stationery and Cleaning items are consumables (አላቂ) and expensed upon issue
export const FIXED_ASSET_CATEGORIES = ['Electronics', 'Furniture', 'Vehicles', 'Machinery', 'Appliances', 'Others']
export const CONSUMABLE_CATEGORIES = ['Stationery', 'Cleaning']

export function getEmployeeAssignedAssets(employeeName: string) {
  const trimmed = employeeName.trim()
  return db.prepare(`
    SELECT id, name, category, tagNumber, serialNumber, unitCost, unit, condition, location, department, purchaseDate, lifecycleStatus
    FROM assets
    WHERE lower(custodian) = lower(?) 
      AND disposalStatus = 'Active'
      AND category NOT IN ('Stationery', 'Cleaning')
    ORDER BY category ASC, name ASC
  `).all(trimmed) as any[]
}

export function getEmployeeConsumables(employeeName: string) {
  const trimmed = employeeName.trim()
  return db.prepare(`
    SELECT id, name, category, tagNumber, quantity, unit, unitCost, purchaseDate, department
    FROM assets
    WHERE lower(custodian) = lower(?)
      AND category IN ('Stationery', 'Cleaning')
    ORDER BY name ASC
  `).all(trimmed) as any[]
}

export function createClearance(data: Partial<ClearanceRecord>) {
  const assets = getEmployeeAssignedAssets(data.employeeName || '')
  const clearanceNo = data.clearanceNo || `CLR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`

  const stmt = db.prepare(`
    INSERT INTO employee_clearances (
      clearanceNo, employeeId, employeeName, department, position, reason,
      status, initialAssetCount, clearedAssetCount
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const initialCount = assets.length
  const initialStatus = initialCount === 0 ? 'CLEARED' : 'IN_PROGRESS'

  const res = stmt.run(
    clearanceNo,
    data.employeeId || null,
    data.employeeName,
    data.department || 'General',
    data.position || 'Staff',
    data.reason || 'Resignation',
    initialStatus,
    initialCount,
    0
  )

  return {
    success: true,
    id: res.lastInsertRowid,
    clearanceNo,
    initialAssetCount: initialCount,
    status: initialStatus
  }
}

export function returnAssetToStore(data: {
  assetId: number
  employeeName: string
  condition?: string
  storeNo?: string
  shelfNo?: string
  handledBy: string
  notes?: string
}) {
  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(data.assetId) as any
  if (!asset) return { success: false, error: 'Asset not found' }

  if (asset.custodian && asset.custodian.trim().toLowerCase() !== data.employeeName.trim().toLowerCase()) {
    return { success: false, error: `Asset belongs to ${asset.custodian}, not ${data.employeeName}` }
  }

  const finalCondition = data.condition || asset.condition || 'Functional'
  const storeLocation = data.storeNo ? `Store: ${data.storeNo}${data.shelfNo ? ` / Shelf: ${data.shelfNo}` : ''}` : 'Main Store'

  const runTransaction = db.transaction(() => {
    // 1. Reset asset custodian and return to Store
    db.prepare(`
      UPDATE assets 
      SET custodian = NULL,
          department = 'ግምጃ ቤት (STORE)',
          condition = ?,
          lifecycleStatus = 'Registered',
          location = ?,
          lastUpdated = datetime('now')
      WHERE id = ?
    `).run(finalCondition, storeLocation, data.assetId)

    // 2. Record asset history
    db.prepare(`
      INSERT INTO asset_history (assetId, assetName, tagNumber, actionType, previousStatus, newStatus, performedBy, details)
      VALUES (?, ?, ?, 'RETURN_TO_STORE', 'Assigned', 'In Store', ?, ?)
    `).run(
      asset.id,
      asset.name,
      asset.tagNumber || `ETH-AMS-${asset.id.toString().padStart(5, '0')}`,
      data.handledBy || 'Storekeeper',
      `Clearance Handover: Returned from custodian [${data.employeeName}] to [${storeLocation}]. Condition: ${finalCondition}. ${data.notes || ''}`
    )

    // 3. Log into clearance_items
    db.prepare(`
      INSERT INTO clearance_items (assetId, assetName, tagNumber, actionType, conditionAtReturn, returnedToStoreNo, handledBy)
      VALUES (?, ?, ?, 'RETURN_TO_STORE', ?, ?, ?)
    `).run(
      asset.id,
      asset.name,
      asset.tagNumber || `ETH-AMS-${asset.id.toString().padStart(5, '0')}`,
      finalCondition,
      storeLocation,
      data.handledBy || 'Storekeeper'
    )

    // 4. Update clearance record if active
    db.prepare(`
      UPDATE employee_clearances
      SET clearedAssetCount = clearedAssetCount + 1
      WHERE lower(employeeName) = lower(?) AND status = 'IN_PROGRESS'
    `).run(data.employeeName)
  })

  runTransaction()

  const remaining = getEmployeeAssignedAssets(data.employeeName)
  return {
    success: true,
    message: `Asset [${asset.name}] returned to store successfully.`,
    remainingCount: remaining.length,
    isFullyCleared: remaining.length === 0
  }
}

export function finalizeClearance(data: {
  clearanceNo: string
  employeeName: string
  approverId: number
  approverName: string
  approverPin: string
}) {
  // 1. Zero-debt gatekeeper
  const remaining = getEmployeeAssignedAssets(data.employeeName)
  if (remaining.length > 0) {
    return {
      success: false,
      error: `Cannot issue clearance! Employee still holds ${remaining.length} unreturned asset(s).`
    }
  }

  // 2. Verify approver PIN
  const pinRes = verifyUserSigningPin(data.approverId, data.approverPin)
  if (!pinRes.valid) {
    return {
      success: false,
      error: pinRes.error || 'Invalid Security PIN'
    }
  }

  // 3. Generate HMAC digital signature seal
  const signatureHash = generateDocumentSignature({
    clearanceNo: data.clearanceNo,
    employeeName: data.employeeName,
    status: 'DEBT_FREE_VERIFIED',
    approverId: data.approverId,
    timestamp: new Date().toISOString()
  }, data.approverId, data.approverName)

  // 4. Update clearance status
  db.prepare(`
    UPDATE employee_clearances
    SET status = 'CLEARED',
        clearedAt = datetime('now'),
        clearedByStorekeeperId = ?,
        clearedByStorekeeperName = ?,
        approverSignatureHash = ?
    WHERE clearanceNo = ?
  `).run(data.approverId, data.approverName, signatureHash, data.clearanceNo)

  return {
    success: true,
    message: 'Employee clearance officially approved and sealed with digital signature.',
    signatureHash,
    clearedAt: new Date().toISOString()
  }
}

// ── BULK ASSET IMPORT (ኤክሴል ጅምላ ማስገቢያ) ─────────────────────────

export function addAssetsBulk(assets: Asset[]): { count: number; ids: number[]; errors: string[] } {
  const errors: string[] = []
  const insertedIds: number[] = []

  const insertTx = db.transaction((items: Asset[]) => {
    for (let i = 0; i < items.length; i++) {
      try {
        const item = items[i]
        if (!item || !item.name) {
          errors.push(`Row ${i + 1}: Asset name is required`)
          continue
        }
        const res = addAsset(item)
        insertedIds.push(res.id)
      } catch (err: any) {
        errors.push(`Row ${i + 1} (${items[i]?.name || 'Unknown'}): ${err.message}`)
      }
    }
  })

  insertTx(assets)
  return { count: insertedIds.length, ids: insertedIds, errors }
}

// ── DATABASE BACKUP & RESTORE (የመረጃ ቋት ባክአፕ እና መመለሻ) ─────────

export async function createDatabaseBackup(): Promise<{ success: boolean; filePath?: string; filename?: string; error?: string }> {
  try {
    const backupsDir = join(process.cwd(), 'data', 'backups')
    if (!existsSync(backupsDir)) {
      mkdirSync(backupsDir, { recursive: true })
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const filename = `asset-management-backup-${timestamp}.db`
    const backupFilePath = join(backupsDir, filename)

    // Using better-sqlite3 backup API for safe, concurrent live snapshot
    await db.backup(backupFilePath)

    return { success: true, filePath: backupFilePath, filename }
  } catch (err: any) {
    console.error('[AMS] Database backup error:', err)
    return { success: false, error: err.message }
  }
}

export function restoreDatabaseFromFile(uploadedFilePathOrBuffer: string | Buffer): { success: boolean; message?: string; error?: string } {
  try {
    const currentDbPath = resolveDbPath()
    const backupsDir = join(process.cwd(), 'data', 'backups')
    if (!existsSync(backupsDir)) mkdirSync(backupsDir, { recursive: true })

    // 1. Take safety snapshot of current DB before overwriting
    const safetySnapshotPath = join(backupsDir, `pre-restore-safety-${Date.now()}.db`)
    try {
      copyFileSync(currentDbPath, safetySnapshotPath)
    } catch {}

    // 2. Close active DB connection
    try {
      db.close()
    } catch {}

    // 3. Overwrite with new DB file
    if (typeof uploadedFilePathOrBuffer === 'string') {
      copyFileSync(uploadedFilePathOrBuffer, currentDbPath)
    } else {
      const fs = require('fs')
      fs.writeFileSync(currentDbPath, uploadedFilePathOrBuffer)
    }

    // 4. Reopen database connection & run schema migrations
    initDatabase()

    return {
      success: true,
      message: 'Database successfully restored from backup! All tables re-initialized.'
    }
  } catch (err: any) {
    console.error('[AMS] Database restore error:', err)
    try { initDatabase() } catch {}
    return { success: false, error: err.message }
  }
}

export function listBackups(): Array<{ filename: string; sizeBytes: number; createdAt: string }> {
  try {
    const backupsDir = join(process.cwd(), 'data', 'backups')
    if (!existsSync(backupsDir)) return []
    const fs = require('fs')
    const files = fs.readdirSync(backupsDir)
    return files
      .filter((f: string) => f.endsWith('.db'))
      .map((f: string) => {
        const stats = fs.statSync(join(backupsDir, f))
        return {
          filename: f,
          sizeBytes: stats.size,
          createdAt: stats.mtime.toISOString()
        }
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  } catch {
    return []
  }
}

// ── COMMERCIAL LICENSE & SYSTEM ACTIVATION (የሶፍትዌር ንግድ ፈቃድ) ──

export function getSystemLicenseStatus(): {
  isActivated: boolean
  licenseKey: string
  clientName: string
  edition: string
  expiresAt: string
  hardwareId: string
} {
  const licenseKey = getSystemSetting('license_key', '')
  const clientName = getSystemSetting('org_name', 'Default Enterprise')
  const edition = getSystemSetting('license_edition', 'Enterprise Offline Pro')
  const expiresAt = getSystemSetting('license_expires_at', '2099-12-31')
  const hardwareId = getSystemSetting('system_hardware_id', 'AMS-ETH-SRV-2026-X1')

  const isActivated = licenseKey.trim().length >= 16

  return {
    isActivated,
    licenseKey,
    clientName,
    edition,
    expiresAt,
    hardwareId
  }
}

export function activateSystemLicense(key: string, clientName?: string): { success: boolean; message: string } {
  const cleanKey = (key || '').trim().toUpperCase()
  if (cleanKey.length < 12) {
    return { success: false, message: 'Invalid license key format. Key must be at least 12 characters.' }
  }

  setSystemSetting('license_key', cleanKey)
  if (clientName) setSystemSetting('org_name', clientName)
  setSystemSetting('license_activated_at', new Date().toISOString())

  return {
    success: true,
    message: 'System commercial license successfully activated.'
  }
}




