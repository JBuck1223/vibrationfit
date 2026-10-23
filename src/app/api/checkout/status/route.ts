import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe/config'
import { createClient as createServerClient } from '@/lib/supabase/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

/**
 * Polled after payment success. Looks up the order by payment_intent_id or
 * order_id. Only its authenticated owner may receive order details.
 * Signed-out customers verify their identity through the normal login flow.
 */
export async function GET(request: NextRequest) {
  try {
    const paymentIntentId = request.nextUrl.searchParams.get('payment_intent_id')
    const orderId = request.nextUrl.searchParams.get('order_id')

    if (!paymentIntentId && !orderId) {
      return NextResponse.json({ ready: false, error: 'Missing payment_intent_id or order_id' }, { status: 400 })
    }

    const sessionClient = await createServerClient()
    const { data: { user: sessionUser } } = await sessionClient.auth.getUser()
    if (!sessionUser) {
      const returnTo = orderId
        ? `/checkout/success?order_id=${encodeURIComponent(orderId)}`
        : `/checkout/success?payment_intent=${encodeURIComponent(paymentIntentId!)}`
      return NextResponse.json({ ready: false, requiresSignIn: true,
        redirectUrl: `/auth/login?checkout=complete&returnTo=${encodeURIComponent(returnTo)}` })
    }

    let order: { id: string; user_id: string; status: string; stripe_payment_intent_id: string | null; total_amount: number | null; currency: string | null; metadata: Record<string, unknown> | null } | null = null

    if (orderId) {
      const { data } = await supabaseAdmin
        .from('orders')
        .select('id, user_id, status, stripe_payment_intent_id, total_amount, currency, metadata')
        .eq('id', orderId)
        .maybeSingle()
      order = data
    } else if (paymentIntentId) {
      const { data } = await supabaseAdmin
        .from('orders')
        .select('id, user_id, status, stripe_payment_intent_id, total_amount, currency, metadata')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .maybeSingle()
      order = data
    }

    if (!order?.user_id) {
      return NextResponse.json({ ready: false })
    }

    if (sessionUser.id !== order.user_id) {
      return NextResponse.json({ ready: false, error: 'Sign in with the account used for this purchase.' }, { status: 403 })
    }
    // Subscription checkout creates a pending order before Stripe settles it.
    // Confirm that payment with Stripe; PayPal fulfillment writes paid orders.
    if (order.status !== 'paid') {
      if (order.status !== 'pending' || !order.stripe_payment_intent_id || !stripe) {
        return NextResponse.json({ ready: false })
      }
      const payment = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id)
      if (payment.status !== 'succeeded') return NextResponse.json({ ready: false })
    }
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    {
      const needsPassword = sessionUser.user_metadata?.has_password !== true
      const redirectUrl = needsPassword
        ? `${appUrl}/auth/setup-password?returnTo=${encodeURIComponent('/begin')}`
        : `${appUrl}/begin`
      const productKey = (order.metadata as Record<string, unknown>)?.product_key as string | undefined
      return NextResponse.json({
        ready: true,
        redirectUrl,
        amount: order.total_amount != null ? order.total_amount / 100 : undefined,
        currency: order.currency || 'usd',
        product: productKey || 'membership',
        orderId: order.id,
        paymentIntentId: paymentIntentId || undefined,
      })
    }

  } catch (err) {
    console.error('Checkout status error:', err)
    return NextResponse.json({ ready: false }, { status: 500 })
  }
}
