import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import OwnedAssets from './components/OwnedAssets'
import RegisteredAssets from './components/RegisteredAssets'
import DistributedAssets from './components/DistributedAssets'
import DisposedAssets from './components/DisposedAssets'
import TransferAssets from './components/TransferAssets'
import MaintainedAssets from './components/MaintainedAssets'
import AssetHistory from './components/AssetHistory'
import UserManagement from './components/UserManagement'
import Login from './components/Login'
import Settings from './components/Settings'
import Approvals from './components/Approvals'
import Reports from './components/Reports'
import ReportM19 from './components/ReportM19'
import ReportM22 from './components/ReportM22'
import ReportBalance from './components/ReportBalance'
import VouchersM19 from './components/VouchersM19'
import VouchersM20 from './components/VouchersM20'
import VouchersM22 from './components/VouchersM22'
import InventoryCount from './components/InventoryCount'
import MyAssets from './components/MyAssets'
import HierarchyManager from './components/HierarchyManager'
import EmployeeClearance from './components/EmployeeClearance'
import { VerifyDocumentModal } from './components/VerifyDocumentModal'
import { useStore } from './store/useStore'
import { canAccessTab, getDefaultTabForRole } from './lib/permissions'
import { ShieldAlert, Menu, User as UserIcon, Globe, LogOut, Settings as SettingsIcon, ShieldCheck } from 'lucide-react'

