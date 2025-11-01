# 🚀 Going Live - Payment System Checklist

Complete guide to take your Stripe payment system from test mode to production.

---

## 📋 Pre-Launch Checklist

### ✅ 1. Verify Database Migrations

Make sure all migrations are applied to **production Supabase**:

```sql
-- Check these tables exist:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'membership_tiers',
  'customer_subscriptions',
  'payment_history',
  'stripe_customers',
  'intensive_purchases',
  'intensive_checklist',
  'token_drips',
  'token_transactions',
  'token_usage'
);
```

**Files to verify:**
- `supabase/migrations/20250112000000_create_billing_system.sql`
- `supabase/migrations/20250112000001_hormozi_pricing_system.sql` (if exists)

---

### ✅ 2. Switch Stripe to Live Mode

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com
2. **Toggle Mode**: Switch from "Test mode" to **"Live mode"** (top right)
3. **Verify Account**: Make sure your business details are complete:
   - Business name
   - Tax ID (if required)
   - Bank account connected
   - Legal entity info

---

### ✅ 3. Create Live Products in Stripe

**Navigate to**: Products → Add product

#### Product 1: Vision Activation Intensive - Full Pay
- **Name**: Vision Activation Intensive - Full Payment
- **Description**: Complete payment for Vision Activation Intensive
- **Type**: One-time payment
- **Price**: $499.00 USD
- **Copy Price ID** → Save for `STRIPE_PRICE_INTENSIVE_FULL`

#### Product 2: Vision Activation Intensive - 2 Payments
- **Name**: Vision Activation Intensive - 2 Payments
- **Description**: Split payment option: 2 installments of $249.50
- **Type**: Subscription (for payment plan)
- **Price**: $249.50 USD
- **Billing**: Every 30 days, 2 times
- **Copy Price ID** → Save for `STRIPE_PRICE_INTENSIVE_2PAY`

#### Product 3: Vision Activation Intensive - 3 Payments
- **Name**: Vision Activation Intensive - 3 Payments
- **Description**: Split payment option: 3 installments of $166.33
- **Type**: Subscription (for payment plan)
- **Price**: $166.33 USD
- **Billing**: Every 30 days, 3 times
- **Copy Price ID** → Save for `STRIPE_PRICE_INTENSIVE_3PAY`

#### Product 4: Vision Pro Annual
- **Name**: Vision Pro Annual
- **Description**: Annual subscription with 5M tokens upfront
- **Type**: Subscription
- **Price**: $999.00 USD
- **Billing**: Every 365 days
- **Copy Price ID** → Save for `NEXT_PUBLIC_STRIPE_PRICE_ANNUAL`

#### Product 5: Vision Pro 28-Day
- **Name**: Vision Pro 28-Day
- **Description**: Monthly subscription with 375k tokens per cycle
- **Type**: Subscription
- **Price**: $99.00 USD
- **Billing**: Every 28 days (Custom interval)
- **Copy Price ID** → Save for `NEXT_PUBLIC_STRIPE_PRICE_28DAY`

#### Products 6-8: Token Packs

**Power Pack:**
- **Name**: VibrationFit Power Pack
- **Description**: 2 million VIVA tokens
- **Type**: One-time payment
- **Price**: $99.00 USD
- **Copy Price ID** → Save for `STRIPE_PRICE_TOKEN_POWER`

**Mega Pack:**
- **Name**: VibrationFit Mega Pack
- **Description**: 5 million VIVA tokens
- **Type**: One-time payment
- **Price**: $199.00 USD
- **Copy Price ID** → Save for `STRIPE_PRICE_TOKEN_MEGA`

**Ultra Pack:**
- **Name**: VibrationFit Ultra Pack
- **Description**: 12 million VIVA tokens
- **Type**: One-time payment
- **Price**: $399.00 USD
- **Copy Price ID** → Save for `STRIPE_PRICE_TOKEN_ULTRA`

---

### ✅ 4. Get Live API Keys

1. **Go to**: Developers → API keys
2. **Copy Live Keys**:
   - **Publishable key** (starts with `pk_live_`)
   - **Secret key** (starts with `sk_live_`) - Click "Reveal test key" then copy

⚠️ **Important**: Never commit live keys to git or expose them publicly!

---

### ✅ 5. Set Up Production Webhook

1. **Go to**: Developers → Webhooks → Add endpoint

2. **Endpoint URL**:
   ```
   https://vibrationfit.com/api/stripe/webhook
   ```
   (Replace with your actual production domain)

3. **Events to listen for**:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
   - ✅ `customer.subscription.trial_will_end`
   - ✅ `customer.updated`

4. **Copy Webhook Signing Secret**:
   - Click on the webhook endpoint after creating it
   - Copy the "Signing secret" (starts with `whsec_`)
   - Save for `STRIPE_WEBHOOK_SECRET`

---

### ✅ 6. Update Environment Variables in Vercel

**Go to**: Vercel Dashboard → Your Project → Settings → Environment Variables

**Update/Add these variables** (switch from `test` to `live`):

