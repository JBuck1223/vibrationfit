import {
  intervalCycleDays,
  isEvery4WeeksCadence,
  isIntervalCadence,
} from './cadence'
import {
  MAP_DUE_SOON_DAYS_BEFORE_CYCLE,
  MAP_FOUR_WEEK_CYCLE_DAYS,
  type Cadence,
  type Commitment,
  type CommitmentOccurrence,
} from './types'
import { addDays, getWeekDatesForDate, parseDateStringLocal } from './map-date-utils'

export interface CommitmentPeriodTally {
  completed: number
  target: number
}

export interface CommitmentCadenceStatus {
  mode: 'weekly' | 'interval'
  periodTally?: CommitmentPeriodTally
  daysSinceLastYes: number
  /** True when anchorDate has a logged yes (not merely "day 0" of the cycle). */
  loggedYesOnAnchorDate: boolean
  /** True when any yes exists on or before anchorDate. */
  hasPriorYes: boolean
  intervalCycleDays?: number
  dueSoon: boolean
  overdue: boolean
  /** Days until the current interval ends (when dueSoon). */
  daysUntilDue: number | null
}

export function hasYesOnDate(
  commitmentId: string,
  occurrences: CommitmentOccurrence[],
  date: string,
): boolean {
  return occurrences.some(
    o =>
      o.commitment_id === commitmentId &&
      o.occurred_on === date &&
      o.status === 'yes',
  )
}

function compareDateStr(a: string, b: string): number {
  return a.localeCompare(b)
}

export function daysBetweenDates(from: string, to: string): number {
  const start = parseDateStringLocal(from)
  const end = parseDateStringLocal(to)
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000))
}

function getIsoWeekBounds(anchorDate: string): { start: string; end: string } {
  const week = getWeekDatesForDate(anchorDate)
  return { start: week[0], end: week[6] }
}

function getBiweeklyBounds(
  anchorDate: string,
  cycleStart: string,
): { start: string; end: string } {
  let periodStart = cycleStart
  while (compareDateStr(addDays(periodStart, 14), anchorDate) <= 0) {
    periodStart = addDays(periodStart, 14)
  }
  return { start: periodStart, end: addDays(periodStart, 13) }
}

function getFourWeekBounds(
  anchorDate: string,
  cycleStart: string,
): { start: string; end: string } {
  let periodStart = cycleStart
  while (compareDateStr(addDays(periodStart, MAP_FOUR_WEEK_CYCLE_DAYS), anchorDate) <= 0) {
    periodStart = addDays(periodStart, MAP_FOUR_WEEK_CYCLE_DAYS)
  }
  return {
    start: periodStart,
    end: addDays(periodStart, MAP_FOUR_WEEK_CYCLE_DAYS - 1),
  }
}

function cadenceTarget(cadence: Cadence): number {
  if (cadence.kind === 'daily') return 7
  if (cadence.kind === 'days_per_week') return Math.max(1, cadence.count)
  if (isIntervalCadence(cadence)) return 1
  return 1
}

function periodBoundsForCadence(
  cadence: Cadence,
  anchorDate: string,
  startDate: string | null,
): { start: string; end: string } {
  if (isEvery4WeeksCadence(cadence)) {
    const cycleStart = startDate ?? anchorDate
    return getFourWeekBounds(anchorDate, cycleStart)
  }
  if (cadence.kind === 'biweekly') {
    const cycleStart = startDate ?? anchorDate
    return getBiweeklyBounds(anchorDate, cycleStart)
  }
  return getIsoWeekBounds(anchorDate)
}

export function commitmentCreatedDate(commitment: Commitment): string {
  return commitment.start_date ?? commitment.created_at.slice(0, 10)
}

/** Last yes on or before anchorDate; otherwise null. */
export function getLastYesDateOnOrBefore(
  commitmentId: string,
  occurrences: CommitmentOccurrence[],
  anchorDate: string,
): string | null {
  let latest: string | null = null
  for (const o of occurrences) {
    if (o.commitment_id !== commitmentId || o.status !== 'yes') continue
    if (compareDateStr(o.occurred_on, anchorDate) > 0) continue
    if (!latest || compareDateStr(o.occurred_on, latest) > 0) {
      latest = o.occurred_on
    }
  }
  return latest
}

/** Rolling interval anchor: last completion, else commitment start/created day. */
export function getIntervalAnchorDate(
  commitment: Commitment,
  occurrences: CommitmentOccurrence[],
  anchorDate: string,
): string {
  return (
    getLastYesDateOnOrBefore(commitment.id, occurrences, anchorDate) ??
    commitmentCreatedDate(commitment)
  )
}

