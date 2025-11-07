# Existing Token Tables in Database

## Current Structure

### 1. `token_usage` - AI Operations ✅
**Purpose:** Track AI feature usage (which features, how many tokens)

**What Goes Here:**
- Vision generation
- Chat conversations  
- Blueprint generation
- Audio/image generation
- All AI API calls

### 2. `token_transactions` - Financial Transactions ✅
**Purpose:** Track balance changes (grants, purchases, deductions)

**Current Schema:**
```sql
CREATE TABLE IF NOT EXISTS token_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_type TEXT,
    token_amount INTEGER,
    balance_before INTEGER,
    balance_after INTEGER,
    source TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**What Should Go Here:**
- Token pack purchases
- Admin grants/deductions
- Subscription grants (annual)
- Trial grants

### 3. `token_drips` - Subscription Drips ✅
**Purpose:** Track 28-day subscription token dripping with rollover

**Current Schema:**
```sql
CREATE TABLE IF NOT EXISTS token_drips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES customer_subscriptions(id) ON DELETE SET NULL,
  drip_amount INTEGER NOT NULL,
  drip_date TIMESTAMP DEFAULT NOW(),
  cycle_number INTEGER NOT NULL,
  rollover_from_previous INTEGER DEFAULT 0,
  rollover_cycles_count INTEGER DEFAULT 0,
  expired_tokens INTEGER DEFAULT 0,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  billing_period_start TIMESTAMP,
  billing_period_end TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**What Goes Here:**
- 28-day subscription token drips (375k per cycle)
- Rollover tracking
- Cycle management

## Proper Separation

| Table | Purpose | Examples |
|-------|---------|----------|
| `token_transactions` | Financial transactions | Purchases, grants, deductions |
| `token_drips` | Subscription drips | 28-day cycle tokens |
| `token_usage` | AI operations | Vision gen, chat, blueprints |

## What Needs to Be Fixed

1. ✅ **Token pack purchases** → Should go to `token_transactions` (currently going to `token_usage`)
2. ✅ **Admin grants** → Should go to `token_transactions` (currently going to `token_usage`)
3. ✅ **Subscription grants** → Should go to `token_transactions` (currently going to `token_transactions` via RPC)
4. ✅ **28-day drips** → Already going to `token_drips` ✅
5. ✅ **AI usage** → Already going to `token_usage` ✅

## Next Steps

1. Update `token_transactions` schema to include payment fields (if needed)
2. Update webhook to use `token_transactions` for purchases
3. Update admin route to use `token_transactions` for grants
4. Keep `token_drips` for subscription drips (already correct)
5. Keep `token_usage` for AI operations (already correct)

