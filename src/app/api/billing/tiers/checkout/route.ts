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

    const { data: tier, error } = await supabase
      .from('membership_tiers')
      .select('tier_type, is_household_plan, storage_quota_gb, monthly_token_grant')
      .eq('is_active', true)
      .eq('tier_type', 'intensive')
      .maybeSingle()

    if (error) {
      console.error('Error fetching intensive tier for checkout:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const tierData = tier
      ? { storage_quota_gb: tier.storage_quota_gb ?? undefined, monthly_token_grant: tier.monthly_token_grant }
      : null

    return NextResponse.json({
      solo: tierData,
      household: tierData,
    })
  } catch (err) {
    console.error('Tiers checkout API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
