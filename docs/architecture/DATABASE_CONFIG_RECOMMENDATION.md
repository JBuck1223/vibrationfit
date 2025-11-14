# Database Configuration Table - Recommendation

**Date:** November 13, 2025  
**Status:** Recommended Approach  
**Priority:** High (prevents config drift)

---

## 🎯 The Problem

Currently, token and storage values exist in **two places**:

1. **TypeScript Config** (`src/lib/billing/config.ts`) - For UI display
2. **Database Functions** (`grant_annual_tokens`, `drip_tokens_28day`) - For actual grants

**Risk:** These can get out of sync, causing bugs where:
- UI shows "5M tokens"
- Backend grants 4M tokens
- Customer gets confused/angry 😡

---

## ✅ Solution: Single Database Table

Create one `billing_config` table that's the source of truth for everything.

---

## 📊 Proposed Schema

```sql
-- ============================================================================
-- BILLING CONFIGURATION TABLE
-- Single source of truth for all token, storage, and pricing values
-- ============================================================================

CREATE TABLE IF NOT EXISTS billing_config (
  key TEXT PRIMARY KEY,
  category TEXT NOT NULL, -- 'tokens', 'storage', 'pricing', 'limits'
  value_int BIGINT,
  value_decimal NUMERIC(10,2),
  value_text TEXT,
  value_json JSONB,
  description TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT -- Track who changed it
);

-- Create index for category lookups
CREATE INDEX IF NOT EXISTS idx_billing_config_category 
  ON billing_config(category);

-- Add trigger to update timestamp
CREATE OR REPLACE FUNCTION update_billing_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER billing_config_updated
  BEFORE UPDATE ON billing_config
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_config_timestamp();

-- ============================================================================
-- INSERT DEFAULT VALUES
-- ============================================================================

INSERT INTO billing_config (key, category, value_int, description) VALUES
-- Token Grants
('token_intensive_trial', 'tokens', 1000000, 'Tokens granted during 72-hour intensive trial (56 days)'),
('token_annual', 'tokens', 5000000, 'Tokens granted on annual subscription (reset yearly)'),
('token_monthly_28day', 'tokens', 375000, 'Tokens dripped every 28 days'),
('token_household_28day', 'tokens', 750000, 'Tokens for household 28-day plan (2 seats)'),
('token_household_annual', 'tokens', 5000000, 'Tokens for household annual plan (2 seats)'),
('token_addon_member', 'tokens', 100000, 'Tokens per add-on member per month'),

-- Storage Quotas (in GB)
('storage_trial', 'storage', 25, 'Storage quota for trial users'),
('storage_monthly_28day', 'storage', 25, 'Storage quota for 28-day plan'),
('storage_annual', 'storage', 100, 'Storage quota for annual plan'),
('storage_household', 'storage', 100, 'Storage quota for household plans'),
('storage_default', 'storage', 100, 'Default storage quota'),

-- Rollover Limits
('rollover_max_cycles', 'limits', 3, 'Maximum number of 28-day cycles tokens can roll over'),
('household_max_members', 'limits', 6, 'Maximum total household members'),
('household_included_seats', 'limits', 2, 'Number of seats included in household plan'),
('household_max_addons', 'limits', 4, 'Maximum add-on members for household'),

-- Pricing (in cents)
('price_intensive', 'pricing', 49900, 'Intensive purchase price ($499)'),
('price_intensive_2pay', 'pricing', 24950, 'Intensive 2-payment price ($249.50)'),
('price_intensive_3pay', 'pricing', 16633, 'Intensive 3-payment price ($166.33)'),
('price_solo_annual', 'pricing', 99900, 'Solo annual price ($999)'),
('price_solo_28day', 'pricing', 9900, 'Solo 28-day price ($99)'),
('price_household_intensive', 'pricing', 69900, 'Household intensive price ($699)'),
('price_household_28day', 'pricing', 14900, 'Household 28-day price ($149)'),
('price_addon_28day', 'pricing', 1900, 'Add-on member 28-day price ($19)'),
('price_addon_annual', 'pricing', 19200, 'Add-on member annual price ($192)')

ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- HELPER FUNCTIONS TO GET CONFIG VALUES
-- ============================================================================

-- Get integer config value
CREATE OR REPLACE FUNCTION get_config_int(config_key TEXT)
RETURNS BIGINT AS $$
DECLARE
  result BIGINT;
BEGIN
  SELECT value_int INTO result
  FROM billing_config
  WHERE key = config_key;
  
  IF result IS NULL THEN
    RAISE EXCEPTION 'Config key % not found or not an integer', config_key;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get all config values as JSON (for frontend)
CREATE OR REPLACE FUNCTION get_all_billing_config()
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT jsonb_object_agg(key, 
      CASE 
        WHEN value_int IS NOT NULL THEN to_jsonb(value_int)
        WHEN value_decimal IS NOT NULL THEN to_jsonb(value_decimal)
        WHEN value_text IS NOT NULL THEN to_jsonb(value_text)
        WHEN value_json IS NOT NULL THEN value_json
        ELSE 'null'::jsonb
      END
    )
    FROM billing_config
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Get config by category (useful for frontend)
CREATE OR REPLACE FUNCTION get_billing_config_by_category(cat TEXT)
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT jsonb_object_agg(key, 
      CASE 
        WHEN value_int IS NOT NULL THEN to_jsonb(value_int)
        WHEN value_decimal IS NOT NULL THEN to_jsonb(value_decimal)
        WHEN value_text IS NOT NULL THEN to_jsonb(value_text)
        WHEN value_json IS NOT NULL THEN value_json
        ELSE 'null'::jsonb
      END
    )
    FROM billing_config
    WHERE category = cat
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE billing_config ENABLE ROW LEVEL SECURITY;

-- Everyone can read config (needed for pricing display)
CREATE POLICY "Billing config is readable by everyone"
  ON billing_config
  FOR SELECT
  USING (true);

-- Only service role can modify config
CREATE POLICY "Only service role can modify billing config"
  ON billing_config
  FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON TABLE billing_config IS 'Single source of truth for all billing configuration values';
```

