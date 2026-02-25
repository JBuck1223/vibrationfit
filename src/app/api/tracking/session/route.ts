import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      visitorId,
      sessionId,
      isNewVisitor,
      isNewSession,
      landingPage,
      referrer,
      urlParams,
      device,
    } = body as {
      visitorId: string
      sessionId: string
      isNewVisitor: boolean
      isNewSession: boolean
      landingPage?: string
      referrer?: string | null
      urlParams?: Record<string, string>
      device?: { deviceType?: string; browser?: string; os?: string }
    }

    if (!visitorId || !sessionId) {
      return NextResponse.json({ error: 'Missing ids' }, { status: 400 })
    }

    const utmSource = urlParams?.utm_source || null
    const utmMedium = urlParams?.utm_medium || null
    const utmCampaign = urlParams?.utm_campaign || null
    const utmContent = urlParams?.utm_content || null
    const utmTerm = urlParams?.utm_term || null
    const gclid = urlParams?.gclid || null
    const fbclid = urlParams?.fbclid || null
    const msclkid = urlParams?.msclkid || null
    const ttclid = urlParams?.ttclid || null

    if (isNewVisitor) {
      const { error: visitorErr } = await supabase.from('visitors').insert({
        id: visitorId,
        fingerprint: visitorId,
        first_landing_page: landingPage || null,
        first_referrer: referrer || null,
        first_utm_source: utmSource,
        first_utm_medium: utmMedium,
        first_utm_campaign: utmCampaign,
        first_utm_content: utmContent,
        first_utm_term: utmTerm,
        first_gclid: gclid,
        first_fbclid: fbclid,
        first_msclkid: msclkid,
        first_ttclid: ttclid,
        first_url_params: urlParams || {},
        last_utm_source: utmSource,
        last_utm_medium: utmMedium,
        last_utm_campaign: utmCampaign,
        session_count: 1,
        first_seen_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
      })
      if (visitorErr) console.error('Failed to insert visitor:', visitorErr)
    } else {
      const updates: Record<string, unknown> = {
        last_seen_at: new Date().toISOString(),
      }
      if (isNewSession) {
        updates.session_count = undefined // incremented below via rpc or raw
      }
      if (utmSource) {
        updates.last_utm_source = utmSource
        updates.last_utm_medium = utmMedium
        updates.last_utm_campaign = utmCampaign
      }

      if (isNewSession) {
        // Increment session_count atomically
        const { data: visitor } = await supabase
          .from('visitors')
          .select('session_count')
          .eq('id', visitorId)
          .single()

        await supabase
          .from('visitors')
          .update({
            ...updates,
            session_count: (visitor?.session_count || 0) + 1,
          })
          .eq('id', visitorId)
      } else {
        await supabase
          .from('visitors')
          .update(updates)
          .eq('id', visitorId)
      }
    }

    if (isNewSession) {
      const { error: sessionErr } = await supabase.from('sessions').insert({
        id: sessionId,
        visitor_id: visitorId,
        landing_page: landingPage || null,
        referrer: referrer || null,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        utm_content: utmContent,
        utm_term: utmTerm,
        gclid,
        fbclid,
        msclkid,
        ttclid,
        li_fat_id: urlParams?.li_fat_id || null,
        gbraid: urlParams?.gbraid || null,
        wbraid: urlParams?.wbraid || null,
        url_params: urlParams || {},
        device_type: device?.deviceType || null,
        browser: device?.browser || null,
        os: device?.os || null,
        started_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
      })
      if (sessionErr) console.error('Failed to insert session:', sessionErr)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Tracking session error:', error)
    return NextResponse.json({ ok: true })
  }
}
