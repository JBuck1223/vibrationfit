# Stripe Products Setup for Household Plans

**Last Updated:** November 14, 2025

## 📋 Overview

This guide details all Stripe products and prices you need to create to support both **Solo** and **Household** plans in VibrationFit.

---

## 🏗️ Product Structure

You'll need to create **12 new products** in Stripe (6 for Household plans):

### **Household Plans (NEW)**
1. **Household Intensive - Full Payment** ($699 one-time)
2. **Household Intensive - 2 Payments** ($349.50 × 2)
3. **Household Intensive - 3 Payments** ($233 × 3)
4. **Household Vision Pro Annual** ($1,499/year)
5. **Household Vision Pro 28-Day** ($149/28 days)

### **Solo Plans (Existing - no changes needed)**
1. Solo Intensive - Full Payment ($499 one-time)
2. Solo Intensive - 2 Payments ($249.50 × 2)
3. Solo Intensive - 3 Payments ($166.33 × 3)
4. Solo Vision Pro Annual ($999/year)
5. Solo Vision Pro 28-Day ($99/28 days)

---

## 🛠️ Stripe Product Configuration

### **1. Household Intensive - Full Payment**

**Product Details:**
- **Name:** `VibrationFit Household Intensive (Full Payment)`
- **Description:** `8-week Activation Intensive program for couples/households (2 seats included)`
- **Type:** One-time payment

**Price Details:**
- **Amount:** `$699.00 USD`
- **Billing:** One-time
- **Price ID:** Save this as `STRIPE_PRICE_HOUSEHOLD_INTENSIVE_FULL`

---

### **2. Household Intensive - 2 Payments**

**Product Details:**
- **Name:** `VibrationFit Household Intensive (2 Payments)`
- **Description:** `8-week Activation Intensive for couples/households - Split into 2 payments`
- **Type:** Recurring subscription (2 payments total)

**Price Details:**
- **Amount:** `$349.50 USD`
- **Billing:** Every 28 days
- **Billing cycle limit:** 2 payments total
- **Cancel at end:** Yes (automatically cancels after 2 payments)
- **Price ID:** Save this as `STRIPE_PRICE_HOUSEHOLD_INTENSIVE_2PAY`

**⚠️ Important Configuration:**
- Set "Limit the number of billing cycles" to **2**
- Enable "Cancel subscription at end of billing cycles"

---

### **3. Household Intensive - 3 Payments**

**Product Details:**
- **Name:** `VibrationFit Household Intensive (3 Payments)`
- **Description:** `8-week Activation Intensive for couples/households - Split into 3 payments`
- **Type:** Recurring subscription (3 payments total)

**Price Details:**
- **Amount:** `$233.00 USD`
- **Billing:** Every 28 days
- **Billing cycle limit:** 3 payments total
- **Cancel at end:** Yes (automatically cancels after 3 payments)
- **Price ID:** Save this as `STRIPE_PRICE_HOUSEHOLD_INTENSIVE_3PAY`

**⚠️ Important Configuration:**
- Set "Limit the number of billing cycles" to **3**
- Enable "Cancel subscription at end of billing cycles"

---

### **4. Household Vision Pro Annual**

**Product Details:**
- **Name:** `VibrationFit Vision Pro Annual (Household)`
- **Description:** `Annual Vision Pro subscription for couples/households - 2 seats, 5M tokens/year, 100GB storage`
- **Type:** Recurring subscription

**Price Details:**
- **Amount:** `$1,499.00 USD`
- **Billing:** Every 365 days (annual)
- **Trial period:** 56 days (set in webhook, not in Stripe product)
- **Price ID:** Save this as `STRIPE_PRICE_HOUSEHOLD_ANNUAL`

**Metadata (optional but recommended):**
```json
{
  "plan_type": "household",
  "seats": "2",
  "tokens_annual": "5000000",
  "storage_gb": "100"
}
```

---

### **5. Household Vision Pro 28-Day**

**Product Details:**
- **Name:** `VibrationFit Vision Pro 28-Day (Household)`
- **Description:** `Monthly Vision Pro subscription for couples/households - 2 seats, 375k tokens per cycle, 25GB storage`
- **Type:** Recurring subscription

**Price Details:**
- **Amount:** `$149.00 USD`
- **Billing:** Every 28 days
- **Trial period:** 56 days (set in webhook, not in Stripe product)
- **Price ID:** Save this as `STRIPE_PRICE_HOUSEHOLD_28DAY`

**Metadata (optional but recommended):**
```json
{
  "plan_type": "household",
  "seats": "2",
  "tokens_per_cycle": "375000",
  "storage_gb": "25",
  "rollover_max_cycles": "3"
}
```

---

## 🔑 Environment Variables

After creating all products in Stripe, add these **new** environment variables to your `.env.local`:

```bash
# Household Intensive Plans
STRIPE_PRICE_HOUSEHOLD_INTENSIVE_FULL=price_xxxxxxxxxxxxx
STRIPE_PRICE_HOUSEHOLD_INTENSIVE_2PAY=price_xxxxxxxxxxxxx
STRIPE_PRICE_HOUSEHOLD_INTENSIVE_3PAY=price_xxxxxxxxxxxxx

# Household Vision Pro Plans
STRIPE_PRICE_HOUSEHOLD_ANNUAL=price_xxxxxxxxxxxxx
STRIPE_PRICE_HOUSEHOLD_28DAY=price_xxxxxxxxxxxxx
```

