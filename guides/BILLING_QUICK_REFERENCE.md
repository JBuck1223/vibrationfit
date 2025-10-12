# Stripe Billing - Quick Reference Card

## 🚀 To Get Started (5 Minutes)

### 1. Add to `.env.local`:
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 2. Apply Migration:
Open Supabase Dashboard → SQL Editor → Run:
`supabase/migrations/20250112000000_create_billing_system.sql`

### 3. Test Locally:
```bash
# Terminal 1
npm run dev

# Terminal 2
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### 4. Test Checkout:
- Go to: `http://localhost:3000/pricing`
- Click "Starter" plan
- Use card: `4242 4242 4242 4242`
- Complete checkout
- Check `/billing` page

## 📍 Key URLs

- **Pricing Page:** `/pricing`
- **Billing Dashboard:** `/billing`
- **Success Page:** `/billing/success`
- **Stripe Portal:** Opens via "Manage Billing" button

## 🔑 API Endpoints

- `POST /api/stripe/checkout` - Create checkout session
- `POST /api/stripe/portal` - Open customer portal
- `POST /api/stripe/webhook` - Handle Stripe events
- `GET /api/billing/subscription` - Get user's subscription

## 💳 Test Cards

| Card Number | Scenario |
|-------------|----------|
| `4242 4242 4242 4242` | Success |
| `4000 0025 0000 3155` | Requires authentication |
| `4000 0000 0000 9995` | Declined |

## 📊 Membership Tiers

| Tier | Price | VIVA Tokens | Max Visions |
|------|-------|-------------|-------------|
| Free | $0 | 100/mo | 1 |
| Starter | $19/mo | 500/mo | Unlimited |
| Pro | $49/mo | 2000/mo | Unlimited |
| Elite | $99/mo | Unlimited | Unlimited |

## 🔐 Access Control Example

```typescript
// Check user's tier
const { data } = await supabase.rpc('get_user_tier', { 
  p_user_id: user.id 
})

// Check specific feature
const { data: hasAudio } = await supabase.rpc('user_has_feature', {
  p_user_id: user.id,
  p_feature: 'Audio generation'
})

if (!hasAudio) {
  return res.status(403).json({ error: 'Upgrade to Pro' })
}
```

## ⚙️ Stripe Dashboard Setup

### Products to Create:
1. **VibrationFit Starter**
   - Monthly: $19
   - Yearly: $199 (save $29)

2. **VibrationFit Pro**
   - Monthly: $49
   - Yearly: $499 (save $89)

3. **VibrationFit Elite**
   - Monthly: $99
   - Yearly: $999 (save $189)

### Webhook Events:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

## 🐛 Quick Debugging

**Subscription not showing?**
```bash
# Check database
SELECT * FROM customer_subscriptions WHERE user_id = 'xxx';

# Check Stripe
stripe subscriptions list --customer cus_xxx
```

**Webhook not working?**
```bash
# Check recent events
stripe events list --limit 10

# Manually resend
stripe events resend evt_xxx
```

**Payment failed?**
```bash
# Check payment history
SELECT * FROM payment_history 
WHERE user_id = 'xxx' 
ORDER BY created_at DESC;
```

## 🎨 Brand Integration

Pricing cards use VibrationFit design system:
- Free → Neutral (gray)
- Starter → Primary (green) ⭐ Most Popular
- Pro → Secondary (teal)
- Elite → Accent (purple)

## 📝 Next Steps

1. Create Stripe account products
2. Add price IDs to `.env.local`
3. Apply database migration
4. Test checkout flow
5. Set up webhook endpoint
6. Go live! 🚀

---

**Support:** See full guide in `STRIPE_SETUP_GUIDE.md`

