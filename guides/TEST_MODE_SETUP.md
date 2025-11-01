# 🧪 Test Mode Setup Guide

Complete guide to ensure your Stripe payment system is fully configured in **test mode** before going live.

---

## ✅ Verify You're in Test Mode

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com
2. **Check Mode Toggle**: Top right should show **"Test mode"** (not "Live mode")
3. **Verify Keys**: Test keys start with:
   - `pk_test_` (Publishable key)
   - `sk_test_` (Secret key)
   - `whsec_` (Webhook secret - same format for test and live)

---

## 🎯 Required Test Products in Stripe

Make sure you have **all 8 products** created in **Test Mode**:

### 1. Vision Activation Intensive - Full Pay
- **Type**: One-time payment
- **Price**: $499.00 USD
- **Copy Price ID** → `STRIPE_PRICE_INTENSIVE_FULL` (starts with `price_`)

### 2. Vision Activation Intensive - 2 Payments
- **Type**: Subscription (for payment plan)
- **Price**: $249.50 USD
- **Billing**: Every 30 days, 2 times total
- **Copy Price ID** → `STRIPE_PRICE_INTENSIVE_2PAY`

### 3. Vision Activation Intensive - 3 Payments
- **Type**: Subscription (for payment plan)
- **Price**: $166.33 USD
- **Billing**: Every 30 days, 3 times total
- **Copy Price ID** → `STRIPE_PRICE_INTENSIVE_3PAY`

### 4. Vision Pro Annual
- **Type**: Subscription
- **Price**: $999.00 USD
- **Billing**: Every 365 days
- **Copy Price ID** → `NEXT_PUBLIC_STRIPE_PRICE_ANNUAL`

### 5. Vision Pro 28-Day
- **Type**: Subscription
- **Price**: $99.00 USD
- **Billing**: Every 28 days (Custom interval)
- **Copy Price ID** → `NEXT_PUBLIC_STRIPE_PRICE_28DAY`

### 6. Token Pack - Power
- **Type**: One-time payment
- **Price**: $99.00 USD
- **Copy Price ID** → `STRIPE_PRICE_TOKEN_POWER`

### 7. Token Pack - Mega
- **Type**: One-time payment
- **Price**: $199.00 USD
- **Copy Price ID** → `STRIPE_PRICE_TOKEN_MEGA`

### 8. Token Pack - Ultra
- **Type**: One-time payment
- **Price**: $399.00 USD
- **Copy Price ID** → `STRIPE_PRICE_TOKEN_ULTRA`

---

## 🔑 Test Mode API Keys

### Get Your Test Keys

1. **Go to**: Developers → API keys
2. **Make sure you're in Test Mode** (toggle in top right)
3. **Copy**:
   - **Publishable key**: `pk_test_xxxxxxxxxxxxx`
   - **Secret key**: `sk_test_xxxxxxxxxxxxx` (click "Reveal test key")

---

## 🔗 Test Webhook Setup

### Option 1: Stripe CLI (Recommended for Local Testing)

**Install Stripe CLI:**
```bash
brew install stripe/stripe-cli/stripe
```

**Login:**
```bash
stripe login
```

**Forward webhooks to local server:**
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

This will give you a **webhook secret** (starts with `whsec_`) - use this for local testing in `.env.local`.

### Option 2: Test Webhook Endpoint (For Vercel Preview Deploys)

1. **Go to**: Developers → Webhooks → Add endpoint
2. **Endpoint URL**: `https://your-preview-deploy.vercel.app/api/stripe/webhook`
3. **Events to listen for**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`
   - `customer.updated`
4. **Copy Signing Secret** → Use for `STRIPE_WEBHOOK_SECRET`

---

## 📝 Environment Variables Checklist

### For Local Development (.env.local)

```bash
# ============================================================================
# STRIPE API KEYS (TEST MODE)
# ============================================================================

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx  # From Stripe CLI or test webhook

