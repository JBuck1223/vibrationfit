// Persist a PayPal vault token and point unattached PayPal subscriptions at it.
// The unique index on paypal_vault_id is partial, so PostgREST upsert
// (ON CONFLICT paypal_vault_id) cannot use it. Insert-or-update instead.

import type { SupabaseClient } from '@supabase/supabase-js'

export type VaultedCardInput = {
  vaultId: string
  paypalCustomerId?: string | null
  brand?: string | null
  last4?: string | null
  expiry?: string | null
}

export async function savePayPalVaultedCard(
  supabaseAdmin: SupabaseClient,
  userId: string,
  card: VaultedCardInput,
): Promise<string | null> {
  const row = {
    user_id: userId,
    provider: 'paypal',
    paypal_vault_id: card.vaultId,
    paypal_customer_id: card.paypalCustomerId || null,
    brand: card.brand || null,
    last4: card.last4 || null,
    expiry: card.expiry || null,
    status: 'active',
    is_default: true,
    updated_at: new Date().toISOString(),
  }

  const { data: existing } = await supabaseAdmin
    .from('payment_methods')
    .select('id')
    .eq('paypal_vault_id', card.vaultId)
    .maybeSingle()

  let paymentMethodId = existing?.id || null
  if (existing) {
    const { error } = await supabaseAdmin
      .from('payment_methods')
      .update(row)
      .eq('id', existing.id)
    if (error) {
      console.error('[paypal] payment method update failed', error)
      return null
    }
  } else {
    const { data: inserted, error } = await supabaseAdmin
      .from('payment_methods')
      .insert(row)
      .select('id')
      .single()
    if (error || !inserted) {
      const { data: raced } = await supabaseAdmin
        .from('payment_methods')
        .select('id')
        .eq('paypal_vault_id', card.vaultId)
        .maybeSingle()
      if (!raced) {
        console.error('[paypal] payment method insert failed', error)
        return null
      }
      paymentMethodId = raced.id
      await supabaseAdmin.from('payment_methods').update(row).eq('id', raced.id)
    } else {
      paymentMethodId = inserted.id
    }
  }

  if (!paymentMethodId) return null

  await supabaseAdmin
    .from('payment_methods')
    .update({ is_default: false, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('is_default', true)
    .neq('id', paymentMethodId)

  const { error: subErr } = await supabaseAdmin
    .from('customer_subscriptions')
    .update({ payment_method_id: paymentMethodId, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('provider', 'paypal')
    .in('status', ['active', 'trialing', 'past_due'])
    .is('payment_method_id', null)
  if (subErr) {
    console.error('[paypal] subscription payment method attach failed', subErr)
  }

  await linkPayPalCustomer(supabaseAdmin, userId, card.paypalCustomerId)

  return paymentMethodId
}

/** Keep PayPal's vault customer id on our customer row, same idea as stripe_customer_id. */
export async function linkPayPalCustomer(
  supabaseAdmin: SupabaseClient,
  userId: string,
  paypalCustomerId: string | null | undefined,
): Promise<void> {
  if (!paypalCustomerId) return
  const { error } = await supabaseAdmin
    .from('customers')
    .update({ paypal_customer_id: paypalCustomerId, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('paypal_customer_id', null)
  if (error) console.error('[paypal] customer link failed', error)
}
