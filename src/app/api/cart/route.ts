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

    // Fetch first-touch UTMs from the visitor record if available
    let utmSource: string | null = null
    let utmMedium: string | null = null
    let utmCampaign: string | null = null

    if (visitorId) {
      const { data: visitor } = await supabase
        .from('visitors')
        .select('first_utm_source, first_utm_medium, first_utm_campaign')
        .eq('id', visitorId)
        .single()

      if (visitor) {
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

    return NextResponse.json({ cartId: cart.id })
  } catch (error) {
    console.error('Cart create error:', error)
    return NextResponse.json({ error: 'Failed to create cart' }, { status: 500 })
  }
}
