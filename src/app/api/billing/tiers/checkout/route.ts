import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Returns intensive tier display data (storage, tokens) for checkout.
 * Used so Order Summary shows values from membership_tiers table (solo vs household).
 * No auth required - RLS allows reading active tiers.
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: tiers, error } = await supabase
      .from('membership_tiers')
      .select('tier_type, is_household_plan, storage_quota_gb, monthly_token_grant')
      .eq('is_active', true)
      .in('tier_type', ['intensive', 'intensive_household'])

    if (error) {
      console.error('Error fetching intensive tiers for checkout:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const solo =
      tiers?.find(
        (t) => t.tier_type === 'intensive' && (t.is_household_plan === false || t.is_household_plan == null)
      ) ?? tiers?.find((t) => t.tier_type === 'intensive')
    const household =
      tiers?.find((t) => t.tier_type === 'intensive_household' || t.is_household_plan === true) ?? null

    return NextResponse.json({
      solo: solo
        ? { storage_quota_gb: solo.storage_quota_gb ?? undefined, monthly_token_grant: solo.monthly_token_grant }
        : null,
      household: household
        ? {
            storage_quota_gb: household.storage_quota_gb ?? undefined,
            monthly_token_grant: household.monthly_token_grant,
          }
        : null,
    })
  } catch (err) {
    console.error('Tiers checkout API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
