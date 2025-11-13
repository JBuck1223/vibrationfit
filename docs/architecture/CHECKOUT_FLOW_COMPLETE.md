# Complete Checkout Flow - Every Table & Step

**Last Updated:** November 13, 2025  
**Purpose:** Document the complete checkout flow and every database table involved

---

## 🛒 The Complete Checkout Journey

### Overview: What Users Buy

```
$499 Intensive (one-time or 2-3 payments)
  +
$999/year OR $99/28-days Continuity (starts Day 56)
```

---

## 📊 All Tables Involved (In Order of Use)

### 1. **`auth.users`** (Supabase Auth)
**When:** User account creation  
**Purpose:** Core authentication table  
**Created by:** Supabase Auth system  

**Fields Used:**
- `id` (uuid) - User ID, referenced everywhere
- `email` - User's email
- `email_confirmed_at` - Email confirmation timestamp
- `created_at` - Account creation time

**Flow:**
- **Guest Checkout:** User created in webhook after payment
- **Logged-in Checkout:** User already exists

---

### 2. **`membership_tiers`** ✅ Active
**When:** Webhook looks up tier after payment  
**Purpose:** Reference table for subscription plan types  
**Created by:** Database migrations  

**Fields Used:**
- `id` (uuid) - Primary key
- `tier_type` (enum) - 'vision_pro_annual' or 'vision_pro_28day'
- `name` (text) - Display name
- `is_active` (boolean) - Whether tier is available

**Current Tier Types:**
```sql
'vision_pro_annual'  -- $999/year
'vision_pro_28day'   -- $99/28-days
```

**Flow:**
```typescript
// In webhook
const tierType = 'vision_pro_annual' // from metadata
const tier = await supabase
  .from('membership_tiers')
  .select('id')
  .eq('tier_type', tierType)
  .single()
// tier.id used to create subscription record
```

---

### 3. **`customer_subscriptions`** ✅ Active
**When:** Created in webhook after successful payment  
**Purpose:** Track active Vision Pro subscriptions  
**Created by:** Webhook handler  

**All Fields:**
```sql
id                      uuid        -- Primary key
user_id                 uuid        -- → auth.users(id)
membership_tier_id      uuid        -- → membership_tiers(id)
stripe_customer_id      text        -- Stripe customer ID
stripe_subscription_id  text        -- Stripe subscription ID
stripe_price_id         text        -- Stripe price ID
status                  text        -- active, trialing, canceled, etc.
current_period_start    timestamptz -- Billing period start
current_period_end      timestamptz -- Billing period end
trial_start             timestamptz -- Trial start (for intensive)
trial_end               timestamptz -- Trial end (Day 56)
cancel_at_period_end    boolean     -- Whether canceling
canceled_at             timestamptz -- Cancellation timestamp
created_at              timestamptz -- Record creation
updated_at              timestamptz -- Last update
```

**Key Relationships:**
- Links: `user_id` → `auth.users(id)`
- Links: `membership_tier_id` → `membership_tiers(id)`
- Links to: Stripe customer and subscription

**Status Values:**
- `trialing` - In 56-day trial (Intensive period)
- `active` - Paying subscription
- `canceled` - User canceled
- `past_due` - Payment failed
- `unpaid` - Payment overdue

**Flow:**
```typescript
// Created in webhook
await supabase.from('customer_subscriptions').insert({
  user_id: userId,
  membership_tier_id: tier.id,
  stripe_subscription_id: subscription.id,
  stripe_customer_id: customerId,
  status: 'trialing', // 56-day trial
  trial_start: new Date(),
  trial_end: new Date(+56 days),
  // ...
})
```

---

### 4. **`intensive_purchases`** ✅ Active
**When:** Created in webhook after $499 intensive payment  
**Purpose:** Track 72-hour intensive completion  
**Created by:** Webhook handler  

**All Fields:**
```sql
id                         uuid        -- Primary key
user_id                    uuid        -- → auth.users(id)
stripe_payment_intent_id   text        -- Stripe payment intent
stripe_checkout_session_id text        -- Stripe session ID
amount                     integer     -- Amount in cents (49900)
currency                   text        -- 'usd'
payment_plan               text        -- 'full', '2pay', '3pay'
installments_total         integer     -- 1, 2, or 3
installments_paid          integer     -- Paid so far
next_installment_date      timestamp   -- Next payment due
completion_status          text        -- 'pending', 'in_progress', 'completed', 'refunded'
activation_deadline        timestamp   -- 72 hours from purchase
created_at                 timestamp   -- Purchase time
started_at                 timestamp   -- When user starts intensive
completed_at               timestamp   -- When fully complete
refunded_at                timestamp   -- Refund time
```

