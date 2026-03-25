import { SupabaseClient } from '@supabase/supabase-js'

interface EnsureCustomerOptions {
  userId: string
  visitorId?: string | null
  stripeCustomerId?: string | null
  leadId?: string | null
  isPurchase?: boolean
}

/**
 * Ensures a customers row exists for the given user and that first-touch
 * attribution from the visitors table is copied over.
 *
 * Called from create-intent AND the Stripe webhook so every customer
 * row gets attribution regardless of which path creates it first.
 *
 * Returns the customer row id (or null on failure).
 */
export async function ensureCustomerWithAttribution(
  supabase: SupabaseClient,
  opts: EnsureCustomerOptions
): Promise<string | null> {
  const { userId, visitorId, stripeCustomerId, leadId, isPurchase } = opts

  let visitorData: Record<string, unknown> | null = null
  if (visitorId) {
    const { data } = await supabase
      .from('visitors')
      .select('*')
      .eq('id', visitorId)
      .maybeSingle()
    visitorData = data

    if (visitorData && !(visitorData as any).user_id) {
      await supabase
        .from('visitors')
        .update({ user_id: userId })
        .eq('id', visitorId)
    }
  }

  const { data: existing } = await supabase
    .from('customers')
    .select('id, first_utm_source, first_seen_at')
    .eq('user_id', userId)
    .maybeSingle()

  const now = new Date().toISOString()

  if (existing) {
    const updates: Record<string, unknown> = {
      last_active_at: now,
      updated_at: now,
    }
    if (stripeCustomerId) updates.stripe_customer_id = stripeCustomerId
    if (visitorId && !existing.first_seen_at) updates.visitor_id = visitorId
    if (leadId) updates.lead_id = leadId
    if (isPurchase) {
      updates.last_purchase_at = now
      updates.status = 'customer'
    }

    const needsAttribution = !existing.first_utm_source && !existing.first_seen_at
    if (needsAttribution && visitorData) {
      updates.first_utm_source = (visitorData.first_utm_source as string) || null
      updates.first_utm_medium = (visitorData.first_utm_medium as string) || null
      updates.first_utm_campaign = (visitorData.first_utm_campaign as string) || null
      updates.first_utm_content = (visitorData.first_utm_content as string) || null
      updates.first_utm_term = (visitorData.first_utm_term as string) || null
      updates.first_gclid = (visitorData.first_gclid as string) || null
      updates.first_fbclid = (visitorData.first_fbclid as string) || null
      updates.first_landing_page = (visitorData.first_landing_page as string) || null
      updates.first_referrer = (visitorData.first_referrer as string) || null
      updates.first_url_params = visitorData.first_url_params || {}
      updates.first_seen_at = (visitorData.first_seen_at as string) || now
      if (!existing.first_seen_at) updates.visitor_id = visitorId
    }

    await supabase.from('customers').update(updates).eq('id', existing.id)
    return existing.id
  }

  const { data: newRow } = await supabase
    .from('customers')
    .insert({
      user_id: userId,
      visitor_id: visitorId || null,
      stripe_customer_id: stripeCustomerId || null,
      lead_id: leadId || null,

      first_utm_source: (visitorData?.first_utm_source as string) || null,
      first_utm_medium: (visitorData?.first_utm_medium as string) || null,
      first_utm_campaign: (visitorData?.first_utm_campaign as string) || null,
      first_utm_content: (visitorData?.first_utm_content as string) || null,
      first_utm_term: (visitorData?.first_utm_term as string) || null,
      first_gclid: (visitorData?.first_gclid as string) || null,
      first_fbclid: (visitorData?.first_fbclid as string) || null,
      first_landing_page: (visitorData?.first_landing_page as string) || null,
      first_referrer: (visitorData?.first_referrer as string) || null,
      first_url_params: visitorData?.first_url_params || {},

      first_seen_at: (visitorData?.first_seen_at as string) || now,
      email_captured_at: now,
      ...(isPurchase
        ? { first_purchase_at: now, last_purchase_at: now }
        : {}),
      last_active_at: now,
      status: isPurchase ? 'customer' : 'lead',
    })
    .select('id')
    .single()

  return newRow?.id || null
}
