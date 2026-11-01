import React from 'react'
import { X, Calendar, Wallet, History, Wrench, Shield, TrendingDown, Tag, MapPin, Building2, Package } from 'lucide-react'
import { Asset, useStore } from '../store/useStore'
import { calculateBookValue, formatCurrency } from '../lib/finance'

interface AssetProfileModalProps {
  asset: Asset
  onClose: () => void
}

const AssetProfileModal = ({ asset, onClose }: AssetProfileModalProps) => {
  const { transactions, maintenanceLogs } = useStore()

  const assetTransactions = transactions.filter(t => t.assetId === asset.id)
  const assetLogs = maintenanceLogs.filter(l => l.assetId === asset.id)

  const origCost = asset.unitCost * asset.quantity
  const bookVal = calculateBookValue(asset)
  const depr = origCost - bookVal

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <header className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-6">
            <div className="bg-blue-600 p-4 rounded-3xl shadow-xl shadow-blue-500/20">
              <Package size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tight">{asset.name}</h2>
              <div className="flex items-center gap-3 mt-1 text-blue-200 text-[10px] font-black uppercase tracking-[0.2em]">
                <Tag size={12} /> {asset.serialNumber || 'No Serial'} &bull; <Building2 size={12} /> {asset.category}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 rounded-full hover:bg-white/10 transition-colors">
            <X size={24} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-10">
          
          {/* Top Grid: Financials & Status */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Operational Status</p>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${asset.condition === 'Functional' ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
                <span className="text-xl font-black text-slate-900 dark:text-white uppercase">{asset.condition}</span>
              </div>
            </div>
            <div className="p-6 rounded-3xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Acquisition Cost</p>
              <h4 className="text-xl font-black text-blue-600">{formatCurrency(origCost)}</h4>
              <p className="text-[9px] text-blue-400 font-bold mt-1 uppercase">Total for {asset.quantity} {asset.unit}s</p>
            </div>
            <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Current Book Value</p>
              <h4 className="text-xl font-black text-emerald-600">{formatCurrency(bookVal)}</h4>
              <p className="text-[9px] text-emerald-400 font-bold mt-1 uppercase">Depreciated Value</p>
            </div>
            <div className="p-6 rounded-3xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30">
              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2">Accrued Depreciation</p>
              <h4 className="text-xl font-black text-rose-600">{formatCurrency(depr)}</h4>
              <p className="text-[9px] text-rose-400 font-bold mt-1 uppercase">Value Lost to Date</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Technical Profile */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-l-4 border-slate-900 dark:border-white pl-4">
                <Shield className="text-slate-900 dark:text-white" size={20} />
                <h3 className="text-lg font-black uppercase tracking-tight">Technical Profile</h3>
              </div>
              <div className="grid grid-cols-2 gap-y-6 gap-x-10 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[2rem] shadow-sm">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Manufacturer / Supplier</p>
                  <p className="font-bold text-slate-700 dark:text-slate-300">{asset.supplier || 'Not Recorded'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Location</p>
                  <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                    <MapPin size={14} className="text-rose-500" /> {asset.location}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Purchase Date</p>
                  <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                    <Calendar size={14} className="text-blue-500" /> {asset.purchaseDate || '—'}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Warranty / Expiry</p>
                  <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                    <Shield size={14} className="text-emerald-500" /> {asset.expiryDate || 'N/A'}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Useful Life (Years)</p>
                  <p className="font-bold text-slate-700 dark:text-slate-300">{asset.usefulLife} Years</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Salvage Value</p>
                  <p className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(asset.salvageValue || 0)}</p>
                </div>
              </div>
            </div>

            {/* Audit & Maintenance Log Summary */}
            <div className="space-y-6">
               <div className="flex items-center gap-3 border-l-4 border-amber-500 pl-4">
                <History className="text-amber-500" size={20} />
                <h3 className="text-lg font-black uppercase tracking-tight">Audit & Activity Log</h3>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950/20 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                {assetTransactions.length === 0 ? (
                  <p className="text-sm italic text-slate-400 text-center py-10">No transactions recorded for this asset.</p>
                ) : assetTransactions.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-50 dark:border-slate-800 shadow-sm">
                    <div>
                      <p className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white">{t.type}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">REF: {t.voucherRef} &bull; {new Date(t.createdAt!).toLocaleDateString()}</p>
                    </div>
                    <div className={`text-sm font-black ${t.type === 'RECEIVED' ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                      {t.type === 'RECEIVED' ? '+' : '-'}{t.quantity}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Maintenance History */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-l-4 border-rose-500 pl-4">
              <Wrench className="text-rose-500" size={20} />
              <h3 className="text-lg font-black uppercase tracking-tight">Maintenance History</h3>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse border-2 border-slate-900 dark:border-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 border-b-2 border-slate-900 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">Reported Date</th>
                    <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">Issue Description</th>
                    <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">Status</th>
                    <th className="px-6 py-4 text-right border-2 border-slate-900 dark:border-slate-700">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {assetLogs.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-10 text-center text-sm italic text-slate-400 border-2 border-slate-900 dark:border-slate-700">No maintenance logs found.</td></tr>
                  ) : assetLogs.map(log => (
                    <tr key={log.id} className="text-sm group">
                      <td className="px-6 py-4 text-slate-500 font-medium border-2 border-slate-900 dark:border-slate-700">{new Date(log.reportedDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white border-2 border-slate-900 dark:border-slate-700">{log.issueDescription}</td>
                      <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          log.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-rose-600 border-2 border-slate-900 dark:border-slate-700">{formatCurrency(log.cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <footer className="p-10 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-950/20">
          <button onClick={onClose} className="py-4 px-10 rounded-2xl bg-slate-900 text-white font-black hover:bg-slate-800 transition-all text-sm uppercase tracking-widest">Close Profile</button>
        </footer>
      </div>
    </div>
  )
}

export default AssetProfileModal