function getWeeklyPeriodTally(
  commitment: Commitment,
  occurrences: CommitmentOccurrence[],
  anchorDate: string,
): CommitmentPeriodTally | null {
  if (!commitment.cadence || isIntervalCadence(commitment.cadence)) return null

  const { start, end } = periodBoundsForCadence(
    commitment.cadence,
    anchorDate,
    commitment.start_date,
  )
  const target = cadenceTarget(commitment.cadence)

  const inPeriod = occurrences.filter(
    o =>
      o.commitment_id === commitment.id &&
      compareDateStr(o.occurred_on, start) >= 0 &&
      compareDateStr(o.occurred_on, anchorDate) <= 0,
  )
  const completed = inPeriod.filter(o => o.status === 'yes').length

  return { completed, target }
}

function getIntervalStatus(
  commitment: Commitment,
  occurrences: CommitmentOccurrence[],
  anchorDate: string,
): CommitmentCadenceStatus | null {
  if (!commitment.cadence || !isIntervalCadence(commitment.cadence)) return null

  const cycleDays = intervalCycleDays(commitment.cadence)!
  const lastYes = getLastYesDateOnOrBefore(commitment.id, occurrences, anchorDate)
  const hasPriorYes = lastYes != null
  const loggedYesOnAnchorDate = hasYesOnDate(
    commitment.id,
    occurrences,
    anchorDate,
  )
  const intervalAnchor = getIntervalAnchorDate(commitment, occurrences, anchorDate)
  const daysSince = daysBetweenDates(intervalAnchor, anchorDate)
  const dueSoonStart = cycleDays - MAP_DUE_SOON_DAYS_BEFORE_CYCLE
  const dueSoon = daysSince >= dueSoonStart && daysSince < cycleDays
  const overdue = daysSince >= cycleDays
  const daysUntilDue = dueSoon ? cycleDays - daysSince : null

  const { start, end } = periodBoundsForCadence(
    commitment.cadence,
    anchorDate,
    commitment.start_date,
  )
  const completed = occurrences.some(
    o =>
      o.commitment_id === commitment.id &&
      o.status === 'yes' &&
      compareDateStr(o.occurred_on, start) >= 0 &&
      compareDateStr(o.occurred_on, anchorDate) <= 0,
  )
    ? 1
    : 0

  return {
    mode: 'interval',
    periodTally: { completed, target: 1 },
    daysSinceLastYes: daysSince,
    loggedYesOnAnchorDate,
    hasPriorYes,
    intervalCycleDays: cycleDays,
    dueSoon,
    overdue,
    daysUntilDue,
  }
}

/** Day-view status: weekly X/Y or interval time-since + due flags. */
export function getCommitmentCadenceStatus(
  commitment: Commitment,
  occurrences: CommitmentOccurrence[],
  anchorDate: string,
): CommitmentCadenceStatus | null {
  if (!commitment.cadence) return null

  if (isIntervalCadence(commitment.cadence)) {
    return getIntervalStatus(commitment, occurrences, anchorDate)
  }

  const periodTally = getWeeklyPeriodTally(commitment, occurrences, anchorDate)
  if (!periodTally) return null

  const lastYes = getLastYesDateOnOrBefore(commitment.id, occurrences, anchorDate)
  const daysSinceLastYes = lastYes
    ? daysBetweenDates(lastYes, anchorDate)
    : daysBetweenDates(commitmentCreatedDate(commitment), anchorDate)

  return {
    mode: 'weekly',
    periodTally,
    daysSinceLastYes,
    loggedYesOnAnchorDate: hasYesOnDate(commitment.id, occurrences, anchorDate),
    hasPriorYes: lastYes != null,
    dueSoon: false,
    overdue: false,
    daysUntilDue: null,
  }
}

/** @deprecated Prefer getCommitmentCadenceStatus */
export function getCommitmentPeriodTally(
  commitment: Commitment,
  occurrences: CommitmentOccurrence[],
  anchorDate: string,
): CommitmentPeriodTally | null {
  const status = getCommitmentCadenceStatus(commitment, occurrences, anchorDate)
  return status?.periodTally ?? null
}

/** Date range for loading occurrences used in day-view cadence status. */
export function getTallyOccurrenceRange(anchorDate: string): { from: string; to: string } {
  const week = getWeekDatesForDate(anchorDate)
  return {
    from: addDays(week[0], -MAP_FOUR_WEEK_CYCLE_DAYS),
    to: addDays(week[6], MAP_FOUR_WEEK_CYCLE_DAYS),
  }
}
