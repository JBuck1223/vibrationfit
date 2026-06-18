import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/config'

// ---------------------------------------------------------------------------
// Friendly billing-history labels. Stripe's raw text is ugly ("Subscription
// creation", "1 × Vision Pro 28 Day (at $99.00 / every 28 days)"). We derive a
// clean name from the data on the charge/invoice — edit the strings below to
// rename what members see.
//
//  - Recurring (subscription) payments are named by billing cadence.
//  - One-time payments are named by their metadata `product` key.
//  - Exact Stripe price ids can be force-mapped in PRICE_LABELS if you ever
//    need a one-off override.
// ---------------------------------------------------------------------------
const MEMBERSHIP_NAME = 'Vision Pro Membership'

const PRICE_LABELS: Record<string, string> = {
  // 'price_xxx': 'Custom Label',
}

const PRODUCT_LABELS: Record<string, string> = {
  intensive: 'Activation Intensive',
  intensive_premium: 'Activation Intensive (Premium)',
  'token-pack': 'VIVA Token Pack',
  tokens: 'VIVA Token Pack',
}

function paymentLabel(charge: any, invoice: any): string {
  const line = invoice?.lines?.data?.[0]
  const price = line?.price

  // One-off override by exact price id.
  if (price?.id && PRICE_LABELS[price.id]) return PRICE_LABELS[price.id]

  // Recurring subscription payment → name by cadence (env-independent).
  const recurring = price?.recurring
  if (recurring) {
    return recurring.interval === 'year'
      ? `${MEMBERSHIP_NAME} (Annual)`
      : `${MEMBERSHIP_NAME} (28-Day)`
  }

  // One-time payment → name by product metadata.
  const product = charge?.metadata?.product || invoice?.metadata?.product
  if (product && PRODUCT_LABELS[product]) return PRODUCT_LABELS[product]

  // Fall back to Stripe's own text rather than show nothing.
  return line?.description || invoice?.description || charge?.description || 'Payment'
}

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

    const { data: subscription } = await supabase
      .from('customer_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .not('stripe_customer_id', 'is', null)
      .limit(1)
      .maybeSingle()

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json({ invoices: [] })
    }

    // Billing history = a legit record of every real payment. In Stripe each
    // payment is exactly one Charge, so we base the list on succeeded charges
    // (one row per payment — no invoice/charge duplication). When a charge is
    // tied to an invoice we enrich it with the invoice's description, number,
    // and PDF; standalone charges (e.g. the Activation Intensive PaymentIntent)
    // use their own details. Unpaid `open`/`draft`/`void` invoices from failed
    // trial conversions or abandoned attempts never appear (they aren't payments).
    const stripeCharges = await stripe.charges.list({
      customer: subscription.stripe_customer_id,
      limit: 100,
      expand: ['data.invoice'],
    })

    const invoices = stripeCharges.data
      .filter(ch => ch.paid && ch.status === 'succeeded')
      .sort((a, b) => (b.created || 0) - (a.created || 0))
      .slice(0, 24)
      .map(ch => {
        const inv = (ch.invoice && typeof ch.invoice === 'object') ? ch.invoice as any : null
        const fullyRefunded = ch.refunded
        const line = inv?.lines?.data?.[0]
        const periodStartUnix = line?.period?.start ?? inv?.period_start
        const periodEndUnix = line?.period?.end ?? inv?.period_end
        const toIso = (u: any) => {
          const n = Number(u)
          return Number.isFinite(n) && n > 0 ? new Date(n * 1000).toISOString() : null
        }
        return {
          id: ch.id,
          number: inv?.number || ch.receipt_number || null,
          date: ch.created ? new Date(ch.created * 1000).toISOString() : null,
          periodStart: toIso(periodStartUnix),
          periodEnd: toIso(periodEndUnix),
          amountPaid: ch.amount,
          amountRefunded: ch.amount_refunded || 0,
          currency: ch.currency,
          status: fullyRefunded ? 'refunded' : 'paid',
          description: paymentLabel(ch, inv),
          pdfUrl: inv?.invoice_pdf || null,
          hostedUrl: inv?.hosted_invoice_url || ch.receipt_url || null,
        }
      })

    return NextResponse.json({ invoices })
  } catch (error) {
    console.error('Invoices API error:', error)
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}
