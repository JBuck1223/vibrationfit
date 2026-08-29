import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { rateLimit } from '@/lib/rate-limit'
import { sendServerEngagement, type EngagementEventName } from '@/lib/tracking/server-conversions'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const VALID_EVENTS: EngagementEventName[] = [
  'page_engagement',
  'video_start',
  'video_milestone',
  'video_complete',
]

/**
 * First-party engagement ingestion: video milestones (25/50/75/95), video
 * start/complete, and page engagement (dwell + scroll depth).
 *
 * Each event carries a client-generated eventId that the browser pixel also
 * fired as eventID -- the server mirrors the event to Meta CAPI / GA4 with the
 * same ID so Meta dedups, and every event lands in engagement_events for
 * first-party reporting.
 *
 * page_engagement supports a follow-up "final" beacon (same eventId) sent on
 * pagehide that updates dwell/scroll on the existing row without re-firing
 * platform events.
 */
export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, 'tracking-events', 120)
  if (limited) return limited

  try {
    const body = await request.json()
    const {
      visitorId,
      sessionId,
      eventName,
      eventId,
      pagePath,
      videoId,
      milestonePercent,
      watchTimeSeconds,
      dwellSeconds,
      scrollDepthPercent,
      engaged,
    } = body as {
      visitorId?: string
      sessionId?: string
      eventName: EngagementEventName
      eventId: string
      pagePath?: string
      videoId?: string
      milestonePercent?: 25 | 50 | 75 | 95
      watchTimeSeconds?: number
      dwellSeconds?: number
      scrollDepthPercent?: number
      engaged?: boolean
    }

    if (!eventId || !VALID_EVENTS.includes(eventName)) {
      return NextResponse.json({ error: 'Invalid event' }, { status: 400 })
    }
    if (eventName === 'video_milestone' && ![25, 50, 75, 95].includes(milestonePercent as number)) {
      return NextResponse.json({ error: 'Invalid milestone' }, { status: 400 })
    }

    const isEngaged = engaged !== false

    // Meta browser identifiers come along on the same-origin request
    const fbp = request.cookies.get('_fbp')?.value || null
    const fbc = request.cookies.get('_fbc')?.value || null

    const { data: existing } = await supabase
      .from('engagement_events')
      .select('id')
      .eq('event_id', eventId)
      .maybeSingle()

    if (existing) {
      // Final beacon: refresh measurements only, never re-fire platform events
      const updates: Record<string, unknown> = {}
      if (dwellSeconds != null) updates.dwell_seconds = Math.round(dwellSeconds)
      if (scrollDepthPercent != null) updates.scroll_depth_percent = Math.round(scrollDepthPercent)
      if (watchTimeSeconds != null) updates.watch_time_seconds = Math.round(watchTimeSeconds * 10) / 10
      if (isEngaged) updates.engaged = true
      if (Object.keys(updates).length > 0) {
        await supabase.from('engagement_events').update(updates).eq('event_id', eventId)
      }
    } else {
      const { error: insertErr } = await supabase.from('engagement_events').insert({
        visitor_id: visitorId || null,
        session_id: sessionId || null,
        event_name: eventName,
        event_id: eventId,
        page_path: pagePath || null,
        video_id: videoId || null,
        milestone_percent: milestonePercent ?? null,
        watch_time_seconds: watchTimeSeconds != null ? Math.round(watchTimeSeconds * 10) / 10 : null,
        dwell_seconds: dwellSeconds != null ? Math.round(dwellSeconds) : null,
        scroll_depth_percent: scrollDepthPercent != null ? Math.round(scrollDepthPercent) : null,
        engaged: isEngaged,
      })
      if (insertErr) {
        console.error('[Tracking Events] insert failed:', insertErr)
      } else if (isEngaged) {
        // Enrich user matching from the visitor record when cookies are absent
        let storedFbc: string | null = null
        let storedFbp: string | null = null
        let fbclid: string | null = null
        if (visitorId && (!fbc || !fbp)) {
          const { data: visitor } = await supabase
            .from('visitors')
            .select('first_fbclid, first_fbc, first_fbp')
            .eq('id', visitorId)
            .maybeSingle()
          fbclid = (visitor?.first_fbclid as string) || null
          storedFbc = (visitor?.first_fbc as string) || null
          storedFbp = (visitor?.first_fbp as string) || null
        }

        sendServerEngagement({
          eventName,
          eventId,
          eventSourceUrl: pagePath ? `https://vibrationfit.com${pagePath}` : undefined,
          videoId: videoId || null,
          milestonePercent: milestonePercent ?? null,
          watchTimeSeconds: watchTimeSeconds ?? null,
          dwellSeconds: dwellSeconds ?? null,
          scrollDepthPercent: scrollDepthPercent ?? null,
          fbc: fbc || storedFbc,
          fbclid,
          fbp: fbp || storedFbp,
          ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null,
          userAgent: request.headers.get('user-agent') || null,
          visitorId: visitorId || null,
        }).catch((err) => console.error('[Tracking Events] server engagement error:', err))
      }
    }

    // Keep visitor Meta identifiers fresh (pixel cookies appear after first load)
    if (visitorId && (fbp || fbc)) {
      const { data: visitor } = await supabase
        .from('visitors')
        .select('first_fbp, first_fbc')
        .eq('id', visitorId)
        .maybeSingle()
      if (visitor && (!visitor.first_fbp || !visitor.first_fbc)) {
        const updates: Record<string, unknown> = {}
        if (!visitor.first_fbp && fbp) updates.first_fbp = fbp
        if (!visitor.first_fbc && fbc) updates.first_fbc = fbc
        if (Object.keys(updates).length > 0) {
          await supabase.from('visitors').update(updates).eq('id', visitorId)
        }
      }
    }

    // Page engagement doubles as the time-on-page recorder
    if (eventName === 'page_engagement' && sessionId && pagePath && dwellSeconds != null) {
      const { data: pv } = await supabase
        .from('page_views')
        .select('id')
        .eq('session_id', sessionId)
        .eq('page_path', pagePath)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (pv) {
        await supabase
          .from('page_views')
          .update({ time_on_page_seconds: Math.round(dwellSeconds) })
          .eq('id', pv.id)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Tracking events error:', error)
    return NextResponse.json({ ok: true })
  }
}
