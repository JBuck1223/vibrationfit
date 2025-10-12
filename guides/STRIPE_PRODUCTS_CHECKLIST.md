# ✅ Stripe Products Creation Checklist

**Quick guide to create all 5 products for Hormozi pricing model**

Go to: [Stripe Dashboard → Products](https://dashboard.stripe.com/test/products)

---

## 📋 Product Creation Checklist

### ✅ Product 1: Vision Activation Intensive - Full Pay

- [ ] Click "Add product"
- [ ] **Name:** `Vision Activation Intensive - Full Pay`
- [ ] **Description:** `72-hour vision activation with personalized audios, board, and 7-day streak launcher`
- [ ] **Pricing model:** ✓ One time
- [ ] **Price:** `$499.00` USD
- [ ] Click "Save product"
- [ ] **📋 Copy Price ID:** `price_________________`
- [ ] **Variable name:** `STRIPE_PRICE_INTENSIVE_FULL`

---

### ✅ Product 2: Vision Activation Intensive - 2-Pay Plan

- [ ] Click "Add product"
- [ ] **Name:** `Vision Activation Intensive - 2 Payments`
- [ ] **Description:** `Same intensive, split into 2 monthly payments ($499 total)`
- [ ] **Pricing model:** ✓ Recurring
- [ ] **Price:** `$249.50` USD
- [ ] **Billing period:** ✓ Monthly
- [ ] Click "Show more options" or "Advanced"
- [ ] **Billing:** Set to "Charge 2 times" or add metadata: `max_charges: 2`
- [ ] Click "Save product"
- [ ] **📋 Copy Price ID:** `price_________________`
- [ ] **Variable name:** `STRIPE_PRICE_INTENSIVE_2PAY`

**Note:** If Stripe doesn't support limited billing cycles directly, just make it monthly recurring - you'll cancel it after 2 payments in your webhook.

---

### ✅ Product 3: Vision Activation Intensive - 3-Pay Plan

- [ ] Click "Add product"
- [ ] **Name:** `Vision Activation Intensive - 3 Payments`
- [ ] **Description:** `Same intensive, split into 3 monthly payments ($499 total)`
- [ ] **Pricing model:** ✓ Recurring
- [ ] **Price:** `$166.33` USD
- [ ] **Billing period:** ✓ Monthly
- [ ] **Billing:** Set to "Charge 3 times" or add metadata: `max_charges: 3`
- [ ] Click "Save product"
- [ ] **📋 Copy Price ID:** `price_________________`
- [ ] **Variable name:** `STRIPE_PRICE_INTENSIVE_3PAY`

---

### ✅ Product 4: Vision Pro Annual ⭐ (Main Product)

- [ ] Click "Add product"
- [ ] **Name:** `Vision Pro Annual`
- [ ] **Description:** `5M tokens + 100GB storage granted immediately. Full year access to all features. Best value.`
- [ ] **Pricing model:** ✓ Recurring
- [ ] **Price:** `$999.00` USD
- [ ] **Billing period:** ✓ Yearly
- [ ] **Add free trial (optional):** 7 days
- [ ] Click "Save product"
- [ ] **📋 Copy Price ID:** `price_________________`
- [ ] **Variable name:** `NEXT_PUBLIC_STRIPE_PRICE_ANNUAL`

---

### ✅ Product 5: Vision Pro 28-Day

- [ ] Click "Add product"
- [ ] **Name:** `Vision Pro 28-Day`
- [ ] **Description:** `375k tokens per cycle with rollover. Billed every 4 weeks.`
- [ ] **Pricing model:** ✓ Recurring
- [ ] **Price:** `$99.00` USD
- [ ] **Billing period:** ✓ Custom
  - Click "Custom" billing interval
  - Enter: **28 days** (or "Every 28 days")
- [ ] Click "Save product"
- [ ] **📋 Copy Price ID:** `price_________________`
- [ ] **Variable name:** `NEXT_PUBLIC_STRIPE_PRICE_28DAY`

---

## 📝 Paste Your Price IDs Here

Once all 5 are created, copy them here:

```bash
# Intensive products
STRIPE_PRICE_INTENSIVE_FULL=price_
STRIPE_PRICE_INTENSIVE_2PAY=price_
STRIPE_PRICE_INTENSIVE_3PAY=price_

# Continuity products  
NEXT_PUBLIC_STRIPE_PRICE_ANNUAL=price_
NEXT_PUBLIC_STRIPE_PRICE_28DAY=price_
```

---

## 🎯 Quick Tips

### For 2-Pay and 3-Pay Plans:

If Stripe doesn't have a "charge X times" option:
- Just create as regular monthly recurring
- Add metadata: `{ "payment_plan": "2pay", "max_installments": 2 }`
- Your webhook will handle canceling after X payments

### For 28-Day Billing:

**Method 1 (Preferred):**
- Click "Custom" interval
- Enter "28" days

**Method 2 (If custom not available):**
- Create as monthly ($99/month)
- We'll use Stripe Billing Anchors to make it 28-day in code

### Testing Mode:

- Create these in **Test mode** first
- Test the entire flow
- Then recreate in **Live mode** when ready to launch

---

## 🔄 After Creating Products

### Step 1: Add to `.env.local`

```bash
# Add to your local .env.local file
STRIPE_PRICE_INTENSIVE_FULL=price_xxxxx
STRIPE_PRICE_INTENSIVE_2PAY=price_xxxxx
STRIPE_PRICE_INTENSIVE_3PAY=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_ANNUAL=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_28DAY=price_xxxxx
```

### Step 2: Add to Vercel

- Go to Vercel Dashboard
- Your Project → Settings → Environment Variables
- Add all 5 price IDs
- Save → Redeploy

### Step 3: Test Locally

```bash
npm run dev
```

Visit: `http://localhost:3000/pricing-hormozi`

Use test card: `4242 4242 4242 4242`

---

## ✅ Completion Checklist

- [ ] All 5 products created in Stripe
- [ ] All 5 price IDs copied
- [ ] Added to `.env.local`
- [ ] Added to Vercel
- [ ] Tested intensive purchase locally
- [ ] Verified webhook creates `intensive_purchases` record
- [ ] Ready to build intensive onboarding flow!

---

**Time estimate:** 15-20 minutes to create all 5 products

**Ready?** Create those products and paste the price IDs! 🚀

