import React, { useState } from 'react'
import {
  Boxes,
  Plus,
  Search,
  Filter,
  Eye,
  QrCode,
  Edit2,
  Trash2,
  Wrench,
  ArrowRightLeft,
  ShieldAlert,
  FileSpreadsheet,
  Download,
  Building2,
  UserCheck,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'
import { useStore, Asset, AssetLifecycleStatus, TRANSLATIONS } from '../store/useStore'
import AssetModal from './AssetModal'
import AssetProfileModal from './AssetProfileModal'
import QRCodeModal from './QRCodeModal'
import BinCardModal from './BinCardModal'
import ExportDropdown from './ExportDropdown'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getRolePermissions } from '../lib/permissions'

export default function RegisteredAssets() {
  const { assets, deleteAsset, language, setActiveTab, user } = useStore()
  const perms = getRolePermissions(user?.role)
  const t = TRANSLATIONS[language]

  const [searchTerm, setSearchTerm] = useState('')
  const [lifecycleFilter, setLifecycleFilter] = useState<'ALL' | AssetLifecycleStatus>('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [departmentFilter, setDepartmentFilter] = useState('ALL')

  // Modals
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [selectedAssetForProfile, setSelectedAssetForProfile] = useState<Asset | null>(null)
  const [selectedAssetForQR, setSelectedAssetForQR] = useState<Asset | null>(null)
  const [selectedAssetForBinCard, setSelectedAssetForBinCard] = useState<Asset | null>(null)

  // Status badge config
  const getLifecycleBadge = (status?: string) => {
    switch (status) {
      case 'Assigned':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
      case 'Distributed':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300'
      case 'Under Maintenance':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
      case 'Disposed':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
      case 'Registered':
      default:
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300'
    }
  }

  // Derive the effective lifecycle stage using the same logic as the stat bar cards
  const getDerivedStatus = (a: Asset): string => {
    if (a.disposalStatus === 'Disposed' || a.condition === 'Disposed') return 'Disposed'
    if (a.condition === 'Under Maintenance' || a.lifecycleStatus === 'Under Maintenance') return 'Under Maintenance'
    if (a.custodian && a.custodian.trim()) return 'Assigned'
    if (a.department && a.department.trim()) return 'Distributed'
    return 'Registered'
  }

  // Filtered Assets
  const filteredAssets = assets.filter((a) => {
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      a.name.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      (a.serialNumber && a.serialNumber.toLowerCase().includes(q)) ||
      (a.tagNumber && a.tagNumber.toLowerCase().includes(q)) ||
      (a.custodian && a.custodian.toLowerCase().includes(q)) ||
      (a.department && a.department.toLowerCase().includes(q))

    const derivedStatus = getDerivedStatus(a)
    const matchesLifecycle = lifecycleFilter === 'ALL' || derivedStatus === lifecycleFilter

    const matchesCategory = categoryFilter === 'ALL' || a.category === categoryFilter
    const matchesDepartment = departmentFilter === 'ALL' || (a.department && a.department.includes(departmentFilter))

    return matchesSearch && matchesLifecycle && matchesCategory && matchesDepartment
  })

  // Export PDF
  const handleExportPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(16); doc.setFont('helvetica', 'bold')
    doc.text('PUBLIC ASSET REGISTER — LIFECYCLE AUDIT REPORT', 105, 18, { align: 'center' })
    doc.setFontSize(9); doc.setFont('helvetica', 'normal')
    doc.text(`Generated: ${new Date().toLocaleString()} | Total Items: ${filteredAssets.length}`, 105, 24, { align: 'center' })

    const tableData = filteredAssets.map((a, i) => [
      i + 1,
      a.tagNumber || `ETH-AMS-${(a.id || 0).toString().padStart(5, '0')}`,
      a.name,
      a.category,
      a.lifecycleStatus || (a.custodian ? 'Assigned' : 'Registered'),
      a.custodian || a.department || 'In Store',
      a.quantity,
      `ETB ${a.unitCost.toFixed(2)}`,
      `ETB ${(a.quantity * a.unitCost).toFixed(2)}`
    ])

    autoTable(doc, {
      startY: 30,
      head: [['#', 'Tag ID', 'Asset Description', 'Category', 'Lifecycle Stage', 'Custodian / Dept', 'Qty', 'Unit Cost', 'Total Value']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] }
    })

    doc.save('Registered_Assets_Register.pdf')
  }

  const exportData = filteredAssets.map((a) => ({
    'Tag ID': a.tagNumber || `ETH-AMS-${(a.id || 0).toString().padStart(5, '0')}`,
    'Asset Name': a.name,
    'Category': a.category,
    'Lifecycle Status': a.lifecycleStatus || (a.custodian ? 'Assigned' : 'Registered'),
    'Condition': a.condition,
    'Custodian': a.custodian || 'Unassigned',
    'Department': a.department || 'Central Store',
    'Location': a.location || '—',
    'Quantity': a.quantity,
    'Unit Cost (ETB)': a.unitCost,
    'Total Value (ETB)': a.quantity * a.unitCost,
    'Purchase Date': a.purchaseDate || '—',
    'Serial Number': a.serialNumber || '—'
  }))

  const uniqueDepartments = Array.from(new Set(assets.map(a => a.department).filter(Boolean)))
  const uniqueCategories = Array.from(new Set(assets.map(a => a.category).filter(Boolean)))

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight underline decoration-blue-500 decoration-4 underline-offset-8">
            {language === 'AM' ? 'የተመዘገቡ ንብረቶች (Asset Registry)' : 'Registered Assets Registry'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-3">
            {language === 'AM'
              ? 'የእያንዳንዱን ንብረት የህይወት ዑደት (ምዝገባ፣ ምደባ፣ ጥገና፣ ዝውውር እና ውግጃ) መከታተያ'
              : 'Comprehensive tracking of every registered item across its full lifecycle'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportDropdown data={exportData} filename="Registered_Assets" onExportPDF={handleExportPDF} />
          {perms.canRegisterAsset ? (
            <button
              onClick={() => {
                setEditingAsset(null)
                setIsAssetModalOpen(true)
              }}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-xl shadow-blue-600/30 transition-all hover:scale-[1.02]"
            >
              <Plus size={18} />
              <span>{language === 'AM' ? 'አዲስ ንብረት መዝግብ' : 'Register New Asset'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500">
              <ShieldAlert size={16} className="text-amber-500" />
              <span>{user?.role === 'Auditor' ? (language === 'AM' ? 'የኦዲት እይታ' : 'Audit Inspection View') : (language === 'AM' ? 'የንባብ እይታ' : 'Read-Only View')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Lifecycle Stage Filter Bar */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
      {[
          { id: 'ALL', label: 'All Assets', count: assets.length, color: 'border-slate-300 dark:border-slate-700' },
          { id: 'Registered', label: 'In Store', count: assets.filter(a => getDerivedStatus(a) === 'Registered').length, color: 'border-purple-400 text-purple-600' },
          { id: 'Assigned', label: 'Assigned', count: assets.filter(a => getDerivedStatus(a) === 'Assigned').length, color: 'border-emerald-400 text-emerald-600' },
          { id: 'Distributed', label: 'Distributed', count: assets.filter(a => getDerivedStatus(a) === 'Distributed').length, color: 'border-blue-400 text-blue-600' },
          { id: 'Under Maintenance', label: 'Maintenance', count: assets.filter(a => getDerivedStatus(a) === 'Under Maintenance').length, color: 'border-amber-400 text-amber-600' },
          { id: 'Disposed', label: 'Disposed', count: assets.filter(a => getDerivedStatus(a) === 'Disposed').length, color: 'border-rose-400 text-rose-600' }
        ].map((stage) => {
          const isSelected = lifecycleFilter === stage.id
          return (
            <button
              key={stage.id}
              onClick={() => setLifecycleFilter(stage.id as any)}
              className={`p-4 rounded-3xl border transition-all text-left flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 border-slate-900 dark:bg-blue-600 dark:border-blue-600'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className="text-[10px] font-black uppercase tracking-wider opacity-80">{stage.label}</span>
              <span className="text-2xl font-black mt-2">{stage.count}</span>
            </button>
          )
        })}
      </div>

      {/* Search & Secondary Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder={language === 'AM' ? 'በስም፣ ታግ ቁጥር፣ ሲሪያል ወይም ተጠቃሚ ፈልግ...' : 'Search by asset name, tag number, serial, custodian, department...'}
            className="w-full pl-12 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-bold border-none outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Categories</option>
            {uniqueCategories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-bold border-none outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Departments</option>
            {uniqueDepartments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Assets Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border-2 border-slate-900 dark:border-slate-700">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest">
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'ታግ ቁጥር' : 'Tag / Code'}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'የንብረት ስም እና መግለጫ' : 'Asset Description'}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'የህይወት ዑደት' : 'Lifecycle Stage'}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'ኃላፊ / መምሪያ' : 'Custodian & Department'}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right">{language === 'AM' ? 'ብዛት' : 'Qty'}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right">{language === 'AM' ? 'ያንዱ ዋጋ' : 'Unit Cost'}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right">{language === 'AM' ? 'ጠቅላላ ዋጋ' : 'Total Value'}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right">{language === 'AM' ? 'ተግባራት' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => {
                const tag = asset.tagNumber || `ETH-AMS-${(asset.id || 0).toString().padStart(5, '0')}`
                const stage = getDerivedStatus(asset)
                const badgeStyle = getLifecycleBadge(stage)

                return (
                  <tr key={asset.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                      <span className="font-mono text-xs font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                        {tag}
                      </span>
                    </td>

                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                      <div>
                        <p className="font-black text-sm text-slate-900 dark:text-white">{asset.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold text-slate-400">{asset.category}</span>
                          {asset.serialNumber && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-[10px] font-mono text-slate-400">SN: {asset.serialNumber}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                      <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${badgeStyle}`}>
                        {stage}
                      </span>
                    </td>

                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                      <div>
                        {asset.custodian ? (
                          <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-slate-200">
                            <UserCheck size={13} className="text-emerald-500" />
                            <span>{asset.custodian}</span>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-slate-400 italic">Central Storage</span>
                        )}
                        {asset.department && (
                          <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1 mt-0.5">
                            <Building2 size={11} /> {asset.department}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right font-black text-sm text-slate-900 dark:text-white">
                      {asset.quantity} {asset.unit}
                    </td>

                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right text-xs font-bold text-slate-600 dark:text-slate-400">
                      ETB {asset.unitCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right font-black text-sm text-slate-900 dark:text-white">
                      ETB {(asset.quantity * asset.unitCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedAssetForProfile(asset)}
                          className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all"
                          title="View Asset Profile & History"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => setSelectedAssetForQR(asset)}
                          className="p-2 rounded-xl text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-all"
                          title="Print Barcode / QR Sticker"
                        >
                          <QrCode size={16} />
                        </button>
                        {perms.canEditAsset && (
                          <button
                            onClick={() => {
                              setEditingAsset(asset)
                              setIsAssetModalOpen(true)
                            }}
                            className="p-2 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-all"
                            title="Edit Asset Details"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        {perms.canDeleteAsset && (
                          <button
                            onClick={async () => {
                              if (confirm(language === 'AM' ? `እርግጠኛ ነዎት "${asset.name}" መሰረዝ ይፈልጋሉ?` : `Delete asset "${asset.name}"?`)) {
                                await deleteAsset(asset.id!)
                              }
                            }}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                            title="Delete"
                          >
                            <Trash2 size={16} />
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
                    No registered assets found matching the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Asset Modal */}
      <AssetModal
        isOpen={isAssetModalOpen}
        onClose={() => {
          setIsAssetModalOpen(false)
          setEditingAsset(null)
        }}
        editingAsset={editingAsset}
      />

      {/* Profile Modal */}
      {selectedAssetForProfile && (
        <AssetProfileModal
          asset={selectedAssetForProfile}
          onClose={() => setSelectedAssetForProfile(null)}
          onEdit={() => {
            setEditingAsset(selectedAssetForProfile)
            setSelectedAssetForProfile(null)
            setIsAssetModalOpen(true)
          }}
        />
      )}

      {/* QR Code Modal */}
      {selectedAssetForQR && (
        <QRCodeModal
          asset={selectedAssetForQR}
          onClose={() => setSelectedAssetForQR(null)}
        />
      )}

      {/* Bin Card Modal */}
      {selectedAssetForBinCard && (
        <BinCardModal
          asset={selectedAssetForBinCard}
          isOpen={true}
          onClose={() => setSelectedAssetForBinCard(null)}
        />
      )}
    </div>
  )
}
