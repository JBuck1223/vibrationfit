import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface RouteContext { params: Promise<{ id: string }> }

/**
 * Preview audience count for a campaign based on its audience_filter.
 * Queries user_profiles and/or leads depending on filter keys.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: campaign } = await supabase
      .from('messaging_campaigns')
      .select('channel, audience_filter')
      .eq('id', id)
      .single()

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const admin = createAdminClient()
    const filter = campaign.audience_filter as Record<string, unknown>
    let count = 0

    const source = (filter.source as string) || 'user_profiles'

    if (source === 'leads') {
      let query = admin.from('leads').select('id', { count: 'exact', head: true })
      if (filter.status) query = query.eq('status', filter.status)
      if (filter.lead_type) query = query.eq('lead_type', filter.lead_type)
      if (campaign.channel === 'email') query = query.not('email', 'is', null)
      if (campaign.channel === 'sms') query = query.not('phone', 'is', null).eq('sms_opt_in', true)
      const { count: c } = await query
      count = c || 0
    } else {
      let query = admin.from('user_profiles').select('id', { count: 'exact', head: true })
      if (filter.subscription_status) query = query.eq('subscription_status', filter.subscription_status)
      if (filter.role) query = query.eq('role', filter.role)
      const { count: c } = await query
      count = c || 0
    }

    await supabase
      .from('messaging_campaigns')
      .update({ audience_count: count })
      .eq('id', id)

    return NextResponse.json({ count })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
