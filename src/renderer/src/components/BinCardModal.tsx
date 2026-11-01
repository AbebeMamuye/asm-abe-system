import React, { useEffect, useState } from 'react'
import { X, FileText, Download, TrendingUp, TrendingDown, Minus, Plus, Calendar, Tag, Package, Printer } from 'lucide-react'
import { Asset, useStore, Transaction, TRANSLATIONS } from '../store/useStore'
import { formatCurrency } from '../lib/finance'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface BinCardModalProps {
  asset: Asset
  onClose: () => void
}

interface BinCardEntry extends Transaction {
  balance: number
}

const BinCardModal = ({ asset, onClose }: BinCardModalProps) => {
  const { fetchTransactionsByAsset, language } = useStore()
  const t = TRANSLATIONS[language]
  const [entries, setEntries] = useState<BinCardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadTransactions = async () => {
      setIsLoading(true)
      const txs = await fetchTransactionsByAsset(asset.id!)
      
      // Calculate running balance
      let currentBalance = 0
      const calculatedEntries = txs.map(tx => {
        if (tx.type === 'RECEIVED') {
          currentBalance += tx.quantity
        } else {
          currentBalance -= tx.quantity
        }
        return { ...tx, balance: currentBalance }
      })
      
      setEntries(calculatedEntries.reverse()) // Show newest first for the table, but calculation was chronological
      setIsLoading(false)
    }
    loadTransactions()
  }, [asset.id, fetchTransactionsByAsset])

  const generatePDF = () => {
    const doc = new jsPDF()
    const title = language === 'AM' ? 'የቢን ካርድ (Bin Card)' : 'BIN CARD (LEDGER)'
    
    doc.setFontSize(20)
    doc.setTextColor(30, 41, 59)
    doc.text(title, 105, 20, { align: 'center' })
    
    doc.setFontSize(10)
    doc.text(`Asset: ${asset.name}`, 20, 35)
    doc.text(`Category: ${asset.category}`, 20, 40)
    doc.text(`Serial No: ${asset.serialNumber || 'N/A'}`, 20, 45)
    doc.text(`Current Stock: ${asset.quantity} ${asset.unit}`, 20, 50)
    doc.text(`Printed: ${new Date().toLocaleString()}`, 140, 35)

    const tableData = [...entries].reverse().map((entry, index) => [
      index + 1,
      new Date(entry.createdAt!).toLocaleDateString(),
      entry.voucherRef || '—',
      entry.type,
      entry.type === 'RECEIVED' ? entry.quantity : '',
      entry.type !== 'RECEIVED' ? entry.quantity : '',
      entry.balance
    ])

    autoTable(doc, {
      startY: 60,
      head: [[
        '#', 
        language === 'AM' ? 'ቀን' : 'Date', 
        language === 'AM' ? 'የደረሰኝ ቁጥር' : 'Voucher Ref', 
        language === 'AM' ? 'ዓይነት' : 'Type', 
        language === 'AM' ? 'ገቢ' : 'Received (+)', 
        language === 'AM' ? 'ወጪ' : 'Issued (-)', 
        language === 'AM' ? 'ቀሪ' : 'Balance'
      ]],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        4: { halign: 'right', textColor: [5, 150, 105] },
        5: { halign: 'right', textColor: [220, 38, 38] },
        6: { halign: 'right', fontStyle: 'bold' }
      }
    })

    doc.save(`BinCard_${asset.name.replace(/\s+/g, '_')}.pdf`)
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-6xl rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <header className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-5">
            <div className="bg-amber-500 p-3 rounded-2xl shadow-lg shadow-amber-500/20 text-slate-900">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">
                {language === 'AM' ? 'የቢን ካርድ' : 'Bin Card Ledger'}
              </h2>
              <div className="flex items-center gap-2 mt-0.5 text-amber-200 text-[10px] font-black uppercase tracking-widest">
                <Package size={10} /> {asset.name} &bull; <Tag size={10} /> {asset.serialNumber || 'N/A'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={generatePDF}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
            >
              <Printer size={16} />
              <span>{language === 'AM' ? 'አትም' : 'Print PDF'}</span>
            </button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors text-white">
              <X size={24} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col p-8">
          {/* Asset Summary Mini Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Asset Name</p>
              <h4 className="text-lg font-black text-slate-900 dark:text-white truncate">{asset.name}</h4>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Initial Stock</p>
              <h4 className="text-lg font-black text-slate-900 dark:text-white">
                {entries.length > 0 ? [...entries].reverse()[0].balance - ([...entries].reverse()[0].type === 'RECEIVED' ? [...entries].reverse()[0].quantity : -[...entries].reverse()[0].quantity) : 0}
              </h4>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Transactions</p>
              <h4 className="text-lg font-black text-slate-900 dark:text-white">{entries.length}</h4>
            </div>
            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30">
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Current Balance</p>
              <h4 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{asset.quantity} <span className="text-xs">{asset.unit}</span></h4>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="flex-1 border-2 border-slate-900 dark:border-slate-700 rounded-2xl overflow-hidden flex flex-col bg-white dark:bg-slate-900 shadow-xl">
            <div className="overflow-y-auto custom-scrollbar flex-1">
              <table className="w-full text-left border-collapse border-2 border-slate-900 dark:border-slate-700">
                <thead className="sticky top-0 z-10 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest border-b-2 border-slate-900 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">Date</th>
                    <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">Voucher Ref</th>
                    <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-center">Type</th>
                    <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right">In (+)</th>
                    <th className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right">Out (-)</th>
                    <th className="px-6 py-4 text-right bg-slate-800 border-2 border-slate-900 dark:border-slate-700">Running Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center border-2 border-slate-900 dark:border-slate-700">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-900 border-t-transparent dark:border-white"></div>
                        <p className="mt-4 text-sm font-bold text-slate-500">Loading bin card data...</p>
                      </td>
                    </tr>
                  ) : entries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic font-medium border-2 border-slate-900 dark:border-slate-700">
                        No transaction history found for this asset.
                      </td>
                    </tr>
                  ) : (
                    entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                            <Calendar size={12} className="text-slate-400" />
                            {new Date(entry.createdAt!).toLocaleDateString()}
                            <span className="text-[10px] text-slate-400 font-medium ml-1">
                              {new Date(entry.createdAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700">
                          <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            {entry.voucherRef || 'INTERNAL'}
                          </span>
                        </td>
                        <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                            entry.type === 'RECEIVED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {entry.type === 'RECEIVED' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                            {entry.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right font-bold text-emerald-600">
                          {entry.type === 'RECEIVED' ? `+${entry.quantity}` : '—'}
                        </td>
                        <td className="px-6 py-4 border-2 border-slate-900 dark:border-slate-700 text-right font-bold text-rose-600">
                          {entry.type !== 'RECEIVED' ? `-${entry.quantity}` : '—'}
                        </td>
                        <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-800/20 border-2 border-slate-900 dark:border-slate-700">
                          {entry.balance}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Footer Summary */}
            <div className="bg-slate-900 text-white px-8 py-4 flex items-center justify-between border-t border-slate-800">
              <div className="flex items-center gap-8">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Ledger Unit</span>
                  <span className="text-sm font-bold">{asset.unit}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Total Inbound</span>
                  <span className="text-sm font-bold text-emerald-400">
                    {entries.reduce((acc, curr) => curr.type === 'RECEIVED' ? acc + curr.quantity : acc, 0)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Total Outbound</span>
                  <span className="text-sm font-bold text-rose-400">
                    {entries.reduce((acc, curr) => curr.type !== 'RECEIVED' ? acc + curr.quantity : acc, 0)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Closing Balance</span>
                <div className="text-xl font-black text-amber-400">{asset.quantity} {asset.unit}</div>
              </div>
            </div>
          </div>
        </div>

        <footer className="p-8 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/20">
          <p className="text-[10px] font-bold text-slate-400 italic">
            * This bin card is automatically generated from the transaction audit logs.
          </p>
          <button 
            onClick={onClose} 
            className="py-3 px-10 rounded-2xl bg-slate-900 text-white font-black hover:bg-slate-800 transition-all text-xs uppercase tracking-widest shadow-lg shadow-slate-900/20"
          >
            Close Ledger
          </button>
        </footer>
      </div>
    </div>
  )
}

export default BinCardModal
