# Pricing Architecture - How It All Fits Together

**Date:** November 13, 2025  
**Purpose:** Explain relationship between Stripe, membership_tiers, and billing_config

---

## 🎯 Three Separate Systems

Your pricing involves THREE different systems:

### 1. **Stripe** (External Billing System)
- **What:** Actual payment processing
- **Stores:** Price amounts, subscription IDs, customer IDs
- **Managed:** Stripe Dashboard + ENV variables
- **Example:**
  ```
  price_abc123 → $999/year (billed by Stripe)
  price_def456 → $99/28-days (billed by Stripe)
  ```

### 2. **membership_tiers** (Plan Definitions)
- **What:** Internal plan type identification
- **Stores:** Tier type, tier name, reference data
- **Managed:** Database migrations
- **Example:**
  ```sql
  tier_type: 'vision_pro_annual'
  name: 'Vision Pro Annual'
  ```

### 3. **billing_config** (Benefit Amounts) ← **NEW**
- **What:** Token and storage amounts customers receive
- **Stores:** Token grants, storage quotas, limits
- **Managed:** Database table (easy to update)
- **Example:**
  ```sql
  token_annual: 5000000
  storage_annual: 100
  ```

---

## 🔗 How They Connect

### Current Flow:

```
┌─────────────────┐
│  STRIPE         │
│  price_abc123   │  User pays $999
│  ($999/year)    │
└────────┬────────┘
         │ webhook event
         ↓
┌─────────────────┐
│  WEBHOOK        │
│  metadata:      │  Knows which plan: 'vision_pro_annual'
│  tier_type      │
└────────┬────────┘
         │ lookup tier
         ↓
┌─────────────────┐
│  membership_    │
│  tiers          │  Gets tier.id for foreign key
│  (lookup only)  │
└────────┬────────┘
         │ create subscription
         ↓
┌─────────────────┐
│  customer_      │
│  subscriptions  │  Links: user → tier → stripe_sub
└────────┬────────┘
         │ grant benefits
         ↓
┌─────────────────┐
│  SQL FUNCTION   │
│  grant_annual_  │  Hardcoded: 5M tokens, 100GB
│  tokens()       │
└─────────────────┘
```

### Recommended Flow (with billing_config):

```
┌─────────────────┐
│  STRIPE         │
│  price_abc123   │  User pays $999
│  ($999/year)    │
└────────┬────────┘
         │ webhook event
         ↓
┌─────────────────┐
│  WEBHOOK        │
│  metadata:      │  Knows: 'vision_pro_annual'
│  tier_type      │
└────────┬────────┘
         │ lookup tier + config
         ↓
┌─────────────────┐     ┌─────────────────┐
│  membership_    │ ←───│  billing_       │
│  tiers          │     │  config         │
│  tier_type +    │     │  token amounts  │
│  config_key     │ ─→  │  storage amounts│
└────────┬────────┘     └─────────────────┘
         │
         ↓
┌─────────────────┐
│  customer_      │
│  subscriptions  │  Links user → tier
└────────┬────────┘
         │ grant benefits
         ↓
┌─────────────────┐
│  SQL FUNCTION   │
│  grant_annual_  │  Queries billing_config table
│  tokens()       │  Dynamic: Gets current values
└─────────────────┘
```

---

## 🤔 Should You Combine membership_tiers + billing_config?

### Option A: Keep Separate ✅ RECOMMENDED

**Structure:**

```sql
-- membership_tiers: Plan identification
CREATE TABLE membership_tiers (
  id UUID PRIMARY KEY,
  tier_type TEXT UNIQUE,  -- 'vision_pro_annual'
  name TEXT,              -- 'Vision Pro Annual'
  config_key TEXT,        -- 'annual' → points to billing_config
  is_active BOOLEAN
);

-- billing_config: Benefit amounts
CREATE TABLE billing_config (
  key TEXT PRIMARY KEY,
  category TEXT,
  value_int BIGINT,
  description TEXT
);

-- Link them:
INSERT INTO membership_tiers VALUES
('...', 'vision_pro_annual', 'Vision Pro Annual', 'annual', true);

INSERT INTO billing_config VALUES
('token_annual', 'tokens', 5000000, 'Annual tokens'),
('storage_annual', 'storage', 100, 'Annual storage');

-- Usage:
SELECT 
  mt.tier_type,
  bc_tokens.value_int as tokens,
  bc_storage.value_int as storage
FROM membership_tiers mt
LEFT JOIN billing_config bc_tokens 
  ON bc_tokens.key = 'token_' || mt.config_key
LEFT JOIN billing_config bc_storage 
  ON bc_storage.key = 'storage_' || mt.config_key
WHERE mt.tier_type = 'vision_pro_annual';
```

**Pros:**
- ✅ Clear separation of concerns
- ✅ Reusable config values (household uses same tokens)
- ✅ Easy to update benefits without touching tiers
- ✅ Can have multiple tiers share same config

**Cons:**
- ⚠️ Requires JOIN to get full picture
- ⚠️ Slightly more complex

---

