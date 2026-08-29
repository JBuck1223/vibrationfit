import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

interface PerformanceRow {
  utm_source: string
  utm_medium: string
  utm_campaign: string
  visitors: number
  sessions: number
  pageviews: number
  engaged_visitors: number
  video_starts: number
  video_25: number
  video_50: number
  video_75: number
  video_95: number
  leads: number
  purchases: number
  revenue_cents: number
  spend: number
  budget: number
}

/**
 * Campaign performance rollup. First-touch visitor cohorts: every visitor
 * whose first touch landed in the window, grouped by first-touch UTM triple,
 * with all downstream engagement / leads / revenue credited to that touch.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { searchParams } = new URL(request.url)
    const dateRange = parseInt(searchParams.get('date_range') || '30', 10)

    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - (Number.isFinite(dateRange) ? dateRange : 30))

    const adminClient = createAdminClient()
    const { data, error } = await adminClient.rpc('get_marketing_performance', {
      p_start: start.toISOString(),
      p_end: end.toISOString(),
    })

    if (error) {
      console.error('Marketing performance RPC error:', error)
      return NextResponse.json({ error: 'Failed to fetch performance data' }, { status: 500 })
    }

    const rows = (data || []) as PerformanceRow[]

    const totals = rows.reduce(
      (acc, r) => ({
        visitors: acc.visitors + Number(r.visitors),
        sessions: acc.sessions + Number(r.sessions),
        pageviews: acc.pageviews + Number(r.pageviews),
        engaged_visitors: acc.engaged_visitors + Number(r.engaged_visitors),
        video_starts: acc.video_starts + Number(r.video_starts),
        video_25: acc.video_25 + Number(r.video_25),
        video_50: acc.video_50 + Number(r.video_50),
        video_75: acc.video_75 + Number(r.video_75),
        video_95: acc.video_95 + Number(r.video_95),
        leads: acc.leads + Number(r.leads),
        purchases: acc.purchases + Number(r.purchases),
        revenue_cents: acc.revenue_cents + Number(r.revenue_cents),
        spend: acc.spend + Number(r.spend),
      }),
      {
        visitors: 0,
        sessions: 0,
        pageviews: 0,
        engaged_visitors: 0,
        video_starts: 0,
        video_25: 0,
        video_50: 0,
        video_75: 0,
        video_95: 0,
        leads: 0,
        purchases: 0,
        revenue_cents: 0,
        spend: 0,
      }
    )

    return NextResponse.json({ rows, totals, start: start.toISOString(), end: end.toISOString() })
  } catch (error: unknown) {
    console.error('Error in marketing performance API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
