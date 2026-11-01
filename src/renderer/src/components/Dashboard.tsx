import { useMemo } from 'react'
import {
  Package,
  TrendingUp,
  Activity,
  ArrowRight,
  Send,
  Wrench,
  Trash2,
  Users,
  Building2,
  PlusCircle,
  FileText,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Clock,
  Layers,
  ArrowUpRight,
  Boxes,
  GitFork,
  User as UserIcon
} from 'lucide-react'
import { useStore, TRANSLATIONS } from '../store/useStore'
import { calculateBookValue } from '../lib/finance'
import { getRolePermissions } from '../lib/permissions'

export const Dashboard = () => {
  const { assets, stats, assetHistory, language, orgName, setActiveTab, user, users, hierarchies } = useStore()
  const perms = getRolePermissions(user?.role)
  const t = TRANSLATIONS[language]

  // Real-time institutional user metrics directly from database
  const totalUsersCount = users?.length || 0
  const activeStaffCount = (users || []).filter(u => u.role !== 'Admin').length
  const assetHandlersCount = (users || []).filter(u => u.role === 'Manager' || u.role === 'Auditor').length
  const systemAdminsCount = (users || []).filter(u => u.role === 'Admin').length
  const linkedHierarchyCount = hierarchies?.length || 0

  const activeStaffPct = totalUsersCount > 0 ? Math.round((activeStaffCount / totalUsersCount) * 100) : 0
  const assetHandlersPct = totalUsersCount > 0 ? Math.round((assetHandlersCount / totalUsersCount) * 100) : 0
  const systemAdminsPct = totalUsersCount > 0 ? Math.round((systemAdminsCount / totalUsersCount) * 100) : 0
  const linkedHierarchyPct = totalUsersCount > 0 ? Math.min(100, Math.round((linkedHierarchyCount / totalUsersCount) * 100)) : 0

  const today = new Date().toLocaleDateString(language === 'AM' ? 'am-ET' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  // Format currency
  const formatCurrency = (val: number) => {
    return 'ETB ' + new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Math.abs(val || 0))
  }

  // Real-time computed metrics (with safe fallbacks to SQLite stats or live assets store)
  const ownedAssetsCount = stats.ownedAssets?.count ?? assets.filter(a => a.lifecycleStatus !== 'Disposed').length
  const ownedAssetsValue = stats.ownedAssets?.value ?? assets.filter(a => a.lifecycleStatus !== 'Disposed').reduce((acc, a) => acc + (a.unitCost * a.quantity), 0)
  const totalBookVal = assets.reduce((acc, asset) => acc + calculateBookValue(asset), 0)

  // Real-time Status Metrics from synchronized lifecycle breakdown
  const assignedCount = stats.lifecycleBreakdown?.assigned ?? stats.assignedAssets?.count ?? 0
  const assignedValue = stats.assignedAssets?.value ?? 0
  const assignedStaffCount = stats.assignedAssets?.staffCount ?? 0

  const maintainedCount = stats.lifecycleBreakdown?.maintained ?? stats.maintainedAssets?.count ?? 0
  const maintainedCost = stats.maintainedAssets?.totalCost ?? 0
  const maintainedTickets = stats.maintainedAssets?.totalTickets ?? 0

  const distributedCount = stats.lifecycleBreakdown?.distributed ?? stats.distributedAssets?.count ?? 0
  const distributedValue = stats.distributedAssets?.value ?? 0
  const distributedDeptCount = stats.distributedAssets?.deptCount ?? 0

  const disposedCount = stats.lifecycleBreakdown?.disposed ?? stats.disposedAssets?.count ?? 0
  const disposedRecovered = stats.disposedAssets?.recoveredAmount ?? 0

  // Lifecycle breakdown
  const registeredCount = stats.lifecycleBreakdown?.registered ?? 0

  // Department breakdown
  const departmentData = useMemo(() => {
    if (stats.departmentBreakdown && stats.departmentBreakdown.length > 0) {
      return stats.departmentBreakdown
    }
    const map = new Map<string, { count: number; val: number }>()
    assets.forEach(a => {
      const dept = a.department || 'Central Store'
      const cur = map.get(dept) || { count: 0, val: 0 }
      map.set(dept, {
        count: cur.count + a.quantity,
        val: cur.val + (a.unitCost * a.quantity)
      })
    })
    return Array.from(map.entries()).map(([dept, data]) => ({
      dept,
      count: data.count,
      val: data.val
    })).sort((a, b) => b.count - a.count).slice(0, 6)
  }, [stats.departmentBreakdown, assets])

  // Category colors
  const categoryColors = [
    'bg-blue-500', 'bg-emerald-500', 'bg-indigo-500', 'bg-amber-500',
    'bg-rose-500', 'bg-purple-500', 'bg-cyan-500', 'bg-teal-500'
  ]

  // Recent lifecycle activity
  const recentActivity = (stats.recentHistory && stats.recentHistory.length > 0)
    ? stats.recentHistory
    : assetHistory.slice(0, 6)

  return (
    <div className="space-y-8 animate-in fade-in duration-400 pb-12">
      {/* Top Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {t.dashboard}
            </h2>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              Live Real-Time
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mt-1">
            {orgName} &bull; {today}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-bold">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-700 dark:text-slate-300 font-mono">
              {language === 'AM' ? 'የውሂብ ቋት ንቁ' : 'SQLite DB Active'}
            </span>
          </div>
          {user && (
            <div className="bg-slate-900 text-white dark:bg-slate-800 px-3 py-2 rounded-2xl text-xs font-black flex items-center gap-2">
              <Users size={14} className="text-indigo-400" />
              <span>{user.name}</span>
              <span className="text-[10px] bg-indigo-500/30 px-1.5 py-0.5 rounded text-indigo-300">{user.role}</span>
            </div>
          )}
        </div>
      </header>

      {/* Official AAPAA AMIS Admin Control Panel matching Government System Screenshot */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm space-y-5 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">
              AMIS {orgName || 'አቃቂ ቃሊቲ ክፍለ ከተማ ዋና ስራ አስኪያጅ ጽ/ቤት'}
            </h3>
          </div>
          <span className="text-[11px] font-bold text-slate-400">
            {language === 'AM' ? 'የተጠቃሚዎችና የስራ ትስስር ማጠቃለያ' : 'User Allocation & Structure Linkages'}
          </span>
        </div>

        {/* Top 4 Characteristic AAPAA AMIS Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: 613 አጠቃላይ ተጠቃሚዎች (Mint / Emerald Green) */}
          <div
            onClick={() => setActiveTab('user-management')}
            className="cursor-pointer bg-gradient-to-br from-[#00c980] to-[#10b981] hover:brightness-105 text-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group select-none"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-3xl font-black tracking-tight">{totalUsersCount}</div>
                <p className="text-xs font-bold text-emerald-50 mt-1">
                  {language === 'AM' ? 'አጠቃላይ ተጠቃሚዎች' : 'Total System Users'}
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-2xl text-white group-hover:scale-110 transition-transform">
                <Users size={24} />
              </div>
            </div>
            <div className="mt-5">
              <div className="w-full bg-white/30 h-2 rounded-full overflow-hidden">
                <div className="bg-white h-full rounded-full" style={{ width: '100%' }} />
              </div>
              <p className="text-[10px] font-bold text-emerald-100 mt-1.5 flex items-center justify-between">
                <span>{language === 'AM' ? 'ተጠናቋል' : 'Progress'}</span>
                <span>100%</span>
              </p>
            </div>
          </div>

          {/* Card 2: 486 ተግባር ተጠቃሚዎች (Vivid Sky Blue) */}
          <div
            onClick={() => setActiveTab('user-management')}
            className="cursor-pointer bg-gradient-to-br from-[#007bff] to-[#008cff] hover:brightness-105 text-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group select-none"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-3xl font-black tracking-tight">{activeStaffCount}</div>
                <p className="text-xs font-bold text-blue-50 mt-1">
                  {language === 'AM' ? 'ተግባር ተጠቃሚዎች' : 'Active Duty Users'}
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-2xl text-white group-hover:scale-110 transition-transform">
                <UserIcon size={24} />
              </div>
            </div>
            <div className="mt-5">
              <div className="w-full bg-white/30 h-2 rounded-full overflow-hidden">
                <div className="bg-white h-full rounded-full" style={{ width: `${activeStaffPct}%` }} />
              </div>
              <p className="text-[10px] font-bold text-blue-100 mt-1.5 flex items-center justify-between">
                <span>{language === 'AM' ? 'ድርሻ' : 'Ratio'}</span>
                <span>{activeStaffPct}%</span>
              </p>
            </div>
          </div>

          {/* Card 3: Asset Managers */}
          <div
            onClick={() => setActiveTab('user-management')}
            className="cursor-pointer bg-gradient-to-br from-[#6c757d] to-[#7f8c8d] hover:brightness-105 text-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group select-none"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-3xl font-black tracking-tight">{assetHandlersCount}</div>
                <p className="text-xs font-bold text-slate-100 mt-1">
                  {language === 'AM' ? 'የንብረት አስተዳዳሪዎች' : 'Asset Managers'}
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-2xl text-white group-hover:scale-110 transition-transform">
                <Building2 size={24} />
              </div>
            </div>
            <div className="mt-5">
              <div className="w-full bg-white/30 h-2 rounded-full overflow-hidden">
                <div className="bg-white h-full rounded-full" style={{ width: `${assetHandlersPct}%` }} />
              </div>
              <p className="text-[10px] font-bold text-slate-200 mt-1.5 flex items-center justify-between">
                <span>{language === 'AM' ? 'ድርሻ' : 'Ratio'}</span>
                <span>{assetHandlersPct}%</span>
              </p>
            </div>
          </div>

          {/* Card 4: System Administrators */}
          <div
            onClick={() => setActiveTab('user-management')}
            className="cursor-pointer bg-gradient-to-br from-[#1a365d] to-[#12233f] hover:brightness-105 text-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group select-none"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-3xl font-black tracking-tight">{systemAdminsCount}</div>
                <p className="text-xs font-bold text-blue-100 mt-1">
                  {language === 'AM' ? 'የሲስተም አድሚኖች' : 'System Administrators'}
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-2xl text-white group-hover:scale-110 transition-transform">
                <ShieldCheck size={24} />
              </div>
            </div>
            <div className="mt-5">
              <div className="w-full bg-white/30 h-2 rounded-full overflow-hidden">
                <div className="bg-white h-full rounded-full" style={{ width: `${systemAdminsPct}%` }} />
              </div>
              <p className="text-[10px] font-bold text-blue-200 mt-1.5 flex items-center justify-between">
                <span>{language === 'AM' ? 'ድርሻ' : 'Ratio'}</span>
                <span>{systemAdminsPct}%</span>
              </p>
            </div>
          </div>
        </div>

        {/* Card 5: Linked Hierarchy */}
        <div
          onClick={() => setActiveTab('hierarchies')}
          className="cursor-pointer bg-gradient-to-r from-[#28a745] to-[#1e8735] hover:brightness-105 text-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group select-none"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-black tracking-tight">{linkedHierarchyCount}</div>
              <p className="text-xs font-bold text-emerald-100 mt-1">
                {language === 'AM' ? 'የተፈጠረ የትስስር ተጠቃሚዎች' : 'Linked Organizational Units / Hierarchies'}
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-2xl text-white group-hover:scale-110 transition-transform">
              <GitFork size={28} />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-white/30 h-2.5 rounded-full overflow-hidden">
              <div className="bg-white h-full rounded-full" style={{ width: `${linkedHierarchyPct}%` }} />
            </div>
            <p className="text-[10px] font-bold text-emerald-100 mt-1.5 flex items-center justify-between">
              <span>{language === 'AM' ? 'የትስስር መጠን' : 'Coverage'}</span>
              <span>{linkedHierarchyPct}%</span>
            </p>
          </div>
        </div>
      </section>

      {/* Primary Real-time Analytics Panel: 4 Key Status Metrics (Assigned, Maintained, Distributed, Disposed) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              {language === 'AM' ? 'የንብረት ወቅታዊ ሁኔታ አመልካቾች' : 'Real-Time Asset Status Metrics'}
            </h3>
          </div>
          <span className="text-[11px] font-bold text-slate-400">
            {language === 'AM' ? 'በህይወት ዑደት ለውጥ የሚታደስ' : 'Dynamically synchronized with asset lifecycle'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Assigned Assets */}
          <div
            onClick={() => setActiveTab('registered-assets')}
            className="group cursor-pointer bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-500 group-hover:h-2 transition-all" />
            <div className="flex items-start justify-between">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-2xl">
                <Users size={22} />
              </div>
              <ArrowUpRight size={16} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
            <div className="mt-4">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                {language === 'AM' ? 'የተመደቡ ንብረቶች' : 'Assigned Assets'}
              </p>
              <h4 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                {assignedCount}
              </h4>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-bold">{formatCurrency(assignedValue)}</span>
                <span className="text-[11px] font-black text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-lg">
                  {assignedStaffCount} {language === 'AM' ? 'ሰራተኞች' : 'Custodians'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Maintained Assets */}
          <div
            onClick={() => setActiveTab('maintained-assets')}
            className="group cursor-pointer bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-amber-400 dark:hover:border-amber-500 transition-all duration-200 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500 group-hover:h-2 transition-all" />
            <div className="flex items-start justify-between">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-2xl">
                <Wrench size={22} />
              </div>
              <ArrowUpRight size={16} className="text-slate-300 group-hover:text-amber-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
            <div className="mt-4">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                {language === 'AM' ? 'በጥገና ላይ ያሉ' : 'Maintained Assets'}
              </p>
              <h4 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                {maintainedCount}
              </h4>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-bold">
                  {formatCurrency(maintainedCost)}
                </span>
                <span className="text-[11px] font-black text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-lg">
                  {maintainedTickets} {language === 'AM' ? 'ቲኬቶች' : 'Open Tickets'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Distributed Assets */}
          <div
            onClick={() => setActiveTab('distributed-assets')}
            className="group cursor-pointer bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-500 transition-all duration-200 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500 group-hover:h-2 transition-all" />
            <div className="flex items-start justify-between">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                <Layers size={22} />
              </div>
              <ArrowUpRight size={16} className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
            <div className="mt-4">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                {language === 'AM' ? 'የተከፋፈሉ ንብረቶች' : 'Distributed Assets'}
              </p>
              <h4 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                {distributedCount}
              </h4>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-bold">{formatCurrency(distributedValue)}</span>
                <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg">
                  {distributedDeptCount} {language === 'AM' ? 'ክፍሎች' : 'Depts'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Disposed Assets */}
          <div
            onClick={() => setActiveTab('disposed-assets')}
            className="group cursor-pointer bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-rose-400 dark:hover:border-rose-500 transition-all duration-200 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-500 group-hover:h-2 transition-all" />
            <div className="flex items-start justify-between">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-2xl">
                <Trash2 size={22} />
              </div>
              <ArrowUpRight size={16} className="text-slate-300 group-hover:text-rose-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
            <div className="mt-4">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                {language === 'AM' ? 'የተወገዱ ንብረቶች' : 'Disposed Assets'}
              </p>
              <h4 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                {disposedCount}
              </h4>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-bold">
                  {language === 'AM' ? 'ገቢ' : 'Recov.'}: {formatCurrency(disposedRecovered)}
                </span>
                <span className="text-[11px] font-black text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-lg">
                  {language === 'AM' ? 'የፀደቁ' : 'Decommissioned'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Owned Portfolio Valuation Strip */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-indigo-900/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Package size={20} className="text-indigo-400" />
              <span className="text-xs font-black uppercase tracking-widest text-indigo-300">
                {language === 'AM' ? 'የድርጅቱ አጠቃላይ የንብረት ይዞታ' : 'Total Institutional Asset Portfolio'}
              </span>
            </div>
            <h3 className="text-2xl font-black tracking-tight">
              {ownedAssetsCount} {language === 'AM' ? 'ንቁ የተያዙ ንብረቶች' : 'Active Owned Assets'}
            </h3>
            <p className="text-xs text-slate-300">
              {language === 'AM'
                ? 'ያልተወገዱና በድርጅቱ ቁጥጥር ስር ያሉ ንብረቶች ድምር ዋጋ'
                : 'Aggregated book valuation and cumulative original acquisition costs excluding decommissioned items'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <div>
              <p className="text-[10px] uppercase font-black tracking-widest text-indigo-200">
                {language === 'AM' ? 'የግዥ ዋጋ' : 'Original Cost'}
              </p>
              <p className="text-lg font-black text-white mt-0.5">{formatCurrency(ownedAssetsValue)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-black tracking-widest text-indigo-200">
                {language === 'AM' ? 'ወቅታዊ ዋጋ' : 'Net Book Value'}
              </p>
              <p className="text-lg font-black text-emerald-300 mt-0.5">{formatCurrency(totalBookVal)}</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <button
                onClick={() => setActiveTab('owned-assets')}
                className="w-full h-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-black transition-all shadow-md"
              >
                <span>{language === 'AM' ? 'ይዞታን መርምር' : 'Portfolio View'}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Lifecycle Pipeline */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Boxes size={18} className="text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              {language === 'AM' ? 'የንብረት ህይወት ዑደት ሂደት' : 'Asset Lifecycle Pipeline Progression'}
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('asset-history')}
            className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>{language === 'AM' ? 'የሙሉ ታሪክ ኦዲት' : 'View Full Lifecycle Audit'}</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Step Progression Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {/* Stage 1: Registered */}
          <div
            onClick={() => setActiveTab('registered-assets')}
            className="cursor-pointer p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all text-center group"
          >
            <div className="w-8 h-8 mx-auto rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-black group-hover:bg-blue-600 group-hover:text-white transition-colors">
              1
            </div>
            <p className="text-xs font-black text-slate-900 dark:text-white mt-2">
              {language === 'AM' ? 'ተመዝግቧል' : 'Registered'}
            </p>
            <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">{registeredCount}</p>
            <span className="text-[10px] text-slate-400 font-bold block mt-1">In Central Store</span>
          </div>

          {/* Stage 2: Assigned */}
          <div
            onClick={() => setActiveTab('registered-assets')}
            className="cursor-pointer p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all text-center group"
          >
            <div className="w-8 h-8 mx-auto rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-black group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              2
            </div>
            <p className="text-xs font-black text-slate-900 dark:text-white mt-2">
              {language === 'AM' ? 'ተመድቧል' : 'Assigned'}
            </p>
            <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{assignedCount}</p>
            <span className="text-[10px] text-slate-400 font-bold block mt-1">Staff Custody</span>
          </div>

          {/* Stage 3: Distributed */}
          <div
            onClick={() => setActiveTab('distributed-assets')}
            className="cursor-pointer p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all text-center group"
          >
            <div className="w-8 h-8 mx-auto rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-black group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              3
            </div>
            <p className="text-xs font-black text-slate-900 dark:text-white mt-2">
              {language === 'AM' ? 'ተሰራጭቷል' : 'Distributed'}
            </p>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{distributedCount}</p>
            <span className="text-[10px] text-slate-400 font-bold block mt-1">Operational Depts</span>
          </div>

          {/* Stage 4: Under Maintenance */}
          <div
            onClick={() => setActiveTab('maintained-assets')}
            className="cursor-pointer p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all text-center group"
          >
            <div className="w-8 h-8 mx-auto rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-black group-hover:bg-amber-600 group-hover:text-white transition-colors">
              4
            </div>
            <p className="text-xs font-black text-slate-900 dark:text-white mt-2">
              {language === 'AM' ? 'በጥገና ላይ' : 'Maintenance'}
            </p>
            <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">{maintainedCount}</p>
            <span className="text-[10px] text-slate-400 font-bold block mt-1">Workshop / Repair</span>
          </div>

          {/* Stage 5: Disposed */}
          <div
            onClick={() => setActiveTab('disposed-assets')}
            className="cursor-pointer p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all text-center group"
          >
            <div className="w-8 h-8 mx-auto rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-black group-hover:bg-rose-600 group-hover:text-white transition-colors">
              5
            </div>
            <p className="text-xs font-black text-slate-900 dark:text-white mt-2">
              {language === 'AM' ? 'ተወግዷል' : 'Disposed'}
            </p>
            <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">{disposedCount}</p>
            <span className="text-[10px] text-slate-400 font-bold block mt-1">Auction / Scrap</span>
          </div>
        </div>
      </section>

      {/* Two-Column Mid-section: Department Allocation & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-indigo-600" />
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                {language === 'AM' ? 'ንብረት በስራ ክፍሎች' : 'Departmental Distribution'}
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('distributed-assets')}
              className="text-xs font-black text-indigo-600 hover:underline"
            >
              {language === 'AM' ? 'ሁሉንም እይ' : 'View All'}
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {departmentData.map((d, idx) => {
              const maxCount = Math.max(...departmentData.map(x => x.count), 1)
              const pct = Math.round((d.count / maxCount) * 100)
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300">{d.dept}</span>
                    <span className="text-slate-500 font-mono">
                      {d.count} items &bull; {formatCurrency(d.val)}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {departmentData.length === 0 && (
              <p className="text-xs text-slate-400 italic py-6 text-center">No departmental distributions recorded yet.</p>
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-emerald-600" />
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                {language === 'AM' ? 'ንብረት በምድብ' : 'Assets by Classification'}
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-400">{stats.categories?.length || 0} Categories</span>
          </div>

          <div className="space-y-3 pt-2">
            {(stats.categories || []).slice(0, 6).map((cat, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">{cat.category}</span>
                  <span className="text-slate-500 font-mono">{cat.count} items</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${categoryColors[i % categoryColors.length]} rounded-full transition-all duration-500`}
                    style={{ width: `${stats.totalAssets > 0 ? (cat.count / stats.totalAssets) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
            {(!stats.categories || stats.categories.length === 0) && (
              <p className="text-xs text-slate-400 italic py-6 text-center">No category data available yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Launchpad */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
          {language === 'AM' ? 'ፈጣን የአሰራር መንገዶች' : 'Quick Action Shortcuts'}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {perms.canRegisterAsset && (
            <button
              onClick={() => setActiveTab('registered-assets')}
              className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-all group"
            >
              <PlusCircle size={20} className="text-blue-600 mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black">{language === 'AM' ? 'ንብረት መዝግብ' : 'Register Asset'}</span>
            </button>
          )}

          {perms.canInitiateTransfer && (
            <button
              onClick={() => setActiveTab('transfer-assets')}
              className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-all group"
            >
              <Send size={20} className="text-indigo-600 mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black">{language === 'AM' ? 'ንብረት አስተላልፍ' : 'Transfer Asset'}</span>
            </button>
          )}

          {perms.canReportMaintenance && (
            <button
              onClick={() => setActiveTab('maintained-assets')}
              className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-all group"
            >
              <Wrench size={20} className="text-amber-600 mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black">{language === 'AM' ? 'ጥገና መዝግብ' : 'Log Maintenance'}</span>
            </button>
          )}

          {perms.canRecordDisposal && (
            <button
              onClick={() => setActiveTab('disposed-assets')}
              className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-all group"
            >
              <Trash2 size={20} className="text-rose-600 mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black">{language === 'AM' ? 'ንብረት አስወግድ' : 'Dispose Asset'}</span>
            </button>
          )}

          {(perms.canManageHierarchy || perms.canManageUsers) && (
            <button
              onClick={() => setActiveTab('user-management')}
              className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-all group col-span-2 sm:col-span-1"
            >
              <Users size={20} className="text-purple-600 mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black">{language === 'AM' ? 'ሰራተኞች/ተዋረድ' : 'User Hierarchy'}</span>
            </button>
          )}
        </div>
      </section>

      {/* Live Lifecycle Activity Stream */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-indigo-600" />
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              {language === 'AM' ? 'የቅርብ ጊዜ የህይወት ዑደት እንቅስቃሴዎች' : 'Recent Lifecycle Audit Events'}
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('asset-history')}
            className="text-xs font-black text-indigo-600 hover:underline"
          >
            {language === 'AM' ? 'ሁሉንም ታሪክ እይ' : 'View Full History'}
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {recentActivity.map((evt, idx) => (
            <div key={evt.id || idx} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
                  {evt.actionType}
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-white">
                    {evt.assetName} {evt.tagNumber ? `(${evt.tagNumber})` : ''}
                  </p>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{evt.details || 'Lifecycle transition recorded'}</p>
                </div>
              </div>

              <div className="text-right text-xs">
                <span className="font-bold text-slate-600 dark:text-slate-400 block">
                  {evt.performedBy || 'System'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {evt.timestamp ? new Date(evt.timestamp).toLocaleDateString() : 'Today'}
                </span>
              </div>
            </div>
          ))}

          {recentActivity.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400 font-bold">
              No recent lifecycle actions logged yet.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default Dashboard
