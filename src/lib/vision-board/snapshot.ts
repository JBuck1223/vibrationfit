export type VisionBoardItemStatus = 'active' | 'actualized' | 'inactive'

export interface VisionBoardStatusEvent {
  id: string
  item_id: string
  user_id: string
  from_status: VisionBoardItemStatus | null
  to_status: VisionBoardItemStatus
  changed_at: string
}

export interface VisionBoardSnapshotItem {
  id: string
  created_at: string
  status: VisionBoardItemStatus
  [key: string]: unknown
}

/** End of the chosen calendar day in UTC for inclusive date picking. */
export function snapshotDateToEndOfDay(dateInput: string): Date {
  const [year, month, day] = dateInput.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999))
}

export function getStatusAtDate(
  itemId: string,
  createdAt: string,
  events: VisionBoardStatusEvent[],
  snapshotEnd: Date
): VisionBoardItemStatus | null {
  const created = new Date(createdAt)
  if (created > snapshotEnd) return null

  const itemEvents = events
    .filter((event) => event.item_id === itemId)
    .filter((event) => new Date(event.changed_at) <= snapshotEnd)
    .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime())

  if (itemEvents.length > 0) {
    return itemEvents[0].to_status
  }

  return 'active'
}

export function resolveBoardSnapshot<T extends VisionBoardSnapshotItem>(
  items: T[],
  events: VisionBoardStatusEvent[],
  snapshotDate: string
): Array<T & { snapshotStatus: VisionBoardItemStatus }> {
  const snapshotEnd = snapshotDateToEndOfDay(snapshotDate)
  const resolved: Array<T & { snapshotStatus: VisionBoardItemStatus }> = []

  for (const item of items) {
    const status = getStatusAtDate(item.id, item.created_at, events, snapshotEnd)
    if (!status) continue

    resolved.push({
      ...item,
      status,
      snapshotStatus: status,
    })
  }

  return resolved
}

/** ISO timestamp → local calendar date (YYYY-MM-DD). */
export function toLocalDateString(isoTimestamp: string): string {
  const date = new Date(isoTimestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Earliest date the user could have had items on their board. */
export function getEarliestBoardSnapshotDate(
  items: Array<{ created_at: string }>
): string | null {
  if (items.length === 0) return null

  let earliest = items[0].created_at
  for (const item of items) {
    if (item.created_at < earliest) earliest = item.created_at
  }

  return toLocalDateString(earliest)
}

export function formatSnapshotDateLabel(snapshotDate: string): string {
  const [year, month, day] = snapshotDate.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}
