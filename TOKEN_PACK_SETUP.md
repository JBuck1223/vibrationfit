# 🎯 Token Pack Purchase Setup Guide

## ✅ What's Been Implemented

Complete token pack purchase system with Stripe integration:
- ✅ One-time payment checkout for token packs
- ✅ 3 token pack tiers (Power, Mega, Ultra)
- ✅ Webhook handler to automatically grant tokens after purchase
- ✅ Full UI at `/dashboard/add-tokens`
- ✅ Success/cancel redirects

---

## 🛠️ Required Environment Variables

You need to add **3 Stripe Price IDs** to your environment variables (both locally and in Vercel).

### Local Setup (.env.local)

Add these to your `.env.local` file:

```bash
# Token Pack Price IDs
STRIPE_PRICE_TOKEN_POWER=price_xxxxxxxxxxxxx   # 2M tokens - $99
STRIPE_PRICE_TOKEN_MEGA=price_xxxxxxxxxxxxx    # 5M tokens - $199
STRIPE_PRICE_TOKEN_ULTRA=price_xxxxxxxxxxxxx   # 12M tokens - $399
```

### Vercel Production Setup

Add the same variables in Vercel:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `vibrationfit` project
3. Go to **Settings** → **Environment Variables**
4. Add all 3 price IDs
5. Redeploy (or auto-deploys with next push)

---

## 💰 Token Pack Details

| Pack | Tokens | Price | Use Cases |
|------|--------|-------|-----------|
| **Power Pack** | 2,000,000 | $99 | ~40 vision refinements, ~10 audio generations |
| **Mega Pack** | 5,000,000 | $199 | ~100 vision refinements, ~25 audio generations (BEST VALUE) |
| **Ultra Pack** | 12,000,000 | $399 | ~240 vision refinements, ~60 audio generations |

**Key Features:**
- ✅ Never expire
- ✅ Stack multiple packs
- ✅ Instant delivery via webhook
- ✅ One-time payment (not subscription)

---

## 🎯 How to Create Stripe Products

### Step 1: Go to Stripe Dashboard

