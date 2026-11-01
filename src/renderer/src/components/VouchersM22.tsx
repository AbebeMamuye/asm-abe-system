import React, { useState, useEffect } from 'react'
import { Plus, Search, Printer, Package, Trash2, ArrowUpRight, ShieldCheck } from 'lucide-react'
import { useStore, Voucher22, VoucherItem, TRANSLATIONS } from '../store/useStore'
import { toEthiopianDate, getCurrentEthiopianDate } from '../lib/ethiopianCalendar'
import EthiopianDatePicker from './EthiopianDatePicker'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import ExportDropdown from './ExportDropdown'
import { getRolePermissions } from '../lib/permissions'

const VouchersM22 = () => {
  const { assets, vouchersM22, createVoucherM22, fetchAssets, orgName, orgTagline, user, language } = useStore()
  const perms = getRolePermissions(user?.role)
  const t = TRANSLATIONS[language]
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => { fetchAssets() }, [])

  const filteredVouchers = vouchersM22.filter(v =>
    v.voucherNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.recipientName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const [voucherNumber, setVoucherNumber] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [department, setDepartment] = useState('')
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [storekeeperName, setStorekeeperName] = useState(user?.name || 'Property Manager')
  const [pageFrom, setPageFrom] = useState('')
  const [pageTo, setPageTo] = useState('')
  const [items, setItems] = useState<Partial<VoucherItem>[]>([])
  const [selectedAssetId, setSelectedAssetId] = useState<string>('')
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1)
  const [selectedModel, setSelectedModel] = useState('')
  const [selectedSerial, setSelectedSerial] = useState('')

  useEffect(() => {
    if (isModalOpen && window.api) {
      window.api.getNextVoucherNumber('MODEL22').then(setVoucherNumber)
    }
  }, [isModalOpen])

  const handleAddItem = () => {
    const asset = assets.find(a => a.id?.toString() === selectedAssetId)
    if (!asset) return
    if (asset.quantity < selectedQuantity) {
      alert(`Insufficient stock! Only ${asset.quantity} ${asset.unit} available.`)
      return
    }
    setItems([...items, {
      assetId: asset.id,
      assetName: asset.name,
      model: selectedModel || '—',
      serial: selectedSerial || asset.serialNumber || '—',
      unit: asset.unit,
      quantity: selectedQuantity,
      unitCost: asset.unitCost,
      totalCost: selectedQuantity * asset.unitCost
    }])
    setSelectedAssetId(''); setSelectedQuantity(1);
    setSelectedModel(''); setSelectedSerial('');
  }

  const handleRemoveItem = (index: number) => setItems(items.filter((_, i) => i !== index))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!department.trim() || !recipientName.trim()) {
      alert(language === 'AM' ? 'እባክዎን መምሪያ እና ተቀባዩን ስም ያስገቡ!' : 'Please fill in Department and Recipient fields!')
      return
    }

    if (items.length === 0) {
      alert(language === 'AM' ? 'ቢያንስ አንድ ንብረት መጨመር አለብዎት!' : 'Please add at least one item to issue!')
      return
    }

    const payload = {
      voucherNumber, recipientName, department, issueDate,
      storekeeperName, pageFrom, pageTo, items: items as VoucherItem[]
    }

    if (!perms.canAuthorizeM22) {
      if (window.api) {
        await window.api.createPendingRequest({
          type: 'MODEL22',
          payload: payload,
          status: 'PENDING',
          requestedBy: user?.name || recipientName,
          department: department,
          description: `Issue Request for ${items.length} item(s)`
        })
        alert(language === 'AM' ? 'ጥያቄዎ ለአስተዳዳሪው ለፈቃድ ተልኳል::' : 'Your request has been submitted to Admin for approval.')
      }
    } else {
      await createVoucherM22(payload)
      alert(language === 'AM' ? 'ሞዴል 22 በተሳካ ሁኔታ ተመዝግቧል!' : 'Model 22 Issue Voucher recorded successfully!')
    }

    setIsModalOpen(false)
    setRecipientName(''); setDepartment(''); setItems([]); setPageFrom(''); setPageTo('')
  }

  const generatePDF = (voucher: Voucher22) => {
    const doc = new jsPDF()
    const gcDate = new Date(voucher.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    const eDate = toEthiopianDate(voucher.issueDate)

    const sanitize = (text: string | undefined) => text ? text.replace(/[^\x00-\x7F]/g, "").trim() : '';

    doc.setFontSize(8); doc.setTextColor(100)
    doc.text('Form: Model 22 (Issue Voucher)', 14, 12)
    doc.text(`Serial ANRS/A/41st`, 165, 12)
    doc.setFontSize(10); doc.setTextColor(0); doc.text(`No. ${sanitize(voucher.voucherNumber)}`, 165, 18)

    doc.setFontSize(15); doc.setTextColor(0); doc.setFont('helvetica', 'bold')
    doc.text(sanitize(orgName).toUpperCase() || 'ORGANIZATION', 105, 22, { align: 'center' })
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(80)
    doc.text(sanitize(orgTagline).toUpperCase() || 'DEPARTMENT', 105, 28, { align: 'center' })

    doc.setFontSize(9); doc.setTextColor(0)
    doc.text(`P. ${sanitize(voucher.department).toUpperCase() || '___________________'}`, 14, 32)
    doc.text(`Department`, 14, 36)

    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(0)
    doc.text('PROPERTY ISSUE VOUCHER — ARTICLES ISSUED FROM STORE', 105, 45, { align: 'center' })
    doc.setLineWidth(0.5); doc.line(14, 48, 196, 48)

    doc.setFontSize(9); doc.setFont('helvetica', 'normal')
    doc.text(`I hereby certify that I have correctly counted and received the items listed below for the use of:`, 14, 50, { maxWidth: 180 })
    doc.setFont('helvetica', 'bold')
    doc.text(sanitize(voucher.recipientName), 14, 60)
    doc.setFont('helvetica', 'normal')
    doc.text(`Date of Issue: ${gcDate}${eDate ? ` (EC: ${eDate})` : ''}`, 14, 68)
    doc.text(`Voucher/Order No: ${sanitize(voucher.voucherNumber)}`, 110, 68)
    if (voucher.pageFrom || voucher.pageTo) {
      doc.text(`Pages: ${sanitize(voucher.pageFrom) || '—'} to ${sanitize(voucher.pageTo) || '—'}`, 14, 76)
    }

    const tableData = voucher.items.map((item, idx) => [
      idx + 1, sanitize(item.assetName),
      sanitize(item.model) || '—',
      sanitize(item.serial) || '—',
      item.quantity, sanitize(item.unit),
      item.unitCost.toFixed(2), item.totalCost.toFixed(2), ''
    ])

    autoTable(doc, {
      startY: 82,
      head: [['#', 'Description', 'Model', 'Serial', 'Qty', 'Unit', 'Unit Cost', 'Total', 'Remarks']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    })

    const finalY = (doc as any).lastAutoTable.finalY + 20
    doc.setFont('helvetica', 'normal')
    doc.text(`Storekeeper: ${sanitize(voucher.storekeeperName) || '___________________'}`, 14, finalY)
    doc.text(`Storekeeper's Signature: ________________`, 14, finalY + 10)
    doc.text(`Recipient's Signature: __________________`, 110, finalY + 10)
    doc.text(`Date: ${gcDate}`, 110, finalY + 20)

    doc.setFontSize(7); doc.setTextColor(150)
    doc.text(`${sanitize(orgName)} | Generated: ${new Date().toLocaleString()} | Ref: ${sanitize(voucher.voucherNumber)}`, 105, 287, { align: 'center' })
    doc.save(`Issue_M22_${sanitize(voucher.voucherNumber)}.pdf`)
  }

  const exportData = vouchersM22.map(v => ({
    'Voucher Number': v.voucherNumber,
    'Recipient Name': v.recipientName,
    'Issue Date': v.issueDate,
    'Storekeeper': v.storekeeperName,
    'Page From': v.pageFrom || 'N/A',
    'Page To': v.pageTo || 'N/A',
    'Items Count': v.items.length
  }))

  const generateFullPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(18); doc.text('PROPERTY ISSUE VOUCHERS LOG (MODEL 22)', 105, 20, { align: 'center' })
    const tableData = vouchersM22.map((v, i) => [
      i + 1, v.voucherNumber, v.recipientName, v.issueDate, v.items.length
    ])
    autoTable(doc, {
      startY: 30,
      head: [['#', 'Voucher #', 'Recipient', 'Date', 'Items']],
      body: tableData,
      theme: 'grid', headStyles: { fillColor: [30, 41, 59] }
    })
    doc.save('M22_Issue_Vouchers_Log.pdf')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight underline decoration-emerald-500 decoration-2 underline-offset-4">
            Property Issue Voucher (Model 22)
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Issue property from store to staff/departments | {getCurrentEthiopianDate()}</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportDropdown data={exportData} filename="M22_Issue_Vouchers" onExportPDF={generateFullPDF} />
          {perms.canAuthorizeM22 ? (
            <button id="btn-new-m22" onClick={() => setIsModalOpen(true)} className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-slate-500/20 transition-all active:scale-95">
              <Plus size={20} /><span>New Issue (M22)</span>
            </button>
          ) : (
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 px-4 py-2 rounded-xl flex items-center gap-2">
              <ShieldCheck size={16} className="text-amber-600" />
              <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest">{language === 'AM' ? 'የግምጃ ቤት / የአስተዳደር ፍቃድ ያስፈልጋል' : 'Storekeeper / Admin Authorization Required to Issue'}</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input id="m22-search" type="text" placeholder="Search by recipient or issue no..." className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border-2 border-slate-900 dark:border-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">Issue No</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">Recipient / Staff</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">Date</th>
                <th className="px-6 py-4 text-right border-2 border-slate-900 dark:border-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredVouchers.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700"><div className="font-black text-sm">{v.voucherNumber}</div></td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-700 dark:text-slate-300 border-2 border-slate-900 dark:border-slate-700">{v.recipientName}</td>
                  <td className="px-6 py-4 text-xs text-slate-500 border-2 border-slate-900 dark:border-slate-700">{new Date(v.issueDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right border-2 border-slate-900 dark:border-slate-700">
                    <button id={`btn-print-m22-${v.id}`} onClick={() => generatePDF(v)} className="p-2 text-slate-400 hover:text-emerald-600 rounded-lg cursor-pointer"><Printer size={18} /></button>
                  </td>
                </tr>
              ))}
              {filteredVouchers.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-16 text-center text-slate-400 border-2 border-slate-900 dark:border-slate-700">
                  <ArrowUpRight size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="font-bold italic text-sm">No issue vouchers recorded yet.</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
            <header className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500 p-2 rounded-xl shadow-lg shadow-emerald-500/20"><ArrowUpRight size={24} /></div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">Model 22 — Issue Voucher</h3>
                  <p className="text-emerald-300 text-[10px] font-black uppercase tracking-widest">Issue Property from Store to Staff / Department</p>
                </div>
              </div>
              <button id="m22-modal-close" onClick={() => setIsModalOpen(false)} className="hover:bg-white/10 p-2 rounded-full transition-colors"><Plus size={24} className="rotate-45" /></button>
            </header>

            <form id="m22-form" onSubmit={handleSubmit} className="flex-1 overflow-auto p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t.voucherNo} <span className="text-red-500">*</span></label>
                  <input type="text" required className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-mono" value={voucherNumber} onChange={(e) => setVoucherNumber(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest underline decoration-emerald-500">{t.department} <span className="text-red-500">*</span></label>
                  <input id="m22-dept" type="text" required className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold" placeholder="e.g. Finance" value={department} onChange={(e) => setDepartment(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest underline decoration-emerald-500">{t.recipient} <span className="text-red-500">*</span></label>
                  <input id="m22-recipient" type="text" required className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold" placeholder="Who is receiving?" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
                </div>
                <EthiopianDatePicker label={<span>Issue Date <span className="text-red-500">*</span></span>} value={issueDate} onChange={setIssueDate} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t.storekeeper}</label>
                  <input id="m22-storekeeper" type="text" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold" value={storekeeperName} onChange={(e) => setStorekeeperName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t.pageFrom}</label>
                  <input id="m22-page-from" type="text" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm" value={pageFrom} onChange={(e) => setPageFrom(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t.pageTo}</label>
                  <input id="m22-page-to" type="text" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm" value={pageTo} onChange={(e) => setPageTo(e.target.value)} />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest underline decoration-emerald-500">Property Being Issued</h4>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest border-l-2 border-emerald-500 pl-2">Select Asset</label>
                    <select id="m22-asset-select" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold" value={selectedAssetId} onChange={(e) => setSelectedAssetId(e.target.value)}>
                      <option value="">Select Property / Asset...</option>
                      {assets.map(a => <option key={a.id} value={a.id}>{a.name} (AVAIL: {a.quantity} {a.unit})</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest border-l-2 border-emerald-500 pl-2">Model</label>
                    <input type="text" placeholder={t.model} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm" value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest border-l-2 border-emerald-500 pl-2">Serial</label>
                    <input type="text" placeholder={t.serial} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm" value={selectedSerial} onChange={(e) => setSelectedSerial(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest border-l-2 border-emerald-500 pl-2">Quantity</label>
                    <input id="m22-qty" type="number" placeholder={t.qty} min="1" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-black" value={selectedQuantity} onChange={(e) => setSelectedQuantity(parseInt(e.target.value) || 0)} />
                  </div>
                </div>
                <button id="m22-add-item" type="button" onClick={handleAddItem} disabled={!selectedAssetId} className="w-full mt-4 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 py-2.5 transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
                  <Plus size={18} /> {language === 'AM' ? 'ንብረት ጨምር' : 'Add to Issue List'}
                </button>
              </div>

              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-400 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors"><Package size={20} /></div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white">{item.assetName}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">
                          MOD: {item.model} | SN: {item.serial}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right"><p className="text-sm font-black text-emerald-600">{item.quantity}</p><p className="text-[10px] text-slate-400 font-bold uppercase">Qty Issued</p></div>
                      <button type="button" onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button id="m22-cancel" type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">Cancel</button>
                <button id="m22-submit" type="submit" disabled={items.length === 0} className="px-8 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black shadow-xl shadow-slate-500/20 flex items-center gap-2">
                  <ShieldCheck size={20} /> {!perms.canAuthorizeM22 ? (language === 'AM' ? 'ለፈቃድ ላክ' : 'Send for Approval') : (language === 'AM' ? 'ወጪ ፍቀድ' : 'Authorize Issue')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default VouchersM22
