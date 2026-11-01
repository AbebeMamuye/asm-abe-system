import { create } from 'zustand'
import {
  Asset,
  User,
  Transaction,
  Voucher19,
  Voucher20,
  Voucher22,
  DashboardStats,
  MaintenanceLog,
  PendingRequest,
  InventoryCount,
  InventoryCountItem,
  Disposal,
  UserHierarchy,
  AssetTransfer,
  ConsumableAllocation
} from './types'

export type {
  Asset,
  User,
  Transaction,
  Voucher19,
  Voucher20,
  Voucher22,
  VoucherItem,
  DashboardStats,
  MaintenanceLog,
  PendingRequest,
  InventoryCount,
  InventoryCountItem,
  Disposal,
  UserHierarchy,
  AssetTransfer,
  ConsumableAllocation,
  Department,
  UserRole,
  AssetHistory,
  AssetLifecycleStatus
} from './types'
export { DEFAULT_SYSTEM_USERS } from './types'

const API_BASE = typeof window !== 'undefined' && window.location?.host
  ? `${window.location.protocol}//${window.location.host}/api`
  : 'http://localhost:5002/api'

async function callAPI(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', body?: any) {
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body) options.body = JSON.stringify(body)
  
  const response = await fetch(`${API_BASE}${endpoint}`, options)
  if (!response.ok) throw new Error(`API Error: ${response.statusText}`)
  return response.json()
}

