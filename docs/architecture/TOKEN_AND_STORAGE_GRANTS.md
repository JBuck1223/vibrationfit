# Token & Storage Grant Numbers - Where They Live

**Last Updated:** November 13, 2025  
**Purpose:** Document all hardcoded token and storage quota numbers across the system

---

## 🎯 The Problem

Token and storage grants are **hardcoded in multiple places** across your codebase. There's no single source of truth - the numbers are scattered across:

1. **Database functions** (PostgreSQL)
2. **Webhook handler** (TypeScript/Node.js)
3. **Pricing page UI** (React/TypeScript)

This means if you want to change a token amount, you need to update it in **3+ places**.

---

## 📊 Current Token & Storage Grants

### Intensive Purchase (All Plans)

| Event | Tokens | Storage | Where Defined |
|-------|--------|---------|---------------|
| **Intensive Purchase** | 1,000,000 | 25 GB | Webhook (hardcoded) |

**Files:**
- `src/app/api/stripe/webhook/route.ts` (lines 366-387)

```typescript
// Webhook grants trial tokens
await supabase.rpc('grant_trial_tokens', {
  p_user_id: userId,
  p_subscription_id: newSubscription?.id || null,
  p_tokens: 1000000, // ← HARDCODED: 1M tokens
  p_trial_period_days: 56,
})

await supabase
  .from('user_profiles')
  .update({ storage_quota_gb: 25 }) // ← HARDCODED: 25GB
  .eq('user_id', userId)
```

---

### Vision Pro Annual Plan

| Event | Tokens | Storage | Where Defined |
|-------|--------|---------|---------------|
| **First Billing (Day 56)** | 5,000,000 | 100 GB | Database function |
| **Annual Renewal** | 5,000,000 | 100 GB | Database function |

**Files:**
1. **Database Function:** `supabase/COMPLETE_SCHEMA_DUMP.sql` (lines 1754-1794)
2. **Webhook Call:** `src/app/api/stripe/webhook/route.ts` (lines 115-133)

```sql
-- Database function definition
CREATE OR REPLACE FUNCTION grant_annual_tokens(
  p_user_id UUID,
  p_subscription_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_grant_amount INTEGER := 5000000; -- ← HARDCODED: 5M tokens
BEGIN
  UPDATE user_profiles
  SET 
    vibe_assistant_tokens_remaining = v_grant_amount,
    storage_quota_gb = 100 -- ← HARDCODED: 100GB
  WHERE user_id = p_user_id;
  -- ...
END;
$$;
```

```typescript
// Webhook calls the function
await supabase.rpc('grant_annual_tokens', {
  p_user_id: userId,
  p_subscription_id: newSubscription?.id || null,
})

await supabase
  .from('user_profiles')
  .update({ storage_quota_gb: 100 }) // ← HARDCODED AGAIN: 100GB
  .eq('user_id', userId)
```

---

### Vision Pro 28-Day Plan

| Event | Tokens | Storage | Where Defined |
|-------|--------|---------|---------------|
| **First Cycle (Day 56)** | 375,000 | 25 GB | Database function |
| **Each Renewal** | 375,000 | 25 GB | Database function |
| **Rollover** | Up to 3 cycles | - | Database function |

**Files:**
1. **Database Function:** `supabase/COMPLETE_SCHEMA_DUMP.sql` (lines 1019-1094)
2. **Webhook Call:** `src/app/api/stripe/webhook/route.ts` (lines 136-155)

```sql
-- Database function definition
CREATE OR REPLACE FUNCTION drip_tokens_28day(
  p_user_id UUID,
  p_subscription_id UUID,
  p_cycle_number INTEGER DEFAULT 1
) RETURNS JSONB AS $$
DECLARE
  v_drip_amount INTEGER := 375000; -- ← HARDCODED: 375k per cycle
  v_max_rollover_cycles INTEGER := 3; -- ← HARDCODED: Max 3 rollovers
BEGIN
  -- Token rollover logic
  -- ...
END;
$$;
```

```typescript
// Webhook calls the function
await supabase.rpc('drip_tokens_28day', {
  p_user_id: userId,
  p_subscription_id: newSubscription?.id || null,
  p_cycle_number: 1,
})

await supabase
  .from('user_profiles')
  .update({ storage_quota_gb: 25 }) // ← HARDCODED: 25GB
  .eq('user_id', userId)
```

---

## 🖥️ Pricing Page Display Numbers

### Where Users See Token Amounts

**File:** `src/app/pricing/page.tsx`

