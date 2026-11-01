import React, { useState, useEffect } from 'react'
import {
  Trash2,
  Plus,
  Search,
  DollarSign,
  Building2,
  Gift,
  CheckCircle2,
  Calendar,
  ShieldAlert,
  AlertTriangle,
  Download,
  Filter
} from 'lucide-react'
import { useStore, Disposal, Asset, TRANSLATIONS } from '../store/useStore'
import ExportDropdown from './ExportDropdown'
import EthiopianDatePicker from './EthiopianDatePicker'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getRolePermissions } from '../lib/permissions'

const DISPOSAL_METHODS = [
  { id: 'Public Auction', labelEn: 'Public Auction / Tender', labelAm: 'በግልፅ ጨረታ ሽያጭ', icon: DollarSign, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'Transfer', labelEn: 'Transfer to Public Body', labelAm: 'ወደ ሌላ የመንግስት ተቋም ማስተላለፍ', icon: Building2, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'Donation', labelEn: 'Donation', labelAm: 'በስጦታ መስጠት', icon: Gift, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { id: 'Destruction/Scrap', labelEn: 'Destruction / Scrap', labelAm: 'ማውደም / ውዳቂ (ማስወገድ)', icon: Trash2, color: 'text-rose-600 bg-rose-50 border-rose-200' }
]

export default function DisposedAssets() {
  const { assets, disposals, createDisposal, fetchDisposals, language, orgName, user } = useStore()
  const perms = getRolePermissions(user?.role)
  const t = TRANSLATIONS[language]

  const [searchTerm, setSearchTerm] = useState('')
  const [methodFilter, setMethodFilter] = useState('ALL')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Form states
  const [selectedAssetId, setSelectedAssetId] = useState<number | ''>('')
  const [quantity, setQuantity] = useState<number>(1)
  const [disposalMethod, setDisposalMethod] = useState<'Public Auction' | 'Transfer' | 'Donation' | 'Destruction/Scrap'>('Public Auction')
  const [disposalDate, setDisposalDate] = useState(new Date().toISOString().split('T')[0])
  const [committeeLeader, setCommitteeLeader] = useState('')
  const [approvedBy, setApprovedBy] = useState('')
  const [reason, setReason] = useState('')
  const [recoveredAmount, setRecoveredAmount] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchDisposals()
  }, [])

  const selectedAsset = assets.find((a) => a.id === selectedAssetId)
  const totalRecovered = disposals.reduce((sum, d) => sum + (d.recoveredAmount || 0), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAssetId || !selectedAsset) {
      alert(language === 'AM' ? 'እባክዎን የሚወገደውን ንብረት ይምረጡ!' : 'Please select an asset to dispose!')
      return
    }

    if (quantity <= 0 || quantity > selectedAsset.quantity) {
      alert(`Disposal quantity must be between 1 and ${selectedAsset.quantity}`)
      return
    }

    if (!committeeLeader.trim()) {
      alert('Please enter Committee Leader name')
      return
    }

    setIsSubmitting(true)
    try {
      await createDisposal({
        assetId: selectedAsset.id!,
        assetName: selectedAsset.name,
        quantity,
        disposalMethod,
        disposalDate,
        committeeLeader: committeeLeader.trim(),
        approvedBy: approvedBy.trim() || 'Board Committee',
        reason: reason.trim(),
        recoveredAmount: Number(recoveredAmount) || 0
      })

      setIsModalOpen(false)
      setSelectedAssetId('')
      setQuantity(1)
      setCommitteeLeader('')
      setApprovedBy('')
      setReason('')
      setRecoveredAmount(0)
      await fetchDisposals()
    } catch (err: any) {
      alert(err.message || 'Disposal recording failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredDisposals = disposals.filter((d) => {
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      d.assetName.toLowerCase().includes(q) ||
      d.disposalMethod.toLowerCase().includes(q) ||
      d.committeeLeader.toLowerCase().includes(q) ||
      d.approvedBy.toLowerCase().includes(q) ||
      (d.reason && d.reason.toLowerCase().includes(q))
    const matchesMethod = methodFilter === 'ALL' || d.disposalMethod === methodFilter
    return matchesSearch && matchesMethod
  })

  const handleExportPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(16); doc.setFont('helvetica', 'bold')
    doc.text('GOVERNMENT ASSET DISPOSAL & DECOMMISSIONING REGISTER', 105, 18, { align: 'center' })
    doc.setFontSize(9); doc.setFont('helvetica', 'normal')
    doc.text(`Generated: ${new Date().toLocaleString()} | Total Disposals: ${disposals.length} | Recovered ETB ${totalRecovered.toFixed(2)}`, 105, 24, { align: 'center' })

    const tableData = filteredDisposals.map((d, i) => [
      i + 1,
      d.assetName,
      d.quantity,
      d.disposalMethod,
      d.disposalDate,
      d.committeeLeader,
      d.approvedBy,
      `ETB ${(d.recoveredAmount || 0).toFixed(2)}`
    ])

    autoTable(doc, {
      startY: 30,
      head: [['#', 'Asset Description', 'Qty', 'Method', 'Date', 'Committee Chair', 'Approved By', 'Recovered (ETB)']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [225, 29, 72] }
    })

    doc.save('Asset_Disposals_Register.pdf')
  }

  const exportData = filteredDisposals.map((d) => ({
    'Asset Name': d.assetName,
    'Quantity Disposed': d.quantity,
    'Disposal Method': d.disposalMethod,
    'Disposal Date': d.disposalDate,
    'Committee Leader': d.committeeLeader,
    'Approved By': d.approvedBy,
    'Reason / Justification': d.reason || '—',
    'Recovered Revenue (ETB)': d.recoveredAmount || 0,
    'Status': d.status || 'Completed'
  }))

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight underline decoration-rose-500 decoration-4 underline-offset-8">
            {language === 'AM' ? 'የተወገዱ ንብረቶች (Disposed Assets)' : 'Disposed & Decommissioned Assets'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-3">
            {language === 'AM'
              ? 'በህግ አግባብ የተወገዱ ንብረቶች፣ የኮሚቴ ውሳኔዎች እና የተገኘ ገቢ መዝገብ'
              : 'Decommissioned asset inventory, disposal committee authorizations, and recovered liquidation revenue'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportDropdown data={exportData} filename="Disposed_Assets" onExportPDF={handleExportPDF} />
          {perms.canRecordDisposal ? (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm shadow-xl shadow-rose-600/30 transition-all hover:scale-[1.02]"
            >
              <Plus size={18} />
              <span>{language === 'AM' ? 'ንብረት አስወግድ' : 'Decommission / Dispose Asset'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500">
              <ShieldAlert size={16} className="text-amber-500" />
              <span>{language === 'AM' ? 'የውግጃ ኦዲት እይታ' : 'Disposal Audit View'}</span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'AM' ? 'ጠቅላላ የተወገዱ' : 'Total Disposed'}</span>
            <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-950/40 text-rose-600"><Trash2 size={20} /></div>
          </div>
          <p className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-4">{disposals.length}</p>
          <p className="text-[11px] font-bold text-slate-400 mt-1">Authorized decommissionings</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'AM' ? 'ገቢ የተደረገ ገንዘብ' : 'Recovered Revenue'}</span>
            <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600"><DollarSign size={20} /></div>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-4">ETB {totalRecovered.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p className="text-[11px] font-bold text-slate-400 mt-1">Auction & tender liquidation</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'AM' ? 'በጨረታ ሽያጭ' : 'Public Auction'}</span>
            <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-600"><DollarSign size={20} /></div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-4">{disposals.filter(d => d.disposalMethod === 'Public Auction').length}</p>
          <p className="text-[11px] font-bold text-slate-400 mt-1">Competitive tenders</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'AM' ? 'ውዳቂ / የተወገዱ' : 'Scrap / Destroyed'}</span>
            <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"><Trash2 size={20} /></div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-4">{disposals.filter(d => d.disposalMethod === 'Destruction/Scrap').length}</p>
          <p className="text-[11px] font-bold text-slate-400 mt-1">Non-recoverable scrap</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder={language === 'AM' ? 'በስም፣ ኮሚቴ፣ ወይም ምክንያት ፈልግ...' : 'Search disposed assets by name, committee chair, approved by, reason...'}
            className="w-full pl-12 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-xs outline-none focus:ring-2 focus:ring-rose-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-bold border-none outline-none focus:ring-2 focus:ring-rose-500 w-full md:w-auto"
        >
          <option value="ALL">All Disposal Methods</option>
          {DISPOSAL_METHODS.map(m => (
            <option key={m.id} value={m.id}>{m.labelEn}</option>
          ))}
        </select>
      </div>

      {/* Disposals Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border-2 border-slate-900 dark:border-slate-700">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest">
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'የንብረት ስም' : 'Asset Description'}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'የማስወገጃ ዘዴ' : 'Disposal Method'}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'የውግጃ ኮሚቴ ሰብሳቢ' : 'Committee Chair'}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'ያፀደቀው አካል' : 'Authorized By'}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right">{language === 'AM' ? 'ብዛት' : 'Qty'}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right">{language === 'AM' ? 'ገቢ የተደረገ (ETB)' : 'Recovered (ETB)'}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right">{language === 'AM' ? 'ቀን' : 'Disposal Date'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredDisposals.map((d) => {
                const methodConfig = DISPOSAL_METHODS.find(m => m.id === d.disposalMethod)

                return (
                  <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                      <div>
                        <p className="font-black text-sm text-slate-900 dark:text-white">{d.assetName}</p>
                        {d.reason && (
                          <p className="text-[11px] text-slate-400 italic mt-0.5 truncate max-w-xs">{d.reason}</p>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${methodConfig?.color || 'bg-slate-100 text-slate-700'}`}>
                        {d.disposalMethod}
                      </span>
                    </td>

                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300">
                      {d.committeeLeader}
                    </td>

                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-xs font-bold text-slate-500">
                      {d.approvedBy}
                    </td>

                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right font-black text-sm text-slate-900 dark:text-white">
                      {d.quantity}
                    </td>

                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right font-black text-xs text-emerald-600 dark:text-emerald-400">
                      {d.recoveredAmount ? `ETB ${d.recoveredAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                    </td>

                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right text-xs font-bold text-slate-400">
                      {d.disposalDate}
                    </td>
                  </tr>
                )
              })}

              {filteredDisposals.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400 font-bold text-sm border-2 border-slate-900 dark:border-slate-700">
                    No disposed asset records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disposal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden transform animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
            <header className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-600 rounded-2xl text-white"><Trash2 size={22} /></div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    {language === 'AM' ? 'የንብረት ውግጃ መዝግብ' : 'Record Asset Disposal'}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">Decommission assets under institutional property regulations</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full">✕</button>
            </header>

            <form onSubmit={handleSubmit} className="p-8 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block">
                  Select Asset to Decommission <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={selectedAssetId}
                  onChange={(e) => {
                    const id = parseInt(e.target.value)
                    setSelectedAssetId(id || '')
                    const a = assets.find(x => x.id === id)
                    if (a) setQuantity(Math.min(1, a.quantity))
                  }}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">-- Choose asset --</option>
                  {assets
                    .filter(a => a.disposalStatus !== 'Disposed' && a.quantity > 0)
                    .map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} (Qty Available: {a.quantity} {a.unit}) — Tag: {a.tagNumber || a.id}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block">
                    Quantity to Dispose <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedAsset?.quantity || 1}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block">
                    Disposal Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={disposalMethod}
                    onChange={(e) => setDisposalMethod(e.target.value as any)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    {DISPOSAL_METHODS.map(m => (
                      <option key={m.id} value={m.id}>{m.labelEn}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block">
                    Committee Chair Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Ato Daniel Assefa"
                    value={committeeLeader}
                    onChange={(e) => setCommitteeLeader(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block">
                    Authorizing Body
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Asset Disposal Committee"
                    value={approvedBy}
                    onChange={(e) => setApprovedBy(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block">
                    Recovered Revenue (ETB)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={recoveredAmount}
                    onChange={(e) => setRecoveredAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <EthiopianDatePicker
                    label="Disposal Date"
                    value={disposalDate}
                    onChange={(d) => setDisposalDate(d)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block">
                  Disposal Justification / Reason
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Obsolete technology, beyond economic repair, formal public auction approved"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 px-5 rounded-2xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={18} />
                  <span>Execute Disposal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
