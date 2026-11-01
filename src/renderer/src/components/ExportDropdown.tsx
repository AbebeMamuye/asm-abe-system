import { useState, useRef, useEffect } from 'react'
import { Download, ChevronDown, FileText, FileSpreadsheet, FileJson } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useStore } from '../store/useStore'

interface ExportDropdownProps {
  data: any[]
  filename: string
  onExportPDF?: () => void
}

/**
 * Universal browser-native file downloader (works on Chrome, Edge, Safari, Firefox without file-saver quirks)
 */
function downloadFile(blob: Blob, filename: string) {
  try {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    setTimeout(() => {
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    }, 500)
  } catch (err) {
    console.error('Download error:', err)
  }
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
    try {
      if (!data || data.length === 0) {
        alert(language === 'AM' ? 'የሚወጣ መረጃ የለም (ዝርዝሩ ባዶ ነው)!' : 'No data available to export in this list!')
        setIsOpen(false)
        return
      }
      const headers = Object.keys(data[0]).join(',')
      const rows = data.map(obj => Object.values(obj).map(v => {
        const val = v === null || v === undefined ? '' : v
        return `"${val.toString().replace(/"/g, '""')}"`
      }).join(',')).join('\n')
      const csvContent = '\uFEFF' + `${headers}\n${rows}` // UTF-8 BOM for Excel Ethiopian text support
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
      downloadFile(blob, `${filename}.csv`)
    } catch (err) {
      console.error('CSV Export Error:', err)
      alert(language === 'AM' ? 'CSV ማመንጨት አልተሳካም!' : 'Failed to export CSV!')
    } finally {
      setIsOpen(false)
    }
  }

  const exportToExcel = () => {
    try {
      if (!data || data.length === 0) {
        alert(language === 'AM' ? 'የሚወጣ መረጃ የለም (ዝርዝሩ ባዶ ነው)!' : 'No data available to export in this list!')
        setIsOpen(false)
        return
      }
      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
      const dataBlob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
      })
      downloadFile(dataBlob, `${filename}.xlsx`)
    } catch (err) {
      console.error('Excel Export Error:', err)
      alert(language === 'AM' ? 'Excel ማመንጨት አልተሳካም!' : 'Failed to export Excel!')
    } finally {
      setIsOpen(false)
    }
  }

  const handlePDF = () => {
    try {
      if (onExportPDF) {
        onExportPDF()
      }
    } catch (err) {
      console.error('PDF Export Error:', err)
      alert(language === 'AM' ? 'PDF ማመንጨት አልተሳካም!' : 'Failed to export PDF!')
    } finally {
      setIsOpen(false)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black shadow-xl hover:bg-slate-800 transition-all active:scale-95 text-[10px] uppercase tracking-widest cursor-pointer"
        title={language === 'AM' ? 'ሪፖርት ወደ Excel፣ CSV ወይም PDF ያውርዱ' : 'Export list to Excel, CSV or PDF'}
      >
        <Download size={14} />
        <span>{language === 'AM' ? 'ሪፖርት አውጣ' : 'Export'}</span>
        <ChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 p-1">
          <button
            type="button"
            onClick={exportToExcel}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors uppercase tracking-tight text-left cursor-pointer"
          >
            <FileSpreadsheet size={18} className="text-emerald-500 shrink-0" />
            <span>Excel (.xlsx)</span>
          </button>
          <button
            type="button"
            onClick={exportToCSV}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors uppercase tracking-tight text-left cursor-pointer"
          >
            <FileJson size={18} className="text-blue-500 shrink-0" />
            <span>CSV (.csv)</span>
          </button>
          {onExportPDF && (
            <button
              type="button"
              onClick={handlePDF}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border-t border-slate-100 dark:border-slate-800 uppercase tracking-tight text-left cursor-pointer mt-1"
            >
              <FileText size={18} className="text-rose-500 shrink-0" />
              <span>PDF Document</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default ExportDropdown
