'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Calendar, 
  FileDown, 
  FileSpreadsheet, 
  Filter, 
  Loader2,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  ChevronRight,
  FileText,
  Printer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { generateModel19, generateModel20 } from '@/lib/vouchers';

export default function ReportsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [startDate, setStartDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [category, setCategory] = useState('All');
  const [type, setType] = useState('All');
  const [condition, setCondition] = useState('All');

  const categories = ['All', 'Stationery', 'Cleaning', 'Electronics', 'Medical'];

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        category,
        type,
        condition
      });
      const res = await fetch(`/api/reports?${params.toString()}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (err) {
      console.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [startDate, endDate, category, type, condition]);

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('Inventory Usage Report', 14, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Asset Management System`, 14, 30);
    doc.text(`Generated on: ${format(new Date(), 'PPP')}`, 14, 38);
    doc.text(`Period: ${startDate} to ${endDate}`, 14, 46);

    const tableData = data.map(trx => [
      format(new Date(trx.date), 'yyyy-MM-dd HH:mm'),
      trx.item?.name || 'N/A',
      trx.item?.category || 'N/A',
      trx.type === 'IN' ? 'Stock-In' : 'Stock-Out',
      `${trx.quantity} ${trx.item?.unit || ''}`,
      trx.type === 'IN' ? (trx.supplier || '-') : (trx.department || '-')
    ]);

    autoTable(doc, {
      startY: 55,
      head: [['Date', 'Item Name', 'Category', 'Type', 'Qty', 'Source/Dest']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    doc.save(`inventory_report_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  const exportToExcel = () => {
    const worksheetData = data.map(trx => ({
      'Date': format(new Date(trx.date), 'yyyy-MM-dd HH:mm'),
      'Item Name': trx.item?.name,
      'Category': trx.item?.category,
      'Type': trx.type === 'IN' ? 'Stock-In' : 'Stock-Out',
      'Quantity': trx.quantity,
      'Unit': trx.item?.unit,
      'Source/Destination': trx.type === 'IN' ? trx.supplier : trx.department
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
    XLSX.writeFile(workbook, `inventory_report_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Reports</h1>
          <p className="text-slate-600 text-sm mt-1">Filter transactions and export PDF or Excel.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={exportToExcel}
            disabled={loading || data.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-emerald-700 hover:bg-emerald-50 transition-all shadow-sm disabled:opacity-50"
          >
            <FileSpreadsheet size={18} />
            <span>Export Excel</span>
          </button>
          <button 
            onClick={exportToPDF}
            disabled={loading || data.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-md disabled:opacity-50"
          >
            <FileDown size={18} />
            <span>Generate PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Matrix */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-2 text-slate-900 font-bold mb-2">
          <Filter size={18} className="text-blue-500" />
          <span>Report Filters</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Start Date</label>
            <div className="relative">
              <input 
                type="date" 
                className="w-full h-11 pl-4 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">End Date</label>
            <div className="relative">
              <input 
                type="date" 
                className="w-full h-11 pl-4 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Category</label>
            <select 
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Transaction Type</label>
            <select 
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="All">All Transactions</option>
              <option value="IN">Stock-In Only</option>
              <option value="OUT">Stock-Out Only</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Asset Condition</label>
            <select 
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
            >
              <option value="All">Any Condition</option>
              <option value="FUNCTIONAL">Functional Only</option>
              <option value="UNDER_MAINTENANCE">Maintenance Only</option>
              <option value="NON_FUNCTIONAL">Broken / Urgent Repair</option>
            </select>
          </div>
        </div>
      </div>

      {/* Report Results Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Timestamp</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Item Detail</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Action</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Quantity</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Source/Dept</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Certificate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="animate-spin text-blue-500" size={32} />
                      <p className="text-slate-500 text-sm">Loading…</p>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="text-slate-200" size={48} />
                      <p className="text-slate-400 font-medium">No transactions found for the selected filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((trx) => (
                  <tr key={trx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-900">{format(new Date(trx.date), 'MMM dd, yyyy')}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{format(new Date(trx.date), 'HH:mm:ss')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-900">{trx.item?.name}</div>
                      <div className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded inline-block font-black uppercase mt-1">{trx.item?.category}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={cn(
                        "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase w-fit",
                        trx.type === 'IN' ? "bg-emerald-100 text-emerald-700" : "bg-purple-100 text-purple-700"
                      )}>
                        {trx.type === 'IN' ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                        {trx.type === 'IN' ? 'Stock-In' : 'Stock-Out'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-slate-900">{trx.quantity}</span>
                      <span className="text-[10px] text-slate-400 ml-1 font-bold uppercase">{trx.item?.unit}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-300" />
                        <span className="text-sm font-bold text-slate-700">{trx.type === 'IN' ? (trx.supplier || 'Private Supplier') : (trx.department || 'General Ward')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => trx.type === 'IN' ? generateModel19(trx) : generateModel20(trx)}
                        className={cn(
                          "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border",
                          trx.type === 'IN' ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100" : "bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100"
                        )}
                      >
                        <Printer size={14} />
                        {trx.type === 'IN' ? 'Model 19' : 'Model 20'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
