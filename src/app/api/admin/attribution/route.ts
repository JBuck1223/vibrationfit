import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { searchParams } = new URL(request.url)
    const source = searchParams.get('source')
    const medium = searchParams.get('medium')
    const dateRange = searchParams.get('date_range') || '30'
    const onlyConverted = searchParams.get('converted') === 'true'

    const adminClient = createAdminClient()

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(dateRange))

    let visitorsQuery = adminClient
      .from('visitors')
      .select('*')
      .gte('first_seen_at', cutoffDate.toISOString())
      .order('first_seen_at', { ascending: false })
      .limit(500)

    if (source && source !== 'all') {
      if (source === 'direct') {
        visitorsQuery = visitorsQuery.is('first_utm_source', null)
      } else {
        visitorsQuery = visitorsQuery.eq('first_utm_source', source)
      }
    }
    if (medium && medium !== 'all') {
      visitorsQuery = visitorsQuery.eq('first_utm_medium', medium)
    }
    if (onlyConverted) {
      visitorsQuery = visitorsQuery.not('user_id', 'is', null)
    }

    const { data: visitors, error: visitorsError } = await visitorsQuery

    if (visitorsError) {
      console.error('Error fetching visitors:', visitorsError)
      return NextResponse.json({ error: 'Failed to fetch visitors' }, { status: 500 })
    }

    const userIds = (visitors || [])
      .filter(v => v.user_id)
      .map(v => v.user_id as string)

    let userAccountsMap: Record<string, { email: string; full_name: string }> = {}
    if (userIds.length > 0) {
      const { data: accounts } = await adminClient
        .from('user_accounts')
        .select('id, email, full_name')
        .in('id', userIds)

      if (accounts) {
        userAccountsMap = Object.fromEntries(
          accounts.map(a => [a.id, { email: a.email, full_name: a.full_name }])
        )
      }
    }

    const enrichedVisitors = (visitors || []).map(v => ({
      id: v.id,
      first_landing_page: v.first_landing_page,
      first_referrer: v.first_referrer,
      first_utm_source: v.first_utm_source,
      first_utm_medium: v.first_utm_medium,
      first_utm_campaign: v.first_utm_campaign,
      first_utm_content: v.first_utm_content,
      first_utm_term: v.first_utm_term,
      first_gclid: v.first_gclid,
      first_fbclid: v.first_fbclid,
      session_count: v.session_count,
      total_pageviews: v.total_pageviews,
      user_id: v.user_id,
      first_seen_at: v.first_seen_at,
      last_seen_at: v.last_seen_at,
      converted: !!v.user_id,
      user_email: v.user_id ? userAccountsMap[v.user_id]?.email : null,
      user_name: v.user_id ? userAccountsMap[v.user_id]?.full_name : null,
    }))

    // Aggregate source breakdown
    const allVisitors = visitors || []
    const sourceBreakdown: Record<string, { visitors: number; converted: number }> = {}
    for (const v of allVisitors) {
      const src = v.first_utm_source || 'direct'
      if (!sourceBreakdown[src]) {
        sourceBreakdown[src] = { visitors: 0, converted: 0 }
      }
      sourceBreakdown[src].visitors++
      if (v.user_id) sourceBreakdown[src].converted++
    }

    const sources = Object.entries(sourceBreakdown)
      .map(([name, data]) => ({
        name,
        visitors: data.visitors,
        converted: data.converted,
        conversionRate: data.visitors > 0
          ? Math.round((data.converted / data.visitors) * 100)
          : 0,
      }))
      .sort((a, b) => b.visitors - a.visitors)

    // Unique mediums for filter
    const mediums = [...new Set(allVisitors.map(v => v.first_utm_medium).filter(Boolean))]

    return NextResponse.json({
      visitors: enrichedVisitors,
      sources,
      mediums,
      totals: {
        visitors: allVisitors.length,
        converted: allVisitors.filter(v => v.user_id).length,
        sessions: allVisitors.reduce((sum, v) => sum + (v.session_count || 0), 0),
        pageviews: allVisitors.reduce((sum, v) => sum + (v.total_pageviews || 0), 0),
      },
    })
  } catch (error: unknown) {
    console.error('Error in attribution API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
