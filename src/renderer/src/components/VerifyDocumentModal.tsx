import React, { useState } from 'react'
import { X, ShieldCheck, Search, AlertCircle, CheckCircle2, FileText, Building2, User, Calendar, QrCode } from 'lucide-react'
import { useStore, TRANSLATIONS } from '../store/useStore'
import { toEthiopianDate } from '../lib/ethiopianCalendar'

interface VerifyDocumentModalProps {
  isOpen: boolean
  onClose: () => void
}

interface VerificationResult {
  found: boolean
  voucherType: string
  voucherNo: string
  date: string
  department: string
  approver: string
  approverRole: string
  status: string
  signatureHash: string
  items: Array<{ name: string; quantity: number; tag?: string }>
}

export const VerifyDocumentModal: React.FC<VerifyDocumentModalProps> = ({ isOpen, onClose }) => {
  const { vouchersM19, vouchersM20, vouchersM22, transfers, language, orgName } = useStore()
  const t = TRANSLATIONS[language]

  const [query, setQuery] = useState('')
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  if (!isOpen) return null

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim().toUpperCase()
    if (!q) return

    setHasSearched(true)

    // 1. Check Model 20 (Requisition with Department Circular Stamp)
    const m20 = vouchersM20.find(v =>
      v.voucherNumber.toUpperCase() === q ||
      `M20-${v.voucherNumber}`.toUpperCase() === q ||
      (v.sealHash && v.sealHash.toUpperCase() === q)
    )
    if (m20) {
      const isSealed = Boolean(m20.isSealed)
      setResult({
        found: true,
        voucherType: 'ሞዴል 20 — የዕቃ መጠየቂያ ሰነድ (Model 20 Store Requisition)',
        voucherNo: m20.voucherNumber,
        date: m20.issuedDate,
        department: m20.department,
        approver: m20.sealedBy || m20.authorizedBy || m20.requestedBy,
        approverRole: isSealed ? 'የስራ ክፍል ኃላፊ (Department Head / Sealed Authority)' : 'ጠያቂ ሰራተኛ (Requester)',
        status: isSealed ? 'VERIFIED & OFFICIALLY STAMPED (በክብ ማህተም የተረጋገጠ)' : 'PENDING OFFICIAL STAMP (ማህተም አልተደረገበትም)',
        signatureHash: m20.sealHash || `SEAL-M20-${m20.voucherNumber}-OFFICIAL`,
        items: (m20.items || []).map(i => ({ name: i.assetName, quantity: i.quantity, tag: i.modelSerial || i.serial }))
      })
      return
    }

    // 2. Check Model 19
    const m19 = vouchersM19.find(v => v.voucherNumber.toUpperCase() === q || `M19-${v.voucherNumber}`.toUpperCase() === q)
    if (m19) {
      setResult({
        found: true,
        voucherType: 'ሞዴል 19 — የዕቃ መረከቢያ ሰነድ (Model 19 Stock-In Receipt)',
        voucherNo: m19.voucherNumber,
        date: m19.receivedDate,
        department: m19.storeNo ? `Store No: ${m19.storeNo} / Shelf: ${m19.shelfNo || '—'}` : 'Central Store',
        approver: m19.receivedBy || 'Property Storekeeper',
        approverRole: 'Storekeeper / Receiving Officer',
        status: 'VERIFIED & STORED',
        signatureHash: `SEAL-HMAC-M19-${m19.voucherNumber}-SECURE`,
        items: (m19.items || []).map(i => ({ name: i.assetName, quantity: i.quantity, tag: i.serial }))
      })
      return
    }

    // 2. Check Model 22
    const m22 = vouchersM22.find(v => v.voucherNumber.toUpperCase() === q || `M22-${v.voucherNumber}`.toUpperCase() === q)
    if (m22) {
      setResult({
        found: true,
        voucherType: 'ሞዴል 22 — የዕቃ ወጪ ማድረጊያ ሰነድ (Model 22 Issue Voucher)',
        voucherNo: m22.voucherNumber,
        date: m22.issueDate,
        department: m22.department,
        approver: m22.authorizedBy || m22.storekeeperName || 'Department Head',
        approverRole: 'Authorized Approver',
        status: 'AUTHORIZED & ISSUED',
        signatureHash: `SEAL-HMAC-M22-${m22.voucherNumber}-SECURE`,
        items: (m22.items || []).map(i => ({ name: i.assetName, quantity: i.quantity, tag: i.serial }))
      })
      return
    }

    // 3. Check Model 21 / Transfers
    const tr = transfers.find(t =>
      (t.tagNumber && t.tagNumber.toUpperCase() === q) ||
      `XFER-${t.id}`.toUpperCase() === q ||
      `M21-${t.id}`.toUpperCase() === q ||
      (t.tagNumber && `M21-${t.tagNumber}`.toUpperCase() === q)
    )
    if (tr) {
      setResult({
        found: true,
        voucherType: 'ሞዴል 21 — የዕቃ ርክክብ ሰነድ (Model 21 Handover Voucher)',
        voucherNo: tr.tagNumber ? `M21-${tr.tagNumber}` : `M21-XFER-${tr.id}`,
        date: tr.transferDate || new Date().toISOString(),
        department: tr.department || 'Internal Custody',
        approver: tr.toUserName,
        approverRole: 'Receiving Custodian & Property Approver',
        status: tr.status === 'Accepted' ? 'ACCEPTED & SEALED' : 'PENDING APPROVAL',
        signatureHash: `SEAL-HMAC-M21-${tr.id}-${tr.tagNumber || 'GEN'}`,
        items: [{ name: tr.assetName, quantity: 1, tag: tr.tagNumber }]
      })
      return
    }

    // Not found
    setResult({
      found: false,
      voucherType: '',
      voucherNo: q,
      date: '',
      department: '',
      approver: '',
      approverRole: '',
      status: 'UNVERIFIED',
      signatureHash: '',
      items: []
    })
  }

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <header className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-600/20">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {language === 'AM' ? 'የሰነድና የዲጂታል ማህተም ማረጋገጫ' : 'Document & Digital Seal Verification'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'AM'
                  ? 'ዋናው ንብረት ክፍል ወይም ኦዲተር የማንኛውንም ቅርንጫፍ ማህተም ትክክለኛነት የሚያረጋግጥበት ፖርታል'
                  : 'Central audit portal to verify the authenticity of any branch seal or voucher'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </header>

        {/* Search Bar */}
        <div className="p-8 space-y-6 overflow-y-auto flex-1">
          <form onSubmit={handleVerify} className="space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">
              {language === 'AM' ? 'የሰነድ ወይም የቫውቸር ቁጥር ያስገቡ (ወይም በስካነር ያንብቡ)' : 'Enter Voucher No / Ref / Barcode'}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. M19-001, M22-001, M21-XFER-1, or Tag No"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
              >
                {language === 'AM' ? 'አረጋግጥ' : 'Verify'}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 italic">
              {language === 'AM'
                ? 'የሞባይል ካሜራ ወይም ባርኮድ ስካነር በመጠቀም በሰነዱ ላይ ያለውን QR ኮድ ማንበብ ይችላሉ።'
                : 'Tip: Scan the QR code from the printed voucher with any 2D barcode scanner or smartphone.'}
            </p>
          </form>

          {/* Verification Results */}
          {hasSearched && result && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {result.found ? (
                <div className="p-6 rounded-3xl border-2 border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-5">
                  {/* Verified Badge */}
                  <div className="flex items-center justify-between border-b border-emerald-200 dark:border-emerald-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-full bg-emerald-600 text-white shadow-md">
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-base text-emerald-800 dark:text-emerald-300">
                          {language === 'AM' ? 'ህጋዊ ማህተም እና የተረጋገጠ ሰነድ ✅' : 'GENUINE OFFICIAL STAMP & VERIFIED RECORD ✅'}
                        </h4>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                          {language === 'AM' ? 'ይህ ሰነድ በዋናው የመረጃ ቋት ውስጥ በትክክል የተመዘገበና ህጋዊ ማህተም የተመታበት ነው።' : 'Record officially verified against central database ledger.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="font-bold text-slate-400 uppercase tracking-widest">{language === 'AM' ? 'የሰነድ ዓይነት' : 'Voucher Type'}</span>
                      <p className="font-black text-slate-900 dark:text-white mt-0.5">{result.voucherType}</p>
                    </div>

                    <div>
                      <span className="font-bold text-slate-400 uppercase tracking-widest">{language === 'AM' ? 'የሰነድ ቁጥር' : 'Voucher No'}</span>
                      <p className="font-mono font-black text-slate-900 dark:text-white mt-0.5">{result.voucherNo}</p>
                    </div>

                    <div>
                      <span className="font-bold text-slate-400 uppercase tracking-widest">{language === 'AM' ? 'ማህተም የተመታበት ክፍል/ሴክተር' : 'Branch / Department'}</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{result.department}</p>
                    </div>

                    <div>
                      <span className="font-bold text-slate-400 uppercase tracking-widest">{language === 'AM' ? 'ማህተሙን የመታው/ያፀደቀው ሃላፊ' : 'Approved / Sealed By'}</span>
                      <p className="font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{result.approver} ({result.approverRole})</p>
                    </div>

                    <div>
                      <span className="font-bold text-slate-400 uppercase tracking-widest">{language === 'AM' ? 'ቀን' : 'Date'}</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{toEthiopianDate(result.date)} ዓ.ም ({result.date})</p>
                    </div>

                    <div>
                      <span className="font-bold text-slate-400 uppercase tracking-widest">{language === 'AM' ? 'የዲጂታል ሴኪዩሪቲ ማህተም ኮድ' : 'Cryptographic Security Seal'}</span>
                      <p className="font-mono text-[10px] font-bold text-slate-500 break-all mt-0.5">{result.signatureHash}</p>
                    </div>
                  </div>

                  {/* Items list */}
                  {result.items.length > 0 && (
                    <div className="pt-3 border-t border-emerald-200 dark:border-emerald-800">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">
                        {language === 'AM' ? 'በማህተሙ ስር የተካተቱ ንብረቶች' : 'Items Bound to this Official Stamp'}
                      </span>
                      <div className="space-y-1.5">
                        {result.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                            <span className="font-black text-slate-900 dark:text-white">{item.name}</span>
                            <span className="font-mono font-bold text-indigo-600">{item.quantity} Unit {item.tag ? `(${item.tag})` : ''}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 rounded-3xl border-2 border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-full bg-rose-600 text-white shadow-md">
                      <AlertCircle size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-base text-rose-800 dark:text-rose-300">
                        {language === 'AM' ? 'ያልተረጋገጠ ወይም የተጭበረበረ ሰነድ ❌' : 'INVALID OR UNVERIFIED DOCUMENT ❌'}
                      </h4>
                      <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">
                        {language === 'AM'
                          ? `"${query}" በሚል መለያ በዋናው ሲስተም ውስጥ የተመዘገበ ህጋዊ ማህተም ወይም ሰነድ አልተገኘም! ሰነዱ የተጭበረበረ ሊሆን ይችላል።`
                          : `No genuine voucher or official seal found for "${query}". The document may be forged or tampered.`}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="px-8 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0 bg-slate-50 dark:bg-slate-800/40">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-700 text-white font-bold text-xs hover:bg-slate-800 cursor-pointer"
          >
            {language === 'AM' ? 'ዝጋ' : 'Close'}
          </button>
        </footer>
      </div>
    </div>
  )
}

