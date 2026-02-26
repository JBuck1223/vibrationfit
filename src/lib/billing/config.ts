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