```bash
# ============================================================================
# STRIPE API KEYS (LIVE MODE)
# ============================================================================

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# ============================================================================
# HORMOZI PRICING - INTENSIVE (LIVE PRICE IDs)
# ============================================================================

STRIPE_PRICE_INTENSIVE_FULL=price_xxxxxxxxxxxxx        # $499 one-time
STRIPE_PRICE_INTENSIVE_2PAY=price_xxxxxxxxxxxxx        # $249.50 × 2
STRIPE_PRICE_INTENSIVE_3PAY=price_xxxxxxxxxxxxx        # $166.33 × 3

# ============================================================================
# HORMOZI PRICING - CONTINUITY (LIVE PRICE IDs)
# ============================================================================

NEXT_PUBLIC_STRIPE_PRICE_ANNUAL=price_xxxxxxxxxxxxx   # $999/year
NEXT_PUBLIC_STRIPE_PRICE_28DAY=price_xxxxxxxxxxxxx    # $99/28 days

# ============================================================================
# TOKEN PACKS (LIVE PRICE IDs)
# ============================================================================

STRIPE_PRICE_TOKEN_POWER=price_xxxxxxxxxxxxx          # 2M - $99
STRIPE_PRICE_TOKEN_MEGA=price_xxxxxxxxxxxxx           # 5M - $199
STRIPE_PRICE_TOKEN_ULTRA=price_xxxxxxxxxxxxx          # 12M - $399

# ============================================================================
# APP URL (PRODUCTION)
# ============================================================================

NEXT_PUBLIC_APP_URL=https://vibrationfit.com
```

**After updating:**
1. Click "Save"
2. **Redeploy** your application (or wait for auto-deploy on next push)

---

### ✅ 7. Verify Production URLs

Check that these environment variables point to production:

```bash
NEXT_PUBLIC_APP_URL=https://vibrationfit.com
NEXT_PUBLIC_BASE_URL=https://vibrationfit.com  # If used
```

**Verify these redirect URLs are correct:**
- Success URL: `https://vibrationfit.com/billing/success`
- Cancel URL: `https://vibrationfit.com/pricing`
- Intensive Success: `https://vibrationfit.com/intensive/dashboard`

---

### ✅ 8. Test with Real Card (Your Own)

**Before going fully live, test with your own card:**

1. **Use a real credit/debit card** (not test cards)
2. **Make a small purchase** (e.g., token pack or intensive)
3. **Verify**:
   - ✅ Checkout redirects work
   - ✅ Payment processes successfully
   - ✅ Webhook receives events (check Stripe Dashboard → Webhooks → Recent events)
   - ✅ User account is created (if guest checkout)
   - ✅ Subscription/order appears in database
   - ✅ Tokens are granted correctly
   - ✅ Success page loads

**Test Cards for Validation (Use Real Cards After):**
- Stripe test cards won't work in live mode
- Use your own card for initial testing
- Consider using Stripe's "Test mode" in parallel for development

---

### ✅ 9. Monitor First Transactions

**Watch for these in Stripe Dashboard:**

1. **Payments Tab**: Check first few transactions
2. **Webhooks Tab**: Verify events are being received
3. **Logs Tab**: Check for any errors
4. **Customers Tab**: Verify customer records are created

**Monitor in Supabase:**
- `customer_subscriptions` table
- `payment_history` table
- `intensive_purchases` table (if applicable)
- `token_transactions` table

---

### ✅ 10. Verify Webhook Security

**Make sure your webhook endpoint:**
- ✅ Requires HTTPS
- ✅ Verifies Stripe signatures
- ✅ Handles all event types correctly
- ✅ Has proper error handling
- ✅ Logs events for debugging

**Test webhook locally (if needed):**
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
stripe trigger checkout.session.completed
```

---

## 🎯 Post-Launch Tasks

### 1. Set Up Monitoring

- **Stripe Dashboard**: Monitor payments, webhooks, and errors
- **Vercel Logs**: Check for API route errors
- **Supabase Logs**: Monitor database operations

### 2. Set Up Alerts

**Recommended Stripe Alerts:**
- Failed payments
- Webhook failures
- Chargebacks
- Refunds

**Recommended Application Alerts:**
- Webhook handler errors
- Database errors
- API route failures

### 3. Document Support Process

- How to handle refunds
- How to cancel subscriptions manually
- How to grant tokens manually
- How to troubleshoot payment issues

---

## 🔒 Security Checklist

- ✅ Live API keys are **only** in Vercel environment variables
- ✅ Webhook secret is secure and unique
- ✅ HTTPS is enforced on all payment pages
- ✅ Webhook endpoint verifies signatures
- ✅ User authentication is required for checkout
- ✅ No sensitive data in client-side code
- ✅ Rate limiting on API routes (if needed)

---

## 🐛 Common Issues & Solutions

### Issue: Webhook not receiving events
**Solution**: 
- Check webhook URL is correct
- Verify webhook secret matches
- Check Vercel logs for errors
- Ensure endpoint is accessible from internet

### Issue: Payments succeed but subscriptions not created
**Solution**:
- Check webhook handler logs
- Verify `checkout.session.completed` event is handled
- Check database for errors
- Verify user_id metadata is passed

### Issue: Test mode keys still being used
**Solution**:
- Double-check Vercel environment variables
- Redeploy application after updating vars
- Clear Vercel build cache if needed

### Issue: Redirect URLs incorrect
**Solution**:
- Verify `NEXT_PUBLIC_APP_URL` is set correctly
- Check success/cancel URLs in checkout session creation
- Ensure domain matches production domain

---

## 📞 Support Resources

- **Stripe Support**: https://support.stripe.com
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Stripe Documentation**: https://stripe.com/docs
- **Vercel Environment Variables**: https://vercel.com/docs/concepts/projects/environment-variables

---

## ✅ Final Checklist

Before announcing you're live:

- [ ] All live products created in Stripe
- [ ] Live API keys in Vercel
- [ ] Live webhook endpoint configured
- [ ] Tested with real card (your own)
- [ ] Verified first transaction end-to-end
- [ ] All environment variables updated
- [ ] Production URLs verified
- [ ] Webhook security verified
- [ ] Monitoring/alerting set up
- [ ] Support process documented

---

**You're ready to go live!** 🎉

Once all items are checked, your payment system is production-ready and can accept real payments from customers.