### Option B: Combine Into membership_tiers ❌ NOT RECOMMENDED

**Structure:**

```sql
CREATE TABLE membership_tiers (
  id UUID PRIMARY KEY,
  tier_type TEXT UNIQUE,
  name TEXT,
  token_grant BIGINT,     -- Tokens for this tier
  storage_quota INTEGER,  -- Storage for this tier
  rollover_max INTEGER,   -- Rollover limit (if applicable)
  is_active BOOLEAN
);
```

**Pros:**
- ✅ All plan info in one place
- ✅ No JOINs needed

**Cons:**
- ❌ Duplicate values (annual + household both = 5M tokens)
- ❌ Hard to change "all plans get 5M tokens" in one place
- ❌ Mixing plan identification with benefit amounts
- ❌ Harder to maintain consistency

---

## 🎯 Recommended Architecture

### Keep Three Separate Systems:

| System | Purpose | Example |
|--------|---------|---------|
| **Stripe** | Billing & payment | `price_abc` = $999 charged |
| **membership_tiers** | Plan identification | `vision_pro_annual` = which plan |
| **billing_config** | Benefit amounts | `token_annual` = 5M tokens granted |

---

## 💡 How It Works With Stripe

### Stripe Stores:

```javascript
// In Stripe Dashboard:
Product: "Vision Pro Annual"
  Price: price_abc123
    Amount: $999
    Interval: year
    
Product: "Vision Pro 28-Day"
  Price: price_def456
    Amount: $99
    Interval: 28 days
```

### Your Database Stores:

```sql
-- membership_tiers: Which plan type
tier_type: 'vision_pro_annual'
stripe_price_id: 'price_abc123'  -- Reference to Stripe

-- billing_config: What they get
token_annual: 5000000
storage_annual: 100

-- customer_subscriptions: Who has what
user_id: 'user_123'
membership_tier_id: 'tier_uuid'
stripe_subscription_id: 'sub_xyz'
```

---

## 🔄 Complete Flow Example

### User purchases Vision Pro Annual ($999)

**1. User clicks "Subscribe" on your pricing page**

```tsx
// Frontend: pricing section
<Button onClick={() => checkout('annual')}>
  Subscribe - $999/year
</Button>
```

**2. Create Stripe checkout session**

```typescript
// API: /api/stripe/checkout
const session = await stripe.checkout.sessions.create({
  line_items: [{
    price: process.env.STRIPE_PRICE_ANNUAL, // 'price_abc123'
    quantity: 1,
  }],
  metadata: {
    tier_type: 'vision_pro_annual', // Your internal identifier
  }
})
```

**3. User pays in Stripe**
- Stripe charges $999
- Stripe creates subscription `sub_xyz`
- Stripe sends webhook to your server

**4. Webhook receives event**

```typescript
// Webhook handler
const tierType = session.metadata.tier_type // 'vision_pro_annual'

// Lookup tier
const tier = await supabase
  .from('membership_tiers')
  .select('id, config_key')
  .eq('tier_type', tierType)
  .single()
// Returns: { id: 'uuid', config_key: 'annual' }
```

**5. Create subscription record**

```typescript
// Link user to tier
await supabase.from('customer_subscriptions').insert({
  user_id: userId,
  membership_tier_id: tier.id,
  stripe_subscription_id: 'sub_xyz',
  stripe_customer_id: 'cus_abc',
  status: 'active',
})
```

**6. Grant tokens from billing_config**

```sql
-- SQL function calls billing_config
SELECT value_int INTO v_token_amount
FROM billing_config
WHERE key = 'token_annual';
-- Returns: 5000000

SELECT value_int INTO v_storage_quota
FROM billing_config
WHERE key = 'storage_annual';
-- Returns: 100

-- Grant to user
UPDATE user_profiles
SET 
  vibe_assistant_tokens_remaining = 5000000,
  storage_quota_gb = 100
WHERE user_id = p_user_id;
```

**7. User gets access**
- ✅ 5,000,000 tokens
- ✅ 100GB storage
- ✅ All Vision Pro features

---

## 📊 Database Schema Recommendation

### Table Relationships:

```
┌─────────────────────┐
│  membership_tiers   │
│  ─────────────────  │
│  id (PK)            │
│  tier_type (unique) │  ← Referenced by webhook
│  name               │
│  stripe_price_id    │  ← Optional reference to Stripe
│  config_key         │  ← Links to billing_config
│  is_active          │
└──────────┬──────────┘
           │
           │ FK: membership_tier_id
           ↓
┌─────────────────────┐
│  customer_          │
│  subscriptions      │
│  ─────────────────  │
│  id (PK)            │
│  user_id (FK)       │  ← auth.users
│  membership_tier_id │  ← membership_tiers.id
│  stripe_sub_id      │  ← Stripe subscription
│  status             │
└─────────────────────┘


┌─────────────────────┐
│  billing_config     │  ← Separate, reusable
│  ─────────────────  │
│  key (PK)           │
│  category           │
│  value_int          │
│  description        │
└─────────────────────┘
```