Navigate to: [Stripe Products](https://dashboard.stripe.com/products)

### Step 2: Create Each Token Pack

#### Pack 1: Power Pack

1. Click **"Add product"**
2. **Name:** VibrationFit Power Pack
3. **Description:** 2 million tokens for active creators
4. **Pricing:** 
   - Type: One-time
   - Price: **$99 USD**
5. **Copy the Price ID** → Starts with `price_`
6. Save as `STRIPE_PRICE_TOKEN_POWER`

#### Pack 2: Mega Pack

1. Click **"Add product"**
2. **Name:** VibrationFit Mega Pack
3. **Description:** 5 million tokens - Best value for power users
4. **Pricing:**
   - Type: One-time
   - Price: **$199 USD**
5. **Copy the Price ID**
6. Save as `STRIPE_PRICE_TOKEN_MEGA`

#### Pack 3: Ultra Pack

1. Click **"Add product"**
2. **Name:** VibrationFit Ultra Pack
3. **Description:** 12 million tokens - Ultimate creative freedom
4. **Pricing:**
   - Type: One-time
   - Price: **$399 USD**
5. **Copy the Price ID**
6. Save as `STRIPE_PRICE_TOKEN_ULTRA`

---

## 🔄 How It Works

### Purchase Flow

```
User visits /dashboard/add-tokens
    ↓
Clicks "Purchase" on a pack
    ↓
POST /api/stripe/checkout-token-pack
    ↓
Creates Stripe Checkout Session (mode: 'payment')
    ↓
User enters payment details
    ↓
Stripe processes payment
    ↓
Webhook: checkout.session.completed
    ↓
System grants tokens via grantTokens()
    ↓
Redirect to /dashboard/tokens?purchase=success
```

### Webhook Logic

The webhook handles `checkout.session.completed` events and checks:
- If `session.mode === 'payment'` (one-time purchase)
- If `session.metadata.purchase_type === 'token_pack'`

Then it:
1. Extracts `user_id`, `pack_id`, and `tokens_amount` from metadata
2. Calls `grantTokens()` from `@/lib/tokens/token-tracker`
3. Records transaction in `token_transactions` table
4. Updates user's `vibe_assistant_tokens_remaining` balance

---

## 🧪 Testing

### Test Locally

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Set up Stripe webhook forwarding:**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

3. **Visit the page:**
   ```
   http://localhost:3000/dashboard/add-tokens
   ```

4. **Use test card:**
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

5. **Verify:**
   - Check Stripe Dashboard for payment
   - Check your database `token_transactions` table
   - Check user's token balance increased

---

## 📊 Database Schema

Tokens are tracked in the `token_transactions` table:

```sql
-- When token pack is purchased
INSERT INTO token_transactions (
  user_id,
  action_type,          -- 'token_pack_purchase'
  tokens_used,          -- Negative number (e.g., -5000000 for grant)
  tokens_remaining,     -- New balance after grant
  metadata              -- pack_id, stripe_session_id, amount_paid
)
```

User balance is updated in `user_profiles`:

```sql
UPDATE user_profiles
SET vibe_assistant_tokens_remaining = vibe_assistant_tokens_remaining + 5000000
WHERE user_id = 'xxx'
```

---

## 🔐 Security Features

- ✅ User authentication required
- ✅ Stripe webhook signature verification
- ✅ Metadata validation (user_id, tokens_amount)
- ✅ Database transaction safety
- ✅ Customer ID verification (must match existing user)

---

## 🚨 Troubleshooting

### "Missing STRIPE_PRICE_TOKEN_XXX environment variable"

**Problem:** Price IDs not configured

**Solution:** 
1. Create products in Stripe Dashboard
2. Copy price IDs
3. Add to `.env.local` and Vercel
4. Restart dev server / redeploy

### Tokens not granted after purchase

**Problem:** Webhook not receiving events

**Solution:**
1. Check Stripe webhook endpoint is configured: `https://yourdomain.com/api/stripe/webhook`
2. Verify webhook secret matches `STRIPE_WEBHOOK_SECRET`
3. Check Stripe Dashboard → Developers → Webhooks for failed events
4. Look for logs in Vercel → Functions → webhook logs

### "Failed to create checkout session"

**Problem:** Price ID doesn't exist or is incorrect

**Solution:**
1. Verify price IDs in Stripe Dashboard → Products
2. Make sure they're **one-time prices**, not recurring
3. Double-check environment variables match exactly

---

## 🎨 UI Features

The `/dashboard/add-tokens` page includes:
- ✅ 3 token pack cards with features
- ✅ "Best Value" badge on Mega Pack
- ✅ Real-time loading states
- ✅ Error handling with toast notifications
- ✅ Responsive design (mobile-friendly)
- ✅ Token amount display with millions (e.g., "5M tokens")
- ✅ Use case examples per pack
- ✅ FAQ section explaining how tokens work

---

## 📈 Next Steps

### After Setting Up Price IDs:

1. ✅ Test a purchase locally
2. ✅ Verify tokens are granted
3. ✅ Test webhook with Stripe CLI
4. ✅ Add production price IDs to Vercel
5. ✅ Test in production with real card
6. ✅ Monitor first real purchases

### Future Enhancements:

- [ ] Email confirmation after token pack purchase
- [ ] Token pack purchase history page
- [ ] Promo codes for token packs
- [ ] Bundle deals (buy 2 packs, get discount)
- [ ] Gift token packs to other users
- [ ] Token pack analytics dashboard

---

## ✨ You're Ready!

Once you add your 3 Stripe Price IDs to the environment variables, users can:
1. Visit `/dashboard/add-tokens`
2. Choose a token pack
3. Complete Stripe checkout
4. Instantly receive tokens in their balance

The entire flow is automated via the webhook! 🎉

---

**Files Modified:**
- `src/lib/stripe/customer.ts` - Added `createTokenPackCheckoutSession()`
- `src/app/api/stripe/checkout-token-pack/route.ts` - New checkout endpoint
- `src/app/api/stripe/webhook/route.ts` - Added token pack handling
- `src/app/dashboard/add-tokens/page.tsx` - Enabled real Stripe checkout

**Environment Variables Needed:**
```bash
STRIPE_PRICE_TOKEN_POWER=price_xxxxxxxxxxxxx
STRIPE_PRICE_TOKEN_MEGA=price_xxxxxxxxxxxxx
STRIPE_PRICE_TOKEN_ULTRA=price_xxxxxxxxxxxxx
```

