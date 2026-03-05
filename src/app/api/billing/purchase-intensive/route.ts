import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { stripe } from '@/lib/stripe/config'

function resolveIntensiveAddonPriceId(): string | null {
  const isSandbox = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')
  if (isSandbox) {
    const sandboxVal = process.env.SANDBOX_STRIPE_PRICE_HOUSEHOLD_INTENSIVE_ADDON
    if (sandboxVal) return sandboxVal.trim()
  }
  return process.env.STRIPE_PRICE_HOUSEHOLD_INTENSIVE_ADDON?.trim() || null
}

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

    const body = await request.json()
    const {
      overrideAmount,
      promoCode,
      partnerFirstName,
      partnerLastName,
      partnerEmail,
      targetUserId,
    } = body as {
      overrideAmount?: number
      promoCode?: string
      partnerFirstName?: string
      partnerLastName?: string
      partnerEmail?: string
      targetUserId?: string
    }

    const { data: subscription } = await supabase
      .from('customer_subscriptions')
      .select('id, stripe_customer_id, stripe_subscription_id')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .not('stripe_subscription_id', 'is', null)
      .limit(1)
      .maybeSingle()

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json({ error: 'No active membership found' }, { status: 400 })
    }

    const intensivePriceId = resolveIntensiveAddonPriceId()
    const baseAmount = overrideAmount || 20000

    let discountAmount = 0
    let couponResult: any = null
    if (promoCode) {
      const { validateCouponCode, calculateDiscount } = await import('@/lib/billing/coupons')
      couponResult = await validateCouponCode(promoCode, {
        userId: user.id,
        productKey: 'intensive',
        purchaseAmount: baseAmount,
      })
      if (couponResult.valid && couponResult.coupon) {
        discountAmount = calculateDiscount(couponResult.coupon, baseAmount)
      }
    }

    const finalAmount = Math.max(0, baseAmount - discountAmount)

    const metadata: Record<string, string> = {
      user_id: user.id,
      purchase_type: 'intensive_addon',
      product_type: 'standalone_intensive',
      source: 'billing_upgrade',
      promo_code: promoCode || '',
      ...(partnerFirstName ? { partner_first_name: partnerFirstName } : {}),
      ...(partnerLastName ? { partner_last_name: partnerLastName } : {}),
      ...(partnerEmail ? { partner_email: partnerEmail } : {}),
    }

    const serviceClient = createServiceClient()

    const stripeCustomer = await stripe.customers.retrieve(subscription.stripe_customer_id)
    if (stripeCustomer.deleted) {
      return NextResponse.json({ error: 'Invalid Stripe customer' }, { status: 400 })
    }

    if (finalAmount === 0) {
      const { data: order } = await serviceClient
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: 0,
          currency: 'usd',
          status: 'completed',
          promo_code: promoCode || null,
          metadata: { ...metadata, waived: 'true' },
        })
        .select('id')
        .single()

      const checklistUserId = targetUserId || user.id
      if (order) {
        await createOrderItemAndChecklist(serviceClient, order.id, checklistUserId, 0, promoCode, metadata)
      }

      if (promoCode && couponResult?.valid && couponResult.coupon && couponResult.codeRow) {
        const { recordRedemption } = await import('@/lib/billing/coupons')
        await recordRedemption({
          couponId: couponResult.coupon.id,
          couponCodeId: couponResult.codeRow.id,
          userId: user.id,
          discountAmount,
          originalAmount: baseAmount,
          productKey: 'intensive',
          orderId: undefined,
        }).catch(err => console.error('Failed to record coupon redemption:', err))
      }

      return NextResponse.json({ success: true, waived: true, orderId: null })
    }

    const invoiceItemParams: any = {
      customer: subscription.stripe_customer_id,
      currency: 'usd',
      description: 'Household Partner Activation Intensive',
      metadata,
    }

    if (intensivePriceId) {
      invoiceItemParams.price = intensivePriceId
      if (discountAmount > 0) {
        invoiceItemParams.discounts = [{
          coupon: (await stripe.coupons.create(
            couponResult.coupon.discount_type === 'percent'
              ? { percent_off: couponResult.coupon.discount_value, duration: 'once' }
              : { amount_off: discountAmount, currency: 'usd', duration: 'once' },
          )).id,
        }]
      }
    } else {
      invoiceItemParams.amount = finalAmount
    }

    await stripe.invoiceItems.create(invoiceItemParams)

    const invoice = await stripe.invoices.create({
      customer: subscription.stripe_customer_id,
      auto_advance: true,
      collection_method: 'charge_automatically',
      metadata,
    })

    const paidInvoice = await stripe.invoices.pay(invoice.id)

    if (paidInvoice.status === 'paid') {
      const { data: order } = await serviceClient
        .from('orders')
        .insert({
          user_id: user.id,
          stripe_payment_intent_id: typeof (paidInvoice as any).payment_intent === 'string'
            ? (paidInvoice as any).payment_intent
            : (paidInvoice as any).payment_intent?.id || null,
          total_amount: finalAmount,
          currency: 'usd',
          status: 'completed',
          promo_code: promoCode || null,
          metadata: { ...metadata, stripe_invoice_id: paidInvoice.id },
        })
        .select('id')
        .single()

      const paidChecklistUserId = targetUserId || user.id
      if (order) {
        await createOrderItemAndChecklist(serviceClient, order.id, paidChecklistUserId, finalAmount, promoCode, metadata)
      }

      if (promoCode && couponResult?.valid && couponResult.coupon && couponResult.codeRow) {
        const { recordRedemption } = await import('@/lib/billing/coupons')
        await recordRedemption({
          couponId: couponResult.coupon.id,
          couponCodeId: couponResult.codeRow.id,
          userId: user.id,
          discountAmount,
          originalAmount: baseAmount,
          productKey: 'intensive',
        }).catch(err => console.error('Failed to record coupon redemption:', err))
      }

      return NextResponse.json({
        success: true,
        invoiceId: paidInvoice.id,
        amount: finalAmount,
      })
    }

    return NextResponse.json({
      success: false,
      error: `Invoice payment status: ${paidInvoice.status}`,
      invoiceId: paidInvoice.id,
    }, { status: 402 })
  } catch (error: any) {
    console.error('Purchase intensive error:', error)

    if (error?.type === 'StripeCardError') {
      return NextResponse.json({
        error: error.message || 'Your card was declined',
        code: error.code,
      }, { status: 402 })
    }

    return NextResponse.json({
      error: error?.message || 'Failed to purchase intensive',
    }, { status: 500 })
  }
}

async function createOrderItemAndChecklist(
  serviceClient: ReturnType<typeof createServiceClient>,
  orderId: string,
  userId: string,
  amount: number,
  promoCode: string | undefined,
  metadata: Record<string, string>,
) {
  const { data: dbProd } = await serviceClient
    .from('products')
    .select('id')
    .eq('key', 'intensive_household')
    .maybeSingle()

  if (!dbProd) return

  const { data: orderItem } = await serviceClient
    .from('order_items')
    .insert({
      order_id: orderId,
      product_id: dbProd.id,
      quantity: 1,
      amount,
      currency: 'usd',
      payment_plan: 'full',
      is_subscription: false,
      promo_code: promoCode || null,
      metadata,
    })
    .select('id')
    .single()

  if (orderItem) {
    await serviceClient.from('intensive_checklist').insert({
      intensive_id: orderItem.id,
      user_id: userId,
    })
  }
}
