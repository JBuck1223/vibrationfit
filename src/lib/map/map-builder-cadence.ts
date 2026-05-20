import type { MapCategory } from './types'

export const CADENCE_OPTIONS = [
  { label: 'Every day', value: JSON.stringify({ kind: 'daily' }) },
  { label: '5x per week', value: JSON.stringify({ kind: 'days_per_week', count: 5 }) },
  { label: '3x per week', value: JSON.stringify({ kind: 'days_per_week', count: 3 }) },
  { label: '2x per week', value: JSON.stringify({ kind: 'days_per_week', count: 2 }) },
  { label: '1x per week', value: JSON.stringify({ kind: 'days_per_week', count: 1 }) },
]

export const CADENCE_SELECT_OPTIONS = CADENCE_OPTIONS.map(o => ({ value: o.value, label: o.label }))

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
