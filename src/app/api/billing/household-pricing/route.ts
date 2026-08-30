// DB-driven household pricing for the billing UI: seat limits from the
// member's tier, seat + Family Activation prices from product_prices.
// Everything here is editable in /admin/products and /admin (tiers).

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getSeatPricing, getFamilyActivationAmount, seatConfigFromTier } from '@/lib/billing/products'
import { getActiveMembershipSubscription } from '@/lib/paypal/vault-billing'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceClient = createServiceClient()
    const subscription = await getActiveMembershipSubscription(serviceClient, user.id)
    const { includedSeats, maxHouseholdMembers } = seatConfigFromTier(subscription?.membership_tiers)

    const [seat28day, seatAnnual, familyActivation] = await Promise.all([
      getSeatPricing('28day'),
      getSeatPricing('annual'),
      getFamilyActivationAmount(),
    ])

    return NextResponse.json({
      includedSeats,
      maxHouseholdMembers,
      seatPrice28day: seat28day?.unitAmount ?? 2900,
      seatPriceAnnual: seatAnnual?.unitAmount ?? 29000,
      familyActivationPrice: familyActivation,
    })
  } catch (error) {
    console.error('household-pricing error:', error)
    return NextResponse.json({ error: 'Failed to load pricing' }, { status: 500 })
  }
}