```tsx
// Annual Plan (lines 230-237)
<div className="flex items-center gap-2 text-sm text-neutral-200">
  <Check className="w-4 h-4 text-primary-500 flex-shrink-0" />
  <span>5,000,000 tokens (granted immediately)</span>
  {/* ↑ HARDCODED DISPLAY */}
</div>

// 28-Day Plan (lines 244-254)
<div className="flex items-center gap-2 text-sm text-neutral-200">
  <Check className="w-4 h-4 text-secondary-500 flex-shrink-0" />
  <span>375,000 tokens per cycle</span>
  {/* ↑ HARDCODED DISPLAY */}
</div>

// Rollover feature (line 254)
<div className="flex items-center gap-2 text-sm text-neutral-200">
  <Check className="w-4 h-4 text-secondary-500 flex-shrink-0" />
  <span>Rollover up to 3 cycles max</span>
  {/* ↑ HARDCODED DISPLAY */}
</div>
```

**Also in:**
- `src/app/checkout/page.tsx` (lines 231, 246)
- `src/app/pricing-hormozi/page.tsx` (same numbers, duplicate page)

---

## 📍 All Hardcoded Locations

### Token Amounts

| Amount | Purpose | File(s) | Line(s) |
|--------|---------|---------|---------|
| **1,000,000** | Intensive trial | `webhook/route.ts` | 369, 380 |
| **5,000,000** | Annual grant | `COMPLETE_SCHEMA_DUMP.sql` | 1759 |
| | | `webhook/route.ts` | 119 (via RPC) |
| | | `pricing/page.tsx` | 205, 319 |
| | | `checkout/page.tsx` | 231 |
| **375,000** | 28-Day drip | `COMPLETE_SCHEMA_DUMP.sql` | 1024 |
| | | `webhook/route.ts` | 139 (via RPC) |
| | | `pricing/page.tsx` | 260, 372 |
| | | `checkout/page.tsx` | 246 |
| **500,000** | 28-Day trial | `webhook/route.ts` | 380 |

### Storage Quotas

| Amount | Purpose | File(s) | Line(s) |
|--------|---------|---------|---------|
| **25 GB** | Trial & 28-Day | `webhook/route.ts` | 153, 374, 385 |
| | | `pricing/page.tsx` | 377 (mentioned) |
| **100 GB** | Annual plan | `COMPLETE_SCHEMA_DUMP.sql` | 1774 |
| | | `webhook/route.ts` | 132 |
| | | `pricing/page.tsx` | 235 (mentioned) |
| | | `user_profiles` table | DEFAULT value: 100 |

### Rollover Settings

| Setting | Value | File(s) | Line(s) |
|---------|-------|---------|---------|
| **Max Rollover Cycles** | 3 cycles | `COMPLETE_SCHEMA_DUMP.sql` | 1029 |
| | | `pricing/page.tsx` | 254, 278, 390 |

---

## 🔧 Database Functions (Source of Truth for Grants)

### 1. `grant_trial_tokens()`
**File:** `supabase/COMPLETE_SCHEMA_DUMP.sql` (lines 1846-1900)

```sql
CREATE OR REPLACE FUNCTION grant_trial_tokens(
  p_user_id UUID,
  p_trial_amount INTEGER DEFAULT 100000 -- Default (not used)
) RETURNS JSONB;
```

**Called by webhook with custom amount:**
```typescript
// Intensive: 1M tokens
grant_trial_tokens(userId, 1000000)

// OR
// 28-Day trial: 500k tokens
grant_trial_tokens(userId, 500000)
```

**Note:** The function's default of 100k is never used. Webhook always passes explicit amount.

---

### 2. `grant_annual_tokens()`
**File:** `supabase/COMPLETE_SCHEMA_DUMP.sql` (lines 1754-1794)

```sql
CREATE OR REPLACE FUNCTION grant_annual_tokens(
  p_user_id UUID,
  p_subscription_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_grant_amount INTEGER := 5000000; -- ← TOKEN AMOUNT HERE
BEGIN
  UPDATE user_profiles
  SET 
    vibe_assistant_tokens_remaining = v_grant_amount,
    storage_quota_gb = 100 -- ← STORAGE QUOTA HERE
  WHERE user_id = p_user_id;
  -- ...
END;
$$;
```

**Called by webhook:**
```typescript
// On annual subscription creation/renewal
grant_annual_tokens(userId, subscriptionId)
```

**Tokens granted:** 5,000,000  
**Storage set:** 100 GB

---

### 3. `drip_tokens_28day()`
**File:** `supabase/COMPLETE_SCHEMA_DUMP.sql` (lines 1019-1094)

```sql
CREATE OR REPLACE FUNCTION drip_tokens_28day(
  p_user_id UUID,
  p_subscription_id UUID,
  p_cycle_number INTEGER DEFAULT 1
) RETURNS JSONB AS $$
DECLARE
  v_drip_amount INTEGER := 375000; -- ← TOKEN AMOUNT HERE
  v_max_rollover_cycles INTEGER := 3; -- ← ROLLOVER LIMIT HERE
BEGIN
  -- Rollover logic:
  -- If user has tokens left from previous cycle, count it
  -- If > 3 cycles of rollover, expire old tokens
  -- Then add new 375k tokens
  -- ...
END;
$$;
```

