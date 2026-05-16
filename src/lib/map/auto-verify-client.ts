/**
 * Client-side helper: fire-and-forget auto-verify via API.
 */
export async function autoVerifyClient(areaKey: string): Promise<void> {
  try {
    await fetch('/api/map/auto-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ area: areaKey }),
    })
  } catch {
    // Silent failure — auto-verify is best-effort
  }
}
