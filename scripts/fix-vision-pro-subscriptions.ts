// scripts/fix-vision-pro-subscriptions.ts
// One-off script to fix all Vision Pro subscriptions:
//   - Attach customer's payment method (fixes the missing PM bug)
//   - Extend trial by 28 days
//   - Void outstanding incomplete/open invoices
//
// Usage:
//   npx tsx scripts/fix-vision-pro-subscriptions.ts          # dry-run (impact list)
//   npx tsx scripts/fix-vision-pro-subscriptions.ts --execute # apply changes

import Stripe from 'stripe'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(__dirname, '../.env.local') })

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
if (!STRIPE_SECRET_KEY) {
  console.error('Missing STRIPE_SECRET_KEY in .env.local')
  process.exit(1)
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-09-30.clover' as any })
const EXECUTE = process.argv.includes('--execute')
const TWENTY_EIGHT_DAYS = 28 * 24 * 60 * 60

interface SubInfo {
  index: number
  email: string
  subId: string
  status: string
  currentTrialEnd: string
  newTrialEnd: string
  hasPM: boolean
  pmToAttach: string | null
  openInvoices: number
}

async function getCustomerEmail(customerId: string): Promise<string> {
  const customer = await stripe.customers.retrieve(customerId)
  if (customer.deleted) return '(deleted)'
  return customer.email || '(no email)'
}

async function run() {
  console.log(EXECUTE ? '\n🚀 EXECUTING CHANGES\n' : '\n📋 DRY RUN — Impact List\n')

  const results: SubInfo[] = []
  let hasMore = true
  let page: string | undefined

  while (hasMore) {
    const searchResult = await stripe.subscriptions.search({
      query: "metadata['product_type']:'vision_pro_continuity'",
      limit: 100,
      ...(page ? { page } : {}),
    })

    for (const sub of searchResult.data) {
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
      const email = await getCustomerEmail(customerId)

      // Check for existing payment method on subscription
      const existingPM = sub.default_payment_method
        ? (typeof sub.default_payment_method === 'string'
            ? sub.default_payment_method
            : sub.default_payment_method.id)
        : null

      // Find customer's payment method if subscription doesn't have one
      let pmToAttach: string | null = null
      if (!existingPM) {
        const pms = await stripe.paymentMethods.list({
          customer: customerId,
          type: 'card',
          limit: 1,
        })
        pmToAttach = pms.data[0]?.id || null
      }

      // Calculate new trial end
      const now = Math.floor(Date.now() / 1000)
      const currentTrialEnd = sub.trial_end || now
      const newTrialEnd = Math.max(currentTrialEnd, now) + TWENTY_EIGHT_DAYS

      // Find open/incomplete invoices
      const invoices = await stripe.invoices.list({
        subscription: sub.id,
        status: 'open',
        limit: 100,
      })

      results.push({
        index: results.length + 1,
        email,
        subId: sub.id,
        status: sub.status,
        currentTrialEnd: currentTrialEnd ? new Date(currentTrialEnd * 1000).toLocaleDateString() : 'N/A',
        newTrialEnd: new Date(newTrialEnd * 1000).toLocaleDateString(),
        hasPM: !!existingPM,
        pmToAttach,
        openInvoices: invoices.data.length,
      })

      if (EXECUTE) {
        // 1. Update subscription: extend trial + attach PM
        const updateParams: Stripe.SubscriptionUpdateParams = {
          trial_end: newTrialEnd,
          proration_behavior: 'none',
        }
        const pmId = existingPM || pmToAttach
        if (pmId) {
          updateParams.default_payment_method = pmId
        }
        await stripe.subscriptions.update(sub.id, updateParams)

        // 2. Void open invoices
        for (const inv of invoices.data) {
          try {
            await stripe.invoices.voidInvoice(inv.id)
          } catch (err: any) {
            console.warn(`  ⚠️  Could not void invoice ${inv.id}: ${err.message}`)
          }
        }
      }
    }

    hasMore = searchResult.has_more
    page = searchResult.next_page ?? undefined
  }

  // Print impact table
  console.log('─'.repeat(140))
  console.log(
    padR('#', 4) +
    padR('Customer Email', 38) +
    padR('Sub ID', 30) +
    padR('Status', 14) +
    padR('Trial End (Current)', 22) +
    padR('Trial End (New)', 18) +
    padR('Has PM?', 9) +
    padR('PM to Attach', 12) +
    'Invoices to Void'
  )
  console.log('─'.repeat(140))

  for (const r of results) {
    console.log(
      padR(String(r.index), 4) +
      padR(r.email, 38) +
      padR(r.subId, 30) +
      padR(r.status, 14) +
      padR(r.currentTrialEnd, 22) +
      padR(r.newTrialEnd, 18) +
      padR(r.hasPM ? '✅' : '❌', 9) +
      padR(r.pmToAttach ? '✅' : (r.hasPM ? '—' : '⚠️ NONE'), 12) +
      String(r.openInvoices)
    )
  }

  console.log('─'.repeat(140))
  console.log(`\nTotal subscriptions: ${results.length}`)
  console.log(`  Need PM attached: ${results.filter(r => !r.hasPM && r.pmToAttach).length}`)
  console.log(`  Missing PM entirely: ${results.filter(r => !r.hasPM && !r.pmToAttach).length}`)
  console.log(`  Invoices to void: ${results.reduce((sum, r) => sum + r.openInvoices, 0)}`)

  if (!EXECUTE) {
    console.log('\n💡 Run with --execute to apply these changes.')
  } else {
    console.log('\n✅ All changes applied successfully.')
  }
}

function padR(str: string, len: number): string {
  return str.slice(0, len).padEnd(len)
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Script failed:', err)
    process.exit(1)
  })
