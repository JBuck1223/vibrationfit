import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: cart, error } = await supabase
      .from('cart_sessions')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 })
    }

    if (cart.status === 'completed') {
      return NextResponse.json({ error: 'Cart already completed' }, { status: 410 })
    }

    if (cart.status === 'expired' || new Date(cart.expires_at) < new Date()) {
      if (cart.status !== 'expired') {
        await supabase
          .from('cart_sessions')
          .update({ status: 'expired' })
          .eq('id', id)
      }
      return NextResponse.json({ error: 'Cart expired' }, { status: 410 })
    }

    // Resolve product details for each item so the frontend can display them
    const { resolveCheckoutProduct } = await import('@/lib/checkout/products')

    const resolvedItems = (cart.items as Array<Record<string, string>>).map((item) => {
      const product = resolveCheckoutProduct({
        product: item.product_key,
        plan: item.plan,
        continuity: item.continuity,
        planType: item.plan_type,
        packKey: item.pack_key,
      })
      return {
        ...item,
        resolved: product
          ? {
              key: product.key,
              name: product.name,
              description: product.description,
              mode: product.mode,
              amount: product.amount,
              currency: product.currency,
              features: product.features,
            }
          : null,
      }
    })

    return NextResponse.json({
      id: cart.id,
      items: resolvedItems,
      promoCode: cart.promo_code,
      referralSource: cart.referral_source,
      campaignName: cart.campaign_name,
      status: cart.status,
      expiresAt: cart.expires_at,
    })
  } catch (error) {
    console.error('Cart load error:', error)
    return NextResponse.json({ error: 'Failed to load cart' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, email, userId } = body as {
      status?: string
      email?: string
      userId?: string
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (status) updates.status = status
    if (email) updates.email = email
    if (userId) updates.user_id = userId
    if (status === 'completed') updates.completed_at = new Date().toISOString()

    const { error } = await supabase
      .from('cart_sessions')
      .update(updates)
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 })
    }

    // Fire journey event for checkout_started
    if (status === 'checkout_started') {
      const { data: cart } = await supabase
        .from('cart_sessions')
        .select('visitor_id, session_id')
        .eq('id', id)
        .single()

      if (cart) {
        await supabase.from('journey_events').insert({
          visitor_id: cart.visitor_id,
          session_id: cart.session_id,
          user_id: userId || null,
          cart_session_id: id,
          event_type: 'checkout_started',
          event_data: {},
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Cart update error:', error)
    return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 })
  }
}
