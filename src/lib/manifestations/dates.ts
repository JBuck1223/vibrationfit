/** Calendar date (YYYY-MM-DD) in the viewer's local timezone. */
export function toLocalDateInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Noon local, so the calendar day does not shift across timezones. */
export function dateInputToIso(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day, 12, 0, 0, 0)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

export function todayDateInput(): string {
  return toLocalDateInput(new Date().toISOString())
}

/** Keep the original timestamp when the calendar day did not change. */
export function resolveEditedTimestamp(
  originalIso: string | null | undefined,
  dateInput: string,
): string | null {
  if (!dateInput) return originalIso ?? null
  if (originalIso && toLocalDateInput(originalIso) === dateInput) return originalIso
  return dateInputToIso(dateInput)
}
