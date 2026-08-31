// Provider-agnostic purchase fulfillment.
// Mirrors the provisioning the Stripe webhook performs on payment_intent.succeeded,
// but driven entirely by our database — used by the PayPal capture route (and the
// PayPal webhook as an idempotent backup).

import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'
import { toTitleCase } from '@/lib/utils'
import { getUserIdByEmail } from '@/lib/supabase/get-user-by-email'
import { ensureCustomerWithAttribution } from '@/lib/tracking/customer-attribution'
import { sendServerConversion } from '@/lib/tracking/server-conversions'
import { sendSMS } from '@/lib/messaging/twilio'
import { createAdminNotification } from '@/lib/admin/notifications'
import { triggerEvent } from '@/lib/messaging/events'
import { getPaymentPlanLabel } from '@/lib/intensive/utils'
import { resolveReferralCode, checkAndGrantRewards } from '@/lib/referral/helpers'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export type PurchaseContext = {
  name: string
  email: string
  phone?: string
  product: string
  plan?: string
  planType?: 'solo' | 'household'
  continuity?: '28day' | 'annual'
  promoCode?: string | null
  referralSource?: string | null
  campaignName?: string | null
  cartSessionId?: string | null
  visitorId?: string | null
  sessionId?: string | null
  partnerFirstName?: string
  partnerLastName?: string
  partnerEmail?: string
  intensiveLevel?: 'premium' | null
  promoPackage?: string | null
}

export type VaultedCard = {
  vaultId: string
  paypalCustomerId: string | null
  brand: string | null
  last4: string | null
  expiry: string | null
}

export type FulfillmentResult = {
  userId: string
  orderId: string
  alreadyFulfilled: boolean
}

/**
 * Fulfill a captured PayPal purchase: create the user/order/checklist, save the
 * vaulted card, start the DB-driven continuity membership (trialing, first
 * charge on Day 28 via the billing cron), and fire all side effects.
 * Idempotent on paypal_order_id.
 */