**Called by webhook:**
```typescript
// On 28-day subscription renewal
drip_tokens_28day(userId, subscriptionId, cycleNumber)
```

**Tokens granted:** 375,000  
**Max rollovers:** 3 cycles  
**Storage:** Set separately in webhook (25 GB)

---

## 🎨 UI Display Files

### Pricing Page
**File:** `src/app/pricing/page.tsx`

**Token mentions:**
- Line 205: "5,000,000 tokens (granted immediately)" - Annual
- Line 260: "375,000 tokens per 28-day cycle" - 28-Day
- Line 319: "5M tokens" - Annual (repeated)
- Line 372: "375k tokens per 28 days" - 28-Day (repeated)

**Storage mentions:**
- Line 235: "100GB storage" - Annual
- Line 377: "25GB storage base" - 28-Day

**Rollover mentions:**
- Line 254: "Rollover up to 3 cycles max"
- Line 278: "Unused tokens roll over (max 3 cycles)"
- Line 390: "Unused tokens roll over (max 3 cycles)" (duplicate card)

---

### Checkout Page
**File:** `src/app/checkout/page.tsx`

**Token mentions:**
- Line 231: "5,000,000 tokens (granted immediately)" - Annual
- Line 246: "375,000 tokens per cycle" - 28-Day

**Storage mentions:**
- Line 235: "100GB storage" - Annual
- Line 250: "25GB storage base" - 28-Day

**Rollover mentions:**
- Line 254: "Rollover up to 3 cycles max" - 28-Day

---

### Pricing Hormozi Page (Duplicate)
**File:** `src/app/pricing-hormozi/page.tsx`

Same numbers as `pricing/page.tsx` (this appears to be a duplicate/test page)

---

## 🏠 Household Plan Numbers (From Migration)

**File:** `supabase/migrations/20251112000002_create_households_revised.sql`

```sql
-- Household 28-Day Plan (2 seats)
INSERT INTO membership_tiers (
  monthly_vibe_assistant_tokens,
  -- ...
) VALUES (
  750000, -- ← 375k × 2 seats
  -- ...
);

-- Household Annual Plan (2 seats)
INSERT INTO membership_tiers (
  monthly_vibe_assistant_tokens,
  -- ...
) VALUES (
  5000000, -- ← 5M base (will be split or shared)
  -- ...
);
```

**Note:** These are stored in `membership_tiers` table but **NOT actually used** for granting tokens. The grants happen via the same RPC functions above.

**Household token logic still needs implementation:**
- How are tokens split between 2 members?
- Do both get 750k total, or 375k each?
- How does token sharing work?

---

## ⚠️ The Problem: No Single Source of Truth

### To Change Token Amounts, You Must Update:

**For Annual Plan (5M → 6M example):**

1. **Database Function:**
   - `supabase/COMPLETE_SCHEMA_DUMP.sql` line 1759
   - Change: `v_grant_amount INTEGER := 6000000`

2. **Pricing Page UI:**
   - `src/app/pricing/page.tsx` line 205, 319
   - Change: "5,000,000 tokens" → "6,000,000 tokens"

3. **Checkout Page UI:**
   - `src/app/checkout/page.tsx` line 231
   - Change: "5,000,000 tokens" → "6,000,000 tokens"

4. **Pricing Hormozi Page** (if used):
   - `src/app/pricing-hormozi/page.tsx` (same lines)

5. **Migration Files** (if creating new migration):
   - Any new migration that inserts into `membership_tiers`

**Total: 5+ files to update!**

---

## ✅ Recommended Solution: Centralize Configuration

### Option A: Environment Variables

Create a `.env` file with all token/storage values:

```bash
# Token Grants
TOKEN_INTENSIVE_TRIAL=1000000
TOKEN_ANNUAL_GRANT=5000000
TOKEN_28DAY_GRANT=375000
TOKEN_28DAY_ROLLOVER_MAX=3

# Storage Quotas
STORAGE_ANNUAL_GB=100
STORAGE_28DAY_GB=25
STORAGE_TRIAL_GB=25

# Household
TOKEN_HOUSEHOLD_28DAY=750000
TOKEN_HOUSEHOLD_ANNUAL=5000000
```

**Pros:**
- Easy to change without code changes
- Can be different per environment (dev/staging/prod)

**Cons:**
- Database functions can't read ENV vars directly
- Need to pass values through API calls

---

### Option B: Database Configuration Table

Create a `system_config` table:

