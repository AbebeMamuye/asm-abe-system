import React, { useState, useEffect, useMemo } from 'react'
import {
  Users,
  UserPlus,
  Shield,
  Building2,
  GitFork,
  CheckCircle2,
  AlertCircle,
  Search,
  Edit2,
  Trash2,
  UserCheck,
  ChevronRight,
  Layers,
  KeyRound,
  Eye,
  RefreshCw
} from 'lucide-react'
import { useStore, User, UserHierarchy, UserRole, TRANSLATIONS } from '../store/useStore'
import { getRolePermissions } from '../lib/permissions'

const INSTITUTIONAL_DEPARTMENTS = [
  { code: 'WRD-01', name: 'Woreda 01 Administration', amharicName: 'ወረዳ 01 አስተዳደር ጽ/ቤት' },
  { code: 'WRD-02', name: 'Woreda 02 Administration', amharicName: 'ወረዳ 02 አስተዳደር ጽ/ቤት' },
  { code: 'WRD-03', name: 'Woreda 03 Administration', amharicName: 'ወረዳ 03 አስተዳደር ጽ/ቤት' },
  { code: 'WRD-04', name: 'Woreda 04 Administration', amharicName: 'ወረዳ 04 አስተዳደር ጽ/ቤት' },
  { code: 'WRD-05', name: 'Woreda 05 Administration', amharicName: 'ወረዳ 05 አስተዳደር ጽ/ቤት' },
  { code: 'STORE', name: 'Logistics & Central Store', amharicName: 'ዋና ንብረትና ግምጃ ቤት' },
  { code: 'FIN', name: 'Finance & Economic Development', amharicName: 'ፋይናንስና ኢኮኖሚ ልማት' },
  { code: 'EDU', name: 'Education & Training', amharicName: 'ትምህርት ጽ/ቤት' },
  { code: 'HEALTH', name: 'Medical & Health', amharicName: 'ጤና ጽ/ቤት' },
  { code: 'IT', name: 'Information Technology (IT)', amharicName: 'ኢንፎርሜሽን ኮሙኒኬሽን ቴክኖሎጂ' },
  { code: 'HR', name: 'Human Resources & Administration', amharicName: 'የሰው ኃይል አስተዳደር' },
  { code: 'AUD', name: 'Internal Audit & Compliance', amharicName: 'ውስጥ ኦዲትና ቁጥጥር' }
]

