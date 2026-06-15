// scripts/stripe/finish-annual-swap.mjs
// Sets the new $990/yr price as the product default, then archives the old $999.

import { config } from 'dotenv'
import path from 'node:path'
import Stripe from 'stripe'

config({ path: path.resolve(process.cwd(), '.env.local') })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const PRODUCT_ID = 'prod_TDhx6uCBNN2sY0'
const NEW_PRICE = 'price_1TicRXFVKmXx41Xwmee3MZJa'
const OLD_PRICE = 'price_1SHGXhFVKmXx41XwJlMJbUJa'

async function main() {
  await stripe.products.update(PRODUCT_ID, { default_price: NEW_PRICE })
  console.log('Set product default_price ->', NEW_PRICE)

  await stripe.prices.update(OLD_PRICE, { active: false })
  console.log('Archived old price ->', OLD_PRICE)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err?.message || err)
    process.exit(1)
  })