---

## 🔧 Updated Database Functions

Now your token grant functions read from the table:

```sql
-- ============================================================================
-- GRANT ANNUAL TOKENS (Updated to use config table)
-- ============================================================================

CREATE OR REPLACE FUNCTION grant_annual_tokens(
  p_user_id UUID,
  p_subscription_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_current_balance INTEGER;
  v_grant_amount INTEGER;
  v_storage_quota INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Get token amount from config table
  v_grant_amount := get_config_int('token_annual');
  v_storage_quota := get_config_int('storage_annual');
  
  -- Get current balance
  SELECT COALESCE(vibe_assistant_tokens_remaining, 0)
  INTO v_current_balance
  FROM user_profiles
  WHERE user_id = p_user_id;
  
  -- Annual resets (doesn't add to existing)
  v_new_balance := v_grant_amount;
  
  -- Update user profile
  UPDATE user_profiles
  SET 
    vibe_assistant_tokens_remaining = v_new_balance,
    token_rollover_cycles = 0,
    token_last_drip_date = NOW(),
    storage_quota_gb = v_storage_quota
  WHERE user_id = p_user_id;
  
  -- Record transaction
  INSERT INTO token_transactions (
    user_id,
    token_amount,
    balance_before,
    balance_after,
    created_at
  ) VALUES (
    p_user_id,
    v_grant_amount,
    v_current_balance,
    v_new_balance,
    NOW()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'tokens_granted', v_grant_amount,
    'new_balance', v_new_balance,
    'storage_quota_gb', v_storage_quota
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DRIP 28-DAY TOKENS (Updated to use config table)
-- ============================================================================

CREATE OR REPLACE FUNCTION drip_tokens_28day(
  p_user_id UUID,
  p_subscription_id UUID,
  p_cycle_number INTEGER DEFAULT 1
) RETURNS JSONB AS $$
DECLARE
  v_current_balance INTEGER;
  v_drip_amount INTEGER;
  v_max_rollover_cycles INTEGER;
  v_rollover_cycles INTEGER;
  v_rollover_amount INTEGER := 0;
  v_expired_tokens INTEGER := 0;
  v_new_balance INTEGER;
BEGIN
  -- Get values from config table
  v_drip_amount := get_config_int('token_monthly_28day');
  v_max_rollover_cycles := get_config_int('rollover_max_cycles');
  
  -- Get current balance and rollover count
  SELECT 
    COALESCE(vibe_assistant_tokens_remaining, 0),
    COALESCE(token_rollover_cycles, 0)
  INTO v_current_balance, v_rollover_cycles
  FROM user_profiles
  WHERE user_id = p_user_id;
  
  -- Rollover logic
  IF v_current_balance > 0 THEN
    v_rollover_amount := v_current_balance;
    v_rollover_cycles := v_rollover_cycles + 1;
    
    IF v_rollover_cycles > v_max_rollover_cycles THEN
      v_expired_tokens := v_current_balance;
      v_rollover_amount := 0;
      v_rollover_cycles := 0;
    END IF;
  ELSE
    v_rollover_cycles := 0;
  END IF;
  
  v_new_balance := (v_rollover_amount + v_drip_amount);
  
  UPDATE user_profiles
  SET 
    vibe_assistant_tokens_remaining = v_new_balance,
    token_rollover_cycles = v_rollover_cycles,
    token_last_drip_date = NOW()
  WHERE user_id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'tokens_dripped', v_drip_amount,
    'tokens_rolled_over', v_rollover_amount,
    'tokens_expired', v_expired_tokens,
    'new_balance', v_new_balance,
    'rollover_cycle', v_rollover_cycles
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🎨 Updated Frontend API

Create an API route to fetch config:

```typescript
// src/app/api/billing/config/route.ts

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  
  // Get all billing config
  const { data, error } = await supabase
    .rpc('get_all_billing_config')
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ config: data })
}
```

---

## 🔄 Updated TypeScript Config

Now your config file fetches from the database:

```typescript
// src/lib/billing/config.ts

