import type { Cadence } from './types'

/**
 * Given a cadence and a date range, return all dates within [start, end]
 * that should have an occurrence.
 */
export function getOccurrenceDates(
  cadence: Cadence,
  rangeStart: Date,
  rangeEnd: Date,
): Date[] {
  const dates: Date[] = []

  if (cadence.kind === 'daily') {
    const cursor = new Date(rangeStart)
    while (cursor <= rangeEnd) {
      dates.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    return dates
  }

  if (cadence.kind === 'days_per_week') {
    return getDaysPerWeekOccurrences(cadence.count, rangeStart, rangeEnd)
  }

  return dates
}

/**
 * For days_per_week cadence, distribute N days evenly across each ISO week
 * within the range. Picks the first N days of each week that fall within range.
 */
function getDaysPerWeekOccurrences(
  count: number,
  rangeStart: Date,
  rangeEnd: Date,
): Date[] {
  const dates: Date[] = []
  const weekStart = getISOWeekStart(rangeStart)
  const cursor = new Date(weekStart)

  while (cursor <= rangeEnd) {
    const weekDays: Date[] = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(cursor)
      day.setDate(day.getDate() + i)
      if (day >= rangeStart && day <= rangeEnd) {
        weekDays.push(day)
      }
    }
    dates.push(...weekDays.slice(0, count))
    cursor.setDate(cursor.getDate() + 7)
  }

  return dates
}

function getISOWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1) - day
  d.setDate(d.getDate() + diff)
  return d
}

/**
 * Compute the next N occurrence dates from a given start date.
 */
export function getNextOccurrences(
  cadence: Cadence,
  fromDate: Date,
  count: number,
): Date[] {
  const farEnd = new Date(fromDate)
  farEnd.setDate(farEnd.getDate() + count * 7 + 14)
  const all = getOccurrenceDates(cadence, fromDate, farEnd)
  return all.slice(0, count)
}

/**
 * Format a date as YYYY-MM-DD (date-only, no timezone).
 */
export function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Parse a YYYY-MM-DD string into a Date (local midnight).
 */
export function parseDateString(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}
