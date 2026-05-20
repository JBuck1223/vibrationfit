/** Normalize DB `time` / fragments to HH:MM for TimePicker and comparisons. */
export function normalizeReminderTimeForPicker(t: string | null | undefined): string {
  if (!t || typeof t !== 'string') return ''
  const m = t.trim().match(/^(\d{1,2}):(\d{2})/)
  if (!m) return ''
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10)))
  const min = Math.min(59, Math.max(0, parseInt(m[2], 10)))
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

/** Default weekly digest send time when unset. */
export const DEFAULT_WEEKLY_DIGEST_TIME = '07:00'

export function parseReminderTimeToParts(t: string | null | undefined): { hour: number; minute: number } {
  const n = normalizeReminderTimeForPicker(t)
  if (!n) return { hour: 7, minute: 0 }
  const [h, m] = n.split(':').map(Number)
  return { hour: h, minute: m }
}

/** Postgres `time` value HH:MM:SS */
export function reminderTimeToPostgresTime(t: string | null | undefined): string {
  const n = normalizeReminderTimeForPicker(t) || DEFAULT_WEEKLY_DIGEST_TIME
  return `${n}:00`
}
