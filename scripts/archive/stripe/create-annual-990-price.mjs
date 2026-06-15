// scripts/stripe/create-annual-990-price.mjs
// One-off: create a new $990/yr Vision Pro Annual price (10 months, 2 free)
// on the same product as the existing live annual price, then archive the old
// $999 price. Prints the new price ID to paste into NEXT_PUBLIC_STRIPE_PRICE_ANNUAL.

import { config } from 'dotenv'
import path from 'node:path'
import Stripe from 'stripe'

config({ path: path.resolve(process.cwd(), '.env.local') })

const secret = process.env.STRIPE_SECRET_KEY
if (!secret) {
  console.error('Missing STRIPE_SECRET_KEY')
  process.exit(1)
}
if (!secret.startsWith('sk_live')) {
  console.warn('WARNING: STRIPE_SECRET_KEY is not a live key — this will run against test mode.')
}

const stripe = new Stripe(secret)

// Current LIVE Vision Pro Annual price (the $999/yr one we are replacing).
const OLD_LIVE_ANNUAL = process.argv[2] || 'price_1SHGXhFVKmXx41XwJlMJbUJa'

async function main() {
  const old = await stripe.prices.retrieve(OLD_LIVE_ANNUAL)
  const productId = typeof old.product === 'string' ? old.product : old.product.id

  console.log('Old annual price:')
  console.log('  id:', old.id)
  console.log('  amount:', old.unit_amount, old.currency)
  console.log('  interval:', old.recurring?.interval)
  console.log('  product:', productId)

  const newPrice = await stripe.prices.create({
    product: productId,
    currency: old.currency || 'usd',
    unit_amount: 99000, // $990.00
    recurring: { interval: 'year' },
    nickname: 'Vision Pro Annual — $990/yr (10 months, 2 free)',
  })

  console.log('\n=============================================')
  console.log('NEW ANNUAL PRICE ID:', newPrice.id)
  console.log('  amount:', newPrice.unit_amount, newPrice.currency)
  console.log('=============================================\n')

  await stripe.prices.update(OLD_LIVE_ANNUAL, { active: false })
  console.log('Archived old price:', OLD_LIVE_ANNUAL)

  console.log('\nNext: set NEXT_PUBLIC_STRIPE_PRICE_ANNUAL =', newPrice.id)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err?.message || err)
    process.exit(1)
  })
