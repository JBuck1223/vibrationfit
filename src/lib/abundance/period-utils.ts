/**
 * Period helpers for abundance goals and reports.
 * period_key format: week "YYYY-Www", month "YYYY-MM", quarter "YYYY-Qn", year "YYYY", custom "YYYY-MM-DD_YYYY-MM-DD".
 */

import {
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  startOfISOWeek,
  endOfISOWeek,
  format,
  getQuarter,
  getISOWeek,
  getISOWeekYear,
  parseISO,
  isValid,
} from 'date-fns'

export type PeriodType = 'week' | 'month' | 'quarter' | 'year' | 'custom'

/** Get period_key for a date (e.g. "2025-W10", "2025-02", "2025-Q1", "2025"). For custom, use buildCustomPeriodKey. */
export function getPeriodKey(date: Date, periodType: PeriodType): string {
  const y = date.getFullYear()
  if (periodType === 'year') return String(y)
  if (periodType === 'quarter') return `${y}-Q${getQuarter(date)}`
  if (periodType === 'week') {
    const isoYear = getISOWeekYear(date)
    const isoWeek = String(getISOWeek(date)).padStart(2, '0')
    return `${isoYear}-W${isoWeek}`
  }
  if (periodType === 'custom') return '' // custom requires explicit start/end
  return format(date, 'yyyy-MM')
}

/** Build period_key for custom range. */
export function buildCustomPeriodKey(start: string, end: string): string {
  return `${start}_${end}`
}

/** Get start and end dates (YYYY-MM-DD) for a period_key. */
export function getPeriodStartEnd(
  periodType: PeriodType,
  periodKey: string
): { start: string; end: string } | null {
  let startDate: Date
  let endDate: Date

  if (periodType === 'week') {
    const parsed = parseISO(periodKey)
    if (!isValid(parsed)) return null
    startDate = startOfISOWeek(parsed)
    endDate = endOfISOWeek(parsed)
  } else if (periodType === 'month') {
    const parsed = parseISO(periodKey + '-01')
    if (!isValid(parsed)) return null
    startDate = startOfMonth(parsed)
    endDate = endOfMonth(parsed)
  } else if (periodType === 'quarter') {
    const match = periodKey.match(/^(\d{4})-Q([1-4])$/)
    if (!match) return null
    const year = parseInt(match[1], 10)
    const q = parseInt(match[2], 10)
    const month = (q - 1) * 3 + 1
    startDate = startOfQuarter(new Date(year, month - 1, 1))
    endDate = endOfQuarter(new Date(year, month - 1, 1))
  } else if (periodType === 'custom') {
    const parts = periodKey.split('_')
    if (parts.length !== 2) return null
    const [startStr, endStr] = parts
    const startParsed = parseISO(startStr)
    const endParsed = parseISO(endStr)
    if (!isValid(startParsed) || !isValid(endParsed)) return null
    return { start: startStr, end: endStr }
  } else {
    const year = parseInt(periodKey, 10)
    if (Number.isNaN(year) || periodKey.length !== 4) return null
    startDate = startOfYear(new Date(year, 0, 1))
    endDate = endOfYear(new Date(year, 0, 1))
  }

  return {
    start: format(startDate, 'yyyy-MM-dd'),
    end: format(endDate, 'yyyy-MM-dd'),
  }
}

/** Parse period_key into a display string (e.g. "Week of Mar 3, 2025", "February 2025", "Q1 2025", "2025", "Mar 1 – 15, 2025"). */
export function formatPeriodLabel(periodType: PeriodType, periodKey: string): string {
  if (periodType === 'week') {
    const parsed = parseISO(periodKey)
    return isValid(parsed) ? `Week of ${format(parsed, 'MMM d, yyyy')}` : periodKey
  }
  if (periodType === 'month') {
    const d = parseISO(periodKey + '-01')
    return isValid(d) ? format(d, 'MMMM yyyy') : periodKey
  }
  if (periodType === 'quarter') {
    const match = periodKey.match(/^(\d{4})-Q([1-4])$/)
    return match ? `Q${match[2]} ${match[1]}` : periodKey
  }
  if (periodType === 'custom') {
    const parts = periodKey.split('_')
    if (parts.length !== 2) return periodKey
    const startParsed = parseISO(parts[0])
    const endParsed = parseISO(parts[1])
    if (!isValid(startParsed) || !isValid(endParsed)) return periodKey
    return `${format(startParsed, 'MMM d')} – ${format(endParsed, 'MMM d, yyyy')}`
  }
  return periodKey
}

/** Display string for "Setting goal for X": March (month), 2026 (year), March 9th–15th (week), January – March 2026 (quarter), custom range. */
export function formatPeriodForGoalLabel(
  periodType: PeriodType,
  periodKey: string
): string {
  if (periodType === 'week') {
    const range = getPeriodStartEnd(periodType, periodKey)
    if (!range) return periodKey
    const startParsed = parseISO(range.start)
    const endParsed = parseISO(range.end)
    if (!isValid(startParsed) || !isValid(endParsed)) return periodKey
    const sameMonth = startParsed.getMonth() === endParsed.getMonth() && startParsed.getFullYear() === endParsed.getFullYear()
    return sameMonth
      ? `${format(startParsed, 'MMMM do')}–${format(endParsed, 'do, yyyy')}`
      : `${format(startParsed, 'MMMM do')} – ${format(endParsed, 'MMMM do, yyyy')}`
  }
  if (periodType === 'month') {
    const d = parseISO(periodKey + '-01')
    return isValid(d) ? format(d, 'MMMM') : periodKey
  }
  if (periodType === 'quarter') {
    const range = getPeriodStartEnd(periodType, periodKey)
    if (!range) return periodKey
    const startParsed = parseISO(range.start)
    const endParsed = parseISO(range.end)
    if (!isValid(startParsed) || !isValid(endParsed)) return periodKey
    return `${format(startParsed, 'MMMM')} – ${format(endParsed, 'MMMM yyyy')}`
  }
  if (periodType === 'year') {
    return periodKey
  }
  if (periodType === 'custom') {
    const parts = periodKey.split('_')
    if (parts.length !== 2) return periodKey
    const startParsed = parseISO(parts[0])
    const endParsed = parseISO(parts[1])
    if (!isValid(startParsed) || !isValid(endParsed)) return periodKey
    return `${format(startParsed, 'MMM d')} – ${format(endParsed, 'MMM d, yyyy')}`
  }
  return periodKey
}