export const TRANSLATIONS = {
  EN: {
    dashboard: 'Dashboard',
    registry: 'Asset Registry',
    model19: 'Stock-In Receipt (M19)',
    model20: 'Requisition Form (M20)',
    model22: 'Issue Voucher (M22)',
    maintenance: 'Maintenance Log',
    audit: 'Audit Trail',
    totalAssets: 'Total Assets',
    inventoryValue: 'Inventory Value',
    functional: 'Functional',
    nonFunctional: 'Non-Functional',
    registerAsset: 'Register Asset',
    search: 'Search...',
    actions: 'Actions',
    condition: 'Condition',
    location: 'Location / Department',
    stock: 'Stock',
    unit: 'Unit',
    systemTitle: 'Asset Management System',
    tagline: 'Professional Institutional Asset Tracking',
    receiptForm: 'Receipt (Stock-In)',
    requisitionForm: 'Requisition Form',
    issueForm: 'Issue Voucher',
    newReceipt: 'New Receipt (M19)',
    newRequest: 'New Request (M20)',
    newIssue: 'New Issue (M22)',
    save: 'Save Changes',
    cancel: 'Cancel',
    recordReceipt: 'Record Receipt',
    authorizeIssue: 'Authorize Issue',
    submitRequest: 'Submit Request',
    login: 'Login',
    signIn: 'Sign In',
    googleSignIn: 'Quick Offline Account',
    username: 'Username',
    password: 'Password',
    loginError: 'Invalid credentials. Please try again.',
    forgotPassword: 'Forgot Password?',
    forgotPasswordInstructions: 'This is an offline-first system. To reset your password, please contact the administrator or run the database reset script on the host machine.',
    welcome: 'Welcome back!',
    loginTagline: 'Secure access to Asset Management System',
    defaultAccountsHint: 'First-time setup: admin@ams.local / Admin@AMS2026',
    ensuringText: 'Ensuring transparency, accountability, and efficiency in institutional asset management.',
    offlineFirst: 'Offline-First',
    sqlitePowered: 'SQLite Powered',
    systemOnline: 'System Online',
    approvals: 'Approvals',
    settings: 'Settings',
    logout: 'Logout',
    reports: 'Reports',
    maintenanceLog: 'Maintenance Log',
    reportIssue: 'Report Issue',
    issueDescription: 'Issue Description',
    technician: 'Assigned Technician',
    markResolved: 'Mark Resolved',
    startWork: 'Start Work',
    resolved: 'Resolved',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    voucherNo: 'Voucher No / የደረሰኝ ቁጥር',
    department: 'Department / ክፍል',
    recipient: 'Recipient Name / የተቀባይ ስም',
    receivedFrom: 'Received From / የተረከብንበት ስም',
    storekeeper: 'Storekeeper Name / የንብረት ሹም ስም',
    model: 'Model / ሞዴል',
    serial: 'Serial / ሲሪያል',
    pageFrom: 'Pg From / ከገጽ',
    pageTo: 'Pg To / እስከ ገጽ',
    qty: 'Quantity / ብዛት',
    unitCost: 'Unit Cost / ያንዱ ዋጋ',
    totalCost: 'Total Cost / የዋጋው ድምር',
    add: 'Add / ጨምር',
    classification: 'Classification / ምድብ',
    expenditureNo: 'Expenditure Reg. No / የወጪ መዝገብ ቁጥር',
    incomingNo: 'Incoming Reg. No / የገቢ መዝገብ ቁጥር',
    storeNo: 'Store No / የመጋዘን ቁጥር',
    shelfNo: 'Shelf No / የመደርደሪያ ቁጥር',
    authorizedBy: 'Authorized By / የፈቀደው ስም',
    requestedBy: 'Requested By / የጠየቀው ስም',
    binCard: 'Bin Card / ቢን ካርድ',
    // New Reports Translations
    itemNo: 'Item No.',
    assetStockCode: 'Asset/Stock Code',
    itemDescription: 'Item Description & Specs',
    uom: 'UoM',
    qtyReceived: 'Qty Received',
    unitPrice: 'Unit Price',
    totalPrice: 'Total Price',
    shelfLocation: 'Shelf / Location',
    conditionStatus: 'Condition Status',
    remarks: 'Remarks / Discrepancies',
    model19ReportTitle: 'Model 19 (Received) Report',
    model19ReportDesc: 'Detailed log of all received assets and inventory items.',
    binCardRef: 'Bin Card Ref',
    tagId: 'Tag ID (Barcoded)',
    detailedDescription: 'Detailed Description',
    serialNumberReport: 'Serial Number',
    qtyReq: 'Qty Req.',
    qtyIssued: 'Qty Issued',
    lifeStatus: 'Life Status',
    model22ReportTitle: 'Model 22 (Issued) Report',
    model22ReportDesc: 'Detailed log of all issued assets and inventory items.',
    date: 'Date',
    refDocNo: 'Ref / Doc No.',
    descriptionSource: 'Description / Source',
    begBalance: 'Beg. Balance',
    endBalance: 'Ending Balance',
    totalInvValue: 'Total Inv. Value',
    balanceReportTitle: 'Current Balance (Store Ledger Card)',
    balanceReportDesc: 'Dynamic tracking of inventory math (Beginning + Received - Issued).',
    // Ethiopian Public Asset Management Directives: Responsibility, Transparency, Control
    inventoryCount: 'Physical Inventory & Reconciliation',
    inventoryCountDesc: 'Annual verification committee stock-take & discrepancy reconciliation.',
    newInventoryCount: 'New Annual Stock Count',
    fiscalYear: 'Fiscal Year',
    countDate: 'Count Date',
    committeeChair: 'Committee Chair',
    committeeMembers: 'Committee Members',
    systemQty: 'System Balance',
    countedQty: 'Physical Count',
    variance: 'Discrepancy / Variance',
    shortage: 'Shortage (Deficit)',
    surplus: 'Surplus (Excess)',
    reconciled: 'Reconciled & Adjusted',
    reconcileAction: 'Reconcile System Balances',
    disposal: 'Asset Disposal & Decommissioning',
    disposalDesc: 'Legal public property disposal (Auction, Transfer, Donation, Scrap).',
    newDisposal: 'Decommission / Dispose Asset',
    disposalMethod: 'Disposal Method',
    publicAuction: 'Public Auction / Tender',
    transferPublicBody: 'Transfer to Public Body',
    donation: 'Donation',
    destructionScrap: 'Destruction / Scrap',
    recoveredAmount: 'Recovered Revenue (ETB)',
    disposalReason: 'Justification / Reason',
    custodian: 'Asset Custodian / Holder',
    tagNumber: 'Asset Tag / Code (FAR)',
    fixedAssetRegister: 'Fixed Asset Register (FAR)',
    accountability: 'Accountability & Responsibility',
    transparency: 'Transparency',
    internalControl: 'Internal Control & Audit',
    myAssets: 'My Assigned Assets',
    hierarchies: 'Workflow Links (Hierarchy)',
    createLink: 'Create Reporting Link',
    transfers: 'Asset Transfers',
    allocations: 'Quota Allocation',
    qrCode: 'QR Code Tag',
    printSticker: 'Print QR Sticker',
    transferAsset: 'Transfer Asset',
    returnAsset: 'Return to Store',
    requestConsumable: 'Request Consumables',
    requestFixedAsset: 'Request Fixed Asset',
    printCustodyList: 'Print Custody Handover',
    ownedAssets: 'Owned Assets',
    registeredAssets: 'Registered Assets',
    distributedAssets: 'Distributed Assets',
    disposedAssets: 'Disposed Assets',
    transferAssets: 'Transfer Assets',
    maintainedAssets: 'Maintained Assets',
    assetHistory: 'Asset History',
    userManagement: 'User Management'
  },
  AM: {
    dashboard: 'ዳሽቦርድ',
    registry: 'የንብረት መዝገብ',
    model19: 'ሞዴል 19 (ገቢ)',
    model20: 'ሞዴል 20 (ጥያቄ)',
    model22: 'ሞዴል 22 (ወጪ)',
    maintenance: 'ጥገና መዝገብ',
    audit: 'የኦዲት መዝገብ',
    totalAssets: 'ጠቅላላ ንብረቶች',
    inventoryValue: 'ጠቅላላ ዋጋ',
    functional: 'ተግባራዊ',
    nonFunctional: 'የማይሰራ',
    registerAsset: 'ንብረት መዝግብ',
    search: 'ፈልግ...',
    actions: 'ተግባራት',
    condition: 'ሁኔታ',
    location: 'ክፍል / ቦታ',
    stock: 'ብዛት',
    unit: 'መለኪያ',
    systemTitle: 'የንብረት አስተዳደር',
    tagline: 'አጠቃላይ የንብረት ክትትል ሲስተም',
    receiptForm: 'የንብረት ገቢ ደረሰኝ',
    requisitionForm: 'የእቃ ወጪ መጠየቂያ',
    issueForm: 'የዕቃ ወጪ ደረሰኝ',
    newReceipt: 'አዲስ ገቢ (M19)',
    newRequest: 'አዲስ ጥያቄ (M20)',
    newIssue: 'አዲስ ወጪ (M22)',
    save: 'ለውጦችን አስቀምጥ',
    cancel: 'አጥፋ',
    recordReceipt: 'ገቢ አድርግ',
    authorizeIssue: 'ወጪ ፍቀድ',
    submitRequest: 'ጥያቄ አቅርብ',
    login: 'ግባ',
    signIn: 'መለያ ግባ',
    googleSignIn: 'ፈጣን ምዝገባ',
    username: 'መለያ ስም',
    password: 'የይለፍ ቃል',
    loginError: 'የተሳሳተ መለያ ስም ወይም ይለፍ ቃል!',
    forgotPassword: 'የይለፍ ቃል ረሱ?',
    forgotPasswordInstructions: 'ይህ ሲስተም ያለ ኢንተርኔት የሚሰራ (Offline) ነው። የይለፍ ቃል ለመቀየር እባክዎ በኮምፒውተሩ ላይ ያለውን የዳግም ማስጀመሪያ ስክሪፕት ያሂዱ ወይም ለአስተዳዳሪው ያሳውቁ።',
    welcome: 'እንኳን ደህና መጡ!',
    loginTagline: 'ወደ የንብረት አስተዳደር ስርዓት ደህንነቱ የተጠበቀ መግቢያ',
    defaultAccountsHint: 'የመጀመሪያ መግቢያ: admin@ams.local / Admin@AMS2026',
    ensuringText: 'በተቋማዊ የንብረት አስተዳደር ውስጥ ግልጽነትን፣ ተጠያቂነትን እና ቅልጥፍናን ማረጋገጥ።',
    offlineFirst: 'ያለ ኢንተርኔት የሚሰራ',
    sqlitePowered: 'በSQLite የሚሰራ',
    systemOnline: 'ሲስተሙ እየሰራ ነው',
    approvals: 'ፈቃዶች',
    settings: 'ቅንብሮች',
    logout: 'ውጣ',
    reports: 'ሪፖርቶች',
    maintenanceLog: 'የጥገና መዝገብ',
    reportIssue: 'ብልሽት ሪፖርት አድርግ',
    issueDescription: 'የብልሽቱ መግለጫ',
    technician: 'ባለሙያ',
    markResolved: 'ተጠግኗል በል',
    startWork: 'ጥገና ጀምር',
    resolved: 'ተጠግኗል',
    pending: 'በመጠባበቅ ላይ',
    approved: 'ተፈቅዷል',
    rejected: 'ተከልክሏል',
    voucherNo: 'Voucher No / የደረሰኝ ቁጥር',
    department: 'Department / ክፍል',
    recipient: 'Recipient Name / የተቀባይ ስም',
    receivedFrom: 'Received From / የተረከብንበት ስም',
    storekeeper: 'Storekeeper Name / የንብረት ሹም ስም',
    model: 'Model / ሞዴል',
    serial: 'Serial / ሲሪያል',
    pageFrom: 'Pg From / ከገጽ',
    pageTo: 'Pg To / እስከ ገጽ',
    qty: 'Quantity / ብዛት',
    unitCost: 'Unit Cost / ያንዱ ዋጋ',
    totalCost: 'Total Cost / የዋጋው ድምር',
    add: 'Add / ጨምር',
    classification: 'Classification / ምድብ',
    expenditureNo: 'Expenditure Reg. No / የወጪ መዝገብ ቁጥር',
    incomingNo: 'Incoming Reg. No / የገቢ መዝገብ ቁጥር',
    storeNo: 'Store No / የመጋዘን ቁጥር',
    shelfNo: 'Shelf No / የመደርደሪያ ቁጥር',
    authorizedBy: 'Authorized By / የፈቀደው ስም',
    requestedBy: 'Requested By / የጠየቀው ስም',
    binCard: 'ቢን ካርድ',
    // New Reports Translations
    itemNo: 'የእቃ ቁጥር',
    assetStockCode: 'የንብረት መለያ ኮድ',
    itemDescription: 'የእቃ መግለጫ እና ዝርዝር',
    uom: 'መለኪያ',
    qtyReceived: 'ገቢ የተደረገ ብዛት',
    unitPrice: 'የአንዱ ዋጋ',
    totalPrice: 'አጠቃላይ ዋጋ',
    shelfLocation: 'መደርደሪያ / ቦታ',
    conditionStatus: 'የእቃው ሁኔታ',
    remarks: 'ማሳሰቢያ',
    model19ReportTitle: 'ሞዴል 19 (ገቢ) ሪፖርት',
    model19ReportDesc: 'ወደ ስቶር ገቢ የተደረጉ እቃዎች ዝርዝር መዝገብ።',
    binCardRef: 'ቢን ካርድ ማጣቀሻ',
    tagId: 'የንብረት ታግ (ባርኮድ)',
    detailedDescription: 'ዝርዝር መግለጫ',
    serialNumberReport: 'የፋብሪካ ሲሪያል ቁጥር',
    qtyReq: 'የተጠየቀው ብዛት',
    qtyIssued: 'ወጪ የተደረገ ብዛት',
    lifeStatus: 'የአገልግሎት ሁኔታ',
    model22ReportTitle: 'ሞዴል 22 (ወጪ) ሪፖርት',
    model22ReportDesc: 'ከስቶር ወጪ የተደረጉ እቃዎች ዝርዝር መዝገብ።',
    date: 'ቀን',
    refDocNo: 'የማጣቀሻ ቁጥር',
    descriptionSource: 'መግለጫ / ምንጭ',
    begBalance: 'የነበረው ቀሪ',
    endBalance: 'የአሁኑ ቀሪ',
    totalInvValue: 'ጠቅላላ የንብረት ዋጋ',
    balanceReportTitle: 'የንብረት ቀሪ ሒሳብ ካርድ',
    balanceReportDesc: 'ተለዋዋጭ የሒሳብ መዝገብ ክትትል (የነበረው + ገቢ - ወጪ)',
    // የኢትዮጵያ መንግስት ንብረት አስተዳደር: ኃላፊነት፣ ግልፅነት፣ ቁጥጥር
    inventoryCount: 'የንብረት ቆጠራና ማስታረቂያ',
    inventoryCountDesc: 'የዓመታዊ ቆጠራ ኮሚቴ ሪፖርት እና የልዩነት (ጉድለት/ትርፍ) ማስታረቂያ።',
    newInventoryCount: 'አዲስ ዓመታዊ ቆጠራ መዝግብ',
    fiscalYear: 'የበጀት ዓመት',
    countDate: 'የተቆጠረበት ቀን',
    committeeChair: 'የቆጠራ ኮሚቴ ሰብሳቢ',
    committeeMembers: 'የኮሚቴ አባላት',
    systemQty: 'በመዝገብ ያለው',
    countedQty: 'በአካል የተገኘው (የተቆጠረው)',
    variance: 'ልዩነት',
    shortage: 'ጉድለት',
    surplus: 'ትርፍ',
    reconciled: 'የተስታረቀ እና የጸደቀ',
    reconcileAction: 'መዝገብ አስተካክልና አስታርቅ',
    disposal: 'የንብረት ውግጃና ማስወገድ',
    disposalDesc: 'ያረጁና የተበላሹ ንብረቶች በህጉ መሰረት (በጨረታ፣ በዝውውር፣ በስጦታ፣ በማስወገድ) የሚወገዱበት ስርዓት።',
    newDisposal: 'ንብረት አስወግድ / ውግጃ መዝግብ',
    disposalMethod: 'የማስወገጃ ዘዴ',
    publicAuction: 'በግልፅ ጨረታ ሽያጭ',
    transferPublicBody: 'ወደ ሌላ የመንግስት ተቋም ማስተላለፍ',
    donation: 'በስጦታ መስጠት',
    destructionScrap: 'ማስወገድ / ማውደም (ውዳቂ)',
    recoveredAmount: 'ገቢ የተደረገ ገንዘብ (ብር)',
    disposalReason: 'የውግጃ ምክንያት',
    custodian: 'የንብረቱ ተረካቢ / ኃላፊ',
    tagNumber: 'የንብረት መለያ ቁጥር (ታግ)',
    fixedAssetRegister: 'የቋሚ ንብረት መዝገብ',
    accountability: 'ኃላፊነትና ተጠያቂነት',
    transparency: 'ግልፅነት',
    internalControl: 'ቁጥጥርና ክትትል',
    myAssets: 'የእኔ ንብረቶች',
    hierarchies: 'የስራ ትስስር (ተዋረድ)',
    createLink: 'ትስስር ፍጠር',
    transfers: 'ንብረት ማስተላለፍ',
    allocations: 'አላቂቃ ማከፋፈልና መመደብ',
    qrCode: 'የQR ኮድ መለያ',
    printSticker: 'የQR ኮድ ስቲከር አትም',
    transferAsset: 'ንብረት አስተላልፍ',
    returnAsset: 'ንብረት ወደ ግምጃ ቤት መልስ',
    requestConsumable: 'አላቂ ንብረት መጠየቅ',
    requestFixedAsset: 'ቋሚ ንብረት መጠየቅ',
    printCustodyList: 'የተረከብኳቸውን ንብረቶች አትም',
    ownedAssets: 'የድርጅቱ ንብረቶች',
    registeredAssets: 'የተመዘገቡ ንብረቶች',
    distributedAssets: 'የተከፋፈሉ ንብረቶች',
    disposedAssets: 'የተወገዱ ንብረቶች',
    transferAssets: 'ንብረት ማስተላለፍ',
    maintainedAssets: 'የተጠገኑ/በጥገና ያሉ',
    assetHistory: 'የንብረት ታሪክ ክትትል',
    userManagement: 'የተጠቃሚዎች አስተዳደር'
  }
}

