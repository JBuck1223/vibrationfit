# 🔑 Hormozi Pricing - Environment Variables Setup

**Quick guide to configure your Stripe products and environment variables**

---

## Required Stripe Products

You need to create **6 products** in Stripe Dashboard:

### 1. Vision Activation Intensive - Full Pay
- **Type:** One-time payment
- **Price:** $499
- **Copy Price ID** → `STRIPE_PRICE_INTENSIVE_FULL`

### 2. Vision Activation Intensive - 2-Pay
- **Type:** Recurring (2 payments)
- **Price:** $249.50 per payment
- **Total payments:** 2
- **Copy Price ID** → `STRIPE_PRICE_INTENSIVE_2PAY`

### 3. Vision Activation Intensive - 3-Pay
- **Type:** Recurring (3 payments)
- **Price:** $166.33 per payment
- **Total payments:** 3
- **Copy Price ID** → `STRIPE_PRICE_INTENSIVE_3PAY`

### 4. Vision Pro Annual
- **Type:** Subscription
- **Price:** $999/year
- **Billing:** Every 365 days
- **Copy Price ID** → `NEXT_PUBLIC_STRIPE_PRICE_ANNUAL`

### 5. Vision Pro 28-Day
- **Type:** Subscription
- **Price:** $99 per 28 days
- **Billing:** Every 28 days (use interval_count: 28)
- **Copy Price ID** → `NEXT_PUBLIC_STRIPE_PRICE_28DAY`

### 6-8. Token Packs (Existing)
- Power: 2M tokens - $99 → `STRIPE_PRICE_TOKEN_POWER`
- Mega: 5M tokens - $199 → `STRIPE_PRICE_TOKEN_MEGA`
- Ultra: 12M tokens - $399 → `STRIPE_PRICE_TOKEN_ULTRA`

---

## Environment Variables

Add these to `.env.local` (local) and Vercel (production):

```bash
# ============================================================================
# HORMOZI PRICING - INTENSIVE
# ============================================================================

STRIPE_PRICE_INTENSIVE_FULL=price_xxxxxxxxxxxxx        # $499 one-time
STRIPE_PRICE_INTENSIVE_2PAY=price_xxxxxxxxxxxxx        # $249.50 × 2
STRIPE_PRICE_INTENSIVE_3PAY=price_xxxxxxxxxxxxx        # $166.33 × 3

# ============================================================================
# HORMOZI PRICING - CONTINUITY
# ============================================================================

NEXT_PUBLIC_STRIPE_PRICE_ANNUAL=price_xxxxxxxxxxxxx   # $999/year
NEXT_PUBLIC_STRIPE_PRICE_28DAY=price_xxxxxxxxxxxxx    # $99/28 days

# ============================================================================
# TOKEN PACKS (Existing)
# ============================================================================

STRIPE_PRICE_TOKEN_POWER=price_xxxxxxxxxxxxx          # 2M - $99
STRIPE_PRICE_TOKEN_MEGA=price_xxxxxxxxxxxxx           # 5M - $199
STRIPE_PRICE_TOKEN_ULTRA=price_xxxxxxxxxxxxx          # 12M - $399

# ============================================================================
# EXISTING VARS (Keep these)
# ============================================================================

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or https://vibrationfit.com
```

---

## Quick Setup Steps

### 1. Create Stripe Products

Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products)

For each product above:
1. Click "Add product"
2. Enter name and description
3. Set pricing (one-time or subscription)
4. For 28-day plan: Set billing interval to "Custom" → "28 days"
5. Copy the Price ID (starts with `price_`)

### 2. Add to `.env.local`

```bash
# Paste all price IDs into .env.local
```

### 3. Add to Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add all 8 price IDs (or 11 if including token packs)

### 4. Deploy Migration

The database migration is already in your repo:
`supabase/migrations/20250112000001_hormozi_pricing_system.sql`

**Apply it:**
```bash
# If using Supabase CLI
supabase db push

# Or run manually in Supabase SQL Editor
```

### 5. Test Locally

```bash
npm run dev
```

Visit: `http://localhost:3000/pricing-hormozi`

Test with Stripe test card: `4242 4242 4242 4242`

### 6. Verify Webhook

Make sure your webhook endpoint includes:
```
https://vibrationfit.com/api/stripe/webhook
```

Events to listen for:
- `checkout.session.completed`
- `invoice.payment_succeeded`
- `customer.subscription.updated`
- `customer.subscription.deleted`

---

## Testing Checklist

- [ ] Intensive purchase (full pay) → creates intensive_purchase record
- [ ] Intensive purchase → redirects to `/intensive/dashboard`
- [ ] Annual subscription → grants 5M tokens immediately
- [ ] 28-Day subscription → drips 375k tokens on signup
- [ ] 28-Day renewal → drips 375k tokens again (with rollover)
- [ ] Token rollover works (unused tokens carry over up to 3 cycles)
- [ ] Storage quotas: 100GB for annual, 25GB for 28-day

---

## What's Next

After environment variables are set up:

1. **Test the pricing page** (`/pricing-hormozi`)
2. **Build intensive onboarding flow** (intake → builder → calibrate → activate)
3. **Create intensive dashboard** (`/intensive/dashboard`)
4. **Set up email/SMS sequences** (72-hour reminders)
5. **Add auto top-up toggle** in user settings

---

**Need help?** Check the full implementation guide:
`guides/HORMOZI_PRICING_STRATEGY.md`