**Key Relationships:**
- Links: `user_id` → `auth.users(id)`
- Links to: Stripe payment intent
- Links to: `intensive_checklist` table

**Completion Status Flow:**
```
pending → in_progress → completed
                    ↓
                refunded (if refund issued)
```

**Flow:**
```typescript
// Created in webhook after payment
const activationDeadline = new Date()
activationDeadline.setHours(activationDeadline.getHours() + 72)

await supabase.from('intensive_purchases').insert({
  user_id: userId,
  stripe_payment_intent_id: paymentIntentId,
  amount: 49900, // $499
  payment_plan: 'full', // or '2pay', '3pay'
  installments_total: 1,
  installments_paid: 1,
  completion_status: 'pending',
  activation_deadline: activationDeadline,
})
```

---

### 5. **`intensive_checklist`** ✅ Active
**When:** Created when intensive purchase is recorded  
**Purpose:** Track user progress through 10-step intensive  
**Created by:** Webhook handler  

**All Fields:**
```sql
id                              uuid        -- Primary key
intensive_id                    uuid        -- → intensive_purchases(id)
user_id                         uuid        -- → auth.users(id)

-- Phase 1: Foundation (Steps 1-3)
step_1_profile_complete         boolean     -- 70%+ profile completion
step_2_assessment_complete      boolean     -- Vibration assessment
step_3_call_scheduled           boolean     -- Calibration call booked

-- Phase 2: Vision Creation (Steps 4-5)
step_4_vision_drafted           boolean     -- All 12 categories
step_5_vision_refined           boolean     -- Final polish

-- Phase 3: Activation Tools (Steps 6-8)
step_6_audio_generated          boolean     -- Morning/evening audios
step_7_vision_board_created     boolean     -- 12 images
step_8_journal_entries          boolean     -- 3 entries minimum

-- Phase 4: Launch (Steps 9-10)
step_9_calibration_call         boolean     -- Attended call
step_10_activation_protocol     boolean     -- Ceremony complete

-- Metadata
created_at                      timestamptz
updated_at                      timestamptz
```

**Key Relationships:**
- Links: `intensive_id` → `intensive_purchases(id)`
- Links: `user_id` → `auth.users(id)`

**Completion Logic:**
```typescript
// All 10 steps completed = intensive complete
const allStepsComplete = 
  step_1_profile_complete &&
  step_2_assessment_complete &&
  step_3_call_scheduled &&
  step_4_vision_drafted &&
  step_5_vision_refined &&
  step_6_audio_generated &&
  step_7_vision_board_created &&
  step_8_journal_entries &&
  step_9_calibration_call &&
  step_10_activation_protocol

if (allStepsComplete) {
  // Mark intensive as completed
  await supabase
    .from('intensive_purchases')
    .update({ completion_status: 'completed', completed_at: new Date() })
    .eq('id', intensive_id)
}
```

---

### 6. **`user_profiles`** ✅ Active
**When:** Created/updated during onboarding  
**Purpose:** Extended user profile data  
**Created by:** User onboarding flow  

**Key Fields for Checkout:**
```sql
id                  uuid        -- Primary key
user_id             uuid        -- → auth.users(id)
email               text        -- User email
first_name          text        -- First name
last_name           text        -- Last name
storage_quota_gb    integer     -- Storage limit (25GB or 100GB)
is_onboarding_complete boolean  -- Onboarding status
created_at          timestamptz
updated_at          timestamptz
```

**Flow:**
```typescript
// Updated in webhook after subscription created
await supabase
  .from('user_profiles')
  .update({ 
    storage_quota_gb: tierType === 'vision_pro_annual' ? 100 : 25 
  })
  .eq('user_id', userId)
```

---

### 7. **`token_transactions`** ✅ Active (Source of Truth for Tokens)
**When:** Tokens are granted after payment  
**Purpose:** Record all token movements (grants, usage, refunds)  
**Created by:** Token RPC functions  

