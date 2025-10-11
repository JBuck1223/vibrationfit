##  VibrationFit Stripe Billing Setup Guide

## 🎯 What's Been Built

Complete billing system with:
- ✅ Database schema for memberships, subscriptions, and payments
- ✅ 4 membership tiers (Free, Starter $19/mo, Pro $49/mo, Elite $99/mo)
- ✅ Stripe Checkout integration
- ✅ Webhook handler for subscription events
- ✅ Customer portal for managing billing
- ✅ Pricing page UI
- ✅ Billing management dashboard

## 📋 Setup Steps

### Step 1: Apply Database Migration

Run this SQL in your Supabase dashboard:
```bash
# File: supabase/migrations/20250112000000_create_billing_system.sql
```

This creates:
- `membership_tiers` table (with 4 tiers pre-populated)
- `customer_subscriptions` table
- `payment_history` table
- Helper functions for checking user access

### Step 2: Set Up Stripe

1. **Go to** [Stripe Dashboard](https://dashboard.stripe.com)

2. **Create Products & Prices:**
   
   Navigate to: **Products** → **Add product**

   **Product 1: Starter**
   - Name: "VibrationFit Starter"
   - Description: "Perfect for committed conscious creators"
   - Pricing:
     - Monthly: $19/month → Copy price ID
     - Yearly: $199/year → Copy price ID

   **Product 2: Pro**
   - Name: "VibrationFit Pro"
   - Description: "For power users and coaches"
   - Pricing:
     - Monthly: $49/month → Copy price ID
     - Yearly: $499/year → Copy price ID

   **Product 3: Elite**
   - Name: "VibrationFit Elite"
   - Description: "Ultimate transformation experience"
   - Pricing:
     - Monthly: $99/month → Copy price ID
     - Yearly: $999/year → Copy price ID

3. **Get Your API Keys:**
   
   Navigate to: **Developers** → **API keys**
   
   - Copy **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - Copy **Secret key** (starts with `sk_test_` or `sk_live_`)

4. **Set Up Webhook:**
   
   Navigate to: **Developers** → **Webhooks** → **Add endpoint**
   
   - Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copy **Signing secret** (starts with `whsec_`)

### Step 3: Add Environment Variables

Add these to your `.env.local`:

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here

# Price IDs (from Step 2)
NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY=price_xxx
NEXT_PUBLIC_STRIPE_PRICE_STARTER_YEARLY=price_xxx
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_xxx
NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY=price_xxx
NEXT_PUBLIC_STRIPE_PRICE_ELITE_MONTHLY=price_xxx
NEXT_PUBLIC_STRIPE_PRICE_ELITE_YEARLY=price_xxx

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 4: Test Webhooks Locally

Install Stripe CLI:
```bash
brew install stripe/stripe-cli/stripe
```

Login and forward webhooks:
```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

This will give you a webhook secret starting with `whsec_` - use this for local testing.

### Step 5: Test the Flow

1. **View Pricing:** `http://localhost:3000/pricing`
2. **Click a plan** → Redirects to Stripe Checkout
3. **Use test card:** `4242 4242 4242 4242` (any future date, any CVC)
4. **Complete checkout** → Redirected to success page
5. **Check dashboard** → Subscription should be active

## 🏗️ File Structure

```
├── supabase/migrations/
│   └── 20250112000000_create_billing_system.sql  # Database schema
│
├── src/lib/stripe/
│   ├── config.ts          # Stripe client & configuration
│   └── customer.ts        # Customer & subscription utilities
│
├── src/app/api/stripe/
│   ├── checkout/route.ts  # Create checkout sessions
│   ├── portal/route.ts    # Customer portal
│   └── webhook/route.ts   # Handle Stripe events
│
├── src/app/api/billing/
│   └── subscription/route.ts  # Fetch user subscription
│
├── src/app/pricing/
│   └── page.tsx           # Public pricing page
│
├── src/app/billing/
│   ├── page.tsx           # Billing management
│   └── success/page.tsx   # Checkout success
│
└── .env.example           # Environment variable template
```

## 🔄 How It Works

### Checkout Flow
```
User clicks plan on /pricing
    ↓
POST /api/stripe/checkout
    ↓
Create Stripe Customer (if new)
    ↓
Create Checkout Session
    ↓
Redirect to Stripe Checkout
    ↓
User enters payment
    ↓
Stripe processes payment
    ↓
Webhook: checkout.session.completed
    ↓
Save subscription to database
    ↓
Redirect to /billing/success
```

### Subscription Lifecycle
```
Active subscription
    ↓
Monthly renewal
    ↓
Webhook: invoice.payment_succeeded
    ↓
Record payment in payment_history
    ↓
Update subscription period dates
```

### Cancellation Flow
```
User clicks "Manage Billing"
    ↓
POST /api/stripe/portal
    ↓
Redirect to Stripe Customer Portal
    ↓
User cancels subscription
    ↓
Webhook: customer.subscription.updated
    ↓
Update cancel_at_period_end = true
    ↓
Access continues until period end
```

## 💰 Membership Tiers

| Tier | Monthly | Yearly | VIVA Tokens | Key Features |
|------|---------|---------|-------------|--------------|
| **Free** | $0 | $0 | 100 | 1 vision, basic access |
| **Starter** | $19 | $199 | 500 | Unlimited visions, VIVA, assessment |
| **Pro** | $49 | $499 | 2000 | Audio, priority support, analytics |
| **Elite** | $99 | $999 | Unlimited | Coaching, white-label, API access |

## 🔐 Access Control

Use these functions to check user permissions:

```typescript
// In your API routes
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()

// Get user's tier
const { data: tier } = await supabase
  .rpc('get_user_tier', { p_user_id: user.id })

// Check if user has a feature
const { data: hasAccess } = await supabase
  .rpc('user_has_feature', { 
    p_user_id: user.id, 
    p_feature: 'Audio generation' 
  })

if (!hasAccess) {
  return NextResponse.json({ error: 'Upgrade required' }, { status: 403 })
}
```

## 🧪 Testing

### Test Cards (Stripe Test Mode)
- **Success:** `4242 4242 4242 4242`
- **Requires authentication:** `4000 0025 0000 3155`
- **Declined:** `4000 0000 0000 9995`

### Test Webhooks Locally
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### Trigger Test Events
```bash
stripe trigger checkout.session.completed
stripe trigger invoice.payment_succeeded
stripe trigger customer.subscription.deleted
```

## 🚀 Going Live

1. **Switch to Live Mode** in Stripe Dashboard
2. **Create live products & prices**
3. **Update environment variables** with live keys
4. **Update webhook endpoint** to production URL
5. **Test with real card** (yourself)
6. **Remove test mode notice** from pricing page

## 📊 Features to Add Later

- [ ] Usage-based billing (VIVA token overages)
- [ ] Promo codes and discounts
- [ ] Annual discount banners
- [ ] Referral credits
- [ ] Team/workspace plans
- [ ] Add-ons (extra tokens, coaching sessions)

## 🆘 Troubleshooting

**Webhook not working?**
- Check webhook secret is correct
- Verify endpoint URL is accessible
- Check Stripe CLI is forwarding locally

**Checkout failing?**
- Verify price IDs are correct
- Check API keys are valid
- Look for errors in Stripe Dashboard logs

**Subscription not showing?**
- Check webhook was received
- Verify data in `customer_subscriptions` table
- Check user_id matches auth.users

## 📚 Additional Resources

- [Stripe Checkout Docs](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Customer Portal](https://stripe.com/docs/billing/subscriptions/customer-portal)
- [Stripe Testing](https://stripe.com/docs/testing)

---

**Your billing system is ready to accept payments and manage subscriptions!** 💳✨

