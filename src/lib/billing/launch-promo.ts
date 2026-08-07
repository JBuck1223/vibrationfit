/** Solo $1 offer ($498 off $499). */
export const LAUNCH_SOLO_PROMO_CODE = 'LAUNCH2026'
/** Household $1 offer ($698 off $699). */
export const LAUNCH_HOUSEHOLD_PROMO_CODE = 'HOUSEHOLD2026'

const LAUNCH_DOLLAR_OFFER_CODES = new Set([
  LAUNCH_SOLO_PROMO_CODE,
  LAUNCH_HOUSEHOLD_PROMO_CODE,
])

/**
 * Map the $1 launch codes to the plan being purchased.
 * LAUNCH2026 is only $498 off — applying it to household leaves $201 due.
 */
export function resolveIntensiveLaunchPromoCode(
  code: string | null | undefined,
  planType?: string | null,
): string | undefined {
  if (!code?.trim()) return undefined
  const upper = code.trim().toUpperCase()
  if (!LAUNCH_DOLLAR_OFFER_CODES.has(upper)) return code.trim()
  return planType === 'household' ? LAUNCH_HOUSEHOLD_PROMO_CODE : LAUNCH_SOLO_PROMO_CODE
}
