import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: NextRequest) {
  try {
    const { visitorId, sessionId, pagePath, pageTitle } = await request.json()

    if (!visitorId || !sessionId || !pagePath) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const { data: session } = await supabase
      .from('sessions')
      .select('pageview_count')
      .eq('id', sessionId)
      .single()

    const viewOrder = (session?.pageview_count || 0) + 1

    await supabase.from('page_views').insert({
      session_id: sessionId,
      visitor_id: visitorId,
      page_path: pagePath,
      page_title: pageTitle || null,
      view_order: viewOrder,
    })

    await supabase
      .from('sessions')
      .update({
        pageview_count: viewOrder,
        last_activity_at: new Date().toISOString(),
      })
      .eq('id', sessionId)

    const { data: visitor } = await supabase
      .from('visitors')
      .select('total_pageviews')
      .eq('id', visitorId)
      .single()

    await supabase
      .from('visitors')
      .update({
        total_pageviews: (visitor?.total_pageviews || 0) + 1,
        last_seen_at: new Date().toISOString(),
      })
      .eq('id', visitorId)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Tracking pageview error:', error)
    return NextResponse.json({ ok: true })
  }
}
