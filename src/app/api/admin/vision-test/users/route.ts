import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isUserAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isUserAdmin(user)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const adminSupabase = createAdminClient()

    const { data: profiles } = await adminSupabase
      .from('user_profiles')
      .select('user_id, first_name, partner_name, city, state')
      .eq('is_active', true)
      .eq('is_draft', false)
      .order('updated_at', { ascending: false })
      .limit(50)

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ users: [] })
    }

    const { data: userAccounts } = await adminSupabase
      .from('user_accounts')
      .select('id, email')
      .in('id', profiles.map(p => p.user_id))

    const emailMap = new Map(userAccounts?.map(a => [a.id, a.email]) || [])

    const users = profiles.map(p => ({
      id: p.user_id,
      email: emailMap.get(p.user_id) || 'unknown',
      name: [p.first_name, p.city && p.state ? `(${p.city}, ${p.state})` : ''].filter(Boolean).join(' '),
    }))

    return NextResponse.json({ users })
  } catch (err) {
    console.error('[VisionTest/Users] Error:', err)
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 })
  }
}
