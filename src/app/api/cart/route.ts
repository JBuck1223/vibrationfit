import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendServerConversion } from '@/lib/tracking/server-conversions'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      items,
      promoCode,
      referralSource,
      campaignName,
      visitorId,
      sessionId,
    } = body as {
      items: Array<{
        product_key: string
        plan?: string
        continuity?: string
        plan_type?: string
        pack_key?: string
      }>
      promoCode?: string
      referralSource?: string
      campaignName?: string
      visitorId?: string
      sessionId?: string
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart must have at least one item' }, { status: 400 })
    }

    // Fetch first-touch UTMs + click IDs from the visitor record if available
    let utmSource: string | null = null
    let utmMedium: string | null = null
    let utmCampaign: string | null = null
    let visitorRow: Record<string, unknown> | null = null

    if (visitorId) {
      const { data: visitor } = await supabase
        .from('visitors')
        .select('first_utm_source, first_utm_medium, first_utm_campaign, first_fbclid, first_fbc, first_fbp, first_gclid, first_ttclid')
        .eq('id', visitorId)
        .single()

      if (visitor) {
        visitorRow = visitor
        utmSource = visitor.first_utm_source
        utmMedium = visitor.first_utm_medium
        utmCampaign = visitor.first_utm_campaign
      }
    }

    const { data: cart, error } = await supabase
      .from('cart_sessions')
      .insert({
        visitor_id: visitorId || null,
        session_id: sessionId || null,
        items,
        promo_code: promoCode || null,
        referral_source: referralSource || null,
        campaign_name: campaignName || null,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        status: 'active',
      })
      .select('id')
      .single()

    if (error || !cart) {
      console.error('Failed to create cart:', error)
      return NextResponse.json({ error: 'Failed to create cart' }, { status: 500 })
    }

    // Fire journey event
    await supabase.from('journey_events').insert({
      visitor_id: visitorId || null,
      session_id: sessionId || null,
      cart_session_id: cart.id,
      event_type: 'cart_created',
      event_data: { items, promo_code: promoCode || null },
    })

    // Server-side InitiateCheckout. The browser fires its own pixel event with
    // event_id = cartId, so Meta dedups the pair.
    sendServerConversion('initiate_checkout', {
      contentName: items[0]?.product_key || 'checkout',
      eventId: cart.id,
      eventSourceUrl: 'https://vibrationfit.com/checkout',
      fbclid: (visitorRow?.first_fbclid as string) || undefined,
      fbc: request.cookies.get('_fbc')?.value || (visitorRow?.first_fbc as string) || undefined,
      fbp: request.cookies.get('_fbp')?.value || (visitorRow?.first_fbp as string) || undefined,
      gclid: (visitorRow?.first_gclid as string) || undefined,
      ttclid: (visitorRow?.first_ttclid as string) || undefined,
      ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      visitorId: visitorId || undefined,
    }).catch((err) => console.error('Server conversion (initiate_checkout) error:', err))

    return NextResponse.json({ cartId: cart.id })
  } catch (error) {
    console.error('Cart create error:', error)
    return NextResponse.json({ error: 'Failed to create cart' }, { status: 500 })
  }
}