const DEFAULT_ORG = {
  name: 'የአዲስ አበባ ከተማ አስተዳደር የመንግስት ንብረት አስተዳደር ባለስልጣን',
  tagline: 'AMIS — ኃላፊነት፣ ግልፅነት እና ቁጥጥር!'
}

interface AppState {
  assets: Asset[]
  users: User[]
  hierarchies: UserHierarchy[]
  transfers: AssetTransfer[]
  allocations: ConsumableAllocation[]
  transactions: Transaction[]
  maintenanceLogs: MaintenanceLog[]
  inventoryCounts: InventoryCount[]
  disposals: Disposal[]
  stats: DashboardStats
  isLoading: boolean
  activeTab: string
  isDarkMode: boolean
  language: 'EN' | 'AM'
  isAuthenticated: boolean
  user: User | null
  orgName: string
  orgTagline: string
  organizationMode: 'single' | 'hierarchical'
  singleOrgType: string

  setLanguage: (lang: 'EN' | 'AM') => void
  setActiveTab: (tab: string) => void
  setOrgName: (name: string) => void
  setOrgTagline: (tagline: string) => void
  setOrganizationMode: (mode: 'single' | 'hierarchical', type?: string) => Promise<void>
  fetchSystemSettings: () => Promise<void>
  
  toggleDarkMode: () => void
  login: (email: string, pass: string) => Promise<boolean>
  logout: () => void