export async function fulfillPayPalPurchase(params: {
  paypalOrderId: string
  paypalCaptureId: string | null
  amountPaid: number
  currency: string
  context: PurchaseContext
  vault: VaultedCard | null
  requestMeta?: { ip?: string; userAgent?: string }
}): Promise<FulfillmentResult | null> {
  const supabaseAdmin = getSupabaseAdmin()
  const { context: ctx } = params
  const {
    product, email, name,
  } = ctx

  // -------------------------------------------------------------------------
  // Idempotency: bail if this PayPal order has already produced an order row
  // -------------------------------------------------------------------------
  const { data: existingOrder } = await supabaseAdmin
    .from('orders')
    .select('id, user_id')
    .eq('paypal_order_id', params.paypalOrderId)
    .maybeSingle()
  if (existingOrder) {
    return { userId: existingOrder.user_id, orderId: existingOrder.id, alreadyFulfilled: true }
  }

  if (!email || !product) {
    console.error('[fulfillment] missing email or product', { paypalOrderId: params.paypalOrderId })
    return null
  }

  const phone = ctx.phone || ''
  const plan = ctx.plan || 'full'
  const planType = ctx.planType || 'solo'
  const isIntensive = product === 'intensive' || product === 'intensive_premium'
  const isPremium = product === 'intensive_premium' || ctx.intensiveLevel === 'premium' || ctx.promoPackage === 'premium_promo'

  // -------------------------------------------------------------------------
  // 1. Find or create the user
  // -------------------------------------------------------------------------
  const nameParts = (name || '').trim().split(' ')
  const firstName = nameParts[0] ? toTitleCase(nameParts[0]) : null
  const lastName = nameParts.length > 1 ? toTitleCase(nameParts.slice(1).join(' ')) : null

  let userId: string
  const foundUserId = await getUserIdByEmail(supabaseAdmin, email)
  if (foundUserId) {
    userId = foundUserId
  } else {
    const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: randomBytes(32).toString('hex'),
      email_confirm: true,
      user_metadata: {
        full_name: [firstName, lastName].filter(Boolean).join(' ') || undefined,
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        phone: phone || undefined,
      },
    })
    if (createErr || !newUser?.user) {
      console.error('[fulfillment] create user failed', createErr)
      return null
    }
    userId = newUser.user.id
  }

  if (firstName || lastName || phone) {
    await supabaseAdmin.from('user_accounts').update({
      ...(firstName ? { first_name: firstName } : {}),
      ...(lastName ? { last_name: lastName } : {}),
      ...(phone ? { phone } : {}),
    }).eq('id', userId)
  }

  const customerRowId = await ensureCustomerWithAttribution(supabaseAdmin, {
    userId,
    visitorId: ctx.visitorId || null,
    stripeCustomerId: null,
    isPurchase: true,
  })

  // -------------------------------------------------------------------------
  // 2. Order + order item + intensive checklist
  // -------------------------------------------------------------------------
  const totalAmount = params.amountPaid
  const { data: order, error: orderErr } = await supabaseAdmin
    .from('orders')
    .insert({
      user_id: userId,
      provider: 'paypal',
      paypal_order_id: params.paypalOrderId,
      paypal_capture_id: params.paypalCaptureId,
      total_amount: totalAmount,
      currency: params.currency || 'usd',
      status: 'paid',
      paid_at: new Date().toISOString(),
      promo_code: ctx.promoCode || null,
      referral_source: ctx.referralSource || null,
      campaign_name: ctx.campaignName || null,
      metadata: {
        product_key: product,
        plan,
        plan_type: planType,
        visitor_id: ctx.visitorId || null,
        session_id: ctx.sessionId || null,
      },
      ...(customerRowId && { customer_id: customerRowId }),
      ...(ctx.cartSessionId && { cart_session_id: ctx.cartSessionId }),
    })
    .select('id')
    .single()

  if (orderErr || !order) {
    // Unique-violation on paypal_order_id means a concurrent fulfillment won.
    if ((orderErr as any)?.code === '23505') {
      const { data: winner } = await supabaseAdmin
        .from('orders')
        .select('id, user_id')
        .eq('paypal_order_id', params.paypalOrderId)
        .maybeSingle()
      if (winner) return { userId: winner.user_id, orderId: winner.id, alreadyFulfilled: true }
    }
    console.error('[fulfillment] order insert failed', orderErr)
    return null
  }

  const { data: dbProduct } = await supabaseAdmin
    .from('products')
    .select('id')
    .eq('key', product === 'intensive' ? 'intensive' : product)
    .maybeSingle()

  let intensiveOrderItemId: string | null = null
  if (dbProduct) {
    const { data: orderItem, error: oiErr } = await supabaseAdmin
      .from('order_items')
      .insert({
        order_id: order.id,
        product_id: dbProduct.id,
        quantity: 1,
        amount: totalAmount,
        currency: params.currency || 'usd',
        payment_plan: plan,
        is_subscription: false,
        installments_total: plan === '2pay' ? 2 : 1,
        installments_paid: 1,
        promo_code: ctx.promoCode || null,
        referral_source: ctx.referralSource || null,
        campaign_name: ctx.campaignName || null,
        metadata: { ...ctx, source: 'paypal_checkout' },
      })
      .select('id')
      .single()
    if (oiErr) {
      console.error('[fulfillment] order_item insert failed', oiErr)
    } else {
      intensiveOrderItemId = orderItem?.id || null
    }
  }

  if (intensiveOrderItemId && isIntensive) {
    await supabaseAdmin.from('intensive_checklist').insert({
      intensive_id: intensiveOrderItemId,
      user_id: userId,
    })
    if (isPremium) {
      await Promise.resolve(supabaseAdmin.from('premium_coaching_sessions').insert({
        intensive_id: intensiveOrderItemId,
        user_id: userId,
        order_id: order.id,
      })).catch(err => console.error('[fulfillment] premium coaching insert failed:', err))
    }
  }

  // -------------------------------------------------------------------------
  // 3. Save the vaulted card so the billing cron can charge renewals
  // -------------------------------------------------------------------------
  let paymentMethodId: string | null = null
  if (params.vault) {
    // One default per user: demote existing defaults first.
    await supabaseAdmin.from('payment_methods')
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('is_default', true)

    const { data: pm, error: pmErr } = await supabaseAdmin
      .from('payment_methods')
      .upsert({
        user_id: userId,
        provider: 'paypal',
        paypal_vault_id: params.vault.vaultId,
        paypal_customer_id: params.vault.paypalCustomerId,
        brand: params.vault.brand,
        last4: params.vault.last4,
        expiry: params.vault.expiry,
        status: 'active',
        is_default: true,
      }, { onConflict: 'paypal_vault_id' })
      .select('id')
      .single()
    if (pmErr) {
      console.error('[fulfillment] payment_methods upsert failed', pmErr)
    } else {
      paymentMethodId = pm?.id || null
    }
  }

  // -------------------------------------------------------------------------
  // 3b. 2-pay installment: schedule the second charge (Day 14) via the cron.
  //     Uses the intensive tier row purely as a billing schedule — the cron
  //     detects plan_category='intensive' and stops after the final installment.
  // -------------------------------------------------------------------------
  if (isIntensive && plan === '2pay' && intensiveOrderItemId && paymentMethodId) {
    const { data: intensiveTier } = await supabaseAdmin
      .from('membership_tiers')
      .select('id')
      .eq('tier_type', isPremium ? 'intensive_premium' : 'intensive')
      .eq('is_active', true)
      .maybeSingle()
    if (intensiveTier) {
      const { error: instErr } = await supabaseAdmin.from('customer_subscriptions').insert({
        user_id: userId,
        membership_tier_id: intensiveTier.id,
        provider: 'paypal',
        payment_method_id: paymentMethodId,
        amount_cents: totalAmount,
        billing_interval_days: 14,
        next_billing_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active' as any,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        order_id: order.id,
        order_item_id: intensiveOrderItemId,
      })
      if (instErr) console.error('[fulfillment] installment schedule insert failed', instErr)
    } else {
      console.error('[fulfillment] intensive tier not found — 2nd installment NOT scheduled')
    }
  }

  // -------------------------------------------------------------------------
  // 4. Continuity membership: DB-driven trialing subscription, first charge
  //    on Day 28 via the billing cron. No gateway subscription objects.
  // -------------------------------------------------------------------------
  let subscriptionCreated = false
  if (isIntensive && intensiveOrderItemId) {
    const continuityPlan = ctx.continuity || '28day'
    const isHousehold = planType === 'household'
    const tierType = continuityPlan === 'annual'
      ? (isHousehold ? 'vision_pro_household_annual' : 'vision_pro_annual')
      : (isHousehold ? 'vision_pro_household_28day' : 'vision_pro_28day')

    const { data: tier } = await supabaseAdmin
      .from('membership_tiers')
      .select('id, price_monthly, price_yearly, product_id')
      .eq('tier_type', tierType)
      .eq('is_active', true)
      .maybeSingle()

    if (tier) {
      const fullRenewalAmount = continuityPlan === 'annual'
        ? (tier.price_yearly || 0)
        : (tier.price_monthly || 0)
      const intervalDays = continuityPlan === 'annual' ? 365 : 28
      const trialEnd = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000)

      // Coupon renewal discount: start the subscription at the discounted
      // price and stamp the countdown fields the billing cron manages.
      let renewalAmount = fullRenewalAmount
      let renewalDiscount: {
        renewal_discount_type: 'percent' | 'fixed'
        renewal_discount_value: number
        renewal_discount_cycles_remaining: number | null
      } | null = null
      if (ctx.promoCode) {
        try {
          const { validateCouponCode } = await import('@/lib/billing/coupons')
          const couponResult = await validateCouponCode(ctx.promoCode, { userId, productKey: product })
          const coupon = couponResult.valid ? (couponResult.coupon as any) : null
          if (coupon?.renewal_discount_type && coupon?.renewal_discount_value) {
            renewalDiscount = {
              renewal_discount_type: coupon.renewal_discount_type,
              renewal_discount_value: coupon.renewal_discount_value,
              renewal_discount_cycles_remaining: coupon.renewal_discount_cycles ?? null,
            }
            const discount = coupon.renewal_discount_type === 'percent'
              ? Math.round(fullRenewalAmount * coupon.renewal_discount_value / 100)
              : coupon.renewal_discount_value
            renewalAmount = Math.max(0, fullRenewalAmount - discount)
          }
        } catch (err) {
          console.error('[fulfillment] renewal discount lookup failed', err)
        }
      }

      const { data: newSub, error: subErr } = await supabaseAdmin
        .from('customer_subscriptions')
        .insert({
          user_id: userId,
          membership_tier_id: tier.id,
          provider: 'paypal',
          payment_method_id: paymentMethodId,
          amount_cents: renewalAmount,
          billing_interval_days: intervalDays,
          next_billing_at: trialEnd.toISOString(),
          status: 'trialing' as any,
          current_period_start: new Date().toISOString(),
          current_period_end: trialEnd.toISOString(),
          trial_start: new Date().toISOString(),
          trial_end: trialEnd.toISOString(),
          order_id: order.id,
          order_item_id: intensiveOrderItemId,
          promo_code: ctx.promoCode || null,
          referral_source: ctx.referralSource || null,
          campaign_name: ctx.campaignName || null,
          ...(renewalDiscount || {}),
        })
        .select('id')
        .single()

      if (subErr) {
        console.error('[fulfillment] customer_subscriptions insert failed', subErr)
      } else {
        subscriptionCreated = true

        await supabaseAdmin.from('user_accounts').update({
          membership_tier_id: tier.id,
        }).eq('id', userId)

        // $0 membership line item on the order (billing starts Day 28)
        if (tier.product_id) {
          const { data: membershipOI } = await supabaseAdmin
            .from('order_items')
            .insert({
              order_id: order.id,
              product_id: tier.product_id,
              quantity: 1,
              amount: 0,
              currency: params.currency || 'usd',
              is_subscription: true,
              subscription_id: newSub?.id || null,
              metadata: { trial_days: 28, billing_starts_day: 28, tier_type: tierType },
            })
            .select('id')
            .single()
          if (membershipOI?.id && newSub?.id) {
            await supabaseAdmin
              .from('customer_subscriptions')
              .update({ order_item_id: membershipOI.id })
              .eq('id', newSub.id)
          }
        }
      }

      const { error: grantError } = await supabaseAdmin.rpc('grant_trial_tokens', {
        p_user_id: userId,
        p_intensive_id: intensiveOrderItemId,
      })
      if (grantError) {
        console.error('[fulfillment] grant_trial_tokens failed:', grantError)
      }

      // Household creation + partner invite
      if (planType === 'household') {
        try {
          const hhName = name?.split(' ')[0] || 'My'
          const { data: household, error: householdError } = await supabaseAdmin
            .from('households')
            .insert({
              admin_user_id: userId,
              name: `${toTitleCase(hhName)}'s Household`,
              shared_tokens_enabled: true,
            })
            .select()
            .single()

          if (!householdError && household) {
            await supabaseAdmin.from('user_accounts').update(
              { household_id: household.id, is_household_admin: true }
            ).eq('id', userId)
            await supabaseAdmin.from('household_members').insert({
              household_id: household.id,
              user_id: userId,
              role: 'admin',
              joined_at: new Date().toISOString(),
            })

            if (ctx.partnerFirstName && ctx.partnerLastName && ctx.partnerEmail) {
              const { invitePartnerToHousehold } = await import('@/lib/supabase/household')
              const inviteResult = await invitePartnerToHousehold({
                supabaseAdmin,
                householdId: household.id,
                adminUserId: userId,
                adminName: name || 'A Vibration Fit member',
                adminEmail: email || '',
                householdName: household.name,
                partnerFirstName: ctx.partnerFirstName,
                partnerLastName: ctx.partnerLastName,
                partnerEmail: ctx.partnerEmail,
              })
              if (inviteResult.partnerId) {
                await grantPartnerIntensive(supabaseAdmin, inviteResult.partnerId, userId)
              }
            }
          }
        } catch (householdErr) {
          console.error('[fulfillment] household creation error:', householdErr)
        }
      }
    }

    // Fallback: grant trial tokens even if subscription creation was skipped
    if (!subscriptionCreated) {
      const { error: grantErr } = await supabaseAdmin.rpc('grant_trial_tokens', {
        p_user_id: userId,
        p_intensive_id: intensiveOrderItemId,
      })
      if (grantErr) console.error('[fulfillment] fallback grant_trial_tokens failed:', grantErr)
    }
  }

  // -------------------------------------------------------------------------
  // 5. Side effects: conversions, notifications, coupons, journey, referrals
  // -------------------------------------------------------------------------
  {
    let visitorData: Record<string, unknown> | null = null
    if (ctx.visitorId) {
      const { data } = await supabaseAdmin
        .from('visitors')
        .select('first_fbclid, first_fbc, first_fbp, first_gclid, first_ttclid')
        .eq('id', ctx.visitorId)
        .maybeSingle()
      visitorData = data
    }
    sendServerConversion('purchase', {
      email: email || undefined,
      phone: phone || undefined,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      value: totalAmount / 100,
      currency: (params.currency || 'usd').toUpperCase(),
      contentName: product,
      orderId: order.id,
      eventId: params.paypalOrderId,
      eventSourceUrl: 'https://vibrationfit.com/checkout/success',
      fbclid: (visitorData as any)?.first_fbclid || undefined,
      fbc: (visitorData as any)?.first_fbc || undefined,
      fbp: (visitorData as any)?.first_fbp || undefined,
      gclid: (visitorData as any)?.first_gclid || undefined,
      ttclid: (visitorData as any)?.first_ttclid || undefined,
      ip: params.requestMeta?.ip,
      userAgent: params.requestMeta?.userAgent,
      visitorId: ctx.visitorId || undefined,
    }).catch(err => console.error('[fulfillment] server conversion error:', err))

    notifyAdminPurchase({
      customerName: name || undefined,
      customerEmail: email || undefined,
      amount: totalAmount,
      currency: params.currency || 'usd',
      product,
      paymentPlan: plan,
    }).catch(err => console.error('[fulfillment] admin SMS error:', err))

    const amountStr = `$${(totalAmount / 100).toFixed(2)}`
    createAdminNotification({
      type: 'purchase',
      title: `New Purchase: ${name || email || 'Unknown'}`,
      body: `${product}${plan ? ` (${plan})` : ''} - ${amountStr} (PayPal)`,
      metadata: { email, amount: totalAmount, product, paymentPlan: plan, provider: 'paypal' },
      link: '/admin/orders',
    }).catch(err => console.error('[fulfillment] admin notification error:', err))
  }

  if (ctx.promoCode) {
    const { validateCouponCode, calculateDiscount, recordRedemption } = await import('@/lib/billing/coupons')
    const couponResult = await validateCouponCode(ctx.promoCode, {
      userId,
      productKey: product,
      purchaseAmount: totalAmount,
    })
    if (couponResult.valid && couponResult.coupon && couponResult.codeRow) {
      const discountAmount = calculateDiscount(couponResult.coupon, totalAmount)
      await recordRedemption({
        couponId: couponResult.coupon.id,
        couponCodeId: couponResult.codeRow.id,
        userId,
        discountAmount,
        originalAmount: totalAmount,
        productKey: product,
      }).catch(err => console.error('[fulfillment] recordRedemption failed', err))
    }
  }

  if (ctx.visitorId) {
    await Promise.resolve(supabaseAdmin.from('visitors').update({ user_id: userId }).eq('id', ctx.visitorId)).catch(() => {})
  }
  if (ctx.sessionId) {
    await Promise.resolve(supabaseAdmin.from('sessions').update({ converted: true, conversion_type: 'purchase' }).eq('id', ctx.sessionId)).catch(() => {})
  }
  if (ctx.cartSessionId) {
    await Promise.resolve(supabaseAdmin.from('cart_sessions').update({ status: 'completed', user_id: userId, email }).eq('id', ctx.cartSessionId)).catch(() => {})
  }

  await Promise.resolve(supabaseAdmin.from('journey_events').insert({
    visitor_id: ctx.visitorId || null,
    session_id: ctx.sessionId || null,
    user_id: userId,
    cart_session_id: ctx.cartSessionId || null,
    event_type: 'purchase_completed',
    event_data: { order_id: order.id, product_key: product, amount: totalAmount, promo_code: ctx.promoCode || null },
  })).catch(() => {})

  if (customerRowId) {
    const { data: custData } = await supabaseAdmin
      .from('customers')
      .select('total_orders, total_spent')
      .eq('id', customerRowId)
      .single()
    await Promise.resolve(supabaseAdmin
      .from('customers')
      .update({
        total_orders: (custData?.total_orders || 0) + 1,
        total_spent: (custData?.total_spent || 0) + totalAmount,
        last_purchase_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', customerRowId)
    ).catch(() => {})
  }

  if (isIntensive && intensiveOrderItemId) {
    const intensiveEventName = isPremium ? 'intensive_premium.purchased' : 'intensive.purchased'
    triggerEvent(intensiveEventName, {
      email: email || '',
      userId,
      name: name || email || '',
      firstName: name?.split(' ')[0] || 'there',
      orderId: order.id,
      intensiveId: intensiveOrderItemId,
      paymentPlan: plan,
      paymentPlanLabel: getPaymentPlanLabel(plan),
      planType,
      continuityPrice: planType === 'household' ? '$149' : '$99',
      annualPrice: planType === 'household' ? '$1,490' : '$999',
    }).catch(() => {})
  }

  if (ctx.referralSource && email) {
    try {
      const referrer = await resolveReferralCode(supabaseAdmin, ctx.referralSource)
      if (referrer) {
        await supabaseAdmin.from('referral_events').insert({
          referrer_id: referrer.id,
          event_type: 'paid_conversion',
          referred_email: email,
          metadata: { amount: totalAmount, product, source: 'paypal_capture' },
        })
        const { data: rp } = await supabaseAdmin
          .from('referral_participants')
          .select('email_signups, paid_conversions')
          .eq('id', referrer.id)
          .single()
        const newPaid = (rp?.paid_conversions || 0) + 1
        await supabaseAdmin.from('referral_participants').update({ paid_conversions: newPaid }).eq('id', referrer.id)
        await supabaseAdmin.from('referral_invites')
          .update({ status: 'converted', converted_at: new Date().toISOString() })
          .eq('participant_id', referrer.id)
          .eq('referred_email', email)
          .in('status', ['sent', 'opened', 'clicked'])
        await checkAndGrantRewards(supabaseAdmin, referrer.id, rp?.email_signups || 0, newPaid)
      }
    } catch (refErr) {
      console.error('[fulfillment] referral credit error (non-fatal):', refErr)
    }
  }

  if (userId && email) {
    try {
      await supabaseAdmin.from('referral_participants').update({ user_id: userId }).eq('email', email).is('user_id', null)
    } catch {}
  }

  return { userId, orderId: order.id, alreadyFulfilled: false }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function notifyAdminPurchase(details: {
  customerName?: string
  customerEmail?: string
  amount: number
  currency?: string
  product?: string
  paymentPlan?: string
}) {
  const phonesRaw = process.env.ADMIN_NOTIFICATION_PHONES
  if (!phonesRaw) return
  const phones = phonesRaw.split(',').map(p => p.trim()).filter(Boolean)
  if (phones.length === 0) return

  const amountStr = `$${(details.amount / 100).toFixed(2)}`
  const displayName = details.customerName || details.customerEmail || 'Unknown'
  const product = details.product || 'Purchase'
  const plan = details.paymentPlan ? ` (${details.paymentPlan})` : ''
  const body = `New purchase: ${displayName} - ${product}${plan} - ${amountStr}`

  await Promise.allSettled(phones.map(phone => sendSMS({ to: phone, body })))
    .catch(err => console.error('[fulfillment] admin SMS failed:', err))
}

/** Household checkout includes a waived intensive for the invited partner. */
async function grantPartnerIntensive(supabaseAdmin: any, partnerUserId: string, adminUserId: string) {
  try {
    const { data: dbProd } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('key', 'intensive')
      .maybeSingle()
    if (!dbProd) return

    const { data: order } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: adminUserId,
        total_amount: 0,
        currency: 'usd',
        provider: 'paypal',
        status: 'paid',
        paid_at: new Date().toISOString(),
        metadata: { waived: 'true', source: 'household_checkout', granted_to: partnerUserId },
      })
      .select('id')
      .single()
    if (!order) return

    const { data: orderItem } = await supabaseAdmin
      .from('order_items')
      .insert({
        order_id: order.id,
        product_id: dbProd.id,
        quantity: 1,
        amount: 0,
        currency: 'usd',
        payment_plan: 'full',
        is_subscription: false,
        metadata: { granted_via: 'household_checkout' },
      })
      .select('id')
      .single()
    if (!orderItem) return

    await supabaseAdmin.from('intensive_checklist').insert({
      intensive_id: orderItem.id,
      user_id: partnerUserId,
    })
  } catch (err) {
    console.error('[fulfillment] grantPartnerIntensive error:', err)
  }
}