// This becomes a runtime fetch instead of compile-time constants
let configCache: any = null
let cacheTime: number = 0
const CACHE_DURATION = 60 * 1000 // 1 minute

export async function getBillingConfig() {
  const now = Date.now()
  
  // Return cached if fresh
  if (configCache && (now - cacheTime) < CACHE_DURATION) {
    return configCache
  }
  
  // Fetch from database
  const response = await fetch('/api/billing/config')
  const { config } = await response.json()
  
  configCache = config
  cacheTime = now
  
  return config
}

// For server-side use (direct database access)
export async function getBillingConfigServer() {
  const supabase = await createClient()
  const { data } = await supabase.rpc('get_all_billing_config')
  return data
}

// Helper functions remain the same
export function formatTokens(amount: number): string {
  return amount.toLocaleString()
}

export function formatTokensShort(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)}M`
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(amount % 1_000 === 0 ? 0 : 1)}k`
  }
  return amount.toString()
}
```

---

## 📱 Updated Home Page Usage

```tsx
// src/app/page.tsx

export default async function HomePage() {
  // Fetch config server-side
  const config = await getBillingConfigServer()
  
  return (
    <div id="pricing">
      <h2>Vision Pro Annual</h2>
      <p>{formatTokensShort(config.token_annual)} tokens/year</p>
      <p>{config.storage_annual}GB storage</p>
      
      <h2>Vision Pro 28-Day</h2>
      <p>{formatTokensShort(config.token_monthly_28day)} tokens per cycle</p>
      <p>{config.storage_monthly_28day}GB storage</p>
      <p>Rollover up to {config.rollover_max_cycles} cycles</p>
    </div>
  )
}
```

---

## 🎯 Benefits of Database Approach

### 1. **True Single Source of Truth**
```
Database Table
  ↓
├─ Database Functions (read from table)
├─ Webhook (reads from table via functions)
├─ Frontend API (queries table)
└─ Admin UI (updates table)
```

### 2. **No Deploy Required to Change Prices**
```sql
-- Change annual tokens from 5M to 6M
UPDATE billing_config
SET value_int = 6000000
WHERE key = 'token_annual';

-- Done! Takes effect immediately
```

### 3. **Guaranteed Consistency**
- Database enforces single value
- Impossible for UI and backend to differ
- Changes propagate instantly

### 4. **Audit Trail**
```sql
-- Add audit log (optional enhancement)
CREATE TABLE billing_config_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  changed_by TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5. **Admin UI Friendly**
Create an admin page at `/admin/billing-config`:

```tsx
// Easy to build CRUD interface
const configs = await supabase.from('billing_config').select('*')

configs.map(config => (
  <div>
    <label>{config.description}</label>
    <input 
      value={config.value_int}
      onChange={(e) => updateConfig(config.key, e.target.value)}
    />
  </div>
))
```

---

## ⚖️ Comparison

| Approach | Source of Truth | Deploy to Change | Can Drift? | Complexity |
|----------|----------------|------------------|------------|------------|
| **Current (TypeScript + SQL)** | Two places | Yes | ⚠️ Yes | Low |
| **Database Table** | One place | No | ✅ No | Medium |

---

## 🚀 Migration Path

### Phase 1: Create Table (Low Risk)
1. Run migration to create `billing_config` table
2. Insert current values
3. Test queries

### Phase 2: Update Database Functions (Medium Risk)
1. Modify `grant_annual_tokens()` to use `get_config_int()`
2. Modify `drip_tokens_28day()` to use `get_config_int()`
3. Test token grants in staging

### Phase 3: Update Frontend (Low Risk)
1. Create `/api/billing/config` endpoint
2. Update home page to fetch from API
3. Add caching layer

### Phase 4: Admin UI (Optional)
1. Create `/admin/billing-config` page
2. Add update functionality
3. Add permission checks

---

## ✅ Recommendation

**Yes, move to database table!**

### Why:
1. ✅ Eliminates risk of config drift
2. ✅ Easier to maintain long-term
3. ✅ Enables admin UI (no SQL required)
4. ✅ Better for A/B testing different plans
5. ✅ Can track changes over time

### When:
- **Now:** If you're about to add household plans
- **Soon:** If you plan to change pricing often
- **Later:** If current setup is working fine

### Effort:
- **Migration:** 1-2 hours
- **Function updates:** 2-3 hours
- **Frontend changes:** 1-2 hours
- **Total:** ~1 day of work

---

## 📝 Summary

**Current State:**
- Values in TypeScript + SQL functions
- Risk of inconsistency
- Requires code deploy to change

**Recommended State:**
- Values in database table
- Single source of truth
- Update via SQL or admin UI
- No deploys needed

**Next Step:**
Create the migration file and I'll help you implement it! 🚀

---

**Last Updated:** November 13, 2025  
**Status:** Recommended for implementation


