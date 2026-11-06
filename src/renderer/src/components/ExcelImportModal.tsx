import React, { useState, useRef } from 'react'
import { X, FileSpreadsheet, Download, Upload, AlertCircle, CheckCircle2, RefreshCw, FileUp } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useStore, Asset, TRANSLATIONS } from '../store/useStore'

interface ExcelImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface ParsedAssetRow extends Partial<Asset> {
  _rowNumber: number
  _isValid: boolean
  _errors: string[]
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { language } = useStore()
  const t = TRANSLATIONS[language]

  const [file, setFile] = useState<File | null>(null)
  const [parsedRows, setParsedRows] = useState<ParsedAssetRow[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [importSummary, setImportSummary] = useState<{ total: number; valid: number; invalid: number } | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  // ── Download Sample Excel Template ────────────────────────────
  const downloadTemplate = () => {
    const templateData = [
      {
        'Asset Name*': 'Dell Latitude 5420 Laptop',
        'Category*': 'Electronics',
        'Fund Source*': 'Budget',
        'Quantity*': 1,
        'Unit Cost*': 45000,
        'Unit*': 'Pcs',
        'Location*': 'Main Store / Shelf B-2',
        'Condition*': 'Functional',
        'Serial Number': 'DELL-LT-99214',
        'Supplier': 'Alsam Trading PLC',
        'Purchase Date (YYYY-MM-DD)': '2024-09-15',
        'Useful Life (Years)': 5,
        'Salvage Value (ETB)': 2000,
        'Tag Number': 'ETH-AMS-00101',
        'Custodian': '',
        'Department': 'Central Store'
      },
      {
        'Asset Name*': 'Executive High-Back Swivel Chair',
        'Category*': 'Furniture',
        'Fund Source*': 'Internal Revenue',
        'Quantity*': 4,
        'Unit Cost*': 18500,
        'Unit*': 'Pcs',
        'Location*': 'Admin Block Office 204',
        'Condition*': 'Functional',
        'Serial Number': 'CHAIR-HEX-04',
        'Supplier': 'Tikur Abbay Furniture',
        'Purchase Date (YYYY-MM-DD)': '2024-10-01',
        'Useful Life (Years)': 7,
        'Salvage Value (ETB)': 500,
        'Tag Number': 'ETH-AMS-00102',
        'Custodian': 'Abebe Bikila',
        'Department': 'Administration'
      },
      {
        'Asset Name*': 'HP LaserJet Pro M404dn Printer',
        'Category*': 'Electronics',
        'Fund Source*': 'Donor/Grant',
        'Quantity*': 2,
        'Unit Cost*': 32000,
        'Unit*': 'Pcs',
        'Location*': 'Finance Department',
        'Condition*': 'Functional',
        'Serial Number': 'HP-PRNT-8812',
        'Supplier': 'Jupiter Computers',
        'Purchase Date (YYYY-MM-DD)': '2024-11-05',
        'Useful Life (Years)': 5,
        'Salvage Value (ETB)': 1000,
        'Tag Number': 'ETH-AMS-00103',
        'Custodian': '',
        'Department': 'Finance'
      }
    ]

    const worksheet = XLSX.utils.json_to_sheet(templateData)
    // Set auto column widths
    const colWidths = [
      { wch: 32 }, { wch: 15 }, { wch: 16 }, { wch: 10 }, { wch: 14 },
      { wch: 8 }, { wch: 22 }, { wch: 14 }, { wch: 18 }, { wch: 22 },
      { wch: 24 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 18 }, { wch: 18 }
    ]
    worksheet['!cols'] = colWidths

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Asset_Import_Template')
    XLSX.writeFile(workbook, 'AMIS_Asset_Import_Template.xlsx')
  }

  // ── Parse Uploaded File ────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    setFile(selected)
    setErrorMessage(null)
    setIsProcessing(true)

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result
        const workbook = XLSX.read(buffer, { type: 'binary', cellDates: true })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const rawJson: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })

        if (!rawJson || rawJson.length === 0) {
          setErrorMessage(language === 'AM' ? 'የተመረጠው ኤክሴል ፋይል ባዶ ነው!' : 'The selected Excel file is empty!')
          setIsProcessing(false)
          return
        }

        const validCategories = ['Electronics', 'Furniture', 'Vehicles', 'Machinery', 'Appliances', 'Stationery', 'Construction', 'Cleaning', 'Others']
        const validFunds = ['Budget', 'Internal Revenue', 'Donor/Grant', 'Special Fund', 'Others']
        const validConditions = ['Functional', 'Under Maintenance', 'Non-functional', 'Disposed']

        const parsed: ParsedAssetRow[] = rawJson.map((row, index) => {
          const errors: string[] = []

          // Extract values supporting both with/without asterisk
          const name = (row['Asset Name*'] || row['Asset Name'] || row['Name'] || row['የንብረት ስም'] || '').toString().trim()
          let category = (row['Category*'] || row['Category'] || row['ምድብ'] || 'Electronics').toString().trim()
          let fundSource = (row['Fund Source*'] || row['Fund Source'] || row['የበጀት ምንጭ'] || 'Budget').toString().trim()
          const quantity = parseInt(row['Quantity*'] || row['Quantity'] || row['ብዛት'] || '1', 10)
          const unitCost = parseFloat(row['Unit Cost*'] || row['Unit Cost'] || row['የአንዱ ዋጋ'] || '0')
          const unit = (row['Unit*'] || row['Unit'] || row['መለኪያ'] || 'Pcs').toString().trim()
          const location = (row['Location*'] || row['Location'] || row['ቦታ'] || 'Central Store').toString().trim()
          let condition = (row['Condition*'] || row['Condition'] || row['ሁኔታ'] || 'Functional').toString().trim()

          const serialNumber = (row['Serial Number'] || row['Serial'] || row['ሴሪያል'] || '').toString().trim()
          const supplier = (row['Supplier'] || row['አቅራቢ'] || '').toString().trim()
          let purchaseDate = row['Purchase Date (YYYY-MM-DD)'] || row['Purchase Date'] || row['የተገዛበት ቀን'] || ''
          if (purchaseDate instanceof Date) {
            purchaseDate = purchaseDate.toISOString().split('T')[0]
          } else {
            purchaseDate = String(purchaseDate).trim()
          }

          const usefulLife = parseInt(row['Useful Life (Years)'] || row['Useful Life'] || '5', 10) || 5
          const salvageValue = parseFloat(row['Salvage Value (ETB)'] || row['Salvage Value'] || '0') || 0
          const tagNumber = (row['Tag Number'] || row['Tag'] || row['ታግ ቁጥር'] || '').toString().trim()
          const custodian = (row['Custodian'] || row['ተጠቃሚ'] || '').toString().trim()
          const department = (row['Department'] || row['መምሪያ'] || 'Central Store').toString().trim()

          // Validation rules
          if (!name) errors.push(language === 'AM' ? 'የንብረት ስም ያስፈልጋል' : 'Asset name required')
          if (isNaN(quantity) || quantity <= 0) errors.push(language === 'AM' ? 'ብዛት ከ 0 መብለጥ አለበት' : 'Quantity must be > 0')
          if (isNaN(unitCost) || unitCost < 0) errors.push(language === 'AM' ? 'ዋጋ ትክክል አይደለም' : 'Invalid unit cost')

          // Normalize category
          if (!validCategories.includes(category)) category = 'Others'
          if (!validFunds.includes(fundSource)) fundSource = 'Budget'
          if (!validConditions.includes(condition)) condition = 'Functional'

          return {
            _rowNumber: index + 2, // Excel 1-based + header
            _isValid: errors.length === 0,
            _errors: errors,
            name,
            category: category as any,
            fundSource: fundSource as any,
            quantity,
            unitCost,
            unit,
            location,
            condition: condition as any,
            serialNumber,
            supplier,
            purchaseDate: purchaseDate || new Date().toISOString().split('T')[0],
            usefulLife,
            salvageValue,
            tagNumber,
            custodian,
            department
          }
        })

        const validCount = parsed.filter(p => p._isValid).length
        setParsedRows(parsed)
        setImportSummary({
          total: parsed.length,
          valid: validCount,
          invalid: parsed.length - validCount
        })
      } catch (err: any) {
        setErrorMessage(language === 'AM' ? `ፋይሉን ማንበብ አልተቻለም፦ ${err.message}` : `Failed to parse file: ${err.message}`)
      } finally {
        setIsProcessing(false)
      }
    }

    reader.readAsBinaryString(selected)
  }

  // ── Submit Valid Assets in Bulk ────────────────────────────────
  const handleConfirmImport = async () => {
    const validItems = parsedRows.filter(r => r._isValid)
    if (validItems.length === 0) {
      alert(language === 'AM' ? 'የሚገባ ትክክለኛ ንብረት የለም!' : 'No valid assets to import!')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = validItems.map(({ _rowNumber, _isValid, _errors, ...assetData }) => assetData)
      const res = await fetch('/api/assets/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assets: payload })
      })

      const result = await res.json()
      if (result.count > 0) {
        alert(
          language === 'AM'
            ? `በተሳካ ሁኔታ ${result.count} ንብረቶች ተመዝግበው ገብተዋል!`
            : `Successfully imported ${result.count} assets into the system!`
        )
        onSuccess()
        onClose()
      } else {
        alert('Import failed: ' + (result.errors?.join(', ') || 'Unknown error'))
      }
    } catch (err: any) {
      alert('Network/Server error: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <header className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-600 rounded-2xl text-white shadow-lg shadow-emerald-600/20">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {language === 'AM' ? 'ንብረቶችን በኤክሴል በጅምላ ማስገቢያ (Bulk Asset Import)' : 'Bulk Asset Import via Excel / CSV'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'AM'
                  ? 'በሺህ የሚቆጠሩ ንብረቶችን በአንዴ ከ Excel ፋይል ወደ ሲስተሙ ይጫኑ'
                  : 'Import hundreds or thousands of assets in seconds using standard Excel template'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </header>

        {/* Body */}
        <div className="p-8 overflow-y-auto space-y-6 flex-1">
          {/* Top Step Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 1: Download Template */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 block mb-1">Step 1</span>
                <h4 className="font-black text-sm text-slate-900 dark:text-white">
                  {language === 'AM' ? 'የተዘጋጀ የኤክሴል ቴምፕሌት አውርድ' : 'Download Sample Excel Template'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {language === 'AM' ? 'አስፈላጊ ዓምዶችንና ምሳሌዎችን የያዘ የተዘጋጀ ሰንጠረዥ' : 'Pre-formatted template with all asset columns & samples'}
                </p>
              </div>
              <button
                type="button"
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md transition-all shrink-0 cursor-pointer"
              >
                <Download size={14} />
                <span>{language === 'AM' ? 'ቴምፕሌት አውርድ' : 'Template.xlsx'}</span>
              </button>
            </div>

            {/* Step 2: Upload Filled File */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block mb-1">Step 2</span>
                <h4 className="font-black text-sm text-slate-900 dark:text-white">
                  {language === 'AM' ? 'የሞሉትን ኤክሴል ፋይል ይጫኑ' : 'Upload Completed Spreadsheet'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {file ? file.name : (language === 'AM' ? '.xlsx ወይም .csv ፋይል ይምረጡ' : 'Select .xlsx or .csv file')}
                </p>
              </div>
              <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all shrink-0 cursor-pointer">
                <FileUp size={14} />
                <span>{file ? (language === 'AM' ? 'ቀይር' : 'Change') : (language === 'AM' ? 'ፋይል ምረጥ' : 'Browse File')}</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 flex items-center gap-3 text-rose-700 dark:text-rose-300 text-xs font-bold">
              <AlertCircle size={18} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Summary Indicator */}
          {importSummary && (
            <div className="flex flex-wrap items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 gap-4">
              <div className="flex items-center gap-6 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block uppercase tracking-wider">{language === 'AM' ? 'ጠቅላላ የተነበቡ' : 'Total Read'}</span>
                  <span className="font-black text-lg text-slate-900 dark:text-white">{importSummary.total}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block uppercase tracking-wider">{language === 'AM' ? 'ትክክለኛ' : 'Valid'}</span>
                  <span className="font-black text-lg text-emerald-600">{importSummary.valid}</span>
                </div>
                {importSummary.invalid > 0 && (
                  <div>
                    <span className="text-slate-400 font-bold block uppercase tracking-wider">{language === 'AM' ? 'ክፍተት ያለባቸው' : 'Errors'}</span>
                    <span className="font-black text-lg text-rose-600">{importSummary.invalid}</span>
                  </div>
                )}
              </div>

              <div className="text-xs text-slate-500 font-medium">
                {language === 'AM' ? 'ከታች የንብረቶቹን ቅድመ-እይታ ይመልከቱ' : 'Review table preview before final insertion'}
              </div>
            </div>
          )}

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <div className="max-h-72 overflow-y-auto overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 sticky top-0">
                    <tr>
                      <th className="px-3 py-2.5">#</th>
                      <th className="px-3 py-2.5">{language === 'AM' ? 'ሁኔታ' : 'Status'}</th>
                      <th className="px-3 py-2.5">{language === 'AM' ? 'የንብረት ስም' : 'Asset Name'}</th>
                      <th className="px-3 py-2.5">{language === 'AM' ? 'ምድብ' : 'Category'}</th>
                      <th className="px-3 py-2.5">{language === 'AM' ? 'ብዛት' : 'Qty'}</th>
                      <th className="px-3 py-2.5">{language === 'AM' ? 'ዋጋ (ETB)' : 'Cost'}</th>
                      <th className="px-3 py-2.5">{language === 'AM' ? 'ሴሪያል' : 'Serial'}</th>
                      <th className="px-3 py-2.5">{language === 'AM' ? 'ቦታ' : 'Location'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {parsedRows.slice(0, 50).map((row) => (
                      <tr key={row._rowNumber} className={row._isValid ? 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30' : 'bg-rose-50/40 dark:bg-rose-950/20'}>
                        <td className="px-3 py-2 text-slate-400 font-mono text-[10px]">{row._rowNumber}</td>
                        <td className="px-3 py-2">
                          {row._isValid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600">
                              <CheckCircle2 size={12} /> Ready
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-600" title={row._errors.join(', ')}>
                              <AlertCircle size={12} /> {row._errors[0]}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-black text-slate-900 dark:text-white truncate max-w-xs">{row.name || '—'}</td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{row.category}</td>
                        <td className="px-3 py-2 font-bold">{row.quantity} {row.unit}</td>
                        <td className="px-3 py-2 font-mono font-bold">{row.unitCost?.toLocaleString()}</td>
                        <td className="px-3 py-2 font-mono text-slate-500">{row.serialNumber || '—'}</td>
                        <td className="px-3 py-2 text-slate-500">{row.location}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedRows.length > 50 && (
                <div className="p-2.5 text-center text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800">
                  Showing first 50 rows of {parsedRows.length} total rows
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="px-8 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-800/40">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            {language === 'AM' ? 'ተመለስ' : 'Cancel'}
          </button>

          <button
            type="button"
            disabled={!importSummary || importSummary.valid === 0 || isSubmitting}
            onClick={handleConfirmImport}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-lg shadow-emerald-600/20 transition-all cursor-pointer ${
              !importSummary || importSummary.valid === 0 || isSubmitting ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
            }`}
          >
            <Upload size={15} />
            <span>
              {isSubmitting
                ? (language === 'AM' ? 'እየገባ ነው...' : 'Importing...')
                : language === 'AM'
                ? `${importSummary?.valid || 0} ንብረቶችን ወደ ሲስተም አስገባ`
                : `Confirm & Import ${importSummary?.valid || 0} Assets`}
            </span>
          </button>
        </footer>
      </div>
    </div>
  )
}