**All Fields:**
```sql
id                  uuid        -- Primary key
user_id             uuid        -- → auth.users(id)
amount              integer     -- Token amount (+/- for grant/deduct)
transaction_type    text        -- 'grant', 'usage', 'purchase', 'refund'
description         text        -- Human-readable description
reference_id        text        -- External reference (e.g., subscription_id)
metadata            jsonb       -- Additional data
created_at          timestamptz
previous_balance    integer     -- Balance before transaction
new_balance         integer     -- Balance after transaction
```

**Transaction Types:**
- `grant` - Free token grant (trial, subscription renewal)
- `purchase` - Token pack purchase
- `usage` - Token consumed (AI operation)
- `refund` - Tokens refunded

**Token Balance Calculation:**
```sql
-- Current balance = SUM of all amounts
SELECT SUM(amount) as balance
FROM token_transactions
WHERE user_id = $1
```

**Flow:**
```typescript
// Grant trial tokens (1M for intensive)
await supabase.rpc('grant_trial_tokens', {
  p_user_id: userId,
  p_subscription_id: subscriptionId,
  p_tokens: 1000000,
  p_trial_period_days: 56
})

// This creates a token_transaction record:
{
  user_id: userId,
  amount: 1000000,
  transaction_type: 'grant',
  description: '1M tokens for 72-Hour Intensive (56-day trial)',
  reference_id: subscriptionId,
  metadata: { trial_period: 56, intensive: true }
}
```

**Token Grants by Plan:**

| Plan | Timing | Amount | Type |
|------|--------|--------|------|
| **Intensive Purchase** | Immediately | 1,000,000 | Trial grant |
| **Annual (Day 56)** | At first billing | 5,000,000 | Annual grant |
| **28-Day (Day 56)** | At first billing | 375,000 | Monthly drip |
| **28-Day (Each cycle)** | Every 28 days | 375,000 | Monthly drip |
| **Annual (Renewal)** | Yearly | 5,000,000 | Annual grant |

---

### 8. **`profiles`** ✅ Active (Supabase Default)
**When:** Created automatically by Supabase Auth  
**Purpose:** Minimal profile data for auth  
**Created by:** Supabase Auth trigger  

**Fields:**
```sql
id                     uuid        -- → auth.users(id)
first_name             text
last_name              text
email                  text
stripe_customer_id     text        -- Stripe customer ID
subscription_status    text        -- Subscription status
created_at             timestamptz
updated_at             timestamptz
```

**Note:** This is mostly redundant with `user_profiles` but kept for Supabase compatibility.

---

## 🔄 Complete Checkout Flow (Step-by-Step)

### Step 1: User on Pricing Page
**File:** `src/app/pricing/page.tsx`

**Actions:**
1. User selects payment plan (full, 2-pay, 3-pay)
2. User selects continuity plan (annual or 28-day)
3. User agrees to renewal terms
4. User clicks "Start Journey"

**Result:** Redirects to `/checkout` with parameters

---

### Step 2: Checkout Page
**File:** `src/app/checkout/page.tsx`

**Actions:**
1. Reads URL parameters (payment plan, continuity plan)
2. Displays order summary
3. User confirms purchase
4. Calls `/api/stripe/checkout-combined`

**No database writes yet!**

---

### Step 3: Create Stripe Checkout Session
**File:** `src/app/api/stripe/checkout-combined/route.ts`

**Actions:**
1. Validates payment plan and continuity plan
2. Gets Stripe price IDs from environment variables:
   - Intensive: `STRIPE_PRICE_INTENSIVE_FULL` ($499)
   - Intensive: `STRIPE_PRICE_INTENSIVE_2PAY` ($249.50×2)
   - Intensive: `STRIPE_PRICE_INTENSIVE_3PAY` ($166.33×3)
   - Annual: `NEXT_PUBLIC_STRIPE_PRICE_ANNUAL` ($999/year)
   - 28-Day: `NEXT_PUBLIC_STRIPE_PRICE_28DAY` ($99/28-days)
3. Creates Stripe checkout session with metadata:
   ```typescript
   metadata: {
     product_type: 'combined_intensive_continuity',
     purchase_type: 'intensive',
     payment_plan: 'full', // or '2pay', '3pay'
     continuity_plan: 'annual', // or '28day'
     continuity_price_id: 'price_xxx',
   }
   ```
