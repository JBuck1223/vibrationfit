type AutoVerifyInput =
  | string
  | {
      area?: string
      activityType?: string
      occurredOn?: string
    }

/**
 * Client-side helper: fire-and-forget auto-verify via API.
 */
export async function autoVerifyClient(input: AutoVerifyInput): Promise<void> {
  try {
    const body =
      typeof input === 'string'
        ? { area: input }
        : {
            area: input.area,
            activityType: input.activityType,
            occurredOn: input.occurredOn,
          }

    await fetch('/api/map/auto-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    // Silent failure — auto-verify is best-effort
  }
}
