import { useStore, TRANSLATIONS } from '../store/useStore'
import { FileText } from 'lucide-react'
import { formatCurrency } from '../lib/finance'

const ReportM19 = () => {
  const { vouchersM19, assets, language } = useStore()
  const t = TRANSLATIONS[language]

  // Flatten the voucher items
  const reportData = vouchersM19.flatMap(voucher => 
    (voucher.items || []).map((item, index) => {
      // Find asset to get extra details like condition and location
      const asset = assets.find(a => a.id === item.assetId) || {} as any
      return {
        itemNo: index + 1,
        assetCode: asset.serialNumber || item.serial || 'N/A',
        description: item.assetName + (item.model ? ` (${item.model})` : ''),
        unit: item.unit,
        quantity: item.quantity,
        unitPrice: item.unitCost,
        totalPrice: item.totalCost,
        shelfLocation: voucher.shelfNo || asset.location || 'N/A',
        condition: asset.condition || 'New',
        remarks: voucher.note || 'None'
      }
    })
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {t.model19ReportTitle}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {t.model19ReportDesc}
          </p>
        </div>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="text-blue-500" />
            {t.model19ReportTitle}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border-2 border-slate-900 dark:border-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{t.itemNo}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{t.assetStockCode}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{t.itemDescription}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{t.uom}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right">{t.qtyReceived}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right">{t.unitPrice}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right">{t.totalPrice}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{t.shelfLocation}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{t.conditionStatus}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{t.remarks}</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-sm font-bold text-slate-500">{row.itemNo}</td>
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-sm font-bold">{row.assetCode}</td>
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-sm font-black">{row.description}</td>
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-sm text-slate-500">{row.unit}</td>
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-sm font-black text-blue-600 text-right">{row.quantity}</td>
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 text-right">{formatCurrency(row.unitPrice)}</td>
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-sm font-black text-slate-900 dark:text-white text-right">{formatCurrency(row.totalPrice)}</td>
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-sm text-slate-500">{row.shelfLocation}</td>
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-sm">
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold">{row.condition}</span>
                  </td>
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-xs text-slate-500">{row.remarks}</td>
                </tr>
              ))}
              {reportData.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-400 font-bold border-2 border-slate-900 dark:border-slate-700">No received items found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ReportM19
