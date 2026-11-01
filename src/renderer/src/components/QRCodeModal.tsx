import React, { useEffect, useState, useRef } from 'react'
import QRCode from 'qrcode'
import { Printer, Download, X, QrCode as QrIcon, Check, Copy, Tag, Building2, ShieldCheck } from 'lucide-react'
import { Asset, useStore } from '../store/useStore'

interface QRCodeModalProps {
  asset: Asset
  onClose: () => void
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ asset, onClose }) => {
  const { orgName, language } = useStore()
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const tagNumber = asset.tagNumber || `ETH-AMS-${asset.id?.toString().padStart(5, '0')}`

  useEffect(() => {
    // Generate QR payload containing standard AMIS asset verification data
    const payload = JSON.stringify({
      authority: 'AAC-PPAA',
      tag: tagNumber,
      name: asset.name,
      serial: asset.serialNumber || 'N/A',
      model: (asset as any).model || 'Standard',
      custodian: asset.custodian || 'Unassigned',
      dept: asset.department || 'General',
      verifyUrl: `https://test.aacppaa.gov.et/verify/${encodeURIComponent(tagNumber)}`
    })

    QRCode.toDataURL(payload, {
      width: 260,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    }).then(setQrDataUrl)
  }, [asset, tagNumber])

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML
    if (!printContent) return

    const printWindow = window.open('', '', 'width=650,height=500')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>AMIS Asset Tag — ${tagNumber}</title>
          <style>
            @page {
              size: 70mm 50mm;
              margin: 2mm;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 4px;
              color: #0f172a;
              background: #fff;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .sticker-card {
              width: 66mm;
              border: 2px solid #0f172a;
              border-radius: 6px;
              padding: 6px;
              box-sizing: border-box;
            }
            .header-title {
              font-size: 8px;
              font-weight: 800;
              text-align: center;
              text-transform: uppercase;
              border-bottom: 1.5px solid #0f172a;
              padding-bottom: 3px;
              margin-bottom: 4px;
              letter-spacing: 0.5px;
            }
            .flex-content {
              display: flex;
              align-items: center;
              gap: 6px;
            }
            .qr-img {
              width: 22mm;
              height: 22mm;
              display: block;
            }
            .info-col {
              flex: 1;
              font-size: 8px;
              line-height: 1.25;
            }
            .tag-code {
              font-family: monospace;
              font-size: 11px;
              font-weight: 900;
              background: #0f172a;
              color: #fff;
              padding: 2px 4px;
              border-radius: 3px;
              display: inline-block;
              margin-bottom: 3px;
            }
            .item-name {
              font-weight: bold;
              font-size: 9px;
              margin-bottom: 2px;
            }
            .meta-line {
              color: #334155;
              font-size: 7.5px;
            }
            .footer-strip {
              border-top: 1px dashed #64748b;
              margin-top: 4px;
              padding-top: 2px;
              font-size: 6.5px;
              text-align: center;
              font-weight: bold;
              color: #475569;
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="sticker-card">
            ${printContent}
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handleDownloadPNG = () => {
    if (!qrDataUrl) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = `AMIS-TAG-${tagNumber}.png`
    a.click()
  }

  const handleCopyTag = () => {
    navigator.clipboard.writeText(tagNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative z-50 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-md shadow-blue-500/20">
              <QrIcon size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {language === 'AM' ? 'የንብረት QR ኮድ መለያ ስቲከር' : 'Official Asset QR Code Tag'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                {language === 'AM' ? 'ለቋሚ ንብረት መለያ ተዘጋጅቶ የተዘጋጀ' : 'Public Property Identification Badge'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sticker Preview Box */}
        <div className="py-6 flex flex-col items-center">
          <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Tag size={13} /> {language === 'AM' ? 'የስቲከር ቅድመ-ዕይታ (Preview)' : 'Physical Sticker Preview'}
          </div>

          <div
            ref={printRef}
            className="w-full max-w-md bg-white border-2 border-slate-900 rounded-2xl p-4 shadow-xl text-slate-900"
          >
            <div className="text-[10px] font-black text-center uppercase tracking-wide border-b-2 border-slate-900 pb-2 mb-3 leading-tight">
              <div className="text-blue-800 font-black">የአዲስ አበባ ከተማ አስተዳደር</div>
              <div className="text-[9px] text-slate-700">የመንግስት ንብረት አስተዳደር ባለስልጣን — AMIS</div>
            </div>

            <div className="flex items-center gap-4">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Asset QR Code"
                  className="w-28 h-28 object-contain border border-slate-200 rounded-lg p-1 bg-white shrink-0 shadow-sm"
                />
              ) : (
                <div className="w-28 h-28 bg-slate-100 animate-pulse rounded-lg shrink-0" />
              )}

              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="inline-block bg-slate-950 text-white font-mono text-xs font-black px-2.5 py-1 rounded-md tracking-wider">
                  {tagNumber}
                </div>
                <div className="text-xs font-black truncate text-slate-900" title={asset.name}>
                  {asset.name}
                </div>
                <div className="text-[10px] text-slate-600 font-bold truncate">
                  ሴሪያል: <span className="font-mono text-slate-900">{asset.serialNumber || 'N/A'}</span>
                </div>
                <div className="text-[10px] text-slate-600 font-bold truncate">
                  ተረካቢ: <span className="text-blue-700 font-black">{asset.custodian || 'ያልተመደበ'}</span>
                </div>
                <div className="text-[10px] text-slate-500 font-bold truncate">
                  ክፍል: <span className="text-slate-800">{asset.department || 'መማር ማስተማር'}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-dashed border-slate-400 mt-3 pt-1.5 flex items-center justify-between text-[8px] font-black text-slate-500">
              <span className="flex items-center gap-1"><ShieldCheck size={11} className="text-emerald-600" /> ኦፊሴላዊ የመንግስት ንብረት</span>
              <span>test.aacppaa.gov.et</span>
            </div>
          </div>
        </div>

        {/* Tag Code Copy Bar */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl flex items-center justify-between mb-6 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">{language === 'AM' ? 'መለያ ቁጥር:' : 'Tag Number:'}</span>
            <span className="font-mono font-black text-sm text-slate-900 dark:text-white">{tagNumber}</span>
          </div>
          <button
            onClick={handleCopyTag}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors shadow-sm"
          >
            {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            <span>{copied ? (language === 'AM' ? 'ተቀድቷል' : 'Copied') : (language === 'AM' ? 'ቅዳ' : 'Copy')}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-2xl font-black text-xs hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer size={16} />
            <span>{language === 'AM' ? 'ስቲከር አትም (Print Sticker)' : 'Print Asset Sticker'}</span>
          </button>
          <button
            onClick={handleDownloadPNG}
            className="px-4 py-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl font-black text-xs hover:bg-blue-100 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download size={16} />
            <span>PNG</span>
          </button>
        </div>

      </div>
    </div>
  )
}

export default QRCodeModal
