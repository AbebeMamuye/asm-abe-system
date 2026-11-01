import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore, TRANSLATIONS } from '../store/useStore'

const ETHIOPIAN_MONTHS = [
  'መስከረም', 'ጥቅምት', 'ህዳር', 'ታህሳስ', 'ጥር', 'የካቲት',
  'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜ'
]

interface EthiopianDatePickerProps {
  value: string // Gregorian YYYY-MM-DD
  onChange: (value: string) => void
  label?: React.ReactNode
  isDark?: boolean
}

const EthiopianDatePicker = ({ value, onChange, label, isDark }: EthiopianDatePickerProps) => {
  const { language } = useStore()
  const t = TRANSLATIONS[language]
  const [isOpen, setIsOpen] = useState(false)
  
  // Helper to get Ethiopian date from Gregorian string
  const getEthiopianParts = (dateStr: string) => {
    const date = dateStr ? new Date(dateStr) : new Date()
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    
    // Ethiopian New Year is usually Sept 11 (or 12 in leap year before Ethiopian leap year)
    // Precise conversion:
    let eYear = year - 8
    let eMonth = 1
    let eDay = 1

    // Simple offset-based calculation for the display
    // Meskerem 1 2016 = Sept 12 2023 (Leap year case)
    // We'll use a reliable approximate offset for this UI
    const gcTimestamp = date.getTime()
    const ecNewYearTimestamp = new Date(year, 8, 11).getTime()
    
    if (gcTimestamp >= ecNewYearTimestamp) {
      eYear = year - 7
      const diff = Math.floor((gcTimestamp - ecNewYearTimestamp) / 86400000)
      eMonth = Math.floor(diff / 30) + 1
      eDay = (diff % 30) + 1
    } else {
      eYear = year - 8
      const prevEcNewYear = new Date(year - 1, 8, 11).getTime()
      const diff = Math.floor((gcTimestamp - prevEcNewYear) / 86400000)
      eMonth = Math.floor(diff / 30) + 1
      eDay = (diff % 30) + 1
    }
    
    return { eYear, eMonth: Math.min(eMonth, 13), eDay }
  }

  const { eYear, eMonth, eDay } = getEthiopianParts(value)
  const [selectedYear, setSelectedYear] = useState(eYear)
  const [selectedMonth, setSelectedMonth] = useState(eMonth - 1)

  // Sync state with value prop
  useEffect(() => {
    const p = getEthiopianParts(value)
    setSelectedYear(p.eYear)
    setSelectedMonth(p.eMonth - 1)
  }, [value])

  // Convert EC selection back to GC for the store
  const handleSelectDay = (day: number) => {
    const baseYear = selectedMonth >= 4 ? selectedYear + 7 : selectedYear + 8
    const approximateGC = new Date(baseYear, 8, 11)
    approximateGC.setDate(approximateGC.getDate() + (selectedMonth * 30) + (day - 1))
    
    onChange(approximateGC.toISOString().split('T')[0])
    setIsOpen(false)
  }

  const displayDate = `${eDay.toString().padStart(2, '0')}/${eMonth.toString().padStart(2, '0')}/${eYear}`

  return (
    <div className="relative">
      {label && <label className={`text-[10px] font-black uppercase tracking-widest block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between border rounded-xl px-4 py-2.5 text-sm font-black shadow-sm transition-all active:scale-[0.98] ${
          isDark 
            ? 'bg-slate-800 border-slate-700 text-white hover:border-amber-500' 
            : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:border-blue-500 text-slate-900 dark:text-white'
        }`}
      >
        <div className="flex items-center gap-2">
          <CalendarIcon size={16} className={isDark ? 'text-amber-500' : 'text-blue-500'} />
          <span className="tracking-widest">{displayDate}</span>
        </div>
        <span className="text-[10px] text-slate-400 font-black">{language === 'AM' ? 'ቀይር' : 'EDIT'}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-[60] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 w-72 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setSelectedYear(selectedYear - 1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><ChevronLeft size={20}/></button>
            <span className="font-black text-slate-900 dark:text-white">{selectedYear}</span>
            <button onClick={() => setSelectedYear(selectedYear + 1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><ChevronRight size={20}/></button>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mb-4">
            {ETHIOPIAN_MONTHS.map((m, idx) => (
              <button
                key={m}
                onClick={() => setSelectedMonth(idx)}
                className={`py-1.5 rounded-lg text-[10px] font-black transition-all ${selectedMonth === idx ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600'}`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: selectedMonth === 12 ? 6 : 30 }).map((_, i) => (
              <button
                key={i}
                onClick={() => handleSelectDay(i + 1)}
                className="aspect-square flex items-center justify-center rounded-lg text-xs font-bold hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-300 transition-colors"
              >
                {i + 1}
              </button>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
             <button onClick={() => setIsOpen(false)} className="text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest">Close</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default EthiopianDatePicker
