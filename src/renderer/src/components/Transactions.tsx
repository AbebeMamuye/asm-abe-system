import { useState, useMemo } from 'react'
import { History, ArrowUpRight, ArrowDownLeft, Clock, ShieldAlert, Filter, Calendar, FileText, Download, TrendingUp, TrendingDown, Package } from 'lucide-react'
import { useStore, TRANSLATIONS, Transaction } from '../store/useStore'
import { toEthiopianDate } from '../lib/ethiopianCalendar'
import EthiopianDatePicker from './EthiopianDatePicker'
import ExportDropdown from './ExportDropdown'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const Transactions = () => {
  const { transactions, language, orgName } = useStore()
  const t = TRANSLATIONS[language]
  
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [filterType, setFilterType] = useState<string>('ALL')
  const [searchAsset, setSearchAsset] = useState('')

  // Filtering Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const txDate = tx.createdAt ? tx.createdAt.split(' ')[0] : '' // YYYY-MM-DD
      const matchesDate = (!startDate || txDate >= startDate) && (!endDate || txDate <= endDate)
      const matchesType = filterType === 'ALL' || tx.type === filterType
      const matchesAsset = tx.assetName.toLowerCase().includes(searchAsset.toLowerCase())
      return matchesDate && matchesType && matchesAsset
    })
  }, [transactions, startDate, endDate, filterType, searchAsset])

  // Statistics
  const stats = useMemo(() => {
    const inbound = filteredTransactions.filter(t => t.type === 'RECEIVED').reduce((acc, curr) => acc + curr.quantity, 0)
    const outbound = filteredTransactions.filter(t => t.type !== 'RECEIVED').reduce((acc, curr) => acc + curr.quantity, 0)
    return { inbound, outbound, net: inbound - outbound, count: filteredTransactions.length }
  }, [filteredTransactions])

  const generatePDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4') // Landscape for detailed report
    const title = language === 'AM' ? 'የንብረት ዝውውር ዝርዝር ሪፖርት' : 'DETAILED ASSET MOVEMENT REPORT'
    
    doc.setFontSize(20)
    doc.setTextColor(15, 23, 42)
    doc.text(orgName.toUpperCase(), 148, 15, { align: 'center' })
    
    doc.setFontSize(14)
    doc.text(title, 148, 25, { align: 'center' })

    doc.setFontSize(9)
    doc.setTextColor(100)
    const dateRangeStr = (startDate || 'N/A') + ' to ' + (endDate || 'N/A')
    doc.text(`Period: ${dateRangeStr}`, 14, 35)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 240, 35)

    const tableData = filteredTransactions.map((t, i) => [
      i + 1,
      new Date(t.createdAt!).toLocaleDateString() + ` (${toEthiopianDate(t.createdAt!)})`,
      t.voucherRef || 'N/A',
      t.assetName,
      t.type,
      t.type === 'RECEIVED' ? t.quantity : '',
      t.type !== 'RECEIVED' ? t.quantity : '',
      t.note || '—'
    ])

    autoTable(doc, {
      startY: 40,
      head: [[
        '#', 
        language === 'AM' ? 'ቀን (GC/EC)' : 'Date (GC/EC)', 
        language === 'AM' ? 'የደረሰኝ ቁጥር' : 'Voucher Ref', 
        language === 'AM' ? 'ንብረት' : 'Asset Description', 
        language === 'AM' ? 'ዓይነት' : 'Type', 
        language === 'AM' ? 'ገቢ' : 'In (+)', 
        language === 'AM' ? 'ወጪ' : 'Out (-)', 
        language === 'AM' ? 'ማስታወሻ' : 'Remarks/Note'
      ]],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: {
        5: { halign: 'right', textColor: [5, 150, 105] },
        6: { halign: 'right', textColor: [220, 38, 38] }
      }
    })

    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('REPORT SUMMARY', 14, finalY)
    doc.setFont('helvetica', 'normal')
    doc.text(`Total Inbound: ${stats.inbound}`, 14, finalY + 7)
    doc.text(`Total Outbound: ${stats.outbound}`, 14, finalY + 12)
    doc.text(`Net Movement: ${stats.net}`, 14, finalY + 17)

    doc.text('Verified By: __________________________', 200, finalY + 7)
    doc.text('Asset Custodian Signature: ____________', 200, finalY + 17)

    doc.save(`Asset_Movement_Report_${new Date().getTime()}.pdf`)
  }

  const exportCSV = filteredTransactions.map(t => ({
    'Date (GC)': t.createdAt,
    'Date (EC)': toEthiopianDate(t.createdAt!),
    'Voucher Ref': t.voucherRef,
    'Asset Name': t.assetName,
    'Transaction Type': t.type,
    'Quantity': t.quantity,
    'Note': t.note
  }))

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase underline decoration-amber-500 decoration-4 underline-offset-8">
            {language === 'AM' ? 'የንብረት ዝውውር ዝርዝር ሪፖርት' : 'Asset Movement Report'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-3">Professional audit trail and transaction movement ledger.</p>
        </div>
        <div className="flex gap-2">
           <ExportDropdown data={exportCSV} filename="Movement_Report" onExportPDF={generatePDF} />
        </div>
      </header>

      {/* Professional Filters Section */}
      <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl border border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <EthiopianDatePicker 
            label={language === 'AM' ? 'ከቀን (Start Date)' : 'Start Date'} 
            value={startDate} 
            onChange={setStartDate} 
            isDark={true}
          />
          <EthiopianDatePicker 
            label={language === 'AM' ? 'እስከ ቀን (End Date)' : 'End Date'} 
            value={endDate} 
            onChange={setEndDate} 
            isDark={true}
          />
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
              <Filter size={10} /> {language === 'AM' ? 'ዓይነት' : 'Filter Type'}
            </label>
            <select 
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="ALL">All Movements</option>
              <option value="RECEIVED">Inbound Only (+)</option>
              <option value="REQUISITION">Requisitions Only (-)</option>
              <option value="ISSUED">Issues Only (-)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
              <Package size={10} /> {language === 'AM' ? 'የንብረት ስም' : 'Search Asset'}
            </label>
            <input 
              type="text"
              placeholder="Search property..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500"
              value={searchAsset}
              onChange={(e) => setSearchAsset(e.target.value)}
            />
          </div>
        </div>
        
        {/* Reset Filters */}
        {(startDate || endDate || filterType !== 'ALL' || searchAsset) && (
          <button 
            onClick={() => {setStartDate(''); setEndDate(''); setFilterType('ALL'); setSearchAsset('')}}
            className="mt-4 text-[10px] font-black text-amber-500 uppercase hover:text-amber-400 transition-colors underline"
          >
            Clear All Filters
          </button>
        )}
      </div>

      {/* Summary Mini Dash */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Records</p>
          <h4 className="text-2xl font-black text-slate-900 dark:text-white">{stats.count}</h4>
        </div>
        <div className="p-5 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/20 shadow-sm">
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Total Inbound</p>
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-emerald-500" />
            <h4 className="text-2xl font-black text-emerald-600">{stats.inbound}</h4>
          </div>
        </div>
        <div className="p-5 bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/20 shadow-sm">
          <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Total Outbound</p>
          <div className="flex items-center gap-2">
            <TrendingDown size={20} className="text-rose-500" />
            <h4 className="text-2xl font-black text-rose-600">{stats.outbound}</h4>
          </div>
        </div>
        <div className="p-5 bg-slate-900 dark:bg-black rounded-2xl shadow-xl shadow-slate-900/20 border border-slate-800">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Net Stock Change</p>
          <h4 className={`text-2xl font-black ${stats.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {stats.net > 0 ? '+' : ''}{stats.net}
          </h4>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border-2 border-slate-900 dark:border-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">Movement Time (GC / EC)</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">Reference No.</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">Property Description</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-center">Inbound</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-center">Outbound</th>
                <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all group">
                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${t.type === 'RECEIVED' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                          <Clock size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 dark:text-white">
                            {new Date(t.createdAt!).toLocaleDateString()}
                          </p>
                          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-tight">
                            EC: {toEthiopianDate(t.createdAt!)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                       <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                         {t.voucherRef || 'INTERNAL'}
                       </span>
                    </td>
                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                      <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{t.assetName}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{t.type} TRANSACTION</p>
                    </td>
                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-center">
                      {t.type === 'RECEIVED' ? (
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-black text-emerald-600">+{t.quantity}</span>
                          <ArrowDownLeft size={12} className="text-emerald-400" />
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-center">
                      {t.type !== 'RECEIVED' ? (
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-black text-rose-600">-{t.quantity}</span>
                          <ArrowUpRight size={12} className="text-rose-400" />
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-xs font-medium text-slate-500 italic max-w-xs truncate">
                      {t.note || 'No additional remarks'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-32 text-center border-2 border-slate-900 dark:border-slate-700">
                    <div className="bg-slate-50 dark:bg-slate-800/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <History size={32} className="text-slate-300 dark:text-slate-700" />
                    </div>
                    <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">No records found for selected period</p>
                    <p className="text-xs text-slate-400 mt-2 italic">Try adjusting your date range or filters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Transactions