4. Returns checkout URL

**Still no database writes!**

---

### Step 4: Stripe Payment
**External:** Stripe hosted checkout page

**Actions:**
1. User enters payment information
2. Stripe processes payment
3. On success: Stripe sends webhook to your server

**No database writes yet!**

---

### Step 5: Webhook Receives Event
**File:** `src/app/api/stripe/webhook/route.ts`  
**Event:** `checkout.session.completed`

**This is where all the magic happens! 🎉**

---

### Step 6: Webhook Processing (Multiple Tables)

#### 6A. Create User Account (if guest checkout)

**Table: `auth.users`**

```typescript
// If user doesn't exist (guest checkout)
if (!userId && customerEmail) {
  const { data: authData } = await supabaseAdmin.auth.admin.createUser({
    email: customerEmail,
    email_confirm: true,
  })
  userId = authData.user.id
}
```

**Result:** New user account created

---

#### 6B. Create Intensive Purchase Record

**Table: `intensive_purchases`**

```typescript
const activationDeadline = new Date()
activationDeadline.setHours(activationDeadline.getHours() + 72)

const { data: intensive } = await supabase
  .from('intensive_purchases')
  .insert({
    user_id: userId,
    stripe_payment_intent_id: session.payment_intent,
    stripe_checkout_session_id: session.id,
    amount: 49900, // $499 in cents
    payment_plan: 'full', // or '2pay', '3pay'
    installments_total: 1,
    installments_paid: 1,
    completion_status: 'pending',
    activation_deadline: activationDeadline,
  })
  .select()
  .single()
```

**Result:** Intensive purchase tracked

---

#### 6C. Create Intensive Checklist

**Table: `intensive_checklist`**

```typescript
await supabase.from('intensive_checklist').insert({
  intensive_id: intensive.id,
  user_id: userId,
  // All step fields default to false
})
```

**Result:** Checklist ready for user to complete

---

#### 6D. Lookup Membership Tier

**Table: `membership_tiers` (READ ONLY)**

```typescript
const tierType = continuityPlan === 'annual' 
  ? 'vision_pro_annual' 
  : 'vision_pro_28day'

const { data: tier } = await supabase
  .from('membership_tiers')
  .select('id')
  .eq('tier_type', tierType)
  .single()
```

**Result:** Got `tier.id` for next step

---

#### 6E. Create Stripe Subscription (External)

**External: Stripe API**

```typescript
const visionProSubscription = await stripe.subscriptions.create({
  customer: customerId,
  items: [{
    price: continuityPriceId, // $999/year or $99/28-days
    quantity: 1,
  }],
  trial_period_days: 56, // Don't charge until Day 56
  metadata: {
    tier_type: tierType,
    intensive_purchase_id: intensive.id,
  },
})
```

**Result:** Stripe subscription created with 56-day trial

---

#### 6F. Record Subscription in Database

**Table: `customer_subscriptions`**

```typescript
const { data: newSubscription } = await supabase
  .from('customer_subscriptions')
  .insert({
    user_id: userId,
    membership_tier_id: tier.id, // From step 6D
    stripe_customer_id: customerId,
    stripe_subscription_id: visionProSubscription.id,
    stripe_price_id: continuityPriceId,
    status: 'trialing',
    current_period_start: new Date(subscription.current_period_start * 1000),
    current_period_end: new Date(subscription.current_period_end * 1000),
    trial_start: new Date(),
    trial_end: new Date(Date.now() + 56 * 24 * 60 * 60 * 1000), // +56 days
  })
  .select()
  .single()
```

**Result:** Subscription tracked in database

---

#### 6G. Grant Trial Tokens

**Table: `token_transactions`**

```typescript
// Grant 1M tokens for intensive
await supabase.rpc('grant_trial_tokens', {
  p_user_id: userId,
  p_subscription_id: newSubscription.id,
  p_tokens: 1000000,
  p_trial_period_days: 56,
})
```

**Behind the scenes (in RPC function):**
```sql
INSERT INTO token_transactions (
  user_id,
  amount,
  transaction_type,
  description,
  reference_id,
  metadata
) VALUES (
  p_user_id,
  1000000,
  'grant',
  '1M tokens for 72-Hour Intensive (56-day trial)',
  p_subscription_id,
  jsonb_build_object('trial_period', 56, 'intensive', true)
);
```

