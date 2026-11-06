import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '../store/useStore'
import { toEthiopianDetails, toGregorianDate, ETHIOPIAN_MONTHS } from '../lib/ethiopianCalendar'

interface EthiopianDatePickerProps {
  value: string // Gregorian YYYY-MM-DD
  onChange: (value: string) => void
  label?: React.ReactNode
  isDark?: boolean
}

const EthiopianDatePicker = ({ value, onChange, label, isDark }: EthiopianDatePickerProps) => {
  const { language } = useStore()
  const [isOpen, setIsOpen] = useState(false)

  const initial = toEthiopianDetails(value || new Date())
  const [selectedYear, setSelectedYear] = useState(initial.year)
  const [selectedMonth, setSelectedMonth] = useState(initial.month - 1) // 0-indexed

  // Sync state with value prop
  useEffect(() => {
    const p = toEthiopianDetails(value || new Date())
    setSelectedYear(p.year)
    setSelectedMonth(p.month - 1)
  }, [value])

  const currentDetails = toEthiopianDetails(value || new Date())
  const displayDate = `${String(currentDetails.day).padStart(2, '0')}/${String(currentDetails.month).padStart(2, '0')}/${currentDetails.year} ዓ.ም`

  // Convert EC selection back to GC for the store with 100% precision
  const handleSelectDay = (day: number) => {
    const gregorianDate = toGregorianDate(selectedYear, selectedMonth + 1, day)
    onChange(gregorianDate)
    setIsOpen(false)
  }

  // Pagumen has 5 or 6 days depending on Ethiopian leap year (year % 4 === 3)
  const isLeapYear = selectedYear % 4 === 3
  const daysInMonth = selectedMonth === 12 ? (isLeapYear ? 6 : 5) : 30

  return (
    <div className="relative">
      {label && <label className="text-[10px] font-black uppercase tracking-widest block mb-1 text-slate-400">{label}</label>}
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
        <div className="absolute top-full left-0 mt-2 z-[60] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 w-76 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setSelectedYear(selectedYear - 1)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="text-center">
              <span className="font-black text-slate-900 dark:text-white text-base">{selectedYear} ዓ.ም</span>
              <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400">{ETHIOPIAN_MONTHS[selectedMonth]}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedYear(selectedYear + 1)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-4 gap-1.5 mb-3">
            {ETHIOPIAN_MONTHS.map((m, idx) => (
              <button
                key={m}
                type="button"
                onClick={() => setSelectedMonth(idx)}
                className={`py-1 rounded-lg text-[10px] font-black transition-all ${
                  selectedMonth === idx 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-6 gap-1 pt-2 border-t border-slate-100 dark:border-slate-800">
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const isToday = currentDetails.year === selectedYear && currentDetails.month === (selectedMonth + 1) && currentDetails.day === day
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`aspect-square flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                    isToday
                      ? 'bg-blue-600 text-white shadow-sm font-black'
                      : 'hover:bg-blue-50 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {day}
                </button>
              )
            })}
          </div>
          
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <button
              type="button"
              onClick={() => {
                const now = toEthiopianDetails(new Date())
                setSelectedYear(now.year)
                setSelectedMonth(now.month - 1)
                handleSelectDay(now.day)
              }}
              className="text-[10px] font-black text-blue-600 hover:underline uppercase"
            >
              {language === 'AM' ? 'የዛሬ ቀን' : 'Today'}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[10px] font-black text-slate-400 hover:text-slate-900 dark:hover:text-white uppercase tracking-widest"
            >
              {language === 'AM' ? 'ዝጋ' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default EthiopianDatePicker
