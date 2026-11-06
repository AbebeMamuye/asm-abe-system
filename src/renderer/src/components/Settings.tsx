import { useState, useEffect } from 'react'
import {
  Trash2,
  Database,
  AlertCircle,
  CheckCircle,
  Settings2,
  Building2,
  Save,
  Users,
  UserPlus,
  PlusCircle,
  Layers,
  ShieldAlert,
  Sparkles,
  Sliders,
  School,
  Building,
  GitFork,
  Check,
  RefreshCw,
  Download,
  Upload,
  HardDrive,
  Key,
  ShieldCheck,
  FileCheck
} from 'lucide-react'
import { useStore, TRANSLATIONS, Department } from '../store/useStore'
import { getRolePermissions } from '../lib/permissions'

const Settings = () => {
  const {
    refreshData,
    orgName,
    orgTagline,
    setOrgName,
    setOrgTagline,
    organizationMode,
    singleOrgType,
    setOrganizationMode,
    user,
    users,
    fetchUsers,
    departments,
    fetchDepartments,
    addDepartment,
    deleteDepartment,
    clearSystemData,
    language,
    setLanguage
  } = useStore()
  const perms = getRolePermissions(user?.role)
  const t = TRANSLATIONS[language]
  const [dbPath, setDbPath] = useState('')
  const [isReseting, setIsReseting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successText, setSuccessText] = useState('')

  // Database Backup & Restore state
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)

  // Commercial License state
  const [licenseKeyInput, setLicenseKeyInput] = useState('')
  const [licenseClientInput, setLicenseClientInput] = useState('')
  const [licenseStatus, setLicenseStatus] = useState<any>({
    isActivated: true,
    licenseKey: 'AMS-PRO-2026-ETH-9921',
    edition: 'Enterprise Commercial Edition',
    hardwareId: 'AMS-ETH-SRV-2026-X1'
  })

  // Feature Toggle state
  const [currentMode, setCurrentMode] = useState<'single' | 'hierarchical'>(organizationMode || 'hierarchical')
  const [currentFacilityType, setCurrentFacilityType] = useState<string>(singleOrgType || 'Health Center')
  const [modeSavedText, setModeSavedText] = useState('')
  const [isLoadingFacilityDepts, setIsLoadingFacilityDepts] = useState(false)
  const [facilityDeptsLoaded, setFacilityDeptsLoaded] = useState(false)

  // Org branding form state
  const [nameInput, setNameInput] = useState(orgName)
  const [taglineInput, setTaglineInput] = useState(orgTagline)
  const [brandSaved, setBrandSaved] = useState(false)

  // User Management state
  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserRole, setNewUserRole] = useState('Guest')
  const [userSavedMessage, setUserSavedMessage] = useState('')
  const [userError, setUserError] = useState('')
  const [editingUser, setEditingUser] = useState<any | null>(null)

  // Sector & Department Management state
  const [newDeptCode, setNewDeptCode] = useState('')
  const [newDeptName, setNewDeptName] = useState('')
  const [newDeptAmharic, setNewDeptAmharic] = useState('')
  const [newDeptType, setNewDeptType] = useState<'Sector' | 'Woreda' | 'Division' | 'Store' | 'Other'>('Woreda')
  const [newDeptDesc, setNewDeptDesc] = useState('')
  const [deptMsg, setDeptMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isSubmittingDept, setIsSubmittingDept] = useState(false)

  useEffect(() => {
    fetchUsers()
    fetchDepartments()
    setCurrentMode(organizationMode)
    setCurrentFacilityType(singleOrgType || 'Health Center')
  }, [organizationMode, singleOrgType])

  const handleModeToggle = async (newMode: 'single' | 'hierarchical', facilityType?: string) => {
    const selectedType = facilityType || currentFacilityType
    setCurrentMode(newMode)
    if (facilityType) setCurrentFacilityType(facilityType)
    await setOrganizationMode(newMode, selectedType)

    const successMsg = language === 'AM'
      ? (newMode === 'single'
          ? `የስርዓቱ ሁነታ ወደ "ነጠላ ተቋም (${selectedType})" ተቀይሯል!`
          : 'የስርዓቱ ሁነታ ወደ "ተዋረድ ያለው የወረዳና ሴክተሮች አስተዳደር" ተቀይሯል!')
      : (newMode === 'single'
          ? `Operation mode switched to Single Facility (${selectedType})!`
          : 'Operation mode switched to Hierarchical Multi-Sector / Woreda!')

    setModeSavedText(successMsg)
    setTimeout(() => setModeSavedText(''), 4500)
  }

  const handleLoadDefaultFacilityDepartments = async (type: string) => {
    setIsLoadingFacilityDepts(true)
    const templates: Record<string, { code: string; name: string; amharicName: string; type: any; desc: string }[]> = {
      'Health Center': [
        { code: 'HC-PHARM', name: 'Pharmacy Unit', amharicName: 'ፋርማሲ እና መድሃኒት ክፍል', type: 'Division', desc: 'Dispensary and Medical Inventory' },
        { code: 'HC-LAB', name: 'Laboratory Unit', amharicName: 'ላብራቶሪ ክፍል', type: 'Division', desc: 'Diagnostic testing & equipment' },
        { code: 'HC-OPD', name: 'Outpatient Dept (OPD)', amharicName: 'ተመላላሽ ህክምና (OPD)', type: 'Division', desc: 'Consultation & Clinic Rooms' },
        { code: 'HC-EMERG', name: 'Emergency Unit', amharicName: 'ድንገተኛ ክፍል', type: 'Division', desc: 'Emergency triage & beds' },
        { code: 'HC-MCH', name: 'Maternal & Child Health', amharicName: 'የእናቶችና ህጻናት ጤና (MCH)', type: 'Division', desc: 'Maternity & vaccination' },
        { code: 'HC-ADMIN', name: 'Administration & Finance', amharicName: 'አስተዳደርና ፋይናንስ', type: 'Division', desc: 'Office & Facility Management' },
        { code: 'HC-STORE', name: 'Central Medical Store', amharicName: 'የህክምናና እቃ ግምጃ ቤት', type: 'Store', desc: 'Facility Storehouse' }
      ],
      'School': [
        { code: 'SCH-LIB', name: 'Library & Reading Room', amharicName: 'ቤተ-መጽሐፍትና የማንበቢያ አዳራሽ', type: 'Division', desc: 'Books, Journals & Study Materials' },
        { code: 'SCH-LAB', name: 'Science Laboratory', amharicName: 'ሳይንስ ላብራቶሪ', type: 'Division', desc: 'Biology, Chemistry & Physics Lab' },
        { code: 'SCH-ICT', name: 'ICT & Computer Lab', amharicName: 'አይሲቲና ኮምፒውተር ክፍል', type: 'Division', desc: 'Computers, Printers & Tech' },
        { code: 'SCH-STAFF', name: 'Teachers Staff Room', amharicName: 'መምህራን ክፍል', type: 'Division', desc: 'Staff Workstations' },
        { code: 'SCH-ADMIN', name: 'Principal Office', amharicName: 'ርዕሰ-መምህርና አስተዳደር', type: 'Division', desc: 'Executive Administration' },
        { code: 'SCH-STORE', name: 'General Property Store', amharicName: 'ዋና እቃ ግምጃ ቤት', type: 'Store', desc: 'School Equipment & Storage' }
      ],
      'Sector Office': [
        { code: 'SEC-FIN', name: 'Finance & Accounts', amharicName: 'ፋይናንስና በጀት ክፍል', type: 'Division', desc: 'Accounting & Payroll' },
        { code: 'SEC-HR', name: 'Human Resources & Logistics', amharicName: 'የሰው ኃይልና ጠቅላላ አገልግሎት', type: 'Division', desc: 'Personnel & Office Operations' },
        { code: 'SEC-PLAN', name: 'Planning & Evaluation', amharicName: 'ፕላንና ፕሮግራም', type: 'Division', desc: 'Strategic Planning & M&E' },
        { code: 'SEC-OPS', name: 'Core Operations', amharicName: 'ዋና የስራ ሂደት', type: 'Division', desc: 'Public Service Delivery' },
        { code: 'SEC-STORE', name: 'Central Property Store', amharicName: 'እቃ ግምጃ ቤት', type: 'Store', desc: 'Property Storage' }
      ],
      'General': [
        { code: 'UNIT-ADMIN', name: 'Executive Administration', amharicName: 'ዋና ስራ አስኪያጅና አስተዳደር', type: 'Division', desc: 'Management' },
        { code: 'UNIT-FIN', name: 'Finance & Logistics', amharicName: 'ፋይናንስና ሎጂስቲክስ', type: 'Division', desc: 'Accounts & Supplies' },
        { code: 'UNIT-OPS', name: 'Operations & Service', amharicName: 'ኦፕሬሽንና አገልግሎት', type: 'Division', desc: 'Service Delivery' },
        { code: 'UNIT-STORE', name: 'Storehouse', amharicName: 'ንብረት ግምጃ ቤት', type: 'Store', desc: 'Inventory Storage' }
      ]
    }

    const selectedTemplate = templates[type] || templates['Health Center']
    for (const dept of selectedTemplate) {
      const exists = departments.some(d => d.code === dept.code)
      if (!exists) {
        await addDepartment({
          code: dept.code,
          name: dept.name,
          amharicName: dept.amharicName,
          type: dept.type,
          description: dept.desc
        })
      }
    }
    await fetchDepartments()
    setIsLoadingFacilityDepts(false)
    setFacilityDeptsLoaded(true)
    setTimeout(() => setFacilityDeptsLoaded(false), 4000)
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && window.api?.getDbPath) {
      window.api.getDbPath().then(setDbPath)
    } else {
      setDbPath('./data/asset-management.db')
    }
  }, [])

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault()
    setDeptMsg(null)
    if (!newDeptCode.trim() || !newDeptName.trim()) {
      setDeptMsg({ type: 'error', text: language === 'AM' ? 'የሴክተር ኮድ እና ስም ማስገባት ግዴታ ነው' : 'Code and Name are required' })
      return
    }

    setIsSubmittingDept(true)
    const res = await addDepartment({
      code: newDeptCode.trim().toUpperCase(),
      name: newDeptName.trim(),
      amharicName: newDeptAmharic.trim() || newDeptName.trim(),
      type: newDeptType,
      description: newDeptDesc.trim()
    })
    setIsSubmittingDept(false)

    if (res?.success) {
      setDeptMsg({
        type: 'success',
        text: language === 'AM' ? `ሴክተር "${newDeptName}" በተሳካ ሁኔታ ተመዝግቧል!` : `Sector/Department "${newDeptName}" added successfully!`
      })
      setNewDeptCode('')
      setNewDeptName('')
      setNewDeptAmharic('')
      setNewDeptDesc('')
      setTimeout(() => setDeptMsg(null), 3500)
    } else {
      setDeptMsg({
        type: 'error',
        text: res?.error || (language === 'AM' ? 'ሴክተር መመዝገብ አልተቻለም' : 'Failed to add department')
      })
    }
  }

  const handleDeleteDept = async (dept: Department) => {
    const confirmPrompt = language === 'AM'
      ? `እርግጠኛ ነዎት "${dept.amharicName || dept.name}" (${dept.code}) መሰረዝ ይፈልጋሉ?`
      : `Are you sure you want to delete "${dept.name}" (${dept.code})?`

    if (!confirm(confirmPrompt)) return

    const res = await deleteDepartment(dept.id!)
    if (res?.success) {
      setDeptMsg({
        type: 'success',
        text: language === 'AM' ? `"${dept.amharicName || dept.name}" ተሰርዟል` : `"${dept.name}" deleted`
      })
      setTimeout(() => setDeptMsg(null), 3000)
    } else {
      setDeptMsg({
        type: 'error',
        text: res?.error || (language === 'AM' ? 'መሰረዝ አልተቻለም' : 'Failed to delete')
      })
    }
  }

  const handleClearSampleData = async () => {
    const promptMsg = language === 'AM'
      ? 'ይህ እርምጃ በሲስተሙ ውስጥ ያሉትን ሁሉንም ሳምፕል እና ዲፎልት ንብረቶች፣ ቫውቸሮች፣ ቆጠራዎች፣ ዝውውሮች እና ግብይቶች ሙሉ በሙሉ ያጠፋል። ዋናው ሲስተም አድሚን (System Admin) ብቻ ይቀራል። እርግጠኛ ነዎት?'
      : 'CRITICAL ACTION: This will erase all default/sample assets, vouchers, transfers, and transactions while keeping only the System Admin. Are you sure?'

    if (confirm(promptMsg)) {
      setIsReseting(true)
      const res = await clearSystemData({ keepAdminOnly: true })
      await refreshData()
      setIsReseting(false)
      setSuccessText(language === 'AM' ? 'ዲፎልት እና ሳምፕል ዳታዎች ሙሉ በሙሉ ተጠርገዋል!' : 'All sample records cleared!')
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 4000)
    }
  }

  const handleReset = async () => {
    if (confirm(language === 'AM' ? 'ይህ እርምጃ ሙሉውን የመረጃ ቋት ዳግም ያስጀምራል! እርግጠኛ ነዎት?' : 'CRITICAL ACTION: This will completely reset the database. Are you absolutely certain?')) {
      setIsReseting(true)
      await clearSystemData({ keepAdminOnly: true })
      await refreshData()
      setIsReseting(false)
      setSuccessText(language === 'AM' ? 'የመረጃ ቋቱ በተሳካ ሁኔታ ዳግም ተጀምሯል!' : 'Database reset successfully!')
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    }
  }

  // ── Database Backup & Restore Handlers ───────────────────────
  const handleDownloadBackup = () => {
    setIsBackingUp(true)
    const backupUrl = '/api/system/backup/download'
    const a = document.createElement('a')
    a.href = backupUrl
    a.download = `asset-management-backup-${new Date().toISOString().slice(0, 10)}.db`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => {
      setIsBackingUp(false)
      setSuccessText(language === 'AM' ? 'የመረጃ ቋቱ ባክአፕ በተሳካ ሁኔታ ወርዷል!' : 'Database backup downloaded!')
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    }, 1200)
  }

  const handleRestoreFromFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const confirmMsg = language === 'AM'
      ? `እርግጠኛ ነዎት? "${file.name}" የተባለውን ባክአፕ ሲመልሱ አሁን ያለው መረጃ በሙሉ በባክአፑ ይተካል!`
      : `Are you sure you want to restore "${file.name}"? Current system data will be overwritten!`

    if (!confirm(confirmMsg)) {
      e.target.value = ''
      return
    }

    setIsRestoring(true)
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1]
          const res = await fetch('/api/system/restore/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dataBase64: base64 })
          })

          if (!res.ok) {
            const errText = await res.text()
            try {
              const errJson = JSON.parse(errText)
              alert('Restore failed: ' + (errJson.error || errText))
            } catch {
              alert('Restore failed: ' + errText)
            }
            return
          }

          const result = await res.json()
          if (result.success) {
            setSuccessText(
              language === 'AM'
                ? 'የመረጃ ቋቱ በተሳካ ሁኔታ ከባክአፕ ተመልሷል! ሲስተሙ እንደገና በመከፈት ላይ ነው...'
                : 'Database restored successfully from backup! Reloading system...'
            )
            setShowSuccess(true)
            setTimeout(() => {
              window.location.reload()
            }, 1500)
          } else {
            alert('Restore failed: ' + (result.error || 'Unknown error'))
          }
        } catch (err: any) {
          alert('Restore error: ' + err.message)
        } finally {
          setIsRestoring(false)
          e.target.value = ''
        }
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      alert('Error reading file: ' + err.message)
      setIsRestoring(false)
      e.target.value = ''
    }
  }

  // ── Commercial License Handler ──────────────────────────────
  const handleActivateLicense = async () => {
    if (!licenseKeyInput.trim()) {
      alert(language === 'AM' ? 'እባክዎ የፈቃድ ቁልፍ ያስገቡ' : 'Please enter license key')
      return
    }
    try {
      const res = await fetch('/api/system/license/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: licenseKeyInput.trim(), clientName: licenseClientInput.trim() || orgName })
      })
      const result = await res.json()
      if (result.success) {
        alert(language === 'AM' ? 'የሲስተሙ የንግድ ፈቃድ በተሳካ ሁኔታ ነቅቷል!' : 'License successfully activated!')
        const updated = await fetch('/api/system/license').then(r => r.json())
        setLicenseStatus(updated)
      } else {
        alert(result.message || 'Activation failed')
      }
    } catch (err: any) {
      alert('Activation error: ' + err.message)
    }
  }

  const handleSaveBranding = () => {
    setOrgName(nameInput.trim() || orgName)
    setOrgTagline(taglineInput.trim() || orgTagline)
    setBrandSaved(true)
    setTimeout(() => setBrandSaved(false), 2500)
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setUserError('')
    setUserSavedMessage('')
    if (!window.api) return

    const userData = {
      name: newUserName,
      email: newUserEmail.trim().toLowerCase(),
      password: newUserPassword,
      role: newUserRole,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newUserName)}&background=random`
    }

    if (editingUser) {
      const res = await window.api.updateUser(editingUser.id, userData)
      if (res.changes > 0) {
        setUserSavedMessage(language === 'AM' ? 'ተጠቃሚው ተሻሽሏል!' : 'User updated successfully!')
        setEditingUser(null)
      } else {
        setUserError('Failed to update user')
      }
    } else {
      const res = await window.api.registerUser(userData)
      if (res.success) {
        setUserSavedMessage(language === 'AM' ? 'ተጠቃሚው በተሳካ ሁኔታ ተፈጥሯል!' : 'User added successfully!')
      } else {
        setUserError(res.error || 'Failed to add user')
        return
      }
    }

    setNewUserName('')
    setNewUserEmail('')
    setNewUserPassword('')
    setNewUserRole('Guest')
    fetchUsers()
    setTimeout(() => setUserSavedMessage(''), 3000)
  }

  const handleEditClick = (u: any) => {
    setEditingUser(u)
    setNewUserName(u.name)
    setNewUserEmail(u.email)
    setNewUserPassword('') // Don't show password, only update if typed
    setNewUserRole(u.role || 'Guest')
    // Scroll to form
    document.getElementById('user-form')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleDeleteUser = async (id: number) => {
    if (!window.api) return
    if (confirm(language === 'AM' ? 'ይህንን ተጠቃሚ ማጥፋት ይፈልጋሉ?' : 'Are you sure you want to delete this user?')) {
      await window.api.deleteUser(id)
      fetchUsers()
    }
  }

  return (
    <div className="space-y-8 animate-in zoom-in-95 duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Settings2 size={30} className="text-slate-600" />
            {language === 'AM' ? 'ቅንብሮች' : 'System Settings'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {language === 'AM' ? 'የሲስተሙን መለያ ስም፣ ዳታቤዝ እና ሌሎች አማራጮችን እዚህ ያስተካክሉ' : 'Configure organization branding, database preferences, and system options.'}
          </p>
        </div>
        
        {/* Language Selection */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button onClick={() => setLanguage('EN')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${language === 'EN' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600'}`}>English</button>
          <button onClick={() => setLanguage('AM')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${language === 'AM' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600'}`}>አማርኛ</button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 max-w-5xl">

        {/* ── Feature Toggle: Operation Mode (Single Org vs Hierarchical) ── */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border-2 border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-950/40 text-blue-600 rounded-2xl shadow-inner">
                <Sliders size={26} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {language === 'AM' ? 'የስርዓት ሁነታ መምረጫ (Feature Toggle)' : 'System Operation Mode (Feature Toggle)'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {language === 'AM'
                    ? 'ሲስተሙ ለአንድ ነጠላ ተቋም ብቻ (ለምሳሌ፡ ለጤና ጣቢያ ወይም ለትምህርት ቤት) ወይስ ተዋረድ ላለው የወረዳና ሴክተሮች እንዲያገለግል እዚህ ይምረጡ'
                    : 'Toggle whether this system operates for a Single Standalone Facility (e.g. Health Center or School) or a Hierarchical Multi-Sector Woreda.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                currentMode === 'single'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                  : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700'
              }`}>
                <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                <span>
                  {currentMode === 'single'
                    ? (language === 'AM' ? `ነጠላ ተቋም (${currentFacilityType})` : `Single Org (${currentFacilityType})`)
                    : (language === 'AM' ? 'ተዋረድ ያለው የወረዳ ሁነታ' : 'Hierarchical Mode')}
                </span>
              </span>
            </div>
          </div>

          {modeSavedText && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <CheckCircle size={18} className="shrink-0 text-emerald-600" />
              <span>{modeSavedText}</span>
            </div>
          )}

          {/* Cards for Mode Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Mode 1: Single Organization */}
            <div
              onClick={() => handleModeToggle('single')}
              className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                currentMode === 'single'
                  ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-md ring-4 ring-emerald-500/10'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                    <Building size={22} />
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    currentMode === 'single' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                  }`}>
                    {currentMode === 'single' && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white">
                    {language === 'AM' ? 'ለነጠላ ተቋም ብቻ (Single Organization)' : 'Single Facility Mode'}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {language === 'AM'
                      ? 'ለአንድ ጤና ጣቢያ፣ ትምህርት ቤት፣ ኮሌጅ ወይም ለአንድ ሴክተር ጽ/ቤት ብቻ። የወረዳ ተዋረድ ገጾችን በመደበቅ የውስጥ ክፍል አሰራርን ያቀላል።'
                      : 'Optimized for a single standalone facility. Streamlines the workflow to internal units and hides cross-woreda administration.'}
                  </p>
                </div>
              </div>

              {/* Sub-selection for Facility Type */}
              {currentMode === 'single' && (
                <div className="mt-5 pt-4 border-t border-emerald-200 dark:border-emerald-800/50 space-y-3">
                  <label className="text-[11px] font-black uppercase text-emerald-800 dark:text-emerald-300 tracking-wider block">
                    {language === 'AM' ? 'የተቋሙ ዓይነት (Facility Type):' : 'Select Facility Type:'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'Health Center', labelAm: '🏥 ጤና ጣቢያ / ክሊኒክ', labelEn: '🏥 Health Center' },
                      { key: 'School', labelAm: '🏫 ትምህርት ቤት / ኮሌጅ', labelEn: '🏫 School / College' },
                      { key: 'Sector Office', labelAm: '🏢 ነጠላ ሴክተር ጽ/ቤት', labelEn: '🏢 Sector Office' },
                      { key: 'General', labelAm: '🏬 ድርጅት / NGO', labelEn: '🏬 Company / NGO' }
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleModeToggle('single', item.key)
                        }}
                        className={`py-2 px-2.5 rounded-xl text-[11px] font-black transition-all cursor-pointer text-left border ${
                          currentFacilityType === item.key
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        {language === 'AM' ? item.labelAm : item.labelEn}
                      </button>
                    ))}
                  </div>

                  {/* Auto-Load Department Template Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={isLoadingFacilityDepts}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleLoadDefaultFacilityDepartments(currentFacilityType)
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <RefreshCw size={14} className={isLoadingFacilityDepts ? 'animate-spin' : ''} />
                      <span>
                        {isLoadingFacilityDepts
                          ? (language === 'AM' ? 'ክፍሎች በመጫን ላይ...' : 'Loading units...')
                          : (language === 'AM'
                              ? `የ${currentFacilityType} መደበኛ ክፍሎችን ጫን`
                              : `Auto-Load Standard ${currentFacilityType} Units`)}
                      </span>
                    </button>
                    {facilityDeptsLoaded && (
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold mt-1 text-center">
                        ✓ {language === 'AM' ? 'የተቋሙ ክፍሎች በተሳካ ሁኔታ ተጭነዋል!' : 'Facility units added successfully!'}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mode 2: Hierarchical Woreda Mode */}
            <div
              onClick={() => handleModeToggle('hierarchical')}
              className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                currentMode === 'hierarchical'
                  ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-md ring-4 ring-indigo-500/10'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                    <GitFork size={22} />
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    currentMode === 'hierarchical' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                  }`}>
                    {currentMode === 'hierarchical' && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white">
                    {language === 'AM' ? 'ተዋረድ ያለው ሁነታ (Hierarchical Woreda)' : 'Hierarchical Woreda Mode'}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {language === 'AM'
                      ? 'ለወረዳ አስተዳደር፣ ለክፍለ ከተማ ወይም በስሩ በርካታ ሴክተሮች እና ተቋማት ላሉት አስተዳደር። የሴክተር መዋቅሮችን፣ የትስስር ሰንሰለትን እና በሴክተሮች መካከል ዝውውርን ያካትታል።'
                      : 'For Woreda administration, sub-cities, or multi-sector governance. Enables inter-sector transfers, hierarchy builder, and multi-tier oversight.'}
                  </p>
                </div>
              </div>

              {currentMode === 'hierarchical' && (
                <div className="mt-5 pt-4 border-t border-indigo-200 dark:border-indigo-800/50">
                  <div className="p-3 rounded-xl bg-indigo-100/60 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 text-xs font-bold flex items-center gap-2">
                    <CheckCircle size={16} className="shrink-0 text-indigo-600" />
                    <span>
                      {language === 'AM'
                        ? 'ሁሉም የወረዳ መዋቅሮች፣ ሴክተሮች እና የትስስር ገጾች ነቅተዋል።'
                        : 'All cross-sector, woreda routing and hierarchy features are active.'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Organization Branding */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
          <div className="flex items-center space-x-3 mb-2">
            <Building2 className="text-blue-600" size={24} />
            <h3 className="text-xl font-bold">Organization Profile</h3>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Customize the name and tagline displayed throughout the application and on generated PDF vouchers.
          </p>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-2 block border-l-4 border-blue-500 pl-3">Organization / Institution Name</label>
              <input
                id="org-name-input"
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Ministry of Finance – Asset Division"
                disabled={!perms.canEditBranding}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-2 block border-l-4 border-blue-500 pl-3">Tagline / Division</label>
              <input
                id="org-tagline-input"
                type="text"
                value={taglineInput}
                onChange={(e) => setTaglineInput(e.target.value)}
                placeholder="e.g. Property Management Unit"
                disabled={!perms.canEditBranding}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            <div className="flex items-center gap-4">
              {perms.canEditBranding ? (
                <>
                  <button
                    id="btn-save-branding"
                    onClick={handleSaveBranding}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                  >
                    <Save size={18} />
                    Save Branding
                  </button>
                  {brandSaved && (
                    <div className="flex items-center gap-2 text-emerald-600 font-bold animate-in fade-in slide-in-from-left-4">
                      <CheckCircle size={18} />
                      <span>Saved!</span>
                    </div>
                  )}
                </>
              ) : (
                <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg">Read-only — Admin access required to edit branding</span>
              )}
            </div>
          </div>
        </section>

        {/* User Management (Admin Only) */}
        {perms.canManageUsers && (
          <section className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
            <div className="flex items-center space-x-3 mb-2">
              <Users className="text-emerald-600" size={24} />
              <h3 className="text-xl font-bold">User Management</h3>
            </div>
            
            <form id="user-form" onSubmit={handleAddUser} className="space-y-4 bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-4">
                  <UserPlus size={18} /> {editingUser ? (language === 'AM' ? 'ተጠቃሚ አሻሽል' : 'Edit User') : (language === 'AM' ? 'አዲስ ተጠቃሚ ጨምር' : 'Add New User')}
                </h4>
                {editingUser && (
                  <button type="button" onClick={() => { setEditingUser(null); setNewUserName(''); setNewUserEmail(''); setNewUserPassword(''); }} className="text-xs font-bold text-red-500 underline uppercase tracking-widest">Cancel Edit</button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-2 block border-l-4 border-emerald-500 pl-3">Full Name <span className="text-red-500">*</span></label>
                  <input required type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-sm" value={newUserName} onChange={e => setNewUserName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-2 block border-l-4 border-emerald-500 pl-3">Email / Username <span className="text-red-500">*</span></label>
                  <input required type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-sm" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-2 block border-l-4 border-emerald-500 pl-3">Password <span className="text-red-500">*</span></label>
                  <input required type="password" minLength={6} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-sm" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-2 block border-l-4 border-emerald-500 pl-3">Role <span className="text-red-500">*</span></label>
                  <select className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-sm" value={newUserRole} onChange={e => setNewUserRole(e.target.value)}>
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Staff">Staff</option>
                    <option value="Auditor">Auditor</option>
                    <option value="Viewer">Viewer</option>
                    <option value="Guest">Guest</option>
                  </select>
                </div>
              </div>
              {userError && <p className="text-xs font-bold text-red-500">{userError}</p>}
              {userSavedMessage && <p className="text-xs font-bold text-emerald-500">{userSavedMessage}</p>}
              <button type="submit" className="px-6 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm hover:shadow-xl transition-all">
                {editingUser ? (language === 'AM' ? 'አሻሽል' : 'Update User') : (language === 'AM' ? 'ተጠቃሚ ፍጠር' : 'Create User')}
              </button>
            </form>

            <div className="mt-6 space-y-3 max-h-[300px] overflow-y-auto pr-2">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Existing Users</h4>
              {users.map(u => (
                <div key={u.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-slate-100">
                    {u.avatar && <img src={u.avatar} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      {u.name} 
                      <span className="px-2 py-0.5 text-[10px] rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">{u.role || 'Guest'}</span>
                    </p>
                    <p className="text-xs text-slate-500 font-medium">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEditClick(u)} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-600 transition-colors">
                      <Settings2 size={16} />
                    </button>
                    <button onClick={() => handleDeleteUser(u.id!)} className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sector Offices & Department Management */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-950/40 text-purple-600 rounded-2xl">
                <Layers size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {currentMode === 'single'
                    ? (language === 'AM' ? `የ${currentFacilityType} የውስጥ የስራ ክፍሎችና ዩኒቶች` : `Internal Departments & Units (${currentFacilityType})`)
                    : (language === 'AM' ? 'የሴክተር መስሪያ ቤቶች እና ወረዳዎች አስተዳደር' : 'Sector Offices & Departments Management')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {currentMode === 'single'
                    ? (language === 'AM'
                        ? 'በተቋሙ ውስጥ ያሉትን ክፍሎች (ፋርማሲ፣ ላብራቶሪ፣ ቤተ-መጽሐፍት፣ ሬጅስትራር፣ መጋዘን) እዚህ ያስተዳድሩ'
                        : 'Manage internal functional units, wards, rooms and storage locations for this facility')
                    : (language === 'AM'
                        ? 'አዳዲስ ወረዳዎችን (ለምሳሌ ወረዳ 06)፣ ሴክተር ጽ/ቤቶችን በመመዝገብ በሲስተሙ በራስሰር በሁሉም ክፍሎች እንዲታወቁ ያድርጉ'
                        : 'Manage woredas (e.g. Woreda 06), sector bureaus, and divisions for instant automatic integration')}
                </p>
              </div>
            </div>
            <span className="px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 text-xs font-black self-start md:self-auto">
              {departments.length} {currentMode === 'single' ? (language === 'AM' ? 'የውስጥ ክፍሎች' : 'Internal Units') : (language === 'AM' ? 'የተመዘገቡ ሴክተሮች' : 'Registered Sectors')}
            </span>
          </div>

          {/* Add Sector Form */}
          {perms.canManageUsers && (
            <form onSubmit={handleCreateDept} className="p-6 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <PlusCircle size={16} className="text-purple-600" />
                <span>
                  {currentMode === 'single'
                    ? (language === 'AM' ? 'አዲስ የውስጥ ክፍል መዝግብ' : 'Register New Internal Unit')
                    : (language === 'AM' ? 'አዲስ ሴክተር / ወረዳ መዝግብ' : 'Register New Sector / Woreda')}
                </span>
              </h4>

              {deptMsg && (
                <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  deptMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {deptMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  <span>{deptMsg.text}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-[11px] font-black text-slate-600 dark:text-slate-300 block mb-1">
                    {currentMode === 'single'
                      ? (language === 'AM' ? 'የክፍሉ መለያ ኮድ *' : 'Unit Code *')
                      : (language === 'AM' ? 'የሴክተር / ወረዳ ኮድ *' : 'Sector / Woreda Code *')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={currentMode === 'single' ? 'e.g. PHARM, LAB, LIB, STORE' : 'e.g. WRD-06, SEC-06'}
                    value={newDeptCode}
                    onChange={(e) => setNewDeptCode(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-bold uppercase outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-600 dark:text-slate-300 block mb-1">
                    {currentMode === 'single'
                      ? (language === 'AM' ? 'የክፍሉ ስም (እንግሊዝኛ) *' : 'Unit Name (EN) *')
                      : (language === 'AM' ? 'የሴክተሩ ስም (እንግሊዝኛ) *' : 'Sector Name (EN) *')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={currentMode === 'single' ? 'e.g. Pharmacy Unit' : 'e.g. Woreda 06 Administration'}
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-600 dark:text-slate-300 block mb-1">
                    {currentMode === 'single'
                      ? (language === 'AM' ? 'የክፍሉ ስም (አማርኛ)' : 'Unit Name (Amharic)')
                      : (language === 'AM' ? 'የሴክተሩ ስም (አማርኛ)' : 'Sector Name (Amharic)')}
                  </label>
                  <input
                    type="text"
                    placeholder={currentMode === 'single' ? 'ለምሳሌ፡ ፋርማሲ ክፍል' : 'ለምሳሌ፡ ወረዳ 06 አስተዳደር ጽ/ቤት'}
                    value={newDeptAmharic}
                    onChange={(e) => setNewDeptAmharic(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-600 dark:text-slate-300 block mb-1">
                    {language === 'AM' ? 'ዓይነት' : 'Category / Type'}
                  </label>
                  <select
                    value={newDeptType}
                    onChange={(e) => setNewDeptType(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Division">{language === 'AM' ? 'ክፍል / ዩኒት (Division)' : 'Division / Unit'}</option>
                    <option value="Store">{language === 'AM' ? 'መጋዘን / ግምጃ ቤት (Store)' : 'Store / Storage'}</option>
                    <option value="Sector">{language === 'AM' ? 'ሴክተር መስሪያ ቤት (Sector Office)' : 'Sector Office'}</option>
                    <option value="Woreda">{language === 'AM' ? 'ወረዳ (Woreda)' : 'Woreda'}</option>
                    <option value="Other">{language === 'AM' ? 'ሌላ (Other)' : 'Other'}</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-4">
                <input
                  type="text"
                  placeholder={language === 'AM' ? 'ተጨማሪ መግለጫ / ዝርዝር (አማራጭ)' : 'Description / Remarks (Optional)'}
                  value={newDeptDesc}
                  onChange={(e) => setNewDeptDesc(e.target.value)}
                  className="flex-1 w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="submit"
                  disabled={isSubmittingDept}
                  className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md shadow-purple-600/20 disabled:opacity-50"
                >
                  <PlusCircle size={18} />
                  <span>{isSubmittingDept ? 'በመመዝገብ ላይ...' : (language === 'AM' ? 'አስቀምጥና ጨምር' : 'Save Sector')}</span>
                </button>
              </div>
            </form>
          )}

          {/* All-Border Table of Sectors */}
          <div className="overflow-x-auto rounded-2xl border-2 border-slate-900 dark:border-slate-700">
            <table className="w-full text-left border-collapse border-2 border-slate-900 dark:border-slate-700">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider border-b-2 border-slate-900 dark:border-slate-700">
                  <th className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'ኮድ' : 'Code'}</th>
                  <th className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? (currentMode === 'single' ? 'የክፍሉ ስም' : 'የሴክተሩ / የወረዳው ስም') : 'Name'}</th>
                  <th className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'ዓይነት' : 'Type'}</th>
                  <th className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'መግለጫ' : 'Description'}</th>
                  <th className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700 text-center">{language === 'AM' ? 'ሁኔታ' : 'Status'}</th>
                  {perms.canManageUsers && (
                    <th className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700 text-right">{language === 'AM' ? 'እርምጃ' : 'Action'}</th>
                  )}
                </tr>
              </thead>
              <tbody className="text-xs">
                {departments.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700 font-mono font-black text-purple-700 dark:text-purple-300">
                      <span className="px-2 py-1 rounded-md bg-purple-100 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800">
                        {d.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700 font-bold text-slate-900 dark:text-white">
                      <div>{language === 'AM' && d.amharicName ? d.amharicName : d.name}</div>
                      {language === 'AM' && d.name !== d.amharicName && (
                        <div className="text-[10px] text-slate-400 font-normal">{d.name}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {d.type || 'Sector'}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700 text-slate-500 font-medium max-w-xs truncate">
                      {d.description || '—'}
                    </td>
                    <td className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        Active
                      </span>
                    </td>
                    {perms.canManageUsers && (
                      <td className="px-4 py-3 border-2 border-slate-900 dark:border-slate-700 text-right">
                        <button
                          onClick={() => handleDeleteDept(d)}
                          title={language === 'AM' ? 'ሴክተሩን ሰርዝ' : 'Delete sector'}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Database Info */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
          <div className="flex items-center space-x-3 mb-2">
            <Database className="text-indigo-600" size={24} />
            <h3 className="text-xl font-bold">{language === 'AM' ? 'የመረጃ ቋት ዝርዝር' : 'Local Database'}</h3>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
              <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-2 block border-l-4 border-indigo-500 pl-3">
                {language === 'AM' ? 'የመረጃ ቋት ፋይል አድራሻ (File Path)' : 'Database File Location'}
              </label>
              <p className="text-sm font-mono mt-1 text-slate-600 dark:text-slate-300 break-all">{dbPath || './data/asset-management.db'}</p>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 italic">
              {language === 'AM'
                ? 'ይህ በኮምፒውተርዎ ላይ ብቻ የሚቀመጥ አስተማማኝ SQLite ዳታቤዝ ነው። ያለ ኢንተርኔት በከፍተኛ ፍጥነት ይሰራል፤ በአካባቢያዊ ኔትወርክም (LAN) በጋራ ያገለግላል።'
                : 'Offline-first SQLite database. Stored locally on this machine and accessible across LAN.'}
            </p>
          </div>
        </section>

        {/* ── 1-Click Database Backup & Restore Card ─────────── */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-indigo-100 dark:border-indigo-900/40 space-y-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 rounded-2xl">
              <HardDrive size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {language === 'AM' ? 'የመረጃ ቋት ባክአፕ እና መመለሻ (Backup & Restore)' : 'Database Backup & Restore'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'AM'
                  ? 'የተቋሙን የንብረት መረጃዎች በሙሉ በአንድ ክሊክ ወደ ፍላሽ ወይም ኮምፒውተር ማውረድና አስፈላጊ ሲሆን መመለስ'
                  : 'Safely download full SQLite snapshot backup file or restore from a previous backup file.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Backup Card */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-4 flex flex-col justify-between">
              <div>
                <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Download size={18} className="text-blue-600" />
                  {language === 'AM' ? 'ቀጥታ ባክአፕ ውሰድ (Download Backup)' : 'Download Live Database Backup'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  {language === 'AM'
                    ? 'አሁን ያሉትን ንብረቶች፣ ቫውቸሮች፣ ሰራተኞች እና የክሊራንስ መረጃዎች በሙሉ የያዘውን `.db` ፋይል ወዲያውኑ ያወርዳል።'
                    : 'Generates a live snapshot of all registered assets, transactions, clearances, and vouchers into a portable .db file.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadBackup}
                disabled={isBackingUp}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                <Download size={16} />
                <span>{isBackingUp ? (language === 'AM' ? 'ባክአፕ እየተወሰደ ነው...' : 'Creating backup...') : (language === 'AM' ? 'ባክአፕ ፋይል አውርድ' : 'Download Backup File (.db)')}</span>
              </button>
            </div>

            {/* Restore Card */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-4 flex flex-col justify-between">
              <div>
                <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Upload size={18} className="text-emerald-600" />
                  {language === 'AM' ? 'ከባክአፕ ፋይል መልስ (Restore from File)' : 'Restore Database from Backup'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  {language === 'AM'
                    ? 'ከዚህ በፊት የተያዘን የ `.db` ባክአፕ ፋይል በመምረጥ ሲስተሙን ወደ ቀድሞ ሁኔታው መመለስ ይችላሉ።'
                    : 'Select a previously downloaded .db backup file to completely restore system records.'}
                </p>
              </div>

              <label className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer text-center">
                <Upload size={16} />
                <span>{isRestoring ? (language === 'AM' ? 'ዳታ እየተመለሰ ነው...' : 'Restoring data...') : (language === 'AM' ? 'ባክአፕ ፋይል ምረጥ (.db)' : 'Select Backup File (.db)')}</span>
                <input
                  type="file"
                  accept=".db,.sqlite,.sqlite3"
                  onChange={handleRestoreFromFile}
                  disabled={isRestoring}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </section>

        {/* ── Commercial System License Card ─────────────────── */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-amber-100 dark:bg-amber-950/40 text-amber-600 rounded-2xl">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {language === 'AM' ? 'የሶፍትዌር ንግድ ፈቃድ እና አክቲቬሽን' : 'Commercial System License'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'AM' ? 'የሲስተሙ ህጋዊ ፈቃድ ደረጃ፣ የተቋሙ ስም እና የፈቃድ ማግበሪያ ቁልፍ' : 'Software edition, client registration, and activation status'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase flex items-center gap-1.5 ${
                licenseStatus?.isActivated !== false
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : 'bg-amber-50 text-amber-700 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-300'
              }`}>
                <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                {licenseStatus?.isActivated !== false ? (language === 'AM' ? 'የነቃ ፈቃድ (Commercial Active)' : 'Active License') : 'Trial Mode'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <p className="font-bold text-slate-400 uppercase tracking-widest">{language === 'AM' ? 'እትም' : 'Edition'}</p>
              <p className="font-black text-sm text-slate-900 dark:text-white mt-1">Enterprise Offline Pro</p>
            </div>
            <div>
              <p className="font-bold text-slate-400 uppercase tracking-widest">{language === 'AM' ? 'የማሽን መለያ (Hardware ID)' : 'Hardware ID'}</p>
              <p className="font-mono font-black text-sm text-indigo-600 dark:text-indigo-400 mt-1">{licenseStatus?.hardwareId || 'AMS-ETH-SRV-2026-X1'}</p>
            </div>
            <div>
              <p className="font-bold text-slate-400 uppercase tracking-widest">{language === 'AM' ? 'ፈቃድ የሚያበቃበት' : 'Valid Until'}</p>
              <p className="font-black text-sm text-emerald-600 mt-1">ቋሚ ፈቃድ (Perpetual 2099)</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="flex-1">
              <input
                type="text"
                placeholder={language === 'AM' ? 'የ 16-ዲጂት የፈቃድ ቁጥር ያስገቡ (e.g. AMS-2026-XXXX-XXXX)' : 'Enter 16-digit license key'}
                value={licenseKeyInput}
                onChange={e => setLicenseKeyInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono font-bold uppercase tracking-widest text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button
              type="button"
              onClick={handleActivateLicense}
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Key size={16} />
              <span>{language === 'AM' ? 'አግብር (Activate Key)' : 'Activate Key'}</span>
            </button>
          </div>
        </section>

        {/* Danger Zone */}
        {perms.canResetDatabase && (
        <section className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-red-200 dark:border-red-900/40 space-y-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-3 bg-red-100 dark:bg-red-950/40 text-red-600 rounded-2xl">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-red-600">
                {language === 'AM' ? 'የውሂብ ማጽጃ እና ዳግም ማስጀመሪያ (Danger Zone)' : 'Danger Zone'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'AM' ? 'የሲስተሙን ዲፎልት ዳታዎች ማጽዳት ወይም ሙሉ የመረጃ ቋቱን ባዶ ማድረግ' : 'Clear demo records or perform a complete factory reset'}
              </p>
            </div>
          </div>

          <div className="p-6 border-2 border-dashed border-red-200 dark:border-red-900/40 rounded-2xl space-y-5 bg-red-50/30 dark:bg-red-950/10">
            <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-medium">
              {language === 'AM'
                ? 'ሲስተሙን ለትክክለኛ አገልግሎት ወይም ለሽያጭ ለማዘጋጀት ዲፎልት እና ሳምፕል ንብረቶችን ሙሉ በሙሉ ማጽዳት ይችላሉ። ዋናው ሲስተም አድሚን (System Admin) ሳይጠፋ ይቆያል።'
                : 'Clear all demo and sample assets, vouchers, and transactions to ready the system for commercial use. System Admin account is preserved.'}
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button
                id="btn-clear-sample-data"
                disabled={isReseting}
                onClick={handleClearSampleData}
                className={`flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-amber-600 text-white font-black hover:bg-amber-700 active:scale-95 transition-all shadow-lg shadow-amber-600/20 ${isReseting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Sparkles size={18} />
                <span>{isReseting ? 'በማጽዳት ላይ...' : (language === 'AM' ? 'ዲፎልት እና ሳምፕል ዳታዎችን አጥፋ' : 'Clear Default / Demo Data')}</span>
              </button>

              <button
                id="btn-reset-database"
                disabled={isReseting}
                onClick={handleReset}
                className={`flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-red-600 text-white font-black hover:bg-red-700 active:scale-95 transition-all shadow-lg shadow-red-600/20 ${isReseting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Trash2 size={18} />
                <span>{isReseting ? 'በማጥፋት ላይ...' : (language === 'AM' ? 'ሙሉ ዳግም አስጀምር (Factory Reset)' : 'Reset Entire Database')}</span>
              </button>

              {showSuccess && (
                <div className="flex items-center space-x-2 text-emerald-600 font-black animate-in fade-in slide-in-from-left-4 text-sm bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2 rounded-xl border border-emerald-200">
                  <CheckCircle size={18} />
                  <span>{successText || (language === 'AM' ? 'ዳታው በተሳካ ሁኔታ ተጠርጓል!' : 'Database Cleared Successfully')}</span>
                </div>
              )}
            </div>
          </div>
        </section>
        )}
      </div>
    </div>
  )
}

export default Settings
