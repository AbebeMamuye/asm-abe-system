import { useState, useEffect, useMemo } from 'react'
import {
  History,
  Search,
  Filter,
  Download,
  Calendar,
  Tag,
  User,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Clock,
  Layers,
  Wrench,
  Send,
  Trash2,
  PlusCircle,
  Eye,
  Table,
  List
} from 'lucide-react'
import { useStore, TRANSLATIONS } from '../store/useStore'
import { AssetHistory as IAssetHistory } from '../store/types'
import { toEthiopianDate } from '../lib/ethiopianCalendar'

export const AssetHistory = () => {
  const { assetHistory, fetchAssetHistory, language } = useStore()
  const t = TRANSLATIONS[language]

  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table')
  const [search, setSearch] = useState('')
  const [selectedAction, setSelectedAction] = useState<string>('ALL')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [selectedEvent, setSelectedEvent] = useState<IAssetHistory | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    fetchAssetHistory()
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchAssetHistory()
    setTimeout(() => setIsRefreshing(false), 400)
  }

  // Filtered history list
  const filteredHistory = useMemo(() => {
    return assetHistory.filter(item => {
      const q = search.toLowerCase()
      const matchesSearch =
        !search ||
        (item.assetName && item.assetName.toLowerCase().includes(q)) ||
        (item.tagNumber && item.tagNumber.toLowerCase().includes(q)) ||
        (item.performedBy && item.performedBy.toLowerCase().includes(q)) ||
        (item.details && item.details.toLowerCase().includes(q))

      const matchesAction =
        selectedAction === 'ALL' ||
        (item.actionType && item.actionType.toUpperCase() === selectedAction)

      const itemDate = item.timestamp ? new Date(item.timestamp).toISOString().slice(0, 10) : ''
      const matchesStart = !startDate || itemDate >= startDate
      const matchesEnd = !endDate || itemDate <= endDate

      return matchesSearch && matchesAction && matchesStart && matchesEnd
    })
  }, [assetHistory, search, selectedAction, startDate, endDate])

  // Summary counts
  const summary = useMemo(() => {
    const total = assetHistory.length
    const registered = assetHistory.filter(h => h.actionType?.toUpperCase().includes('REGISTRATION') || h.actionType?.toUpperCase().includes('CREATE')).length
    const transfers = assetHistory.filter(h => h.actionType?.toUpperCase().includes('TRANSFER') || h.actionType?.toUpperCase().includes('ASSIGN') || h.actionType?.toUpperCase().includes('DISTRIBUT')).length
    const maintenance = assetHistory.filter(h => h.actionType?.toUpperCase().includes('MAINTENANCE') || h.actionType?.toUpperCase().includes('REPAIR')).length
    const disposals = assetHistory.filter(h => h.actionType?.toUpperCase().includes('DISPOSAL')).length
    return { total, registered, transfers, maintenance, disposals }
  }, [assetHistory])

  // Export to CSV
  const exportToCSV = () => {
    if (filteredHistory.length === 0) return
    const headers = ['Timestamp', 'Asset Name', 'Tag Number', 'Action Type', 'Previous Status', 'New Status', 'Performed By', 'Details']
    const rows = filteredHistory.map(h => [
      `"${h.timestamp || ''}"`,
      `"${h.assetName || ''}"`,
      `"${h.tagNumber || ''}"`,
      `"${h.actionType || ''}"`,
      `"${h.previousStatus || ''}"`,
      `"${h.newStatus || ''}"`,
      `"${h.performedBy || ''}"`,
      `"${(h.details || '').replace(/"/g, '""')}"`
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Asset_Lifecycle_History_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getActionBadge = (action: string) => {
    const act = (action || '').toUpperCase()
    if (act.includes('REGISTRATION') || act.includes('CREATE')) {
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
        icon: PlusCircle
      }
    }
    if (act.includes('TRANSFER')) {
      return {
        bg: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800',
        icon: Send
      }
    }
    if (act.includes('ASSIGN') || act.includes('DISTRIBUT')) {
      return {
        bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800',
        icon: Layers
      }
    }
    if (act.includes('MAINTENANCE') || act.includes('REPAIR')) {
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
        icon: Wrench
      }
    }
    if (act.includes('DISPOSAL')) {
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
        icon: Trash2
      }
    }
    return {
      bg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      icon: Clock
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-600/20">
              <History size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {t.assetHistory}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                {language === 'AM'
                  ? 'የእያንዳንዱ ንብረት ሙሉ የህይወት ዑደት (ምዝገባ፣ ዝውውር፣ ጥገና፣ ውግጃ) የኦዲት መዝገብ'
                  : 'Comprehensive immutable audit timeline tracking every lifecycle event from registration to disposal'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Table View"
            >
              <Table size={14} />
              <span>{language === 'AM' ? 'ሰንጠረዥ' : 'Table View'}</span>
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                viewMode === 'timeline'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Timeline View"
            >
              <List size={14} />
              <span>{language === 'AM' ? 'የጊዜ መስመር' : 'Timeline View'}</span>
            </button>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
            title="Refresh history"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{language === 'AM' ? 'አድስ' : 'Refresh'}</span>
          </button>
          <button
            onClick={exportToCSV}
            disabled={filteredHistory.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-xs font-black rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition-all shadow-md disabled:opacity-50"
          >
            <Download size={14} />
            <span>{language === 'AM' ? 'ወደ CSV አውርድ' : 'Export Audit CSV'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            {language === 'AM' ? 'ጠቅላላ ክስተቶች' : 'Total Events'}
          </p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{summary.total}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-500">
            {language === 'AM' ? 'ምዝገባዎች' : 'Registrations'}
          </p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{summary.registered}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-indigo-500">
            {language === 'AM' ? 'ዝውውር/ክፍፍል' : 'Transfers & Dist.'}
          </p>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{summary.transfers}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-amber-500">
            {language === 'AM' ? 'ጥገናዎች' : 'Maintenance'}
          </p>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{summary.maintenance}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-[10px] font-black uppercase tracking-wider text-rose-500">
            {language === 'AM' ? 'ውግጃዎች' : 'Disposals'}
          </p>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{summary.disposals}</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={language === 'AM' ? 'በንብረት ስም፣ መለያ ቁጥር፣ በፈፃሚ ስም ፈልግ...' : 'Search by asset name, tag number, performer, details...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Action type filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <Filter size={13} className="text-slate-400" />
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none py-1"
            >
              <option value="ALL">{language === 'AM' ? 'ሁሉንም ተግባራት' : 'All Actions'}</option>
              <option value="REGISTRATION">{language === 'AM' ? 'ምዝገባ (Registration)' : 'Registration'}</option>
              <option value="TRANSFER">{language === 'AM' ? 'ዝውውር (Transfer)' : 'Transfer'}</option>
              <option value="ASSIGNMENT">{language === 'AM' ? 'ምደባ (Assignment)' : 'Assignment'}</option>
              <option value="DISTRIBUTION">{language === 'AM' ? 'ስርጭት (Distribution)' : 'Distribution'}</option>
              <option value="MAINTENANCE">{language === 'AM' ? 'ጥገና (Maintenance)' : 'Maintenance'}</option>
              <option value="DISPOSAL">{language === 'AM' ? 'ውግጃ (Disposal)' : 'Disposal'}</option>
              <option value="UPDATE">{language === 'AM' ? 'ማሻሻያ (Update)' : 'Update'}</option>
            </select>
          </div>

          {/* Date range */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <Calendar size={13} className="text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-[11px] text-slate-700 dark:text-slate-200 focus:outline-none"
              title="Start date"
            />
            <span className="text-slate-400">→</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-[11px] text-slate-700 dark:text-slate-200 focus:outline-none"
              title="End date"
            />
          </div>

          {(search || selectedAction !== 'ALL' || startDate || endDate) && (
            <button
              onClick={() => {
                setSearch('')
                setSelectedAction('ALL')
                setStartDate('')
                setEndDate('')
              }}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-1"
            >
              {language === 'AM' ? 'አፅዳ' : 'Clear'}
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-wider">
            <ShieldCheck size={16} className="text-indigo-500" />
            <span>
              {language === 'AM'
                ? `የተገኙ የህይወት ዑደት መዝገቦች (${filteredHistory.length})`
                : `Verified Audit Logs (${filteredHistory.length})`}
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-400">
            {language === 'AM' ? 'በቀን ቅደም ተከተል' : 'Chronological (Newest First)'}
          </span>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="py-16 text-center">
            <History size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-base font-black text-slate-700 dark:text-slate-300">
              {language === 'AM' ? 'ምንም የህይወት ዑደት መዝገብ አልተገኘም' : 'No lifecycle history records found'}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {language === 'AM'
                ? 'አዲስ ንብረቶችን ሲመዘግቡ፣ ሲያስተላልፉ፣ ጥገና ሲያካሂዱ ወይም ሲያስወግዱ እዚህ ይመዘገባሉ'
                : 'Asset registration, transfers, maintenance, and disposal actions will automatically be captured here'}
            </p>
          </div>
        ) : viewMode === 'table' ? (
          /* ========== TABLE VIEW ========== */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border-2 border-slate-900 dark:border-slate-700">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest">
                  <th className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700">#</th>
                  <th className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700">
                    {language === 'AM' ? 'ቀን (GC / EC)' : 'Date (GC / EC)'}
                  </th>
                  <th className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700">
                    {language === 'AM' ? 'የንብረት ስም' : 'Asset Name'}
                  </th>
                  <th className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700">
                    {language === 'AM' ? 'መለያ ቁጥር' : 'Tag Number'}
                  </th>
                  <th className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700">
                    {language === 'AM' ? 'የተግባር ዓይነት' : 'Action Type'}
                  </th>
                  <th className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700">
                    {language === 'AM' ? 'ከቀድሞ ሁኔታ' : 'Previous Status'}
                  </th>
                  <th className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700">
                    {language === 'AM' ? 'ወደ አዲስ ሁኔታ' : 'New Status'}
                  </th>
                  <th className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700">
                    {language === 'AM' ? 'ፈፃሚ' : 'Performed By'}
                  </th>
                  <th className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700">
                    {language === 'AM' ? 'ዝርዝር' : 'Details'}
                  </th>
                  <th className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700 text-center">
                    {language === 'AM' ? 'ተግባራት' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item, idx) => {
                  const badge = getActionBadge(item.actionType)
                  const Icon = badge.icon
                  const gcDate = item.timestamp ? new Date(item.timestamp).toLocaleDateString() : '—'
                  const ecDate = item.timestamp ? toEthiopianDate(item.timestamp) : ''

                  return (
                    <tr key={item.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700 text-xs font-bold text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-indigo-500 shrink-0" />
                          <div>
                            <p className="text-xs font-black text-slate-900 dark:text-white">{gcDate}</p>
                            {ecDate && (
                              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-tight">
                                EC: {ecDate}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700">
                        <p className="text-xs font-black text-slate-900 dark:text-white">{item.assetName}</p>
                      </td>
                      <td className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700">
                        {item.tagNumber ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                            <Tag size={10} className="text-slate-400" />
                            {item.tagNumber}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black border uppercase tracking-wide ${badge.bg}`}>
                          <Icon size={12} />
                          <span>{item.actionType}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">
                        {item.previousStatus || '—'}
                      </td>
                      <td className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700">
                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                          {item.newStatus || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700">
                        <div className="flex items-center gap-1.5">
                          <User size={12} className="text-indigo-500 shrink-0" />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {item.performedBy || 'System Admin'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700">
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 max-w-[200px] truncate" title={item.details || ''}>
                          {item.details || '—'}
                        </p>
                      </td>
                      <td className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700 text-center">
                        <button
                          onClick={() => setSelectedEvent(item)}
                          className="inline-flex items-center gap-1 text-[11px] font-black text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          <Eye size={12} />
                          <span>{language === 'AM' ? 'እይ' : 'View'}</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* ========== TIMELINE VIEW ========== */
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {filteredHistory.map((item, idx) => {
              const badge = getActionBadge(item.actionType)
              const Icon = badge.icon
              const formattedDate = item.timestamp
                ? new Date(item.timestamp).toLocaleString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : '—'

              return (
                <div key={item.id || idx} className="relative group">
                  {/* Timeline bullet */}
                  <div className="absolute -left-[30px] top-1.5 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-500 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <div className="w-2 h-2 rounded-full bg-indigo-600" />
                  </div>

                  {/* Card */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-4 transition-all duration-200 shadow-sm hover:shadow-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black border uppercase tracking-wide ${badge.bg}`}>
                          <Icon size={12} />
                          <span>{item.actionType}</span>
                        </span>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">
                          {item.assetName}
                        </h4>
                        {item.tagNumber && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                            <Tag size={10} className="text-slate-400" />
                            {item.tagNumber}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                        <Clock size={12} />
                        <span>{formattedDate}</span>
                      </div>
                    </div>

                    {/* Status Transition Pill if present */}
                    {(item.previousStatus || item.newStatus) && (
                      <div className="my-2.5 inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
                        <span className="text-slate-400 font-semibold">{language === 'AM' ? 'የቀድሞ' : 'From'}:</span>
                        <span className="text-slate-600 dark:text-slate-300">{item.previousStatus || '—'}</span>
                        <ArrowRight size={12} className="text-indigo-500" />
                        <span className="text-slate-400 font-semibold">{language === 'AM' ? 'አሁን' : 'To'}:</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-black">{item.newStatus || '—'}</span>
                      </div>
                    )}

                    {/* Details content */}
                    {item.details && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                        {item.details}
                      </p>
                    )}

                    {/* Footer actor & actions */}
                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-bold">
                        <User size={12} className="text-indigo-500" />
                        <span className="text-[11px]">
                          {language === 'AM' ? 'ፈፃሚ' : 'Logged by'}: <strong className="text-slate-800 dark:text-slate-200">{item.performedBy || 'System Admin'}</strong>
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedEvent(item)}
                        className="flex items-center gap-1 text-[11px] font-black text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        <Eye size={12} />
                        <span>{language === 'AM' ? 'ዝርዝር እይ' : 'View Full Details'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {language === 'AM' ? 'የክስተት ሙሉ የኦዲት መረጃ' : 'Audit Event Details'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px] font-black uppercase">Asset Name</span>
                  <span className="font-black text-slate-900 dark:text-white text-sm">{selectedEvent.assetName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-black uppercase">Tag Number</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedEvent.tagNumber || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-black uppercase">Action Type</span>
                  <span className="font-black text-indigo-600 dark:text-indigo-400">{selectedEvent.actionType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-black uppercase">Performed By</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedEvent.performedBy || 'System'}</span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-slate-400 block text-[10px] font-black uppercase">Status Transition</span>
                <div className="flex items-center gap-3">
                  <div className="px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 font-bold">
                    {selectedEvent.previousStatus || 'Initial'}
                  </div>
                  <ArrowRight size={14} className="text-indigo-500" />
                  <div className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg border border-indigo-200 dark:border-indigo-800 font-black">
                    {selectedEvent.newStatus || 'N/A'}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] font-black uppercase mb-1">Details & Description</span>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-mono text-[11px]">
                  {selectedEvent.details || 'No additional details logged.'}
                </div>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2">
                <span>Recorded ID: #{selectedEvent.id || 'N/A'}</span>
                <span>{selectedEvent.timestamp ? new Date(selectedEvent.timestamp).toUTCString() : ''}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AssetHistory
