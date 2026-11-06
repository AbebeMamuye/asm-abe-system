/**
 * High-Precision Astronomical Ethiopian Calendar Converter
 * Mathematically exact Julian Day Number (JDN) conversions between
 * Gregorian and Ethiopian (Ge'ez) calendars.
 */

export const ETHIOPIAN_MONTHS = [
  'መስከረም', 'ጥቅምት', 'ህዳር', 'ታህሳስ', 'ጥር', 'የካቲት',
  'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜ'
] as const

export function gregorianToJdn(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12)
  const y = year + 4800 - a
  const m = month + 12 * a - 3
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045
}

export function jdnToEthiopian(jdn: number): { year: number; month: number; day: number } {
  const r = (jdn - 1723856) % 1461
  const n = (r % 365) + 365 * Math.floor(r / 1460)
  const year = 4 * Math.floor((jdn - 1723856) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460)
  const month = Math.floor(n / 30) + 1
  const day = (n % 30) + 1
  return { year, month, day }
}

export function ethiopianToJdn(year: number, month: number, day: number): number {
  return (1723856 + 365) + 365 * (year - 1) + Math.floor(year / 4) + 30 * (month - 1) + day - 1
}

export function jdnToGregorian(jdn: number): { year: number; month: number; day: number } {
  const a = jdn + 32044
  const b = Math.floor((4 * a + 3) / 146097)
  const c = a - Math.floor((146097 * b) / 4)
  const d = Math.floor((4 * c + 3) / 1461)
  const e = c - Math.floor((1461 * d) / 4)
  const m = Math.floor((5 * e + 2) / 153)
  const day = e - Math.floor((153 * m + 2) / 5) + 1
  const month = m + 3 - 12 * Math.floor(m / 10)
  const year = 100 * b + d - 4800 + Math.floor(m / 10)
  return { year, month, day }
}

export function toEthiopianDetails(date: Date | string): { year: number; month: number; day: number; monthName: string } {
  const d = typeof date === 'string' ? new Date(date) : date
  if (!d || isNaN(d.getTime())) {
    return { year: 2017, month: 1, day: 1, monthName: ETHIOPIAN_MONTHS[0] }
  }
  const jdn = gregorianToJdn(d.getFullYear(), d.getMonth() + 1, d.getDate())
  const ec = jdnToEthiopian(jdn)
  const monthName = ETHIOPIAN_MONTHS[Math.min(ec.month - 1, 12)] || 'መስከረም'
  return { ...ec, monthName }
}

export function toEthiopianDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (!d || isNaN(d.getTime())) return ''
  const ec = toEthiopianDetails(d)
  const dd = String(ec.day).padStart(2, '0')
  const mm = String(ec.month).padStart(2, '0')
  return `${dd}/${mm}/${ec.year}`
}

export function toGregorianDate(ecYear: number, ecMonth: number, ecDay: number): string {
  const jdn = ethiopianToJdn(ecYear, ecMonth, ecDay)
  const gc = jdnToGregorian(jdn)
  const yyyy = String(gc.year).padStart(4, '0')
  const mm = String(gc.month).padStart(2, '0')
  const dd = String(gc.day).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function getCurrentEthiopianDate(): string {
  return toEthiopianDate(new Date())
}
