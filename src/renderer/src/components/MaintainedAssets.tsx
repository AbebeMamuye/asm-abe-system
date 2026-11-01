import React, { useState } from 'react'
import {
  Wrench,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Coins,
  Activity,
  ArrowRight,
  User,
  Calendar,
  Tag,
  DollarSign
} from 'lucide-react'
import { useStore, MaintenanceLog, Asset, TRANSLATIONS } from '../store/useStore'
import { format } from 'date-fns'
import ExportDropdown from './ExportDropdown'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getRolePermissions } from '../lib/permissions'

export default function MaintainedAssets() {
  const { assets, maintenanceLogs, addMaintenanceLog, updateMaintenanceLog, language, user } = useStore()
  const perms = getRolePermissions(user?.role)
  const t = TRANSLATIONS[language]

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Modals
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)
  const [completionModalLog, setCompletionModalLog] = useState<MaintenanceLog | null>(null)
  const [completionCost, setCompletionCost] = useState('0')
  const [completionNotes, setCompletionNotes] = useState('')

  // Form states
  const [selectedAssetId, setSelectedAssetId] = useState('')
  const [issueDescription, setIssueDescription] = useState('')
  const [technicianName, setTechnicianName] = useState('')
  const [reportedDate, setReportedDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAssetId || !issueDescription.trim()) return

    const log: Partial<MaintenanceLog> = {
      assetId: parseInt(selectedAssetId),
      issueDescription: issueDescription.trim(),
      technicianName: technicianName.trim() || undefined,
      status: 'Reported',
      reportedDate
    }

    await addMaintenanceLog(log)
    setIsLogModalOpen(false)
    setSelectedAssetId('')
    setIssueDescription('')
    setTechnicianName('')
  }

  const handleStartWork = async (logId: number) => {
    await updateMaintenanceLog(logId, { status: 'In Progress' })
  }

  const handleFinalizeCompletion = async () => {
    if (!completionModalLog?.id) return
    const cost = parseFloat(completionCost) || 0

    await updateMaintenanceLog(completionModalLog.id, {
      status: 'Completed',
      cost,
      completedDate: format(new Date(), 'yyyy-MM-dd')
    })

    setCompletionModalLog(null)
    setCompletionCost('0')
    setCompletionNotes('')
  }

  const activeInRepair = (maintenanceLogs || []).filter((l) => l.status === 'In Progress')
  const reportedPending = (maintenanceLogs || []).filter((l) => l.status === 'Reported')
  const completedLogs = (maintenanceLogs || []).filter((l) => l.status === 'Completed')
  const totalRepairCost = completedLogs.reduce((sum, l) => sum + (l.cost || 0), 0)

  const filteredLogs = (maintenanceLogs || []).filter((log) => {
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      (log.assetName && log.assetName.toLowerCase().includes(q)) ||
      log.issueDescription.toLowerCase().includes(q) ||
      (log.technicianName && log.technicianName.toLowerCase().includes(q))
    const matchesStatus = statusFilter === 'ALL' || log.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleExportPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(16); doc.setFont('helvetica', 'bold')
    doc.text('ASSET MAINTENANCE & REPAIR HISTORY REGISTER', 105, 18, { align: 'center' })
    doc.setFontSize(9); doc.setFont('helvetica', 'normal')
    doc.text(`Total Maintenance Logs: ${maintenanceLogs.length} | Total Cost: ETB ${totalRepairCost.toFixed(2)}`, 105, 24, { align: 'center' })

    const tableData = filteredLogs.map((log, i) => [
      i + 1,
      log.assetName || `Asset #${log.assetId}`,
      log.issueDescription,
      log.technicianName || '—',
      log.status,
      log.reportedDate || '—',
      log.completedDate || '—',
      `ETB ${(log.cost || 0).toFixed(2)}`
    ])

    autoTable(doc, {
      startY: 30,
      head: [['#', 'Asset Name', 'Issue Description', 'Technician', 'Status', 'Reported', 'Completed', 'Cost']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [217, 119, 6] }
    })

    doc.save('Asset_Maintenance_Register.pdf')
  }

  const exportData = filteredLogs.map((log) => ({
    'Asset ID': log.assetId,
    'Asset Name': log.assetName || '—',
    'Issue Description': log.issueDescription,
    'Assigned Technician': log.technicianName || 'Unassigned',
    'Status': log.status,
    'Reported Date': log.reportedDate || '—',
    'Completed Date': log.completedDate || '—',
    'Repair Cost (ETB)': log.cost || 0
  }))

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight underline decoration-amber-500 decoration-4 underline-offset-8">
            {language === 'AM' ? 'የተጠገኑ እና በጥገና ላይ ያሉ ንብረቶች' : 'Maintained & Repaired Assets'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-3">
            {language === 'AM'
              ? 'የንብረት ብልሽት ምዝገባ፣ የጥገና ሂደት ክትትል እና የወጪ ሂሳብ'
              : 'Maintenance lifecycle tracking: repair ticketing, technician scheduling, work in progress, and cost breakdown'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportDropdown data={exportData} filename="Asset_Maintenance" onExportPDF={handleExportPDF} />
          {perms.canReportMaintenance && (
            <button
              onClick={() => setIsLogModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-sm shadow-xl shadow-amber-600/30 transition-all hover:scale-[1.02]"
            >
              <Plus size={18} />
              <span>{language === 'AM' ? 'አዲስ ብልሽት መዝግብ' : 'Log Maintenance Ticket'}</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'AM' ? 'በስራ ላይ ያሉ' : 'In Progress'}</span>
            <div className="p-2.5 rounded-2xl bg-blue-100 dark:bg-blue-950/40 text-blue-600"><Activity size={20} /></div>
          </div>
          <p className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-4">{activeInRepair.length}</p>
          <p className="text-[11px] font-bold text-slate-400 mt-1">Under active technical repair</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'AM' ? 'አዲስ ሪፖርት የተደረጉ' : 'Reported Issues'}</span>
            <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-600"><Clock size={20} /></div>
          </div>
          <p className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-4">{reportedPending.length}</p>
          <p className="text-[11px] font-bold text-slate-400 mt-1">Pending technician dispatch</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'AM' ? 'የተጠናቀቁ ጥገናዎች' : 'Completed Repairs'}</span>
            <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600"><CheckCircle2 size={20} /></div>
          </div>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-4">{completedLogs.length}</p>
          <p className="text-[11px] font-bold text-slate-400 mt-1">Restored to functional status</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'AM' ? 'ጠቅላላ የጥገና ወጪ' : 'Maintenance Expenses'}</span>
            <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-950/40 text-rose-600"><Coins size={20} /></div>
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-4">ETB {totalRepairCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          <p className="text-[11px] font-bold text-slate-400 mt-1">Cumulative labor & parts</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder={language === 'AM' ? 'በንብረት ስም፣ ብልሽት ወይም ባለሙያ ፈልግ...' : 'Search maintenance records by asset, issue, technician...'}
            className="w-full pl-12 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-xs outline-none focus:ring-2 focus:ring-amber-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-bold border-none outline-none focus:ring-2 focus:ring-amber-500 w-full md:w-auto"
        >
          <option value="ALL">All Maintenance Records</option>
          <option value="Reported">Reported</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {/* Maintenance Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border-2 border-slate-900 dark:border-slate-700">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest">
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'ንብረት' : 'Asset Description'}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'የብልሽት መግለጫ' : 'Issue Description'}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'የተመደበ ባለሙያ' : 'Technician'}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'ሁኔታ' : 'Status'}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'ቀን' : 'Reported Date'}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right">{language === 'AM' ? 'የጥገና ወጪ' : 'Repair Cost'}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right">{language === 'AM' ? 'ተግባራት' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 font-black text-sm text-slate-900 dark:text-white">
                    {log.assetName || `Asset #${log.assetId}`}
                  </td>

                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 max-w-sm">
                    {log.issueDescription}
                  </td>

                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300">
                    {log.technicianName || '—'}
                  </td>

                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${
                      log.status === 'Completed'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : log.status === 'In Progress'
                        ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300'
                        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                    }`}>
                      {log.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-xs font-bold text-slate-400">
                    {log.reportedDate || '—'}
                  </td>

                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right font-black text-xs text-slate-900 dark:text-white">
                    {log.cost ? `ETB ${log.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                  </td>

                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {perms.canManageMaintenance && log.status === 'Reported' && (
                        <button
                          onClick={() => handleStartWork(log.id!)}
                          className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 text-xs font-black transition-colors"
                        >
                          Start Work
                        </button>
                      )}

                      {perms.canManageMaintenance && log.status === 'In Progress' && (
                        <button
                          onClick={() => {
                            setCompletionModalLog(log)
                            setCompletionCost(log.cost?.toString() || '0')
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm transition-colors"
                        >
                          Mark Completed
                        </button>
                      )}

                      {log.status === 'Completed' && (
                        <span className="text-[11px] font-black text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 size={14} /> Resolved
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400 font-bold text-sm">
                    No maintenance records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Maintenance Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden transform animate-in zoom-in-95 duration-200 flex flex-col">
            <header className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-600 rounded-2xl text-white"><Wrench size={20} /></div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    {language === 'AM' ? 'የብልሽት መዝገብ ክፈት' : 'Log Maintenance Ticket'}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">Record hardware malfunction and schedule technician</p>
                </div>
              </div>
              <button onClick={() => setIsLogModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full">✕</button>
            </header>

            <form onSubmit={handleCreateLog} className="p-8 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block">
                  Select Asset <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">-- Choose asset --</option>
                  {assets
                    .filter(a => a.disposalStatus !== 'Disposed')
                    .map(a => (
                      <option key={a.id} value={a.id?.toString()}>
                        {a.name} — Tag: {a.tagNumber || a.id} ({a.custodian || a.location || 'Store'})
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block">
                  Issue Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the issue, symptoms, broken parts..."
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block">
                  Assigned Technician
                </label>
                <input
                  type="text"
                  placeholder="e.g. IT Support / Hardware Engineer"
                  value={technicianName}
                  onChange={(e) => setTechnicianName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block">
                  Reported Date
                </label>
                <input
                  type="date"
                  value={reportedDate}
                  onChange={(e) => setReportedDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="flex-1 py-3 px-5 rounded-2xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-sm shadow-xl shadow-amber-600/30"
                >
                  Create Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Completion Modal */}
      {completionModalLog && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden transform animate-in zoom-in-95 duration-200 p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-600 rounded-2xl text-white"><CheckCircle2 size={22} /></div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Finalize Repair</h3>
                <p className="text-xs text-slate-400 font-medium">Record final repair costs and restore asset to Functional</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block">
                  Total Repair Cost (ETB)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={completionCost}
                  onChange={(e) => setCompletionCost(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-lg font-black text-emerald-600 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block">
                  Repair Remarks
                </label>
                <input
                  type="text"
                  placeholder="Parts replaced, service warranty, notes..."
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={() => setCompletionModalLog(null)}
                className="flex-1 py-3 px-5 rounded-2xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFinalizeCompletion}
                className="flex-1 py-3 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-xl shadow-emerald-600/30"
              >
                Complete & Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
