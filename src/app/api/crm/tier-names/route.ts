export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('membership_tiers')
      .select('name')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const tiers = ['Free', ...(data || []).map((t) => t.name).filter(Boolean)]

    return NextResponse.json({ tiers })
  } catch (error) {
    console.error('[tier-names] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
