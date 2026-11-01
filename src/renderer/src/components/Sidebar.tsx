import { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  GitFork,
  Search,
  Boxes,
  Layers,
  Briefcase,
  Send,
  Wrench,
  Trash2,
  History,
  FileText,
  BarChart,
  Settings2,
  LogOut,
  ChevronDown,
  ChevronRight,
  PackageCheck,
  CheckCircle2,
  ClipboardCheck,
  ShieldAlert
} from 'lucide-react'
import { useStore, TRANSLATIONS } from '../store/useStore'
import { canAccessTab, getRolePermissions } from '../lib/permissions'
import asmLogo from '../assets/asm-logo.jpg'

const Sidebar = () => {
  const { activeTab, setActiveTab, language, logout, user, organizationMode, singleOrgType } = useStore()
  const t = TRANSLATIONS[language]
  const [searchQuery, setSearchQuery] = useState('')
  const [isAssetsOpen, setIsAssetsOpen] = useState(true)

  const userRole = user?.role || 'Guest'
  const perms = getRolePermissions(userRole)

  // Role-appropriate Primary Navigation Items
  const allPrimaryItems = [
    {
      id: 'dashboard',
      label: language === 'AM' ? 'ዳሽቦርድ' : 'Dashboard',
      icon: LayoutDashboard,
      roles: ['Admin', 'Manager', 'Auditor', 'Viewer']
    },
    {
      id: 'user-management',
      label: language === 'AM'
        ? (userRole === 'Manager' ? 'የሰራተኞች ማውጫ' : 'ተጠቃሚዎች')
        : (userRole === 'Manager' ? 'Staff Directory' : 'User Management'),
      icon: Users,
      roles: ['Admin', 'Manager']
    },
    ...(organizationMode !== 'single' ? [{
      id: 'hierarchies',
      label: language === 'AM' ? 'ትስስር ለመፍጠር' : 'Create Hierarchy',
      icon: GitFork,
      roles: ['Admin']
    }] : []),
    {
      id: 'my-assets',
      label: language === 'AM' ? 'የእኔ ንብረቶች' : 'My Assets',
      icon: PackageCheck,
      roles: ['Staff', 'Guest', 'Admin', 'Manager']
    },
    {
      id: 'approvals',
      label: language === 'AM' ? 'ማረጋገጫና ፍቃድ' : 'Approvals',
      icon: CheckCircle2,
      roles: ['Admin', 'Manager', 'Auditor']
    },
    {
      id: 'inventory-count',
      label: language === 'AM' ? 'የንብረት ቆጠራ' : 'Inventory Count',
      icon: ClipboardCheck,
      roles: ['Admin', 'Manager', 'Auditor']
    },
    {
      id: 'reports',
      label: language === 'AM' ? 'ሪፖርቶች' : 'Reports & Analytics',
      icon: BarChart,
      roles: ['Auditor', 'Viewer']
    }
  ]

  // Role-appropriate Asset Management Items
  const allAssetItems = [
    {
      id: 'registered-assets',
      label: language === 'AM' ? 'የተመዘገቡ ንብረቶች' : 'Registered Assets',
      icon: Boxes,
      roles: ['Admin', 'Manager', 'Auditor', 'Viewer']
    },
    {
      id: 'distributed-assets',
      label: language === 'AM' ? 'የተከፋፈሉ ንብረቶች' : 'Distributed Assets',
      icon: Layers,
      roles: ['Admin', 'Manager', 'Auditor', 'Viewer']
    },
    {
      id: 'owned-assets',
      label: language === 'AM' ? 'የተያዙ ንብረቶች' : 'Owned Assets',
      icon: Briefcase,
      roles: ['Admin', 'Manager', 'Auditor', 'Viewer']
    },
    {
      id: 'transfer-assets',
      label: organizationMode === 'single'
        ? (language === 'AM' ? 'የውስጥ ክፍል ዝውውር' : 'Internal Transfer')
        : (language === 'AM' ? 'የንብረት ዝውውር' : 'Transfer Assets'),
      icon: Send,
      roles: ['Admin', 'Manager', 'Staff', 'Guest', 'Auditor']
    },
    {
      id: 'vouchers-m20',
      label: language === 'AM' ? 'የዕቃ መጠየቂያ (M20)' : 'Requisitions (M20)',
      icon: FileText,
      roles: ['Staff', 'Guest']
    },
    {
      id: 'maintained-assets',
      label: language === 'AM' ? 'በጥገና ላይ ያሉ' : 'Maintained Assets',
      icon: Wrench,
      roles: ['Admin', 'Manager', 'Staff', 'Auditor']
    },
    {
      id: 'disposed-assets',
      label: language === 'AM' ? 'የተወገዱ ንብረቶች' : 'Disposed Assets',
      icon: Trash2,
      roles: ['Admin', 'Manager', 'Auditor']
    },
    {
      id: 'asset-history',
      label: language === 'AM' ? 'የንብረት ታሪክ' : 'Asset Audit History',
      icon: History,
      roles: ['Admin', 'Manager', 'Auditor', 'Viewer']
    },
    {
      id: 'vouchers-m19',
      label: language === 'AM' ? 'የመንግስት ቫውቸሮች' : 'Gov Vouchers',
      icon: FileText,
      roles: ['Admin', 'Manager', 'Auditor']
    },
    {
      id: 'reports',
      label: language === 'AM' ? 'ሪፖርቶች' : 'Reports',
      icon: BarChart,
      roles: ['Admin', 'Manager']
    }
  ]

  // Filter based on user's specific role and search input
  const q = searchQuery.toLowerCase().trim()

  const filteredPrimary = allPrimaryItems.filter(
    (item) => item.roles.includes(userRole) && (!q || item.label.toLowerCase().includes(q))
  )

  const filteredAssets = allAssetItems.filter(
    (item) => item.roles.includes(userRole) && (!q || item.label.toLowerCase().includes(q))
  )

  return (
    <aside className="w-64 bg-[#0f4b66] text-white flex flex-col h-full shrink-0 shadow-2xl select-none z-30 transition-all duration-300">
      {/* ── AMIS Brand Header ─────────────────────────────────── */}
      <div className="pt-5 pb-2 text-center">
        <h1 className="text-xl font-black tracking-[0.25em] text-white font-sans drop-shadow-sm">
          AMIS
        </h1>
        <p className="text-[10px] uppercase tracking-wider text-cyan-300/80 font-bold">
          {userRole} Portal
        </p>
      </div>

      {/* ── ASM Logo Emblem ───────────────────────────────── */}
      <div className="px-6 py-2 flex justify-center">
        <div className="w-24 h-24 rounded-full bg-white p-1.5 shadow-xl flex items-center justify-center border-2 border-teal-300/40 hover:scale-105 transition-transform duration-200">
          <img
            src={asmLogo}
            alt="Asset Management System"
            className="w-full h-full object-contain rounded-full"
          />
        </div>
      </div>

      {/* ── Feature Toggle Mode Indicator Pill ─────────────────── */}
      <div className="px-4 py-1 flex justify-center">
        {userRole === 'Admin' ? (
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full py-1.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs ${
              organizationMode === 'single'
                ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/30 hover:bg-emerald-500/35'
                : 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/30 hover:bg-cyan-500/30'
            }`}
            title={language === 'AM' ? 'የሲስተሙን ሁነታ ለመቀየር ይጫኑ' : 'Click to change mode in Settings'}
          >
            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
            <span className="truncate">
              {organizationMode === 'single'
                ? (language === 'AM' ? `ነጠላ ተቋም፦ ${singleOrgType}` : `Single Org: ${singleOrgType}`)
                : (language === 'AM' ? 'ተዋረድ ሁነታ (ወረዳ)' : 'Hierarchy Mode')}
            </span>
          </button>
        ) : (
          <div
            className={`w-full py-1.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 ${
              organizationMode === 'single'
                ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/30'
                : 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
            <span className="truncate">
              {organizationMode === 'single'
                ? (language === 'AM' ? `ነጠላ ተቋም፦ ${singleOrgType}` : `Single Org: ${singleOrgType}`)
                : (language === 'AM' ? 'ተዋረድ ሁነታ (ወረዳ)' : 'Hierarchy Mode')}
            </span>
          </div>
        )}
      </div>

      {/* ── Search Input ──────────────────────────────────────── */}
      <div className="px-4 py-3">
        <div className="relative">
          <input
            type="text"
            placeholder={language === 'AM' ? 'ፈልግ...' : 'Search menu...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0b3c53] text-teal-100 placeholder-teal-300/50 text-xs rounded-lg pl-3 pr-8 py-2 border border-teal-700/60 focus:outline-none focus:border-cyan-400 transition-colors"
          />
          <Search size={14} className="absolute right-2.5 top-2.5 text-teal-300/70 pointer-events-none" />
        </div>
      </div>

      {/* ── Main Navigation List ──────────────────────────────── */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto custom-scrollbar">
        {/* Core AMIS Navigation for this role */}
        {filteredPrimary.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-150 ${
                isActive
                  ? 'bg-[#186487] text-white shadow-md shadow-black/20 translate-x-1'
                  : 'text-teal-100/90 hover:bg-[#135878] hover:text-white'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-cyan-300' : 'text-teal-300/80'} />
              <span className="truncate">{item.label}</span>
            </button>
          )
        })}

        {/* ── Asset Management Module Accordion (if role has asset items) ── */}
        {filteredAssets.length > 0 && (
          <div className="pt-3">
            <button
              onClick={() => setIsAssetsOpen(!isAssetsOpen)}
              className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-teal-300/80 hover:text-white transition-colors"
            >
              <span>{language === 'AM' ? 'የንብረት አስተዳደር' : 'Asset Management'}</span>
              {isAssetsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>

            {isAssetsOpen && (
              <div className="mt-1 space-y-0.5 pl-2 border-l-2 border-teal-500/30 ml-2">
                {filteredAssets.map((item) => {
                  const Icon = item.icon
                  const isActive =
                    activeTab === item.id ||
                    (item.id === 'vouchers-m19' && activeTab.startsWith('vouchers')) ||
                    (item.id === 'reports' && activeTab.startsWith('reports'))
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-[11px] font-medium transition-all ${
                        isActive
                          ? 'bg-[#186487] text-cyan-200 font-bold shadow-sm'
                          : 'text-teal-100/75 hover:bg-[#135878]/60 hover:text-white'
                      }`}
                    >
                      <Icon size={14} className={isActive ? 'text-cyan-300' : 'text-teal-400/60'} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* ── Footer / User Profile & Settings ─────────────────── */}
      <div className="p-3 border-t border-teal-800/40 bg-[#0c3e55]/60 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2 overflow-hidden">
          <div className="w-7 h-7 rounded-full bg-cyan-700/80 flex items-center justify-center text-white font-bold text-xs shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="truncate">
            <p className="font-bold text-white text-[11px] truncate leading-tight">{user?.name || 'User'}</p>
            <p className="text-[10px] text-teal-300/80 font-semibold truncate">{userRole}</p>
          </div>
        </div>
        <div className="flex items-center space-x-1 shrink-0">
          {/* Settings button strictly for Admin */}
          {perms.canResetDatabase && (
            <button
              onClick={() => setActiveTab('settings')}
              className="p-1.5 rounded hover:bg-[#135878] text-teal-300/80 hover:text-white transition-colors"
              title={t.settings}
            >
              <Settings2 size={15} />
            </button>
          )}
          <button
            onClick={logout}
            className="p-1.5 rounded hover:bg-rose-900/60 text-teal-300/80 hover:text-rose-300 transition-colors"
            title={t.logout}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
