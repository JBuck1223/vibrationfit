import { getActivityDefinition } from './activities'
import { isPillarCategory } from './commitment-classification'
import { normalizeReminderTimeForPicker } from './reminder-time'
import type { Cadence, Commitment, MapCategory } from './types'

export const CADENCE_OPTIONS = [
  { label: 'Every day', value: JSON.stringify({ kind: 'daily' }) },
  { label: '5x per week', value: JSON.stringify({ kind: 'days_per_week', count: 5 }) },
  { label: '3x per week', value: JSON.stringify({ kind: 'days_per_week', count: 3 }) },
  { label: '2x per week', value: JSON.stringify({ kind: 'days_per_week', count: 2 }) },
  { label: '1x per week', value: JSON.stringify({ kind: 'days_per_week', count: 1 }) },
]

/** Custom commitments only — includes less-frequent cadences. */
export const CUSTOM_CADENCE_OPTIONS = [
  ...CADENCE_OPTIONS,
  { label: 'Every 2 weeks', value: JSON.stringify({ kind: 'biweekly' }) },
  { label: 'Every 4 weeks', value: JSON.stringify({ kind: 'every_4_weeks' }) },
]

export const CADENCE_SELECT_OPTIONS = CADENCE_OPTIONS.map(o => ({ value: o.value, label: o.label }))

export function formatCadenceLabel(cadenceJson: string): string {
  const match = CUSTOM_CADENCE_OPTIONS.find(o => o.value === cadenceJson)
  if (match) return match.label
  try {
    const c = JSON.parse(cadenceJson) as { kind?: string; count?: number }
    if (c.kind === 'daily') return 'Every day'
    if (c.kind === 'days_per_week' && typeof c.count === 'number') {
      return `${c.count}x per week`
    }
    if (c.kind === 'biweekly') return 'Every 2 weeks'
    if (c.kind === 'every_4_weeks' || c.kind === 'monthly') return 'Every 4 weeks'
  } catch {
    // ignore
  }
  return ''
}

export function daysForCadence(cadenceJson: string): number[] {
  try {
    const c = JSON.parse(cadenceJson)
    if (c.kind === 'daily') return [0, 1, 2, 3, 4, 5, 6]
    const count = c.count || 1
    if (count >= 6) return [1, 2, 3, 4, 5, 6]
    if (count === 5) return [1, 2, 3, 4, 5]
    if (count === 4) return [1, 2, 4, 5]
    if (count === 3) return [1, 3, 5]
    if (count === 2) return [2, 4]
    return [1]
  } catch {
    return [1]
  }
}

export function maxSelectableDaysFromCadenceJson(cadenceJson: string): number {
  try {
    const c = JSON.parse(cadenceJson)
    if (c.kind === 'daily') return 7
    if (c.kind === 'days_per_week' && typeof c.count === 'number')
      return Math.min(7, Math.max(1, c.count))
    return 1
  } catch {
    return 1
  }
}

export type BuilderSelection = {
  activityType: string
  cadenceJson: string
  notifySms: boolean
  notifyEmail: boolean
  reminderTime: string
  reminderDays: number[]
}

export type BuilderSelectionsState = Record<MapCategory, BuilderSelection[]>

export function isDailyCadence(cadenceJson: string): boolean {
  try {
    return JSON.parse(cadenceJson).kind === 'daily'
  } catch {
    return false
  }
}

/** Map stored cadence to a system-builder select value. */
export function cadenceToBuilderJson(cadence: Cadence | null): string {
  if (!cadence) return CADENCE_OPTIONS[0].value
  const json = JSON.stringify(cadence)
  const exact = CADENCE_OPTIONS.find(o => o.value === json)
  if (exact) return exact.value
  if (cadence.kind === 'daily') return CADENCE_OPTIONS[0].value
  if (cadence.kind === 'days_per_week') {
    const match = CADENCE_OPTIONS.find(o => {
      try {
        const p = JSON.parse(o.value) as { kind?: string; count?: number }
        return p.kind === 'days_per_week' && p.count === cadence.count
      } catch {
        return false
      }
    })
    return match?.value ?? CADENCE_OPTIONS[0].value
  }
  return json
}

export function builderSelectionFromCommitment(c: Commitment): BuilderSelection | null {
  if (!c.activity_type) return null
  const activity = getActivityDefinition(c.activity_type)
  if (!activity) return null

  const cadenceJson = cadenceToBuilderJson(c.cadence)
  const usesPublished = activity.usesPublishedSchedule === true

  return {
    activityType: c.activity_type,
    cadenceJson,
    notifySms: usesPublished ? false : !!c.notify_sms,
    notifyEmail: usesPublished ? false : !!c.notify_email,
    reminderTime: usesPublished
      ? ''
      : normalizeReminderTimeForPicker(c.reminder_time) || activity.defaultTimeOfDay || '',
    reminderDays:
      Array.isArray(c.reminder_days) && c.reminder_days.length > 0
        ? [...c.reminder_days]
        : daysForCadence(cadenceJson),
  }
}

/** Rebuild system MAP builder state from active pillar commitments. */
export function builderSelectionsFromSystemCommitments(
  system: Commitment[],
): BuilderSelectionsState {
  const state: BuilderSelectionsState = {
    activations: [],
    creations: [],
    connections: [],
    sessions: [],
  }
  for (const c of system) {
    const sel = builderSelectionFromCommitment(c)
    if (!sel || !isPillarCategory(c.category)) continue
    state[c.category].push(sel)
  }
  return state
}
