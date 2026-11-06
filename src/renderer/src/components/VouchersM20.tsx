import React, { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  Printer,
  Trash2,
  ClipboardList,
  ShieldCheck,
  AlertCircle,
  Eye,
  CheckCircle2,
  Stamp,
  ArrowRight,
  FileCheck
} from 'lucide-react'
import QRCode from 'qrcode'
import { useStore, Voucher20, VoucherItem, TRANSLATIONS } from '../store/useStore'
import { toEthiopianDate, getCurrentEthiopianDate } from '../lib/ethiopianCalendar'
import EthiopianDatePicker from './EthiopianDatePicker'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import ExportDropdown from './ExportDropdown'
import { getRolePermissions } from '../lib/permissions'

const VouchersM20 = () => {
  const {
    user,
    assets,
    vouchersM20,
    createVoucherM20,
    sealVoucherM20,
    fetchAssets,
    orgName,
    orgTagline,
    language,
    setActiveTab
  } = useStore()

  const perms = getRolePermissions(user?.role)
  const t = TRANSLATIONS[language]
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [inspectingVoucher, setInspectingVoucher] = useState<Voucher20 | null>(null)
  const [sealingId, setSealingId] = useState<number | null>(null)

  useEffect(() => {
    fetchAssets()
  }, [])

  const filteredVouchers = vouchersM20.filter(
    (v) =>
      v.voucherNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.requestedBy && v.requestedBy.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.authorizedBy && v.authorizedBy.toLowerCase().includes(searchTerm.toLowerCase()))
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

  // Official Department Seal & Authorization options
  const [isSealed, setIsSealed] = useState(true)
  const [approverTitle, setApproverTitle] = useState(
    language === 'AM' ? 'የስራ ክፍል / መምሪያ ኃላፊ' : 'Department / Section Head'
  )
  const [approverPin, setApproverPin] = useState('')

  useEffect(() => {
    if (isModalOpen && window.api) {
      window.api.getNextVoucherNumber('MODEL20').then(setVoucherNumber)
    }
  }, [isModalOpen])

  // Pre-fill department from user profile if available
  useEffect(() => {
    if (isModalOpen && user?.department && !department) {
      setDepartment(user.department)
    }
    if (isModalOpen && user?.name && !requestedBy) {
      setRequestedBy(user.name)
    }
    if (isModalOpen && user?.role === 'Manager' && !authorizedBy) {
      setAuthorizedBy(user.name)
    }
  }, [isModalOpen, user])

  const handleAddItem = () => {
    const asset = assets.find((a) => a.id?.toString() === selectedAssetId)
    if (!asset) return

    if (asset.quantity < selectedQuantity) {
      alert(
        language === 'AM'
          ? `በቂ ክምችት የለም! በአሁኑ ጊዜ ያለው ${asset.quantity} ${asset.unit} ብቻ ነው::`
          : `Insufficient stock! Only ${asset.quantity} ${asset.unit} available.`
      )
      return
    }

    setItems([
      ...items,
      {
        assetId: asset.id,
        assetName: asset.name,
        modelSerial: selectedModel || '—',
        unit: asset.unit,
        quantity: selectedQuantity,
        unitCost: asset.unitCost,
        totalCost: selectedQuantity * asset.unitCost
      }
    ])
    setSelectedAssetId('')
    setSelectedQuantity(1)
    setSelectedModel('')
  }

  const handleRemoveItem = (index: number) => setItems(items.filter((_, i) => i !== index))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!department.trim() || !requestedBy.trim()) {
      alert(
        language === 'AM'
          ? 'እባክዎን መምሪያ እና ጠያቂውን ስም ያስገቡ!'
          : 'Please fill in Department and Requested By fields!'
      )
      return
    }

    if (items.length === 0) {
      alert(
        language === 'AM'
          ? 'ቢያንስ አንድ ንብረት መጠየቅ አለብዎት!'
          : 'Please add at least one item to request!'
      )
      return
    }

    const sealTimestamp = new Date().toISOString()
    const sealHash = isSealed
      ? `SEAL-M20-${voucherNumber || 'REQ'}-${Date.now().toString(36).toUpperCase()}`
      : null

    const payload: Partial<Voucher20> = {
      voucherNumber,
      issuedTo: requestedBy,
      department,
      issuedDate,
      requestedBy,
      authorizedBy: authorizedBy || (isSealed ? requestedBy : ''),
      isSealed: isSealed ? 1 : 0,
      sealedBy: isSealed ? (authorizedBy || requestedBy) : undefined,
      sealedAt: isSealed ? sealTimestamp : undefined,
      sealHash: sealHash || undefined,
      items: items as VoucherItem[]
    }

    if (!perms.canAuthorizeM22) {
      if (window.api) {
        await window.api.createPendingRequest({
          type: 'MODEL20',
          payload: payload,
          status: 'PENDING',
          requestedBy: user?.name || requestedBy,
          department: department,
          description: `Requisition Request for ${items.length} item(s) (${isSealed ? 'Officially Sealed' : 'Unsealed'})`
        })
        alert(
          language === 'AM'
            ? 'የሞዴል 20 መጠየቂያ ጥያቄዎ ይፋዊ ማህተም ተደርጎበት ለዋና ንብረት ክፍል ተልኳል!'
            : 'Your officially sealed Model 20 requisition has been submitted to the Central Store!'
        )
      }
    } else {
      await createVoucherM20(payload as Voucher20)
      alert(
        language === 'AM'
          ? 'ሞዴል 20 በክፍሉ ይፋዊ ክብ ማህተም እና ፊርማ ተረጋግጦ በተሳካ ሁኔታ ተመዝግቧል!'
          : 'Model 20 Requisition recorded and officially sealed with Department Circular Stamp!'
      )
    }

    setIsModalOpen(false)
    setRequestedBy('')
    setDepartment('')
    setAuthorizedBy('')
    setItems([])
    setApproverPin('')
  }

  const handleDirectSeal = async (voucher: Voucher20) => {
    if (!voucher.id) return
    const authorizer = user?.name || voucher.authorizedBy || voucher.requestedBy || 'Department Head'
    try {
      setSealingId(voucher.id)
      await sealVoucherM20(voucher.id, authorizer)
      alert(
        language === 'AM'
          ? `የሰነድ ቁጥር ${voucher.voucherNumber} የ${voucher.department} ይፋዊ ክብ ማህተም አርፎበታል!`
          : `Model 20 (${voucher.voucherNumber}) successfully sealed with ${voucher.department}'s official stamp!`
      )
    } catch (err: any) {
      alert(`Seal error: ${err.message || err}`)
    } finally {
      setSealingId(null)
    }
  }

  const generatePDF = async (voucher: Voucher20) => {
    const doc = new jsPDF()
    const gcDate = new Date(voucher.issuedDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    const eDate = toEthiopianDate(voucher.issuedDate)
    const sanitize = (text: string | undefined) =>
      text ? text.replace(/[^\x00-\x7F]/g, '').trim() : ''

    // Top Header
    doc.setFontSize(8)
    doc.setTextColor(100)
    doc.text('Form: Model 20 (Store Requisition Voucher)', 14, 12)
    doc.text(`Voucher Ref: ${sanitize(voucher.voucherNumber)}`, 150, 12)

    doc.setFontSize(14)
    doc.setTextColor(0)
    doc.setFont('helvetica', 'bold')
    doc.text(sanitize(orgName).toUpperCase() || 'INSTITUTIONAL ASSET MANAGEMENT', 105, 22, {
      align: 'center'
    })
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80)
    doc.text(sanitize(orgTagline).toUpperCase() || 'PUBLIC SECTOR ASSET CONTROLLER', 105, 28, {
      align: 'center'
    })

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0)
    doc.text('REQUISITION FORM — REQUEST FOR PROPERTY & SUPPLIES (MODEL 20)', 105, 38, {
      align: 'center'
    })
    doc.setLineWidth(0.6)
    doc.line(14, 42, 196, 42)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Requesting Department / Sector: ${sanitize(voucher.department)}`, 14, 50)
    doc.text(`Date of Request: ${gcDate}${eDate ? ` (EC: ${eDate})` : ''}`, 14, 57)
    doc.text(`Requested By: ${sanitize(voucher.requestedBy)}`, 14, 64)
    doc.text(
      `Authorized By: ${sanitize(voucher.authorizedBy || voucher.sealedBy) || '___________________'}`,
      110,
      64
    )

    autoTable(doc, {
      startY: 72,
      head: [['#', 'Qty', 'Unit', 'Item Description', 'Model/Serial', 'Purpose / Remarks']],
      body: voucher.items.map((item, idx) => [
        idx + 1,
        item.quantity,
        sanitize(item.unit),
        sanitize(item.assetName),
        sanitize(item.modelSerial) || '—',
        'Official Sector Need'
      ]),
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 3 },
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    })

    const finalY = (doc as any).lastAutoTable.finalY + 16

    // ── Signatures & Authorization ───────────────────────────
    doc.setFontSize(9)
    doc.setTextColor(0)
    doc.setFont('helvetica', 'bold')
    doc.text("Requester's Signature: ___________________", 14, finalY + 4)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100)
    doc.text(`Staff Name: ${sanitize(voucher.requestedBy)}`, 14, finalY + 10)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0)
    doc.text("Authorizer's Signature: ___________________", 110, finalY + 4)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100)
    doc.text(
      `Approver: ${sanitize(voucher.authorizedBy || voucher.sealedBy || 'Department Head')}`,
      110,
      finalY + 10
    )
    doc.text(`Sector: ${sanitize(voucher.department)}`, 110, finalY + 15)

    // ── Embedded Official QR Code ─────────────────────────────
    try {
      const qrData = JSON.stringify({
        doc: 'MODEL20',
        ref: voucher.voucherNumber,
        dept: voucher.department,
        req: voucher.requestedBy,
        auth: voucher.authorizedBy || voucher.sealedBy,
        date: voucher.issuedDate,
        seal: voucher.isSealed ? 'OFFICIALLY_SEALED' : 'UNSEALED',
        hash: voucher.sealHash || `SEAL-${voucher.voucherNumber}`
      })
      const qrDataUrl = await QRCode.toDataURL(qrData, { margin: 1, width: 160 })
      doc.addImage(qrDataUrl, 'PNG', 14, finalY + 16, 22, 22)
      doc.setFontSize(6.5)
      doc.setTextColor(90)
      doc.text('OFFICIAL VERIFICATION QR', 14, finalY + 42)
      doc.text(`Ref: ${sanitize(voucher.voucherNumber)}`, 14, finalY + 45)
    } catch (qrErr) {
      console.warn('QR code generation failed:', qrErr)
    }

    // ── Official Circular Department Seal (ይፋዊ ክብ ማህተም) ───
    // If sealed or requested, draw the genuine double-circle blue ink stamp
    const sealX = 162
    const sealY = finalY + 28
    const sealR = 21

    doc.setDrawColor(26, 86, 178) // Official stamp blue ink
    doc.setTextColor(26, 86, 178)

    // Outer thick circle
    doc.setLineWidth(0.85)
    doc.circle(sealX, sealY, sealR)

    // Middle thin concentric ring
    doc.setLineWidth(0.25)
    doc.circle(sealX, sealY, sealR - 1.8)

    // Inner core boundary ring
    doc.setLineWidth(0.6)
    doc.circle(sealX, sealY, sealR - 6.2)

    // Requesting Department Name across top arc
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.8)
    const deptUpper = sanitize(voucher.department || 'OFFICIAL DEPARTMENT').toUpperCase()
    doc.text(deptUpper.length > 25 ? deptUpper.substring(0, 25) + '..' : deptUpper, sealX, sealY - 10.5, {
      align: 'center'
    })

    // Center text
    doc.setFontSize(7)
    doc.text('★ STORE REQUISITION ★', sealX, sealY - 2.8, { align: 'center' })
    doc.setFontSize(8.5)
    doc.text('★ APPROVED / ፀድቋል ★', sealX, sealY + 1.8, { align: 'center' })
    doc.setFontSize(6)
    doc.text('OFFICIAL SEAL / ክብ ማህተም', sealX, sealY + 5.5, { align: 'center' })

    // Bottom Date & Ref
    doc.setFontSize(5.8)
    doc.setFont('helvetica', 'normal')
    doc.text(`EC: ${eDate || '2018'} | ${sanitize(voucher.voucherNumber)}`, sealX, sealY + 11.5, {
      align: 'center'
    })

    // Footer
    doc.setFontSize(7)
    doc.setTextColor(140)
    doc.text(
      `${sanitize(orgName)} | Generated: ${new Date().toLocaleString()} | Stamped & Verified Form Model 20`,
      105,
      287,
      { align: 'center' }
    )

    doc.save(`Requisition_M20_${voucher.voucherNumber}.pdf`)
  }

  const exportData = vouchersM20.map((v) => ({
    'Voucher Number': v.voucherNumber,
    Department: v.department,
    'Requested By': v.requestedBy,
    'Authorized By': v.authorizedBy || v.sealedBy || 'N/A',
    'Official Seal': v.isSealed ? 'SEALED' : 'UNSEALED',
    Date: v.issuedDate,
    Items: v.items.length
  }))

  const generateFullPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('REQUISITIONS LOG (MODEL 20 — STORE REQUISITIONS)', 105, 20, { align: 'center' })
    const tableData = vouchersM20.map((v, i) => [
      i + 1,
      v.voucherNumber,
      v.department,
      v.requestedBy,
      v.isSealed ? 'SEALED (ክብ ማህተም)' : 'UNSEALED',
      v.issuedDate,
      v.items.length
    ])
    autoTable(doc, {
      startY: 28,
      head: [['#', 'Voucher #', 'Department', 'Requested By', 'Seal Status', 'Date', 'Items']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59] }
    })
    doc.save('M20_Requisitions_Master_Log.pdf')
  }

  return (
    <div className="space-y-6">
      {/* ── Top Header ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight underline decoration-cyan-500 decoration-2 underline-offset-4">
              {t.model20}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800 flex items-center gap-1">
              <Stamp size={12} />
              {language === 'AM' ? 'የክፍሉ ክብ ማህተም የሚደረግበት' : 'Official Circular Stamp Form'}
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
            {language === 'AM'
              ? 'የዕቃ መጠየቂያ ሰነድ — ጠያቂው የስራ ክፍል ይፋዊ ክብ ማህተምና ፊርማ በማሳረፍ ለዋና ንብረት ክፍል ያቀርባል'
              : 'Store Requisition Form — Requesting units officially stamp & sign before property release'}{' '}
            | {getCurrentEthiopianDate()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportDropdown data={exportData} filename="M20_Requisitions" onExportPDF={generateFullPDF} />
          {perms.canCreateM20 && (
            <button
              id="btn-new-m20"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/25 transition-all active:scale-95 cursor-pointer"
            >
              <Plus size={20} />
              <span>{language === 'AM' ? 'አዲስ መጠየቂያ (በክብ ማህተም)' : 'New Requisition (M20)'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Requisitions Table ────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              id="m20-search"
              type="text"
              placeholder={language === 'AM' ? 'በቫውቸር ቁጥር፣ መምሪያ ወይም ጠያቂ ፈልግ...' : 'Search by voucher #, department, or requester...'}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-cyan-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {language === 'AM' ? `ድምር፦ ${filteredVouchers.length} መጠየቂያዎች` : `Total: ${filteredVouchers.length} Requisitions`}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4">{t.voucherNo}</th>
                <th className="px-6 py-4">{language === 'AM' ? 'ጠያቂው መምሪያ / ሴክተር' : 'Requesting Unit'}</th>
                <th className="px-6 py-4">{language === 'AM' ? 'ጠያቂና ፈቃጅ' : 'Requested & Approved By'}</th>
                <th className="px-6 py-4">{language === 'AM' ? 'ይፋዊ ክብ ማህተም' : 'Official Stamp Status'}</th>
                <th className="px-6 py-4 text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {filteredVouchers.map((v) => {
                const isVoucherSealed = Boolean(v.isSealed)
                return (
                  <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    {/* Voucher Number & Date */}
                    <td className="px-6 py-4">
                      <div className="font-black text-sm text-slate-900 dark:text-white font-mono">
                        {v.voucherNumber}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {toEthiopianDate(v.issuedDate)} ዓ.ም ({new Date(v.issuedDate).toLocaleDateString()})
                      </div>
                    </td>

                    {/* Department / Sector */}
                    <td className="px-6 py-4">
                      <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                        {v.department}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        {v.items?.length || 0} {language === 'AM' ? 'የተጠየቁ ዕቃዎች' : 'items requested'}
                      </div>
                    </td>

                    {/* Requested & Authorized */}
                    <td className="px-6 py-4">
                      <div className="text-xs font-black text-slate-700 dark:text-slate-200">
                        {v.requestedBy}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {language === 'AM' ? 'ፈቃጅ፦' : 'Approver:'} {v.authorizedBy || v.sealedBy || '—'}
                      </div>
                    </td>

                    {/* Official Circular Stamp Status */}
                    <td className="px-6 py-4">
                      {isVoucherSealed ? (
                        <button
                          onClick={() => setInspectingVoucher(v)}
                          title={language === 'AM' ? 'የመምሪያውን ይፋዊ ክብ ማህተም ለመመልከት ይጫኑ' : 'Click to inspect department seal'}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 shadow-2xs transition-all cursor-pointer"
                        >
                          <ShieldCheck size={14} className="text-blue-600" />
                          <span>{language === 'AM' ? '✓ በክብ ማህተም የጸደቀ' : 'Officially Sealed'}</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                            <AlertCircle size={13} className="text-amber-600" />
                            <span>{language === 'AM' ? 'ማህተም የለውም' : 'Unsealed'}</span>
                          </span>
                          {(perms.canAuthorizeM22 || user?.role === 'Manager') && (
                            <button
                              onClick={() => handleDirectSeal(v)}
                              disabled={sealingId === v.id}
                              className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-xs transition-all cursor-pointer"
                            >
                              {sealingId === v.id
                                ? (language === 'AM' ? 'በማተም ላይ...' : 'Sealing...')
                                : (language === 'AM' ? 'ክብ ማህተም ምታ' : 'Affix Seal')}
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setInspectingVoucher(v)}
                          className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title={language === 'AM' ? 'የክፍሉን ማህተም መርምር' : 'Inspect Seal & Authorization'}
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          id={`btn-print-m20-${v.id}`}
                          onClick={() => generatePDF(v)}
                          className="p-2 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title={language === 'AM' ? 'ሰነዱን ከማህተምና QR ጋር በPDF አውርድ' : 'Download Stamped PDF with QR Code'}
                        >
                          <Printer size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}

              {filteredVouchers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-400">
                    <ClipboardList size={36} className="mx-auto mb-2 opacity-30 text-cyan-500" />
                    <p className="font-bold text-sm">
                      {language === 'AM' ? 'ምንም የሞዴል 20 መጠየቂያ አልተገኘም::' : 'No Model 20 requisitions recorded yet.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal: Inspect Official Department Seal ──────────── */}
      {inspectingVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-500/20 border border-blue-400/30 text-blue-300">
                  <ShieldCheck size={26} />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-wide">
                    {language === 'AM' ? 'የክፍሉ ይፋዊ ክብ ማህተም ማረጋገጫ' : 'Official Requesting Unit Seal'}
                  </h3>
                  <p className="text-blue-200 text-xs font-mono">
                    {inspectingVoucher.voucherNumber} | {inspectingVoucher.department}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingVoucher(null)}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 space-y-6">
              {/* Genuine CSS Render of Ethiopian Round Stamp */}
              <div className="flex flex-col items-center justify-center py-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="w-56 h-56 rounded-full border-[3px] border-blue-600 flex items-center justify-center p-2 relative shadow-lg bg-blue-50/30 dark:bg-blue-950/20">
                  {/* Middle thin ring */}
                  <div className="w-full h-full rounded-full border border-blue-400 flex items-center justify-center p-2">
                    {/* Inner core ring */}
                    <div className="w-full h-full rounded-full border-2 border-blue-600 flex flex-col items-center justify-center text-center p-3 select-none">
                      <span className="text-[9px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-300">
                        ★ {inspectingVoucher.department} ★
                      </span>
                      <span className="text-[10px] font-black text-blue-800 dark:text-blue-200 uppercase tracking-widest mt-1">
                        የዕቃ መጠየቂያ
                      </span>
                      <div className="my-1 px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-black tracking-widest">
                        ★ ፀድቋል / APPROVED ★
                      </div>
                      <span className="text-[8px] font-bold text-blue-700 dark:text-blue-300">
                        ይፋዊ ክብ ማህተም
                      </span>
                      <span className="text-[8px] font-mono font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                        {toEthiopianDate(inspectingVoucher.issuedDate)} ዓ.ም
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                    <CheckCircle2 size={14} className="text-blue-600" />
                    {language === 'AM' ? 'ማህተሙ ትክክለኛና ህጋዊ ነው' : 'Authentic & Cryptographically Sealed'}
                  </span>
                  <p className="text-[11px] text-slate-500 font-mono mt-1">
                    Hash: {inspectingVoucher.sealHash || `SEAL-M20-${inspectingVoucher.voucherNumber}-GENUINE`}
                  </p>
                </div>
              </div>

              {/* Administrative Explanation for Storekeeper / Auditor */}
              <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 space-y-1">
                <p className="font-black flex items-center gap-1.5">
                  <FileCheck size={16} className="text-blue-600 shrink-0" />
                  <span>
                    {language === 'AM'
                      ? 'የመጋዘንና ዋና ንብረት ክፍል ህጋዊ መመሪያ፦'
                      : 'Storekeeper / Property Officer Directive:'}
                  </span>
                </p>
                <p className="text-[11px] leading-relaxed text-blue-800/90 dark:text-blue-300/90">
                  {language === 'AM'
                    ? `ይህ የዕቃ መጠየቂያ ሰነድ በ${inspectingVoucher.department} የስራ ኃላፊ (${inspectingVoucher.authorizedBy || inspectingVoucher.sealedBy || 'ኃላፊ'}) ይፋዊ ክብ ማህተም እና ፊርማ የጸደቀ ነው። ዋና ንብረት ክፍሉ የተጠየቀውን ንብረት በሞዴል 22 (የዕቃ ወጪ ማድረጊያ ሰነድ) አዘጋጅቶ ማስረከብ ይችላል።`
                    : `This store requisition has been authorized and stamped with the official circular seal of ${inspectingVoucher.department}. The Central Property Section can now issue these items using Model 22 (Store Issue Voucher).`}
                </p>
              </div>

              {/* Items Summary */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === 'AM' ? 'የተጠየቁ ንብረቶች ዝርዝር' : 'Requisition Items Requested'}
                </div>
                <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {inspectingVoucher.items?.map((it, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{it.assetName}</span>
                      <span className="font-mono font-black text-cyan-600 dark:text-cyan-400">
                        {it.quantity} {it.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => generatePDF(inspectingVoucher)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
                >
                  <Printer size={16} />
                  <span>{language === 'AM' ? 'የታሸገውን ሰነድ በPDF አውርድ' : 'Download Stamped PDF'}</span>
                </button>

                {perms.canAuthorizeM22 && (
                  <button
                    onClick={() => {
                      setInspectingVoucher(null)
                      setActiveTab('vouchers-m22')
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
                  >
                    <span>{language === 'AM' ? 'በሞዴል 22 ወጪ አድርግ' : 'Issue via Model 22'}</span>
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Create New Requisition with Official Seal ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
            {/* Header */}
            <header className="p-6 bg-gradient-to-r from-blue-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2.5 rounded-2xl shadow-md">
                  <ClipboardList size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black">
                    {language === 'AM' ? 'አዲስ የዕቃ መጠየቂያ (ሞዴል 20)' : 'New Store Requisition (Model 20)'}
                  </h3>
                  <p className="text-blue-300 text-[10px] font-black uppercase tracking-widest">
                    {language === 'AM'
                      ? 'የጠያቂው የስራ ክፍል ይፋዊ ክብ ማህተም እና የኃላፊው ፊርማ የሚያርፍበት'
                      : 'Requesting Unit Official Circular Stamp & Authorized Approval'}
                  </p>
                </div>
              </div>
              <button
                id="m20-modal-close"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </header>

            {/* Form */}
            <form id="m20-form" onSubmit={handleSubmit} className="flex-1 overflow-auto p-6 md:p-8 space-y-6">
              {/* Section 1: Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    {t.voucherNo} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-mono"
                    value={voucherNumber}
                    onChange={(e) => setVoucherNumber(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    {language === 'AM' ? 'ጠያቂው የስራ ክፍል / መምሪያ' : 'Requesting Department'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="m20-department"
                    type="text"
                    required
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold"
                    placeholder={language === 'AM' ? 'ምሳሌ፦ የስፌት ቤት አውደ-ጥናት' : 'e.g. Garment Production Dept'}
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    {language === 'AM' ? 'ጠያቂው ሰራተኛ' : 'Requested By'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="m20-requested-by"
                    type="text"
                    required
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold"
                    placeholder="Staff name"
                    value={requestedBy}
                    onChange={(e) => setRequestedBy(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <EthiopianDatePicker
                    label={<span>{language === 'AM' ? 'የተጠየቀበት ቀን' : 'Date of Request'} <span className="text-red-500">*</span></span>}
                    value={issuedDate}
                    onChange={setIssuedDate}
                  />
                </div>
              </div>

              {/* Section 2: Official Requesting Unit Circular Stamp & Authorization */}
              <div className="p-5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Stamp className="text-blue-600" size={20} />
                    <h4 className="text-xs font-black text-blue-900 dark:text-blue-200 uppercase tracking-widest">
                      {language === 'AM'
                        ? 'የጠያቂው ክፍል ይፋዊ ክብ ማህተም እና የኃላፊው ፊርማ'
                        : 'Official Requesting Unit Stamp & Authorization'}
                    </h4>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isSealed}
                      onChange={(e) => setIsSealed(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-bold text-blue-800 dark:text-blue-300">
                      {language === 'AM' ? 'የክፍሉ ይፋዊ ክብ ማህተም ያርፍበት' : 'Affix Official Circular Stamp'}
                    </span>
                  </label>
                </div>

                {isSealed && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-blue-200 dark:border-blue-800">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-blue-800 dark:text-blue-300 tracking-wider">
                        {language === 'AM' ? 'የፈቃጅ/የመምሪያው ኃላፊ ስም' : 'Authorizing Unit Head Name'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="m20-authorized-by"
                        type="text"
                        required={isSealed}
                        className="w-full bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 rounded-xl px-4 py-2 text-sm font-bold"
                        placeholder={language === 'AM' ? 'ምሳሌ፦ አቶ ተስፋዬ በቀለ' : 'e.g. Unit Head Name'}
                        value={authorizedBy}
                        onChange={(e) => setAuthorizedBy(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-blue-800 dark:text-blue-300 tracking-wider">
                        {language === 'AM' ? 'የኃላፊው የስራ መደብ' : 'Approver Position / Title'}
                      </label>
                      <input
                        type="text"
                        className="w-full bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 rounded-xl px-4 py-2 text-sm"
                        value={approverTitle}
                        onChange={(e) => setApproverTitle(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-blue-800 dark:text-blue-300 tracking-wider">
                        {language === 'AM' ? 'የዲጂታል ፊርማ ፒን (አማራጭ)' : 'Digital Security PIN (Optional)'}
                      </label>
                      <input
                        type="password"
                        className="w-full bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 rounded-xl px-4 py-2 text-sm font-mono"
                        placeholder="••••"
                        value={approverPin}
                        onChange={(e) => setApproverPin(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: Add Items */}
              <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">
                  {language === 'AM' ? 'የሚጠየቁ ንብረቶችና ግብዓቶች' : 'Items & Supplies Required'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest border-l-2 border-blue-500 pl-2">
                      {language === 'AM' ? 'ንብረት ይምረጡ' : 'Select Item'} <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="m20-asset-select"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold"
                      value={selectedAssetId}
                      onChange={(e) => setSelectedAssetId(e.target.value)}
                    >
                      <option value="">{language === 'AM' ? 'ንብረት ይምረጡ...' : 'Select Asset / Item...'}</option>
                      {assets.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.quantity} {a.unit} avail)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest border-l-2 border-blue-500 pl-2">
                      {language === 'AM' ? 'ሞዴል / ዝርዝር' : 'Model / Serial (Optional)'}
                    </label>
                    <input
                      id="m20-model"
                      type="text"
                      placeholder="Model"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm"
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest border-l-2 border-blue-500 pl-2">
                      {language === 'AM' ? 'ብዛት' : 'Quantity'}
                    </label>
                    <input
                      id="m20-qty"
                      type="number"
                      placeholder="Qty"
                      min="1"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-black"
                      value={selectedQuantity}
                      onChange={(e) => setSelectedQuantity(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <button
                  id="m20-add-item"
                  type="button"
                  onClick={handleAddItem}
                  disabled={!selectedAssetId}
                  className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all uppercase tracking-widest cursor-pointer disabled:opacity-50"
                >
                  <Plus size={18} className="inline mr-2" />
                  {language === 'AM' ? 'ወደ መጠየቂያው ጨምር' : 'Add to Requisition'}
                </button>
              </div>

              {/* Section 4: Items Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left border-collapse bg-white dark:bg-slate-900">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">{language === 'AM' ? 'ብዛት' : 'Qty'}</th>
                      <th className="px-4 py-3">{language === 'AM' ? 'መለኪያ' : 'Unit'}</th>
                      <th className="px-4 py-3">{language === 'AM' ? 'የዕቃው ስም' : 'Item Description'}</th>
                      <th className="px-4 py-3">{language === 'AM' ? 'ሞዴል' : 'Model/Serial'}</th>
                      <th className="px-4 py-3 text-right">{language === 'AM' ? 'እርምጃ' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <td className="px-4 py-3 font-bold">{idx + 1}</td>
                        <td className="px-4 py-3 font-black text-blue-600">{item.quantity}</td>
                        <td className="px-4 py-3 font-bold text-slate-500">{item.unit}</td>
                        <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">{item.assetName}</td>
                        <td className="px-4 py-3 font-mono text-xs">{item.modelSerial}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-bold italic text-xs">
                          {language === 'AM'
                            ? 'እስካሁን ምንም ንብረት አልተጨመረም::'
                            : 'No items added to requisition yet.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  id="m20-cancel"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  {language === 'AM' ? 'ሰርዝ' : 'Cancel'}
                </button>
                <button
                  id="m20-submit"
                  type="submit"
                  disabled={items.length === 0}
                  className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-black shadow-lg shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSealed
                    ? (language === 'AM' ? 'በክብ ማህተም አረጋግጥና መዝግብ' : 'Affix Official Stamp & Submit')
                    : (language === 'AM' ? 'መጠየቂያውን መዝግብ' : 'Submit Requisition')}
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
