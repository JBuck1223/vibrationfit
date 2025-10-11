# Coupons & Free Trials Guide

## ✅ What's Implemented

You now have a complete **URL-based** coupon and free trial system integrated with Stripe!

**No promo code input field needed** - all promo codes are applied via URL parameters.

### Components Added
1. **`src/lib/stripe/promotions.ts`** - Coupon management utilities
2. **`src/app/api/stripe/validate-coupon/route.ts`** - Validate promo codes
3. Updated **`src/lib/stripe/customer.ts`** - Support for trials & promos in checkout
4. Updated **`src/app/api/stripe/checkout/route.ts`** - Accept promo codes & trial days

---

## 🎯 How to Use

### 1. Create Coupons in Stripe

#### Option A: Via Stripe Dashboard
1. Go to Dashboard → Products → Coupons
2. Click "Create coupon"
3. Set details:
   - **ID**: `launch50` (customer-facing code)
   - **Discount**: 50% off or $10.00 off
   - **Duration**: Once, Forever, or Repeating (X months)
   - **Max redemptions** (optional)
4. Click "Create coupon"

#### Option B: Programmatically

```typescript
import { createCoupon } from '@/lib/stripe/promotions'

// 50% off first month
await createCoupon({
  code: 'launch50',
  percentOff: 50,
  duration: 'once',
  maxRedemptions: 100,
})

// $10 off forever
await createCoupon({
  code: 'save10',
  amountOff: 1000, // in cents
  duration: 'forever',
})

// 25% off for 3 months
await createCoupon({
  code: 'quarter25',
  percentOff: 25,
  duration: 'repeating',
  durationInMonths: 3,
})
```

### 2. Seed Predefined Coupons

Run this in a one-time script or API route:

```typescript
import { seedPromotions } from '@/lib/stripe/promotions'

const results = await seedPromotions()
console.log(results)
```

This creates:
- `launch50` - 50% off first month
- `launch25` - 25% off for 3 months
- `refer20` - 20% off forever (referral reward)
- `newyear2025` - 30% off first month
- `vip50` - 50% off forever (limited to 10 uses)

### 3. Set Up Free Trials

#### Option A: Set at Tier Level (Recommended)

In `src/app/pricing/page.tsx`, add `trialDays` to each tier:

```typescript
const tiers = [
  {
    name: 'Starter',
    trialDays: 7, // 7-day free trial
    // ...
  },
  {
    name: 'Pro',
    trialDays: 14, // 14-day free trial
    // ...
  },
]
```

The checkout will automatically include the trial period.

#### Option B: Dynamic Trial Days

Pass `trialDays` when creating checkout:

```typescript
await fetch('/api/stripe/checkout', {
  method: 'POST',
  body: JSON.stringify({
    priceId: 'price_xxx',
    tierType: 'starter',
    trialDays: 7, // Override trial days
  }),
})
```

---

## 🔗 URL-Based Promo System (Current Implementation)

### How It Works

Instead of asking users to type in promo codes, you send them **special links**:

```
https://vibrationfit.com/pricing?promo=launch50
https://vibrationfit.com/pricing?promo=testuser30
https://vibrationfit.com/pricing?ref=jordan
```

When they click the link and subscribe, the promo code is **automatically applied** at checkout.

### Benefits
- ✅ No UI needed
- ✅ No typos
- ✅ Works for email campaigns
- ✅ Tracks attribution automatically
- ✅ Perfect for test users

### Example Use Cases

**Test Users:**
```
Send: https://vibrationfit.com/pricing?promo=testuser30
They get: 30-day free trial automatically
```

**Launch Campaign:**
```
Send: https://vibrationfit.com/pricing?promo=launch50
They get: 50% off first month
```

**Referrals:**
```
Send: https://vibrationfit.com/pricing?ref=jordan
Jordan gets: Credit when they subscribe
```

---

## 🎨 Optional: Add Promo Code Input Field

If you prefer to let users manually enter codes, add this to the pricing page:

```typescript
// Add to pricing page state
const [promoCode, setPromoCode] = useState('')
const [appliedPromo, setAppliedPromo] = useState(null)
const [isValidating, setIsValidating] = useState(false)

// Validate promo
const handleValidatePromo = async () => {
  setIsValidating(true)
  const response = await fetch('/api/stripe/validate-coupon', {
    method: 'POST',
    body: JSON.stringify({ code: promoCode }),
  })
  const data = await response.json()
  
  if (data.valid) {
    setAppliedPromo({ code: promoCode, discount: data.discount })
    toast.success(`Promo applied: ${data.discount}`)
  } else {
    toast.error(data.error)
  }
  setIsValidating(false)
}

// Pass to checkout
const handleCheckout = async (tier) => {
  await fetch('/api/stripe/checkout', {
    method: 'POST',
    body: JSON.stringify({
      priceId: tier.stripePriceMonthly,
      tierType: tier.tier_type,
      promoCode: appliedPromo?.code, // ← Apply promo
      trialDays: tier.trialDays,
    }),
  })
}
```

UI Component:

