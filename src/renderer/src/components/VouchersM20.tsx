import React, { useState, useEffect } from 'react'
import { Plus, Search, Printer, Package, Trash2, ClipboardList } from 'lucide-react'
import { useStore, Voucher20, VoucherItem, TRANSLATIONS } from '../store/useStore'
import { toEthiopianDate, getCurrentEthiopianDate } from '../lib/ethiopianCalendar'
import EthiopianDatePicker from './EthiopianDatePicker'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import ExportDropdown from './ExportDropdown'
import { getRolePermissions } from '../lib/permissions'

const VouchersM20 = () => {
  const { user, assets, vouchersM20, createVoucherM20, fetchAssets, orgName, orgTagline, language } = useStore()
  const perms = getRolePermissions(user?.role)
  const t = TRANSLATIONS[language]
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => { fetchAssets() }, [])

  const filteredVouchers = vouchersM20.filter(v =>
    v.voucherNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.requestedBy.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const [voucherNumber, setVoucherNumber] = useState('')
  const [requestedBy, setRequestedBy] = useState('')
  const [department, setDepartment] = useState('')
  const [authorizedBy, setAuthorizedBy] = useState('')
  const [issuedDate, setIssuedDate] = useState(new Date().toISOString().split('T')[0])
  const [items, setItems] = useState<Partial<VoucherItem>[]>([])
  const [selectedAssetId, setSelectedAssetId] = useState<string>('')
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1)
  const [selectedModel, setSelectedModel] = useState('')

  useEffect(() => {
    if (isModalOpen && window.api) {
      window.api.getNextVoucherNumber('MODEL20').then(setVoucherNumber)
    }
  }, [isModalOpen])

  const handleAddItem = () => {
    const asset = assets.find(a => a.id?.toString() === selectedAssetId)
    if (!asset) return

    if (asset.quantity < selectedQuantity) {
      alert(language === 'AM' ? `በቂ ክምችት የለም! በአሁኑ ጊዜ ያለው ${asset.quantity} ${asset.unit} ብቻ ነው::` : `Insufficient stock! Only ${asset.quantity} ${asset.unit} available.`)
      return
    }

    setItems([...items, {
      assetId: asset.id, assetName: asset.name, modelSerial: selectedModel || '—',
      unit: asset.unit, quantity: selectedQuantity,
      unitCost: asset.unitCost, totalCost: selectedQuantity * asset.unitCost
    }])
    setSelectedAssetId(''); setSelectedQuantity(1); setSelectedModel('')
  }

  const handleRemoveItem = (index: number) => setItems(items.filter((_, i) => i !== index))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!department.trim() || !requestedBy.trim()) {
      alert(language === 'AM' ? 'እባክዎን መምሪያ እና ጠያቂውን ስም ያስገቡ!' : 'Please fill in Department and Requested By fields!')
      return
    }

    if (items.length === 0) {
      alert(language === 'AM' ? 'ቢያንስ አንድ ንብረት መጠየቅ አለብዎት!' : 'Please add at least one item to request!')
      return
    }

    const payload = {
      voucherNumber, issuedTo: requestedBy, department,
      issuedDate, requestedBy, authorizedBy, items: items as VoucherItem[]
    }

    if (!perms.canAuthorizeM22) {
      if (window.api) {
        await window.api.createPendingRequest({
          type: 'MODEL20',
          payload: payload,
          status: 'PENDING',
          requestedBy: user?.name || requestedBy,
          department: department,
          description: `Requisition Request for ${items.length} item(s)`
        })
        alert(language === 'AM' ? 'ጥያቄዎ ለፈቃድ ተልኳል!' : 'Your request has been submitted to Admin for approval.')
      }
    } else {
      await createVoucherM20(payload)
      alert(language === 'AM' ? 'ሞዴል 20 በተሳካ ሁኔታ ተመዝግቧል!' : 'Model 20 Requisition recorded successfully!')
    }

    setIsModalOpen(false)
    setRequestedBy(''); setDepartment(''); setAuthorizedBy(''); setItems([])
  }

  const generatePDF = (voucher: Voucher20) => {
    const doc = new jsPDF()
    const gcDate = new Date(voucher.issuedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    const eDate = toEthiopianDate(voucher.issuedDate)
    const sanitize = (text: string | undefined) => text ? text.replace(/[^\x00-\x7F]/g, "").trim() : '';

    doc.setFontSize(8); doc.setTextColor(100)
    doc.text('Form: Model 20 (Requisition)', 14, 12)
    doc.text(`Ref: ${sanitize(voucher.voucherNumber)}`, 165, 12)
    doc.setFontSize(15); doc.setTextColor(0); doc.setFont('helvetica', 'bold')
    doc.text(sanitize(orgName).toUpperCase() || 'ORGANIZATION', 105, 22, { align: 'center' })
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(80)
    doc.text(sanitize(orgTagline).toUpperCase() || 'DEPARTMENT', 105, 28, { align: 'center' })
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(0)
    doc.text('REQUISITION FORM — REQUEST FOR PROPERTY / SUPPLIES', 105, 38, { align: 'center' })
    doc.setLineWidth(0.5); doc.line(14, 42, 196, 42)
    doc.setFontSize(10); doc.setFont('helvetica', 'normal')
    doc.text(`Department / Section: ${sanitize(voucher.department)}`, 14, 52)
    doc.text(`Date: ${gcDate}${eDate ? ` (EC: ${eDate})` : ''}`, 14, 60)
    doc.text(`Requested By: ${sanitize(voucher.requestedBy)}`, 14, 68)
    doc.text(`Authorized By: ${sanitize(voucher.authorizedBy) || '___________________'}`, 110, 68)
    autoTable(doc, {
      startY: 78,
      head: [['#', 'Qty', 'Unit', 'Item Description', 'Model/Serial', 'Remarks']],
      body: voucher.items.map((item, idx) => [idx + 1, item.quantity, sanitize(item.unit), sanitize(item.assetName), sanitize(item.modelSerial) || '—', '']),
      theme: 'grid', styles: { fontSize: 8.5, cellPadding: 3 },
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    })
    const finalY = (doc as any).lastAutoTable.finalY + 20
    doc.text(`Requester's Signature: ___________________`, 14, finalY)
    doc.text(`Authorizer's Signature: ___________________`, 110, finalY)
    doc.setFontSize(7); doc.setTextColor(150)
    doc.text(`${sanitize(orgName)} | Generated: ${new Date().toLocaleString()} | Ref: ${sanitize(voucher.voucherNumber)}`, 105, 287, { align: 'center' })

    doc.save(`Requisition_M20_${voucher.voucherNumber}.pdf`)
  }

  const exportData = vouchersM20.map(v => ({
    'Voucher Number': v.voucherNumber,
    'Department': v.department,
    'Requested By': v.requestedBy,
    'Authorized By': v.authorizedBy || 'N/A',
    'Date': v.issuedDate,
    'Items': v.items.length
  }))

  const generateFullPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(18); doc.text('REQUISITIONS LOG (MODEL 20)', 105, 20, { align: 'center' })
    const tableData = vouchersM20.map((v, i) => [
      i + 1, v.voucherNumber, v.department, v.requestedBy, v.issuedDate, v.items.length
    ])
    autoTable(doc, {
      startY: 30,
      head: [['#', 'Voucher #', 'Department', 'Requested By', 'Date', 'Items']],
      body: tableData,
      theme: 'grid', headStyles: { fillColor: [30, 41, 59] }
    })
    doc.save('M20_Requisitions_Log.pdf')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight underline decoration-purple-500 decoration-2 underline-offset-4">
            {t.model20}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">{t.requisitionForm} | {getCurrentEthiopianDate()}</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportDropdown data={exportData} filename="M20_Requisitions" onExportPDF={generateFullPDF} />
          {perms.canCreateM20 && (
            <button id="btn-new-m20" onClick={() => setIsModalOpen(true)} className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-slate-500/20 transition-all active:scale-95">
              <Plus size={20} /><span>{t.newRequest}</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center bg-slate-100/30">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input id="m20-search" type="text" placeholder={t.search} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border-2 border-slate-900 dark:border-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{t.voucherNo}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{t.department}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{t.requestedBy || 'Requested By'}</th>
                <th className="px-6 py-4 text-right border-2 border-slate-900 dark:border-slate-700">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredVouchers.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                    <div className="font-black text-sm">{v.voucherNumber}</div>
                    <div className="text-[10px] text-slate-400">{new Date(v.issuedDate).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-sm text-slate-700 dark:text-slate-300 border-2 border-slate-900 dark:border-slate-700">{v.department}</td>
                  <td className="px-6 py-4 text-xs font-black text-slate-500 uppercase border-2 border-slate-900 dark:border-slate-700">{v.requestedBy}</td>
                  <td className="px-6 py-4 text-right border-2 border-slate-900 dark:border-slate-700">
                    <button id={`btn-print-m20-${v.id}`} onClick={() => generatePDF(v)} className="p-2 text-slate-400 hover:text-purple-600 rounded-lg cursor-pointer"><Printer size={18} /></button>
                  </td>
                </tr>
              ))}
              {filteredVouchers.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-16 text-center text-slate-400 border-2 border-slate-900 dark:border-slate-700">
                  <ClipboardList size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="font-bold italic text-sm">No requisitions recorded yet.</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
            <header className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-purple-500 p-2 rounded-xl"><ClipboardList size={24} /></div>
                <div>
                  <h3 className="text-xl font-black">{t.model20}</h3>
                  <p className="text-purple-300 text-[10px] font-black uppercase tracking-widest">{t.requisitionForm}</p>
                </div>
              </div>
              <button id="m20-modal-close" onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-white/10"><Plus size={24} className="rotate-45" /></button>
            </header>
            <form id="m20-form" onSubmit={handleSubmit} className="flex-1 overflow-auto p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t.voucherNo} <span className="text-red-500">*</span></label>
                  <input type="text" required className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-mono" value={voucherNumber} onChange={(e) => setVoucherNumber(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t.department} <span className="text-red-500">*</span></label>
                  <input id="m20-department" type="text" required className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold" placeholder="e.g. Finance Department" value={department} onChange={(e) => setDepartment(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t.requestedBy} <span className="text-red-500">*</span></label>
                  <input id="m20-requested-by" type="text" required className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold" placeholder="Staff name" value={requestedBy} onChange={(e) => setRequestedBy(e.target.value)} />
                </div>
                {perms.canAuthorizeM22 && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t.authorizedBy}</label>
                    <input id="m20-authorized-by" type="text" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold" value={authorizedBy} onChange={(e) => setAuthorizedBy(e.target.value)} />
                  </div>
                )}
                <div className="space-y-1"><EthiopianDatePicker label={<span>Date of Request <span className="text-red-500">*</span></span>} value={issuedDate} onChange={setIssuedDate} /></div>
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-4">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Items Required</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest border-l-2 border-purple-500 pl-2">Select Item <span className="text-red-500">*</span></label>
                    <select id="m20-asset-select" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold" value={selectedAssetId} onChange={(e) => setSelectedAssetId(e.target.value)}>
                      <option value="">Select Asset / Item...</option>
                      {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.quantity} {a.unit} avail)</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest border-l-2 border-purple-500 pl-2">Model</label>
                    <input id="m20-model" type="text" placeholder="Model (optional)" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm" value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest border-l-2 border-purple-500 pl-2">Quantity</label>
                    <input id="m20-qty" type="number" placeholder="Qty" min="1" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-black" value={selectedQuantity} onChange={(e) => setSelectedQuantity(parseInt(e.target.value) || 0)} />
                  </div>
                </div>
                <button id="m20-add-item" type="button" onClick={handleAddItem} disabled={!selectedAssetId} className="w-full bg-purple-600 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-purple-700 shadow-lg shadow-purple-500/20 transition-all uppercase tracking-widest">
                  <Plus size={18} className="inline mr-2" /> {language === 'AM' ? 'ንብረት ጨምር' : 'Add to Request'}
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border-2 border-slate-900 dark:border-slate-700">
                <table className="w-full text-left border-collapse bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest border-b-2 border-slate-900 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700">#</th>
                      <th className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700">Qty</th>
                      <th className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700">Unit</th>
                      <th className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700">Item Description</th>
                      <th className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700">Model/Serial</th>
                      <th className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700">Remarks</th>
                      <th className="px-4 py-3 text-right border-2 border-slate-900 dark:border-slate-700">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <td className="px-4 py-3 font-bold border-2 border-slate-900 dark:border-slate-700">{idx + 1}</td>
                        <td className="px-4 py-3 font-black text-purple-600 border-2 border-slate-900 dark:border-slate-700">{item.quantity}</td>
                        <td className="px-4 py-3 font-bold text-slate-500 border-2 border-slate-900 dark:border-slate-700">{item.unit}</td>
                        <td className="px-4 py-3 font-bold border-2 border-slate-900 dark:border-slate-700">{item.assetName}</td>
                        <td className="px-4 py-3 font-mono text-xs border-2 border-slate-900 dark:border-slate-700">{item.modelSerial}</td>
                        <td className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700"></td>
                        <td className="px-4 py-3 text-right border-2 border-slate-900 dark:border-slate-700">
                          <button type="button" onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400 font-bold italic text-xs border-2 border-slate-900 dark:border-slate-700">No items added to requisition.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button id="m20-cancel" type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">Cancel</button>
                <button id="m20-submit" type="submit" disabled={items.length === 0} className="px-8 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black shadow-xl shadow-slate-500/20">
                  {perms.canAuthorizeM22 ? (language === 'AM' ? 'ወጪ ፍቀድና መዝግብ' : 'Submit Requisition') : (language === 'AM' ? 'ጥያቄውን ለፈቃድ ላክ' : 'Submit for Approval')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default VouchersM20
