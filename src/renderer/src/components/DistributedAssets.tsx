import React, { useState } from 'react'
import {
  Building2,
  Share2,
  Search,
  Filter,
  Eye,
  ArrowRightLeft,
  UserCheck,
  CheckCircle2,
  RotateCcw,
  Tag,
  MapPin,
  Calendar
} from 'lucide-react'
import { useStore, Asset, TRANSLATIONS } from '../store/useStore'
import AssetProfileModal from './AssetProfileModal'
import ExportDropdown from './ExportDropdown'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getRolePermissions } from '../lib/permissions'

export default function DistributedAssets() {
  const { assets, updateAsset, language, setActiveTab, user } = useStore()
  const perms = getRolePermissions(user?.role)
  const t = TRANSLATIONS[language]

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDept, setSelectedDept] = useState('ALL')
  const [selectedAssetForProfile, setSelectedAssetForProfile] = useState<Asset | null>(null)

  // Distributed assets: has a department AND is NOT disposed AND is NOT under maintenance
  // (Assets with a personal custodian are "Assigned", not distributed)
  const distributedAssets = assets.filter((a) => {
    const isDisposed = a.disposalStatus === 'Disposed' || a.condition === 'Disposed'
    if (isDisposed) return false
    const isUnderMaintenance = a.condition === 'Under Maintenance' || a.lifecycleStatus === 'Under Maintenance'
    if (isUnderMaintenance) return false
    return Boolean(a.department && a.department.trim())
  })

  // Calculate unique departments with stats
  const deptStatsMap = new Map<string, { count: number; totalVal: number; items: Asset[] }>()
  for (const a of distributedAssets) {
    const dName = a.department || 'General Allocation'
    const cur = deptStatsMap.get(dName) || { count: 0, totalVal: 0, items: [] }
    cur.count += a.quantity
    cur.totalVal += a.quantity * a.unitCost
    cur.items.push(a)
    deptStatsMap.set(dName, cur)
  }

  const deptStats = Array.from(deptStatsMap.entries()).map(([dept, data]) => ({
    name: dept,
    count: data.count,
    totalVal: data.totalVal
  }))

  const filteredAssets = distributedAssets.filter((a) => {
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      a.name.toLowerCase().includes(q) ||
      (a.tagNumber && a.tagNumber.toLowerCase().includes(q)) ||
      (a.department && a.department.toLowerCase().includes(q)) ||
      (a.custodian && a.custodian.toLowerCase().includes(q)) ||
      (a.location && a.location.toLowerCase().includes(q))

    const matchesDept = selectedDept === 'ALL' || (a.department || 'General Allocation') === selectedDept

    return matchesSearch && matchesDept
  })

  const totalDistributedValue = distributedAssets.reduce((sum, a) => sum + a.unitCost * a.quantity, 0)

  const handleReturnToStore = async (asset: Asset) => {
    if (confirm(language === 'AM' ? `እርግጠኛ ነዎት "${asset.name}" ወደ ማዕከላዊ ግምጃ ቤት መመለስ ይፈልጋሉ?` : `Return asset "${asset.name}" back to central storage?`)) {
      await updateAsset(asset.id!, {
        custodian: '',
        department: '',
        location: 'Central Storage',
        lifecycleStatus: 'Registered'
      })
    }
  }

  const handleExportPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(16); doc.setFont('helvetica', 'bold')
    doc.text('DEPARTMENTAL ASSET DISTRIBUTION REGISTER', 105, 18, { align: 'center' })
    doc.setFontSize(9); doc.setFont('helvetica', 'normal')
    doc.text(`Total Distributed: ${distributedAssets.length} items | Total Value: ETB ${totalDistributedValue.toFixed(2)}`, 105, 24, { align: 'center' })

    const tableData = filteredAssets.map((a, i) => [
      i + 1,
      a.tagNumber || `ETH-AMS-${(a.id || 0).toString().padStart(5, '0')}`,
      a.name,
      a.department || 'General',
      a.custodian || 'Unassigned Staff',
      a.location || '—',
      a.quantity,
      `ETB ${(a.quantity * a.unitCost).toFixed(2)}`
    ])

    autoTable(doc, {
      startY: 30,
      head: [['#', 'Tag ID', 'Asset Description', 'Department', 'Assigned Holder', 'Room / Location', 'Qty', 'Total Value']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138] }
    })

    doc.save('Distributed_Assets_Report.pdf')
  }

  const exportData = filteredAssets.map((a) => ({
    'Tag ID': a.tagNumber || `ETH-AMS-${(a.id || 0).toString().padStart(5, '0')}`,
    'Asset Name': a.name,
    'Department': a.department || 'General',
    'Custodian / Holder': a.custodian || 'Unassigned',
    'Room / Location': a.location || '—',
    'Category': a.category,
    'Quantity': a.quantity,
    'Unit Cost': a.unitCost,
    'Total Allocated Value': a.quantity * a.unitCost,
    'Status': a.condition
  }))

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight underline decoration-blue-600 decoration-4 underline-offset-8">
            {language === 'AM' ? 'የተከፋፈሉ ንብረቶች (Distributed Assets)' : 'Distributed & Deployed Assets'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-3">
            {language === 'AM'
              ? 'ለመምሪያዎች፣ ክፍሎች እና ሰራተኞች የተሰራጩ ንብረቶች ክትትል'
              : 'Tracking assets allocated and distributed across institutional departments, sections, and personnel'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportDropdown data={exportData} filename="Distributed_Assets" onExportPDF={handleExportPDF} />
          <button
            onClick={() => setActiveTab('transfer-assets')}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-xl shadow-blue-600/30 transition-all hover:scale-[1.02]"
          >
            <ArrowRightLeft size={18} />
            <span>{language === 'AM' ? 'ንብረት አስተላልፍ' : 'Transfer Asset'}</span>
          </button>
        </div>
      </div>

      {/* Department Cards Carousel / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div
          onClick={() => setSelectedDept('ALL')}
          className={`p-6 rounded-3xl border cursor-pointer transition-all ${
            selectedDept === 'ALL'
              ? 'bg-slate-900 text-white dark:bg-blue-600 shadow-xl shadow-slate-900/20'
              : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">All Departments</span>
            <Building2 size={18} />
          </div>
          <p className="text-3xl font-black mt-3">{distributedAssets.length}</p>
          <p className="text-[11px] font-bold opacity-80 mt-1">ETB {totalDistributedValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>

        {deptStats.slice(0, 3).map((d) => (
          <div
            key={d.name}
            onClick={() => setSelectedDept(d.name)}
            className={`p-6 rounded-3xl border cursor-pointer transition-all ${
              selectedDept === d.name
                ? 'bg-slate-900 text-white dark:bg-blue-600 shadow-xl shadow-slate-900/20'
                : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[140px] opacity-80">{d.name}</span>
              <Share2 size={18} className="text-blue-500" />
            </div>
            <p className="text-3xl font-black mt-3">{d.count}</p>
            <p className="text-[11px] font-bold opacity-80 mt-1">ETB {d.totalVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
        ))}
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder={language === 'AM' ? 'በስም፣ ታግ፣ ክፍል ወይም ተረካቢ ፈልግ...' : 'Search distributed assets by name, tag, department, custodian, room...'}
            className="w-full pl-12 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-bold border-none outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
        >
          <option value="ALL">All Departments ({distributedAssets.length})</option>
          {deptStats.map(d => (
            <option key={d.name} value={d.name}>{d.name} ({d.count})</option>
          ))}
        </select>
      </div>

      {/* Distributed Assets Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border-2 border-slate-900 dark:border-slate-700">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest">
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'ታግ ቁጥር' : 'Tag Number'}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'የንብረት ስም' : 'Asset Description'}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'የተከፋፈለበት መምሪያ' : 'Allocated Department'}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'ተረካቢ ሰራተኛ' : 'Staff Custodian'}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'ክፍል / ቦታ' : 'Room / Location'}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right">{language === 'AM' ? 'ብዛት' : 'Qty'}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right">{language === 'AM' ? 'ጠቅላላ ዋጋ' : 'Total Value'}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right">{language === 'AM' ? 'ተግባራት' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAssets.map((asset) => {
                const tag = asset.tagNumber || `ETH-AMS-${(asset.id || 0).toString().padStart(5, '0')}`

                return (
                  <tr key={asset.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 font-mono font-bold text-xs text-slate-900 dark:text-white">
                      {tag}
                    </td>

                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                      <div>
                        <p className="font-black text-sm text-slate-900 dark:text-white">{asset.name}</p>
                        <p className="text-[10px] font-bold text-slate-400">{asset.category}</p>
                      </div>
                    </td>

                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                      <div className="flex items-center gap-1.5 text-xs font-black text-blue-700 dark:text-blue-300">
                        <Building2 size={14} className="text-blue-500" />
                        <span>{asset.department || 'General Allocation'}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                      {asset.custodian ? (
                        <div className="flex items-center gap-1.5 text-xs font-black text-emerald-700 dark:text-emerald-300">
                          <UserCheck size={14} className="text-emerald-500" />
                          <span>{asset.custodian}</span>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-slate-400 italic">Department Shared</span>
                      )}
                    </td>

                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-xs font-medium text-slate-500">
                      {asset.location || '—'}
                    </td>

                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right font-black text-sm text-slate-900 dark:text-white">
                      {asset.quantity} {asset.unit}
                    </td>

                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right font-black text-sm text-slate-900 dark:text-white">
                      ETB {(asset.quantity * asset.unitCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedAssetForProfile(asset)}
                          className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all"
                          title="View Profile"
                        >
                          <Eye size={16} />
                        </button>
                        {perms.canReturnToStore && (
                          <button
                            onClick={() => handleReturnToStore(asset)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-black text-slate-700 dark:text-slate-200 transition-colors inline-flex items-center gap-1"
                            title="Return to Central Store"
                          >
                            <RotateCcw size={13} />
                            <span>Return</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}

              {filteredAssets.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-slate-400 font-bold text-sm">
                    No distributed assets found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedAssetForProfile && (
        <AssetProfileModal
          asset={selectedAssetForProfile}
          onClose={() => setSelectedAssetForProfile(null)}
        />
      )}
    </div>
  )
}
