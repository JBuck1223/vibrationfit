import { todayDateString } from '@/lib/map/map-date-utils'

type AutoVerifyInput =
  | string
  | {
      area?: string
      activityType?: string
      occurredOn?: string
    }

/**
 * Client-side helper: fire-and-forget auto-verify via API.
 * Always sends the user's local calendar date so verification matches MAP day view.
 */
export async function autoVerifyClient(input: AutoVerifyInput): Promise<void> {
  try {
    const localToday = todayDateString()
    const body =
      typeof input === 'string'
        ? { area: input, occurredOn: localToday }
        : {
            area: input.area,
            activityType: input.activityType,
            occurredOn: input.occurredOn ?? localToday,
          }

    const res = await fetch('/api/map/auto-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('map:occurrence-verified'))
    }
  } catch {
    // Silent failure — auto-verify is best-effort
  }
}