```sql
CREATE TABLE system_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO system_config (key, value, description) VALUES
('token_grants', jsonb_build_object(
  'intensive_trial', 1000000,
  'annual', 5000000,
  'monthly_28day', 375000,
  'household_28day', 750000,
  'household_annual', 5000000
), 'Token grant amounts for subscriptions'),
('storage_quotas', jsonb_build_object(
  'trial', 25,
  'monthly_28day', 25,
  'annual', 100
), 'Storage quotas in GB'),
('rollover_limits', jsonb_build_object(
  'monthly_28day_max_cycles', 3
), 'Token rollover settings');
```

**Database functions read from config:**

```sql
CREATE OR REPLACE FUNCTION grant_annual_tokens(
  p_user_id UUID,
  p_subscription_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_grant_amount INTEGER;
  v_storage_gb INTEGER;
BEGIN
  -- Read from config table
  SELECT (value->>'annual')::INTEGER
  INTO v_grant_amount
  FROM system_config
  WHERE key = 'token_grants';
  
  SELECT (value->>'annual')::INTEGER
  INTO v_storage_gb
  FROM system_config
  WHERE key = 'storage_quotas';
  
  -- Use dynamic values
  UPDATE user_profiles
  SET 
    vibe_assistant_tokens_remaining = v_grant_amount,
    storage_quota_gb = v_storage_gb
  WHERE user_id = p_user_id;
  -- ...
END;
$$;
```

**Pros:**
- Single source of truth in database
- Can be updated via SQL without code deploys
- Database functions can read directly

**Cons:**
- UI still needs to fetch values (or hardcode)
- More complex setup

---

### Option C: TypeScript Constants File (Current Best Option)

Create a centralized config file that can be used in both UI and API:

**File:** `src/lib/billing/config.ts`

```typescript
export const TOKEN_GRANTS = {
  INTENSIVE_TRIAL: 1_000_000,
  ANNUAL: 5_000_000,
  MONTHLY_28DAY: 375_000,
  HOUSEHOLD_28DAY: 750_000,
  HOUSEHOLD_ANNUAL: 5_000_000,
} as const

export const STORAGE_QUOTAS = {
  TRIAL: 25,
  MONTHLY_28DAY: 25,
  ANNUAL: 100,
} as const

export const ROLLOVER_LIMITS = {
  MONTHLY_28DAY_MAX_CYCLES: 3,
} as const
```

**Use in UI:**

```tsx
import { TOKEN_GRANTS, STORAGE_QUOTAS } from '@/lib/billing/config'

// In pricing page
<span>{TOKEN_GRANTS.ANNUAL.toLocaleString()} tokens (granted immediately)</span>
<span>{STORAGE_QUOTAS.ANNUAL}GB storage</span>
```

**Use in webhook:**

```typescript
import { TOKEN_GRANTS, STORAGE_QUOTAS } from '@/lib/billing/config'

// Grant tokens
await supabase.rpc('grant_trial_tokens', {
  p_user_id: userId,
  p_tokens: TOKEN_GRANTS.INTENSIVE_TRIAL,
  p_trial_period_days: 56,
})

// Set storage
await supabase
  .from('user_profiles')
  .update({ storage_quota_gb: STORAGE_QUOTAS.TRIAL })
  .eq('user_id', userId)
```

**Database functions:**
- Keep hardcoded values in SQL functions as fallback
- OR pass values from webhook as parameters

**Pros:**
- TypeScript type safety
- Centralized in code
- Easy to import anywhere
- Can be committed to git

**Cons:**
- Database functions still hardcoded (but can accept parameters)
- Requires code deploy to change

---

## 🎯 Recommended Action Plan

1. **Create config file:** `src/lib/billing/config.ts` with all constants
2. **Update UI files:** Import from config instead of hardcoding
3. **Update webhook:** Import from config for grant calls
4. **Update database functions:** Add parameters to accept custom amounts
5. **Document:** Keep this file updated with any changes

---

## 📝 Summary

### Current State: Scattered Everywhere

| Value | Database | Webhook | Pricing UI | Checkout UI |
|-------|----------|---------|------------|-------------|
| **1M (intensive)** | - | ✅ | ❌ | ❌ |
| **5M (annual)** | ✅ | calls RPC | ✅ | ✅ |
| **375k (28-day)** | ✅ | calls RPC | ✅ | ✅ |
| **100GB (annual)** | ✅ | ✅ | ✅ | ✅ |
| **25GB (trial/28-day)** | ❌ | ✅ | ✅ | ✅ |
| **3 cycle rollover** | ✅ | ❌ | ✅ | ✅ |

**Maintenance nightmare!** 🔥

### Ideal State: Single Source of Truth

All values in `src/lib/billing/config.ts`, imported everywhere.

---

**Last Updated:** November 13, 2025


