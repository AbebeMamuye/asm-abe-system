import React, { useState } from 'react'
import {
  GitFork,
  UserCheck,
  Building2,
  Trash2,
  Plus,
  ArrowRight,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from 'lucide-react'
import { useStore, TRANSLATIONS } from '../store/useStore'
import { UserHierarchy } from '../store/types'
import { getRolePermissions } from '../lib/permissions'

export default function HierarchyManager() {
  const {
    users,
    hierarchies,
    createHierarchy,
    deleteHierarchy,
    language,
    user
  } = useStore()
  const perms = getRolePermissions(user?.role)

  const t = TRANSLATIONS[language]

  // Form states
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedSupervisorId, setSelectedSupervisorId] = useState('')
  const [selectedStoreKeeperId, setSelectedStoreKeeperId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handle Create Hierarchy
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId || !selectedSupervisorId || !selectedStoreKeeperId) {
      setMessage({
        type: 'error',
        text: language === 'AM' ? 'እባክዎ ባለሙያ፣ ቅርብ አለቃ እና ግምጃ ቤት ኃላፊ ይምረጡ!' : 'Please select staff, supervisor, and storekeeper!'
      })
      return
    }

    const employee = users.find((u) => u.id?.toString() === selectedUserId)
    const supervisor = users.find((u) => u.id?.toString() === selectedSupervisorId)
    const storekeeper = users.find((u) => u.id?.toString() === selectedStoreKeeperId)

    if (!employee || !supervisor || !storekeeper) return

    setIsSubmitting(true)
    const payload: Partial<UserHierarchy> = {
      userId: employee.id!,
      userName: employee.name,
      userPhone: employee.phone || '',
      position: employee.position || employee.role || 'ባለሙያ',
      departmentCode: employee.departmentCode || 'EDU',
      supervisorId: supervisor.id!,
      supervisorName: supervisor.name,
      supervisorPhone: supervisor.phone || '',
      storeKeeperId: storekeeper.id!,
      storeKeeperName: storekeeper.name,
      storeKeeperPhone: storekeeper.phone || ''
    }

    const res = await createHierarchy(payload)
    setIsSubmitting(false)

    if (res.success) {
      setMessage({
        type: 'success',
        text: language === 'AM'
          ? `የ ${employee.name} ትስስር ከ ${supervisor.name} እና ${storekeeper.name} ጋር በተሳካ ሁኔታ ተፈጥሯል!`
          : `Hierarchy linked successfully for ${employee.name}!`
      })
      setSelectedUserId('')
      setSelectedSupervisorId('')
      setSelectedStoreKeeperId('')
      setTimeout(() => setMessage(null), 5000)
    }
  }

  // Handle Delete / Unlink
  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(language === 'AM' ? `እርግጠኛ ነዎት የ ${name} ትስስር መሰረዝ ይፈልጋሉ?` : `Unlink hierarchy for ${name}?`)) {
      await deleteHierarchy(id)
      setMessage({
        type: 'success',
        text: language === 'AM' ? 'ትስስሩ ተሰርዟል!' : 'Hierarchy unlinked successfully!'
      })
      setTimeout(() => setMessage(null), 4000)
    }
  }

  const filteredHierarchies = hierarchies.filter((h) => {
    const q = searchQuery.toLowerCase()
    return (
      h.userName.toLowerCase().includes(q) ||
      (h.supervisorName && h.supervisorName.toLowerCase().includes(q)) ||
      (h.storeKeeperName && h.storeKeeperName.toLowerCase().includes(q)) ||
      (h.position && h.position.toLowerCase().includes(q))
    )
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-black uppercase tracking-widest border border-indigo-400/20">
              <GitFork size={14} />
              <span>{language === 'AM' ? 'የአስተዳደር ትስስር ማዋቀሪያ' : 'AMIS Organization Hierarchy'}</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight">
              {language === 'AM' ? 'ትስስር መፍጠርና ማስተዳደር' : 'Organizational Hierarchy Linking'}
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl">
              {language === 'AM'
                ? 'በቪዲዮው ክፍል ሁለት እንደተገለጸው፡ እያንዳንዱ ባለሙያ/መምህር የንብረት ጥያቄ (ሞዴል 20) ወይም ዝውውር ሲያከናውን በመጀመሪያ ለቅርብ አለቃው (ርዕሰ መምህር) ቀጥሎም ለግምጃ ቤት ኃላፊው በሰንሰለት እንዲተላለፍ ትስስር እዚህ ይፈጠራል።'
                : 'Link employees to their immediate supervisors (e.g. Principals/Directors) and property warehouse keepers for automated authorization chains.'}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-xs space-y-1">
            <div className="font-bold text-slate-200">{language === 'AM' ? 'የፍሰት ቅደም ተከተል' : 'Approval Chain'}</div>
            <div className="flex items-center gap-1.5 text-blue-300 font-mono font-bold">
              <span>{language === 'AM' ? 'ባለሙያ' : 'Staff'}</span>
              <ArrowRight size={12} />
              <span>{language === 'AM' ? 'ቅርብ አለቃ' : 'Supervisor'}</span>
              <ArrowRight size={12} />
              <span>{language === 'AM' ? 'ግምጃ ቤት' : 'Store'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alert / Notification */}
      {message && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold animate-in slide-in-from-top-2 duration-300 ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Form: Create Hierarchy Link */}
      {perms.canManageHierarchy && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-2xl">
            <GitFork size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {language === 'AM' ? 'አዲስ ትስስር ማዋቀር' : 'Configure New Hierarchy Link'}
            </h2>
            <p className="text-xs text-slate-500">
              {language === 'AM'
                ? 'ሰራተኛውን፣ የቅርብ ኃላፊውን እና ንብረት የሚረከቡበትን ግምጃ ቤት ኃላፊ ያገናኙ።'
                : 'Define the 3-point approval chain for property authorization.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1: Staff Member */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
              <span>{language === 'AM' ? 'ሰራተኛ / ባለሙያ ይምረጡ *' : '1. Staff Member / Teacher *'}</span>
            </label>
            <select
              id="select-hierarchy-user"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-xs font-bold text-slate-900 dark:text-white border-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">{language === 'AM' ? '-- ሰራተኛ ይምረጡ --' : '-- Choose Staff --'}</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.position || u.role} ({u.phone || u.email})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400">
              {language === 'AM' ? 'ጥያቄ የሚያቀርበው ወይም ንብረት የተረከበው ሰራተኛ' : 'The employee holding custody or raising M20'}
            </p>
          </div>

          {/* Step 2: Immediate Supervisor */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">2</span>
              <span>{language === 'AM' ? 'ቅርብ አለቃ (ርዕሰ መምህር) *' : '2. Immediate Supervisor *'}</span>
            </label>
            <select
              id="select-hierarchy-supervisor"
              value={selectedSupervisorId}
              onChange={(e) => setSelectedSupervisorId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-xs font-bold text-slate-900 dark:text-white border-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">{language === 'AM' ? '-- ቅርብ አለቃ ይምረጡ --' : '-- Choose Supervisor --'}</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.position || u.role} ({u.phone || u.email})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400">
              {language === 'AM' ? 'የመጀመሪያ ደረጃ ማረጋገጫና ፍቃድ የሚሰጥ' : 'First-line approver (Principal / Department Head)'}
            </p>
          </div>

          {/* Step 3: Store Keeper */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">3</span>
              <span>{language === 'AM' ? 'የንብረት ግምጃ ቤት ኃላፊ *' : '3. Property Store Keeper *'}</span>
            </label>
            <select
              id="select-hierarchy-storekeeper"
              value={selectedStoreKeeperId}
              onChange={(e) => setSelectedStoreKeeperId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-xs font-bold text-slate-900 dark:text-white border-none focus:ring-2 focus:ring-emerald-500"
              required
            >
              <option value="">{language === 'AM' ? '-- ግምጃ ቤት ኃላፊ ይምረጡ --' : '-- Choose Storekeeper --'}</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.position || u.role} ({u.phone || u.email})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400">
              {language === 'AM' ? 'ንብረቱን አረጋግጦ የሚያስረክብ (ሞዴል 22)' : 'Issues asset vouchers from warehouse'}
            </p>
          </div>

          <div className="md:col-span-3 flex justify-end pt-2">
            <button
              id="btn-create-hierarchy"
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>{isSubmitting ? 'በማስቀመጥ ላይ...' : language === 'AM' ? 'ትስስር ፍጠር (አስቀምጥ)' : 'Create Hierarchy Link'}</span>
            </button>
          </div>
        </form>
      </div>
      )}

      {/* Active Hierarchies Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {language === 'AM' ? 'የተመሰረቱ የአስተዳደር ትስስሮች' : 'Active Hierarchy Chains'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'AM'
                ? `በአጠቃላይ ${hierarchies.length} የሰራተኞች ትስስር በሲስተሙ ተዋቅሯል።`
                : `${hierarchies.length} active reporting chains configured.`}
            </p>
          </div>

          <div className="w-full sm:w-72">
            <input
              id="search-hierarchies"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'AM' ? 'በስም ወይም በስራ መደብ ፈልግ...' : 'Search hierarchies...'}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {filteredHierarchies.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 mx-auto bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
              <GitFork size={32} />
            </div>
            <h3 className="text-base font-black text-slate-800 dark:text-slate-200">
              {language === 'AM' ? 'ምንም ትስስር አልተገኘም' : 'No Hierarchies Found'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {language === 'AM'
                ? 'እስካሁን ምንም ትስስር አልተመዘገበም። ከላይ ያለውን ቅጽ በመጠቀም አዲስ ትስስር ይፍጠሩ።'
                : 'No reporting hierarchy chains configured yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse border-2 border-slate-900 dark:border-slate-700">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest">
                  <th className="py-4 px-6 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'ሰራተኛ / ባለሙያ' : 'Staff Member'}</th>
                  <th className="py-4 px-6 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'ቅርብ አለቃ (ርዕሰ መምህር)' : 'Immediate Supervisor'}</th>
                  <th className="py-4 px-6 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'የንብረት ግምጃ ቤት ኃላፊ' : 'Store Keeper'}</th>
                  <th className="py-4 px-6 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'የተፈጠረበት ቀን' : 'Linked Date'}</th>
                  <th className="py-4 px-6 text-center border-2 border-slate-900 dark:border-slate-700">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
                {filteredHierarchies.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 border-2 border-slate-900 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xs">
                          {h.userName.substring(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{h.userName}</div>
                          <div className="text-[10px] text-slate-400">
                            {h.position || 'ባለሙያ'} • {h.userPhone || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 border-2 border-slate-900 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={16} className="text-indigo-500" />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{h.supervisorName}</div>
                          <div className="text-[10px] text-slate-400">{h.supervisorPhone || 'Supervisor'}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 border-2 border-slate-900 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        <Building2 size={16} className="text-emerald-500" />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{h.storeKeeperName}</div>
                          <div className="text-[10px] text-slate-400">{h.storeKeeperPhone || 'Store Keeper'}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 border-2 border-slate-900 dark:border-slate-700 text-slate-500">
                      {h.createdAt?.split('T')[0] || '2026-01-01'}
                    </td>

                    <td className="py-4 px-6 text-center border-2 border-slate-900 dark:border-slate-700">
                      {perms.canManageHierarchy ? (
                        <button
                          id={`btn-unlink-${h.id}`}
                          onClick={() => handleDelete(h.id!, h.userName)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all cursor-pointer"
                          title={language === 'AM' ? 'ትስስር ሰርዝ' : 'Unlink Hierarchy'}
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Linked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
