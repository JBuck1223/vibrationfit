import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { stripe } from '@/lib/stripe/config'
import { findOrCreateStripeCustomerByEmail } from '@/lib/stripe/customer'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import Stripe from 'stripe'
import { toTitleCase } from '@/lib/utils'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const body = await request.json()
    const {
      name,
      email,
      phone,
      password,
      product,
      plan,
      continuity,
      planType,
      packKey,
      promoCode,
      referralSource,
      campaignName,
      cartSessionId,
      visitorId,
      sessionId,
      partnerFirstName,
      partnerLastName,
      partnerEmail,
      promoPackage,
    } = body as {
      name: string
      email: string
      phone: string
      password?: string
      product: string
      plan?: string
      continuity?: string
      planType?: string
      packKey?: string
      promoCode?: string
      promoPackage?: 'standard_promo' | 'premium_promo'
      referralSource?: string
      campaignName?: string
      cartSessionId?: string
      visitorId?: string
      sessionId?: string
      partnerFirstName?: string
      partnerLastName?: string
      partnerEmail?: string
    }

    if (!name || !email || !product) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (password != null && password.length > 0 && password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const hasPassword = typeof password === 'string' && password.length >= 8
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

    // ------------------------------------------------------------------
    // Resolve product first (needed for both payment and subscription paths)
    // ------------------------------------------------------------------
    const { resolveProduct } = await import('@/lib/billing/products')
    const checkoutProduct = await resolveProduct({ product, plan, continuity, planType, packKey })

    if (!checkoutProduct) {
      return NextResponse.json({ error: 'Invalid product configuration' }, { status: 400 })
    }

    if (promoPackage === 'standard_promo') {
      checkoutProduct.amount = 100
      checkoutProduct.mode = 'payment'
    }
    if (promoPackage) {
      checkoutProduct.metadata.promo_package = promoPackage
    }
    if (promoPackage === 'premium_promo') {
      checkoutProduct.metadata.intensive_level = 'premium'
    }

    // ------------------------------------------------------------------
    // Validate coupon (no userId for payment mode - redemption in webhook)
    // ------------------------------------------------------------------
    const { validateCouponCode, calculateDiscount, recordRedemption } = await import('@/lib/billing/coupons')
    let couponResult: Awaited<ReturnType<typeof validateCouponCode>> | null = null
    let discountAmount = 0
    if (promoCode) {
      couponResult = await validateCouponCode(promoCode, {
        productKey: product,
        purchaseAmount: checkoutProduct.amount,
      })
      if (couponResult.valid && couponResult.coupon) {
        discountAmount = calculateDiscount(couponResult.coupon, checkoutProduct.amount)
      }
    }

    // ------------------------------------------------------------------
    // PAYMENT MODE: create only PaymentIntent; user/order/checklist after payment (webhook)
    // ------------------------------------------------------------------
    if (checkoutProduct.mode === 'payment') {
      const paymentMetadata: Record<string, string> = {
        name,
        email,
        phone: phone || '',
        product,
        plan: plan || 'full',
        plan_type: planType || 'solo',
        continuity: continuity || '28day',
        promo_code: promoCode || '',
        referral_source: referralSource || '',
        campaign_name: campaignName || '',
        cart_session_id: cartSessionId || '',
        visitor_id: visitorId || '',
        session_id: sessionId || '',
        ...(partnerFirstName ? { partner_first_name: partnerFirstName } : {}),
        ...(partnerLastName ? { partner_last_name: partnerLastName } : {}),
        ...(partnerEmail ? { partner_email: partnerEmail } : {}),
        ...checkoutProduct.metadata,
      }
      let stripeCustomerId: string | null = null
      const customers = await stripe.customers.list({ email, limit: 1 })
      if (customers.data.length > 0) {
        stripeCustomerId = customers.data[0].id
      } else {
        const customer = await stripe.customers.create({
          email,
          name,
          phone: phone || undefined,
        })
        stripeCustomerId = customer.id
      }
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.max(0, checkoutProduct.amount - discountAmount),
        currency: checkoutProduct.currency,
        customer: stripeCustomerId,
        metadata: paymentMetadata,
        automatic_payment_methods: { enabled: true },
      })
      return NextResponse.json({
        clientSecret: paymentIntent.client_secret!,
        redirectUrl: `${appUrl}/checkout/success?payment_intent=${paymentIntent.id}`,
        orderId: null,
      })
    }

    // ------------------------------------------------------------------
    // SUBSCRIPTION MODE: create user, order, etc. before payment
    // ------------------------------------------------------------------
    const priceId = checkoutProduct.stripePriceId
    if (!priceId) {
      return NextResponse.json(
        { error: `Stripe price not configured for ${checkoutProduct.key}` },
        { status: 500 }
      )
    }

    let userId: string
    let redirectToSetupPassword = false
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === email)
    if (existingUser) {
      userId = existingUser.id
      if (hasPassword) {
        await supabaseAdmin.auth.admin.updateUserById(userId, { password: password! })
      } else {
        redirectToSetupPassword = true
      }
    } else {
      const tempPassword = hasPassword ? password! : randomBytes(32).toString('hex')
      const tempNameParts = (name || '').trim().split(' ')
      const tcFirst = tempNameParts[0] ? toTitleCase(tempNameParts[0]) : undefined
      const tcLast = tempNameParts.length > 1 ? toTitleCase(tempNameParts.slice(1).join(' ')) : undefined
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: [tcFirst, tcLast].filter(Boolean).join(' ') || undefined,
          first_name: tcFirst,
          last_name: tcLast,
          phone: phone || undefined,
        },
      })
      if (createError || !newUser?.user) {
        console.error('Failed to create user:', createError)
        return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
      }
      userId = newUser.user.id
      if (!hasPassword) redirectToSetupPassword = true
    }

    const nameParts = (name || '').trim().split(' ')
    const firstName = nameParts[0] ? toTitleCase(nameParts[0]) : null
    const lastName = nameParts.length > 1 ? toTitleCase(nameParts.slice(1).join(' ')) : null
    await supabaseAdmin.from('user_accounts').update({
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
    }).eq('id', userId)

    // ------------------------------------------------------------------
    // 2. Create or find the Stripe customer
    // ------------------------------------------------------------------
    let stripeCustomerId: string | null = null
    const { data: existingSub } = await supabaseAdmin
      .from('customer_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()
    if (existingSub?.stripe_customer_id) {
      stripeCustomerId = existingSub.stripe_customer_id
    }
    if (!stripeCustomerId) {
      const customers = await stripe.customers.list({ email, limit: 1 })
      if (customers.data.length > 0) {
        stripeCustomerId = customers.data[0].id
        await stripe.customers.update(stripeCustomerId, {
          metadata: { supabase_user_id: userId },
          name,
          phone: phone || undefined,
        })
      }
    }
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email,
        name,
        phone: phone || undefined,
        metadata: { supabase_user_id: userId },
      })
      stripeCustomerId = customer.id
    }

    let customerRowId: string | null = null
    const { data: existingCustomerRow } = await supabaseAdmin.from('customers').select('id').eq('user_id', userId).maybeSingle()
    if (existingCustomerRow) {
      customerRowId = existingCustomerRow.id
      await supabaseAdmin.from('customers').update({
        stripe_customer_id: stripeCustomerId,
        last_active_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', customerRowId)
    } else {
      let visitorData: Record<string, unknown> | null = null
      if (visitorId) {
        const { data } = await supabaseAdmin.from('visitors').select('*').eq('id', visitorId).single()
        visitorData = data
        if (visitorData && !(visitorData as any).user_id) {
          await supabaseAdmin.from('visitors').update({ user_id: userId }).eq('id', visitorId)
        }
      }
      const { data: newCustomerRow } = await supabaseAdmin.from('customers').insert({
        user_id: userId,
        visitor_id: visitorId || null,
        stripe_customer_id: stripeCustomerId,
        first_utm_source: (visitorData as any)?.first_utm_source || null,
        first_utm_medium: (visitorData as any)?.first_utm_medium || null,
        first_utm_campaign: (visitorData as any)?.first_utm_campaign || null,
        first_utm_content: (visitorData as any)?.first_utm_content || null,
        first_utm_term: (visitorData as any)?.first_utm_term || null,
        first_gclid: (visitorData as any)?.first_gclid || null,
        first_fbclid: (visitorData as any)?.first_fbclid || null,
        first_landing_page: (visitorData as any)?.first_landing_page || null,
        first_referrer: (visitorData as any)?.first_referrer || null,
        first_url_params: (visitorData as any)?.first_url_params || {},
        first_seen_at: (visitorData as any)?.first_seen_at || new Date().toISOString(),
        email_captured_at: new Date().toISOString(),
        first_purchase_at: new Date().toISOString(),
        last_purchase_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
        status: 'customer',
      }).select('id').single()
      customerRowId = newCustomerRow?.id || null
    }

    if (promoCode) {
      couponResult = await validateCouponCode(promoCode, {
        userId,
        productKey: product,
        purchaseAmount: checkoutProduct.amount,
      })
      if (couponResult.valid && couponResult.coupon) {
        discountAmount = calculateDiscount(couponResult.coupon, checkoutProduct.amount)
      }
    }

    const fullMetadata: Record<string, string> = {
      ...checkoutProduct.metadata,
      user_id: userId,
      promo_code: promoCode || '',
      referral_source: referralSource || '',
      campaign_name: campaignName || '',
      cart_session_id: cartSessionId || '',
      visitor_id: visitorId || '',
    }

    let clientSecret: string
    const subParams: Stripe.SubscriptionCreateParams = {
        customer: stripeCustomerId,
        items: [{ price: priceId, quantity: 1 }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: fullMetadata,
      }

      if (couponResult?.valid && couponResult.coupon && discountAmount > 0) {
        const isMultiPay = plan === '2pay' || plan === '3pay'
        const duration = isMultiPay ? 'forever' as const : 'once' as const
        const stripeCoupon = await stripe.coupons.create(
          couponResult.coupon.discount_type === 'percent'
            ? { percent_off: couponResult.coupon.discount_value, duration }
            : { amount_off: discountAmount, currency: 'usd', duration },
        );
        (subParams as any).coupon = stripeCoupon.id
      }

      const subscription = await stripe.subscriptions.create(subParams)
      const invoice = subscription.latest_invoice as any
      const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent
      clientSecret = paymentIntent.client_secret!

      if (couponResult?.valid && couponResult.coupon && couponResult.codeRow) {
        recordRedemption({
          couponId: couponResult.coupon.id,
          couponCodeId: couponResult.codeRow.id,
          userId,
          discountAmount,
          originalAmount: checkoutProduct.amount,
          productKey: product,
        }).catch(err => console.error('Failed to record coupon redemption:', err))
      }

    // ------------------------------------------------------------------
    // 7. Create order + order_items (wire up the order chain)
    // ------------------------------------------------------------------
    const { data: order } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: userId,
        customer_id: customerRowId,
        cart_session_id: cartSessionId || null,
        stripe_payment_intent_id: paymentIntent?.id || null,
        total_amount: checkoutProduct.amount - discountAmount,
        currency: checkoutProduct.currency,
        status: 'pending',
        promo_code: promoCode || null,
        referral_source: referralSource || null,
        campaign_name: campaignName || null,
        metadata: {
          product_key: product,
          plan,
          continuity,
          plan_type: planType,
          visitor_id: visitorId || null,
          session_id: sessionId || null,
        },
      })
      .select('id')
      .single()

    if (order) {
      // Look up the DB product ID for the order_item FK
      const productKey = product === 'intensive'
        ? 'intensive'
        : product === 'intensive_premium'
          ? 'intensive_premium'
          : product === 'token-pack' ? 'tokens' : product
      const { data: dbProd } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('key', productKey)
        .maybeSingle()

      if (dbProd) {
        const { data: orderItem, error: oiErr } = await supabaseAdmin.from('order_items').insert({
          order_id: order.id,
          product_id: dbProd.id,
          quantity: 1,
          amount: checkoutProduct.amount - discountAmount,
          currency: checkoutProduct.currency,
          payment_plan: plan || 'full',
          is_subscription: checkoutProduct.mode === 'subscription',
          promo_code: promoCode || null,
          referral_source: referralSource || null,
          campaign_name: campaignName || null,
          metadata: fullMetadata,
        }).select('id').single()
        if (oiErr) {
          console.error('Failed to create order_item:', oiErr)
        } else if (orderItem && (product === 'intensive' || product === 'intensive_premium' || fullMetadata?.product_type === 'combined_intensive_continuity')) {
          await supabaseAdmin.from('intensive_checklist').insert({
            intensive_id: orderItem.id,
            user_id: userId,
          })
        }
      }
    }

    // ------------------------------------------------------------------
    // 7b. For intensive subscriptions (2pay/3pay): create Vision Pro
    //     subscription with 56-day trial + grant trial tokens
    //     (mirrors what the webhook does for payment-mode intensives)
    // ------------------------------------------------------------------
    const isIntensiveProduct = product === 'intensive' || product === 'intensive_premium' || fullMetadata?.product_type === 'combined_intensive_continuity'
    if (isIntensiveProduct && order) {
      const continuityPlan = continuity || '28day'
      const continuityPriceId = continuityPlan === 'annual'
        ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL
        : process.env.NEXT_PUBLIC_STRIPE_PRICE_28DAY

      if (continuityPriceId && stripe) {
        try {
          const supabase = await createServerClient()
          const tierType = continuityPlan === 'annual' ? 'vision_pro_annual' : 'vision_pro_28day'
          const { data: tier } = await supabase
            .from('membership_tiers')
            .select('id')
            .eq('tier_type', tierType)
            .single()

          if (tier) {
            const visionProSubscription = await stripe.subscriptions.create({
              customer: stripeCustomerId,
              items: [{ price: continuityPriceId, quantity: 1 }],
              trial_period_days: 56,
              metadata: {
                product_type: 'vision_pro_continuity',
                tier_type: tierType,
                intensive_payment_plan: plan || 'full',
                continuity_plan: continuityPlan,
                billing_starts_day: '56',
              },
            })

            const { data: newSub } = await supabaseAdmin.from('customer_subscriptions').insert({
              user_id: userId,
              membership_tier_id: tier.id,
              stripe_customer_id: stripeCustomerId,
              stripe_subscription_id: visionProSubscription.id,
              stripe_price_id: continuityPriceId,
              status: 'trialing' as any,
              current_period_start: new Date((visionProSubscription as any).current_period_start * 1000).toISOString(),
              current_period_end: new Date((visionProSubscription as any).current_period_end * 1000).toISOString(),
              trial_start: new Date().toISOString(),
              trial_end: new Date(Date.now() + (56 * 24 * 60 * 60 * 1000)).toISOString(),
              order_id: order.id,
            }).select('id').single()

            await supabaseAdmin.from('user_accounts').update({
              membership_tier_id: tier.id,
            }).eq('id', userId)

            // Find the intensive order_item to grant trial tokens
            const { data: intensiveOI } = await supabaseAdmin
              .from('order_items')
              .select('id')
              .eq('order_id', order.id)
              .limit(1)
              .single()

            if (intensiveOI) {
              const { error: grantError } = await supabase.rpc('grant_trial_tokens', {
                p_user_id: userId,
                p_intensive_id: intensiveOI.id,
              })
              if (grantError) {
                console.error('Failed to grant trial tokens (subscription path):', grantError)
              }

              if (newSub?.id) {
                await supabaseAdmin.from('customer_subscriptions')
                  .update({ order_item_id: intensiveOI.id })
                  .eq('id', newSub.id)
              }
            }

            // Create household if plan type is 'household'
            if (planType === 'household') {
              try {
                const hhOwnerName = name?.split(' ')[0] || 'My'
                const { data: household, error: householdError } = await supabaseAdmin
                  .from('households')
                  .insert({
                    admin_user_id: userId,
                    name: `${toTitleCase(hhOwnerName)}'s Household`,
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

                  if (partnerFirstName && partnerLastName && partnerEmail) {
                    const { invitePartnerToHousehold } = await import('@/lib/supabase/household')
                    await invitePartnerToHousehold({
                      supabaseAdmin,
                      householdId: household.id,
                      adminUserId: userId,
                      adminName: name || 'A VibrationFit member',
                      adminEmail: email || '',
                      householdName: household.name,
                      partnerFirstName,
                      partnerLastName,
                      partnerEmail,
                    })
                  }
                }
              } catch (householdErr) {
                console.error('Household creation error (subscription path):', householdErr)
              }
            }

            // Create premium coaching checklist if this is a premium intensive
            const isPremium = product === 'intensive_premium' || promoPackage === 'premium_promo' || fullMetadata?.intensive_level === 'premium'
            if (isPremium && intensiveOI) {
              await Promise.resolve(supabaseAdmin.from('premium_coaching_sessions').insert({
                intensive_id: intensiveOI.id,
                user_id: userId,
                order_id: order.id,
              })).catch(err => console.error('Failed to create premium coaching record:', err))
            }
          }
        } catch (vpError) {
          console.error('Failed to create Vision Pro subscription (subscription path):', vpError)
        }
      }
    }

    // Mark cart as checkout_started if not already
    if (cartSessionId) {
      await supabaseAdmin
        .from('cart_sessions')
        .update({
          status: 'checkout_started',
          user_id: userId,
          email,
          updated_at: new Date().toISOString(),
        })
        .eq('id', cartSessionId)
    }

    // ------------------------------------------------------------------
    // 8. Journey event: purchase_completed + update customers metrics
    // ------------------------------------------------------------------
    await supabaseAdmin.from('journey_events').insert({
      visitor_id: visitorId || null,
      session_id: sessionId || null,
      user_id: userId,
      cart_session_id: cartSessionId || null,
      event_type: 'purchase_completed',
      event_data: {
        order_id: order?.id || null,
        product_key: product,
        amount: checkoutProduct.amount - discountAmount,
        promo_code: promoCode || null,
      },
    })

    // Update customers SSOT with purchase metrics
    if (customerRowId) {
      const { data: custData } = await supabaseAdmin
        .from('customers')
        .select('total_orders, total_spent')
        .eq('id', customerRowId)
        .single()

      await supabaseAdmin
        .from('customers')
        .update({
          total_orders: (custData?.total_orders || 0) + 1,
          total_spent: (custData?.total_spent || 0) + (checkoutProduct.amount - discountAmount),
          last_purchase_at: new Date().toISOString(),
          last_active_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', customerRowId)
    }

    // Mark session as converted
    if (sessionId) {
      await supabaseAdmin
        .from('sessions')
        .update({ converted: true, conversion_type: 'purchase' })
        .eq('id', sessionId)
    }

    // ------------------------------------------------------------------
    // 9. Return to client
    // ------------------------------------------------------------------
    const orderId = order?.id || null
    const piId = paymentIntent?.id || null
    const redirectUrl = piId
      ? `${appUrl}/checkout/success?payment_intent=${piId}`
      : orderId
        ? `${appUrl}/checkout/success?order_id=${orderId}`
        : checkoutProduct.redirectAfterSuccess

    return NextResponse.json({
      clientSecret,
      userId,
      redirectUrl,
      orderId,
    })
  } catch (error) {
    console.error('Create intent error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to create checkout intent', details: message }, { status: 500 })
  }
}
