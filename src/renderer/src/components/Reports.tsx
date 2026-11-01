import { FileText, TrendingDown, PieChart, Wallet } from 'lucide-react'
import { useStore, TRANSLATIONS } from '../store/useStore'
import { formatCurrency, calculateBookValue } from '../lib/finance'
import ExportDropdown from './ExportDropdown'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const Reports = () => {
  const { assets, maintenanceLogs, language } = useStore()
  const t = TRANSLATIONS[language]

  const totalOriginalCost = assets.reduce((acc, a) => acc + (a.unitCost * a.quantity), 0)
  const totalBookValue = assets.reduce((acc, a) => acc + calculateBookValue(a), 0)
  const totalDepreciation = totalOriginalCost - totalBookValue
  const totalMaintenanceCost = maintenanceLogs.reduce((acc, l) => acc + (l.cost || 0), 0)

  const reportCards = [
    {
      title: language === 'AM' ? 'የንብረት ጠቅላላ ዋጋ' : 'Original Asset Value',
      value: formatCurrency(totalOriginalCost),
      icon: Wallet,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      title: language === 'AM' ? 'የአሁኑ መጽሐፍ ዋጋ' : 'Current Book Value',
      value: formatCurrency(totalBookValue),
      icon: TrendingDown,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    },
    {
      title: language === 'AM' ? 'ጠቅላላ የጥገና ወጪ' : 'Total Maintenance Cost',
      value: formatCurrency(totalMaintenanceCost),
      icon: FileText,
      color: 'text-amber-600',
      bg: 'bg-amber-50'
    }
  ]

  const generatePDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(18); doc.setFont('helvetica', 'bold')
    doc.text('ASSET VALUATION & EXPENSE REPORT', 105, 20, { align: 'center' })
    doc.setFontSize(10); doc.setFont('helvetica', 'normal')
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 28, { align: 'center' })
    
    const tableData = assets.map((a, i) => {
      const bookVal = calculateBookValue(a)
      const depr = (a.unitCost * a.quantity) - bookVal
      const mCost = maintenanceLogs.filter(l => l.assetId === a.id).reduce((acc, curr) => acc + (curr.cost || 0), 0)
      return [
        i + 1, a.name, a.serialNumber || '—', a.quantity, 
        formatCurrency(a.unitCost * a.quantity), formatCurrency(bookVal), formatCurrency(depr), formatCurrency(mCost)
      ]
    })

    autoTable(doc, {
      startY: 40,
      head: [['#', 'Asset Name', 'Serial', 'Qty', 'Cost', 'Book Value', 'Depr.', 'Maint.']],
      body: tableData,
      theme: 'grid', headStyles: { fillColor: [30, 41, 59] }
    })
    doc.save('Asset_Financial_Report.pdf')
  }

  const exportData = assets.map(a => {
    const bookVal = calculateBookValue(a)
    const mCost = maintenanceLogs.filter(l => l.assetId === a.id).reduce((acc, curr) => acc + (curr.cost || 0), 0)
    return {
      'Asset Name': a.name,
      'Serial Number': a.serialNumber || 'N/A',
      'Category': a.category,
      'Purchase Date': a.purchaseDate || 'N/A',
      'Quantity': a.quantity,
      'Original Cost (ETB)': a.quantity * a.unitCost,
      'Book Value (ETB)': bookVal,
      'Accrued Depreciation (ETB)': (a.quantity * a.unitCost) - bookVal,
      'Total Maintenance Cost (ETB)': mCost,
      'Condition': a.condition,
      'Location': a.location
    }
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {t.reports}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Financial analytics, maintenance expenses, and asset depreciation.
          </p>
        </div>
        <ExportDropdown data={exportData} filename="Asset_Financial_Report" onExportPDF={generatePDF} />
      </header>

      {/* Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reportCards.map((card, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group hover:shadow-xl transition-all duration-500">
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 ${card.bg} rounded-full group-hover:scale-150 transition-transform duration-700 opacity-50`} />
            <div className="relative z-10 flex flex-col gap-4">
              <div className={`${card.bg} ${card.color} w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner group-hover:rotate-6 transition-transform`}>
                <card.icon size={28} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{card.title}</p>
                <h3 className={`text-3xl font-black ${card.color}`}>{card.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Financial Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="text-blue-500" />
            {language === 'AM' ? 'የንብረት የገንዘብ ዝርዝር ሪፖርት' : 'Asset Financial Detailed Report'}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border-2 border-slate-900 dark:border-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">Asset Name</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">Purchase Date</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right">Total Cost</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right">Maintenance</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right">Book Value</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => {
                const origCost = a.unitCost * a.quantity
                const bookVal = calculateBookValue(a)
                const mCost = maintenanceLogs.filter(l => l.assetId === a.id).reduce((acc, curr) => acc + (curr.cost || 0), 0)
                return (
                  <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                      <div className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm">{a.name}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">{a.serialNumber || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400">{a.purchaseDate ? new Date(a.purchaseDate).toLocaleDateString('en-GB') : '—'}</td>
                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-sm font-black text-slate-900 dark:text-white text-right">{formatCurrency(origCost)}</td>
                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-sm font-black text-amber-600 text-right">{formatCurrency(mCost)}</td>
                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-sm font-black text-emerald-600 text-right">{formatCurrency(bookVal)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Reports
