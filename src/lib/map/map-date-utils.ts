import { toDateString } from './cadence'

export type MapViewMode = 'day' | 'week' | 'month'

export function todayDateString(): string {
  return toDateString(new Date())
}

export function parseDateStringLocal(dateStr: string): Date {
  return new Date(dateStr + 'T12:00:00')
}

export function addDays(dateStr: string, days: number): string {
  const d = parseDateStringLocal(dateStr)
  d.setDate(d.getDate() + days)
  return toDateString(d)
}

export function getWeekDatesForDate(anchorDate: string): string[] {
  const anchor = parseDateStringLocal(anchorDate)
  const day = anchor.getDay()
  const mondayDiff = day === 0 ? -6 : 1 - day
  const monday = new Date(anchor)
  monday.setDate(anchor.getDate() + mondayDiff)

  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.push(toDateString(d))
  }
  return dates
}

export function getWeekLabel(dates: string[]): string {
  if (dates.length < 7) return ''
  const start = parseDateStringLocal(dates[0])
  const end = parseDateStringLocal(dates[6])
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}`
}

export function formatDisplayDate(dateStr: string): string {
  return parseDateStringLocal(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function getMonthGrid(year: number, month: number): (string | null)[][] {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const startPad = first.getDay() === 0 ? 6 : first.getDay() - 1
  const weeks: (string | null)[][] = []
  let cursor = 1 - startPad

  while (cursor <= last.getDate()) {
    const week: (string | null)[] = []
    for (let i = 0; i < 7; i++) {
      if (cursor < 1 || cursor > last.getDate()) {
        week.push(null)
      } else {
        week.push(toDateString(new Date(year, month, cursor)))
      }
      cursor++
    }
    weeks.push(week)
  }
  return weeks
}

export function getMonthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

export function monthFromDateStr(dateStr: string): { year: number; month: number } {
  const d = parseDateStringLocal(dateStr)
  return { year: d.getFullYear(), month: d.getMonth() }
}
