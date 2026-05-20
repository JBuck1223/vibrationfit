import { getActivityDefinition } from './activities'
import type { ActivityDefinition } from './activities'

/** Rituals Intensive members have already used — selectable on first MAP. */
export const INTENSIVE_SELECTABLE_ACTIVITY_TYPES = [
  'vision_audio',
  'vision_read',
  'vision_board_view',
  'vision_board_update',
  'journal_entry',
  'vibe_tribe_post',
  'vibe_tribe_engage',
  'alignment_gym',
] as const

export type IntensiveSelectableActivityType = (typeof INTENSIVE_SELECTABLE_ACTIVITY_TYPES)[number]

export function isIntensiveSelectableActivity(activity: ActivityDefinition): boolean {
  return (INTENSIVE_SELECTABLE_ACTIVITY_TYPES as readonly string[]).includes(activity.type)
}

/** Pre-enable email reminders on starter MAP commitments (user can turn off). */
export function intensiveReminderDefaults(activity: ActivityDefinition): {
  notifySms: boolean
  notifyEmail: boolean
  reminderTime: string
} {
  if (activity.usesPublishedSchedule) {
    return { notifySms: false, notifyEmail: false, reminderTime: '' }
  }
  return {
    notifySms: false,
    notifyEmail: true,
    reminderTime: activity.defaultTimeOfDay || '09:00',
  }
}

export interface IntensiveDefaultSelection {
  activityType: IntensiveSelectableActivityType
  cadenceJson: string
}

/** Starter MAP: one commitment per pillar, tied to Intensive steps 5–12. */
export const INTENSIVE_DEFAULT_SELECTIONS: IntensiveDefaultSelection[] = [
  { activityType: 'vision_audio', cadenceJson: JSON.stringify({ kind: 'daily' }) },
  { activityType: 'journal_entry', cadenceJson: JSON.stringify({ kind: 'daily' }) },
  {
    activityType: 'vibe_tribe_engage',
    cadenceJson: JSON.stringify({ kind: 'days_per_week', count: 2 }),
  },
  { activityType: 'alignment_gym', cadenceJson: JSON.stringify({ kind: 'days_per_week', count: 1 }) },
]