# ============================================================================
# HORMOZI PRICING - INTENSIVE (TEST PRICE IDs)
# ============================================================================

STRIPE_PRICE_INTENSIVE_FULL=price_xxxxxxxxxxxxx        # $499 one-time
STRIPE_PRICE_INTENSIVE_2PAY=price_xxxxxxxxxxxxx        # $249.50 × 2
STRIPE_PRICE_INTENSIVE_3PAY=price_xxxxxxxxxxxxx        # $166.33 × 3

# ============================================================================
# HORMOZI PRICING - CONTINUITY (TEST PRICE IDs)
# ============================================================================

NEXT_PUBLIC_STRIPE_PRICE_ANNUAL=price_xxxxxxxxxxxxx   # $999/year
NEXT_PUBLIC_STRIPE_PRICE_28DAY=price_xxxxxxxxxxxxx    # $99/28 days

# ============================================================================
# TOKEN PACKS (TEST PRICE IDs)
# ============================================================================

STRIPE_PRICE_TOKEN_POWER=price_xxxxxxxxxxxxx          # 2M - $99
STRIPE_PRICE_TOKEN_MEGA=price_xxxxxxxxxxxxx           # 5M - $199
STRIPE_PRICE_TOKEN_ULTRA=price_xxxxxxxxxxxxx          # 12M - $399

# ============================================================================
# APP URL (LOCAL OR PREVIEW)
# ============================================================================

NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your preview URL
```

### For Vercel Preview Deployments

Add the same variables in **Vercel**:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all variables above
3. Make sure to use **test keys** and **test price IDs**

---

## 🧪 Testing with Test Cards

### Stripe Test Cards

**Success Cards:**
- `4242 4242 4242 4242` - Visa (most common)
- `5555 5555 5555 4444` - Mastercard
- `3782 822463 10005` - American Express

**Card Details (for any test card):**
- **Expiry**: Any future date (e.g., 12/25)
- **CVC**: Any 3 digits (e.g., 123)
- **ZIP**: Any 5 digits (e.g., 12345)

**Special Test Cards:**
- `4000 0025 0000 3155` - Requires 3D Secure authentication
- `4000 0000 0000 9995` - Declines payment
- `4000 0000 0000 0002` - Card declined (insufficient funds)
- `4000 0000 0000 0341` - Attached to account requiring authentication

### Test Flow Checklist

✅ **Intensive Purchase (Full Pay)**
1. Go to `/pricing` or `/checkout`
2. Select "Full Payment" ($499)
3. Use test card `4242 4242 4242 4242`
4. Complete checkout
5. Verify redirect to `/intensive/dashboard`
6. Check `intensive_purchases` table in Supabase

✅ **Intensive Purchase (2-Pay)**
1. Select "2 Payments" option
2. Use test card
3. Verify first payment processes
4. Check subscription created in Stripe Dashboard

✅ **Annual Subscription**
1. Select "Vision Pro Annual" ($999/year)
2. Use test card
3. Verify 5M tokens granted immediately
4. Check `customer_subscriptions` table

✅ **28-Day Subscription**
1. Select "Vision Pro 28-Day" ($99/28 days)
2. Use test card
3. Verify 375k tokens granted on signup
4. Check subscription in Stripe Dashboard

✅ **Token Pack Purchase**
1. Go to `/dashboard/add-tokens`
2. Select a token pack (Power/Mega/Ultra)
3. Use test card
4. Verify tokens granted immediately
5. Check `token_transactions` table

✅ **Webhook Events**
1. After each purchase, check Stripe Dashboard → Webhooks
2. Verify events are received: `checkout.session.completed`
3. Check webhook logs in Vercel (if deployed)
4. Verify database records created correctly

---

## 🔍 Verify Test Mode Setup

### Quick Verification Script

**In your browser console** (on pricing page):
```javascript
// Check if Stripe is loaded with test key
console.log(window.Stripe?.publishableKey) // Should start with pk_test_
```

**Check API route** (visit `/api/stripe/checkout` directly - should return error but confirm Stripe is configured):
```bash
curl http://localhost:3000/api/stripe/checkout
```

### Database Verification

**Check these tables exist in Supabase:**
```sql
-- Should return rows if test purchases work
SELECT * FROM intensive_purchases LIMIT 1;
SELECT * FROM customer_subscriptions LIMIT 1;
SELECT * FROM payment_history LIMIT 1;
SELECT * FROM token_transactions LIMIT 1;
```

---

## 🚨 Common Test Mode Issues

### Issue: "Stripe not configured" error
**Solution:**
- Check `.env.local` has `STRIPE_SECRET_KEY` set
- Verify key starts with `sk_test_`
- Restart dev server after adding env vars

### Issue: "Invalid price ID" error
**Solution:**
- Verify you're using **test mode price IDs** (from test mode dashboard)
- Check price IDs in `.env.local` match Stripe test products
- Restart dev server

### Issue: Webhook not receiving events
**Solution:**
- For local: Use Stripe CLI (`stripe listen --forward-to localhost:3000/api/stripe/webhook`)
- Check webhook secret matches CLI output
- For Vercel: Set up test webhook endpoint in Stripe Dashboard

### Issue: Test cards declining
**Solution:**
- Make sure you're using correct test card numbers
- Use `4242 4242 4242 4242` for basic success
- Check Stripe Dashboard logs for decline reasons

### Issue: Redirect URLs incorrect
**Solution:**
- Verify `NEXT_PUBLIC_APP_URL` matches your local/preview URL
- Check success/cancel URLs in checkout session code

---

## 📊 Test Mode Monitoring

### Stripe Dashboard

**Check these tabs regularly:**
- **Payments**: Verify test transactions
- **Customers**: Check test customer records
- **Subscriptions**: Verify test subscriptions
- **Webhooks**: Monitor webhook event delivery
- **Logs**: Check for API errors

### Vercel Logs

**Monitor these:**
- API route errors (`/api/stripe/*`)
- Webhook handler errors
- Checkout session creation errors

### Supabase

**Verify data:**
- `intensive_purchases` - Intensive test purchases
- `customer_subscriptions` - Test subscriptions
- `payment_history` - Test payment records
- `token_transactions` - Token grants from test purchases

---

## ✅ Test Mode Checklist

Before considering yourself "ready" in test mode:

- [ ] All 8 products created in Stripe Test Mode
- [ ] Test API keys in `.env.local` (pk_test_ and sk_test_)
- [ ] Test price IDs added to `.env.local`
- [ ] Webhook configured (Stripe CLI for local OR test endpoint for Vercel)
- [ ] Tested intensive purchase (full pay)
- [ ] Tested intensive purchase (2-pay)
- [ ] Tested intensive purchase (3-pay)
- [ ] Tested annual subscription
- [ ] Tested 28-day subscription
- [ ] Tested token pack purchase
- [ ] Verified webhook events received
- [ ] Verified database records created
- [ ] Verified tokens granted correctly
- [ ] Tested success/cancel redirects
- [ ] Verified customer portal access
- [ ] Checked error handling (declined cards)

---

## 🎯 When You're Ready to Go Live

Once you've tested everything in test mode:

1. Review `guides/GOING_LIVE_CHECKLIST.md`
2. Switch Stripe Dashboard to Live Mode
3. Create all products in Live Mode
4. Get Live API keys
5. Update Vercel environment variables
6. Set up production webhook
7. Test with real card (your own)

---

## 📚 Additional Resources

- **Stripe Test Cards**: https://stripe.com/docs/testing
- **Stripe CLI**: https://stripe.com/docs/stripe-cli
- **Webhook Testing**: https://stripe.com/docs/webhooks/test
- **Test Mode Guide**: https://stripe.com/docs/testing

---

**You're all set for test mode!** 🧪

Test thoroughly, then when you're confident everything works, follow the going live checklist.

