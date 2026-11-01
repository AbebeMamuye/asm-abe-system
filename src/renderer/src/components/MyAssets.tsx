import React, { useState } from 'react'
import {
  PackageCheck,
  SendHorizontal,
  RotateCcw,
  QrCode,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Sparkles,
  ArrowRightLeft,
  Building,
  UserCheck,
  Printer
} from 'lucide-react'
import { useStore, TRANSLATIONS } from '../store/useStore'
import { Asset, AssetTransfer } from '../store/types'
import QRCodeModal from './QRCodeModal'
import { getRolePermissions } from '../lib/permissions'

export default function MyAssets() {
  const {
    user,
    assets,
    users,
    transfers,
    createTransfer,
    respondTransfer,
    createPendingRequest,
    setActiveTab,
    language
  } = useStore()

  const t = TRANSLATIONS[language]
  const perms = getRolePermissions(user?.role)

  // State for modals
  const [selectedAssetForQR, setSelectedAssetForQR] = useState<Asset | null>(null)
  const [transferModalAsset, setTransferModalAsset] = useState<Asset | null>(null)
  const [returnModalAsset, setReturnModalAsset] = useState<Asset | null>(null)
  const [showConsumableModal, setShowConsumableModal] = useState(false)

  // Form states
  const [transferRecipientId, setTransferRecipientId] = useState<string>('')
  const [transferReason, setTransferReason] = useState('')
  const [returnReason, setReturnReason] = useState('')
  const [consumableItem, setConsumableItem] = useState('')
  const [consumableQty, setConsumableQty] = useState(1)
  const [consumablePurpose, setConsumablePurpose] = useState('')
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Identify assets assigned to current user
  // (In video: ዮሐንስ ጌታቸው holds assets where custodian = 'ዮሐንስ ጌታቸው')
  const currentUserName = user?.name || ''
  const myAssignedAssets = assets.filter((a) => {
    if (!currentUserName) return true
    return (
      (a.custodian && a.custodian.trim().toLowerCase() === currentUserName.trim().toLowerCase()) ||
      (a.department && user?.departmentCode && a.department.includes(user.departmentCode))
    )
  })

  // Outgoing transfers initiated by me
  const myOutgoingTransfers = transfers.filter(
    (x) => x.fromUserName.trim().toLowerCase() === currentUserName.trim().toLowerCase()
  )

  // Incoming transfer requests addressed to me awaiting response
  const pendingIncomingTransfers = transfers.filter(
    (x) =>
      x.toUserName.trim().toLowerCase() === currentUserName.trim().toLowerCase() &&
      x.status === 'Pending'
  )

  // Stats calculation
  const totalAssetsCount = myAssignedAssets.length + myOutgoingTransfers.filter(x => x.status === 'Accepted').length
  const transferredOutCount = myOutgoingTransfers.filter(x => x.status === 'Accepted').length
  const requestedCount = transfers.filter(
    (x) =>
      (x.fromUserName.trim().toLowerCase() === currentUserName.trim().toLowerCase() ||
        x.toUserName.trim().toLowerCase() === currentUserName.trim().toLowerCase()) &&
      x.status === 'Pending'
  ).length
  const inCustodyCount = myAssignedAssets.length

  // Filtered by search
  const filteredAssets = myAssignedAssets.filter((a) => {
    const q = searchQuery.toLowerCase()
    return (
      a.name.toLowerCase().includes(q) ||
      (a.tagNumber && a.tagNumber.toLowerCase().includes(q)) ||
      a.category.toLowerCase().includes(q) ||
      (a.serialNumber && a.serialNumber.toLowerCase().includes(q))
    )
  })

  // Handle Peer-to-Peer Transfer Submission
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!transferModalAsset || !transferRecipientId) return

    const recipient = users.find((u) => u.id?.toString() === transferRecipientId)
    if (!recipient) return

    const payload: Partial<AssetTransfer> = {
      assetId: transferModalAsset.id!,
      assetName: transferModalAsset.name,
      tagNumber: transferModalAsset.tagNumber,
      fromUserId: user?.id,
      fromUserName: user?.name || 'Staff Member',
      toUserId: recipient.id,
      toUserName: recipient.name,
      department: recipient.departmentCode || transferModalAsset.department,
      reason: transferReason || 'Peer-to-peer equipment handover for operational duty.'
    }

    setIsSubmitting(true)
    try {
      await createTransfer(payload)
      setActionMessage({
        type: 'success',
        text: language === 'AM'
          ? `የንብረት ዝውውር ጥያቄ ለ ${recipient.name} በተሳካ ሁኔታ ተልኳል!`
          : `Transfer request successfully sent to ${recipient.name}!`
      })
      setTransferModalAsset(null)
      setTransferRecipientId('')
      setTransferReason('')
      setTimeout(() => setActionMessage(null), 5000)
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Failed to initiate transfer.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Return to Store Submission
  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!returnModalAsset || isSubmitting) return

    setIsSubmitting(true)
    try {
      // Find default storekeeper
      const storeKeeper = users.find((u) => u.role === 'Admin' || u.position?.includes('ግምጃ ቤት'))

      const payload = {
        type: 'Issue' as const,
        requestedBy: user?.name || 'Staff Member',
        department: user?.departmentCode || 'Education',
        description: `Return of Asset [${returnModalAsset.tagNumber}] ${returnModalAsset.name} to Store. Reason: ${returnReason}`,
        payload: {
          assetId: returnModalAsset.id,
          assetName: returnModalAsset.name,
          tagNumber: returnModalAsset.tagNumber,
          returnReason: returnReason,
          storekeeperName: storeKeeper?.name || 'ተመስገን መርሻ'
        }
      }

      const submitFn = createPendingRequest || window.api?.createPendingRequest
      if (!submitFn) {
        throw new Error('Pending request API is not available')
      }

      const res = await submitFn(payload)
      if (res?.success) {
        setActionMessage({
          type: 'success',
          text: language === 'AM'
            ? `ንብረቱን ወደ ግምጃ ቤት የመመለስ ጥያቄ ቀርቧል! የግምጃ ቤት ኃላፊው ያረጋግጡታል!`
            : `Return request submitted to Store! Awaiting storekeeper verification.`
        })
        setReturnModalAsset(null)
        setReturnReason('')
      } else {
        setActionMessage({
          type: 'error',
          text: res?.error || (language === 'AM' ? 'ጥያቄውን ማቅረብ አልተቻለም!' : 'Failed to submit return request.')
        })
      }
    } catch (err: any) {
      console.error('Error submitting return request:', err)
      setActionMessage({
        type: 'error',
        text: err?.message || (language === 'AM' ? 'ጥያቄውን በማቅረብ ላይ ስህተት አጋጥሟል!' : 'Error submitting return request.')
      })
    } finally {
      setIsSubmitting(false)
      setTimeout(() => setActionMessage(null), 5000)
    }
  }

  // Handle Consumable Request Submission
  const handleConsumableSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!consumableItem || isSubmitting) return

    setIsSubmitting(true)
    try {
      const payload = {
        type: 'Requisition' as const,
        requestedBy: user?.name || 'Staff Member',
        department: user?.departmentCode || 'Education',
        description: `Consumable Requisition: ${consumableQty}x ${consumableItem} for ${consumablePurpose}`,
        payload: {
          item: consumableItem,
          quantity: consumableQty,
          purpose: consumablePurpose
        }
      }

      const submitFn = createPendingRequest || window.api?.createPendingRequest
      if (!submitFn) {
        throw new Error('Pending request API is not available')
      }

      const res = await submitFn(payload)
      if (res?.success) {
        setActionMessage({
          type: 'success',
          text: language === 'AM'
            ? `የአላቂ ንብረት ጥያቄ በተሳካ ሁኔታ ተልኳል! ለቅርብ አለቃዎ ተመርቷል!`
            : `Consumable request forwarded to immediate supervisor for approval!`
        })
        setShowConsumableModal(false)
        setConsumableItem('')
        setConsumableQty(1)
        setConsumablePurpose('')
      } else {
        setActionMessage({
          type: 'error',
          text: res?.error || (language === 'AM' ? 'ጥያቄውን ማቅረብ አልተቻለም!' : 'Failed to submit requisition.')
        })
      }
    } catch (err: any) {
      console.error('Error submitting consumable requisition:', err)
      setActionMessage({
        type: 'error',
        text: err?.message || (language === 'AM' ? 'ጥያቄውን በማቅረብ ላይ ስህተት አጋጥሟል!' : 'Error submitting requisition.')
      })
    } finally {
      setIsSubmitting(false)
      setTimeout(() => setActionMessage(null), 5000)
    }
  }

  // Print Custody Report
  const handlePrintHandover = () => {
    window.print()
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-black uppercase tracking-widest border border-blue-400/20">
              <Sparkles size={14} />
              <span>{language === 'AM' ? 'የአዲስ አበባ ከተማ አስተዳደር AMIS' : 'Addis Ababa City AMIS'}</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight">
              {language === 'AM' ? 'የእኔ ንብረቶች (የሰራተኛ ፖርታል)' : 'My Assigned Assets (Staff Portal)'}
            </h1>
            <p className="text-slate-300 text-sm max-w-xl">
              {language === 'AM'
                ? `እንኳን ደህና መጡ ${user?.name || ''} (${user?.position || 'ባለሙያ'})! በእርስዎ ኃላፊነት ስር ያሉ የመንግስት ንብረቶችን እዚህ ማስተዳደር፣ QR ኮድ ማመንጨት እና የዝውውር ሂደቶችን ማከናወን ይችላሉ።`
                : `Welcome ${user?.name || ''} (${user?.position || 'Staff'})! Manage government assets under your direct custody, print official QR tags, and execute peer-to-peer transfers.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="btn-request-consumables"
              onClick={() => setShowConsumableModal(true)}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg hover:shadow-blue-500/20 transition-all cursor-pointer"
            >
              <PlusCircle size={16} />
              <span>{language === 'AM' ? 'አላቂ ንብረት መጠየቅ' : 'Request Consumables'}</span>
            </button>
            <button
              id="btn-request-m20"
              onClick={() => setActiveTab('vouchers-m20')}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <FileSpreadsheet size={16} />
              <span>{language === 'AM' ? 'ቋሚ ንብረት መጠየቅ (ሞዴል 20)' : 'Request Fixed Asset (M20)'}</span>
            </button>
            <button
              id="btn-print-handover"
              onClick={handlePrintHandover}
              className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg hover:shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Printer size={16} />
              <span>{language === 'AM' ? 'የርክክብ ሰነድ አትም (PDF)' : 'Print Handover (PDF)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action Notification Message */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold animate-in slide-in-from-top-2 duration-300 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}
        >
          {actionMessage.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Incoming Transfers Alert (ዮሐንስ ➡️ አለሙ transfer notification) */}
      {pendingIncomingTransfers.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-800/60 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-3 text-amber-800 dark:text-amber-300">
            <AlertCircle size={24} className="animate-bounce" />
            <div>
              <h3 className="text-base font-black">
                {language === 'AM'
                  ? `አዲስ የንብረት ዝውውር ጥያቄ ቀርቦልዎታል (${pendingIncomingTransfers.length})`
                  : `Incoming Asset Transfer Pending Your Acceptance (${pendingIncomingTransfers.length})`}
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                {language === 'AM'
                  ? 'ከስራ ባልደረባዎ የተላከልዎትን ንብረት በአካል ካረጋገጡ በኋላ ተቀብለው በስምዎ ይመዝግቡ ወይም ውድቅ ያድርጉ።'
                  : 'Please physically inspect the item, then accept to take custody or decline.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingIncomingTransfers.map((req) => (
              <div
                key={req.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-amber-200 dark:border-amber-900/40 shadow-sm flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-black text-slate-500 mb-1">
                    <span>{req.tagNumber || 'PPAA-ASSET'}</span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                      {req.transferDate?.split('T')[0] || 'Today'}
                    </span>
                  </div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white">{req.assetName}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    <span className="font-bold">{language === 'AM' ? 'ከላኪ፡' : 'From:'}</span> {req.fromUserName}
                  </p>
                  <p className="text-xs text-slate-500 italic mt-0.5">"{req.reason}"</p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    id={`btn-accept-transfer-${req.id}`}
                    onClick={async () => {
                      await respondTransfer(req.id!, 'Accepted', 'Physically verified and accepted by recipient.')
                      setActionMessage({
                        type: 'success',
                        text: language === 'AM'
                          ? `ንብረቱን በተሳካ ሁኔታ ተረክበዋል! አሁን በእርስዎ ኃላፊነት ስር ገብቷል።`
                          : `Asset accepted into your custody!`
                      })
                    }}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 size={15} />
                    <span>{language === 'AM' ? 'ተቀበል (Accept)' : 'Accept'}</span>
                  </button>
                  <button
                    id={`btn-decline-transfer-${req.id}`}
                    onClick={async () => {
                      await respondTransfer(req.id!, 'Declined', 'Declined by recipient.')
                      setActionMessage({
                        type: 'error',
                        text: language === 'AM' ? `የንብረት ዝውውሩ ውድቅ ተደርጓል!` : `Transfer declined.`
                      })
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <XCircle size={15} />
                    <span>{language === 'AM' ? 'አትቀበል' : 'Decline'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4 AMIS Stat Badges matching Part 1 video */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-blue-500 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              {t.totalAssetsBadge}
            </span>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:scale-110 transition-transform">
              <PackageCheck size={22} />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-4">{totalAssetsCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">{language === 'AM' ? 'በስምዎ የተመዘገቡ' : 'Registered to your name'}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-violet-500 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              {t.transferredAssetsBadge}
            </span>
            <div className="p-3 bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-2xl group-hover:scale-110 transition-transform">
              <ArrowRightLeft size={22} />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-4">{transferredOutCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">{language === 'AM' ? 'ለባልደረባ የተላለፉ' : 'Transferred to peers'}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-amber-500 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              {t.requestedAssetsBadge}
            </span>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl group-hover:scale-110 transition-transform">
              <SendHorizontal size={22} />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-4">{requestedCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">{language === 'AM' ? 'በሂደት ላይ ያሉ ጥያቄዎች' : 'Pending requests'}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              {t.issuedAssetsBadge}
            </span>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl group-hover:scale-110 transition-transform">
              <UserCheck size={22} />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-4">{inCustodyCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">{language === 'AM' ? 'በአካል እጅዎ ላይ ያሉ' : 'Physically in possession'}</p>
        </div>
      </div>

      {/* Main Asset Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {language === 'AM' ? 'በእጄ የሚገኙ ንብረቶች ዝርዝር' : 'Assets in My Physical Possession'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'AM'
                ? 'እያንዳንዱ ንብረት በ QR ኮድ ተለጥፎ መታወቅ እና መያዝ አለበት።'
                : 'Every asset must carry an official AMIS adhesive QR barcode sticker.'}
            </p>
          </div>

          <div className="w-full sm:w-72">
            <input
              id="search-my-assets"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'AM' ? 'በስም ወይም በመለያ ፈልግ...' : 'Search by name or tag...'}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {filteredAssets.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 mx-auto bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
              <PackageCheck size={32} />
            </div>
            <h3 className="text-base font-black text-slate-800 dark:text-slate-200">
              {language === 'AM' ? 'ምንም ንብረት አልተገኘም' : 'No Assets Found'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {language === 'AM'
                ? 'በእርስዎ ስም የተመደበ ንብረት የለም ወይም በፍለጋው መሰረት አልተገኘም።'
                : 'No assets are currently assigned under your direct custody name.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse border-2 border-slate-900 dark:border-slate-700">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest">
                  <th className="py-4 px-6 border-2 border-slate-900 dark:border-slate-700">{t.tagNumber}</th>
                  <th className="py-4 px-6 border-2 border-slate-900 dark:border-slate-700">{t.assetName}</th>
                  <th className="py-4 px-6 border-2 border-slate-900 dark:border-slate-700">{t.category}</th>
                  <th className="py-4 px-6 border-2 border-slate-900 dark:border-slate-700">{t.condition}</th>
                  <th className="py-4 px-6 border-2 border-slate-900 dark:border-slate-700">{t.location}</th>
                  <th className="py-4 px-6 border-2 border-slate-900 dark:border-slate-700 text-center">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
                {filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 border-2 border-slate-900 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-lg">
                          {asset.tagNumber || `PPAA-${asset.id}`}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 border-2 border-slate-900 dark:border-slate-700">
                      <div className="font-bold text-slate-900 dark:text-white">{asset.name}</div>
                      {asset.serialNumber && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">SN: {asset.serialNumber}</div>
                      )}
                    </td>
                    <td className="py-4 px-6 border-2 border-slate-900 dark:border-slate-700">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {asset.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 border-2 border-slate-900 dark:border-slate-700">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                          asset.condition === 'Functional'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                        }`}
                      >
                        {asset.condition}
                      </span>
                    </td>
                    <td className="py-4 px-6 border-2 border-slate-900 dark:border-slate-700 text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Building size={14} className="text-slate-400" />
                        <span>{asset.location || 'Office'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 border-2 border-slate-900 dark:border-slate-700">
                      <div className="flex items-center justify-center gap-2">
                        {/* QR Code Sticker Modal Trigger */}
                        <button
                          id={`btn-qr-${asset.id}`}
                          onClick={() => setSelectedAssetForQR(asset)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                          title="Generate AMIS QR Barcode Sticker"
                        >
                          <QrCode size={14} />
                          <span>QR ኮድ</span>
                        </button>

                        {/* Peer-to-Peer Transfer Button */}
                        {perms.canInitiateTransfer && (
                        <button
                          id={`btn-transfer-${asset.id}`}
                          onClick={() => setTransferModalAsset(asset)}
                          className="px-3 py-1.5 bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/30 dark:hover:bg-violet-900/50 text-violet-700 dark:text-violet-300 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
                          title="Transfer to Colleague (Peer Transfer)"
                        >
                          <ArrowRightLeft size={14} />
                          <span>{language === 'AM' ? 'አስተላልፍ' : 'Transfer'}</span>
                        </button>
                        )}

                        {/* Return to Store Button */}
                        {perms.canReturnToStore && (
                        <button
                          id={`btn-return-${asset.id}`}
                          onClick={() => setReturnModalAsset(asset)}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
                          title="Return Asset to Central Store"
                        >
                          <RotateCcw size={14} />
                          <span>{language === 'AM' ? 'መልስ' : 'Return'}</span>
                        </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Code Sticker Modal */}
      {selectedAssetForQR && (
        <QRCodeModal
          asset={selectedAssetForQR}
          onClose={() => setSelectedAssetForQR(null)}
        />
      )}

      {/* Peer Transfer Modal (ዮሐንስ ➡️ አለሙ) */}
      {transferModalAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] max-w-2xl w-full p-8 shadow-2xl border border-slate-100 dark:border-slate-800 relative animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center gap-3 text-violet-600 mb-4">
              <div className="p-3 bg-violet-50 dark:bg-violet-900/30 rounded-2xl">
                <ArrowRightLeft size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {language === 'AM' ? 'የንብረት ዝውውር ማከናወኛ (Peer Transfer)' : 'Peer-to-Peer Asset Transfer'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'AM'
                    ? 'ንብረቱን ለሌላ ሰራተኛ/መምህር በቀጥታ ሲያስተላልፉ'
                    : 'Transfer asset directly to another registered staff member.'}
                </p>
              </div>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <div className="text-xs font-black text-slate-500 uppercase">{t.assetName}</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {transferModalAsset.name} ({transferModalAsset.tagNumber})
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                  {language === 'AM' ? 'ተረካቢ ባልደረባ ይምረጡ *' : 'Select Recipient Colleague *'}
                </label>
                <select
                  id="select-transfer-recipient"
                  value={transferRecipientId}
                  onChange={(e) => setTransferRecipientId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3.5 text-xs font-bold text-slate-900 dark:text-white border-none focus:ring-2 focus:ring-violet-500"
                  required
                >
                  <option value="">{language === 'AM' ? '-- ተረካቢ ይምረጡ --' : '-- Choose Recipient --'}</option>
                  {users
                    .filter((u) => u.name !== user?.name)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} — {u.position || u.role} ({u.phone || u.email})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                  {language === 'AM' ? 'የዝውውር ምክንያት *' : 'Reason for Transfer *'}
                </label>
                <textarea
                  id="textarea-transfer-reason"
                  rows={3}
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder={
                    language === 'AM'
                      ? 'ለምሳሌ፡ ለትምህርት አሰጣጥ ስራ እንዲውል ለባልደረባዬ የተላለፈ...'
                      : 'e.g. Handover for academic classroom ICT lab operations...'
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3.5 text-xs font-medium text-slate-900 dark:text-white border-none focus:ring-2 focus:ring-violet-500"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTransferModalAsset(null)}
                  className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {language === 'AM' ? 'ሰርዝ' : 'Cancel'}
                </button>
                <button
                  id="btn-submit-transfer"
                  type="submit"
                  className="w-2/3 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-black shadow-lg shadow-violet-500/20 transition-all cursor-pointer"
                >
                  {language === 'AM' ? 'ዝውውሩን ላክ' : 'Send Transfer Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return to Store Modal */}
      {returnModalAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] max-w-2xl w-full p-8 shadow-2xl border border-slate-100 dark:border-slate-800 relative animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center gap-3 text-amber-600 mb-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-2xl">
                <RotateCcw size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {language === 'AM' ? 'ንብረት ወደ ግምጃ ቤት መመለሻ' : 'Return Asset to Store'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'AM'
                    ? 'አገልግሎት ያጠናቀቀ ወይም ብልሽት ያጋጠመውን ንብረት ለመመለስ'
                    : 'Surrender asset back to central property warehouse.'}
                </p>
              </div>
            </div>

            {actionMessage?.type === 'error' && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-xl text-xs font-bold border border-red-200 dark:border-red-800 flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{actionMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleReturnSubmit} className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <div className="text-xs font-black text-slate-500 uppercase">{t.assetName}</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {returnModalAsset.name} ({returnModalAsset.tagNumber})
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                  {language === 'AM' ? 'የመመለሻ ምክንያት *' : 'Reason for Return *'}
                </label>
                <select
                  id="select-return-reason"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3.5 text-xs font-bold text-slate-900 dark:text-white border-none focus:ring-2 focus:ring-amber-500 mb-3"
                  required
                >
                  <option value="">{language === 'AM' ? '-- ምክንያት ይምረጡ --' : '-- Choose Reason --'}</option>
                  <option value="የስራ ዝውውር / ቅጥር ማቋረጥ">የስራ ዝውውር / ቅጥር ማቋረጥ (Transfer/Resignation)</option>
                  <option value="አገልግሎቱን አጠናቋል (ከስራ ውጪ)">አገልግሎቱን አጠናቋል (Surplus/Not Needed)</option>
                  <option value="ጥገና የሚያስፈልገው / ብልሽት">ጥገና የሚያስፈልገው / ብልሽት (Needs Repair)</option>
                  <option value="የሞዴል ቅያሪ">የሞዴል ቅያሪ (Upgrade Replacement)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReturnModalAsset(null)}
                  className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {language === 'AM' ? 'ሰርዝ' : 'Cancel'}
                </button>
                <button
                  id="btn-submit-return"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span>{language === 'AM' ? 'በመላክ ላይ...' : 'Submitting...'}</span>
                  ) : (
                    <span>{language === 'AM' ? 'የመመለሻ ጥያቄ አቅርብ' : 'Submit Return Request'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Consumable Request Modal */}
      {showConsumableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] max-w-2xl w-full p-8 shadow-2xl border border-slate-100 dark:border-slate-800 relative animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center gap-3 text-blue-600 mb-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl">
                <PlusCircle size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {language === 'AM' ? 'የአላቂ ንብረት መጠየቂያ' : 'Consumable Property Requisition'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'AM'
                    ? 'ወረቀት፣ እስክሪፕቶ፣ ቀለም ወይም ሌሎች አላቂ እቃዎችን ለመጠየቅ'
                    : 'Request office stationery, toner cartridges, and supplies.'}
                </p>
              </div>
            </div>

            {actionMessage?.type === 'error' && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-xl text-xs font-bold border border-red-200 dark:border-red-800 flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{actionMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleConsumableSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                    {language === 'AM' ? 'የአላቂ እቃው አይነት *' : 'Item Description *'}
                  </label>
                  <select
                    id="select-consumable-item"
                    value={consumableItem}
                    onChange={(e) => setConsumableItem(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3.5 text-xs font-bold text-slate-900 dark:text-white border-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">{language === 'AM' ? '-- እቃ ይምረጡ --' : '-- Choose Item --'}</option>
                    <option value="A4 Double-A Copy Paper (ወረቀት በካርቶን)">A4 Double-A Copy Paper (ወረቀት በካርቶን)</option>
                    <option value="Bic Ballpoint Pens Blue (እስክሪፕቶ በፓኬት)">Bic Ballpoint Pens Blue (እስክሪፕቶ በፓኬት)</option>
                    <option value="HP LaserJet 58A Toner Cartridge (የፕሪንተር ቀለም)">HP LaserJet 58A Toner Cartridge (የፕሪንተር ቀለም)</option>
                    <option value="Dry-Erase Whiteboard Markers (የማርከር ብዕር)">Dry-Erase Whiteboard Markers (የማርከር ብዕር)</option>
                    <option value="Stapler Pins 24/6 (የስቴፕለር ሽቦ)">Stapler Pins 24/6 (የስቴፕለር ሽቦ)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                    {language === 'AM' ? 'የሚፈለገው ብዛት *' : 'Quantity Needed *'}
                  </label>
                  <input
                    id="input-consumable-qty"
                    type="number"
                    min="1"
                    max="1000"
                    value={consumableQty}
                    onChange={(e) => setConsumableQty(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3.5 text-xs font-bold text-slate-900 dark:text-white border-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                  {language === 'AM' ? 'ጥቅም ላይ የሚውልበት ስራ *' : 'Purpose of Use *'}
                </label>
                <textarea
                  id="textarea-consumable-purpose"
                  rows={2}
                  value={consumablePurpose}
                  onChange={(e) => setConsumablePurpose(e.target.value)}
                  placeholder={
                    language === 'AM'
                      ? 'ለምሳሌ፡ ለፈተና ማባዣ ወረቀት እና ለመምህራን ማስታወሻ...'
                      : 'e.g. Printing exam sheets and student workbooks...'
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3.5 text-xs font-medium text-slate-900 dark:text-white border-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConsumableModal(false)}
                  className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {language === 'AM' ? 'ሰርዝ' : 'Cancel'}
                </button>
                <button
                  id="btn-submit-consumable"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span>{language === 'AM' ? 'በመላክ ላይ...' : 'Submitting...'}</span>
                  ) : (
                    <span>{language === 'AM' ? 'ጥያቄውን ላክ' : 'Submit Requisition'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