function App(): JSX.Element {
  const {
    activeTab,
    setActiveTab,
    refreshData,
    isDarkMode,
    toggleDarkMode,
    isAuthenticated,
    user,
    language,
    setLanguage,
    logout,
    orgName,
    organizationMode,
    singleOrgType
  } = useStore()

  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      refreshData()
      // Enforce default landing page and tab access based on role
      if (user && !canAccessTab(user.role, activeTab, organizationMode)) {
        setActiveTab(getDefaultTabForRole(user.role))
      }
    }
  }, [isAuthenticated, user, activeTab, organizationMode])

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [isDarkMode])

  if (!isAuthenticated) {
    return <Login />
  }

  // Guard check: verify if current role is authorized for the current activeTab
  const isAuthorized = canAccessTab(user?.role, activeTab, organizationMode)

  const renderContent = () => {
    if (!isAuthorized) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in">
          <div className="p-4 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 mb-4">
            <ShieldAlert size={48} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            {language === 'AM' ? 'የተከለከለ ፈቃድ' : 'Access Restricted'}
          </h2>
          <p className="text-sm text-slate-500 max-w-md mt-2 mb-6">
            {language === 'AM'
              ? `የእርስዎ ሚና (${user?.role || 'Guest'}) ይህንን ገጽ ለማየት የተፈቀደለት አይደለም።`
              : `Your account role (${user?.role || 'Guest'}) does not have permission to access this screen.`}
          </p>
          <button
            onClick={() => setActiveTab(getDefaultTabForRole(user?.role))}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
          >
            {language === 'AM' ? 'ወደ መነሻ ገጽ ተመለስ' : 'Return to My Workspace'}
          </button>
        </div>
      )
    }

    switch (activeTab) {
      // Primary Asset Lifecycle Navigation
      case 'dashboard':          return <Dashboard />
      case 'owned-assets':       return <OwnedAssets />
      case 'registered-assets':  return <RegisteredAssets />
      case 'inventory':          return <RegisteredAssets />
      case 'distributed-assets': return <DistributedAssets />
      case 'disposed-assets':    return <DisposedAssets />
      case 'disposal':           return <DisposedAssets />
      case 'transfer-assets':    return <TransferAssets />
      case 'maintained-assets':  return <MaintainedAssets />
      case 'maintenance':        return <MaintainedAssets />
      case 'asset-history':      return <AssetHistory />
      case 'user-management':    return <UserManagement />

      // Reports
      case 'reports':            return <Reports />
      case 'reports-m19':        return <ReportM19 />
      case 'reports-m22':        return <ReportM22 />
      case 'reports-balance':    return <ReportBalance />

      // Institutional Operations & Forms
      case 'vouchers-m19':       return <VouchersM19 />
      case 'vouchers-m20':       return <VouchersM20 />
      case 'vouchers-m22':       return <VouchersM22 />
      case 'inventory-count':    return <InventoryCount />
      case 'employee-clearance': return <EmployeeClearance />
      case 'approvals':          return <Approvals />
      case 'my-assets':          return <MyAssets />
      case 'hierarchies':        return <HierarchyManager />
      case 'settings':           return <Settings />

      default:                   return <Dashboard />
    }
  }

  return (
    <div className="flex h-screen bg-[#edf2f7] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
      {/* Sidebar with toggle state */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0 -translate-x-full md:w-0'} transition-all duration-300 ease-in-out shrink-0 overflow-hidden z-30`}>
        <Sidebar />
      </div>

      {/* Main viewport with official white top navbar */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Official AMIS White Top Navbar */}
        <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-5 flex items-center justify-between shadow-xs shrink-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Toggle Menu"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
              <span className="font-black text-slate-900 dark:text-white tracking-wider">AMIS</span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-xs sm:max-w-md">
                {orgName || 'የንብረት አስተዳደር መቆጣጠሪያ ስርዓት'}
              </span>
            </div>

            {/* Operation Mode Pill Badge (Feature Toggle Indicator) — Admin only link */}
            {user?.role === 'Admin' ? (
            <button
              onClick={() => setActiveTab('settings')}
              title={language === 'AM' ? 'የሲስተሙን ሁነታ በቅንብሮች ውስጥ ለመቀየር ይጫኑ' : 'Click to toggle system operation mode in Settings'}
              className={`hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black border transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 ${
                organizationMode === 'single'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full animate-pulse bg-current" />
              <span>
                {organizationMode === 'single'
                  ? (language === 'AM' ? `ነጠላ ተቋም፦ ${singleOrgType || 'ጤና ጣቢያ'}` : `Single Org: ${singleOrgType || 'Facility'}`)
                  : (language === 'AM' ? 'ተዋረድ ያለው ሁነታ (ወረዳ / ሴክተሮች)' : 'Hierarchical: Woreda / Multi-Sector')}
              </span>
            </button>
            ) : (
            <div
              className={`hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black border ${
                organizationMode === 'single'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full animate-pulse bg-current" />
              <span>
                {organizationMode === 'single'
                  ? (language === 'AM' ? `ነጠላ ተቋም፦ ${singleOrgType || 'ጤና ጣቢያ'}` : `Single Org: ${singleOrgType || 'Facility'}`)
                  : (language === 'AM' ? 'ተዋረድ ያለው ሁነታ (ወረዳ / ሴክተሮች)' : 'Hierarchical: Woreda / Multi-Sector')}
              </span>
            </div>
            )}
          </div>

          {/* Right User Silhouette & Actions */}
          <div className="relative flex items-center gap-3">
            {/* Quick Document & Seal Verification Button */}
            <button
              onClick={() => setIsVerifyModalOpen(true)}
              title={language === 'AM' ? 'የማንኛውንም ቅርንጫፍ ሰነድ እና ማህተም እውነተኛነት ማረጋገጫ' : 'Verify branch seal and document authenticity'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-black shadow-xs hover:bg-blue-100 transition-all cursor-pointer active:scale-95"
            >
              <ShieldCheck size={16} className="text-blue-600" />
              <span className="hidden sm:inline">{language === 'AM' ? 'ማህተም አረጋግጥ' : 'Verify Seal'}</span>
            </button>

            {/* Language Pill */}
            <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px] font-bold">
              <button
                onClick={() => setLanguage('AM')}
                className={`px-2.5 py-1 rounded-md transition-all ${language === 'AM' ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs' : 'text-slate-500'}`}
              >
                አማ
              </button>
              <button
                onClick={() => setLanguage('EN')}
                className={`px-2.5 py-1 rounded-md transition-all ${language === 'EN' ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs' : 'text-slate-500'}`}
              >
                EN
              </button>
            </div>

            {/* User Avatar Silhouette button matching official screenshot */}
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all cursor-pointer relative"
              title={user?.name || 'User Profile'}
            >
              <UserIcon size={19} />
            </button>

            {/* Profile Dropdown Menu */}
            {isUserMenuOpen && (
              <div
                className="absolute right-0 top-12 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-4 space-y-3 z-50 animate-in fade-in zoom-in-95"
                onMouseLeave={() => setIsUserMenuOpen(false)}
              >
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <p className="font-black text-sm text-slate-900 dark:text-white truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{user?.phone || user?.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-block px-2 py-0.5 text-[10px] font-black rounded-md bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 uppercase">
                      {user?.role || 'Guest'}
                    </span>
                    <span className={`inline-block px-2 py-0.5 text-[9px] font-black rounded-md uppercase ${
                      organizationMode === 'single'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                    }`}>
                      {organizationMode === 'single' ? (language === 'AM' ? 'ነጠላ ተቋም' : 'Single Org') : (language === 'AM' ? 'ተዋረድ ሁነታ' : 'Hierarchy')}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-xs font-bold text-slate-600 dark:text-slate-300">
                  {user?.role === 'Admin' && (
                    <button
                      onClick={() => { setActiveTab('settings'); setIsUserMenuOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <SettingsIcon size={16} />
                      <span>{language === 'AM' ? 'የሲስተም ቅንብሮች' : 'System Settings'}</span>
                    </button>
                  )}
                  <button
                    onClick={() => { toggleDarkMode(); setIsUserMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Globe size={16} />
                    <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>
                  <button
                    onClick={() => { logout(); setIsUserMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  >
                    <LogOut size={16} />
                    <span>{language === 'AM' ? 'ውጣ (Logout)' : 'Logout'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Official Central Document & Seal Verification Portal */}
      <VerifyDocumentModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
      />
    </div>
  )
}

export default App
