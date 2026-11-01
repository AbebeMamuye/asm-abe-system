import React, { useState, useEffect } from 'react'
import {
  UserCheck,
  PackageCheck,
  Search,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  FileText,
  Printer,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  Eye,
  EyeOff,
  Building,
  Tag,
  Clock,
  Sparkles,
  Check,
  X
} from 'lucide-react'
import { useStore, TRANSLATIONS, callAPI, Asset, User } from '../store/useStore'
import { toEthiopianDate, getCurrentEthiopianDate } from '../lib/ethiopianCalendar'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import QRCode from 'qrcode'

export interface ClearanceRecord {
  id?: number
  clearanceNo: string
  employeeId?: number
  employeeName: string
  department: string
  position?: string
  reason: string
  status: 'IN_PROGRESS' | 'CLEARED' | 'REJECTED'
  initialAssetCount: number
  clearedAssetCount: number
  clearedAt?: string
  clearedByStorekeeperId?: number
  clearedByStorekeeperName?: string
  approverSignatureHash?: string
  createdAt?: string
}

const EmployeeClearance: React.FC = () => {
  const { user, users, language, orgName, orgTagline, fetchUsers } = useStore()
  const t = TRANSLATIONS[language]

  const [clearances, setClearances] = useState<ClearanceRecord[]>([])
  const [selectedClearance, setSelectedClearance] = useState<ClearanceRecord | null>(null)
  const [employeeAssets, setEmployeeAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // New Clearance Modal state
  const [showNewModal, setShowNewModal] = useState(false)
  const [newEmployeeName, setNewEmployeeName] = useState('')
  const [newReason, setNewReason] = useState('Resignation')
  const [previewAssetCount, setPreviewAssetCount] = useState<number | null>(null)

  // Return to store modal state
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [selectedAssetToReturn, setSelectedAssetToReturn] = useState<Asset | null>(null)
  const [returnCondition, setReturnCondition] = useState('Functional')
  const [returnStoreNo, setReturnStoreNo] = useState('01')
  const [returnShelfNo, setReturnShelfNo] = useState('')
  const [returnNote, setReturnNote] = useState('')

  // Fast Barcode / QR Scan state
  const [scanTagInput, setScanTagInput] = useState('')
  const [scanFeedback, setScanFeedback] = useState<string | null>(null)

  // Approval PIN Modal state
  const [showPinModal, setShowPinModal] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [showPinPassword, setShowPinPassword] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)

  // Load clearances
  const loadClearances = async () => {
    setIsLoading(true)
    try {
      const data = await callAPI('/clearance')
      setClearances(data || [])
      if (selectedClearance) {
        const updated = (data || []).find((c: ClearanceRecord) => c.clearanceNo === selectedClearance.clearanceNo)
        if (updated) setSelectedClearance(updated)
      }
    } catch (err) {
      console.error('Failed to load clearances:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Load assets for selected clearance employee
  const loadEmployeeAssets = async (empName: string) => {
    if (!empName) {
      setEmployeeAssets([])
      return
    }
    try {
      const data = await callAPI(`/clearance/employee-assets/${encodeURIComponent(empName)}`)
      setEmployeeAssets(data || [])
    } catch (err) {
      console.error('Failed to load employee assets:', err)
      setEmployeeAssets([])
    }
  }

  useEffect(() => {
    loadClearances()
    fetchUsers()
  }, [])

  useEffect(() => {
    if (selectedClearance) {
      loadEmployeeAssets(selectedClearance.employeeName)
    }
  }, [selectedClearance])

  // Update preview asset count when selecting employee in New Modal
  useEffect(() => {
    if (newEmployeeName) {
      callAPI(`/clearance/employee-assets/${encodeURIComponent(newEmployeeName)}`)
        .then((res) => setPreviewAssetCount(Array.isArray(res) ? res.length : 0))
        .catch(() => setPreviewAssetCount(0))
    } else {
      setPreviewAssetCount(null)
    }
  }, [newEmployeeName])

  // Create new clearance
  const handleCreateClearance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmployeeName.trim()) return

    const selectedUser = users.find((u) => u.name === newEmployeeName)
    try {
      const res = await callAPI('/clearance', 'POST', {
        employeeName: newEmployeeName,
        employeeId: selectedUser?.id,
        department: selectedUser?.department || selectedUser?.departmentCode || 'General',
        position: selectedUser?.position || 'Staff',
        reason: newReason
      })

      if (res?.success) {
        setShowNewModal(false)
        setNewEmployeeName('')
        await loadClearances()
        const created = {
          clearanceNo: res.clearanceNo,
          employeeName: newEmployeeName,
          department: selectedUser?.department || 'General',
          position: selectedUser?.position || 'Staff',
          reason: newReason,
          status: res.status,
          initialAssetCount: res.initialAssetCount,
          clearedAssetCount: 0
        } as ClearanceRecord
        setSelectedClearance(created)
      }
    } catch (err) {
      console.error('Failed to create clearance:', err)
    }
  }

  // Handle return asset to store
  const handleConfirmReturn = async () => {
    if (!selectedAssetToReturn || !selectedClearance) return

    try {
      const res = await callAPI('/clearance/return-asset', 'POST', {
        assetId: selectedAssetToReturn.id,
        employeeName: selectedClearance.employeeName,
        condition: returnCondition,
        storeNo: returnStoreNo,
        shelfNo: returnShelfNo,
        handledBy: user?.name || 'Storekeeper',
        notes: returnNote
      })

      if (res?.success) {
        setShowReturnModal(false)
        setSelectedAssetToReturn(null)
        setReturnNote('')
        await loadEmployeeAssets(selectedClearance.employeeName)
        await loadClearances()
      } else {
        alert(res?.error || 'Failed to return asset')
      }
    } catch (err) {
      console.error('Return error:', err)
    }
  }

  // Handle fast tag scan/search
  const handleFastScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scanTagInput.trim() || !selectedClearance) return

    const cleanTag = scanTagInput.trim().toLowerCase()
    const matched = employeeAssets.find(
      (a) =>
        (a.tagNumber && a.tagNumber.toLowerCase() === cleanTag) ||
        (a.serialNumber && a.serialNumber.toLowerCase() === cleanTag) ||
        a.id?.toString() === cleanTag
    )

    if (!matched) {
      setScanFeedback(language === 'AM' ? '❌ ንብረቱ በዚህ ሰራተኛ ስም አልተገኘም!' : '❌ Asset not found under this employee!')
      return
    }

    // Auto return matched asset
    try {
      const res = await callAPI('/clearance/return-asset', 'POST', {
        assetId: matched.id,
        employeeName: selectedClearance.employeeName,
        condition: 'Functional',
        storeNo: 'Main Store',
        handledBy: user?.name || 'Storekeeper',
        notes: 'Fast scanned clearance return'
      })

      if (res?.success) {
        setScanFeedback(language === 'AM' ? `✅ [${matched.name}] በተሳካ ሁኔታ ገቢ ሆኗል!` : `✅ [${matched.name}] checked in successfully!`)
        setScanTagInput('')
        await loadEmployeeAssets(selectedClearance.employeeName)
        await loadClearances()
      }
    } catch (err) {
      setScanFeedback('Failed to return scanned asset')
    }
  }

  // Finalize Clearance with Approver PIN
  const handleFinalizeWithPin = async () => {
    if (!selectedClearance || !user) return
    if (!pinInput.trim()) {
      setPinError(language === 'AM' ? 'እባክዎ የማረጋገጫ ፒን ያስገቡ!' : 'Please enter security PIN!')
      return
    }

    setIsFinalizing(true)
    setPinError('')
    try {
      const res = await callAPI('/clearance/finalize', 'POST', {
        clearanceNo: selectedClearance.clearanceNo,
        employeeName: selectedClearance.employeeName,
        approverId: user.id,
        approverName: user.name,
        approverPin: pinInput
      })

      if (res?.success) {
        setShowPinModal(false)
        setPinInput('')
        await loadClearances()
        // Update local selection
        setSelectedClearance((prev) =>
          prev
            ? {
                ...prev,
                status: 'CLEARED',
                approverSignatureHash: res.signatureHash,
                clearedAt: res.clearedAt
              }
            : null
        )
      } else {
        setPinError(res?.error || 'PIN verification failed')
      }
    } catch (err: any) {
      setPinError(err.message || 'Error finalizing clearance')
    } finally {
      setIsFinalizing(false)
    }
  }

  // ── Official Clearance Certificate PDF ──────────────────────────────────────────
  const handlePrintCertificate = async (clearance: ClearanceRecord) => {
    const doc = new jsPDF()
    const gcDate = new Date(clearance.clearedAt || Date.now()).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    const eDate = toEthiopianDate(clearance.clearedAt || new Date().toISOString().split('T')[0])
    const sanitize = (text: string | undefined) => (text ? text.replace(/[^\x00-\x7F]/g, '').trim() : '')

    // Certificate Outer Frame
    doc.setDrawColor(37, 99, 235)
    doc.setLineWidth(1.5)
    doc.rect(10, 10, 190, 277)
    doc.setDrawColor(203, 213, 225)
    doc.setLineWidth(0.5)
    doc.rect(12, 12, 186, 273)

    // Header Badge
    doc.setFillColor(37, 99, 235)
    doc.rect(14, 14, 182, 7, 'F')
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text('OFFICIAL CERTIFICATE OF PROPERTY CLEARANCE — የንብረት ዕዳ የለበትም ማረጋገጫ', 105, 18.5, { align: 'center' })

    // Institution Name
    doc.setFontSize(14)
    doc.setTextColor(15, 23, 42)
    doc.setFont('helvetica', 'bold')
    doc.text(sanitize(orgName).toUpperCase() || 'PUBLIC PROPERTY ADMINISTRATION', 105, 30, { align: 'center' })

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100)
    doc.text(sanitize(orgTagline).toUpperCase() || 'PROPERTY & INVENTORY CONTROL AUTHORITY', 105, 35, { align: 'center' })

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 41, 59)
    doc.text('CERTIFICATE OF PROPERTY CLEARANCE & HANDOVER', 105, 45, { align: 'center' })

    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.4)
    doc.line(20, 48, 190, 48)

    // Meta details box
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(50)
    doc.text(`Clearance Reference No: ${sanitize(clearance.clearanceNo)}`, 20, 56)
    doc.text(`Issue Date: ${gcDate}${eDate ? ` (EC: ${eDate})` : ''}`, 130, 56)

    doc.text(`Employee Name (የሰራተኛው ስም): ${sanitize(clearance.employeeName)}`, 20, 64)
    doc.text(`Department / Unit: ${sanitize(clearance.department)}`, 20, 72)
    doc.text(`Position / Role: ${sanitize(clearance.position) || 'Staff'}`, 130, 72)
    doc.text(`Reason for Clearance: ${sanitize(clearance.reason)}`, 20, 80)
    doc.text(`Status: DEBT-FREE (CLEARED)`, 130, 80)

    // Legal Declaration
    doc.setDrawColor(226, 232, 240)
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(20, 88, 170, 36, 3, 3, 'FD')

    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 41, 59)
    doc.text('OFFICIAL DECLARATION & AUDIT CONFIRMATION / ይፋዊ የክሊራንስ ማረጋገጫ፦', 24, 95)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(70)
    const legalText =
      'This is to officially certify that the aforementioned employee has properly and completely returned or legally ' +
      'transferred all assigned public FIXED ASSETS (ቋሚ ንብረቶች) under their custody. In accordance with Ethiopian Government ' +
      'Property Administration directives, consumable items (አላቂ እቃዎች) are expensed upon issue and not subject to physical return. ' +
      'The Property Management and Stores Section hereby confirms that this individual is COMPLETELY FREE FROM ANY FIXED ASSET LIABILITY OR DEBT.'
    doc.text(legalText, 24, 101, { maxWidth: 162, lineHeightFactor: 1.4 })

    // Asset Reconciliation Summary Table
    const summaryData = [
      ['Total Assigned Fixed Assets (ቋሚ ንብረት)', clearance.initialAssetCount.toString()],
      ['Fixed Assets Returned / Transferred (የተመለሱ)', (clearance.clearedAssetCount || clearance.initialAssetCount).toString()],
      ['Remaining Outstanding Fixed Assets (ቀሪ ቋሚ ንብረት)', '0 (Zero Outstanding)'],
      ['Consumable Supplies Status (አላቂ እቃዎች)', 'Expensed upon issue (ወጪ የተደረገ)'],
      ['Audit Liability Status', 'CLEARED & SEALED (ዕዳ የለበትም)']
    ]

    autoTable(doc, {
      startY: 132,
      head: [['Reconciliation Parameter', 'Audit Result']],
      body: summaryData,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 50, halign: 'center', fontStyle: 'bold' } }
    })

    const finalY = (doc as any).lastAutoTable.finalY + 16

    // Signatures
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(40)
    doc.text(`Storekeeper: ${sanitize(clearance.clearedByStorekeeperName) || 'Property Storekeeper'}`, 20, finalY)
    doc.text('Status: [ ALL ASSETS RETURNED ]', 20, finalY + 8)
    doc.text('Signature: _________________________', 20, finalY + 18)

    doc.text(`Authorized Approver: ${sanitize(clearance.clearedByStorekeeperName) || 'Department Head'}`, 105, finalY)
    doc.text(`Digital PIN Seal: [ VERIFIED & SEALED ]`, 105, finalY + 8)
    doc.text(`Date Authorized: ${gcDate}`, 105, finalY + 18)

    // Verification QR Code
    const qrPayload = JSON.stringify({
      doc: 'CLEARANCE_CERTIFICATE',
      ref: clearance.clearanceNo,
      employee: clearance.employeeName,
      status: 'DEBT_FREE_CLEARED',
      seal: clearance.approverSignatureHash || 'VERIFIED-AMIS-SEAL'
    })
    const qrDataUrl = await QRCode.toDataURL(qrPayload, { width: 120, margin: 1 })
    try {
      doc.addImage(qrDataUrl, 'PNG', 145, finalY + 28, 38, 38)
      doc.setFontSize(6.5)
      doc.setTextColor(100)
      doc.text('SCAN TO VERIFY DEBT-FREE STATUS', 164, finalY + 69, { align: 'center' })
    } catch (e) {
      console.warn('QR Code embed failed:', e)
    }

    // Hash stamp footer
    if (clearance.approverSignatureHash) {
      doc.setFontSize(6.5)
      doc.setFont('courier', 'bold')
      doc.setTextColor(100)
      doc.text(`DIGITAL SIGNATURE HASH: ${clearance.approverSignatureHash}`, 105, 278, { align: 'center' })
    }

    doc.save(`Clearance_Certificate_${sanitize(clearance.employeeName)}.pdf`)
  }

  const remainingCount = employeeAssets.length
  const isZeroDebt = remainingCount === 0

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center border border-blue-200 dark:border-blue-800">
            <UserCheck size={30} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              {language === 'AM' ? 'የሰራተኞች ስንብትና የንብረት ክሊራንስ' : 'Employee Clearance & Handover'}
            </h1>
            <p className="text-xs text-slate-500 font-bold mt-0.5">
              {language === 'AM'
                ? 'የሰራተኛ ቋሚ ንብረት ይዞታን ማረጋገጥ፣ ፈጣን የ QR ርክክብ እና የዜሮ-ዕዳ ማረጋገጫ ምስክር ወረቀት'
                : 'Digital Custody Verification, Instant QR Handover, and Zero-Debt Clearance Certification'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadClearances}
            className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowNewModal(true)}
            className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus size={18} />
            <span>{language === 'AM' ? 'አዲስ ክሊራንስ ጀምር' : 'New Clearance'}</span>
          </button>
        </div>
      </div>

      {/* MoF Legal Directive Policy Banner: Fixed Assets vs Consumables */}
      <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 flex items-start gap-3">
        <Sparkles size={20} className="text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          <strong className="text-blue-700 dark:text-blue-400 font-black block mb-0.5">
            {language === 'AM' ? '📌 የኢትዮጵያ የመንግስት ንብረት መመሪያ ህግ (ቋሚ እቃዎች ብቻ ተመላሽ ይሆናሉ)፦' : '📌 Ethiopian Property Directive (Fixed Assets Mandatory Return Only):'}
          </strong>
          {language === 'AM'
            ? 'ሰራተኞች ከስራ ሲለቁ ግዴታ ተመላሽ የሚደረጉት ቋሚ ንብረቶች (Fixed Assets: ኮምፒውተሮች፣ አታሚዎች፣ ፈርኒቸሮች፣ ማሽኖችና ተሽከርካሪዎች) ብቻ ናቸው። አላቂ እቃዎች (Consumables: ወረቀት፣ እስክሪፕቶ፣ ማጽጃዎች...) በስራ ላይ ወጪ የተደረጉ (Expensed) በመሆናቸው ወደ መጋዘን አይመለሱም።'
            : 'Only assigned Fixed Assets (Electronics, Furniture, Machinery, Vehicles) must be physically returned or transferred for clearance. Consumable items (Stationery, Paper, Cleaning) are expensed upon issue and are not subject to return.'}
        </div>
      </div>

      {/* Main Grid: Left List + Right Active Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Clearances List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={language === 'AM' ? 'በሰራተኛ ስም ፈልግ...' : 'Search employee clearance...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {clearances
                .filter((c) => c.employeeName.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((clr) => {
                  const isSelected = selectedClearance?.clearanceNo === clr.clearanceNo
                  const isDone = clr.status === 'CLEARED'
                  return (
                    <div
                      key={clr.clearanceNo}
                      onClick={() => setSelectedClearance(clr)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/80 dark:bg-blue-900/20 border-blue-500 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-black text-sm text-slate-900 dark:text-white">{clr.employeeName}</div>
                          <div className="text-[11px] text-slate-500 font-bold mt-0.5">{clr.department}</div>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border ${
                            isDone
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}
                        >
                          {isDone ? 'CLEARED' : 'IN PROGRESS'}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                        <span>Ref: {clr.clearanceNo}</span>
                        <span>Reason: {clr.reason}</span>
                      </div>
                    </div>
                  )
                })}

              {clearances.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-xs font-bold">
                  {language === 'AM' ? 'ምንም የክሊራንስ መዝገብ የለም' : 'No clearance requests found'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Selected Clearance Workspace */}
        <div className="lg:col-span-8 space-y-6">
          {selectedClearance ? (
            <div className="space-y-6">
              {/* Employee Summary Card */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                      Clearance Ref: {selectedClearance.clearanceNo}
                    </span>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                      {selectedClearance.employeeName}
                    </h2>
                    <p className="text-xs text-slate-500 font-bold mt-0.5">
                      {selectedClearance.position || 'Staff'} • {selectedClearance.department} • Reason: {selectedClearance.reason}
                    </p>
                  </div>

                  {selectedClearance.status === 'CLEARED' ? (
                    <button
                      onClick={() => handlePrintCertificate(selectedClearance)}
                      className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                    >
                      <Printer size={16} />
                      <span>{language === 'AM' ? 'የክሊራንስ ሰነድ አትም (PDF)' : 'Print Certificate (PDF)'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowPinModal(true)}
                      disabled={!isZeroDebt}
                      className={`px-5 py-3 rounded-2xl font-black text-xs flex items-center gap-2 transition-all ${
                        isZeroDebt
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white shadow-lg shadow-blue-500/20 cursor-pointer'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <ShieldCheck size={16} />
                      <span>{language === 'AM' ? 'ክሊራንሱን አጽድቅ (PIN)' : 'Finalize & Sign (PIN)'}</span>
                    </button>
                  )}
                </div>

                {/* Stats Tiles */}
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <div className="text-[11px] font-bold text-slate-400 uppercase">
                      {language === 'AM' ? 'ጠቅላላ የተረከባቸው' : 'Initial Assets'}
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                      {selectedClearance.initialAssetCount}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                    <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                      {language === 'AM' ? 'የተመለሱ ንብረቶች' : 'Cleared / Returned'}
                    </div>
                    <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
                      {Math.max(0, selectedClearance.initialAssetCount - remainingCount)}
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-2xl border ${
                      remainingCount > 0
                        ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
                        : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
                    }`}
                  >
                    <div
                      className={`text-[11px] font-bold uppercase ${
                        remainingCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {language === 'AM' ? 'ቀሪ ያልተመለሱ' : 'Remaining Held'}
                    </div>
                    <div
                      className={`text-2xl font-black mt-1 ${
                        remainingCount > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-blue-700 dark:text-blue-400'
                      }`}
                    >
                      {remainingCount}
                    </div>
                  </div>
                </div>

                {/* Zero-Debt Gatekeeper Banner */}
                {isZeroDebt ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-3">
                    <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-tight">
                        {language === 'AM' ? 'ዜሮ-ዕዳ ተረጋግጧል (Zero-Debt Verified)' : 'Zero-Debt Verification Passed'}
                      </div>
                      <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 mt-0.5">
                        {language === 'AM'
                          ? 'ይህ ሰራተኛ በእጁ ምንም ዓይነት የመንግስት ንብረት የለበትም። የክሊራንስ ሰነድ ማጽደቅና ማመንጨት ይችላሉ።'
                          : 'This employee has returned all assigned assets. Ready for official digital signature approval and certification.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center gap-3">
                    <AlertTriangle size={24} className="text-amber-600 shrink-0" />
                    <div>
                      <div className="text-xs font-black text-amber-800 dark:text-amber-300 uppercase tracking-tight">
                        {language === 'AM'
                          ? `ክሊራንስ ታግዷል! (${remainingCount} ያልተመለሱ ንብረቶች አሉ)`
                          : `Clearance Blocked! (${remainingCount} Assets Still Outstanding)`}
                      </div>
                      <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400 mt-0.5">
                        {language === 'AM'
                          ? 'ሰራተኛው በእጁ ያሉትን ንብረቶች በሙሉ ወደ መጋዘን ገቢ ሳያደርግ ወይም በህጋዊ መንገድ ሳያስተላልፍ ሲስተሙ ክሊራንስ አይሰጥም።'
                          : 'The system strictly prohibits issuing clearance certificates until every single asset is received into store or transferred.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Fast Barcode / QR Scan Field */}
              {selectedClearance.status !== 'CLEARED' && (
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-800 dark:text-white">
                    <QrCode size={18} className="text-blue-600" />
                    <span>{language === 'AM' ? 'ፈጣን የ QR / ባርኮድ ርክክብ' : 'Fast Barcode / QR Return Scan'}</span>
                  </div>

                  <form onSubmit={handleFastScanSubmit} className="flex gap-2">
                    <input
                      type="text"
                      placeholder={language === 'AM' ? 'የንብረቱን Tag ቁጥር ወይም Barcode እዚህ ያስገቡ...' : 'Scan or type Tag / Barcode number...'}
                      value={scanTagInput}
                      onChange={(e) => {
                        setScanTagInput(e.target.value)
                        setScanFeedback(null)
                      }}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={!scanTagInput.trim()}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {language === 'AM' ? 'ገቢ አድርግ' : 'Check-In'}
                    </button>
                  </form>

                  {scanFeedback && (
                    <div className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {scanFeedback}
                    </div>
                  )}
                </div>
              )}

              {/* Held Assets List */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                      {language === 'AM' ? 'በሰራተኛው እጅ ያሉ ቋሚ ንብረቶች (ግዴታ ተመላሽ)' : 'Assigned Fixed Assets (Must be Returned)'}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase">
                      {language === 'AM' ? 'ቋሚ ብቻ' : 'Fixed Only'}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    {employeeAssets.length} {language === 'AM' ? 'ቋሚ ንብረቶች' : 'fixed items'}
                  </span>
                </div>

                {employeeAssets.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                          <th className="py-3 px-3">#</th>
                          <th className="py-3 px-3">{language === 'AM' ? 'የንብረቱ ስም' : 'Asset Description'}</th>
                          <th className="py-3 px-3">{language === 'AM' ? 'ምድብ' : 'Category'}</th>
                          <th className="py-3 px-3">Tag / Serial</th>
                          <th className="py-3 px-3">{language === 'AM' ? 'ዋጋ (ETB)' : 'Unit Cost'}</th>
                          <th className="py-3 px-3">{language === 'AM' ? 'ሁኔታ' : 'Condition'}</th>
                          <th className="py-3 px-3 text-right">{language === 'AM' ? 'ርክክብ' : 'Action'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                        {employeeAssets.map((asset, idx) => (
                          <tr key={asset.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="py-3.5 px-3 text-slate-400">{idx + 1}</td>
                            <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-white">{asset.name}</td>
                            <td className="py-3.5 px-3 text-slate-500">{asset.category}</td>
                            <td className="py-3.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                              {asset.tagNumber || `AMS-${asset.id}`}
                            </td>
                            <td className="py-3.5 px-3 font-bold">ETB {(asset.unitCost || 0).toFixed(2)}</td>
                            <td className="py-3.5 px-3">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                                {asset.condition}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-right">
                              {selectedClearance.status !== 'CLEARED' && (
                                <button
                                  onClick={() => {
                                    setSelectedAssetToReturn(asset)
                                    setShowReturnModal(true)
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold text-xs transition-all cursor-pointer"
                                >
                                  {language === 'AM' ? 'ወደ መጋዘን ገቢ' : 'Return to Store'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 text-xs font-bold space-y-2">
                    <CheckCircle2 size={36} className="text-emerald-500 mx-auto" />
                    <div>{language === 'AM' ? 'በዚህ ሰራተኛ እጅ ምንም ንብረት አልቀረም!' : 'No remaining assets assigned to this employee!'}</div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-16 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <UserCheck size={48} className="text-slate-300 mx-auto" />
              <h3 className="text-base font-black text-slate-700 dark:text-slate-300">
                {language === 'AM' ? 'የሚመረምሩትን ሰራተኛ ከግራ ይምረጡ' : 'Select a clearance record to view workspace'}
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'AM'
                  ? 'ወይም አዲስ የሰራተኛ ስንብት ጥያቄ ለመጀመር "አዲስ ክሊራንስ ጀምር" የሚለውን ይጫኑ'
                  : 'Or click "New Clearance" to initiate a new offboarding validation'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal: New Clearance ──────────────────────────────────────────────── */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {language === 'AM' ? 'አዲስ የክሊራንስ ጥያቄ ጀምር' : 'Initiate Employee Clearance'}
              </h3>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateClearance} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {language === 'AM' ? 'ሰራተኛ ይምረጡ' : 'Select Employee'} *
                </label>
                <select
                  required
                  value={newEmployeeName}
                  onChange={(e) => setNewEmployeeName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{language === 'AM' ? '-- ሰራተኛ ይምረጡ --' : '-- Choose Employee --'}</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name} ({u.department || u.departmentCode || 'General'})
                    </option>
                  ))}
                </select>
              </div>

              {previewAssetCount !== null && (
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs font-bold text-blue-700 dark:text-blue-300">
                  📦 {language === 'AM' ? 'በእጁ ያሉ ንብረቶች፦ ' : 'Currently held assets: '}
                  <strong className="text-sm">{previewAssetCount}</strong> {language === 'AM' ? 'እቃዎች' : 'items'}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {language === 'AM' ? 'የስንብት / የክሊራንስ ምክንያት' : 'Reason for Clearance'}
                </label>
                <select
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Resignation">{language === 'AM' ? 'ስራ መልቀቅ (Resignation)' : 'Resignation'}</option>
                  <option value="Transfer">{language === 'AM' ? 'የስራ ክፍል ዝውውር (Transfer)' : 'Internal Transfer'}</option>
                  <option value="Pension">{language === 'AM' ? 'ጡረታ (Pension)' : 'Pension / Retirement'}</option>
                  <option value="Study Leave">{language === 'AM' ? 'የትምህርት ፈቃድ (Study Leave)' : 'Study Leave'}</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-500 font-bold text-xs"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={!newEmployeeName}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs disabled:opacity-50"
                >
                  {language === 'AM' ? 'ጀምር' : 'Initiate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Return Asset to Store ────────────────────────────────────── */}
      {showReturnModal && selectedAssetToReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {language === 'AM' ? 'ንብረትን ወደ መጋዘን ገቢ ማድረግ' : 'Return Asset to Store'}
              </h3>
              <button onClick={() => setShowReturnModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="font-black text-xs text-slate-900 dark:text-white">{selectedAssetToReturn.name}</div>
              <div className="text-[11px] font-mono text-blue-600 mt-0.5">Tag: {selectedAssetToReturn.tagNumber}</div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {language === 'AM' ? 'የንብረቱ ሁኔታ በርክክብ ወቅት' : 'Condition at Return'}
                </label>
                <select
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none"
                >
                  <option value="Functional">{language === 'AM' ? 'ጥሩ / የሚሰራ (Functional)' : 'Functional'}</option>
                  <option value="Needs Maintenance">{language === 'AM' ? 'ጥገና የሚያስፈልገው (Needs Repair)' : 'Needs Maintenance'}</option>
                  <option value="Damaged">{language === 'AM' ? 'የተበላሸ / የተሰበረ (Damaged)' : 'Damaged'}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {language === 'AM' ? 'መጋዘን ቁጥር' : 'Store No.'}
                  </label>
                  <input
                    type="text"
                    value={returnStoreNo}
                    onChange={(e) => setReturnStoreNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {language === 'AM' ? 'መደርደሪያ (Shelf)' : 'Shelf No.'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. A-04"
                    value={returnShelfNo}
                    onChange={(e) => setReturnShelfNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {language === 'AM' ? 'የርክክብ ማስታወሻ' : 'Return Notes'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'AM' ? 'ማስታወሻ ካለ...' : 'Optional handover note...'}
                  value={returnNote}
                  onChange={(e) => setReturnNote(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowReturnModal(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-500 font-bold text-xs"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmReturn}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-lg shadow-blue-500/20"
              >
                {language === 'AM' ? 'ገቢ አድርግ' : 'Confirm Return'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Approver PIN Modal ────────────────────────────────────────── */}
      {showPinModal && selectedClearance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 text-center shadow-2xl space-y-5">
            <div className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-xl shadow-emerald-500/30">
              <KeyRound size={32} />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {language === 'AM' ? 'የክሊራንስ ዲጂታል ማጽደቂያ ፒን' : 'Clearance Authorization PIN'}
              </h3>
              <p className="text-xs text-slate-500 font-bold mt-1">
                {language === 'AM'
                  ? `የ [${selectedClearance.employeeName}]ን የንብረት ዕዳ ነጻነት ለማረጋገጥ ፒንዎን ያስገቡ`
                  : `Enter your security PIN to digitally seal ${selectedClearance.employeeName}'s clearance`}
              </p>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <input
                  type={showPinPassword ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={12}
                  placeholder="••••••"
                  className="w-full px-5 py-4 pr-12 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-mono font-black text-2xl tracking-[0.4em] outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all placeholder:tracking-normal placeholder:font-sans placeholder:text-base placeholder:text-slate-400"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value)
                    setPinError('')
                  }}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleFinalizeWithPin()}
                />
                <button
                  type="button"
                  onClick={() => setShowPinPassword(!showPinPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPinPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {pinError && (
                <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-xs font-bold text-red-600 dark:text-red-400">
                  {pinError}
                </div>
              )}

              <p className="text-[10px] text-slate-400">
                🔒 {language === 'AM' ? 'ማጽደቂያው በ SHA-256 HMAC ዲጂታል ማህተም ይመዘገባል' : 'Seal will be recorded with verifiable SHA-256 HMAC'}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-500 font-bold text-xs"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleFinalizeWithPin}
                disabled={!pinInput.trim() || isFinalizing}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs shadow-xl shadow-emerald-600/30 disabled:opacity-50"
              >
                {isFinalizing ? 'Sealing...' : language === 'AM' ? 'አጽድቅና አትም' : 'Seal & Finalize'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmployeeClearance
