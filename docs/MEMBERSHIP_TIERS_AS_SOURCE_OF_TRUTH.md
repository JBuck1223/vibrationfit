# Membership Tiers as Single Source of Truth

**Date:** November 15, 2025  
**Status:** ✅ Implemented  
**Migration:** `20251115000002_upgrade_membership_tiers.sql`

---

## 🎯 Overview

The `membership_tiers` table is now the **single source of truth** for all billing configuration, token grants, storage quotas, and plan features.

No more scattered config files or hardcoded values!

---

## 📊 Database Structure

### `membership_tiers` Table

| Field | Type | Description |
|-------|------|-------------|
| **Identity** |
| `id` | UUID | Primary key |
| `name` | TEXT | Display name ("Vision Pro Annual") |
| `tier_type` | ENUM | Internal identifier |
| `description` | TEXT | Plan description |
| **Tokens** |
| `annual_token_grant` | INTEGER | Tokens granted annually (0 if monthly) |
| `monthly_token_grant` | INTEGER | Tokens dripped per 28 days (0 if annual) |
| `viva_tokens_monthly` | INTEGER | Display value for monthly tokens |
| `rollover_max_cycles` | INTEGER | Max cycles tokens can roll (NULL = no rollover) |
| **Storage & Seats** |
| `storage_quota_gb` | INTEGER | Storage quota in GB |
| `included_seats` | INTEGER | Number of seats (1 for solo, 2+ for household) |
| `max_household_members` | INTEGER | Max members (NULL = solo, 6 = household) |
| **Pricing** |
| `price_monthly` | INTEGER | Price in cents (e.g., 9900 = $99) |
| `price_yearly` | INTEGER | Annual price in cents |
| `billing_interval` | TEXT | 'month', 'year', or 'one-time' |
| **Stripe** |
| `stripe_product_id` | TEXT | Stripe product ID |
| `stripe_price_id` | TEXT | Stripe price ID (UNIQUE) |
| **Metadata** |
| `plan_category` | TEXT | 'subscription', 'intensive', or 'addon' |
| `is_household_plan` | BOOLEAN | Household vs solo plan |
| `features` | JSONB | Array of feature strings |
| `is_active` | BOOLEAN | Active/visible plan |
| `is_popular` | BOOLEAN | Show "Most Popular" badge |
| `display_order` | INTEGER | Sort order on pricing page |

---

## 📋 Seeded Plans (8 Total)

### Solo Plans (2)
1. **Vision Pro Annual** - $999/year, 5M tokens, 100GB
2. **Vision Pro 28-Day** - $99/28-days, 375k tokens, 25GB ⭐ Most Popular

### Household Plans (2)
3. **Vision Pro Household Annual** - $999/year, 5M tokens (shared), 100GB, 2 seats
4. **Vision Pro Household 28-Day** - $149/28-days, 750k tokens, 100GB, 2 seats

### Add-on Plans (2)
5. **Household Add-on (28-Day)** - $19/28-days, 100k tokens per member
6. **Household Add-on (Annual)** - $192/year, 1.2M tokens per member

### Intensive Plans (2)
7. **Intensive Program** - $499 one-time, 1M trial tokens (56 days)
8. **Intensive Household** - $699 one-time, 2M trial tokens (56 days)

---

## 🔧 How To Use

### 1. Database Functions (Read from table)

```sql
-- Example: Grant tokens based on tier
CREATE FUNCTION grant_tokens_for_tier(p_user_id UUID, p_tier_id UUID) AS $$
DECLARE
  v_tier membership_tiers;
BEGIN
  -- Get tier configuration
  SELECT * INTO v_tier
  FROM membership_tiers
  WHERE id = p_tier_id;
  
  -- Grant tokens based on billing_interval
  IF v_tier.billing_interval = 'year' THEN
    -- Grant annual tokens
    INSERT INTO token_transactions (user_id, tokens_used, ...)
    VALUES (p_user_id, -v_tier.annual_token_grant, ...);
  ELSE
    -- Grant monthly tokens
    INSERT INTO token_transactions (user_id, tokens_used, ...)
    VALUES (p_user_id, -v_tier.monthly_token_grant, ...);
  END IF;
END;
$$;
```

### 2. Stripe Webhook (Look up by price ID)

```typescript
// src/app/api/stripe/webhook/route.ts

// Get tier from Stripe price ID
const { data: tier, error } = await supabase
  .from('membership_tiers')
  .select('*')
  .eq('stripe_price_id', subscription.items.data[0].price.id)
  .single()

if (!tier) {
  throw new Error(`No tier found for price ${priceId}`)
}

// Use tier values
await grantTokens(userId, tier.annual_token_grant || tier.monthly_token_grant)
await setStorageQuota(userId, tier.storage_quota_gb)
```

### 3. Frontend (Fetch for pricing page)

```typescript
// src/app/page.tsx

const { data: tiers } = await supabase
  .from('membership_tiers')
  .select('*')
  .eq('is_active', true)
  .eq('plan_category', 'subscription')
  .order('display_order')

return (
  <div id="pricing">
    {tiers.map(tier => (
      <PricingCard
        name={tier.name}
        price={tier.price_monthly || tier.price_yearly}
        tokens={tier.annual_token_grant || tier.monthly_token_grant}
        storage={tier.storage_quota_gb}
        features={tier.features}
        isPopular={tier.is_popular}
      />
    ))}
  </div>
)
```

### 4. API Routes (Fetch tier config)

```typescript
// src/app/api/subscriptions/current/route.ts

const { data: subscription } = await supabase
  .from('customer_subscriptions')
  .select(`
    *,
    tier:membership_tiers(*)
  `)
  .eq('user_id', user.id)
  .eq('status', 'active')
  .single()

return NextResponse.json({
  subscription,
  tokens: subscription.tier.annual_token_grant,
  storage: subscription.tier.storage_quota_gb,
  seats: subscription.tier.included_seats
})
```

---

## 🎨 Helper Functions

### `get_tier_by_stripe_price_id(price_id)`
Returns tier matching the Stripe price ID (used in webhooks).

### `get_tier_config(tier_id)`
Returns tier configuration as JSONB for API responses.

```sql
SELECT get_tier_config('tier-uuid');

-- Returns:
{
  "id": "...",
  "name": "Vision Pro Annual",
  "tokens": 5000000,
  "storage_gb": 100,
  "seats": 1,
  "is_household": false,
  ...
}
```

---

## 🔄 Updating Values

### To change token amounts:

```sql
-- Change annual tokens from 5M to 6M
UPDATE membership_tiers
SET annual_token_grant = 6000000
WHERE tier_type = 'vision_pro_annual';

-- Done! All code now uses 6M tokens
```

### To change pricing:

```sql
-- Change 28-day plan from $99 to $89
UPDATE membership_tiers
SET price_monthly = 8900
WHERE tier_type = 'vision_pro_28day';
```

### To add a new plan:

```sql
INSERT INTO membership_tiers (
  name,
  tier_type,
  annual_token_grant,
  storage_quota_gb,
  price_yearly,
  features,
  ...
) VALUES (
  'Vision Pro Premium',
  'vision_pro_premium',
  10000000,
  250,
  199900,
  '["10M tokens", "250GB storage", "White glove support"]'::jsonb,
  ...
);
```

---

## ✅ Benefits

1. **Single Source of Truth** - One place to update all values
2. **No Code Deploys** - Change pricing/tokens via SQL only
3. **Natural Relationships** - Join with subscriptions, users, etc.
4. **Easy Querying** - Filter by category, active status, household, etc.
5. **Admin UI Ready** - Can build UI to edit tiers without touching code
6. **Version Control** - Database migrations track all changes
7. **Type Safe** - TypeScript types generated from database schema

---

## 🚀 Migration Path

### Phase 1: ✅ Database (DONE)
- Migration creates upgraded `membership_tiers` table
- Seeds all 8 plans with correct values
- Creates helper functions

### Phase 2: ⚠️ Update Functions (TODO)
- Update `grant_annual_tokens()` to read from `membership_tiers`
- Update `drip_tokens_28day()` to read from `membership_tiers`
- Update `grant_trial_tokens()` to read from `membership_tiers`

### Phase 3: ⚠️ Update Webhook (TODO)
- Update Stripe webhook to look up tier by `stripe_price_id`
- Use tier values for token/storage grants

### Phase 4: ⚠️ Update Frontend (TODO)
- Update pricing page to fetch from `membership_tiers`
- Update dashboard to show tier info from table
- Remove hardcoded values from TypeScript config

### Phase 5: 🎯 Admin UI (FUTURE)
- Create `/admin/membership-tiers` page
- CRUD interface for managing plans
- Preview pricing page changes

---

## 📝 Summary

**Before:**
```
TypeScript config → 5,000,000 tokens
Database function → 5000000 tokens (hardcoded)
UI component → 5_000_000 tokens (hardcoded)
```
❌ Three places to update = risk of drift

**After:**
```
membership_tiers table → 5000000 tokens
  ↓
├─ Database functions (SELECT from table)
├─ Stripe webhook (SELECT from table)
├─ Frontend API (SELECT from table)
└─ Admin UI (UPDATE table)
```
✅ One place to update = guaranteed consistency

---

**Next Step:** Run the migration and update database functions! 🚀

```bash
# Run migration
supabase db push

# Verify seeded data
SELECT name, annual_token_grant, monthly_token_grant, price_monthly, price_yearly
FROM membership_tiers
ORDER BY display_order;
```





