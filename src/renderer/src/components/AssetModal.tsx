import { useState, useEffect } from 'react'
import { X, CheckCircle, Boxes, MapPin, Tag, Info, Wallet, Database, Calendar, ShieldCheck, UserCheck } from 'lucide-react'
import { useStore, Asset, TRANSLATIONS, AssetLifecycleStatus } from '../store/useStore'
import EthiopianDatePicker from './EthiopianDatePicker'

const ASSET_CATEGORIES = [
  'Electronics',
  'Furniture',
  'Vehicles',
  'Machinery',
  'Appliances',
  'Stationery',
  'Construction',
  'Cleaning',
  'Others'
]

const FUND_SOURCES = [
  'Budget',
  'Internal Revenue',
  'Donor/Grant',
  'Special Fund',
  'Others'
]

const UNITS = [
  'Piece', 'Unit', 'Set', 'Box', 'Pack', 'Ream', 'Bottle', 'Liter', 'Carton', 'Roll', 'Pair', 'Dozen'
]

const CONDITIONS = [
  'Functional', 'Under Maintenance', 'Non-functional', 'Disposed'
]

const LIFECYCLE_STATUSES: { id: AssetLifecycleStatus; labelEn: string; labelAm: string }[] = [
  { id: 'Registered', labelEn: 'Registered (In Store)', labelAm: 'በመዝገብ/ስቶር ያለ' },
  { id: 'Assigned', labelEn: 'Assigned (In Use by Staff)', labelAm: 'ለሰራተኛ የተመደበ' },
  { id: 'Distributed', labelEn: 'Distributed (To Department)', labelAm: 'ለክፍል የተከፋፈለ' },
  { id: 'Under Maintenance', labelEn: 'Under Maintenance', labelAm: 'በጥገና ላይ' },
  { id: 'Disposed', labelEn: 'Disposed / Decommissioned', labelAm: 'የተወገደ / ውዳቂ' }
]

const INSTITUTIONAL_DEPARTMENTS = [
  'Information Technology (IT)',
  'Finance & Accounts',
  'Human Resources & Administration',
  'Logistics & Central Store',
  'Operations & Facilities',
  'Engineering & Maintenance',
  'Education & Training',
  'Medical & Health',
  'Legal & Audit',
  'General Management'
]

interface AssetModalProps {
  isOpen: boolean
  onClose: () => void
  editingAsset?: Asset | null
}

