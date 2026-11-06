import React, { useState, useEffect, useRef } from 'react'
import { X, Printer, CheckSquare, Square, QrCode as QrIcon, Search, Tag, Building2 } from 'lucide-react'
import QRCode from 'qrcode'
import { Asset, useStore } from '../store/useStore'

interface BulkQRCodeModalProps {
  isOpen: boolean
  onClose: () => void
  assets: Asset[]
}

interface AssetWithQR extends Asset {
  qrDataUrl: string
}

export const BulkQRCodeModal: React.FC<BulkQRCodeModalProps> = ({ isOpen, onClose, assets }) => {
  const { orgName, language } = useStore()
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [qrItems, setQrItems] = useState<Record<number, string>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const printAreaRef = useRef<HTMLDivElement>(null)

  // Initialize selected assets
  useEffect(() => {
    if (isOpen) {
      const activeIds = assets.filter(a => a.id && a.condition !== 'Disposed').map(a => a.id!)
      setSelectedIds(activeIds)
    }
  }, [isOpen, assets])

  // Filtered assets for selection
  const filteredAssets = assets.filter(a => {
    const q = searchTerm.toLowerCase()
    return (
      a.name.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      (a.tagNumber && a.tagNumber.toLowerCase().includes(q)) ||
      (a.serialNumber && a.serialNumber.toLowerCase().includes(q))
    )
  })

  // Generate QR codes for selected assets
  useEffect(() => {
    if (!isOpen || selectedIds.length === 0) return

    let isMounted = true
    setIsGenerating(true)

    const generateQRs = async () => {
      const newMap: Record<number, string> = {}
      for (const id of selectedIds) {
        const asset = assets.find(a => a.id === id)
        if (!asset) continue

        const tagNumber = asset.tagNumber || `ETH-AMS-${asset.id?.toString().padStart(5, '0')}`
        const payload = JSON.stringify({
          authority: 'AMIS-ETHIOPIA',
          tag: tagNumber,
          name: asset.name,
          category: asset.category,
          serial: asset.serialNumber || 'N/A',
          location: asset.location || 'Store'
        })

        try {
          const url = await QRCode.toDataURL(payload, {
            width: 140,
            margin: 1,
            color: { dark: '#0f172a', light: '#ffffff' },
            errorCorrectionLevel: 'M'
          })
          newMap[id] = url
        } catch {}
      }

      if (isMounted) {
        setQrItems(newMap)
        setIsGenerating(false)
      }
    }

    generateQRs()

    return () => {
      isMounted = false
    }
  }, [isOpen, selectedIds, assets])

  if (!isOpen) return null

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredAssets.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredAssets.map(a => a.id!).filter(Boolean))
    }
  }

  const selectedAssetObjects = assets.filter(a => a.id && selectedIds.includes(a.id))

  const handlePrint = () => {
    const printContent = printAreaRef.current?.innerHTML
    if (!printContent) return

    const printWin = window.open('', '', 'width=900,height=700')
    if (!printWin) return

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>AMIS Bulk Asset Labels — ${orgName}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              margin: 0;
              padding: 0;
              color: #0f172a;
              background: #fff;
            }
            .sheet-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 4.5mm;
              page-break-inside: auto;
            }
            .label-card {
              border: 1.5px solid #0f172a;
              border-radius: 6px;
              padding: 5px;
              box-sizing: border-box;
              height: 33mm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              page-break-inside: avoid;
            }
            .label-header {
              font-size: 7px;
              font-weight: 800;
              text-align: center;
              text-transform: uppercase;
              border-bottom: 1px solid #0f172a;
              padding-bottom: 2px;
              margin-bottom: 3px;
              letter-spacing: 0.3px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .label-body {
              display: flex;
              align-items: center;
              gap: 5px;
              flex: 1;
            }
            .qr-col {
              width: 22mm;
              height: 22mm;
              flex-shrink: 0;
            }
            .qr-col img {
              width: 100%;
              height: 100%;
              display: block;
            }
            .info-col {
              flex: 1;
              font-size: 7.5px;
              line-height: 1.25;
              overflow: hidden;
            }
            .asset-tag {
              font-family: monospace;
              font-size: 8.5px;
              font-weight: 900;
              color: #0f172a;
            }
            .asset-name {
              font-weight: 800;
              font-size: 8px;
              margin-top: 1px;
              overflow: hidden;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
            }
            .asset-meta {
              color: #475569;
              font-size: 7px;
              margin-top: 2px;
            }
            @media print {
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `)
    printWin.document.close()
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <header className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-600/20">
              <QrIcon size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {language === 'AM' ? 'የባርኮድ/QR ኮድ ስቲከሮች በጅምላ ማተሚያ' : 'Bulk Asset QR / Barcode Sticker Sheet (A4)'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'AM'
                  ? 'በ A4 ስቲከር ወረቀት ላይ በአንድ ገጽ 24 ወይም ከዚያ በላይ ስቲከሮችን በአንድ ጊዜ ያትሙ'
                  : 'Print 24 sticker label tags per A4 sheet formatted for physical asset tagging'}
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

        {/* Controls Bar */}
        <div className="px-8 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-xs cursor-pointer hover:bg-slate-100"
            >
              {selectedIds.length === filteredAssets.length ? <CheckSquare size={16} className="text-indigo-600" /> : <Square size={16} />}
              <span>
                {selectedIds.length === filteredAssets.length
                  ? (language === 'AM' ? 'ሁሉንም አትምረጥ' : 'Deselect All')
                  : (language === 'AM' ? 'ሁሉንም ምረጥ' : 'Select All')}
              </span>
            </button>
            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
              {language === 'AM' ? `${selectedIds.length} ንብረቶች ተመርጠዋል` : `${selectedIds.length} assets selected`}
            </span>
          </div>

          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder={language === 'AM' ? 'ፈልግ...' : 'Search assets...'}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Preview Area */}
        <div className="p-8 overflow-y-auto flex-1 space-y-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {language === 'AM' ? 'የስቲከር ወረቀት ቅድመ-እይታ (A4 Grid Preview)' : 'A4 Label Sheet Preview (24 stickers per sheet)'}
          </p>

          <div ref={printAreaRef} className="bg-white p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
            <div className="sheet-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {selectedAssetObjects.map(asset => {
                const tagNumber = asset.tagNumber || `ETH-AMS-${asset.id?.toString().padStart(5, '0')}`
                const qrUrl = qrItems[asset.id!]
                return (
                  <div key={asset.id} className="label-card border border-slate-900 rounded-lg p-2.5 bg-white text-slate-900 flex flex-col justify-between h-28">
                    <div className="label-header text-[8px] font-black uppercase text-center border-b border-slate-900 pb-1 tracking-wider truncate">
                      {orgName || 'ETHIOPIAN PROPERTY ADMINISTRATION'}
                    </div>

                    <div className="label-body flex items-center gap-2 mt-1 flex-1">
                      <div className="qr-col w-16 h-16 shrink-0 flex items-center justify-center">
                        {qrUrl ? (
                          <img src={qrUrl} alt="QR" className="w-full h-full object-contain" />
                        ) : (
                          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[8px] text-slate-400">Loading</div>
                        )}
                      </div>

                      <div className="info-col flex-1 text-[8px] leading-tight overflow-hidden">
                        <div className="asset-tag font-mono font-black text-[9px] text-indigo-900">{tagNumber}</div>
                        <div className="asset-name font-bold text-[8.5px] mt-0.5 line-clamp-2 text-slate-900">{asset.name}</div>
                        <div className="asset-meta text-[7.5px] text-slate-500 mt-1">
                          {asset.category} | {asset.serialNumber || 'No Serial'}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {selectedAssetObjects.length === 0 && (
              <div className="text-center py-12 text-slate-400 font-bold text-sm">
                {language === 'AM' ? 'ምንም የተመረጠ ንብረት የለም' : 'No assets selected for printing.'}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="px-8 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-800/40">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            {language === 'AM' ? 'ዝጋ' : 'Close'}
          </button>

          <button
            type="button"
            disabled={selectedIds.length === 0 || isGenerating}
            onClick={handlePrint}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-lg shadow-indigo-600/20 transition-all cursor-pointer ${
              selectedIds.length === 0 || isGenerating ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
            }`}
          >
            <Printer size={15} />
            <span>
              {isGenerating
                ? (language === 'AM' ? 'QR ኮድ እየተዘጋጀ ነው...' : 'Generating QRs...')
                : language === 'AM'
                ? `${selectedIds.length} ስቲከሮችን በ A4 አትም`
                : `Print ${selectedIds.length} Labels (A4 Sheet)`}
            </span>
          </button>
        </footer>
      </div>
    </div>
  )
}