**Result:** User has 1,000,000 tokens

---

#### 6H. Update User Profile

**Table: `user_profiles`**

```typescript
await supabase
  .from('user_profiles')
  .update({ 
    storage_quota_gb: 25 // Base trial storage
  })
  .eq('user_id', userId)
```

**Result:** Storage quota set

---

### Step 7: User Redirected to Dashboard

**URL:** `/auth/auto-login?session_id={xxx}&email={xxx}`

**Actions:**
1. User automatically logged in
2. Redirected to dashboard/intensive
3. Sees intensive checklist
4. Has 1M tokens to use
5. Has 72 hours to complete intensive

---

## 📋 Summary: Tables That Matter

### Core Flow Tables (Always Used)

1. ✅ **`auth.users`** - User account
2. ✅ **`membership_tiers`** - Tier lookup (read-only reference)
3. ✅ **`customer_subscriptions`** - Subscription tracking
4. ✅ **`intensive_purchases`** - Intensive purchase tracking
5. ✅ **`intensive_checklist`** - 10-step checklist
6. ✅ **`token_transactions`** - Token balance (source of truth)
7. ✅ **`user_profiles`** - Extended profile data

### Supporting Tables (Used During Intensive)

8. **`vision_versions`** - Life visions created
9. **`life_vision_category_state`** - Category drafts
10. **`assessment_results`** - Vibration assessment
11. **`vision_board_items`** - Vision board images
12. **`journal_entries`** - Journal entries
13. **`vision_audios`** - Generated audio files

---

## 🔍 Key Insights

### 1. `membership_tiers` is Just a Reference Table

**It's NOT used for:**
- ❌ Displaying prices (prices hardcoded in UI)
- ❌ Storing Stripe IDs (those are in ENV vars)
- ❌ Token allocation (that's in `token_transactions`)

**It IS used for:**
- ✅ Mapping `tier_type` → `tier.id`
- ✅ Linking subscriptions to tier types

### 2. `token_transactions` is the Source of Truth

**Token balance = SUM(amount) from all transactions**

Not stored in:
- ❌ `user_profiles` (no balance field)
- ❌ `customer_subscriptions` (no token field)
- ❌ `membership_tiers` (only reference amounts)

### 3. Two Purchases, Two Tables

| Purchase | Table | Purpose |
|----------|-------|---------|
| **$499 Intensive** | `intensive_purchases` | Track 72-hour completion |
| **Vision Pro Subscription** | `customer_subscriptions` | Track recurring billing |

Both are created at the same time in the webhook, but tracked separately.

### 4. Trial Period = Intensive Period

- **Trial start:** Purchase date
- **Trial end:** Day 56
- **Trial tokens:** 1,000,000
- **Status:** `trialing` in `customer_subscriptions`
- **First billing:** Day 56 (automatic)

---

## 🎯 Tables by User Journey Phase

### Purchase Phase
- `auth.users` (create account)
- `intensive_purchases` (track $499 payment)
- `customer_subscriptions` (create subscription with trial)
- `token_transactions` (grant 1M tokens)
- `intensive_checklist` (create checklist)
- `user_profiles` (set storage quota)
- `membership_tiers` (lookup tier reference)

### Intensive Phase (Days 1-3)
- `intensive_checklist` (update steps)
- `user_profiles` (complete profile)
- `assessment_results` (vibration assessment)
- `vision_versions` (create vision)
- `life_vision_category_state` (category work)
- `vision_board_items` (vision board)
- `journal_entries` (journal)
- `vision_audios` (audio generation)
- `token_transactions` (token usage tracking)

### Continuity Phase (Day 56+)
- `customer_subscriptions` (status changes to 'active')
- `token_transactions` (new token grants based on plan)
- Ongoing usage of all feature tables

---

## 🚀 Next: Household System Integration

**What changes:**
- Add `'household_28day'` and `'household_annual'` to `membership_tiers`
- Create separate `households` and `household_members` tables
- Modify token allocation for household members
- Add household selection to pricing page
- Update webhook to handle household subscriptions

**What stays the same:**
- Core flow (checkout → webhook → tables)
- Intensive purchase tracking
- Token transaction system
- User profile management

---

**Last Updated:** November 13, 2025


