import { useState, useRef, useEffect } from 'react'
import { Download, ChevronDown, FileText, FileSpreadsheet, FileJson } from 'lucide-react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { useStore } from '../store/useStore'

interface ExportDropdownProps {
  data: any[]
  filename: string
  onExportPDF?: () => void
}

const ExportDropdown = ({ data, filename, onExportPDF }: ExportDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { language } = useStore()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const exportToCSV = () => {
    if (data.length === 0) return
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(obj => Object.values(obj).map(v => {
      const val = v === null || v === undefined ? '' : v
      return `"${val.toString().replace(/"/g, '""')}"`
    }).join(',')).join('\n')
    const csvContent = `${headers}\n${rows}`
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    saveAs(blob, `${filename}.csv`)
    setIsOpen(false)
  }

  const exportToExcel = () => {
    if (data.length === 0) return
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data")
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' })
    saveAs(dataBlob, `${filename}.xlsx`)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black shadow-xl hover:bg-slate-800 transition-all active:scale-95 text-[10px] uppercase tracking-widest"
      >
        <Download size={14} />
        <span>{language === 'AM' ? 'ሪፖርት አውጣ' : 'Export'}</span>
        <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2">
          <button
            onClick={exportToExcel}
            className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors uppercase tracking-tight"
          >
            <FileSpreadsheet size={18} className="text-emerald-500" />
            Excel (.xlsx)
          </button>
          <button
            onClick={exportToCSV}
            className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors uppercase tracking-tight"
          >
            <FileJson size={18} className="text-blue-500" />
            CSV (.csv)
          </button>
          {onExportPDF && (
            <button
              onClick={() => { onExportPDF(); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-t border-slate-100 dark:border-slate-800 uppercase tracking-tight"
            >
              <FileText size={18} className="text-rose-500" />
              PDF Document
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default ExportDropdown
