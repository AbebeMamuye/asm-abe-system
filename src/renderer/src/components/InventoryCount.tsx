import React, { useState, useEffect } from 'react'
import { Plus, Search, ClipboardCheck, AlertTriangle, CheckCircle, ArrowDownRight, ArrowUpRight, FileText, UserCheck, Calendar, ShieldCheck, Printer } from 'lucide-react'
import { useStore, InventoryCount as InventoryCountType, TRANSLATIONS, Asset } from '../store/useStore'
import { toEthiopianDate, getCurrentEthiopianDate } from '../lib/ethiopianCalendar'
import EthiopianDatePicker from './EthiopianDatePicker'
import ExportDropdown from './ExportDropdown'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getRolePermissions } from '../lib/permissions'

const InventoryCount = () => {
  const { assets, inventoryCounts, createInventoryCount, fetchInventoryCounts, language, orgName, orgTagline, user } = useStore()
  const perms = getRolePermissions(user?.role)
  const t = TRANSLATIONS[language]

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCount, setSelectedCount] = useState<InventoryCountType | null>(null)

  // Form states
  const [fiscalYear, setFiscalYear] = useState(`${new Date().getFullYear()} E.C. / ${new Date().getFullYear() + 1}`)
  const [countDate, setCountDate] = useState(new Date().toISOString().split('T')[0])
  const [committeeChair, setCommitteeChair] = useState('')
  const [committeeMembers, setCommitteeMembers] = useState('')
  const [autoReconcile, setAutoReconcile] = useState(true)
  const [notes, setNotes] = useState('')

  // Count items state (initialized from assets)
  const [countItems, setCountItems] = useState<{
    assetId: number
    assetName: string
    tagNumber: string
    systemQty: number
    countedQty: number
    condition: string
    remarks: string
  }[]>([])

  useEffect(() => {
    fetchInventoryCounts()
  }, [])

  const handleOpenNewCount = () => {
    const items = assets.map((a) => ({
      assetId: a.id!,
      assetName: a.name,
      tagNumber: a.tagNumber || `ETH-AMS-${(a.id || 0).toString().padStart(5, '0')}`,
      systemQty: a.quantity,
      countedQty: a.quantity, // default to system qty
      condition: a.condition || 'Functional',
      remarks: ''
    }))
    setCountItems(items)
    setFiscalYear(`${toEthiopianDate(new Date()).year} ዓ.ም (በጀት ዓመት)`)
    setCommitteeChair('')
    setCommitteeMembers('')
    setNotes('')
    setIsModalOpen(true)
  }

  const handleItemCountChange = (index: number, val: number) => {
    const updated = [...countItems]
    updated[index].countedQty = Math.max(0, val)
    setCountItems(updated)
  }

  const handleItemConditionChange = (index: number, cond: string) => {
    const updated = [...countItems]
    updated[index].condition = cond
    setCountItems(updated)
  }

  const handleItemRemarksChange = (index: number, rem: string) => {
    const updated = [...countItems]
    updated[index].remarks = rem
    setCountItems(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!committeeChair.trim()) {
      alert(language === 'AM' ? 'እባክዎን የቆጠራ ኮሚቴ ሰብሳቢውን ስም ያስገቡ!' : 'Please enter the Inventory Committee Chair name!')
      return
    }

    const payload = {
      fiscalYear,
      countDate,
      committeeChair,
      committeeMembers,
      status: autoReconcile ? 'Reconciled' : 'Completed',
      notes,
      items: countItems
    }

    await createInventoryCount(payload)
    alert(
      language === 'AM'
        ? 'የዓመታዊ ንብረት ቆጠራ በተሳካ ሁኔታ ተመዝግቧል!'
        : 'Annual Physical Inventory Count recorded successfully!'
    )
    setIsModalOpen(false)
  }

  // Summary stats
  const totalVerified = inventoryCounts.reduce((acc, c) => acc + (c.items?.length || 0), 0)
  const totalShortages = inventoryCounts.reduce((acc, c) => {
    return acc + (c.items?.filter((i) => i.discrepancy < 0).length || 0)
  }, 0)
  const totalSurpluses = inventoryCounts.reduce((acc, c) => {
    return acc + (c.items?.filter((i) => i.discrepancy > 0).length || 0)
  }, 0)

  // PDF Export
  const generatePDF = (count: InventoryCountType) => {
    const doc = new jsPDF()
    const ethDate = toEthiopianDate(new Date(count.countDate))
    const formattedDate = `${ethDate.day}/${ethDate.month}/${ethDate.year} ዓ.ም (${count.countDate})`

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(orgName.toUpperCase(), 105, 18, { align: 'center' })
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(orgTagline, 105, 24, { align: 'center' })

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('ANNUAL PHYSICAL INVENTORY VERIFICATION & RECONCILIATION REPORT', 105, 33, { align: 'center' })
    doc.setFontSize(11)
    doc.text(`የዓመታዊ ንብረት ቆጠራና ልዩነት ማስታረቂያ ቃለ ጉባኤ - ${count.fiscalYear}`, 105, 39, { align: 'center' })

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Count Date (የተቆጠረበት ቀን): ${formattedDate}`, 14, 48)
    doc.text(`Committee Chair (ሰብሳቢ): ${count.committeeChair}`, 14, 54)
    doc.text(`Committee Members (አባላት): ${count.committeeMembers || '—'}`, 14, 60)
    doc.text(`Status (ሁኔታ): ${count.status}`, 140, 48)

    const tableData = (count.items || []).map((it, idx) => [
      idx + 1,
      it.assetName,
      it.systemQty,
      it.countedQty,
      it.discrepancy === 0 ? '0 (Match)' : it.discrepancy > 0 ? `+${it.discrepancy} (Surplus)` : `${it.discrepancy} (Shortage)`,
      it.condition || 'Functional',
      it.remarks || '—'
    ])

    autoTable(doc, {
      startY: 66,
      head: [['#', 'Asset Name (የንብረቱ ስም)', 'System Qty', 'Counted Qty', 'Variance (ልዩነት)', 'Condition', 'Remarks / Finding']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8 }
    })

    const finalY = (doc as any).lastAutoTable?.finalY || 180

    doc.setFontSize(9)
    doc.text('COMMITTEE CERTIFICATION & SIGNATURES (የቆጠራ ኮሚቴ ማረጋገጫና ፊርማ):', 14, finalY + 15)
    doc.text('Committee Chair Signature: _________________________    Date: ______________', 14, finalY + 25)
    doc.text('Internal Auditor / Inspector: _________________________   Date: ______________', 14, finalY + 35)
    doc.text('Storekeeper / Custodian: _________________________       Date: ______________', 14, finalY + 45)

    doc.save(`Inventory_Reconciliation_${count.fiscalYear.replace(/\s+/g, '_')}.pdf`)
  }

  const exportData = inventoryCounts.map((c) => ({
    'Fiscal Year': c.fiscalYear,
    'Count Date': c.countDate,
    'Committee Chair': c.committeeChair,
    'Committee Members': c.committeeMembers,
    'Status': c.status,
    'Total Items Counted': c.items?.length || 0,
    'Shortages': c.items?.filter((i) => i.discrepancy < 0).length || 0,
    'Surpluses': c.items?.filter((i) => i.discrepancy > 0).length || 0
  }))

  const filteredCounts = inventoryCounts.filter(
    (c) =>
      c.fiscalYear.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.committeeChair.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/20">
              <ClipboardCheck size={26} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {t.inventoryCount}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-xs">
                {t.inventoryCountDesc}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ExportDropdown data={exportData} filename="Inventory_Counts_Log" />
          {perms.canManageInventoryCount ? (
            <button
              onClick={handleOpenNewCount}
              className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-slate-900/20 transition-all active:scale-95"
            >
              <Plus size={20} />
              <span>{t.newInventoryCount}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>{language === 'AM' ? 'የቆጠራ ኦዲት እይታ' : 'Audit Inspection View'}</span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards: Control & Transparency */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {language === 'AM' ? 'የተካሄዱ ቆጠራዎች' : 'Total Counts'}
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {inventoryCounts.length}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            <Calendar size={22} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {language === 'AM' ? 'የተረጋገጡ እቃዎች' : 'Items Verified'}
            </p>
            <h3 className="text-2xl font-black text-blue-600 mt-1">{totalVerified}</h3>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600">
            <CheckCircle size={22} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {language === 'AM' ? 'የተገኙ ጉድለቶች' : 'Shortages Found'}
            </p>
            <h3 className="text-2xl font-black text-rose-600 mt-1">{totalShortages}</h3>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600">
            <ArrowDownRight size={22} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {language === 'AM' ? 'የተገኙ ትርፎች' : 'Surpluses Found'}
            </p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{totalSurpluses}</h3>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600">
            <ArrowUpRight size={22} />
          </div>
        </div>
      </div>

      {/* Main Records Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder={language === 'AM' ? 'በበጀት ዓመት ወይም በሰብሳቢ ፈልግ...' : 'Search by year or chair...'}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-xs font-bold text-slate-500">
            {language === 'AM' ? 'ጠቅላላ መዝገቦች:' : 'Total Records:'} {filteredCounts.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border-2 border-slate-900 dark:border-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                  {language === 'AM' ? 'የበጀት ዓመት' : 'Fiscal Year'}
                </th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                  {language === 'AM' ? 'የተቆጠረበት ቀን' : 'Count Date'}
                </th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                  {language === 'AM' ? 'የቆጠራ ኮሚቴ ሰብሳቢ' : 'Committee Chair'}
                </th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                  {language === 'AM' ? 'የእቃዎች ብዛት' : 'Total Items'}
                </th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                  {language === 'AM' ? 'ልዩነት ግኝት' : 'Discrepancies'}
                </th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                  {language === 'AM' ? 'ሁኔታ' : 'Status'}
                </th>
                <th className="px-6 py-4 text-right border-2 border-slate-900 dark:border-slate-700">
                  {t.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 font-bold text-sm">
                    {language === 'AM'
                      ? 'ምንም የተመዘገበ የንብረት ቆጠራ የለም። "አዲስ ዓመታዊ ቆጠራ መዝግብ" የሚለውን በመጫን ይጀምሩ!'
                      : 'No inventory counts recorded yet. Click "New Annual Stock Count" to begin!'}
                  </td>
                </tr>
              ) : (
                filteredCounts.map((count) => {
                  const shortages = count.items?.filter((i) => i.discrepancy < 0).length || 0
                  const surpluses = count.items?.filter((i) => i.discrepancy > 0).length || 0

                  return (
                    <tr key={count.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 font-black text-slate-900 dark:text-white">
                        {count.fiscalYear}
                      </td>
                      <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 text-xs">
                        {count.countDate}
                      </td>
                      <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200 text-xs">
                        {count.committeeChair}
                      </td>
                      <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 font-black text-xs">
                        {count.items?.length || 0} {language === 'AM' ? 'እቃዎች' : 'items'}
                      </td>
                      <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-xs font-bold">
                        {shortages === 0 && surpluses === 0 ? (
                          <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md">
                            {language === 'AM' ? 'ሙሉ በሙሉ ትክክል (No Variance)' : 'Perfect Match'}
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            {shortages > 0 && (
                              <span className="text-rose-600 bg-rose-50 dark:bg-rose-900/20 px-2 py-0.5 rounded text-[11px]">
                                -{shortages} {language === 'AM' ? 'ጉድለት' : 'Short'}
                              </span>
                            )}
                            {surpluses > 0 && (
                              <span className="text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded text-[11px]">
                                +{surpluses} {language === 'AM' ? 'ትርፍ' : 'Surplus'}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white">
                          {count.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right border-2 border-slate-900 dark:border-slate-700">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => generatePDF(count)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg hover:bg-blue-100 font-bold text-xs transition-colors"
                            title="Generate Official Minute PDF"
                          >
                            <Printer size={14} />
                            <span>PDF</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Physical Count Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all flex flex-col max-h-[92vh]">
            <header className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 p-3 rounded-2xl shadow-lg">
                  <ClipboardCheck size={26} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">
                    {language === 'AM' ? 'የዓመታዊ ንብረት ቆጠራና ማስታረቂያ ቅጽ' : 'Annual Physical Inventory Count Form'}
                  </h3>
                  <p className="text-blue-300 text-xs font-bold">
                    {language === 'AM'
                      ? 'የመንግስት ንብረት አስተዳደር መመሪያ ቁጥጥርና ኦዲት ስርዓት'
                      : 'Government Asset Management Verification & Internal Audit Protocol'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              >
                ✕
              </button>
            </header>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-6">
              {/* Committee Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-2">
                    {language === 'AM' ? 'የበጀት ዓመት *' : 'Fiscal Year *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={fiscalYear}
                    onChange={(e) => setFiscalYear(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-2">
                    {language === 'AM' ? 'የቆጠራ ቀን *' : 'Count Date *'}
                  </label>
                  <EthiopianDatePicker value={countDate} onChange={setCountDate} />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-2">
                    {language === 'AM' ? 'የኮሚቴ ሰብሳቢ ስም *' : 'Committee Chair *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ato Bekele Tadesse"
                    value={committeeChair}
                    onChange={(e) => setCommitteeChair(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-2">
                    {language === 'AM' ? 'የኮሚቴ አባላት ስም' : 'Committee Members (Auditor, Storekeeper, etc.)'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. W/ro Almaz (Internal Audit), Ato Yohannes (Property Head)"
                    value={committeeMembers}
                    onChange={(e) => setCommitteeMembers(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Count Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck size={18} className="text-blue-500" />
                    {language === 'AM' ? 'የተቆጠሩ ንብረቶች ዝርዝርና ማስታረቂያ' : 'Asset Physical Count Sheet & Variance'}
                  </h4>
                  <span className="text-xs font-bold text-slate-500">
                    {countItems.length} {language === 'AM' ? 'ንብረቶች ተዘጋጅተዋል' : 'Assets Loaded'}
                  </span>
                </div>

                <div className="border-2 border-slate-900 dark:border-slate-700 rounded-2xl overflow-hidden max-h-80 overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left text-xs border-collapse border-2 border-slate-900 dark:border-slate-700">
                    <thead className="bg-slate-900 text-white font-black uppercase text-[10px] tracking-wider sticky top-0 z-10 border-b-2 border-slate-900 dark:border-slate-700">
                      <tr>
                        <th className="p-3 border-2 border-slate-900 dark:border-slate-700">#</th>
                        <th className="p-3 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'የንብረት ስም እና ታግ' : 'Asset & Tag No'}</th>
                        <th className="p-3 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'በመዝገብ ያለው' : 'System Qty'}</th>
                        <th className="p-3 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'በአካል የተገኘው' : 'Counted Qty'}</th>
                        <th className="p-3 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'ልዩነት' : 'Variance'}</th>
                        <th className="p-3 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'ሁኔታ' : 'Condition'}</th>
                        <th className="p-3 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'ማስታወሻ' : 'Remarks'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {countItems.map((item, idx) => {
                        const variance = Number(item.countedQty) - Number(item.systemQty)

                        return (
                          <tr key={item.assetId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="p-3 font-bold text-slate-400 border-2 border-slate-900 dark:border-slate-700">{idx + 1}</td>
                            <td className="p-3 font-black text-slate-900 dark:text-white border-2 border-slate-900 dark:border-slate-700">
                              <div>{item.assetName}</div>
                              <div className="text-[10px] text-blue-500 font-mono font-bold">{item.tagNumber}</div>
                            </td>
                            <td className="p-3 font-bold text-slate-600 dark:text-slate-300 border-2 border-slate-900 dark:border-slate-700">{item.systemQty}</td>
                            <td className="p-3 border-2 border-slate-900 dark:border-slate-700">
                              <input
                                type="number"
                                min={0}
                                value={item.countedQty}
                                onChange={(e) => handleItemCountChange(idx, parseInt(e.target.value) || 0)}
                                className="w-20 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 font-black text-sm text-center"
                              />
                            </td>
                            <td className="p-3 font-black border-2 border-slate-900 dark:border-slate-700">
                              {variance === 0 ? (
                                <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                                  0 Match
                                </span>
                              ) : variance < 0 ? (
                                <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-[11px]">
                                  {variance} (Shortage)
                                </span>
                              ) : (
                                <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                                  +{variance} (Surplus)
                                </span>
                              )}
                            </td>
                            <td className="p-3 border-2 border-slate-900 dark:border-slate-700">
                              <select
                                value={item.condition}
                                onChange={(e) => handleItemConditionChange(idx, e.target.value)}
                                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 font-bold text-xs"
                              >
                                <option value="Functional">Functional (ተግባራዊ)</option>
                                <option value="Under Maintenance">Under Repair (ጥገና ላይ)</option>
                                <option value="Non-functional">Damaged (የተበላሸ)</option>
                                <option value="Disposed">Scrap / Obsolete (ውዳቂ)</option>
                              </select>
                            </td>
                            <td className="p-3 border-2 border-slate-900 dark:border-slate-700">
                              <input
                                type="text"
                                placeholder={language === 'AM' ? 'ማስታወሻ...' : 'Remarks...'}
                                value={item.remarks}
                                onChange={(e) => handleItemRemarksChange(idx, e.target.value)}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 text-xs"
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Auto Reconcile Checkbox */}
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-black text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                    {language === 'AM' ? 'የመዝገብ ቀሪዎችን በቆጠራው መሰረት አስታርቅ' : 'Auto-Reconcile System Ledger Balances'}
                  </h5>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                    {language === 'AM'
                      ? 'ከተመረጠ፣ ሲስተሙ በቆጠራው የተገኘውን ትክክለኛ ብዛት ወደ መዝገብ አስገብቶ የኦዲት ማስታረቂያ ይመዘግባል።'
                      : 'If checked, system balances will be adjusted to the physical count and an audit transaction will be logged.'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={autoReconcile}
                  onChange={(e) => setAutoReconcile(e.target.checked)}
                  className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-8 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                >
                  {language === 'AM' ? 'ቆጠራውን መዝግብና አጽድቅ' : 'Save & Approve Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default InventoryCount