  fetchAssets: () => Promise<void>
  fetchUsers: () => Promise<void>
  fetchHierarchies: () => Promise<void>
  createHierarchy: (data: any) => Promise<void>
  deleteHierarchy: (id: number) => Promise<void>
  fetchTransfers: () => Promise<void>
  createTransfer: (data: any) => Promise<void>
  respondTransfer: (id: number, status: 'Accepted' | 'Declined', note?: string) => Promise<void>
  fetchAllocations: () => Promise<void>
  createAllocation: (data: any) => Promise<void>
  changePassword: (userId: number, newPass: string) => Promise<boolean>

  fetchTransactions: () => Promise<void>
  fetchTransactionsByAsset: (assetId: number) => Promise<Transaction[]>
  fetchStats: () => Promise<void>
  fetchVouchersM19: () => Promise<void>
  fetchVouchersM20: () => Promise<void>
  fetchVouchersM22: () => Promise<void>
  fetchMaintenanceLogs: () => Promise<void>
  fetchInventoryCounts: () => Promise<void>
  createInventoryCount: (data: any) => Promise<void>
  fetchDisposals: () => Promise<void>
  createDisposal: (data: any) => Promise<void>

  addAsset: (asset: Partial<Asset>) => Promise<void>
  updateAsset: (id: number, asset: Partial<Asset>) => Promise<void>
  deleteAsset: (id: number) => Promise<void>
  
