/**
 * Billing Configuration - Display Helpers Only
 *
 * All token grants, pricing, storage quotas, and plan metadata are now
 * driven by the `membership_tiers` database table (queried via /api/billing/tiers).
 *
 * Client components: use the `useMembershipTiers` hook from @/hooks/useMembershipTiers
 * Server components: query the `membership_tiers` table directly via Supabase
 */

// ============================================================================
// TOKEN GRANTS (fallback constants - prefer membership_tiers DB table)
// ============================================================================

export const TOKEN_GRANTS = {
  INTENSIVE_TRIAL: 5_000_000,
  ANNUAL: 20_000_000,
  MONTHLY_28DAY: 1_000_000,
  HOUSEHOLD_28DAY: 1_500_000,
  HOUSEHOLD_ANNUAL: 30_000_000,
  HOUSEHOLD_INTENSIVE: 7_000_000,
  ADDON_MEMBER_MONTHLY: 100_000,
} as const

// ============================================================================
// STORAGE QUOTAS in GB (fallback constants - prefer membership_tiers DB table)
// ============================================================================

export const STORAGE_QUOTAS = {
  TRIAL: 250,
  TRIAL_SOLO: 250,
  TRIAL_HOUSEHOLD: 250,
  MONTHLY_28DAY: 250,
  ANNUAL: 500,
  HOUSEHOLD_28DAY: 250,
  HOUSEHOLD_ANNUAL: 500,
  DEFAULT: 100,
} as const

// ============================================================================
// ROLLOVER & LIMITS
// ============================================================================

export const ROLLOVER_LIMITS = {
  MONTHLY_28DAY_MAX_CYCLES: 3,
  HOUSEHOLD_MAX_MEMBERS: 6,
  HOUSEHOLD_INCLUDED_SEATS: 2,
  HOUSEHOLD_MAX_ADDONS: 4,
} as const

// ============================================================================
// PRICING in cents (fallback constants - prefer Stripe prices)
// ============================================================================

export const PRICING = {
  INTENSIVE: 49900,
  INTENSIVE_2PAY: 24950,
  INTENSIVE_3PAY: 16633,
  SOLO_ANNUAL: 99900,
  SOLO_28DAY: 9900,
  HOUSEHOLD_INTENSIVE: 69900,
  HOUSEHOLD_ANNUAL: 99900,
  HOUSEHOLD_28DAY: 14900,
  ADDON_28DAY: 1900,
  ADDON_ANNUAL: 19200,
} as const

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Format token amount for display
 * @example formatTokens(1000000) => "1,000,000"
 */
export function formatTokens(amount: number): string {
  return amount.toLocaleString()
}

/**
 * Format token amount in shorthand
 * @example formatTokensShort(1000000) => "1M"
 * @example formatTokensShort(375000) => "375k"
 */
export function formatTokensShort(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)}M`
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(amount % 1_000 === 0 ? 0 : 1)}k`
  }
  return amount.toString()
}

/**
 * Format price in cents to dollars
 * @example formatPrice(49900) => "$499"
 */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`
}

/**
 * Get display name for storage quota
 * @example formatStorage(100) => "100GB"
 */
export function formatStorage(gb: number): string {
  return `${gb}GB`
}

