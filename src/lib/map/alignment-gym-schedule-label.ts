/** User-facing MAP cadence line for Alignment Gym (intensive unlock Q11 activity). */
export const DEFAULT_ALIGNMENT_GYM_SCHEDULE_LABEL =
  'Committed to 1 live group coaching session per week'

export function getAlignmentGymScheduleLabel(cadence: unknown): string {
  if (!cadence || typeof cadence !== 'object') {
    return DEFAULT_ALIGNMENT_GYM_SCHEDULE_LABEL
  }

  const c = cadence as { kind?: string; count?: number }
  if (c.kind === 'daily') {
    return 'Committed to 1 live group coaching session every day'
  }
  if (c.kind === 'days_per_week' && c.count === 1) {
    return DEFAULT_ALIGNMENT_GYM_SCHEDULE_LABEL
  }
  if (c.kind === 'days_per_week' && typeof c.count === 'number') {
    return `Committed to ${c.count} live group coaching sessions per week`
  }
  if (c.kind === 'biweekly') {
    return 'Committed to 1 live group coaching session every 2 weeks'
  }
  if (c.kind === 'every_4_weeks' || c.kind === 'monthly') {
    return 'Committed to 1 live group coaching session every 4 weeks'
  }

  return DEFAULT_ALIGNMENT_GYM_SCHEDULE_LABEL
}
