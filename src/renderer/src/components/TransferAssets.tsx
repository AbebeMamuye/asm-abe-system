import React, { useState, useEffect } from 'react'
import {
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Clock,
  UserCheck,
  Building2,
  Calendar,
  AlertCircle,
  Tag,
  Eye,
  SendHorizontal
} from 'lucide-react'
import { useStore, AssetTransfer, Asset, TRANSLATIONS } from '../store/useStore'
import ExportDropdown from './ExportDropdown'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getRolePermissions } from '../lib/permissions'
import { toEthiopianDate, getCurrentEthiopianDate } from '../lib/ethiopianCalendar'

export default function TransferAssets() {
  const {
    assets,
    users,
    transfers,
    createTransfer,
    respondTransfer,
    fetchTransfers,
    user,
    language,
    organizationMode
  } = useStore()
  const perms = getRolePermissions(user?.role)

  const t = TRANSLATIONS[language]
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Form states
  const [selectedAssetId, setSelectedAssetId] = useState<string>('')
  const [recipientUserId, setRecipientUserId] = useState<string>('')
  const [targetDepartment, setTargetDepartment] = useState('')
  const [transferReason, setTransferReason] = useState('')
  const [transferNote, setTransferNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchTransfers()
  }, [])

  const pendingTransfers = transfers.filter((t) => t.status === 'Pending')
  const completedTransfers = transfers.filter((t) => t.status === 'Accepted')
  const declinedTransfers = transfers.filter((t) => t.status === 'Declined')

  const handleInitiateTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAssetId || !recipientUserId || !transferReason.trim()) {
      setActionMessage({ type: 'error', text: 'Please complete all required fields.' })
      return
    }

    const selectedAsset = assets.find((a) => a.id?.toString() === selectedAssetId)
    const recipient = users.find((u) => u.id?.toString() === recipientUserId)

    if (!selectedAsset || !recipient) return

    setIsSubmitting(true)
    const fromName = selectedAsset.custodian || user?.name || 'Central Storage'
    const fromId = users.find((u) => u.name === selectedAsset.custodian)?.id || user?.id || null

    try {
      await createTransfer({
        assetId: selectedAsset.id!,
        assetName: selectedAsset.name,
        tagNumber: selectedAsset.tagNumber || `ETH-AMS-${selectedAsset.id}`,
        fromUserId: fromId,
        fromUserName: fromName,
        toUserId: recipient.id!,
        toUserName: recipient.name,
        department: targetDepartment || recipient.department || recipient.departmentCode || '',
        reason: transferReason.trim(),
        note: transferNote.trim()
      })

      setActionMessage({
        type: 'success',
        text: language === 'AM'
          ? `የ ${selectedAsset.name} ዝውውር ጥያቄ ለ ${recipient.name} በተሳካ ሁኔታ ተልኳል!`
          : `Transfer request for ${selectedAsset.name} sent to ${recipient.name} successfully!`
      })

      setSelectedAssetId('')
      setRecipientUserId('')
      setTransferReason('')
      setTransferNote('')
      setTimeout(() => {
        setIsModalOpen(false)
        setActionMessage(null)
      }, 1500)
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to initiate transfer' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRespond = async (transferId: number, status: 'Accepted' | 'Declined') => {
    const confirmMsg = status === 'Accepted'
      ? (language === 'AM' ? 'እርግጠኛ ነዎት ይህን የንብረት ርክክብ መቀበል ይፈልጋሉ?' : 'Accept custody of this asset?')
      : (language === 'AM' ? 'እርግጠኛ ነዎት ይህን የንብረት ዝውውር መከልከል ይፈልጋሉ?' : 'Decline this transfer request?')

    if (confirm(confirmMsg)) {
      await respondTransfer(transferId, status)
      await fetchTransfers()
    }
  }

  const filteredTransfers = transfers.filter((tr) => {
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      tr.assetName.toLowerCase().includes(q) ||
      tr.fromUserName.toLowerCase().includes(q) ||
      tr.toUserName.toLowerCase().includes(q) ||
      (tr.tagNumber && tr.tagNumber.toLowerCase().includes(q)) ||
      (tr.department && tr.department.toLowerCase().includes(q)) ||
      (tr.reason && tr.reason.toLowerCase().includes(q))

    const matchesStatus = statusFilter === 'ALL' || tr.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleExportPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(16); doc.setFont('helvetica', 'bold')
    doc.text('PUBLIC ASSET TRANSFER & CUSTODY HANDOVER REGISTER', 105, 18, { align: 'center' })
    doc.setFontSize(9); doc.setFont('helvetica', 'normal')
    doc.text(`Generated: ${new Date().toLocaleString()} | EC: ${getCurrentEthiopianDate()} ዓ.ም | Total Records: ${transfers.length}`, 105, 24, { align: 'center' })

    const tableData = filteredTransfers.map((tr, i) => [
      i + 1,
      tr.tagNumber || `XFER-${tr.id}`,
      tr.assetName,
      tr.fromUserName,
      tr.toUserName,
      tr.department || '—',
      tr.status || 'Pending',
      tr.transferDate ? toEthiopianDate(tr.transferDate) + ' ዓ.ም' : '—'
    ])

    autoTable(doc, {
      startY: 30,
      head: [['#', 'Tag / Ref', 'Asset Description', 'From Holder', 'To Recipient', 'Department', 'Status', 'Date (ዓ.ም / EC)']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }
    })

    doc.save('Asset_Transfers_Report.pdf')
  }

  const exportData = filteredTransfers.map((tr) => ({
    'Transfer Ref': `XFER-${tr.id}`,
    'Tag Number': tr.tagNumber || '—',
    'Asset Name': tr.assetName,
    'From Custodian': tr.fromUserName,
    'To Recipient': tr.toUserName,
    'Department': tr.department || '—',
    'Reason': tr.reason,
    'Status': tr.status,
    'Transfer Date (ዓ.ም)': tr.transferDate ? toEthiopianDate(tr.transferDate) + ' ዓ.ም' : '—',
    'Response Date (ዓ.ም)': tr.responseDate ? toEthiopianDate(tr.responseDate) + ' ዓ.ም' : '—',
    'Notes': tr.note || '—'
  }))

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight underline decoration-indigo-500 decoration-4 underline-offset-8">
            {organizationMode === 'single'
              ? (language === 'AM' ? 'የተቋሙ የውስጥ ክፍል ዝውውር (Internal Transfer)' : 'Internal Facility Asset Transfer')
              : (language === 'AM' ? 'የንብረት ዝውውር እና ርክክብ (Transfer Assets)' : 'Asset Transfer & Custody Handover')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-3">
            {organizationMode === 'single'
              ? (language === 'AM'
                  ? 'በተቋሙ የውስጥ ክፍሎች (ላብራቶሪ፣ ፋርማሲ፣ ቢሮዎች) እና ባለሙያዎች መካከል ንብረት ማስተላለፍና መቆጣጠር'
                  : 'Transfer assets between internal units, labs, wards, and personnel within the facility')
              : (language === 'AM'
                  ? 'ንብረትን ከሰራተኛ ወደ ሰራተኛ ወይም ከመምሪያ ወደ መምሪያ በይፋ ማስተላለፍና መቆጣጠር'
                  : 'Formal asset custody transfer between personnel, departments, and store locations with audit authorization')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportDropdown data={exportData} filename="Asset_Transfers" onExportPDF={handleExportPDF} />
          {perms.canInitiateTransfer && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              <Plus size={18} />
              <span>{language === 'AM' ? 'አዲስ ዝውውር ጀምር' : 'Initiate Asset Transfer'}</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'AM' ? 'በመጠባበቅ ላይ' : 'Pending Requests'}</span>
            <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-600"><Clock size={20} /></div>
          </div>
          <p className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-4">{pendingTransfers.length}</p>
          <p className="text-[11px] font-bold text-slate-400 mt-1">Awaiting recipient acceptance</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'AM' ? 'የተጠናቀቁ ዝውውሮች' : 'Completed Transfers'}</span>
            <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600"><CheckCircle2 size={20} /></div>
          </div>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-4">{completedTransfers.length}</p>
          <p className="text-[11px] font-bold text-slate-400 mt-1">Custody legally transferred</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'AM' ? 'የተከለከሉ' : 'Declined'}</span>
            <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-950/40 text-rose-600"><XCircle size={20} /></div>
          </div>
          <p className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-4">{declinedTransfers.length}</p>
          <p className="text-[11px] font-bold text-slate-400 mt-1">Rejected by recipient</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'AM' ? 'ጠቅላላ ዝውውር' : 'Total Transfer Logs'}</span>
            <div className="p-2.5 rounded-2xl bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600"><ArrowRightLeft size={20} /></div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-4">{transfers.length}</p>
          <p className="text-[11px] font-bold text-slate-400 mt-1">All audit trail events</p>
        </div>
      </div>

      {/* Pending Transfers Banner (if any) */}
      {pendingTransfers.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 rounded-[2.5rem] p-6 border border-amber-200 dark:border-amber-900/40 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 rounded-xl text-white"><Clock size={20} /></div>
            <h3 className="text-lg font-black text-amber-950 dark:text-amber-200">
              {language === 'AM' ? 'ፈጣን ማረጋገጫ የሚጠብቁ ዝውውሮች' : 'Action Required: Pending Transfer Approvals'}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingTransfers.map((p) => (
              <div key={p.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-amber-100 dark:border-amber-900/20 shadow-sm flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-black text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg">
                      {p.tagNumber || `ASSET #${p.assetId}`}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {p.transferDate ? toEthiopianDate(p.transferDate) + ' ዓ.ም' : 'ዛሬ'}
                    </span>
                  </div>
                  <h4 className="font-black text-sm text-slate-900 dark:text-white mt-1.5">{p.assetName}</h4>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    From: <strong className="text-slate-800 dark:text-slate-200">{p.fromUserName}</strong> ➜ To: <strong className="text-indigo-600 dark:text-indigo-400">{p.toUserName}</strong>
                  </p>
                  <p className="text-xs text-slate-400 italic mt-1 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl">
                    "{p.reason}"
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {perms.canRespondTransfer && (user?.role === 'Admin' || user?.role === 'Manager' || user?.id === p.toUserId || user?.name === p.toUserName) ? (
                    <>
                      <button
                        onClick={() => handleRespond(p.id!, 'Accepted')}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle2 size={14} />
                        <span>Accept Custody</span>
                      </button>
                      <button
                        onClick={() => handleRespond(p.id!, 'Declined')}
                        className="flex-1 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs flex items-center justify-center gap-1.5"
                      >
                        <XCircle size={14} />
                        <span>Decline</span>
                      </button>
                    </>
                  ) : (
                    <div className="text-[11px] text-slate-400 font-bold py-1 text-center w-full">
                      Awaiting {p.toUserName}'s confirmation
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder={language === 'AM' ? 'በስም፣ ታግ፣ ላኪ ወይም ተቀባይ ፈልግ...' : 'Search transfers by asset, tag, sender, recipient, reason...'}
            className="w-full pl-12 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-bold border-none outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-auto"
        >
          <option value="ALL">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Accepted">Accepted</option>
          <option value="Declined">Declined</option>
        </select>
      </div>

      {/* Transfers Audit Log Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border-2 border-slate-900 dark:border-slate-700">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest">
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'ማጣቀሻ / ታግ' : 'Ref / Tag'}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'የንብረት ስም' : 'Asset Description'}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'ከማን (የቀድሞ ኃላፊ)' : 'From (Current Holder)'}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'ለማን (አዲስ ተረካቢ)' : 'To (New Recipient)'}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'ምክንያት' : 'Transfer Justification'}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'ሁኔታ' : 'Status'}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right">{language === 'AM' ? 'ቀን' : 'Date'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTransfers.map((tr) => (
                <tr key={tr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 font-mono font-bold text-xs text-slate-900 dark:text-white">
                    {tr.tagNumber || `XFER-${tr.id}`}
                  </td>

                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 font-black text-sm text-slate-900 dark:text-white">
                    {tr.assetName}
                  </td>

                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300">
                    {tr.fromUserName}
                  </td>

                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-xs font-black text-indigo-600 dark:text-indigo-400">
                    {tr.toUserName}
                  </td>

                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-xs text-slate-500 max-w-xs truncate">
                    {tr.reason}
                  </td>

                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${
                      tr.status === 'Accepted'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : tr.status === 'Declined'
                        ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                    }`}>
                      {tr.status || 'Pending'}
                    </span>
                  </td>

                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right text-xs font-bold text-slate-400">
                    {tr.transferDate ? toEthiopianDate(tr.transferDate) + ' ዓ.ም' : '—'}
                  </td>
                </tr>
              ))}

              {filteredTransfers.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400 font-bold text-sm border-2 border-slate-900 dark:border-slate-700">
                    No transfer records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Initiate Transfer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-6 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <form
            onSubmit={handleInitiateTransfer}
            className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden transform animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
          >
            <header className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-600/20">
                  <ArrowRightLeft size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    {language === 'AM' ? 'የንብረት ዝውውር መዝግብ' : 'Initiate Asset Transfer'}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    {language === 'AM' ? 'ንብረትን ለሌላ ሰራተኛ ወይም ክፍል ማስተላለፍ' : 'Transfer property custody to another staff member or department'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
              >
                ✕
              </button>
            </header>

            <div className="px-8 py-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
              {actionMessage && (
                <div className={`p-4 rounded-2xl text-xs font-black flex items-center gap-2 ${
                  actionMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                }`}>
                  {actionMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span>{actionMessage.text}</span>
                </div>
              )}

              {/* Asset Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block">
                  {language === 'AM' ? 'የሚተላለፈው ንብረት' : 'Select Asset to Transfer'} <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                >
                  <option value="">-- Choose an active asset --</option>
                  {assets
                    .filter((a) => a.disposalStatus !== 'Disposed' && a.condition !== 'Disposed')
                    .map((a) => (
                      <option key={a.id} value={a.id?.toString()}>
                        {a.name} — Tag: {a.tagNumber || a.id} (Current Holder: {a.custodian || 'Store'})
                      </option>
                    ))}
                </select>
              </div>

              {/* Recipient & Destination Department in 2 Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block">
                    {language === 'AM' ? 'ተረካቢ ሰራተኛ' : 'Transfer Recipient (New Custodian)'} <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={recipientUserId}
                    onChange={(e) => {
                      setRecipientUserId(e.target.value)
                      const targetU = users.find(u => u.id?.toString() === e.target.value)
                      if (targetU?.department) setTargetDepartment(targetU.department)
                    }}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  >
                    <option value="">-- Select receiving staff member --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id?.toString()}>
                        {u.name} — {u.position || u.role} ({u.department || u.departmentCode || 'General'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block">
                    {language === 'AM' ? 'ተረካቢ መምሪያ' : 'Destination Department'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. IT Department"
                    value={targetDepartment}
                    onChange={(e) => setTargetDepartment(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block">
                  {language === 'AM' ? 'የዝውውር ምክንያት' : 'Reason for Transfer'} <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Relocated to regional office, role assignment change, project requirements"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block">
                  {language === 'AM' ? 'ተጨማሪ ማስታወሻ' : 'Additional Notes (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder="Condition notes, accessories included, room number..."
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            <footer className="px-8 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/40 backdrop-blur-sm flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="py-3 px-6 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-white dark:hover:bg-slate-800 text-sm transition-all cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-3 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <SendHorizontal size={18} />
                <span>{language === 'AM' ? 'ዝውውሩን ላክ' : 'Submit Transfer'}</span>
              </button>
            </footer>
          </form>
        </div>
      )}
    </div>
  )
}
