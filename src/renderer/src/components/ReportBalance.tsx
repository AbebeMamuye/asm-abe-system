import { useStore, TRANSLATIONS } from '../store/useStore'
import { FileText, Search } from 'lucide-react'
import { formatCurrency } from '../lib/finance'
import { useState, useMemo } from 'react'

const ReportBalance = () => {
  const { transactions, assets, language } = useStore()
  const t = TRANSLATIONS[language]
  const [searchTerm, setSearchTerm] = useState('')

  // Calculate Ledger logic
  const ledgerData = useMemo(() => {
    // 1. Group transactions by asset
    const byAsset = transactions.reduce((acc, tx) => {
      if (!acc[tx.assetId]) acc[tx.assetId] = []
      acc[tx.assetId].push(tx)
      return acc
    }, {} as Record<number, typeof transactions>)

    const rows: any[] = []

    // 2. Compute balances sequentially
    Object.keys(byAsset).forEach(assetIdStr => {
      const assetId = parseInt(assetIdStr)
      const asset = assets.find(a => a.id === assetId) || { unitCost: 0 } as any
      
      const txs = byAsset[assetId].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      
      let runningBalance = 0

      txs.forEach(tx => {
        const isReceived = tx.type === 'RECEIVED'
        const isIssued = tx.type === 'ISSUED' || tx.type === 'REQUISITION'

        const qtyReceived = isReceived ? tx.quantity : 0
        const qtyIssued = isIssued ? tx.quantity : 0
        
        const begBalance = runningBalance
        runningBalance = runningBalance + qtyReceived - qtyIssued

        rows.push({
          id: tx.id,
          assetName: tx.assetName,
          date: new Date(tx.createdAt).toLocaleDateString(),
          reference: tx.voucherRef || 'N/A',
          description: tx.note || tx.type,
          begBalance,
          qtyReceived,
          qtyIssued,
          endBalance: runningBalance,
          unitCost: asset.unitCost,
          totalValue: runningBalance * asset.unitCost,
          remarks: tx.type
        })
      })
    })

    // Sort all rows by date descending for view
    return rows.sort((a, b) => b.id - a.id)
  }, [transactions, assets])

  const filteredData = ledgerData.filter(row => 
    row.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.reference.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {t.balanceReportTitle}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {t.balanceReportDesc}
          </p>
        </div>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="text-purple-500" />
            {t.balanceReportTitle}
          </h3>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder={t.search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all dark:text-white"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border-2 border-slate-900 dark:border-slate-700 min-w-max">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{t.date}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">Asset Name</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{t.refDocNo}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{t.descriptionSource}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right">{t.begBalance}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right text-blue-600">Qty Received (M19)</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right text-amber-600">Qty Issued (M22)</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right text-emerald-600">{t.endBalance}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right">{t.unitPrice}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right">{t.totalInvValue}</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">{t.remarks}</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-xs font-bold text-slate-500">{row.date}</td>
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-sm font-black text-slate-800 dark:text-slate-200">{row.assetName}</td>
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-sm font-bold">
                    <span className="bg-slate-100 dark:bg-slate-800 rounded px-2 py-0.5">{row.reference}</span>
                  </td>
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400">{row.description}</td>
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-sm font-bold text-slate-500 text-right">{row.begBalance}</td>
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-sm font-black text-blue-600 text-right">{row.qtyReceived > 0 ? `+${row.qtyReceived}` : '-'}</td>
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-sm font-black text-amber-600 text-right">{row.qtyIssued > 0 ? `-${row.qtyIssued}` : '-'}</td>
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-sm font-black text-emerald-600 text-right bg-emerald-50/50 dark:bg-emerald-900/10">{row.endBalance}</td>
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 text-right">{formatCurrency(row.unitCost)}</td>
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-sm font-black text-slate-900 dark:text-white text-right">{formatCurrency(row.totalValue)}</td>
                  <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-xs text-slate-500">{row.remarks}</td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-slate-400 font-bold border-2 border-slate-900 dark:border-slate-700">No ledger records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ReportBalance
