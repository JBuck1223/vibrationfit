/**
 * Profile version for UI/API always comes from `get_profile_version_number` RPC.
 * Do not use `user_profiles.version_number` — it is not authoritative.
 *
 * Use this to normalize the RPC return value only (never merge with a row column).
 */
export function normalizeProfileVersionFromRpc(calculated: unknown): number {
  if (typeof calculated === 'number' && Number.isFinite(calculated) && calculated >= 1) {
    return calculated
  }
  if (typeof calculated === 'string' && /^\d+$/.test(calculated)) {
    const n = parseInt(calculated, 10)
    if (n >= 1) return n
  }
  return 1
}
