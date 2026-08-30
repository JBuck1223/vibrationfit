// Save/update a card without a purchase (PayPal Vault setup tokens).
//
// POST { action: 'setup' }                    → create a setup token for CardFields
// POST { action: 'confirm', setupTokenId }    → exchange for a permanent vault
//   token, save it as the member's default card, point their subscriptions at
//   it, and — for past_due members — reset failures so the next cron run
//   retries the renewal immediately.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { isPayPalConfigured } from '@/lib/paypal/client'
import { createVaultSetupToken, createPaymentTokenFromSetupToken } from '@/lib/paypal/vault'

export async function POST(request: NextRequest) {
  try {
    if (!isPayPalConfigured()) {
      return NextResponse.json({ error: 'PayPal not configured' }, { status: 500 })
    }

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body as { action?: string }

    if (action === 'setup') {
      const setupToken = await createVaultSetupToken()
      return NextResponse.json({ setupTokenId: setupToken.id })
    }

    if (action === 'confirm') {
      const { setupTokenId } = body as { setupTokenId?: string }
      if (!setupTokenId) {
        return NextResponse.json({ error: 'Missing setup token' }, { status: 400 })
      }

      const card = await createPaymentTokenFromSetupToken(setupTokenId)
      const serviceClient = createServiceClient()

      // One default per user: demote existing defaults first
      await serviceClient
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('is_default', true)

      // Idempotent confirm retries return the same vault id, so check first
      // (the unique index on paypal_vault_id is partial — upsert can't use it)
      const { data: existing } = await serviceClient
        .from('payment_methods')
        .select('id')
        .eq('paypal_vault_id', card.vaultId)
        .maybeSingle()

      const pmRow = {
        user_id: user.id,
        provider: 'paypal',
        paypal_vault_id: card.vaultId,
        paypal_customer_id: card.paypalCustomerId,
        brand: card.brand,
        last4: card.last4,
        expiry: card.expiry,
        status: 'active',
        is_default: true,
      }

      const { data: pm, error: pmErr } = existing
        ? await serviceClient
            .from('payment_methods')
            .update(pmRow)
            .eq('id', existing.id)
            .select('id')
            .single()
        : await serviceClient
            .from('payment_methods')
            .insert(pmRow)
            .select('id')
            .single()

      if (pmErr || !pm) {
        console.error('vault-card: payment_methods save failed', pmErr)
        return NextResponse.json({ error: 'Failed to save card' }, { status: 500 })
      }

      // Point the member's DB-driven subscriptions at the new card
      await serviceClient
        .from('customer_subscriptions')
        .update({ payment_method_id: pm.id, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('provider', 'paypal')
        .in('status', ['active', 'trialing', 'past_due'])

      // Past-due recovery: reset failures and make the renewal due now so the
      // next cron run retries with the new card
      const { data: pastDueSubs } = await serviceClient
        .from('customer_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('provider', 'paypal')
        .eq('status', 'past_due')

      if (pastDueSubs && pastDueSubs.length > 0) {
        await serviceClient
          .from('customer_subscriptions')
          .update({
            status: 'active',
            failure_count: 0,
            next_billing_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .in('id', pastDueSubs.map(s => s.id))
      }

      return NextResponse.json({
        success: true,
        card: { brand: card.brand, last4: card.last4, expiry: card.expiry },
        pastDueRetryScheduled: (pastDueSubs?.length || 0) > 0,
      })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error: any) {
    console.error('vault-card error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to save card' }, { status: 500 })
  }
}
