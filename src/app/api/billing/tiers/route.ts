import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET() {
  try {
    const { data: tiers, error } = await supabaseAdmin
      .from('membership_tiers')
      .select(`
        id, name, description, tier_type, is_active,
        price_monthly, price_yearly, billing_interval,
        monthly_token_grant, annual_token_grant,
        storage_quota_gb, included_seats, max_household_members,
        rollover_max_cycles, plan_category, is_household_plan,
        features, is_popular, display_order
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Tiers API error:', error)
      return NextResponse.json({ error: 'Failed to fetch tiers' }, { status: 500 })
    }

    return NextResponse.json(
      { tiers },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
    )
  } catch (error) {
    console.error('Tiers API error:', error)
    return NextResponse.json({ error: 'Failed to fetch tiers' }, { status: 500 })
  }
}
