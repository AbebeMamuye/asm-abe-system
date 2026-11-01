import React, { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Clock, ClipboardList, RefreshCw, ChevronDown, ChevronUp, ShieldCheck, Eye, EyeOff, Lock, KeyRound } from 'lucide-react'
import { useStore, TRANSLATIONS, callAPI } from '../store/useStore'
import ExportDropdown from './ExportDropdown'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getRolePermissions } from '../lib/permissions'

interface PendingRequest {
  id: number
  type: string
  requestedBy: string
  department: string
  description: string
  payload: string
  status: 'Pending' | 'Approved' | 'Rejected'
  reviewedBy?: string
  reviewNote?: string
  createdAt: string
  reviewedAt?: string
  digitalSignatureHash?: string
  approvalTimestamp?: string
  approvedByUserId?: number
}

const STATUS_COLOR = {
  Pending:  'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400',
  Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400',
  Rejected: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400'
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'Pending': return 'Pending'
    case 'Approved': return 'Approved'
    case 'Rejected': return 'Rejected'
    default: return status
  }
}

const Approvals = () => {
  const { user, language, reviewPendingRequest: storeReview } = useStore()
  const t = TRANSLATIONS[language]
  const [requests, setRequests] = useState<PendingRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<string>('Pending')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [reviewNote, setReviewNote] = useState<Record<number, string>>({})
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [showPinModal, setShowPinModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<{ id: number, action: 'Approved' | 'Rejected' } | null>(null)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [showPinPassword, setShowPinPassword] = useState(false)
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null)

  const fetchRequests = async () => {
    setIsLoading(true)
    try {
      if (window.api) {
        const data = await window.api.getPendingRequests(filter || undefined) as PendingRequest[]
        setRequests(data || [])
      } else {
        const data = await callAPI(`/pending${filter && filter !== 'All' ? '?status=' + filter : ''}`)
        setRequests(data || [])
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchRequests() }, [filter])

  const handleReviewClick = (id: number, action: 'Approved' | 'Rejected') => {
    setPendingAction({ id, action })
    setShowPinModal(true)
    setPinInput('')
    setPinError('')
    setRemainingAttempts(null)
  }

  const handleVerifyAndSubmit = async () => {
    if (!pendingAction || !user) return
    if (!pinInput.trim()) {
      setPinError(language === 'AM' ? 'እባክዎ የማረጋገጫ ፒን ያስገቡ!' : 'Please enter security PIN!')
      return
    }

    try {
      let verifyResult: { valid: boolean; error?: string; remainingAttempts?: number; locked?: boolean }
      if (window.api?.verifyPin) {
        const ok = await window.api.verifyPin(user.id!, pinInput)
        verifyResult = { valid: ok }
      } else {
        verifyResult = await callAPI('/auth/verify-pin', 'POST', { userId: user.id, pin: pinInput })
      }

      if (!verifyResult.valid) {
        setPinError(verifyResult.error || (language === 'AM' ? 'የተሳሳተ የዲጂታል ፊርማ ፒን!' : 'Invalid Security PIN!'))
        if (verifyResult.remainingAttempts !== undefined) {
          setRemainingAttempts(verifyResult.remainingAttempts)
        }
        return
      }

      setProcessingId(pendingAction.id)
      setShowPinModal(false)

      if (window.api) {
        await window.api.reviewPendingRequest(
          pendingAction.id,
          pendingAction.action,
          user.name,
          reviewNote[pendingAction.id] || '',
          user.id
        )
      } else {
        await storeReview(
          pendingAction.id,
          pendingAction.action,
          user.name,
          reviewNote[pendingAction.id] || '',
          user.id
        )
      }

      await fetchRequests()
      setProcessingId(null)
      setPendingAction(null)
    } catch (e: any) {
      setPinError(e.message || 'Error processing review')
    }
  }

  const perms = getRolePermissions(user?.role)
  const isAdmin = perms.canApproveRequests

  const generatePDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(18); doc.text('PENDING REQUESTS & APPROVALS LOG', 105, 20, { align: 'center' })
    const tableData = requests.map((r, i) => [
      i + 1, r.type, r.requestedBy, r.department, r.status, new Date(r.createdAt).toLocaleString()
    ])
    autoTable(doc, {
      startY: 30,
      head: [['#', 'Type', 'Requested By', 'Department', 'Status', 'Date']],
      body: tableData,
      theme: 'grid', headStyles: { fillColor: [30, 41, 59] }
    })
    doc.save('Approvals_Log.pdf')
  }

  const exportData = requests.map(r => ({
    'ID': r.id,
    'Type': r.type,
    'Requested By': r.requestedBy,
    'Department': r.department,
    'Description': r.description,
    'Status': r.status,
    'Created At': new Date(r.createdAt).toLocaleString(),
    'Reviewed By': r.reviewedBy || 'N/A',
    'Review Note': r.reviewNote || ''
  }))

  return (
    <div className="space-y-6 animate-in zoom-in-95 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
            <ClipboardList size={28} className="text-amber-500" />
            {isAdmin ? (language === 'AM' ? 'የጥያቄዎች ማጽደቂያ' : 'Request Approvals') : (language === 'AM' ? 'ያቀረብኳቸው ጥያቄዎች' : 'My Submitted Requests')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1 text-sm">
            {isAdmin
              ? (language === 'AM' ? 'ከሌሎች ተጠቃሚዎች የቀረቡ የንብረት ጥያቄዎችን እዚህ መርምረው ያጽድቁ።' : 'Review and approve or reject pending asset requests from users.')
              : (language === 'AM' ? 'ያቀረቧቸውን ጥያቄዎች ሁኔታ እዚህ ይከታተሉ።' : 'Track the status of requests you have submitted for admin approval.')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportDropdown data={exportData} filename="Approvals_List" onExportPDF={generatePDF} />
          {/* Status Filter */}
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
            {['Pending', 'Approved', 'Rejected', ''].map((s) => (
              <button
                key={s || 'all'}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  filter === s
                    ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {s ? getStatusLabel(s) : (language === 'AM' ? 'ሁሉንም' : 'All')}
              </button>
            ))}
          </div>
          <button
            onClick={fetchRequests}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-all"
            title="Refresh"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin text-slate-400' : 'text-slate-600 dark:text-slate-300'} />
          </button>
        </div>
      </header>

      {/* Pending count badge for admin */}
      {isAdmin && (
        <div className="flex gap-4">
          {[
            { label: t.pending, count: requests.filter(r => r.status === 'Pending').length, color: 'amber' },
            { label: t.approved, count: requests.filter(r => r.status === 'Approved').length, color: 'emerald' },
            { label: t.rejected, count: requests.filter(r => r.status === 'Rejected').length, color: 'red' },
          ].map(stat => (
            <div key={stat.label} className={`flex-1 p-4 rounded-2xl border bg-${stat.color}-50 dark:bg-${stat.color}-900/10 border-${stat.color}-100 dark:border-${stat.color}-900/20`}>
              <p className={`text-3xl font-black text-${stat.color}-600`}>{stat.count}</p>
              <p className={`text-xs font-bold uppercase tracking-widest text-${stat.color}-500 mt-1`}>{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* All-Border Table for Approvals */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-700 overflow-hidden shadow-xs">
        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && requests.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <ClipboardList size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-bold">{language === 'AM' ? 'ምንም ጥያቄ አልተገኘም' : 'No requests found.'}</p>
          </div>
        )}

        {!isLoading && requests.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border-2 border-slate-900 dark:border-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'መለያ / ቀን' : 'ID & Date'}</th>
                  <th className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'የጥያቄ አይነት' : 'Type'}</th>
                  <th className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'ጠያቂ / መምሪያ' : 'Requester & Dept'}</th>
                  <th className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'የጥያቄው ዝርዝር' : 'Description / Payload'}</th>
                  <th className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700 text-center">{language === 'AM' ? 'ሁኔታ' : 'Status'}</th>
                  <th className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'የውሳኔ ማስታወሻ' : 'Review Note'}</th>
                  {isAdmin && <th className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700 text-center">{language === 'AM' ? 'ተግባራት' : 'Actions'}</th>}
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => {
                  let payload: any = {}
                  try { payload = JSON.parse(req.payload) } catch (_) {}
                  const isPending = req.status === 'Pending'

                  return (
                    <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700 font-mono text-xs font-bold text-slate-500">
                        <div>#{req.id}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{new Date(req.createdAt).toLocaleDateString()}</div>
                      </td>

                      <td className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700">
                        <span className="font-black text-xs text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md">
                          {req.type}
                        </span>
                      </td>

                      <td className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700">
                        <div className="font-black text-xs text-slate-900 dark:text-white">{req.requestedBy}</div>
                        <div className="text-[11px] text-slate-400">{req.department || '—'}</div>
                      </td>

                      <td className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700 max-w-xs">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 line-clamp-2">{req.description || '—'}</p>
                        {payload.items && payload.items.length > 0 && (
                          <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                            📦 {payload.items.length} {language === 'AM' ? 'እቃዎች ተካትተዋል' : 'item(s) requested'}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700 text-center">
                        <span className={`inline-block px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full border ${STATUS_COLOR[req.status]}`}>
                          {getStatusLabel(req.status)}
                        </span>
                      </td>

                      <td className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700 text-xs text-slate-500 max-w-xs">
                        {req.reviewedBy && (
                          <div>
                            <div className="font-bold text-slate-700 dark:text-slate-300">
                              By {req.reviewedBy}
                            </div>
                            {req.digitalSignatureHash && (
                              <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-[9px] font-mono font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800" title={req.digitalSignatureHash}>
                                🔒 {req.digitalSignatureHash.substring(0, 16)}...
                              </div>
                            )}
                          </div>
                        )}
                        {req.reviewNote ? (
                          <div className="italic text-[11px] text-slate-400">"{req.reviewNote}"</div>
                        ) : isPending ? (
                          <input
                            type="text"
                            placeholder={language === 'AM' ? 'የውሳኔ ማስታወሻ...' : 'Add review note...'}
                            className="w-full px-2 py-1 text-xs border rounded-lg bg-slate-50 dark:bg-slate-800"
                            value={reviewNote[req.id] || ''}
                            onChange={(e) => setReviewNote({ ...reviewNote, [req.id]: e.target.value })}
                          />
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {isAdmin && (
                        <td className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700 text-center">
                          {isPending ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleReviewClick(req.id, 'Approved')}
                                disabled={processingId === req.id}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                                title="Approve Request"
                              >
                                <CheckCircle2 size={13} />
                                <span>{language === 'AM' ? 'አጽድቅ' : 'Approve'}</span>
                              </button>
                              <button
                                onClick={() => handleReviewClick(req.id, 'Rejected')}
                                disabled={processingId === req.id}
                                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                                title="Reject Request"
                              >
                                <XCircle size={13} />
                                <span>{language === 'AM' ? 'ውድቅ' : 'Reject'}</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-bold">
                              {language === 'AM' ? 'ተጠናቋል' : 'Completed'}
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Digital Signature PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto shadow-inner bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-blue-500/30">
              <KeyRound size={32} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {language === 'AM' ? 'የዲጂታል ፊርማ ማረጋገጫ (Security PIN)' : 'Digital Signature PIN Authorization'}
              </h3>
              <p className="text-xs text-slate-500 font-bold mt-1 tracking-wide">
                {language === 'AM'
                  ? `ይህንን ውሳኔ [${pendingAction?.action === 'Approved' ? 'ማፅደቅ' : 'ውድቅ ማድረግ'}] በይፋ ለመፈረም የእርስዎን ፒን ያስገቡ`
                  : `Enter your 4-6 digit authorization PIN to digitally sign and seal this ${pendingAction?.action} action`}
              </p>
              {user && (
                <div className="inline-flex items-center gap-2 mt-3 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  <ShieldCheck size={14} className="text-blue-600 shrink-0" />
                  <span>{language === 'AM' ? 'ፈራሚ ባለስልጣን፦ ' : 'Signer: '}<strong>{user.name}</strong> ({user.role})</span>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <div className="relative">
                <input
                  type={showPinPassword ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={12}
                  placeholder="••••••"
                  className="w-full px-5 py-4 pr-12 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-mono font-black text-2xl tracking-[0.4em] outline-none focus:ring-4 focus:ring-blue-500/20 transition-all placeholder:tracking-normal placeholder:font-sans placeholder:text-base placeholder:text-slate-400"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value)
                    setPinError('')
                  }}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyAndSubmit()}
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

              {remainingAttempts !== null && remainingAttempts > 0 && (
                <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                  ⚠️ {remainingAttempts} {language === 'AM' ? 'የመጨረሻ ሙከራ(ዎች) ቀርተዋል' : 'attempt(s) remaining before security lockout'}
                </p>
              )}

              <p className="text-[10px] text-slate-400 font-medium">
                {language === 'AM' ? '🔒 ፊርማው በ SHA-256 HMAC ዲጂታል ማህተም ይመዘገባል' : '🔒 Approval will be sealed with a verifiable SHA-256 HMAC digital signature'}
              </p>
            </div>

            <div className="flex gap-4 pt-2">
              <button 
                type="button"
                onClick={() => setShowPinModal(false)}
                className="flex-1 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                {t.cancel}
              </button>
              <button 
                type="button"
                onClick={handleVerifyAndSubmit}
                disabled={!pinInput.trim()}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black hover:opacity-95 shadow-xl shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {language === 'AM' ? 'በዲጂታል ፈርም' : 'Sign & Seal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Approvals
