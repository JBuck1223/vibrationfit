import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { stripe } from '@/lib/stripe/config'
import {
  resolveStripePriceId,
  getSeatPricing,
  getFamilyActivationAmount,
  seatConfigFromTier,
} from '@/lib/billing/products'
import {
  getActiveMembershipSubscription,
  isPayPalSubscription,
  getVaultMethod,
  remainingCycleFraction,
  chargeMemberVault,
  recomputeSubscriptionAmount,
} from '@/lib/paypal/vault-billing'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      firstName,
      lastName,
      email,
      promoCode,
    } = (await request.json()) as {
      firstName: string
      lastName: string
      email: string
      promoCode?: string
    }

    if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'First name, last name, and email are required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    const { data: membership } = await serviceClient
      .from('household_members')
      .select('household_id')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .eq('status', 'active')
      .maybeSingle()

    if (!membership) {
      return NextResponse.json({ error: 'You are not a household admin' }, { status: 403 })
    }

    const { data: household } = await serviceClient
      .from('households')
      .select('id, name, max_members')
      .eq('id', membership.household_id)
      .single()

    if (!household) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 })
    }

    const { count: memberCount } = await serviceClient
      .from('household_members')
      .select('id', { count: 'exact', head: true })
      .eq('household_id', household.id)
      .eq('status', 'active')

    const { count: pendingInviteCount } = await serviceClient
      .from('household_invitations')
      .select('id', { count: 'exact', head: true })
      .eq('household_id', household.id)
      .eq('status', 'pending')

    const totalOccupied = (memberCount || 0) + (pendingInviteCount || 0)

    const { data: existingInvite } = await serviceClient
      .from('household_invitations')
      .select('id')
      .eq('household_id', household.id)
      .eq('invited_email', email.trim().toLowerCase())
      .eq('status', 'pending')
      .maybeSingle()

    if (existingInvite) {
      return NextResponse.json({ error: 'This person already has a pending invitation' }, { status: 400 })
    }

    const subscription = await getActiveMembershipSubscription(serviceClient, user.id)
    if (!subscription) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 })
    }

    const usePayPal = isPayPalSubscription(subscription)
    if (!usePayPal && (!subscription.stripe_subscription_id || !subscription.stripe_customer_id)) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 })
    }
    if (!usePayPal && !stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    // Seat limits come from the membership tier (editable in admin)
    const tier = subscription.membership_tiers
    const { includedSeats, maxHouseholdMembers } = seatConfigFromTier(tier)

    if (totalOccupied + 1 > maxHouseholdMembers) {
      return NextResponse.json({
        error: `Your plan allows up to ${maxHouseholdMembers} household members.`,
      }, { status: 400 })
    }

    const paidSeatsNeeded = Math.max(0, totalOccupied + 1 - includedSeats)
    const isIncludedSeat = totalOccupied + 1 <= includedSeats

    // Household plans include intensives for the included seats. An included
    // seat gets its intensive provisioned at no charge; every additional
    // member is a Family Activation (DB-priced one-time + seat).
    const intensiveCoveredByPlan =
      isIncludedSeat && Boolean(tier?.tier_type?.startsWith('vision_pro_household'))

    const familyActivationAmount = await getFamilyActivationAmount()

    // ── Step 1: Provision partner account + household membership FIRST ──
    const { data: adminAccount } = await serviceClient
      .from('user_accounts')
      .select('first_name, last_name')
      .eq('id', user.id)
      .maybeSingle()

    const adminName = adminAccount?.first_name
      ? `${adminAccount.first_name} ${adminAccount.last_name || ''}`.trim()
      : 'A Vibration Fit member'

    const { invitePartnerToHousehold } = await import('@/lib/supabase/household')
    const inviteResult = await invitePartnerToHousehold({
      supabaseAdmin: serviceClient,
      householdId: household.id,
      adminUserId: user.id,
      adminName,
      adminEmail: user.email || '',
      householdName: household.name,
      partnerFirstName: firstName.trim(),
      partnerLastName: lastName.trim(),
      partnerEmail: email.trim().toLowerCase(),
    })

    if (!inviteResult.success) {
      return NextResponse.json({
        error: inviteResult.error || 'Failed to provision partner account',
      }, { status: 500 })
    }

    const partnerId = inviteResult.partnerId

    if (usePayPal) {
      return handlePayPalMember({
        serviceClient,
        user,
        subscription,
        partnerId: partnerId!,
        partnerFirstName: firstName.trim(),
        partnerLastName: lastName.trim(),
        partnerEmail: email.trim().toLowerCase(),
        promoCode,
        intensiveCoveredByPlan,
        familyActivationAmount,
        paidSeatsNeeded,
        totalOccupied,
      })
    }

    // ── Stripe path (legacy subscriptions) ──────────────────────────────────

    // ── Step 2: Charge intensive (assigned to partner, not admin) ──
    let intensiveResult: { success: boolean; invoiceId?: string; waived?: boolean; error?: string } = { success: false }
    try {
      const intensiveUrl = new URL('/api/billing/purchase-intensive', request.url)
      const intensiveRes = await fetch(intensiveUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: request.headers.get('cookie') || '',
        },
        body: JSON.stringify({
          overrideAmount: familyActivationAmount,
          includedInPlan: intensiveCoveredByPlan,
          promoCode: promoCode || undefined,
          partnerFirstName: firstName.trim(),
          partnerLastName: lastName.trim(),
          partnerEmail: email.trim().toLowerCase(),
          targetUserId: partnerId,
        }),
      })
      intensiveResult = await intensiveRes.json()
      if (!intensiveRes.ok) {
        return NextResponse.json({
          error: `Intensive charge failed: ${intensiveResult.error || 'Unknown error'}`,
        }, { status: 402 })
      }
    } catch (err: any) {
      console.error('Intensive purchase call failed:', err)
      return NextResponse.json({ error: 'Failed to charge intensive fee' }, { status: 500 })
    }

    // ── Step 3: Add seat to subscription if needed ──
    if (paidSeatsNeeded > 0) {
      try {
        const stripeSubscription = await stripe!.subscriptions.retrieve(subscription.stripe_subscription_id!)
        const mainItem = stripeSubscription.items.data[0]
        if (!mainItem?.price?.recurring) {
          return NextResponse.json({ error: 'Unable to determine billing interval' }, { status: 500 })
        }

        // Seat price must match the base subscription's interval: legacy subs
        // bill day/28, post-Jul-2026 subs bill month/1.
        const intervalKey =
          mainItem.price.recurring.interval === 'year' ? 'annual' as const
          : mainItem.price.recurring.interval === 'day' ? '28day' as const
          : 'month' as const
        const seatPriceId = await resolveStripePriceId('seats', intervalKey)

        if (!seatPriceId) {
          return NextResponse.json({ error: 'Seat add-on price not configured' }, { status: 500 })
        }

        const existingSeatItem = stripeSubscription.items.data.find(
          item => item.price.id === seatPriceId
        )

        const items: any[] = []
        if (existingSeatItem) {
          items.push({ id: existingSeatItem.id, quantity: paidSeatsNeeded })
        } else {
          items.push({ price: seatPriceId, quantity: paidSeatsNeeded })
        }

        await stripe!.subscriptions.update(subscription.stripe_subscription_id!, {
          items,
          proration_behavior: 'create_prorations',
        })
      } catch (err: any) {
        console.error('Seat add-on update failed:', err)
        return NextResponse.json({
          error: 'Intensive charged but seat add-on failed. Contact support.',
          intensiveCharged: true,
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      partnerInvited: true,
      partnerId,
      intensiveWaived: intensiveResult.waived || false,
      intensiveIncludedInPlan: intensiveCoveredByPlan,
      paidSeats: paidSeatsNeeded,
      totalMembers: totalOccupied + 1,
    })
  } catch (error: any) {
    console.error('Add household member error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to add member' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// PayPal path: intensive charged via vaulted card, seat as subscription_addons
// row summed into the renewal by the billing cron.
// ---------------------------------------------------------------------------
async function handlePayPalMember(params: {
  serviceClient: ReturnType<typeof createServiceClient>
  user: { id: string; email?: string | null }
  subscription: NonNullable<Awaited<ReturnType<typeof getActiveMembershipSubscription>>>
  partnerId: string
  partnerFirstName: string
  partnerLastName: string
  partnerEmail: string
  promoCode?: string
  intensiveCoveredByPlan: boolean
  familyActivationAmount: number
  paidSeatsNeeded: number
  totalOccupied: number
}) {
  const {
    serviceClient, user, subscription, partnerId,
    intensiveCoveredByPlan, familyActivationAmount, paidSeatsNeeded, totalOccupied,
  } = params

  const vault = await getVaultMethod(serviceClient, user.id, subscription.payment_method_id)
  const needsCharge = !intensiveCoveredByPlan && familyActivationAmount > 0
  if (!vault && (needsCharge || paidSeatsNeeded > 0)) {
    return NextResponse.json({
      error: 'No payment method on file. Please update your card in Billing first.',
    }, { status: 402 })
  }

  // ── Step 2: Family Activation Intensive ──
  let intensiveAmount = intensiveCoveredByPlan ? 0 : familyActivationAmount
  let couponResult: any = null
  let discountAmount = 0
  if (params.promoCode && !intensiveCoveredByPlan) {
    const { validateCouponCode, calculateDiscount } = await import('@/lib/billing/coupons')
    couponResult = await validateCouponCode(params.promoCode, {
      userId: user.id,
      productKey: 'intensive',
      purchaseAmount: intensiveAmount,
    })
    if (couponResult.valid && couponResult.coupon) {
      discountAmount = calculateDiscount(couponResult.coupon, intensiveAmount)
      intensiveAmount = Math.max(0, intensiveAmount - discountAmount)
    }
  }

  const intensiveMetadata: Record<string, string> = {
    user_id: user.id,
    purchase_type: 'intensive_addon',
    product_type: 'standalone_intensive',
    source: 'billing_upgrade',
    promo_code: params.promoCode || '',
    partner_first_name: params.partnerFirstName,
    partner_last_name: params.partnerLastName,
    partner_email: params.partnerEmail,
    ...(intensiveCoveredByPlan ? { included_in_household_plan: 'true' } : {}),
  }

  let charge: Awaited<ReturnType<typeof chargeMemberVault>> | null = null
  if (intensiveAmount > 0) {
    try {
      charge = await chargeMemberVault({
        serviceClient,
        userId: user.id,
        subscriptionId: subscription.id,
        vault: vault!,
        amountCents: intensiveAmount,
        description: 'Family Activation Intensive (includes first 28 days of access)',
        requestId: `family-activation-${subscription.id}-${partnerId}`,
        metadata: { partner_id: partnerId, purchase_type: 'intensive_addon' },
      })
    } catch (err: any) {
      return NextResponse.json({
        error: `Intensive charge failed: ${err?.message || 'Card declined'}`,
      }, { status: 402 })
    }
  }

  // Record the order + order item + intensive checklist for the partner
  const { data: order } = await serviceClient
    .from('orders')
    .insert({
      user_id: user.id,
      provider: 'paypal',
      paypal_order_id: charge?.orderId || null,
      paypal_capture_id: charge?.captureId || null,
      total_amount: intensiveAmount,
      currency: 'usd',
      status: 'paid',
      paid_at: new Date().toISOString(),
      promo_code: params.promoCode || null,
      metadata: {
        ...intensiveMetadata,
        ...(intensiveAmount === 0 ? { waived: 'true' } : {}),
      },
    })
    .select('id')
    .single()

  if (order) {
    const { data: dbProd } = await serviceClient
      .from('products')
      .select('id')
      .eq('key', 'intensive')
      .maybeSingle()
    if (dbProd) {
      const { data: orderItem } = await serviceClient
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: dbProd.id,
          quantity: 1,
          amount: intensiveAmount,
          currency: 'usd',
          payment_plan: 'full',
          is_subscription: false,
          promo_code: params.promoCode || null,
          metadata: intensiveMetadata,
        })
        .select('id')
        .single()
      if (orderItem) {
        await serviceClient.from('intensive_checklist').insert({
          intensive_id: orderItem.id,
          user_id: partnerId,
        })
      }
    }
  }

  if (params.promoCode && couponResult?.valid && couponResult.coupon && couponResult.codeRow) {
    const { recordRedemption } = await import('@/lib/billing/coupons')
    await recordRedemption({
      couponId: couponResult.coupon.id,
      couponCodeId: couponResult.codeRow.id,
      userId: user.id,
      discountAmount,
      originalAmount: familyActivationAmount,
      productKey: 'intensive',
      orderId: order?.id,
    }).catch(err => console.error('Failed to record coupon redemption:', err))
  }

  // ── Step 3: Seat add-on (beyond included seats) ──
  let prorationCharged = 0
  if (paidSeatsNeeded > 0) {
    const intervalKey = subscription.membership_tiers?.billing_interval === 'year' ? 'annual' : '28day'
    const seatPrice = await getSeatPricing(intervalKey)
    if (!seatPrice) {
      return NextResponse.json({
        error: 'Intensive charged but seat pricing is not configured. Contact support.',
        intensiveCharged: intensiveAmount > 0,
      }, { status: 500 })
    }

    const { data: existingSeatAddon } = await serviceClient
      .from('subscription_addons')
      .select('id, quantity, unit_amount_cents')
      .eq('subscription_id', subscription.id)
      .eq('addon_type', 'seat')
      .eq('status', 'active')
      .maybeSingle()

    const currentSeats = existingSeatAddon?.quantity || 0
    const seatsToAdd = paidSeatsNeeded - currentSeats

    if (seatsToAdd > 0) {
      // Day-based proration for the remainder of the current cycle
      const fraction = remainingCycleFraction(subscription)
      const prorationCents = Math.round(seatsToAdd * seatPrice.unitAmount * fraction)

      if (prorationCents > 0) {
        try {
          await chargeMemberVault({
            serviceClient,
            userId: user.id,
            subscriptionId: subscription.id,
            vault: vault!,
            amountCents: prorationCents,
            description: `Household seat add-on — prorated for current cycle`,
            requestId: `seat-proration-${subscription.id}-${partnerId}`,
            metadata: { seats_added: seatsToAdd, partner_id: partnerId },
          })
          prorationCharged = prorationCents
        } catch (err: any) {
          return NextResponse.json({
            error: `Intensive charged but the prorated seat charge failed: ${err?.message || 'Card declined'}. Contact support.`,
            intensiveCharged: intensiveAmount > 0,
          }, { status: 402 })
        }
      }

      if (existingSeatAddon) {
        await serviceClient
          .from('subscription_addons')
          .update({
            quantity: paidSeatsNeeded,
            unit_amount_cents: seatPrice.unitAmount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingSeatAddon.id)
      } else {
        await serviceClient.from('subscription_addons').insert({
          subscription_id: subscription.id,
          addon_type: 'seat',
          quantity: paidSeatsNeeded,
          unit_amount_cents: seatPrice.unitAmount,
          grant_amount: 0,
          grant_unit: null,
          status: 'active',
          metadata: { price_id: seatPrice.priceId, source: 'add_household_member' },
        })
      }

      await recomputeSubscriptionAmount(serviceClient, subscription.id)
    }
  }

  return NextResponse.json({
    success: true,
    partnerInvited: true,
    partnerId,
    intensiveWaived: intensiveAmount === 0 && !intensiveCoveredByPlan,
    intensiveIncludedInPlan: intensiveCoveredByPlan,
    intensiveCharged: intensiveAmount,
    paidSeats: paidSeatsNeeded,
    prorationCharged,
    totalMembers: totalOccupied + 1,
  })
}