  createVoucherM19: (voucher: Voucher19) => Promise<void>
  createVoucherM20: (voucher: Voucher20) => Promise<void>
  createVoucherM22: (voucher: Voucher22) => Promise<void>
  
  addMaintenanceLog: (log: Partial<MaintenanceLog>) => Promise<void>
  updateMaintenanceLog: (id: number, updates: Partial<MaintenanceLog>) => Promise<void>
  
  assetHistory: AssetHistory[]
  fetchAssetHistory: (assetId?: number) => Promise<void>
  recordAssetHistory: (entry: any) => Promise<void>

  departments: Department[]
  fetchDepartments: () => Promise<void>
  addDepartment: (dept: Partial<Department>) => Promise<{ success: boolean; id?: number; error?: string }>
  updateDepartment: (id: number, dept: Partial<Department>) => Promise<{ success: boolean; error?: string }>
  deleteDepartment: (id: number) => Promise<{ success: boolean; error?: string }>
  clearSystemData: (options?: { keepAdminOnly?: boolean }) => Promise<{ success: boolean; message?: string }>

  pendingRequests: PendingRequest[]
  fetchPendingRequests: (status?: string) => Promise<PendingRequest[]>
  createPendingRequest: (req: any) => Promise<{ success: boolean; id?: number; error?: string }>
  reviewPendingRequest: (id: number, action: string, reviewedBy: string, reviewNote?: string) => Promise<{ success: boolean; error?: string }>

  refreshData: () => Promise<void>
}

