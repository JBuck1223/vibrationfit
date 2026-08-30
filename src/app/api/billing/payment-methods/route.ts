import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
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
 * Merges PayPal vaulted cards (payment_methods table, DB-driven billing)
 * with any legacy Stripe cards.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // PayPal vaulted cards live in our own database
    const { data: dbMethods } = await supabase
      .from('payment_methods')
      .select('id, provider, brand, last4, expiry, is_default, status')
      .eq('user_id', user.id)
      .eq('status', 'active')

    const paypalMethods = (dbMethods || []).map(pm => {
      // PayPal expiry format: 'YYYY-MM'
      const [expYearStr, expMonthStr] = (pm.expiry || '').split('-')
      return {
        id: pm.id,
        provider: pm.provider,
        brand: pm.brand ? pm.brand.toLowerCase() : null,
        last4: pm.last4 || null,
        expMonth: expMonthStr ? parseInt(expMonthStr, 10) : null,
        expYear: expYearStr ? parseInt(expYearStr, 10) : null,
        isDefault: pm.is_default,
      }
    })

    // Legacy Stripe cards (existing subscribers)
    let stripeMethods: Array<{
      id: string
      provider: string
      brand: string | null
      last4: string | null
      expMonth: number | null
      expYear: number | null
      isDefault: boolean
    }> = []
    let defaultPmId: string | null = null

    const customerId = stripe ? await getStripeCustomerId(user.id) : null
    if (stripe && customerId) {
      const [methods, customer] = await Promise.all([
        stripe.paymentMethods.list({ customer: customerId, type: 'card' }),
        stripe.customers.retrieve(customerId) as Promise<Stripe.Customer>,
      ])

      defaultPmId = typeof customer.invoice_settings?.default_payment_method === 'string'
        ? customer.invoice_settings.default_payment_method
        : (customer.invoice_settings?.default_payment_method as Stripe.PaymentMethod | null)?.id || null

      stripeMethods = methods.data.map(pm => ({
        id: pm.id,
        provider: 'stripe',
        brand: pm.card?.brand || null,
        last4: pm.card?.last4 || null,
        expMonth: pm.card?.exp_month || null,
        expYear: pm.card?.exp_year || null,
        isDefault: pm.id === defaultPmId,
      }))
    }

    return NextResponse.json({
      paymentMethods: [...paypalMethods, ...stripeMethods],
      defaultPaymentMethodId: paypalMethods.find(m => m.isDefault)?.id || defaultPmId,
    })
  } catch (error) {
    console.error('List payment methods error:', error)
    return NextResponse.json({ error: 'Failed to list payment methods' }, { status: 500 })
  }
}

/** Stripe ids look like `pm_...`; our DB (PayPal vault) rows use UUIDs. */
function isDbPaymentMethodId(id: string): boolean {
  return !id.startsWith('pm_')
}

/**
 * POST: Create a SetupIntent for adding a new payment method,
 * or set a payment method as default.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, paymentMethodId } = body as {
      action: 'setup' | 'set_default'
      paymentMethodId?: string
    }

    // PayPal vault cards (DB rows): set default in our own database
    if (action === 'set_default' && paymentMethodId && isDbPaymentMethodId(paymentMethodId)) {
      const admin = createServiceClient()
      const { data: pm } = await admin
        .from('payment_methods')
        .select('id')
        .eq('id', paymentMethodId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (!pm) {
        return NextResponse.json({ error: 'Payment method not found' }, { status: 404 })
      }

      await admin
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('is_default', true)
      await admin
        .from('payment_methods')
        .update({ is_default: true })
        .eq('id', paymentMethodId)

      // Point active DB-driven subscriptions at the new default card
      await admin
        .from('customer_subscriptions')
        .update({ payment_method_id: paymentMethodId, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('provider', 'paypal')
        .in('status', ['active', 'trialing', 'past_due'])

      return NextResponse.json({ success: true })
    }

    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
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
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { paymentMethodId } = (await request.json()) as { paymentMethodId: string }

    if (!paymentMethodId) {
      return NextResponse.json({ error: 'Missing payment method ID' }, { status: 400 })
    }

    // PayPal vault cards (DB rows): mark removed in our own database
    if (isDbPaymentMethodId(paymentMethodId)) {
      const admin = createServiceClient()
      const { data: pm } = await admin
        .from('payment_methods')
        .select('id, is_default')
        .eq('id', paymentMethodId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (!pm) {
        return NextResponse.json({ error: 'Payment method not found' }, { status: 404 })
      }

      if (pm.is_default) {
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

      await admin
        .from('payment_methods')
        .update({ status: 'revoked', is_default: false })
        .eq('id', paymentMethodId)

      return NextResponse.json({ success: true })
    }

    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
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
