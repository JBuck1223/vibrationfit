// scripts/seed-stripe-coupons.ts
// One-time script to create predefined coupons in Stripe

import { seedPromotions } from '../src/lib/stripe/promotions'

async function main() {
  console.log('🎫 Creating Stripe coupons...\n')

  const results = await seedPromotions()

  console.log('\n📊 Results:\n')
  results.forEach((result) => {
    if (result.success) {
      console.log(`✅ ${result.code.toUpperCase()} - ${result.message || 'Created successfully'}`)
    } else {
      console.log(`❌ ${result.code.toUpperCase()} - ${result.error}`)
    }
  })

  console.log('\n✨ Done! Check your Stripe Dashboard → Products → Coupons\n')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })

