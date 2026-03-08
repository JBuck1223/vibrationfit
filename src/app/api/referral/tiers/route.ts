import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const adminDb = createAdminClient()

    const { data: tiers, error } = await adminDb
      .from('referral_reward_tiers')
      .select('id, tier_name, tier_order, min_email_signups, min_paid_conversions, reward_type, reward_value, description')
      .eq('is_active', true)
      .order('tier_order', { ascending: true })

    if (error) {
      console.error('[referral/tiers] Error:', error)
      return NextResponse.json({ error: 'Failed to fetch tiers' }, { status: 500 })
    }

    return NextResponse.json({ tiers: tiers || [] })
  } catch (error) {
    console.error('[referral/tiers] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
