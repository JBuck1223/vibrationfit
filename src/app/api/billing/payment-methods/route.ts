import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/config'
import type Stripe from 'stripe'

async function getStripeCustomerId(userId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('customer_subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .not('stripe_customer_id', 'is', null)
    .limit(1)
    .maybeSingle()
  return data?.stripe_customer_id || null
}

/**
 * GET: List all payment methods for the user.
 */
export async function GET() {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const supabase = await createClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    const user = session?.user

    if (sessionError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const customerId = await getStripeCustomerId(user.id)
    if (!customerId) {
      return NextResponse.json({ paymentMethods: [], defaultPaymentMethodId: null })
    }

    const [methods, customer] = await Promise.all([
      stripe.paymentMethods.list({ customer: customerId, type: 'card' }),
      stripe.customers.retrieve(customerId) as Promise<Stripe.Customer>,
    ])

    const defaultPmId = typeof customer.invoice_settings?.default_payment_method === 'string'
      ? customer.invoice_settings.default_payment_method
      : (customer.invoice_settings?.default_payment_method as Stripe.PaymentMethod | null)?.id || null

    const paymentMethods = methods.data.map(pm => ({
      id: pm.id,
      brand: pm.card?.brand || null,
      last4: pm.card?.last4 || null,
      expMonth: pm.card?.exp_month || null,
      expYear: pm.card?.exp_year || null,
      isDefault: pm.id === defaultPmId,
    }))

    return NextResponse.json({ paymentMethods, defaultPaymentMethodId: defaultPmId })
  } catch (error) {
    console.error('List payment methods error:', error)
    return NextResponse.json({ error: 'Failed to list payment methods' }, { status: 500 })
  }
}

/**
 * POST: Create a SetupIntent for adding a new payment method,
 * or set a payment method as default.
 */
export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const supabase = await createClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    const user = session?.user

    if (sessionError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, paymentMethodId } = body as {
      action: 'setup' | 'set_default'
      paymentMethodId?: string
    }

    const customerId = await getStripeCustomerId(user.id)
    if (!customerId) {
      return NextResponse.json({ error: 'No billing account found' }, { status: 400 })
    }

    if (action === 'setup') {
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        metadata: { user_id: user.id },
      })

      return NextResponse.json({
        clientSecret: setupIntent.client_secret,
      })
    }

    if (action === 'set_default' && paymentMethodId) {
      await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Payment method action error:', error)
    return NextResponse.json({ error: 'Failed to process payment method action' }, { status: 500 })
  }
}

/**
 * DELETE: Detach a payment method.
 */
export async function DELETE(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const supabase = await createClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    const user = session?.user

    if (sessionError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { paymentMethodId } = (await request.json()) as { paymentMethodId: string }

    if (!paymentMethodId) {
      return NextResponse.json({ error: 'Missing payment method ID' }, { status: 400 })
    }

    const customerId = await getStripeCustomerId(user.id)
    if (!customerId) {
      return NextResponse.json({ error: 'No billing account found' }, { status: 400 })
    }

    // Prevent removing the default payment method if there's an active subscription
    const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
    const defaultPmId = typeof customer.invoice_settings?.default_payment_method === 'string'
      ? customer.invoice_settings.default_payment_method
      : null

    if (paymentMethodId === defaultPmId) {
      const { data: activeSub } = await supabase
        .from('customer_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing', 'past_due'])
        .limit(1)
        .maybeSingle()

      if (activeSub) {
        return NextResponse.json(
          { error: 'Cannot remove your default payment method while you have an active subscription. Set a different card as default first.' },
          { status: 400 }
        )
      }
    }

    await stripe.paymentMethods.detach(paymentMethodId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove payment method error:', error)
    return NextResponse.json({ error: 'Failed to remove payment method' }, { status: 500 })
  }
}
