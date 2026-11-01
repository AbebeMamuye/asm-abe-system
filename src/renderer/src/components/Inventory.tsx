import { useState } from 'react'
import { Plus, Search, Edit2, Trash2, Package, Tag, MapPin, Filter, Eye, FileText, QrCode } from 'lucide-react'
import { useStore, Asset, TRANSLATIONS } from '../store/useStore'
import AssetModal from './AssetModal'
import AssetProfileModal from './AssetProfileModal'
import BinCardModal from './BinCardModal'
import QRCodeModal from './QRCodeModal'
import { formatCurrency } from '../lib/finance'
import ExportDropdown from './ExportDropdown'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const Inventory = () => {
  const { assets, deleteAsset, language } = useStore()
  const t = TRANSLATIONS[language]
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isBinCardOpen, setIsBinCardOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | undefined>()
  const [selectedAssetForQR, setSelectedAssetForQR] = useState<Asset | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedCondition, setSelectedCondition] = useState<string>('All')
  const [showFilters, setShowFilters] = useState(false)

  const categories = ['All', 'Electronics', 'Furniture', 'Vehicles', 'Machinery', 'Appliances', 'Stationery', 'Construction', 'Cleaning', 'Others']
  const conditions = ['All', 'Functional', 'Under Maintenance', 'Non-functional', 'Disposed']

  const filteredAssets = assets.filter(a => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.serialNumber && a.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.tagNumber && a.tagNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.custodian && a.custodian.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.department && a.department.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCategory = selectedCategory === 'All' || a.category === selectedCategory
    const matchesCondition = selectedCondition === 'All' || a.condition === selectedCondition

    return matchesSearch && matchesCategory && matchesCondition
  })

  const handleEdit = (asset: Asset) => {
    setSelectedAsset(asset)
    setIsModalOpen(true)
  }

  const handleViewProfile = (asset: Asset) => {
    setSelectedAsset(asset)
    setIsProfileOpen(true)
  }

  const handleViewBinCard = (asset: Asset) => {
    setSelectedAsset(asset)
    setIsBinCardOpen(true)
  }

  const handleAddNew = () => {
    setSelectedAsset(undefined)
    setIsModalOpen(true)
  }

  const generatePDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(18); doc.setFont('helvetica', 'bold')
    doc.text('PUBLIC PROPERTY REGISTRY (FIXED ASSET REGISTER)', 105, 18, { align: 'center' })
    doc.setFontSize(10); doc.setFont('helvetica', 'normal')
    doc.text('የቋሚ ንብረት መዝገብ - በኢትዮጵያ መንግስት ንብረት አስተዳደር መመሪያ መሰረት', 105, 24, { align: 'center' })
    const tableData = assets.map((a, i) => [
      i + 1,
      a.tagNumber || `ETH-AMS-${(a.id || 0).toString().padStart(5, '0')}`,
      a.name,
      a.custodian || a.location || '—',
      a.condition,
      a.quantity,
      a.unitCost.toFixed(2),
      (a.quantity * a.unitCost).toFixed(2)
    ])
    autoTable(doc, {
      startY: 30,
      head: [['#', 'Tag / Code', 'Asset Name', 'Custodian / Location', 'Condition', 'Qty', 'Unit Cost', 'Total Value']],
      body: tableData,
      theme: 'grid', headStyles: { fillColor: [30, 41, 59] }
    })
    doc.save('Fixed_Asset_Register.pdf')
  }

  const exportData = assets.map(a => ({
    'Tag Number': a.tagNumber || `ETH-AMS-${(a.id || 0).toString().padStart(5, '0')}`,
    'Name': a.name,
    'Category': a.category,
    'Serial Number': a.serialNumber || 'N/A',
    'Custodian': a.custodian || 'Unassigned',
    'Department': a.department || 'N/A',
    'Location': a.location,
    'Condition': a.condition,
    'Quantity': a.quantity,
    'Unit': a.unit,
    'Unit Cost': a.unitCost,
    'Total Value': a.quantity * a.unitCost,
    'Last Updated': a.lastUpdated || 'N/A'
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight underline decoration-blue-500 decoration-2 underline-offset-4">{t.registry}</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">{language === 'AM' ? 'አጠቃላይ የንብረት መዝገብ' : 'General-Purpose Asset Registry'}</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportDropdown data={exportData} filename="Property_Inventory" onExportPDF={generatePDF} />
          <button
            onClick={handleAddNew}
            className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-slate-900/20 transition-all active:scale-95"
          >
            <Plus size={20} />
            <span>{t.registerAsset}</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder={t.search}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg border transition-all flex items-center gap-1.5 text-xs font-bold ${
                showFilters || selectedCategory !== 'All' || selectedCondition !== 'All'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'text-slate-500 hover:bg-white dark:hover:bg-slate-800 border-transparent hover:border-slate-200'
              }`}
              title="Toggle Filters"
            >
              <Filter size={18} />
              {(selectedCategory !== 'All' || selectedCondition !== 'All') && (
                <span className="w-2 h-2 rounded-full bg-amber-400" />
              )}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="p-4 bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-4 text-xs font-bold animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">{language === 'AM' ? 'ምድብ:' : 'Category:'}</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === 'All' ? (language === 'AM' ? 'ሁሉም ምድቦች' : 'All Categories') : c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500">{language === 'AM' ? 'ሁኔታ:' : 'Condition:'}</span>
              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
              >
                {conditions.map((c) => (
                  <option key={c} value={c}>
                    {c === 'All' ? (language === 'AM' ? 'ሁሉም ሁኔታዎች' : 'All Conditions') : c}
                  </option>
                ))}
              </select>
            </div>

            {(selectedCategory !== 'All' || selectedCondition !== 'All' || searchTerm) && (
              <button
                onClick={() => {
                  setSelectedCategory('All')
                  setSelectedCondition('All')
                  setSearchTerm('')
                }}
                className="text-xs text-blue-600 hover:text-blue-500 underline cursor-pointer ml-auto"
              >
                {language === 'AM' ? 'ማጣሪያዎችን አጽዳ' : 'Reset Filters'}
              </button>
            )}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border-2 border-slate-900 dark:border-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'ንብረት መለያ' : 'Full Details'}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{t.condition}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{t.location}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{t.stock}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{language === 'AM' ? 'ነጠላ ዋጋ' : 'Unit Cost'}</th>
                <th className="px-6 py-4 text-right border-2 border-slate-900 dark:border-slate-700">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <Package size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">{asset.name}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            {asset.tagNumber || `ETH-AMS-${(asset.id || 0).toString().padStart(5, '0')}`}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1.5 mt-0.5">
                          <Tag size={10} /> {asset.serialNumber || 'No Serial'} • {asset.category}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${
                          asset.condition === 'Functional' ? 'bg-emerald-500' :
                          asset.condition === 'Under Maintenance' ? 'bg-amber-500' :
                          asset.condition === 'Disposed' ? 'bg-slate-500' : 'bg-red-500'
                        }`} />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                           {asset.condition === 'Functional' ? (language === 'AM' ? 'ተግባራዊ' : 'Functional') : 
                            asset.condition === 'Under Maintenance' ? (language === 'AM' ? 'ጥገና ላይ' : 'Under Repair') :
                            asset.condition === 'Disposed' ? (language === 'AM' ? 'የተወገደ (Disposed)' : 'Disposed') : (language === 'AM' ? 'የማይሰራ' : 'Non-functional')}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium italic">{language === 'AM' ? 'የተሻሻለው፡ ' : 'Updated: '} {asset.lastUpdated ? new Date(asset.lastUpdated).toLocaleDateString() : '—'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                    <div className="flex flex-col gap-0.5 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold">
                        <MapPin size={12} className="text-rose-500" />
                        {asset.location || '—'}
                      </div>
                      {(asset.custodian || asset.department) && (
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                          {asset.custodian ? `👤 ${asset.custodian}` : ''} {asset.department ? `(${asset.department})` : ''}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                    <div className="flex flex-col">
                      <span className="text-lg font-black text-slate-900 dark:text-white">{asset.quantity}</span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{asset.unit}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(asset.unitCost)}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{language === 'AM' ? 'ነጠላ ዋጋ' : 'Unit Price'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right border-2 border-slate-900 dark:border-slate-700">
                    <div className="flex items-center justify-end gap-2">
                      <button id={`btn-view-asset-${asset.id}`} onClick={() => handleViewProfile(asset)} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors" title="View Profile">
                        <Eye size={16} />
                      </button>
                      <button id={`btn-qr-asset-${asset.id}`} onClick={() => setSelectedAssetForQR(asset)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Print AMIS QR Sticker">
                        <QrCode size={16} />
                      </button>
                      <button id={`btn-bincard-asset-${asset.id}`} onClick={() => handleViewBinCard(asset)} className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors" title="View Bin Card">
                        <FileText size={16} />
                      </button>
                      <button id={`btn-edit-asset-${asset.id}`} onClick={() => handleEdit(asset)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Edit Asset">
                        <Edit2 size={16} />
                      </button>
                      <button id={`btn-delete-asset-${asset.id}`} onClick={() => deleteAsset(asset.id!)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Delete Asset">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <AssetModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          editingAsset={selectedAsset}
        />
      )}

      {isProfileOpen && selectedAsset && (
        <AssetProfileModal
          asset={selectedAsset}
          onClose={() => setIsProfileOpen(false)}
        />
      )}

      {isBinCardOpen && selectedAsset && (
        <BinCardModal
          asset={selectedAsset}
          onClose={() => setIsBinCardOpen(false)}
        />
      )}

      {selectedAssetForQR && (
        <QRCodeModal
          asset={selectedAssetForQR}
          onClose={() => setSelectedAssetForQR(null)}
        />
      )}
    </div>
  )
}

export default Inventory
