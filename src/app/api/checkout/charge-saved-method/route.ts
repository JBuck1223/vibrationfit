import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/config'
import { getActivePackByKey, type PackProductKey } from '@/lib/billing/packs'
import { recordTokenPackPurchase } from '@/lib/tokens/transactions'

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productKey, packKey, quantity } = (await request.json()) as {
      productKey: PackProductKey
      packKey: string
      quantity?: number
    }

    if (!productKey || !packKey) {
      return NextResponse.json({ error: 'Missing product or pack key' }, { status: 400 })
    }

    const requestedQuantity = Number.isInteger(quantity) ? quantity! : 1
    if (requestedQuantity < 1 || requestedQuantity > 100) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 })
    }

    const pack = await getActivePackByKey(productKey, packKey, supabase)
    if (!pack) {
      return NextResponse.json({ error: 'Pack not found' }, { status: 404 })
    }

    // Get Stripe customer ID from existing subscription
    const { data: subscription } = await supabase
      .from('customer_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .not('stripe_customer_id', 'is', null)
      .limit(1)
      .maybeSingle()

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No payment method on file. Please purchase through checkout.' },
        { status: 400 }
      )
    }

    // Get the customer's default payment method
    const customer = await stripe.customers.retrieve(subscription.stripe_customer_id) as import('stripe').Stripe.Customer
    const defaultPaymentMethod =
      customer.invoice_settings?.default_payment_method as string | null ??
      customer.default_source as string | null

    if (!defaultPaymentMethod) {
      return NextResponse.json(
        { error: 'No saved payment method found. Please update your payment method.' },
        { status: 400 }
      )
    }

    const totalAmount = pack.unitAmount * requestedQuantity

    // Create and confirm PaymentIntent with the saved payment method
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: pack.currency,
      customer: subscription.stripe_customer_id,
      payment_method: defaultPaymentMethod,
      off_session: true,
      confirm: true,
      metadata: {
        user_id: user.id,
        purchase_type: 'flex_pack',
        product_key: productKey,
        pack_key: packKey,
        quantity: requestedQuantity.toString(),
        grant_amount: pack.grantAmount.toString(),
        grant_unit: pack.grantUnit,
        source: 'saved_payment_method',
      },
    })

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment did not succeed', status: paymentIntent.status },
        { status: 400 }
      )
    }

    // Grant tokens directly (simpler than waiting for webhook)
    if (pack.grantUnit === 'tokens') {
      await recordTokenPackPurchase(
        user.id,
        packKey,
        pack.grantAmount * requestedQuantity,
        totalAmount,
        paymentIntent.id,
        '',
        {
          purchase_amount: totalAmount,
          purchase_currency: pack.currency,
          product_key: productKey,
          pack_key: packKey,
          quantity: requestedQuantity,
          source: 'saved_payment_method',
        },
        supabase
      )
    }

    return NextResponse.json({
      success: true,
      paymentIntentId: paymentIntent.id,
      amount: totalAmount,
      tokensGranted: pack.grantUnit === 'tokens' ? pack.grantAmount * requestedQuantity : 0,
    })
  } catch (error: any) {
    console.error('Charge saved method error:', error)

    if (error?.type === 'StripeCardError') {
      return NextResponse.json(
        { error: 'Your card was declined. Please update your payment method.' },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 })
  }
}