const ROLES: { id: UserRole; label: string; desc: string; badge: string }[] = [
  { id: 'Admin', label: 'System Admin', desc: 'Full administrative access and system management', badge: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300' },
  { id: 'Manager', label: 'Department Manager', desc: 'Manages departmental assets, transfers, and maintenance approvals', badge: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300' },
  { id: 'Staff', label: 'Staff Member', desc: 'Holds assigned property, initiates transfers and requests', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300' },
  { id: 'Auditor', label: 'Auditor & Inspector', desc: 'Reviews audit trails, inventories, and generates compliance reports', badge: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300' },
  { id: 'Viewer', label: 'Viewer (Read Only)', desc: 'Read-only visibility into institutional assets and reports', badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300' },
  { id: 'Guest', label: 'Guest / Staff Applicant', desc: 'Personal assigned property custody, peer transfers, and requisition requests', badge: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300' }
]

export default function UserManagement() {
  const {
    users,
    departments,
    fetchDepartments,
    hierarchies,
    fetchUsers,
    fetchHierarchies,
    createHierarchy,
    deleteHierarchy,
    language,
    user
  } = useStore()
  const perms = getRolePermissions(user?.role)

  const effectiveDepartments = useMemo(() => {
    if (departments && departments.length > 0) {
      return departments.map(d => ({
        code: d.code,
        name: d.name,
        amharicName: d.amharicName || d.name,
        type: d.type || 'Sector'
      }))
    }
    return INSTITUTIONAL_DEPARTMENTS
  }, [departments])

  const t = TRANSLATIONS[language]
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'hierarchy'>('directory')
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [departmentFilter, setDepartmentFilter] = useState('ALL')

  // Modal / Form state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [editingUserId, setEditingUserId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [position, setPosition] = useState('')
  const [department, setDepartment] = useState('Information Technology (IT)')
  const [departmentCode, setDepartmentCode] = useState('IT')
  const [role, setRole] = useState<UserRole>('Staff')
  const [supervisorId, setSupervisorId] = useState<string>('')
  const [password, setPassword] = useState('')
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchUsers()
    fetchHierarchies()
    fetchDepartments()
  }, [])

  const openAddUser = () => {
    const firstDept = effectiveDepartments[0] || { name: 'Logistics & Central Store', code: 'STORE' }
    setEditingUserId(null)
    setName('')
    setEmail('')
    setPhone('')
    setPosition('')
    setDepartment(firstDept.name)
    setDepartmentCode(firstDept.code)
    setRole('Staff')
    setSupervisorId('')
    setPassword('')
    setFormMessage(null)
    setIsUserModalOpen(true)
  }

  const openEditUser = (u: User) => {
    setEditingUserId(u.id || null)
    setName(u.name)
    setEmail(u.email)
    setPhone(u.phone || '')
    setPosition(u.position || '')
    setDepartment(u.department || effectiveDepartments[0]?.name || 'Logistics & Central Store')
    setDepartmentCode(u.departmentCode || effectiveDepartments[0]?.code || 'STORE')
    setRole((u.role as UserRole) || 'Staff')
    setSupervisorId(u.supervisorId ? u.supervisorId.toString() : '')
    setPassword('')
    setFormMessage(null)
    setIsUserModalOpen(true)
  }

  const handleDepartmentChange = (deptName: string) => {
    setDepartment(deptName)
    const match = effectiveDepartments.find(d => d.name === deptName || d.code === deptName)
    if (match) setDepartmentCode(match.code)
  }

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setFormMessage({ type: 'error', text: 'Name is required' })
      return
    }

    setIsSubmitting(true)
    const selectedSupervisor = users.find(u => u.id?.toString() === supervisorId)

    const payload: any = {
      name: name.trim(),
      email: email.trim() || `${Date.now()}@ams.local`,
      phone: phone.trim() || null,
      position: position.trim(),
      department,
      departmentCode,
      role,
      supervisorId: selectedSupervisor?.id || null,
      supervisorName: selectedSupervisor?.name || null,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0f172a&color=fff`,
      password: password.trim() || 'TechAbe@123',
      forcePasswordChange: editingUserId ? 0 : 1
    }

    try {
      if (editingUserId) {
        if (window.api) {
          await window.api.updateUser(editingUserId, payload)
        } else {
          await fetch(`/api/users/${editingUserId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
        }

        // Also update or link hierarchy if supervisor selected
        if (selectedSupervisor) {
          const existingH = hierarchies.find(h => h.userId === editingUserId)
          if (existingH?.id) {
            await deleteHierarchy(existingH.id)
          }
          await createHierarchy({
            userId: editingUserId,
            userName: name.trim(),
            userPhone: phone.trim(),
            position: position.trim(),
            departmentCode,
            supervisorId: selectedSupervisor.id!,
            supervisorName: selectedSupervisor.name,
            supervisorPhone: selectedSupervisor.phone || ''
          })
        }

        setFormMessage({ type: 'success', text: language === 'AM' ? 'የተጠቃሚው መረጃ በተሳካ ሁኔታ ተሻሽሏል!' : 'User updated successfully!' })
      } else {
        let newUserId: number | undefined
        if (window.api) {
          const res = await window.api.registerUser(payload)
          if (!res.success) {
            setFormMessage({ type: 'error', text: res.error || 'Failed to register user' })
            setIsSubmitting(false)
            return
          }
          newUserId = res.id
        } else {
          const res = await fetch('/api/users/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          }).then(r => r.json())
          if (!res.success) {
            setFormMessage({ type: 'error', text: res.error || 'Failed to register user' })
            setIsSubmitting(false)
            return
          }
          newUserId = res.id
        }

        // Link hierarchy if supervisor chosen
        if (selectedSupervisor && newUserId) {
          await createHierarchy({
            userId: newUserId,
            userName: name.trim(),
            userPhone: phone.trim(),
            position: position.trim(),
            departmentCode,
            supervisorId: selectedSupervisor.id!,
            supervisorName: selectedSupervisor.name,
            supervisorPhone: selectedSupervisor.phone || ''
          })
        }

        setFormMessage({ type: 'success', text: language === 'AM' ? 'አዲስ ተጠቃሚ በተሳካ ሁኔታ ተመዝግቧል!' : 'New user created successfully!' })
      }

      await fetchUsers()
      await fetchHierarchies()
      setTimeout(() => {
        setIsUserModalOpen(false)
        setFormMessage(null)
      }, 1200)
    } catch (err: any) {
      setFormMessage({ type: 'error', text: err.message || 'Operation failed' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteUser = async (u: User) => {
    if (!u.id) return
    const confirmText = language === 'AM'
      ? `እርግጠኛ ነዎት ተጠቃሚ "${u.name}" መሰረዝ ይፈልጋሉ?`
      : `Are you sure you want to delete user "${u.name}"?`
    if (confirm(confirmText)) {
      if (window.api) {
        await window.api.deleteUser(u.id)
      } else {
        await fetch(`/api/users/${u.id}`, { method: 'DELETE' })
      }
      await fetchUsers()
    }
  }

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.position && u.position.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.department && u.department.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter
    const matchesDept = departmentFilter === 'ALL' || (u.departmentCode === departmentFilter || u.department?.includes(departmentFilter))
    return matchesSearch && matchesRole && matchesDept
  })

  // Group by department for hierarchy view
  const departmentsWithUsers = effectiveDepartments.map((dept) => {
    const deptUsers = users.filter(
      (u) => u.departmentCode === dept.code || (u.department && u.department.toLowerCase().includes(dept.code.toLowerCase()))
    )
    return {
      ...dept,
      users: deptUsers
    }
  }).filter((d) => d.users.length > 0)

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight underline decoration-purple-500 decoration-4 underline-offset-8">
            {language === 'AM' ? 'የተጠቃሚዎች እና ተዋረድ አስተዳደር' : 'User Management & Hierarchy'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-3">
            {language === 'AM'
              ? 'የሰራተኞችን ሚና መመደብ፣ ከመምሪያ ጋር ማስተሳሰር እና የስራ ተዋረድ መዘርጋት'
              : 'Assign staff roles, link personnel to institutional departments, and establish reporting hierarchies'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {perms.canManageUsers && (
            <button
              onClick={openAddUser}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 text-white dark:bg-purple-600 font-black text-sm shadow-xl shadow-slate-900/20 hover:scale-[1.02] transition-transform"
            >
              <UserPlus size={18} />
              <span>{language === 'AM' ? 'አዲስ ተጠቃሚ መዝግብ' : 'Add Staff Member'}</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'AM' ? 'ጠቅላላ ሰራተኞች' : 'Total Staff'}</span>
            <div className="p-2.5 rounded-2xl bg-purple-100 dark:bg-purple-950/40 text-purple-600"><Users size={20} /></div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-4">{users.length}</p>
          <p className="text-[11px] font-bold text-slate-400 mt-1">{users.filter(u => u.role === 'Admin').length} Administrators</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'AM' ? 'መምሪያዎች' : 'Departments'}</span>
            <div className="p-2.5 rounded-2xl bg-blue-100 dark:bg-blue-950/40 text-blue-600"><Building2 size={20} /></div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-4">{effectiveDepartments.length}</p>
          <p className="text-[11px] font-bold text-slate-400 mt-1">{departmentsWithUsers.length} Active in use</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'AM' ? 'የተዋረድ ትስስሮች' : 'Reporting Links'}</span>
            <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600"><GitFork size={20} /></div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-4">{hierarchies.length}</p>
          <p className="text-[11px] font-bold text-slate-400 mt-1">Direct supervisor chains</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'AM' ? 'ሚናዎች' : 'Access Roles'}</span>
            <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-600"><Shield size={20} /></div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-4">5 Roles</p>
          <p className="text-[11px] font-bold text-slate-400 mt-1">RBAC authorization</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveSubTab('directory')}
            className={`flex items-center gap-2 pb-4 px-4 text-sm font-black border-b-2 transition-all ${
              activeSubTab === 'directory'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Users size={18} />
            <span>{language === 'AM' ? 'የሰራተኞች ዝርዝር (Staff Directory)' : 'Staff Directory & Roles'}</span>
          </button>
          <button
            onClick={() => setActiveSubTab('hierarchy')}
            className={`flex items-center gap-2 pb-4 px-4 text-sm font-black border-b-2 transition-all ${
              activeSubTab === 'hierarchy'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <GitFork size={18} />
            <span>{language === 'AM' ? 'የድርጅታዊ ተዋረድ ካርታ (Hierarchy Tree)' : 'Reporting Hierarchy & Org Tree'}</span>
          </button>
        </div>
      </div>

      {/* Subtab: Directory */}
      {activeSubTab === 'directory' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800">
            <div className="relative flex-1 w-full md:w-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder={language === 'AM' ? 'በስም፣ ኢሜይል ወይም የስራ መደብ ፈልግ...' : 'Search staff by name, email, department, position...'}
                className="w-full pl-12 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-xs outline-none focus:ring-2 focus:ring-purple-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              {/* Role filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-bold border-none outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="ALL">All Roles</option>
                {ROLES.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>

              {/* Department filter */}
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-bold border-none outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="ALL">All Departments</option>
                {effectiveDepartments.map((d) => (
                  <option key={d.code} value={d.code}>
                    {language === 'AM' && d.amharicName ? d.amharicName : d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* User Table */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border-2 border-slate-900 dark:border-slate-700">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest">
                    <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'ሰራተኛ' : 'Staff Member'}</th>
                    <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'ሚና' : 'System Role'}</th>
                    <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'መምሪያ' : 'Department'}</th>
                    <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'ቅርብ አለቃ (ተዋረድ)' : 'Reports To (Supervisor)'}</th>
                    <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'ስልክ / መረጃ' : 'Contact Phone'}</th>
                    <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right">{language === 'AM' ? 'ተግባራት' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsers.map((u) => {
                    const supervisor = users.find(sup => sup.id === u.supervisorId)
                    const roleBadge = ROLES.find(r => r.id === u.role)?.badge || 'bg-slate-100 text-slate-700'

                    return (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-md shadow-purple-600/20">
                              {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover rounded-2xl" /> : u.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-black text-sm text-slate-900 dark:text-white">{u.name}</p>
                              <p className="text-[11px] font-bold text-slate-400">{u.position || 'Staff Member'}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                          <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${roleBadge}`}>
                            {u.role || 'Guest'}
                          </span>
                        </td>

                        <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                          <div className="flex items-center gap-2">
                            <Building2 size={14} className="text-slate-400 shrink-0" />
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              {u.department || u.departmentCode || 'General'}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                          {supervisor || u.supervisorName ? (
                            <div className="flex items-center gap-2">
                              <GitFork size={14} className="text-purple-500 shrink-0" />
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                {supervisor ? supervisor.name : u.supervisorName}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] font-bold text-slate-400 italic">No supervisor assigned</span>
                          )}
                        </td>

                        <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                          <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                            {u.phone || '—'}
                          </span>
                        </td>

                        <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {perms.canManageUsers ? (
                              <>
                                <button
                                  onClick={() => openEditUser(u)}
                                  className="p-2 rounded-xl text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-all"
                                  title="Edit user & reporting hierarchy"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                                  title="Delete user"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            ) : (
                              <span className="text-[11px] font-bold text-slate-400 italic">View Only</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400 font-bold text-sm">
                        No staff members found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Subtab: Hierarchy Tree View */}
      {activeSubTab === 'hierarchy' && (
        <div className="space-y-6">
          <div className="bg-purple-50 dark:bg-purple-950/20 p-6 rounded-3xl border border-purple-100 dark:border-purple-900/30 flex items-start gap-4">
            <div className="p-3 bg-purple-600 rounded-2xl text-white shrink-0"><GitFork size={24} /></div>
            <div>
              <h4 className="text-base font-black text-purple-950 dark:text-purple-200">
                {language === 'AM' ? 'የተዋረድ ትስስር መዋቅር' : 'Institutional Reporting Hierarchy'}
              </h4>
              <p className="text-xs font-medium text-purple-700 dark:text-purple-300 mt-1">
                {language === 'AM'
                  ? 'እያንዳንዱ ሰራተኛ ከመምሪያው ጋር የተሳሰረ ሲሆን፣ ለቀጥታ ቅርብ አለቃው ሪፖርት ያደርጋል'
                  : 'Every employee belongs to an institutional department and establishes a direct reporting chain to their manager or department head.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {departmentsWithUsers.map((dept) => {
              const managers = dept.users.filter(u => u.role === 'Admin' || u.role === 'Manager')
              const staffMembers = dept.users.filter(u => u.role !== 'Admin' && u.role !== 'Manager')

              return (
                <div key={dept.code} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-slate-900 dark:text-white">{dept.name}</h4>
                        <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">Dept Code: {dept.code}</span>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {dept.users.length} {dept.users.length === 1 ? 'member' : 'members'}
                    </span>
                  </div>

                  {/* Managers / Department Heads */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {language === 'AM' ? 'የመምሪያ ኃላፊዎች / ሱፐርቫይዘሮች' : 'Department Heads / Supervisors'}
                    </p>
                    {managers.map((mgr) => (
                      <div key={mgr.id} className="flex items-center justify-between p-3 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black text-xs">
                            {mgr.name.substring(0, 2)}
                          </div>
                          <div>
                            <p className="font-black text-xs text-slate-900 dark:text-white">{mgr.name}</p>
                            <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400">{mgr.position || mgr.role}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                          {mgr.role}
                        </span>
                      </div>
                    ))}
                    {managers.length === 0 && (
                      <p className="text-xs text-slate-400 italic py-1">No manager assigned to this department yet.</p>
                    )}
                  </div>

                  {/* Staff reporting into hierarchy */}
                  <div className="space-y-2 pt-2 border-t border-slate-50 dark:border-slate-800/60">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {language === 'AM' ? 'የሚተዳደሩ ሰራተኞች' : 'Subordinate Personnel'}
                    </p>
                    {staffMembers.map((st) => {
                      const sup = users.find(x => x.id === st.supervisorId)
                      return (
                        <div key={st.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <div className="flex items-center gap-2.5">
                            <ChevronRight size={14} className="text-slate-400" />
                            <div>
                              <p className="font-black text-xs text-slate-800 dark:text-slate-200">{st.name}</p>
                              <p className="text-[10px] text-slate-400">{st.position || 'Staff'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-500">
                              {sup ? `Reports to: ${sup.name}` : 'Direct report'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                    {staffMembers.length === 0 && (
                      <p className="text-xs text-slate-400 italic py-1">No additional staff in this department.</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* User Create / Edit Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-6 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <form
            onSubmit={handleSubmitUser}
            className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden transform animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
          >
            <header className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-purple-600 rounded-2xl text-white shadow-lg shadow-purple-600/20">
                  <UserCheck size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    {editingUserId
                      ? (language === 'AM' ? 'የተጠቃሚ መረጃ አሻሽል' : 'Edit Staff & Reporting Hierarchy')
                      : (language === 'AM' ? 'አዲስ ሰራተኛ መዝግብ' : 'Register New Staff Member')}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    {language === 'AM' ? 'ሚና፣ መምሪያ እና የቅርብ አለቃ መድብ' : 'Assign role, department, and reporting supervisor'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
              >
                ✕
              </button>
            </header>

            <div className="px-8 py-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
              {formMessage && (
                <div
                  className={`p-4 rounded-2xl text-xs font-black flex items-center gap-3 ${
                    formMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                  }`}
                >
                  {formMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  <span>{formMessage.text}</span>
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block">
                    {language === 'AM' ? 'ሙሉ ስም' : 'Full Name'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Abebe Kebede"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block">
                    {language === 'AM' ? 'ኢሜይል' : 'Email Address'}
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. abebe@organization.gov.et"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block">
                    {language === 'AM' ? 'ስልክ ቁጥር' : 'Phone Number'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 0911000000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block">
                    {language === 'AM' ? 'የስራ መደብ' : 'Job Title / Position'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Network Administrator"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                </div>
              </div>

              {/* Role & Department */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block">
                    {language === 'AM' ? 'የስርዓት ሚና' : 'System Role'} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  >
                    {ROLES.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label} ({r.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block">
                    {language === 'AM' ? 'መምሪያ / የስራ ክፍል' : 'Department'}
                  </label>
                  <select
                    value={department}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  >
                    {effectiveDepartments.map((d) => (
                      <option key={d.code} value={d.name}>
                        {language === 'AM' && d.amharicName ? d.amharicName : d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Hierarchy: Direct Supervisor */}
              <div className="space-y-2 p-5 bg-purple-50/60 dark:bg-purple-950/30 rounded-2xl border border-purple-100 dark:border-purple-900/40">
                <label className="text-xs font-black text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-2">
                  <GitFork size={15} />
                  <span>{language === 'AM' ? 'ቅርብ አለቃ (የሪፖርት ተዋረድ)' : 'Reports To (Direct Supervisor)'}</span>
                </label>
                <select
                  value={supervisorId}
                  onChange={(e) => setSupervisorId(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-800 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                >
                  <option value="">-- No Direct Supervisor (Department Head / Top-Level) --</option>
                  {users
                    .filter((u) => !editingUserId || u.id !== editingUserId)
                    .map((u) => (
                      <option key={u.id} value={u.id?.toString()}>
                        {u.name} — {u.position || u.role} ({u.department || u.departmentCode || 'General'})
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-purple-600/80 dark:text-purple-300/80 font-medium">
                  {language === 'AM'
                    ? 'ሰራተኛው ለሚልካቸው የንብረት ጥያቄዎችና ዝውውሮች ማረጋገጫ የሚሰጠው ኃላፊ'
                    : 'The designated manager who reviews asset assignments and transfer authorizations for this staff member.'}
                </p>
              </div>

              {/* Password */}
              <div className="space-y-2 p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block">
                    {editingUserId
                      ? (language === 'AM' ? 'የይለፍ ቃል ቀይር (አስፈላጊ ከሆነ)' : 'New Password (Optional)')
                      : (language === 'AM' ? 'ነባሪ ጊዜያዊ የይለፍ ቃል (Default Temporary Password)' : 'Default Temporary Password')}
                  </label>
                  {!editingUserId && (
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                      {language === 'AM' ? 'ለመጀመሪያ ጊዜ ሲገባ ይቀይረዋል' : 'Requires 1st-time reset'}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder={editingUserId ? (language === 'AM' ? 'ባዶ ከተተወ የቀድሞው ይቀጥላል' : 'Leave blank to retain current password') : '••••••••••••'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
                {!editingUserId && (
                  <p className="text-[11px] text-slate-400">
                    {language === 'AM'
                      ? 'ተጠቃሚው ሲገባ የራሱን ቋሚ የይለፍ ቃል መቀየር ይችላል።'
                      : 'The user will be required to create their own private password upon first login.'}
                  </p>
                )}
              </div>
            </div>

            <footer className="px-8 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/40 backdrop-blur-sm flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="py-3 px-6 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-white dark:hover:bg-slate-800 text-sm transition-all cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-3 px-8 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-sm shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                <span>{editingUserId ? (language === 'AM' ? 'ለውጦችን አሻሽል' : 'Save Changes') : (language === 'AM' ? 'ሰራተኛውን መዝግብ' : 'Create User')}</span>
              </button>
            </footer>
          </form>
        </div>
      )}
    </div>
  )
}
