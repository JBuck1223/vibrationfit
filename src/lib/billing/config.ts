/**
 * Billing Configuration - Static Reference
 * 
 * ⚠️ NOTE: This is a STATIC reference file for development.
 * The TRUE source of truth is the `membership_tiers` database table.
 * 
 * TODO: Update this file to fetch from `membership_tiers` table dynamically.
 * For now, keep these values in sync with the database manually.
 * 
 * See migration: 20251115000002_upgrade_membership_tiers.sql
 * 
 * Last Updated: November 15, 2025
 */

// ============================================================================
// TOKEN GRANTS
// ============================================================================

export const TOKEN_GRANTS = {
  // Intensive Purchase - 5M tokens, no expiration
  INTENSIVE_TRIAL: 5_000_000,
  
  // Annual Plan - 20M tokens granted immediately on subscription
  ANNUAL: 20_000_000,
  
  // 28-Day Plan - 1M tokens dripped every 28 days
  MONTHLY_28DAY: 1_000_000,
  
  // Household Plans - Token allocation for 2-person households
  HOUSEHOLD_28DAY: 1_500_000,      // 1.5M per 28-day cycle
  HOUSEHOLD_ANNUAL: 30_000_000,    // 30M total (shared or split)
  HOUSEHOLD_INTENSIVE: 7_500_000,  // 7.5M tokens, no expiration
  
  // Add-on Members - Individual token allocation
  ADDON_MEMBER_MONTHLY: 100_000, // 100k per add-on member per month
} as const

// ============================================================================
// STORAGE QUOTAS (in GB)
// ============================================================================

export const STORAGE_QUOTAS = {
  // Trial (Intensive) - no specific storage quota (uses default)
  TRIAL: 100,
  
  // 28-Day Plans
  MONTHLY_28DAY: 250,
  
  // Annual Plan
  ANNUAL: 500,
  
  // Household Plans
  HOUSEHOLD_28DAY: 250,   // Shared across all household members
  HOUSEHOLD_ANNUAL: 500,  // Shared across all household members
  
  // Default fallback
  DEFAULT: 100,
} as const

// ============================================================================
// ROLLOVER & LIMITS
// ============================================================================

export const ROLLOVER_LIMITS = {
  // 28-Day Plan - Maximum number of billing cycles tokens can roll over
  MONTHLY_28DAY_MAX_CYCLES: 3,
  
  // Household - Maximum number of members (including base 2 seats)
  HOUSEHOLD_MAX_MEMBERS: 6,
  HOUSEHOLD_INCLUDED_SEATS: 2,
  HOUSEHOLD_MAX_ADDONS: 4,
} as const

// ============================================================================
// PRICING (in cents for Stripe)
// ============================================================================

export const PRICING = {
  // Intensive
  INTENSIVE: 49900,              // $499
  INTENSIVE_2PAY: 24950,         // $249.50
  INTENSIVE_3PAY: 16633,         // $166.33
  
  // Solo Plans
  SOLO_ANNUAL: 99900,            // $999/year
  SOLO_28DAY: 9900,              // $99/28-days
  
  // Household Plans
  HOUSEHOLD_INTENSIVE: 69900,    // $699 (intensive for 2)
  HOUSEHOLD_ANNUAL: 99900,       // TBD - placeholder
  HOUSEHOLD_28DAY: 14900,        // $149/28-days (2 seats)
  
  // Add-on Members
  ADDON_28DAY: 1900,             // $19/28-days per member
  ADDON_ANNUAL: 19200,           // $192/year per member
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

// ============================================================================
// PLAN METADATA
// ============================================================================

export const PLAN_METADATA = {
  annual: {
    name: 'Vision Pro Annual',
    tokens: TOKEN_GRANTS.ANNUAL,
    storage: STORAGE_QUOTAS.ANNUAL,
    price: PRICING.SOLO_ANNUAL,
    interval: 'year',
    features: [
      'VibrationFit platform access',
      'Life Vision Builder and Assistant (12 Categories)',
      'Vision Boards, Vision Audio, Immersion Tracks',
      `VIVA AI assistant (${formatTokensShort(TOKEN_GRANTS.ANNUAL)} tokens)`,
      'Journal, community access',
      'Activation history & progress tracking',
      'Library access & future features',
      'Transparent renewal timing (starts Day 56)',
      `${STORAGE_QUOTAS.ANNUAL}GB storage`,
      'Priority response queue',
      '60-day satisfaction guarantee',
      'Price locked for 12 months',
      '4 bonus calibration check-ins per year',
    ],
  },
  monthly_28day: {
    name: 'Vision Pro 28-Day',
    tokens: TOKEN_GRANTS.MONTHLY_28DAY,
    storage: STORAGE_QUOTAS.MONTHLY_28DAY,
    price: PRICING.SOLO_28DAY,
    interval: '28 days',
    features: [
      'VibrationFit platform access',
      'Life Vision Builder and Assistant (12 Categories)',
      'Vision Boards, Vision Audio, Immersion Tracks',
      `VIVA AI assistant (${formatTokensShort(TOKEN_GRANTS.MONTHLY_28DAY)} tokens per 28 days)`,
      'Journal, community access',
      'Activation history & progress tracking',
      'Library access & future features',
      'Transparent renewal timing (starts Day 56)',
      `${STORAGE_QUOTAS.MONTHLY_28DAY}GB storage`,
      'Standard support queue',
      '30-day satisfaction guarantee',
      'Flexible - cancel any cycle',
      `Unused tokens roll over (max ${ROLLOVER_LIMITS.MONTHLY_28DAY_MAX_CYCLES} cycles)`,
    ],
  },
  household_28day: {
    name: 'Vision Pro Household 28-Day',
    tokens: TOKEN_GRANTS.HOUSEHOLD_28DAY,
    storage: STORAGE_QUOTAS.HOUSEHOLD_28DAY,
    price: PRICING.HOUSEHOLD_28DAY,
    interval: '28 days',
    seats: ROLLOVER_LIMITS.HOUSEHOLD_INCLUDED_SEATS,
    maxSeats: ROLLOVER_LIMITS.HOUSEHOLD_MAX_MEMBERS,
    features: [
      'Full platform access for 2 people',
      `${formatTokensShort(TOKEN_GRANTS.HOUSEHOLD_28DAY)} tokens/28-days`,
      'All Vision Pro features',
      'Optional token sharing',
      'Add up to 4 more members',
      `$${(PRICING.ADDON_28DAY / 100).toFixed(0)}/28-days per additional member`,
    ],
  },
  household_annual: {
    name: 'Vision Pro Household Annual',
    tokens: TOKEN_GRANTS.HOUSEHOLD_ANNUAL,
    storage: STORAGE_QUOTAS.HOUSEHOLD_ANNUAL,
    price: PRICING.HOUSEHOLD_ANNUAL,
    interval: 'year',
    seats: ROLLOVER_LIMITS.HOUSEHOLD_INCLUDED_SEATS,
    maxSeats: ROLLOVER_LIMITS.HOUSEHOLD_MAX_MEMBERS,
    features: [
      'Full platform access for 2 people',
      `${formatTokensShort(TOKEN_GRANTS.HOUSEHOLD_ANNUAL)} tokens/year`,
      'All Vision Pro features',
      'Optional token sharing',
      'Add up to 4 more members',
      `$${(PRICING.ADDON_ANNUAL / 100).toFixed(0)}/year per additional member`,
    ],
  },
} as const

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type PlanType = keyof typeof PLAN_METADATA
export type TokenGrantType = keyof typeof TOKEN_GRANTS
export type StorageQuotaType = keyof typeof STORAGE_QUOTAS