### **Existing Solo Plan Variables (no changes needed):**
```bash
# Solo Intensive Plans
STRIPE_PRICE_INTENSIVE_FULL=price_xxxxxxxxxxxxx
STRIPE_PRICE_INTENSIVE_2PAY=price_xxxxxxxxxxxxx
STRIPE_PRICE_INTENSIVE_3PAY=price_xxxxxxxxxxxxx

# Solo Vision Pro Plans
NEXT_PUBLIC_STRIPE_PRICE_ANNUAL=price_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PRICE_28DAY=price_xxxxxxxxxxxxx
```

---

## 🔄 How It Works

### **1. User Selects Plan Type on Home Page**
- User toggles between "Solo (1 Seat)" and "Household (2 Seats)"
- User selects Intensive payment plan (Full, 2-Pay, or 3-Pay)
- User selects Vision Pro continuity (Annual or 28-Day)

### **2. Checkout Session Created**
- Frontend sends `planType: 'solo' | 'household'` to `/api/stripe/checkout-combined`
- API selects the correct Stripe price IDs based on `planType`
- Metadata includes `plan_type` field for webhook processing

### **3. Stripe Webhook Processes Payment**
- Webhook receives `checkout.session.completed` or `invoice.payment_succeeded` event
- Reads `metadata.plan_type` from the session
- If `plan_type === 'household'`:
  - Creates a `household` record in the database
  - User becomes the admin of the household
  - Household gets 2 seats immediately
  - User can invite a second member via email

### **4. Household Member Invitation**
- Admin invites second user via `/household/settings`
- Invited user receives email with invitation link
- Invited user accepts and joins the household
- Both users share token pool (configurable via "shared tokens" setting)

---

## 📊 Pricing Summary Table

| **Plan Type** | **Intensive** | **Vision Pro Annual** | **Vision Pro 28-Day** | **Seats** |
|---------------|---------------|-----------------------|-----------------------|-----------|
| **Solo**      | $499          | $999/year             | $99/28 days           | 1         |
| **Household** | $699          | $1,499/year           | $149/28 days          | 2         |

### **Payment Plan Options:**
- **Full:** Pay total upfront
- **2-Pay:** Split into 2 payments (28 days apart)
- **3-Pay:** Split into 3 payments (28 days apart)

---

## ✅ Testing Checklist

After creating all Stripe products:

1. **Test Solo Plans:**
   - [ ] Solo Intensive Full + Annual Continuity
   - [ ] Solo Intensive 2-Pay + 28-Day Continuity
   - [ ] Solo Intensive 3-Pay + Annual Continuity

2. **Test Household Plans:**
   - [ ] Household Intensive Full + Annual Continuity
   - [ ] Household Intensive 2-Pay + 28-Day Continuity
   - [ ] Household Intensive 3-Pay + Annual Continuity

3. **Verify in Database:**
   - [ ] User profile created correctly
   - [ ] Household record created (for household plans)
   - [ ] Token grants applied correctly (solo vs household have same token amounts)
   - [ ] Storage quotas set correctly
   - [ ] `membership_tier_id` matches plan type

4. **Test Household Features:**
   - [ ] Admin can invite second member
   - [ ] Invited user receives email
   - [ ] Invited user can accept invitation
   - [ ] Both users see household context in dashboard
   - [ ] Token sharing works correctly

---

## 🚨 Important Notes

### **Token Grants (Same for Solo and Household):**
- Annual plans: 5,000,000 tokens/year
- 28-Day plans: 375,000 tokens/cycle (rollover up to 3 cycles)
- Trial users: 400,000 tokens total

### **Storage Quotas (Same for Solo and Household):**
- Annual plans: 100GB
- 28-Day plans: 25GB
- Trial users: 5GB

### **Household Seats:**
- Household plans include **2 seats instantly** on purchase
- No additional cost for the second seat
- Additional family members can be added later for $19/28 days or $192/annual (future feature)

### **Billing:**
- Household admin is the billing owner
- All charges go to admin's payment method
- If a user is removed from household, they can become admin of their own solo account

---

## 📞 Need Help?

If you encounter issues during setup:
1. Verify all environment variables are set correctly
2. Check Stripe Dashboard > Products to ensure all prices are created
3. Test in Stripe Test Mode before going live
4. Review webhook logs in Stripe Dashboard > Developers > Webhooks

---

## 🔗 Related Documentation

- [Household Accounts Architecture](./HOUSEHOLD_ACCOUNTS_ARCHITECTURE.md)
- [Household Pricing Structure](./HOUSEHOLD_PRICING_STRUCTURE.md)
- [Checkout Flow Complete](./architecture/CHECKOUT_FLOW_COMPLETE.md)
- [Membership Tiers Explained](./architecture/MEMBERSHIP_TIERS_EXPLAINED.md)

