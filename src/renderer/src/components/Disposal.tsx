import React, { useState, useEffect } from 'react'
import { Plus, Search, Trash2, ArrowUpRight, DollarSign, Building2, Gift, FileText, CheckCircle, ShieldAlert, Calendar, Printer } from 'lucide-react'
import { useStore, Disposal as DisposalType, TRANSLATIONS, Asset } from '../store/useStore'
import { toEthiopianDate } from '../lib/ethiopianCalendar'
import EthiopianDatePicker from './EthiopianDatePicker'
import ExportDropdown from './ExportDropdown'
import { formatCurrency } from '../lib/finance'
import { getRolePermissions } from '../lib/permissions'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const DISPOSAL_METHODS = [
  { id: 'Public Auction', labelEn: 'Public Auction / Tender', labelAm: 'በግልፅ ጨረታ ሽያጭ', icon: DollarSign },
  { id: 'Transfer', labelEn: 'Transfer to Public Body', labelAm: 'ወደ ሌላ የመንግስት ተቋም ማስተላለፍ', icon: Building2 },
  { id: 'Donation', labelEn: 'Donation', labelAm: 'በስጦታ መስጠት', icon: Gift },
  { id: 'Destruction/Scrap', labelEn: 'Destruction / Scrap', labelAm: 'ማውደም / ውዳቂ (ማስወገድ)', icon: Trash2 }
]

