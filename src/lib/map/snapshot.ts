import { addDays } from '@/lib/map/map-date-utils'
import type { Commitment } from '@/lib/map/types'

export type CommitmentChangeEventType =
  | 'created'
  | 'updated'
  | 'archived'
  | 'deleted'
  | 'resumed'

export type CommitmentChangeSource =
  | 'system_activate'
  | 'custom_create'
  | 'custom_update'
  | 'custom_archive'
  | 'custom_delete'
  | 'auto'

export interface CommitmentChangeEvent {
  id: string
  commitment_id: string | null
  user_id: string
  event_type: CommitmentChangeEventType
  state: Commitment
  changed_at: string
  source: CommitmentChangeSource
  map_activation_id: string | null
}

export interface ResolvedMapPlanSnapshot {
  plan: Commitment[]
  date: string
  isHistorical: boolean
}

/** End of the chosen calendar day in UTC for inclusive date picking. */
export function snapshotDateToEndOfDay(dateInput: string): Date {
  const [year, month, day] = dateInput.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999))
}

function parseStateCommitment(state: Commitment): Commitment | null {
  if (!state?.id || !state?.title) return null
  return state
}

/** Latest event per commitment on or before snapshot end; keep only active status. */
export function resolveMapPlanSnapshot(
  events: CommitmentChangeEvent[],
  snapshotDate: string,
): Commitment[] {
  const snapshotEnd = snapshotDateToEndOfDay(snapshotDate)
  const latestByCommitment = new Map<string, CommitmentChangeEvent>()

  for (const event of events) {
    const commitmentId = event.commitment_id ?? event.state?.id
    if (!commitmentId) continue
    if (new Date(event.changed_at) > snapshotEnd) continue

    const existing = latestByCommitment.get(commitmentId)
    if (
      !existing
      || new Date(event.changed_at).getTime() > new Date(existing.changed_at).getTime()
    ) {
      latestByCommitment.set(commitmentId, event)
    }
  }

  const plan: Commitment[] = []
  for (const event of latestByCommitment.values()) {
    const commitment = parseStateCommitment(event.state)
    if (!commitment) continue
    if (commitment.status !== 'active') continue
    plan.push(commitment)
  }

  plan.sort((a, b) => {
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0
    return bTime - aTime
  })

  return plan
}

/**
 * Calendar days where the member had at least one active commitment on their MAP
 * (end-of-day snapshot). Gaps between activations are omitted. Today is included
 * only when they currently have an active plan.
 */
export function getMapSelectableDates(
  events: CommitmentChangeEvent[],
  todayDate: string,
  hasActivePlanToday: boolean,
): string[] {
  const earliest = getEarliestMapSnapshotDate(events)
  if (!earliest && !hasActivePlanToday) return []

  const start = earliest ?? todayDate
  const selectable: string[] = []
  let cursor = start

  while (cursor <= todayDate) {
    const plan = resolveMapPlanSnapshot(events, cursor)
    const includeToday = cursor === todayDate && hasActivePlanToday
    if (plan.length > 0 || includeToday) {
      selectable.push(cursor)
    }
    cursor = addDays(cursor, 1)
  }

  return selectable
}

/** Step to the previous or next MAP-active calendar day in a sorted list. */
export function getAdjacentSelectableDate(
  current: string,
  direction: -1 | 1,
  sortedSelectableDates: string[],
): string | null {
  const idx = sortedSelectableDates.indexOf(current)
  if (idx < 0) return null
  const nextIdx = idx + direction
  if (nextIdx < 0 || nextIdx >= sortedSelectableDates.length) return null
  return sortedSelectableDates[nextIdx]
}

export function getEarliestMapSnapshotDate(events: CommitmentChangeEvent[]): string | null {
  if (events.length === 0) return null

  let earliest = events[0].changed_at
  for (const event of events) {
    if (event.changed_at < earliest) earliest = event.changed_at
  }

  return toLocalDateString(earliest)
}

/** ISO timestamp to local calendar date (YYYY-MM-DD). */
export function toLocalDateString(isoTimestamp: string): string {
  const date = new Date(isoTimestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatMapSnapshotDateLabel(snapshotDate: string): string {
  const [year, month, day] = snapshotDate.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function isHistoricalMapDate(snapshotDate: string, todayDate: string): boolean {
  return snapshotDate < todayDate
}