```tsx
<div className="mb-8 max-w-md mx-auto">
  <label className="block text-sm font-medium mb-2">
    Have a promo code?
  </label>
  <div className="flex gap-2">
    <Input
      value={promoCode}
      onChange={(e) => setPromoCode(e.target.value)}
      placeholder="Enter code"
      className="flex-1"
    />
    <Button
      onClick={handleValidatePromo}
      variant="secondary"
      disabled={!promoCode || isValidating}
    >
      Apply
    </Button>
  </div>
  {appliedPromo && (
    <div className="mt-2 text-sm text-primary-500 flex items-center gap-2">
      <Tag className="w-4 h-4" />
      <span>{appliedPromo.discount} discount applied!</span>
    </div>
  )}
</div>
```

---

## 📋 Common Coupon Patterns

### Launch Promotion
```typescript
{
  code: 'launch50',
  percentOff: 50,
  duration: 'once', // First payment only
  maxRedemptions: 1000,
}
```

### Referral Reward
```typescript
{
  code: 'refer20',
  percentOff: 20,
  duration: 'forever', // Every payment
}
```

### Seasonal Campaign
```typescript
{
  code: 'summer2025',
  percentOff: 30,
  duration: 'repeating',
  durationInMonths: 3,
  maxRedemptions: 500,
}
```

### VIP / Influencer Code
```typescript
{
  code: 'jordan50',
  percentOff: 50,
  duration: 'forever',
  maxRedemptions: 50, // Limited uses
}
```

### Win-Back Campaign
```typescript
{
  code: 'comeback40',
  percentOff: 40,
  duration: 'repeating',
  durationInMonths: 2,
}
```

---

## 🔍 Testing

### 1. Test Promo Validation

```bash
curl -X POST http://localhost:3000/api/stripe/validate-coupon \
  -H "Content-Type: application/json" \
  -d '{"code":"launch50"}'
```

Expected response:
```json
{
  "valid": true,
  "coupon": { ... },
  "discount": "50% off"
}
```

### 2. Test Checkout with Promo

```typescript
// In browser console
await fetch('/api/stripe/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    priceId: 'price_xxx',
    tierType: 'starter',
    promoCode: 'launch50',
    trialDays: 7,
  }),
})
```

### 3. Verify in Stripe Dashboard

1. Complete a test checkout with a promo code
2. Go to Dashboard → Customers → [Customer]
3. Check subscription details
4. Should show: "7-day trial" and "50% off applied"

---

## 🎯 Display Trial & Promo Info

### Show Trial Badge on Pricing Cards

```tsx
{tier.trialDays && (
  <Badge variant="info" className="mb-2">
    {tier.trialDays}-day free trial
  </Badge>
)}
```

### Show Applied Promo in Checkout Summary

```tsx
{appliedPromo && (
  <div className="bg-primary-500/10 p-4 rounded-lg border border-primary-500">
    <div className="flex items-center gap-2">
      <Tag className="w-5 h-5 text-primary-500" />
      <div>
        <div className="font-semibold text-primary-500">
          {appliedPromo.discount}
        </div>
        <div className="text-xs text-neutral-400">
          Code: {appliedPromo.code.toUpperCase()}
        </div>
      </div>
    </div>
  </div>
)}
```

### Show Trial Info

```tsx
{tier.trialDays > 0 && (
  <div className="text-center text-sm text-neutral-400 mt-4">
    Start your {tier.trialDays}-day free trial. Cancel anytime.
  </div>
)}
```

---

## 🚀 Next Steps

### 1. Create Your First Coupons
Run this one-time:
```bash
# Create a Node.js script or API route
npm run seed-coupons
```

Or manually in Stripe Dashboard.

### 2. Add Promo UI to Pricing Page
See "Add Promo Code UI" section above.

### 3. Set Trial Days on Tiers
Add `trialDays: 7` to each tier definition.

### 4. Test End-to-End
- Apply a promo code
- Start checkout
- Verify trial period shows
- Complete payment with test card
- Check Stripe Dashboard

### 5. Monitor Usage
Track in Stripe Dashboard:
- Coupons → See redemption count
- Customers → Filter by coupon code
- Revenue → See discounted amounts

---

## 💡 Pro Tips

1. **Trial + Promo = Powerful Combo**
   - 7-day trial + 50% off first month = Low friction conversion

2. **Use Codes for Attribution**
   - `podcast50` - Track which podcast drove signups
   - `youtube25` - Track YouTube traffic
   - `partner_acme` - Track partner referrals

3. **Create Urgency**
   - Set expiration dates: `expires_at`
   - Limit redemptions: `max_redemptions`
   - Display countdown timers on site

4. **Tiered Discounts**
   - `save10` - $10 off (available to all)
   - `vip25` - 25% off (email campaign)
   - `insider50` - 50% off (exclusive, limited)

5. **Automate Coupon Creation**
   - Generate unique codes per user: `user_${userId}_welcome`
   - Create referral codes: `ref_${referrerId}`
   - Time-based codes: `cyber2025`, `newyear2026`

---

## 🎉 You're All Set!

Your billing system now supports:
- ✅ Promo codes (%, $, once, repeating, forever)
- ✅ Free trials (7, 14, 30 days, etc.)
- ✅ Coupon validation API
- ✅ Webhook handling for trial events
- ✅ Pre-seeded common promotions

**What to do next:** Add the promo code input UI to your pricing page! 🚀

