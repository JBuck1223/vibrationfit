/** Browser could not complete the request (offline, flaky cell/Wi‑Fi, TLS stall, etc.). */
export function isTransientNetworkError(err: unknown): boolean {
  if (!err) return false
  const msg = err instanceof Error ? err.message : String(err)
  if (/failed to fetch|networkerror|load failed|network request failed|aborted/i.test(msg))
    return true
  if (err instanceof TypeError && /fetch|network|load failed/i.test(msg)) return true
  return false
}
