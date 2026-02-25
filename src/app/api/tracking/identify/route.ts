import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

/**
 * The waterfall: link a visitor to a user, create the customers SSOT row,
 * and copy first-touch attribution from visitor -> customers.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      visitorId,
      sessionId,
      userId,
      stripeCustomerId,
      leadId,
      email,
    } = body as {
      visitorId?: string
      sessionId?: string
      userId: string
      stripeCustomerId?: string
      leadId?: string
      email?: string
    }

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    // Fetch visitor attribution if we have a visitorId
    let visitor: Record<string, unknown> | null = null
    if (visitorId) {
      const { data } = await supabase
        .from('visitors')
        .select('*')
        .eq('id', visitorId)
        .single()
      visitor = data

      // Link visitor to user
      if (visitor && !visitor.user_id) {
        await supabase
          .from('visitors')
          .update({ user_id: userId })
          .eq('id', visitorId)
      }
    }

    // Create or update the customers SSOT row
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (!existingCustomer) {
      await supabase.from('customers').insert({
        user_id: userId,
        visitor_id: visitorId || null,
        stripe_customer_id: stripeCustomerId || null,
        lead_id: leadId || null,

        first_utm_source: (visitor?.first_utm_source as string) || null,
        first_utm_medium: (visitor?.first_utm_medium as string) || null,
        first_utm_campaign: (visitor?.first_utm_campaign as string) || null,
        first_utm_content: (visitor?.first_utm_content as string) || null,
        first_utm_term: (visitor?.first_utm_term as string) || null,
        first_gclid: (visitor?.first_gclid as string) || null,
        first_fbclid: (visitor?.first_fbclid as string) || null,
        first_landing_page: (visitor?.first_landing_page as string) || null,
        first_referrer: (visitor?.first_referrer as string) || null,
        first_url_params: visitor?.first_url_params || {},

        first_seen_at: (visitor?.first_seen_at as string) || new Date().toISOString(),
        email_captured_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),

        status: 'customer',
      })
    } else {
      // Update existing customer with any new data
      const updates: Record<string, unknown> = {
        last_active_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      if (stripeCustomerId) updates.stripe_customer_id = stripeCustomerId
      if (visitorId && !existingCustomer) updates.visitor_id = visitorId
      await supabase.from('customers').update(updates).eq('user_id', userId)
    }

    // Mark session as converted
    if (sessionId) {
      await supabase
        .from('sessions')
        .update({ converted: true, conversion_type: 'purchase' })
        .eq('id', sessionId)
    }

    // Fire journey event
    await supabase.from('journey_events').insert({
      visitor_id: visitorId || null,
      session_id: sessionId || null,
      user_id: userId,
      event_type: 'email_captured',
      event_data: { email: email || null },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Tracking identify error:', error)
    return NextResponse.json({ ok: true })
  }
}
