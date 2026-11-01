import React, { useState } from 'react'
import {
  PackageCheck,
  TrendingUp,
  PieChart,
  Search,
  Filter,
  Eye,
  Building2,
  UserCheck,
  Tag,
  ArrowRightLeft,
  CheckCircle2,
  Calendar,
  Layers
} from 'lucide-react'
import { useStore, Asset, TRANSLATIONS } from '../store/useStore'
import { calculateBookValue, calculateAccumulatedDepreciation, formatCurrency } from '../lib/finance'
import AssetProfileModal from './AssetProfileModal'
import ExportDropdown from './ExportDropdown'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function OwnedAssets() {
  const { assets, language, setActiveTab } = useStore()
  const t = TRANSLATIONS[language]

  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [selectedAssetForProfile, setSelectedAssetForProfile] = useState<Asset | null>(null)

  // Active owned assets (not disposed)
  const ownedAssets = assets.filter((a) => a.disposalStatus !== 'Disposed' && a.condition !== 'Disposed')

  const totalOrigCost = ownedAssets.reduce((acc, a) => acc + a.unitCost * a.quantity, 0)
  const totalBookVal = ownedAssets.reduce((acc, a) => acc + calculateBookValue(a), 0)
  const totalDeprec = totalOrigCost - totalBookVal

  const inStoreCount = ownedAssets.filter((a) => !a.custodian && !a.department).length
  const assignedCount = ownedAssets.filter((a) => Boolean(a.custodian)).length
  const distributedCount = ownedAssets.filter((a) => Boolean(a.department) && !a.custodian).length

  // Filtered
  const filteredOwned = ownedAssets.filter((a) => {
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      a.name.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      (a.tagNumber && a.tagNumber.toLowerCase().includes(q)) ||
      (a.custodian && a.custodian.toLowerCase().includes(q)) ||
      (a.department && a.department.toLowerCase().includes(q))

    const matchesDept = departmentFilter === 'ALL' || (a.department && a.department.includes(departmentFilter))
    const matchesCat = categoryFilter === 'ALL' || a.category === categoryFilter

    return matchesSearch && matchesDept && matchesCat
  })

  const uniqueDepartments = Array.from(new Set(ownedAssets.map(a => a.department).filter(Boolean)))
  const uniqueCategories = Array.from(new Set(ownedAssets.map(a => a.category).filter(Boolean)))

  const handleExportPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(16); doc.setFont('helvetica', 'bold')
    doc.text('OWNED INSTITUTIONAL ASSETS & VALUATION LEDGER', 105, 18, { align: 'center' })
    doc.setFontSize(9); doc.setFont('helvetica', 'normal')
    doc.text(`Total Owned Assets: ${ownedAssets.length} | Net Book Value: ${formatCurrency(totalBookVal)}`, 105, 24, { align: 'center' })

    const tableData = filteredOwned.map((a, i) => [
      i + 1,
      a.tagNumber || `ETH-AMS-${(a.id || 0).toString().padStart(5, '0')}`,
      a.name,
      a.category,
      a.custodian || a.department || 'In Central Store',
      a.condition,
      a.quantity,
      `ETB ${a.unitCost.toFixed(2)}`,
      `ETB ${calculateBookValue(a).toFixed(2)}`
    ])

    autoTable(doc, {
      startY: 30,
      head: [['#', 'Tag ID', 'Asset Description', 'Category', 'Custody / Location', 'Condition', 'Qty', 'Acquisition Cost', 'Book Value']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59] }
    })

    doc.save('Owned_Assets_Valuation.pdf')
  }

  const exportData = filteredOwned.map((a) => ({
    'Tag ID': a.tagNumber || `ETH-AMS-${(a.id || 0).toString().padStart(5, '0')}`,
    'Asset Name': a.name,
    'Category': a.category,
    'Custodian': a.custodian || 'Central Storage',
    'Department': a.department || 'General',
    'Condition': a.condition,
    'Quantity': a.quantity,
    'Original Unit Cost': a.unitCost,
    'Total Acquisition Value': a.quantity * a.unitCost,
    'Current Book Value': calculateBookValue(a),
    'Depreciation': calculateAccumulatedDepreciation(a)
  }))

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight underline decoration-emerald-500 decoration-4 underline-offset-8">
            {language === 'AM' ? 'የድርጅቱ ንብረቶች (Owned Assets)' : 'Owned Assets Portfolio'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-3">
            {language === 'AM'
              ? 'በድርጅቱ ይዞታ ስር ያሉ ንቁ ንብረቶች እና የፋይናንስ ዋጋ ማጠቃለያ'
              : 'Active institutional assets in organizational custody with current book valuation and depreciation'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportDropdown data={exportData} filename="Owned_Assets" onExportPDF={handleExportPDF} />
          <button
            onClick={() => setActiveTab('registered-assets')}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 dark:bg-emerald-600 text-white font-black text-sm shadow-xl shadow-slate-900/20 hover:scale-[1.02] transition-transform"
          >
            <Tag size={18} />
            <span>{language === 'AM' ? 'ወደ ሙሉ መዝገብ ሂድ' : 'Open Asset Registry'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'AM' ? 'ጠቅላላ የድርጅት ንብረት' : 'Total Owned Items'}</span>
            <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600"><PackageCheck size={20} /></div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-4">{ownedAssets.length}</p>
          <div className="flex items-center gap-2 mt-2 text-[11px] font-bold text-slate-400">
            <span>{inStoreCount} in Store</span> • <span>{assignedCount} Assigned</span> • <span>{distributedCount} Distributed</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'AM' ? 'የግዢ ዋጋ' : 'Acquisition Cost'}</span>
            <div className="p-2.5 rounded-2xl bg-blue-100 dark:bg-blue-950/40 text-blue-600"><Layers size={20} /></div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-4">{formatCurrency(totalOrigCost)}</p>
          <p className="text-[11px] font-bold text-slate-400 mt-1">Historic acquisition base</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'AM' ? 'ወቅታዊ የንብረት ዋጋ' : 'Current Book Value'}</span>
            <div className="p-2.5 rounded-2xl bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600"><TrendingUp size={20} /></div>
          </div>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-4">{formatCurrency(totalBookVal)}</p>
          <p className="text-[11px] font-bold text-slate-400 mt-1">Net depreciated asset worth</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'AM' ? 'የእርጅና ቅናሽ' : 'Depreciation'}</span>
            <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-950/40 text-rose-600"><PieChart size={20} /></div>
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-4">{formatCurrency(totalDeprec)}</p>
          <p className="text-[11px] font-bold text-slate-400 mt-1">Straight-line depreciation</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder={language === 'AM' ? 'በስም፣ ታግ ወይም መምሪያ ፈልግ...' : 'Search owned assets by name, tag, custodian, department...'}
            className="w-full pl-12 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-bold border-none outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Categories</option>
            {uniqueCategories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-bold border-none outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Departments</option>
            {uniqueDepartments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Owned Assets Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border-2 border-slate-900 dark:border-slate-700">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest">
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'ታግ ቁጥር' : 'Tag Number'}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'የንብረት ዝርዝር' : 'Asset Description'}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'የይዞታ ሁኔታ' : 'Custody / Location'}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'ሁኔታ' : 'Condition'}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right">{language === 'AM' ? 'የግዢ ዋጋ' : 'Acquisition Cost'}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right">{language === 'AM' ? 'የአሁኑ ዋጋ' : 'Net Book Value'}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right">{language === 'AM' ? 'ተግባራት' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredOwned.map((asset) => {
                const bookVal = calculateBookValue(asset)
                const tag = asset.tagNumber || `ETH-AMS-${(asset.id || 0).toString().padStart(5, '0')}`

                return (
                  <tr key={asset.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 font-mono font-bold text-xs text-slate-900 dark:text-white">
                      {tag}
                    </td>

                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                      <div>
                        <p className="font-black text-sm text-slate-900 dark:text-white">{asset.name}</p>
                        <p className="text-[11px] font-bold text-slate-400">{asset.category} • {asset.quantity} {asset.unit}</p>
                      </div>
                    </td>

                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                      {asset.custodian ? (
                        <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-slate-200">
                          <UserCheck size={14} className="text-emerald-500" />
                          <span>{asset.custodian}</span>
                        </div>
                      ) : asset.department ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                          <Building2 size={14} className="text-blue-500" />
                          <span>{asset.department}</span>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-slate-400 italic">Central Storage</span>
                      )}
                    </td>

                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${
                        asset.condition === 'Functional'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                      }`}>
                        {asset.condition}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right text-xs font-bold text-slate-600 dark:text-slate-400">
                      ETB {(asset.unitCost * asset.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    <td className="px-6 py-4 text-right font-black text-sm text-indigo-600 dark:text-indigo-400">
                      ETB {bookVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedAssetForProfile(asset)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-black text-slate-700 dark:text-slate-200 transition-colors inline-flex items-center gap-1.5"
                      >
                        <Eye size={14} />
                        <span>Profile</span>
                      </button>
                    </td>
                  </tr>
                )
              })}

              {filteredOwned.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400 font-bold text-sm">
                    No active owned assets found matching criteria.
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