const Disposal = () => {
  const { assets, disposals, createDisposal, fetchDisposals, language, orgName, orgTagline, user } = useStore()
  const t = TRANSLATIONS[language]
  const perms = getRolePermissions(user?.role)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Form states
  const [selectedAssetId, setSelectedAssetId] = useState<number | ''>('')
  const [quantity, setQuantity] = useState<number>(1)
  const [disposalMethod, setDisposalMethod] = useState<'Public Auction' | 'Transfer' | 'Donation' | 'Destruction/Scrap'>('Public Auction')
  const [disposalDate, setDisposalDate] = useState(new Date().toISOString().split('T')[0])
  const [committeeLeader, setCommitteeLeader] = useState('')
  const [approvedBy, setApprovedBy] = useState('')
  const [reason, setReason] = useState('')
  const [recoveredAmount, setRecoveredAmount] = useState<number>(0)

  useEffect(() => {
    fetchDisposals()
  }, [])

  const selectedAsset = assets.find((a) => a.id === selectedAssetId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedAssetId || !selectedAsset) {
      alert(language === 'AM' ? 'እባክዎን የሚወገደውን ንብረት ይምረጡ!' : 'Please select an asset to dispose!')
      return
    }

    if (quantity <= 0 || quantity > selectedAsset.quantity) {
      alert(
        language === 'AM'
          ? `የሚወገደው ብዛት ከ 1 እስከ ${selectedAsset.quantity} መሆን አለበት!`
          : `Disposal quantity must be between 1 and ${selectedAsset.quantity}!`
      )
      return
    }

    if (!committeeLeader.trim()) {
      alert(language === 'AM' ? 'እባክዎን የውግጃ ኮሚቴ መሪውን ስም ያስገቡ!' : 'Please enter the Disposal Committee Leader name!')
      return
    }

    const payload = {
      assetId: selectedAsset.id,
      assetName: selectedAsset.name,
      quantity,
      disposalMethod,
      disposalDate,
      committeeLeader,
      approvedBy: approvedBy || 'Authorized Officer',
      reason,
      recoveredAmount: Number(recoveredAmount) || 0,
      status: 'Completed'
    }

    await createDisposal(payload)
    alert(
      language === 'AM'
        ? 'የንብረት ውግጃው በመንግስት መመሪያ መሰረት በተሳካ ሁኔታ ተመዝግቧል!'
        : 'Asset disposal recorded successfully in accordance with regulations!'
    )
    setIsModalOpen(false)
    setSelectedAssetId('')
    setQuantity(1)
    setReason('')
    setRecoveredAmount(0)
  }

  // Summary statistics
  const totalDisposedItems = disposals.reduce((sum, d) => sum + d.quantity, 0)
  const totalRevenue = disposals.reduce((sum, d) => sum + (d.recoveredAmount || 0), 0)
  const auctionCount = disposals.filter((d) => d.disposalMethod === 'Public Auction').length
  const transferCount = disposals.filter((d) => d.disposalMethod === 'Transfer').length

  // Generate PDF Certificate
  const generatePDF = (disp: DisposalType) => {
    const doc = new jsPDF()
    const ethDate = toEthiopianDate(new Date(disp.disposalDate))
    const formattedDate = `${ethDate.day}/${ethDate.month}/${ethDate.year} ዓ.ም (${disp.disposalDate})`

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(orgName.toUpperCase(), 105, 18, { align: 'center' })
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(orgTagline, 105, 24, { align: 'center' })

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('PUBLIC PROPERTY DISPOSAL & DECOMMISSIONING CERTIFICATE', 105, 34, { align: 'center' })
    doc.setFontSize(11)
    doc.text('የመንግስት ንብረት ማስወገጃ እና ውግጃ ቃለ ጉባኤ ሰነድ', 105, 40, { align: 'center' })

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Disposal Date (ቀን): ${formattedDate}`, 14, 52)
    doc.text(`Disposal Method (የማስወገጃ ዘዴ): ${disp.disposalMethod}`, 14, 58)
    doc.text(`Committee Leader (የውግጃ ኮሚቴ መሪ): ${disp.committeeLeader}`, 14, 64)
    doc.text(`Approved By (የፈቀደው ኃላፊ): ${disp.approvedBy || '—'}`, 14, 70)

    const tableData = [
      ['1', disp.assetName, disp.quantity.toString(), disp.disposalMethod, formatCurrency(disp.recoveredAmount || 0), disp.reason || 'Decommissioned by Committee']
    ]

    autoTable(doc, {
      startY: 78,
      head: [['#', 'Asset Name (የንብረቱ ስም)', 'Disposed Qty', 'Method', 'Recovered Revenue (ገቢ)', 'Justification / Reason']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' }
    })

    const finalY = (doc as any).lastAutoTable?.finalY || 160

    doc.setFontSize(9)
    doc.text('LEGAL DECLARATION & AUDIT VERIFICATION (የህጋዊነት ማረጋገጫና ፊርማ):', 14, finalY + 15)
    doc.text('Certified that the aforementioned public property has been inspected and disposed of pursuant', 14, finalY + 22)
    doc.text('to Federal/Regional Public Property Administration Directives.', 14, finalY + 28)

    doc.text('Disposal Committee Chair: _______________________      Date: ______________', 14, finalY + 40)
    doc.text('Property Administration Head: ___________________     Date: ______________', 14, finalY + 50)
    doc.text('Internal Auditor / Inspection: _____________________   Date: ______________', 14, finalY + 60)

    doc.save(`Disposal_Certificate_${disp.id}_${disp.assetName.replace(/\s+/g, '_')}.pdf`)
  }

  const exportData = disposals.map((d) => ({
    'Asset Name': d.assetName,
    'Quantity': d.quantity,
    'Disposal Method': d.disposalMethod,
    'Disposal Date': d.disposalDate,
    'Committee Leader': d.committeeLeader,
    'Approved By': d.approvedBy,
    'Recovered Revenue (ETB)': d.recoveredAmount || 0,
    'Reason': d.reason
  }))

  const filteredDisposals = disposals.filter(
    (d) =>
      d.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.disposalMethod.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.committeeLeader.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-600 rounded-2xl text-white shadow-lg shadow-rose-500/20">
              <Trash2 size={26} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {t.disposal}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-xs">
                {t.disposalDesc}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ExportDropdown data={exportData} filename="Asset_Disposal_Log" />
          {perms.canRecordDisposal && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-slate-900/20 transition-all active:scale-95"
            >
              <Plus size={20} />
              <span>{t.newDisposal}</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {language === 'AM' ? 'የተወገዱ ንብረቶች ብዛት' : 'Total Disposed Units'}
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {totalDisposedItems}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600">
            <Trash2 size={22} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {language === 'AM' ? 'በጨረታ የተሸጡ' : 'Public Auctions'}
            </p>
            <h3 className="text-2xl font-black text-blue-600 mt-1">{auctionCount}</h3>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600">
            <DollarSign size={22} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {language === 'AM' ? 'ለሌላ ተቋም የተላለፉ' : 'Transfers'}
            </p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{transferCount}</h3>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600">
            <Building2 size={22} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {language === 'AM' ? 'ገቢ የተደረገ ገንዘብ' : 'Recovered Revenue'}
            </p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{formatCurrency(totalRevenue)}</h3>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600">
            <ArrowUpRight size={22} />
          </div>
        </div>
      </div>

      {/* Disposals Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder={language === 'AM' ? 'በንብረት ስም፣ በማስወገጃ ዘዴ ወይም በኮሚቴ ፈልግ...' : 'Search disposals...'}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-xs font-bold text-slate-500">
            {language === 'AM' ? 'ጠቅላላ የውግጃ መዝገቦች:' : 'Total Records:'} {filteredDisposals.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border-2 border-slate-900 dark:border-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                  {language === 'AM' ? 'የንብረቱ ስም' : 'Asset Name'}
                </th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                  {language === 'AM' ? 'ብዛት' : 'Qty'}
                </th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                  {language === 'AM' ? 'የማስወገጃ ዘዴ' : 'Disposal Method'}
                </th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                  {language === 'AM' ? 'የተወገደበት ቀን' : 'Disposal Date'}
                </th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                  {language === 'AM' ? 'የኮሚቴ መሪ' : 'Committee Leader'}
                </th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                  {language === 'AM' ? 'ገቢ የተደረገ' : 'Recovered (ETB)'}
                </th>
                <th className="px-6 py-4 text-right border-2 border-slate-900 dark:border-slate-700">
                  {t.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredDisposals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 font-bold text-sm">
                    {language === 'AM'
                      ? 'ምንም የተወገደ ንብረት የለም። "ንብረት አስወግድ / ውግጃ መዝግብ" የሚለውን በመጫን ይጀምሩ!'
                      : 'No asset disposals recorded yet. Click "Decommission / Dispose Asset" to add!'}
                  </td>
                </tr>
              ) : (
                filteredDisposals.map((disp) => (
                  <tr key={disp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 font-black text-slate-900 dark:text-white">
                      <div>{disp.assetName}</div>
                      <div className="text-[10px] text-slate-400 font-bold italic">{disp.reason || 'Decommissioned'}</div>
                    </td>
                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 font-black text-rose-600">
                      {disp.quantity}
                    </td>
                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 font-bold text-xs">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-black bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        {disp.disposalMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 font-bold text-xs text-slate-600 dark:text-slate-400">
                      {disp.disposalDate}
                    </td>
                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 font-bold text-xs">
                      {disp.committeeLeader}
                    </td>
                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 font-black text-emerald-600">
                      {formatCurrency(disp.recoveredAmount || 0)}
                    </td>
                    <td className="px-6 py-4 text-right border-2 border-slate-900 dark:border-slate-700">
                      <button
                        onClick={() => generatePDF(disp)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg hover:bg-blue-100 font-bold text-xs transition-colors ml-auto"
                        title="Print Certificate"
                      >
                        <Printer size={14} />
                        <span>PDF</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Asset Disposal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all flex flex-col max-h-[92vh]">
            <header className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-4">
                <div className="bg-rose-600 p-3 rounded-2xl shadow-lg">
                  <Trash2 size={26} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">
                    {language === 'AM' ? 'የመንግስት ንብረት ማስወገጃና ውግጃ ቅጽ' : 'Government Asset Disposal / Decommissioning Form'}
                  </h3>
                  <p className="text-rose-300 text-xs font-bold">
                    {language === 'AM'
                      ? 'በኢትዮጵያ መንግስት ንብረት አስተዳደር ህግና መመሪያ መሰረት የሚሞላ'
                      : 'Pursuant to Ethiopian Public Property Administration Directives'}
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
              {/* Select Asset */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-2">
                    {language === 'AM' ? 'የሚወገደውን ንብረት ይምረጡ *' : 'Select Asset *'}
                  </label>
                  <select
                    required
                    value={selectedAssetId}
                    onChange={(e) => {
                      const id = parseInt(e.target.value)
                      setSelectedAssetId(id || '')
                      const found = assets.find((a) => a.id === id)
                      if (found) setQuantity(1)
                    }}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="">-- {language === 'AM' ? 'ንብረት ይምረጡ' : 'Choose an Asset'} --</option>
                    {assets
                      .filter((a) => a.quantity > 0)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.tagNumber || `ID:${a.id}`}) - {a.quantity} {a.unit}s Available
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-2">
                    {language === 'AM' ? 'የሚወገደው ብዛት *' : 'Quantity to Dispose *'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={selectedAsset?.quantity || 1}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-rose-500"
                  />
                  {selectedAsset && (
                    <span className="text-[11px] text-slate-500 font-bold mt-1 block">
                      {language === 'AM' ? 'በአሁኑ ጊዜ በመዝገብ ያለው:' : 'Current Available Stock:'} {selectedAsset.quantity} {selectedAsset.unit}
                    </span>
                  )}
                </div>
              </div>

              {/* Disposal Method & Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-2">
                    {language === 'AM' ? 'የማስወገጃ ዘዴ (በህጉ መሰረት) *' : 'Disposal Method *'}
                  </label>
                  <select
                    value={disposalMethod}
                    onChange={(e) => setDisposalMethod(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-rose-500"
                  >
                    {DISPOSAL_METHODS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {language === 'AM' ? m.labelAm : m.labelEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-2">
                    {language === 'AM' ? 'የተወገደበት ቀን *' : 'Disposal Date *'}
                  </label>
                  <EthiopianDatePicker value={disposalDate} onChange={setDisposalDate} />
                </div>
              </div>

              {/* Authority & Revenue */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-2">
                    {language === 'AM' ? 'የውግጃ ኮሚቴ ሰብሳቢ *' : 'Committee Leader *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ato Girma Kebede"
                    value={committeeLeader}
                    onChange={(e) => setCommitteeLeader(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-2">
                    {language === 'AM' ? 'ያረጋገጠው/የፈቀደው ኃላፊ' : 'Approving Officer'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Head of Organization"
                    value={approvedBy}
                    onChange={(e) => setApprovedBy(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-2">
                    {language === 'AM' ? 'ገቢ የተደረገ ገንዘብ (ብር)' : 'Recovered Revenue (ETB)'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={recoveredAmount}
                    onChange={(e) => setRecoveredAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Justification / Reason */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-2">
                  {language === 'AM' ? 'የውግጃ ምክንያት / የኮሚቴ ግኝት ማብራሪያ' : 'Justification & Legal Finding'}
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    language === 'AM'
                      ? 'ለምሳሌ፡ ዕድሜው ያለፈበትና ለመጠገን አዋጭ ያልሆነ፣ የተበላሸ ወይም ከመጠን በላይ ትርፍ የሆነ...'
                      : 'e.g. Unserviceable, uneconomical to repair, obsolete, or surplus to requirements...'
                  }
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-rose-500"
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
                  disabled={!perms.canRecordDisposal}
                  className="px-8 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm shadow-lg shadow-rose-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {language === 'AM' ? 'ውግጃውን መዝግብና ሰነድ አውጣ' : 'Confirm & Decommission Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Disposal