export const useStore = create<AppState>((set, get) => ({
  assets: [],
  users: [],
  departments: [],
  hierarchies: [],
  transfers: [],
  allocations: [],
  transactions: [],
  vouchersM19: [],
  vouchersM20: [],
  vouchersM22: [],
  maintenanceLogs: [],
  inventoryCounts: [],
  disposals: [],
  assetHistory: [],
  pendingRequests: [],
  stats: {
    totalAssets: 0,
    totalValue: 0,
    functional: 0,
    nonFunctional: 0,
    categories: []
  },
  isLoading: false,
  activeTab: 'dashboard',
  isDarkMode: localStorage.getItem('theme') === 'dark',
  language: (localStorage.getItem('language') as 'EN' | 'AM') || 'AM',

  isAuthenticated: localStorage.getItem('auth') === 'true',
  user: JSON.parse(localStorage.getItem('user') || 'null'),

  orgName: localStorage.getItem('orgName') || DEFAULT_ORG.name,
  orgTagline: localStorage.getItem('orgTagline') || DEFAULT_ORG.tagline,
  organizationMode: (localStorage.getItem('ams_org_mode') as 'single' | 'hierarchical') || 'hierarchical',
  singleOrgType: localStorage.getItem('ams_single_org_type') || 'Health Center',

  setActiveTab: (tab) => set({ activeTab: tab }),

  setLanguage: (lang) => {
    set({ language: lang })
    localStorage.setItem('language', lang)
  },

  setOrgName: (name) => {
    set({ orgName: name })
    localStorage.setItem('orgName', name)
  },

  setOrgTagline: (tagline) => {
    set({ orgTagline: tagline })
    localStorage.setItem('orgTagline', tagline)
  },

  setOrganizationMode: async (mode: 'single' | 'hierarchical', type?: string) => {
    const orgType = type || get().singleOrgType || 'Health Center'
    set({ organizationMode: mode, singleOrgType: orgType })
    localStorage.setItem('ams_org_mode', mode)
    localStorage.setItem('ams_single_org_type', orgType)

    try {
      if (window.api?.setSystemSetting) {
        await window.api.setSystemSetting('organizationMode', mode)
        await window.api.setSystemSetting('singleOrgType', orgType)
      } else {
        await callAPI('/system/settings', 'POST', { key: 'organizationMode', value: mode })
        await callAPI('/system/settings', 'POST', { key: 'singleOrgType', value: orgType })
      }
    } catch (err) {
      console.warn('Failed to persist organizationMode to backend:', err)
    }
  },

  fetchSystemSettings: async () => {
    try {
      let settings: Record<string, string> = {}
      if (window.api?.getSystemSettings) {
        settings = await window.api.getSystemSettings()
      } else {
        settings = await callAPI('/system/settings')
      }
      if (settings?.organizationMode) {
        const mode = settings.organizationMode as 'single' | 'hierarchical'
        set({ organizationMode: mode })
        localStorage.setItem('ams_org_mode', mode)
      }
      if (settings?.singleOrgType) {
        set({ singleOrgType: settings.singleOrgType })
        localStorage.setItem('ams_single_org_type', settings.singleOrgType)
      }
    } catch (err) {
      console.warn('Failed to fetch system settings:', err)
    }
  },

  login: async (emailOrName, pass) => {
    const normalized = emailOrName.trim()
    try {
      const result = window.api?.authenticate
        ? await window.api.authenticate(normalized, pass)
        : await callAPI('/auth/login', 'POST', { emailOrName: normalized, password: pass })

      if (result?.success && result.user) {
        set({ isAuthenticated: true, user: result.user })
        localStorage.setItem('auth', 'true')
        localStorage.setItem('user', JSON.stringify(result.user))
        return true
      }
    } catch (e) {
      console.error(e)
    }
    return false
  },

  logout: () => {
    set({ isAuthenticated: false, user: null })
    localStorage.removeItem('auth')
    localStorage.removeItem('user')
  },

  toggleDarkMode: () => {
    const newMode = !get().isDarkMode
    set({ isDarkMode: newMode })
    localStorage.setItem('theme', newMode ? 'dark' : 'light')
    if (newMode) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  },

  fetchAssets: async () => {
    set({ isLoading: true })
    try {
      if (window.api) {
        const assets = await window.api.getAssets()
        set({ assets })
      } else {
        const assets = await callAPI('/assets')
        set({ assets })
      }
    } finally { set({ isLoading: false }) }
  },

  fetchUsers: async () => {
    if (window.api) {
      const users = await window.api.getAllUsers()
      set({ users })
    } else {
      const users = await callAPI('/users')
      set({ users })
    }
  },

  fetchTransactions: async () => {
    if (window.api) {
      const transactions = await window.api.getTransactions()
      set({ transactions })
    } else {
      const transactions = await callAPI('/transactions')
      set({ transactions })
    }
  },

  fetchTransactionsByAsset: async (assetId: number) => {
    if (window.api) {
      return await window.api.getTransactionsByAsset(assetId)
    } else {
      return await callAPI(`/transactions/asset/${assetId}`)
    }
  },

  fetchStats: async () => {
    if (window.api) {
      const stats = await window.api.getStats()
      set({ stats })
    } else {
      const stats = await callAPI('/stats')
      set({ stats })
    }
  },

  fetchVouchersM19: async () => {
    if (window.api) {
      const vouchersM19 = await window.api.getVouchersM19()
      set({ vouchersM19 })
    } else {
      const vouchersM19 = await callAPI('/vouchers/m19')
      set({ vouchersM19 })
    }
  },

  fetchVouchersM20: async () => {
    if (window.api) {
      const vouchersM20 = await window.api.getVouchersM20()
      set({ vouchersM20 })
    } else {
      const vouchersM20 = await callAPI('/vouchers/m20')
      set({ vouchersM20 })
    }
  },

  fetchVouchersM22: async () => {
    if (window.api) {
      const vouchersM22 = await window.api.getVouchersM22()
      set({ vouchersM22 })
    } else {
      const vouchersM22 = await callAPI('/vouchers/m22')
      set({ vouchersM22 })
    }
  },

  fetchMaintenanceLogs: async () => {
    if (window.api) {
      const maintenanceLogs = await window.api.getMaintenanceLogs()
      set({ maintenanceLogs })
    } else {
      const maintenanceLogs = await callAPI('/maintenance')
      set({ maintenanceLogs })
    }
  },

  addAsset: async (asset) => {
    if (window.api) await window.api.addAsset(asset)
    else await callAPI('/assets', 'POST', asset)
    await get().refreshData()
  },

  updateAsset: async (id, asset) => {
    if (window.api) await window.api.updateAsset(id, asset)
    else await callAPI(`/assets/${id}`, 'PUT', asset)
    await get().refreshData()
  },

  deleteAsset: async (id) => {
    if (window.api) await window.api.deleteAsset(id)
    else await callAPI(`/assets/${id}`, 'DELETE')
    await get().refreshData()
  },

  createVoucherM19: async (voucher) => {
    if (window.api) await window.api.createVoucherM19(voucher)
    else await callAPI('/vouchers/m19', 'POST', voucher)
    await get().refreshData()
  },

  createVoucherM20: async (voucher) => {
    if (window.api) await window.api.createVoucherM20(voucher)
    else await callAPI('/vouchers/m20', 'POST', voucher)
    await get().refreshData()
  },

  createVoucherM22: async (voucher) => {
    if (window.api) await window.api.createVoucherM22(voucher)
    else await callAPI('/vouchers/m22', 'POST', voucher)
    await get().refreshData()
  },

  addMaintenanceLog: async (log) => {
    if (window.api) await window.api.addMaintenance(log)
    else await callAPI('/maintenance', 'POST', log)
    await get().refreshData()
  },

  updateMaintenanceLog: async (id, updates) => {
    if (window.api) await window.api.updateMaintenance(id, updates)
    else await callAPI(`/maintenance/${id}`, 'PUT', updates)
    await get().refreshData()
  },

  fetchInventoryCounts: async () => {
    if (window.api) {
      const inventoryCounts = await window.api.getInventoryCounts()
      set({ inventoryCounts: inventoryCounts || [] })
    } else {
      const inventoryCounts = await callAPI('/inventory-counts')
      set({ inventoryCounts: inventoryCounts || [] })
    }
  },

  createInventoryCount: async (data: any) => {
    if (window.api) await window.api.createInventoryCount(data)
    else await callAPI('/inventory-counts', 'POST', data)
    await get().refreshData()
  },

  fetchDisposals: async () => {
    if (window.api) {
      const disposals = await window.api.getDisposals()
      set({ disposals: disposals || [] })
    } else {
      const disposals = await callAPI('/disposals')
      set({ disposals: disposals || [] })
    }
  },

  createDisposal: async (data: any) => {
    if (window.api) await window.api.createDisposal(data)
    else await callAPI('/disposals', 'POST', data)
    await get().refreshData()
  },

  fetchHierarchies: async () => {
    if (window.api) {
      const hierarchies = await window.api.getHierarchies()
      set({ hierarchies: hierarchies || [] })
    } else {
      const hierarchies = await callAPI('/hierarchies')
      set({ hierarchies: hierarchies || [] })
    }
  },

  createHierarchy: async (data: any) => {
    if (window.api) await window.api.createHierarchy(data)
    else await callAPI('/hierarchies', 'POST', data)
    await get().fetchHierarchies()
  },

  deleteHierarchy: async (id: number) => {
    if (window.api) await window.api.deleteHierarchy(id)
    else await callAPI(`/hierarchies/${id}`, 'DELETE')
    await get().fetchHierarchies()
  },

  fetchTransfers: async () => {
    if (window.api) {
      const transfers = await window.api.getTransfers()
      set({ transfers: transfers || [] })
    } else {
      const transfers = await callAPI('/transfers')
      set({ transfers: transfers || [] })
    }
  },

  createTransfer: async (data: any) => {
    if (window.api) await window.api.createTransfer(data)
    else await callAPI('/transfers', 'POST', data)
    await get().refreshData()
  },

  respondTransfer: async (id: number, status: 'Accepted' | 'Declined', note?: string) => {
    if (window.api) await window.api.respondTransfer(id, status, note)
    else await callAPI(`/transfers/${id}/respond`, 'PUT', { status, note })
    await get().refreshData()
  },

  fetchAllocations: async () => {
    if (window.api) {
      const allocations = await window.api.getAllocations()
      set({ allocations: allocations || [] })
    } else {
      const allocations = await callAPI('/allocations')
      set({ allocations: allocations || [] })
    }
  },

  createAllocation: async (data: any) => {
    if (window.api) await window.api.createAllocation(data)
    else await callAPI('/allocations', 'POST', data)
    await get().fetchAllocations()
  },

  changePassword: async (userId: number, newPass: string) => {
    if (window.api) {
      const res = await window.api.changePassword(userId, newPass)
      return res?.success ?? false
    } else {
      const res = await callAPI('/auth/change-password', 'POST', { userId, newPassword: newPass })
      return res?.success ?? false
    }
  },

  fetchAssetHistory: async (assetId?: number) => {
    try {
      if (window.api?.getAssetHistory) {
        const history = await window.api.getAssetHistory(assetId)
        set({ assetHistory: history || [] })
      } else {
        const history = await callAPI(`/asset-history${assetId ? '?assetId=' + assetId : ''}`)
        set({ assetHistory: history || [] })
      }
    } catch (e) {
      console.error('Failed to fetch asset history:', e)
    }
  },

  recordAssetHistory: async (entry: any) => {
    try {
      if (window.api?.recordAssetHistory) {
        await window.api.recordAssetHistory(entry)
      } else {
        await callAPI('/asset-history', 'POST', entry)
      }
      await get().fetchAssetHistory()
    } catch (e) {
      console.error('Failed to record asset history:', e)
    }
  },

  fetchDepartments: async () => {
    try {
      let depts: Department[] = []
      if (window.api?.getDepartments) {
        depts = await window.api.getDepartments()
      } else {
        depts = await callAPI('/departments')
      }
      set({ departments: depts || [] })
    } catch (e) {
      console.error('Failed to fetch departments:', e)
    }
  },

  addDepartment: async (dept: Partial<Department>) => {
    try {
      let res: any
      if (window.api?.createDepartment) {
        res = await window.api.createDepartment(dept)
      } else {
        res = await callAPI('/departments', 'POST', dept)
      }
      await get().fetchDepartments()
      return res || { success: true }
    } catch (e: any) {
      console.error('Failed to add department:', e)
      return { success: false, error: e.message || 'Failed to add department' }
    }
  },

  updateDepartment: async (id: number, dept: Partial<Department>) => {
    try {
      let res: any
      if (window.api?.updateDepartment) {
        res = await window.api.updateDepartment(id, dept)
      } else {
        res = await callAPI(`/departments/${id}`, 'PUT', dept)
      }
      await get().fetchDepartments()
      return res || { success: true }
    } catch (e: any) {
      console.error('Failed to update department:', e)
      return { success: false, error: e.message || 'Failed to update department' }
    }
  },

  deleteDepartment: async (id: number) => {
    try {
      let res: any
      if (window.api?.deleteDepartment) {
        res = await window.api.deleteDepartment(id)
      } else {
        res = await callAPI(`/departments/${id}`, 'DELETE')
      }
      await get().fetchDepartments()
      return res || { success: true }
    } catch (e: any) {
      console.error('Failed to delete department:', e)
      return { success: false, error: e.message || 'Failed to delete department' }
    }
  },

  clearSystemData: async (options?: { keepAdminOnly?: boolean }) => {
    try {
      let res: any
      if (window.api?.clearSystemData) {
        res = await window.api.clearSystemData(options)
      } else {
        res = await callAPI('/system/clear-data', 'POST', options || { keepAdminOnly: true })
      }
      await get().refreshData()
      return res || { success: true }
    } catch (e: any) {
      console.error('Failed to clear system data:', e)
      return { success: false, error: e.message || 'Failed to clear system data' }
    }
  },

  fetchPendingRequests: async (status?: string) => {
    try {
      let data: any
      if (window.api?.getPendingRequests) {
        data = await window.api.getPendingRequests(status)
      } else {
        data = await callAPI(`/pending${status ? '?status=' + status : ''}`)
      }
      set({ pendingRequests: data || [] })
      return data || []
    } catch (e) {
      console.error('Failed to fetch pending requests:', e)
      return []
    }
  },

  createPendingRequest: async (req: any) => {
    try {
      let res: any
      if (window.api?.createPendingRequest) {
        res = await window.api.createPendingRequest(req)
      } else {
        res = await callAPI('/pending', 'POST', req)
      }
      await get().fetchPendingRequests()
      return res || { success: true }
    } catch (e: any) {
      console.error('Failed to create pending request:', e)
      return { success: false, error: e.message || 'Failed to submit request' }
    }
  },

  reviewPendingRequest: async (id: number, action: string, reviewedBy: string, reviewNote?: string) => {
    try {
      let res: any
      if (window.api?.reviewPendingRequest) {
        res = await window.api.reviewPendingRequest(id, action, reviewedBy, reviewNote)
      } else {
        res = await callAPI(`/pending/${id}/review`, 'PUT', { action, reviewedBy, reviewNote })
      }
      await get().fetchPendingRequests()
      return res || { success: true }
    } catch (e: any) {
      console.error('Failed to review pending request:', e)
      return { success: false, error: e.message || 'Failed to review request' }
    }
  },

  refreshData: async () => {
    await Promise.all([
      get().fetchSystemSettings(),
      get().fetchAssets(),
      get().fetchDepartments(),
      get().fetchTransactions(),
      get().fetchStats(),
      get().fetchVouchersM19(),
      get().fetchVouchersM20(),
      get().fetchVouchersM22(),
      get().fetchMaintenanceLogs(),
      get().fetchInventoryCounts(),
      get().fetchDisposals(),
      get().fetchUsers(),
      get().fetchHierarchies(),
      get().fetchTransfers(),
      get().fetchAllocations(),
      get().fetchAssetHistory(),
      get().fetchPendingRequests()
    ])
  }
}))