### Example Data:

```sql
-- membership_tiers
| tier_type            | name                  | config_key | stripe_price_id |
|----------------------|-----------------------|------------|-----------------|
| vision_pro_annual    | Vision Pro Annual     | annual     | price_abc123    |
| vision_pro_28day     | Vision Pro 28-Day     | 28day      | price_def456    |
| household_28day      | Household 28-Day      | household  | price_ghi789    |

-- billing_config
| key                  | category | value_int | description              |
|----------------------|----------|-----------|--------------------------|
| token_annual         | tokens   | 5000000   | Annual plan tokens       |
| token_28day          | tokens   | 375000    | 28-day plan tokens       |
| token_household      | tokens   | 750000    | Household tokens (2x)    |
| storage_annual       | storage  | 100       | Annual storage (GB)      |
| storage_28day        | storage  | 25        | 28-day storage (GB)      |
| rollover_max_cycles  | limits   | 3         | Max rollover cycles      |

-- customer_subscriptions
| user_id | membership_tier_id | stripe_subscription_id | status  |
|---------|--------------------|-----------------------|---------|
| user_1  | tier_annual_uuid   | sub_xyz               | active  |
| user_2  | tier_28day_uuid    | sub_abc               | active  |
```

---

## 🎨 Webhook Logic (Simplified)

```typescript
// Webhook: checkout.session.completed
const tierType = session.metadata.tier_type // 'vision_pro_annual'

// 1. Get tier (for foreign key)
const tier = await supabase
  .from('membership_tiers')
  .select('id, config_key')
  .eq('tier_type', tierType)
  .single()

// 2. Create subscription record
await supabase.from('customer_subscriptions').insert({
  user_id: userId,
  membership_tier_id: tier.id,
  stripe_subscription_id: subscriptionId,
  status: 'active',
})

// 3. Grant tokens (function reads billing_config)
await supabase.rpc('grant_tokens_by_config_key', {
  p_user_id: userId,
  p_config_key: tier.config_key, // 'annual'
})

// SQL function:
// SELECT value_int FROM billing_config WHERE key = 'token_' || p_config_key
// Returns 5000000, grants to user
```

---

## ✅ Final Recommendation

### Keep Three Separate Systems:

**1. Stripe (External)**
- Lives: Stripe Dashboard
- Stores: Actual prices customers pay
- Reference: Use `stripe_price_id` in membership_tiers

**2. membership_tiers (Plan Identity)**
- Lives: Your database
- Stores: Plan types, tier names, tier metadata
- Purpose: Identify which plan user is on
- Fields: `tier_type`, `name`, `config_key`, `stripe_price_id`

**3. billing_config (Benefits)**
- Lives: Your database (new table)
- Stores: Token amounts, storage quotas, limits
- Purpose: Define what customers get
- Fields: `key`, `category`, `value_int`, `description`

### Why This Works:

✅ **Stripe handles billing** - That's what it's good at
✅ **membership_tiers identifies plans** - Clear plan types
✅ **billing_config defines benefits** - Easy to update, reusable
✅ **Functions query billing_config** - Dynamic, no hardcoding
✅ **UI queries billing_config** - Display correct amounts
✅ **Consistent everywhere** - Single source of truth for benefits

---

## 🚀 Migration Path

### Step 1: Create billing_config table
```sql
CREATE TABLE billing_config (
  key TEXT PRIMARY KEY,
  category TEXT,
  value_int BIGINT,
  description TEXT
);
```

### Step 2: Add config_key to membership_tiers
```sql
ALTER TABLE membership_tiers
ADD COLUMN config_key TEXT;

UPDATE membership_tiers
SET config_key = 
  CASE tier_type
    WHEN 'vision_pro_annual' THEN 'annual'
    WHEN 'vision_pro_28day' THEN '28day'
  END;
```

### Step 3: Update database functions
```sql
-- Functions now query billing_config instead of hardcoding
CREATE OR REPLACE FUNCTION grant_tokens_by_config_key(
  p_user_id UUID,
  p_config_key TEXT
) ...
```

### Step 4: Test in staging
- Test token grants
- Test storage updates
- Verify consistency

### Step 5: Deploy to production
- Run migrations
- Monitor first few subscriptions
- Verify correct amounts granted

---

## 📝 Summary

**Don't combine them!** Keep separate:

| Table | Purpose | Contains |
|-------|---------|----------|
| **membership_tiers** | Plan identification | tier_type, name, config_key |
| **billing_config** | Benefit amounts | token amounts, storage quotas |
| **Stripe** | Billing amounts | Prices, subscriptions, payments |

**They work together:**
- Stripe charges the money
- membership_tiers identifies the plan
- billing_config defines the benefits
- Functions and UI query billing_config

**Benefits:**
- ✅ Change token amounts without code deploy
- ✅ Consistent across UI and backend
- ✅ Reusable config (household shares values)
- ✅ Stripe stays external (as it should)
- ✅ Clear separation of concerns

---

**Last Updated:** November 13, 2025  
**Recommended:** Keep separate, link via config_key


