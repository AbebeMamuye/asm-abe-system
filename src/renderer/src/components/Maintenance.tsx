import React, { useState } from 'react'
import { Wrench, Plus, Search, Calendar, User, Clock, CheckCircle2, AlertCircle, Activity, ArrowRight, Coins } from 'lucide-react'
import { useStore, MaintenanceLog, TRANSLATIONS } from '../store/useStore'
import { format } from 'date-fns'
import EthiopianDatePicker from './EthiopianDatePicker'
import ExportDropdown from './ExportDropdown'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const Maintenance = () => {
  const { assets, maintenanceLogs, addMaintenanceLog, language } = useStore()
  const t = TRANSLATIONS[language]
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [costModal, setCostModal] = useState<{ id: number, assetId: number } | null>(null)
  const [completionCost, setCompletionCost] = useState('0')
  const [searchTerm, setSearchTerm] = useState('')

  // Form state
  const [selectedAssetId, setSelectedAssetId] = useState('')
  const [issueDescription, setIssueDescription] = useState('')
  const [technicianName, setTechnicianName] = useState('')
  const [reportedDate, setReportedDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAssetId || !issueDescription) return
    const log: MaintenanceLog = {
      assetId: parseInt(selectedAssetId),
      issueDescription,
      technicianName,
      status: 'Reported',
      reportedDate
    }
    await addMaintenanceLog(log)
    setIsModalOpen(false)
    setSelectedAssetId(''); setIssueDescription(''); setTechnicianName('')
  }

  const handleUpdateStatus = async (logId: number, status: 'In Progress' | 'Completed', assetId: number) => {
    if (status === 'Completed') {
      setCostModal({ id: logId, assetId })
      return
    }
    
    if (window.api) {
      await window.api.updateMaintenance(logId, { status, assetId })
      useStore.getState().refreshData()
    }
  }

  const handleFinalizeCompletion = async () => {
    if (!costModal) return
    const updates: Partial<MaintenanceLog> = { 
      status: 'Completed', 
      assetId: costModal.assetId,
      cost: parseFloat(completionCost || '0'),
      completedDate: format(new Date(), 'yyyy-MM-dd')
    }
    
    if (window.api) {
      await window.api.updateMaintenance(costModal.id, updates)
      useStore.getState().refreshData()
    }
    setCostModal(null)
    setCompletionCost('0')
  }

  const filteredLogs = (maintenanceLogs || []).filter(log =>
    log?.assetName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log?.issueDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log?.technicianName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalLogs = (maintenanceLogs || []).length
  const openLogs = (maintenanceLogs || []).filter(l => l.status === 'In Progress' || l.status === 'Reported').length
  const completedLogs = (maintenanceLogs || []).filter(l => l.status === 'Completed').length

  const generatePDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(18); doc.text('ASSET MAINTENANCE LOG', 105, 20, { align: 'center' })
    const tableData = (maintenanceLogs || []).map((l, i) => [
      i + 1, l.assetName, l.status, l.issueDescription, l.technicianName || '—', l.reportedDate, l.cost ? l.cost.toFixed(2) : '—'
    ])
    autoTable(doc, {
      startY: 30,
      head: [['#', 'Asset', 'Status', 'Issue', 'Tech', 'Reported', 'Cost']],
      body: tableData,
      theme: 'grid', headStyles: { fillColor: [30, 41, 59] }
    })
    doc.save('Maintenance_Log.pdf')
  }

  const exportData = (maintenanceLogs || []).map(l => ({
    'Asset Name': l.assetName,
    'Status': l.status,
    'Issue Description': l.issueDescription,
    'Technician': l.technicianName || 'N/A',
    'Reported Date': l.reportedDate,
    'Completed Date': l.completedDate || 'N/A',
    'Cost': l.cost || 0
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Asset Maintenance Log</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Track repairs, servicing, and asset health across all departments.</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportDropdown data={exportData} filename="Maintenance_Log" onExportPDF={generatePDF} />
          <button
            id="btn-report-issue"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-amber-500/20 transition-all active:scale-95"
          >
            <Wrench size={20} />
            <span>{t.reportIssue}</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Issues Reported</p>
            <h3 className="text-2xl font-black">{totalLogs}</h3>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl text-slate-600 dark:text-slate-400">
            <Activity size={24} />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Open / In Progress</p>
            <h3 className="text-2xl font-black text-amber-500">{openLogs}</h3>
          </div>
          <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-xl text-amber-600">
            <Clock size={24} />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Resolved / Completed</p>
            <h3 className="text-2xl font-black text-emerald-500">{completedLogs}</h3>
          </div>
          <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-xl text-emerald-600">
            <CheckCircle2 size={24} />
          </div>
        </div>
      </div>

      {/* Log Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              id="maintenance-search"
              type="text"
              placeholder="Search by asset, issue, or technician..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredLogs.map((log) => (
            <div key={log.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl ${
                  log.status === 'Completed' ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600' :
                  log.status === 'In Progress' ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-600' :
                  'bg-red-100 dark:bg-red-900/20 text-red-600'
                }`}>
                  <Wrench size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{log.assetName}</h4>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      log.status === 'Completed' ? 'bg-emerald-500 text-white' :
                      log.status === 'In Progress' ? 'bg-amber-500 text-white' :
                      'bg-red-500 text-white'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium italic">"{log.issueDescription}"</p>
                  <div className="flex items-center gap-4 mt-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex-wrap">
                    <span className="flex items-center gap-1"><User size={12} /> Tech: {log.technicianName || 'Unassigned'}</span>
                    <span className="flex items-center gap-1"><Calendar size={12} /> Reported: {log.reportedDate}</span>
                    {log.cost ? <span className="flex items-center gap-1 text-emerald-600"><Coins size={12} /> Cost: {log.cost.toLocaleString()} ETB</span> : null}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {log.status === 'Reported' && (
                  <button
                    id={`btn-start-work-${log.id}`}
                    onClick={() => handleUpdateStatus(log.id!, 'In Progress', log.assetId)}
                    className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl text-xs font-black hover:bg-amber-100 transition-all flex items-center gap-2"
                  >
                    {t.startWork} <ArrowRight size={14} />
                  </button>
                )}
                {log.status === 'In Progress' && (
                  <button
                    id={`btn-mark-done-${log.id}`}
                    onClick={() => handleUpdateStatus(log.id!, 'Completed', log.assetId)}
                    className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl text-xs font-black hover:bg-emerald-100 transition-all flex items-center gap-2"
                  >
                    <CheckCircle2 size={14} /> {t.markResolved}
                  </button>
                )}
                {log.status === 'Completed' && (
                  <span className="text-slate-300 dark:text-slate-700 font-black text-xs uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">{t.resolved}</span>
                )}
              </div>
            </div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="p-20 text-center text-slate-400">
              <Activity className="mx-auto mb-3 opacity-20" size={48} />
              <p className="font-bold italic">No maintenance history recorded.</p>
              <p className="text-xs mt-1">Click "Report Issue" to log your first maintenance request.</p>
            </div>
          )}
        </div>
      </div>

      {/* Report Issue Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col">
            <header className="p-6 bg-amber-500 text-white flex items-center justify-between shrink-0">
              <h3 className="text-xl font-black flex items-center gap-2">
                <AlertCircle />
                Report Asset / Equipment Issue
              </h3>
              <button id="maintenance-modal-close" onClick={() => setIsModalOpen(false)}>
                <Plus className="rotate-45" size={24} />
              </button>
            </header>

            <form id="maintenance-form" onSubmit={handleCreateLog} className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Select Asset / Equipment <span className="text-red-500">*</span></label>
                <select
                  id="maintenance-asset-select"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                >
                  <option value="">Choose an asset...</option>
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>{a.name} — {a.location}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Issue Description <span className="text-red-500">*</span></label>
                <textarea
                  id="maintenance-issue-desc"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm min-h-[100px] focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="Describe what is wrong with the asset..."
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Assigned Technician</label>
                  <input
                    id="maintenance-technician"
                    type="text"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="Technician name"
                    value={technicianName}
                    onChange={(e) => setTechnicianName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <EthiopianDatePicker label={<span>Date Reported <span className="text-red-500">*</span></span>} value={reportedDate} onChange={setReportedDate} />
                </div>
              </div>

              <button
                id="btn-submit-maintenance"
                type="submit"
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black shadow-xl shadow-amber-500/20 transition-all active:scale-95"
              >
                Log Maintenance Request
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Finalize Cost Modal */}
      {costModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-6">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 w-16 h-16 rounded-3xl flex items-center justify-center text-emerald-600 mx-auto shadow-inner">
              <Coins size={32} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Finalize Maintenance</h3>
              <p className="text-xs text-slate-500 font-bold mt-2 uppercase tracking-widest">Enter the total cost incurred for this repair</p>
            </div>
            
            <div className="space-y-4 text-left">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Repair Cost (ETB)</label>
              <input
                type="number"
                step="0.01"
                className="w-full px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-black text-2xl text-emerald-600 outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all"
                value={completionCost}
                onChange={(e) => setCompletionCost(e.target.value)}
                autoFocus
              />
            </div>

            <div className="flex gap-4 pt-2">
              <button 
                onClick={() => setCostModal(null)}
                className="flex-1 py-4 rounded-2xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all"
              >
                {t.cancel}
              </button>
              <button 
                onClick={handleFinalizeCompletion}
                className="flex-1 py-4 rounded-2xl bg-slate-900 text-white font-black hover:bg-slate-800 shadow-xl shadow-slate-900/30 transition-all"
              >
                Complete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Maintenance
