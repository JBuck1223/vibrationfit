import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, isUserAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ visitorId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!isUserAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { visitorId } = await params
    const adminClient = createAdminClient()

    const [
      { data: visitor, error: visitorError },
      { data: sessions },
      { data: pageViews },
      { data: journeyEvents },
    ] = await Promise.all([
      adminClient
        .from('visitors')
        .select('*')
        .eq('id', visitorId)
        .single(),
      adminClient
        .from('sessions')
        .select('*')
        .eq('visitor_id', visitorId)
        .order('started_at', { ascending: false }),
      adminClient
        .from('page_views')
        .select('*')
        .eq('visitor_id', visitorId)
        .order('created_at', { ascending: false })
        .limit(200),
      adminClient
        .from('journey_events')
        .select('*')
        .eq('visitor_id', visitorId)
        .order('created_at', { ascending: false }),
    ])

    if (visitorError || !visitor) {
      return NextResponse.json({ error: 'Visitor not found' }, { status: 404 })
    }

    let userAccount = null
    if (visitor.user_id) {
      const { data } = await adminClient
        .from('user_accounts')
        .select('id, email, full_name, first_name, last_name')
        .eq('id', visitor.user_id)
        .single()
      userAccount = data
    }

    const sessionsWithPages = (sessions || []).map(session => ({
      ...session,
      pages: (pageViews || [])
        .filter(pv => pv.session_id === session.id)
        .sort((a, b) => a.view_order - b.view_order),
    }))

    return NextResponse.json({
      visitor,
      userAccount,
      sessions: sessionsWithPages,
      journeyEvents: journeyEvents || [],
    })
  } catch (error: unknown) {
    console.error('Error in attribution detail API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
