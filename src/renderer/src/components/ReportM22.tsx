import { useStore, TRANSLATIONS } from '../store/useStore'
import { FileText } from 'lucide-react'
import { formatCurrency } from '../lib/finance'

const ReportM22 = () => {
  const { vouchersM22, assets, language } = useStore()
  const t = TRANSLATIONS[language]

  const reportData = vouchersM22.flatMap(voucher => 
    (voucher.items || []).map((item, index) => {
      const asset = assets.find(a => a.id === item.assetId) || {} as any
      return {
        itemNo: index + 1,
        binCardRef: asset.id ? `BIN-${asset.id}` : 'N/A',
        tagId: asset.serialNumber || item.serial || 'N/A',
        description: item.assetName + (item.model ? ` (${item.model})` : ''),
        serialNumber: asset.serialNumber || item.serial || 'N/A',
        unit: item.unit,
        qtyReq: item.quantity, // usually equals requested if authorized fully
        qtyIssued: item.quantity,
        unitCost: item.unitCost,
        totalValue: item.totalCost,
        lifeStatus: asset.condition || 'Used'
      }
    })
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {t.model22ReportTitle}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {t.model22ReportDesc}
          </p>
        </div>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="text-emerald-500" />
            {t.model22ReportTitle}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border-2 border-slate-900 dark:border-slate-700 min-w-max">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{t.itemNo}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{t.binCardRef}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{t.tagId}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{t.detailedDescription}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{t.serialNumberReport}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{t.uom}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right">{t.qtyReq}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right">{t.qtyIssued}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right">{t.unitPrice}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right">{t.totalPrice}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{t.lifeStatus}</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-sm font-bold text-slate-500">{row.itemNo}</td>
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-sm font-bold text-blue-600">{row.binCardRef}</td>
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-sm font-bold">
                    <span className="bg-slate-100 dark:bg-slate-800 rounded px-2 py-0.5">{row.tagId}</span>
                  </td>
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-sm font-black">{row.description}</td>
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-sm text-slate-500">{row.serialNumber}</td>
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-sm text-slate-500">{row.unit}</td>
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-sm font-bold text-slate-500 text-right">{row.qtyReq}</td>
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-sm font-black text-emerald-600 text-right">{row.qtyIssued}</td>
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 text-right">{formatCurrency(row.unitCost)}</td>
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-sm font-black text-slate-900 dark:text-white text-right">{formatCurrency(row.totalValue)}</td>
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-sm">
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold">{row.lifeStatus}</span>
                  </td>
                </tr>
              ))}
              {reportData.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-slate-400 font-bold border-2 border-slate-900 dark:border-slate-700">No issued items found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ReportM22
