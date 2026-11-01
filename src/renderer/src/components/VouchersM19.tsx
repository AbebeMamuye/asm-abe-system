import React, { useState, useEffect } from 'react'
import { Plus, Search, Printer, Package, Trash2, ArrowDownLeft, ShieldCheck } from 'lucide-react'
import { useStore, Voucher19, VoucherItem, TRANSLATIONS } from '../store/useStore'
import { toEthiopianDate, getCurrentEthiopianDate } from '../lib/ethiopianCalendar'
import EthiopianDatePicker from './EthiopianDatePicker'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import QRCode from 'qrcode'
import ExportDropdown from './ExportDropdown'
import { getRolePermissions } from '../lib/permissions'

const VouchersM19 = () => {
  const { assets, vouchersM19, createVoucherM19, fetchAssets, orgName, orgTagline, language, user } = useStore()
  const perms = getRolePermissions(user?.role)
  const t = TRANSLATIONS[language]
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const ethiopianDate = getCurrentEthiopianDate()

  const filteredVouchers = vouchersM19.filter(v =>
    v.voucherNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.receivedFrom.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => { fetchAssets() }, [])

  const [voucherNumber, setVoucherNumber] = useState('')
  const [receivedFrom, setReceivedFrom] = useState('')
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0])
  const [storeNo, setStoreNo] = useState('')
  const [shelfNo, setShelfNo] = useState('')
  const [classification, setClassification] = useState('Standard')
  const [expenditureNo, setExpenditureNo] = useState('')
  const [incomingNo, setIncomingNo] = useState('')
  const [note, setNote] = useState('')
  const [items, setItems] = useState<Partial<VoucherItem>[]>([])
  const [selectedAssetId, setSelectedAssetId] = useState<string>('')
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1)
  const [selectedPrice, setSelectedPrice] = useState<number>(0)
  const [selectedModel, setSelectedModel] = useState('')
  const [selectedSerial, setSelectedSerial] = useState('')
  const [selectedPageFrom, setSelectedPageFrom] = useState('')
  const [selectedPageTo, setSelectedPageTo] = useState('')

  useEffect(() => {
    if (isModalOpen && window.api) {
      window.api.getNextVoucherNumber('MODEL19').then(setVoucherNumber)
    }
  }, [isModalOpen])

  const handleAddItem = () => {
    const asset = assets.find(a => a.id?.toString() === selectedAssetId)
    if (!asset) return
    const newItem: Partial<VoucherItem> = {
      assetId: asset.id,
      assetName: asset.name,
      model: selectedModel || asset.serialNumber?.split('/')[0] || '—',
      serial: selectedSerial || asset.serialNumber || '—',
      pageFrom: selectedPageFrom || '—',
      pageTo: selectedPageTo || '—',
      unit: asset.unit,
      quantity: selectedQuantity,
      unitCost: selectedPrice || asset.unitCost,
      totalCost: selectedQuantity * (selectedPrice || asset.unitCost)
    }
    setItems([...items, newItem])
    setSelectedAssetId('')
    setSelectedQuantity(1)
    setSelectedPrice(0)
    setSelectedModel('')
    setSelectedSerial('')
    setSelectedPageFrom('')
    setSelectedPageTo('')
  }

  const handleRemoveItem = (index: number) => setItems(items.filter((_, i) => i !== index))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!receivedFrom.trim()) {
      alert(language === 'AM' ? 'እባክዎን የተቀበሉበትን ስም ያስገቡ!' : 'Please enter who you received from!')
      return
    }

    if (items.length === 0) {
      alert(language === 'AM' ? 'ቢያንስ አንድ ንብረት መጨመር አለብዎት!' : 'Please add at least one item to the list!')
      return
    }

    const voucher: Voucher19 = {
      voucherNumber, receivedFrom, receivedDate, storeNo, shelfNo,
      classification, expenditureNo, incomingNo, note,
      items: items as VoucherItem[],
      receivedBy: 'Property Manager'
    }
    await createVoucherM19(voucher)
    alert(language === 'AM' ? 'ሞዴል 19 በተሳካ ሁኔታ ተመዝግቧል!' : 'Model 19 Receipt recorded successfully!')
    setIsModalOpen(false)
    resetForm()
  }

  const resetForm = () => {
    setReceivedFrom(''); setStoreNo(''); setShelfNo('')
    setExpenditureNo(''); setIncomingNo(''); setItems([]); setNote('')
  }

  // ── Official Triplicate PDF Generation (3 Copies: Recipient, Finance, Store) ──
  const generatePDF = async (voucher: Voucher19) => {
    const doc = new jsPDF()
    const eDate = toEthiopianDate(voucher.receivedDate)
    const gcDate = new Date(voucher.receivedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    const sanitize = (text: string | undefined) => text ? text.replace(/[^\x00-\x7F]/g, "").trim() : ''

    const totalCost = voucher.items.reduce((sum, item) => sum + (item.totalCost || (item.quantity * item.unitCost)), 0)

    // Generate Verification QR Code
    const qrPayload = JSON.stringify({
      doc: 'MODEL19',
      voucherNo: voucher.voucherNumber,
      date: voucher.receivedDate,
      receivedFrom: voucher.receivedFrom,
      itemsCount: voucher.items.length,
      totalCost: totalCost.toFixed(2),
      verifySeal: `ETH-AMIS-M19-${voucher.voucherNumber}`
    })
    const qrDataUrl = await QRCode.toDataURL(qrPayload, { width: 120, margin: 1 })

    const copies = [
      {
        badge: 'ORIGINAL — RECIPIENT COPY (1ኛ ኮፒ - ለተረካቢ)',
        watermarkColor: [240, 244, 255],
        badgeColor: [37, 99, 235], // Blue
        desc: 'Official receipt delivered to the person / supplier who delivered the items.'
      },
      {
        badge: 'COPY 2 — FINANCE & ACCOUNTS (2ኛ ኮፒ - ለፋይናንስና ሂሳብ ክፍል)',
        watermarkColor: [254, 252, 232],
        badgeColor: [202, 138, 4], // Amber/Yellow
        desc: 'Official audit copy transmitted to Finance for general ledger reconciliation.'
      },
      {
        badge: 'COPY 3 — STORE KEEPER ARCHIVE (3ኛ ኮፒ - ለንብረት ክፍል መዝገብ)',
        watermarkColor: [240, 253, 244],
        badgeColor: [22, 163, 74], // Green
        desc: 'Permanent record maintained by Store Keeper for annual inventory verification.'
      }
    ]

    copies.forEach((copy, index) => {
      if (index > 0) doc.addPage()

      // Copy Badge Header Banner
      doc.setFillColor(copy.badgeColor[0], copy.badgeColor[1], copy.badgeColor[2])
      doc.rect(14, 8, 182, 6, 'F')
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
      doc.text(copy.badge, 105, 12.5, { align: 'center' })

      // Header Meta
      doc.setFontSize(8)
      doc.setTextColor(100)
      doc.setFont('helvetica', 'normal')
      doc.text('Form: Model 19 (Goods Receiving Voucher)', 14, 18)
      doc.text('Serial: MoF/AMIS/M19', 145, 18)
      doc.setFontSize(10)
      doc.setTextColor(0)
      doc.setFont('helvetica', 'bold')
      doc.text(`No. ${sanitize(voucher.voucherNumber)}`, 145, 24)

      // Organization Title
      doc.setFontSize(14)
      doc.setTextColor(15, 23, 42)
      doc.setFont('helvetica', 'bold')
      doc.text(sanitize(orgName).toUpperCase() || 'PUBLIC PROPERTY ADMINISTRATION', 105, 28, { align: 'center' })

      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100)
      doc.text(sanitize(orgTagline).toUpperCase() || 'PROPERTY MANAGEMENT & INVENTORY CONTROL', 105, 33, { align: 'center' })

      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(30, 41, 59)
      doc.text('RECEIPT FOR ARTICLES / PROPERTY RECEIVED INTO STORE', 105, 41, { align: 'center' })

      // Top Separator line
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.4)
      doc.line(14, 44, 196, 44)

      // Reference fields box
      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(50)
      doc.text(`Received From: ${sanitize(voucher.receivedFrom)}`, 14, 50)
      doc.text(`Date (Gregorian): ${gcDate}`, 14, 56)
      if (eDate) doc.text(`Date (Ethiopian): ${eDate} E.C.`, 14, 62)

      doc.text(`(1) Expenditure Registry No: ${sanitize(voucher.expenditureNo) || '—'}`, 110, 50)
      doc.text(`(2) Incoming Register No: ${sanitize(voucher.incomingNo) || '—'}`, 110, 56)
      doc.text(`(3) Classification: ${sanitize(voucher.classification) || 'Standard'}`, 110, 62)
      doc.text(`(4) Store / Shelf No: ${sanitize(voucher.storeNo) || '—'} / ${sanitize(voucher.shelfNo) || '—'}`, 110, 68)

      // Items table
      const tableData = voucher.items.map((item, idx) => [
        idx + 1,
        sanitize(item.assetName),
        sanitize(item.model) || '—',
        sanitize(item.serial) || '—',
        `${sanitize(item.pageFrom) || '—'} - ${sanitize(item.pageTo) || '—'}`,
        item.quantity,
        item.unitCost.toFixed(2),
        item.totalCost.toFixed(2)
      ])

      autoTable(doc, {
        startY: 73,
        head: [['#', 'Description of Property', 'Model', 'Serial / Tag', 'Page Ref.', 'Qty', 'Unit Cost (ETB)', 'Total Cost (ETB)']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        foot: [[
          '', 'TOTAL VALUE (ETB)', '', '', '',
          voucher.items.reduce((acc, it) => acc + it.quantity, 0),
          '',
          totalCost.toFixed(2)
        ]],
        footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 7.5 }
      })

      const finalY = (doc as any).lastAutoTable.finalY + 14

      // Signatures
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(40)
      doc.text('Delivered By: __________________________', 14, finalY)
      doc.text('Received By: ___________________________', 14, finalY + 12)
      doc.text('Storekeeper: ___________________________', 14, finalY + 24)

      doc.text('Authorized By (Approver): ________________', 90, finalY)
      doc.text(`Approval Seal / PIN: [ VERIFIED DIGITAL ]`, 90, finalY + 12)
      doc.text(`Date of Entry: ${gcDate}`, 90, finalY + 24)

      // Embed Verification QR Code
      try {
        doc.addImage(qrDataUrl, 'PNG', 160, finalY - 4, 32, 32)
        doc.setFontSize(6)
        doc.setTextColor(100)
        doc.text('SCAN TO VERIFY', 176, finalY + 31, { align: 'center' })
      } catch (qrErr) {
        console.warn('QR image embed error:', qrErr)
      }

      // Footer
      doc.setFontSize(6.5)
      doc.setTextColor(140)
      doc.text(
        `${sanitize(orgName)} | Ethiopian Government AMIS Form Model 19 | Copy ${index + 1} of 3 | Ref: ${sanitize(voucher.voucherNumber)}`,
        105,
        287,
        { align: 'center' }
      )
    })

    doc.save(`Official_Model19_Triplicate_${sanitize(voucher.voucherNumber)}.pdf`)
  }

  const exportData = vouchersM19.map(v => ({
    'Voucher Number': v.voucherNumber,
    'Received From': v.receivedFrom,
    'Date': v.receivedDate,
    'Store No': v.storeNo || 'N/A',
    'Shelf No': v.shelfNo || 'N/A',
    'Classification': v.classification || 'Standard',
    'Total Items': v.items.length,
    'Total Cost': v.items.reduce((acc, item) => acc + item.totalCost, 0).toFixed(2)
  }))

  const generateFullPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(18); doc.text('STOCK-IN RECEIPTS LOG (MODEL 19)', 105, 20, { align: 'center' })
    const tableData = vouchersM19.map((v, i) => [
      i + 1, v.voucherNumber, v.receivedFrom, v.receivedDate, v.items.length, v.items.reduce((acc, item) => acc + item.totalCost, 0).toFixed(2)
    ])
    autoTable(doc, {
      startY: 30,
      head: [['#', 'Voucher #', 'Supplier', 'Date', 'Items', 'Total Cost']],
      body: tableData,
      theme: 'grid', headStyles: { fillColor: [30, 41, 59] }
    })
    doc.save('M19_Receipts_Log.pdf')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight underline decoration-blue-500 decoration-2 underline-offset-4">
            Stock-In Receipt (Model 19)
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
            Record all incoming assets and property | {ethiopianDate}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportDropdown data={exportData} filename="M19_StockIn_Receipts" onExportPDF={generateFullPDF} />
          {perms.canCreateM19 ? (
            <button
              id="btn-new-m19"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-slate-500/20 transition-all active:scale-95"
            >
              <Plus size={20} />
              <span>New Receipt (M19)</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>{language === 'AM' ? 'የገቢ ደረሰኝ ኦዲት እይታ' : 'Audit Inspection View'}</span>
            </div>
          )}
        </div>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center bg-slate-50/50 dark:bg-slate-800/30">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              id="m19-search"
              type="text"
              placeholder="Search by voucher or supplier..."
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border-2 border-slate-900 dark:border-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">Voucher No</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">Received From / Supplier</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">Details</th>
                <th className="px-6 py-4 text-right border-2 border-slate-900 dark:border-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVouchers.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                    <div className="font-black text-slate-900 dark:text-white text-sm">{v.voucherNumber}</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">
                      {new Date(v.receivedDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{v.receivedFrom}</span>
                  </td>
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                    <div className="text-xs font-bold text-slate-600 dark:text-slate-400">Store: {v.storeNo || '—'}</div>
                    <div className="text-[10px] font-medium text-slate-400">Shelf: {v.shelfNo || '—'}</div>
                  </td>
                  <td className="px-6 py-4 text-right border-2 border-slate-900 dark:border-slate-700">
                    <button
                      id={`btn-print-m19-${v.id}`}
                      onClick={() => generatePDF(v)}
                      className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors cursor-pointer"
                    >
                      <Printer size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredVouchers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-slate-400 border-2 border-slate-900 dark:border-slate-700">
                    <ArrowDownLeft size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="font-bold italic text-sm">No stock-in receipts recorded yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
            <header className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500 p-2 rounded-xl shadow-lg shadow-blue-500/20"><ArrowDownLeft size={24} /></div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">{t.model19}</h3>
                  <p className="text-blue-300 text-[10px] font-black uppercase tracking-widest">{t.receiptForm}</p>
                </div>
              </div>
              <button id="m19-modal-close" onClick={() => setIsModalOpen(false)} className="hover:bg-white/10 p-2 rounded-full transition-colors">
                <Plus size={24} className="rotate-45" />
              </button>
            </header>

            <form id="m19-form" onSubmit={handleSubmit} className="flex-1 overflow-auto p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t.voucherNo} <span className="text-red-500">*</span></label>
                  <input type="text" required className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 font-mono text-sm" value={voucherNumber} onChange={(e) => setVoucherNumber(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest underline decoration-blue-500">{t.receivedFrom} <span className="text-red-500">*</span></label>
                  <input id="m19-received-from" type="text" required className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 font-bold text-sm" placeholder="Name of supplier..." value={receivedFrom} onChange={(e) => setReceivedFrom(e.target.value)} />
                </div>
                <EthiopianDatePicker label={<span>Receipt Date <span className="text-red-500">*</span></span>} value={receivedDate} onChange={setReceivedDate} />
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t.classification}</label>
                  <input id="m19-classification" type="text" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm" value={classification} onChange={(e) => setClassification(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t.expenditureNo}</label>
                  <input id="m19-expenditure-no" type="text" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm" value={expenditureNo} onChange={(e) => setExpenditureNo(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t.incomingNo}</label>
                  <input id="m19-incoming-no" type="text" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm" value={incomingNo} onChange={(e) => setIncomingNo(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t.storeNo}</label>
                  <input id="m19-store-no" type="text" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm" value={storeNo} onChange={(e) => setStoreNo(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t.shelfNo}</label>
                  <input id="m19-shelf-no" type="text" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm" value={shelfNo} onChange={(e) => setShelfNo(e.target.value)} />
                </div>
              </div>

              {/* Item Selection */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest underline decoration-blue-500">Asset / Property Details</h4>
                  <p className="text-[10px] text-slate-400 mt-1">Fill in the details for each asset being received, then click "Add to List".</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest border-l-2 border-blue-500 pl-2">
                      {language === 'AM' ? 'የንብረቱ ስም (እቃ)' : 'Asset / Property'} <span className="text-red-500">*</span>
                    </label>
                    <select id="m19-asset-select" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold" value={selectedAssetId} onChange={(e) => setSelectedAssetId(e.target.value)}>
                      <option value="">{language === 'AM' ? '-- ንብረት ይምረጡ --' : 'Select Asset / Property...'}</option>
                      {assets.length === 0
                        ? <option disabled>{language === 'AM' ? 'ምንም ንብረት አልተመዘገበም' : 'No assets registered. Add assets in Property Registry first.'}</option>
                        : assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.unit})</option>)
                      }
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest border-l-2 border-blue-500 pl-2">
                      {language === 'AM' ? 'ሞዴል' : 'Model No.'}
                    </label>
                    <input type="text" placeholder="e.g. HP-X360" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm" value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest border-l-2 border-blue-500 pl-2">
                      {language === 'AM' ? 'ሲሪያል ቁጥር' : 'Serial No.'}
                    </label>
                    <input type="text" placeholder="e.g. SN-00123" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm" value={selectedSerial} onChange={(e) => setSelectedSerial(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest border-l-2 border-blue-500 pl-2">
                      {language === 'AM' ? 'ከገጽ – እስከ ገጽ' : 'Page No. (From – To)'}
                    </label>
                    <div className="flex gap-1">
                      <input type="text" placeholder="From" className="w-1/2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2.5 text-xs" value={selectedPageFrom} onChange={(e) => setSelectedPageFrom(e.target.value)} />
                      <input type="text" placeholder="To" className="w-1/2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2.5 text-xs" value={selectedPageTo} onChange={(e) => setSelectedPageTo(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="m19-qty" className="text-[9px] font-black uppercase text-slate-400 tracking-widest border-l-2 border-blue-500 pl-2">
                      {language === 'AM' ? 'ብዛት' : 'Quantity'} <span className="text-red-500">*</span>
                    </label>
                    <input id="m19-qty" type="number" placeholder="0" min="1" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-black" value={selectedQuantity} onChange={(e) => setSelectedQuantity(parseInt(e.target.value) || 0)} />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="m19-price" className="text-[9px] font-black uppercase text-slate-400 tracking-widest border-l-2 border-amber-500 pl-2">
                      {language === 'AM' ? 'ያንዱ ዋጋ (ብር)' : 'Unit Cost (ETB)'} <span className="text-red-500">*</span>
                    </label>
                    <input id="m19-price" type="number" placeholder="0.00" min="0" step="0.01" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-amber-700/50 rounded-xl px-3 py-2.5 text-sm font-black" value={selectedPrice} onChange={(e) => setSelectedPrice(parseFloat(e.target.value) || 0)} />
                  </div>
                </div>
                <button id="m19-add-item" type="button" onClick={handleAddItem} disabled={!selectedAssetId} className="w-full mt-4 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-500/20 py-2.5 transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
                  <Plus size={18} /> {language === 'AM' ? 'ንብረት ጨምር' : 'Add to List'}
                </button>
              </div>

              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Package size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white">{item.assetName}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">
                          MOD: {item.model} · SN: {item.serial} · PG: {item.pageFrom}-{item.pageTo}
                        </p>
                        <p className="text-[10px] text-blue-500 font-bold uppercase">{item.unit} · Unit Price: {item.unitCost?.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-sm font-black text-blue-600">{item.quantity}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Qty</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-emerald-600">{item.totalCost?.toFixed(2)}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Total</p>
                      </div>
                      <button type="button" onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button id="m19-cancel" type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">Cancel</button>
                <button id="m19-submit" type="submit" disabled={items.length === 0} className="px-8 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black shadow-xl shadow-slate-500/20 flex items-center gap-2">
                  <ShieldCheck size={20} /> Record Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default VouchersM19