const AssetModal = ({ isOpen, onClose, editingAsset }: AssetModalProps) => {
  const { addAsset, updateAsset, language, users, departments } = useStore()
  const t = TRANSLATIONS[language]

  const departmentOptions = departments && departments.length > 0
    ? departments.map(d => (language === 'AM' && d.amharicName ? d.amharicName : d.name))
    : INSTITUTIONAL_DEPARTMENTS

  const initialFormState: Asset = {
    name: '',
    category: 'Electronics',
    fundSource: 'Budget',
    quantity: 1,
    unitCost: 0,
    unit: 'Piece',
    location: '',
    condition: 'Functional',
    serialNumber: '',
    supplier: '',
    usefulLife: 5,
    salvageValue: 0,
    purchaseDate: new Date().toISOString().split('T')[0],
    tagNumber: '',
    custodian: '',
    department: '',
    lifecycleStatus: 'Registered'
  }

  const [form, setForm] = useState<Asset>(initialFormState)

  useEffect(() => {
    if (editingAsset) {
      setForm(editingAsset)
    } else {
      setForm(initialFormState)
    }
  }, [editingAsset, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!form.name.trim()) {
      alert(language === 'AM' ? 'እባክዎን የንብረቱን ስም ያስገቡ!' : 'Please enter the asset name!')
      return
    }
    if (form.quantity <= 0) {
      alert(language === 'AM' ? 'ብዛት ከ 0 መብለጥ አለበት!' : 'Quantity must be greater than 0!')
      return
    }

    if (editingAsset?.id) {
      await updateAsset(editingAsset.id, form)
      alert(language === 'AM' ? 'ንብረቱ በተሳካ ሁኔታ ተሻሽሏል!' : 'Asset updated successfully!')
    } else {
      await addAsset(form)
      alert(language === 'AM' ? 'ንብረቱ በተሳካ ሁኔታ ተመዝግቧል!' : 'Asset registered successfully!')
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh]">
        <header className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 p-3 rounded-2xl text-white shadow-lg">
              <Boxes size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {editingAsset ? (language === 'AM' ? 'ንብረት አሻሽል' : 'Update Asset') : (language === 'AM' ? 'ንብረት መዝግብ' : 'Register Asset')}
              </h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                {language === 'AM' ? 'አጠቃላይ የንብረት ምዝገባ' : 'General Asset Registry'}
              </p>
            </div>
          </div>
          <button id="asset-modal-close" onClick={onClose} className="p-2 rounded-full text-slate-400 hover:text-slate-900 transition-colors">
            <X size={24} />
          </button>
        </header>

        <form id="asset-form" onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto custom-scrollbar flex-1">
          {/* Identification */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-slate-400">
              <Info size={16} />
              <h3 className="text-xs font-black uppercase tracking-widest">
                {language === 'AM' ? 'ንብረቱን ለይቶ ማሳወቂያ' : 'Asset Identification'}
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-2 block border-l-4 border-blue-500 pl-3">
                  {language === 'AM' ? 'የንብረቱ ስም' : 'Asset Name / Description'} <span className="text-red-500">*</span>
                </label>
                <input
                  id="asset-name"
                  required
                  type="text"
                  placeholder="e.g. Dell Latitude Laptop"
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-sm outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-2 block border-l-4 border-blue-500 pl-3">
                  {language === 'AM' ? 'ምድብ' : 'Category'}
                </label>
                <select
                  id="asset-category"
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-sm outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                >
                  {ASSET_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-2 block border-l-4 border-slate-300 pl-3">
                  {language === 'AM' ? 'አቅራቢ / ሻጪ' : 'Supplier / Vendor'}
                </label>
                <input
                  id="asset-supplier"
                  type="text"
                  placeholder="e.g. National Electronics PLC"
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-sm outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                  value={form.supplier || ''}
                  onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-2 block border-l-4 border-slate-300 pl-3">
                  {language === 'AM' ? 'ሲሪያል ቁጥር' : 'Serial / Tag Number'}
                </label>
                <input
                  id="asset-serial"
                  type="text"
                  placeholder="SN-XXXXX or TAG-001"
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                  value={form.serialNumber || ''}
                  onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                />
              </div>
            </div>
          </section>

          {/* Stock & Unit */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-slate-400">
              <Database size={16} />
              <h3 className="text-xs font-black uppercase tracking-widest">
                {language === 'AM' ? 'ብዛት እና መለኪያ' : 'Stock & Measurement'}
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-2 block border-l-4 border-emerald-500 pl-3">{t.stock} <span className="text-red-500">*</span></label>
                <input
                  id="asset-quantity"
                  required
                  type="number"
                  min="0"
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-black text-sm text-center outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-2 block border-l-4 border-emerald-500 pl-3">{t.unit}</label>
                <select
                  id="asset-unit"
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                >
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-2 block border-l-4 border-emerald-500 pl-3">{t.condition}</label>
                <select
                  id="asset-condition"
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                  value={form.condition}
                  onChange={(e) => setForm({ ...form, condition: e.target.value as any })}
                >
                  {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* Valuation - Fund Source and Cost only */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-slate-400">
              <Wallet size={16} />
              <h3 className="text-xs font-black uppercase tracking-widest">
                {language === 'AM' ? 'የዋጋ መግለጫ' : 'Valuation & Funding (ETB)'}
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-2 block border-l-4 border-amber-500 pl-3">
                  {language === 'AM' ? 'የገንዘብ ምንጭ' : 'Fund Source'}
                </label>
                <select
                  id="asset-fund-source"
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-sm outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                  value={form.fundSource}
                  onChange={(e) => setForm({ ...form, fundSource: e.target.value as any })}
                >
                  {FUND_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-2 block border-l-4 border-amber-500 pl-3">
                  {language === 'AM' ? 'ነጠላ ዋጋ' : 'Unit Cost'} <span className="text-red-500">*</span>
                </label>
                <input
                  id="asset-unit-cost"
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-lg text-blue-600 outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                  value={form.unitCost}
                  onChange={(e) => setForm({ ...form, unitCost: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-2 block border-l-4 border-amber-200 pl-3">
                  {language === 'AM' ? 'የአገልግሎት ዘመን (ዓመት)' : 'Useful Life (Years)'}
                </label>
                <input
                  id="asset-useful-life"
                  type="number"
                  min="1"
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-sm outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                  value={form.usefulLife}
                  onChange={(e) => setForm({ ...form, usefulLife: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-2 block border-l-4 border-amber-200 pl-3">
                  {language === 'AM' ? 'ቀሪ ዋጋ' : 'Salvage Value'}
                </label>
                <input
                  id="asset-salvage-value"
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-sm outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                  value={form.salvageValue}
                  onChange={(e) => setForm({ ...form, salvageValue: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </section>

          {/* Dates */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-slate-400">
              <Calendar size={16} />
              <h3 className="text-xs font-black uppercase tracking-widest">
                {language === 'AM' ? 'ቀኖች' : 'Important Dates'}
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <EthiopianDatePicker 
                  label={language === 'AM' ? 'የተገዛበት ቀን' : 'Purchase Date'} 
                  value={form.purchaseDate || ''} 
                  onChange={(d) => setForm({ ...form, purchaseDate: d })} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">
                  {language === 'AM' ? 'የሚያበቃበት ቀን (GC)' : 'Expiry Date (GC)'}
                </label>
                <input
                  id="asset-expiry"
                  type="date"
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-sm outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                  value={form.expiryDate || ''}
                  onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                />
              </div>
            </div>
          </section>

          {/* Location, Custodianship & Lifecycle Tracking */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-slate-400">
              <ShieldCheck size={16} />
              <h3 className="text-xs font-black uppercase tracking-widest">
                {language === 'AM' ? 'የንብረት ዑደት፣ ኃላፊነት እና ቦታ (Lifecycle, Custody & Location)' : 'Lifecycle Status, Custodianship & Location'}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Lifecycle Stage */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-2 block border-l-4 border-indigo-500 pl-3">
                  {language === 'AM' ? 'የንብረት ዑደት ደረጃ' : 'Asset Lifecycle Stage'}
                </label>
                <select
                  id="asset-lifecycle-status"
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-sm outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                  value={form.lifecycleStatus || 'Registered'}
                  onChange={(e) => {
                    const status = e.target.value as AssetLifecycleStatus
                    setForm({
                      ...form,
                      lifecycleStatus: status,
                      condition: status === 'Under Maintenance' ? 'Under Maintenance' : status === 'Disposed' ? 'Disposed' : form.condition
                    })
                  }}
                >
                  {LIFECYCLE_STATUSES.map((ls) => (
                    <option key={ls.id} value={ls.id}>
                      {language === 'AM' ? ls.labelAm : ls.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tag Number */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-2 block border-l-4 border-blue-500 pl-3">
                  {language === 'AM' ? 'የንብረት ታግ / መለያ ቁጥር' : 'Asset Tag / Code (FAR)'}
                </label>
                <input
                  id="asset-tag-number"
                  type="text"
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                  placeholder="e.g. ETH-AMS-00101 (Auto-generated if blank)"
                  value={form.tagNumber || ''}
                  onChange={(e) => setForm({ ...form, tagNumber: e.target.value })}
                />
              </div>

              {/* Custodian Selection */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-2 block border-l-4 border-emerald-500 pl-3">
                  {language === 'AM' ? 'የንብረቱ ተረካቢ / ኃላፊ ሰራተኛ' : 'Asset Custodian / Staff Link'}
                </label>
                <div className="relative">
                  <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    id="asset-custodian"
                    list="staff-suggestions"
                    type="text"
                    className="w-full pl-12 pr-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                    placeholder={language === 'AM' ? 'ሰራተኛ ይምረጡ ወይም ያስገቡ...' : 'Select staff member or type name...'}
                    value={form.custodian || ''}
                    onChange={(e) => {
                      const val = e.target.value
                      const matchedUser = users.find(u => u.name.toLowerCase() === val.toLowerCase())
                      setForm({
                        ...form,
                        custodian: val,
                        department: matchedUser?.department || (matchedUser?.departmentCode ? matchedUser.departmentCode : form.department),
                        lifecycleStatus: val.trim() ? (form.lifecycleStatus === 'Registered' ? 'Assigned' : form.lifecycleStatus) : form.lifecycleStatus
                      })
                    }}
                  />
                  <datalist id="staff-suggestions">
                    {users.map(u => (
                      <option key={u.id} value={u.name}>
                        {u.position || u.role} {u.department ? `(${u.department})` : ''}
                      </option>
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Department Selection */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-2 block border-l-4 border-amber-500 pl-3">
                  {language === 'AM' ? 'መምሪያ / የስራ ክፍል' : 'Department / Organizational Unit'}
                </label>
                <input
                  id="asset-department"
                  list="department-suggestions"
                  type="text"
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                  placeholder="e.g. Information Technology (IT)"
                  value={form.department || ''}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                />
                <datalist id="department-suggestions">
                  {departmentOptions.map(d => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </div>

              {/* Location */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-2 block border-l-4 border-rose-500 pl-3">
                  {t.location}
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    id="asset-location"
                    type="text"
                    className="w-full pl-12 pr-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                    placeholder="e.g. Head Office, Block B, Room 204"
                    value={form.location || ''}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </section>
        </form>

        <footer className="p-10 border-t border-slate-100 dark:border-slate-800 flex gap-4 bg-slate-50 dark:bg-slate-950/20">
          <button id="asset-cancel" type="button" onClick={onClose} className="flex-1 py-4 px-6 rounded-2xl border border-slate-200 text-slate-500 font-bold hover:bg-white transition-all text-sm">{t.cancel}</button>
          <button id="asset-submit" onClick={handleSubmit} className="flex-[2] py-4 px-6 rounded-2xl bg-slate-900 text-white font-black hover:bg-slate-800 shadow-xl shadow-slate-900/40 transition-all text-sm flex items-center justify-center gap-3">
            <CheckCircle size={20} />
            <span>{editingAsset ? t.save : t.registerAsset}</span>
          </button>
        </footer>
      </div>
    </div>
  )
}

export default AssetModal
