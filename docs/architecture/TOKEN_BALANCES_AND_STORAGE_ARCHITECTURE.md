# Token Balances & User Storage Architecture

**Last Updated:** November 14, 2025

## Overview

This document describes the new token and storage tracking architecture that replaces the legacy fields in `user_profiles`. The new system implements proper token expiration with FIFO consumption and separates storage quota tracking from usage calculation.

---

## Database Tables

### 1. `token_balances`

Tracks individual token grants with expiration dates. Tokens are consumed using FIFO (First-In-First-Out) logic.

**Schema:**
```sql
CREATE TABLE token_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  grant_type TEXT NOT NULL, -- 'annual', '28day', 'trial', 'purchase', 'admin'
  tokens_granted INTEGER NOT NULL,
  tokens_remaining INTEGER NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- NULL for purchases (never expire)
  subscription_id UUID REFERENCES customer_subscriptions(id),
  token_pack_id TEXT,
  metadata JSONB DEFAULT '{}'
);
```

**Key Features:**
- **FIFO Consumption:** Tokens are deducted from oldest grants first
- **Automatic Expiration:** Monthly grants expire after 90 days (3-cycle max)
- **Never-expiring Purchases:** Token pack purchases have `expires_at = NULL`
- **Rollover Tracking:** 28-day plans can accumulate up to 1.125M tokens (3 × 375k)

**Grant Types & Expiration:**
| Grant Type | Tokens | Expiration | Use Case |
|------------|--------|------------|----------|
| `annual` | 5,000,000 | 365 days | Vision Pro Annual subscription |
| `28day` | 375,000 | 90 days | Vision Pro 28-Day subscription |
| `trial` | 1,000,000 | 56 days | Intensive trial period |
| `purchase` | Varies | Never | Token pack purchases |
| `admin` | Varies | 365 days | Admin grants |

---

### 2. `user_storage`

Tracks storage quota grants only. Usage is always calculated on-the-fly from S3.

**Schema:**
```sql
CREATE TABLE user_storage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  quota_gb INTEGER NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  subscription_id UUID REFERENCES customer_subscriptions(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Features:**
- **Quota Grants Only:** No usage stored in database
- **Usage from S3:** Always calculated live via `/api/storage/usage`
- **Cumulative Quotas:** Total quota = SUM of all `quota_gb` for user
- **Audit Trail:** Complete history of storage grants

**Storage Quotas:**
| Plan Type | Quota | When Granted |
|-----------|-------|--------------|
| Trial | 25 GB | Intensive signup |
| 28-Day | 25 GB | First cycle only |
| Annual | 100 GB | Subscription start |

---

## Database Functions

### `get_user_token_balance(p_user_id UUID)`

Returns current active and expired token balances with breakdown by grant type.

**Returns:**
```typescript
{
  total_active: number,      // Sum of non-expired tokens
  total_expired: number,     // Sum of expired tokens
  grants_breakdown: Array<{  // Breakdown by grant type
    grant_type: string,
    remaining: number,
    grant_count: number
  }>
}
```

**Usage:**
```typescript
const { data } = await supabase
  .rpc('get_user_token_balance', { p_user_id: userId })
  .single()

console.log('Active tokens:', data.total_active)
console.log('Expired tokens:', data.total_expired)
```

---

### `deduct_tokens_with_fifo(p_user_id UUID, p_tokens_to_deduct INTEGER)`

Deducts tokens using FIFO logic (oldest grants first), automatically skipping expired grants.

**Returns:**
```typescript
{
  success: boolean,
  tokens_deducted: number,
  tokens_remaining_to_deduct: number,
  deducted_from: Array<{
    grant_id: UUID,
    grant_type: string,
    granted_at: timestamp,
    deducted: number
  }>
}
```

**Logic:**
1. Lock user's active grants (ORDER BY granted_at ASC)
2. Skip expired grants
3. Deduct from oldest grant first
4. Continue until all tokens deducted or grants exhausted

**Example:**
```sql
-- User has 3 grants:
-- Grant A: 200k tokens (oldest)
-- Grant B: 300k tokens
-- Grant C: 500k tokens

-- Deduct 450k tokens:
SELECT deduct_tokens_with_fifo('user-id', 450000);

-- Result:
-- Grant A: 0 tokens (fully consumed)
-- Grant B: 50k tokens (partially consumed)
-- Grant C: 500k tokens (untouched)
```

---

### `get_user_storage_quota(p_user_id UUID)`

Returns total storage quota for user (sum of all grants).

**Returns:**
```typescript
{
  total_quota_gb: number
}
```

**Usage:**
```typescript
const { data } = await supabase
  .rpc('get_user_storage_quota', { p_user_id: userId })
  .single()

console.log('Storage quota:', data.total_quota_gb, 'GB')
```

---

### `expire_old_token_grants()`

Background job function to mark expired token grants. Should be run via cron job.

**Returns:** Count of grants expired

**Cron Schedule:** Every hour
```sql
-- Sets tokens_remaining = 0 for expired grants
SELECT expire_old_token_grants();
```

---

## Token Grant Functions

### `grant_annual_tokens(p_user_id UUID, p_subscription_id UUID)`

Grants 5M tokens + 100GB storage for annual subscriptions.

**What it does:**
1. Inserts into `token_balances` with 365-day expiration
2. Inserts into `user_storage` with 100GB quota
3. Records in `token_transactions` for audit trail

### `drip_tokens_28day(p_user_id UUID, p_subscription_id UUID, p_cycle_number INTEGER)`

Drips 375k tokens for 28-day subscriptions with 3-cycle max rollover.

**Rollover Logic:**
```typescript
Current balance: 900k
New drip: 375k
Max rollover: 1,125k (3 × 375k)

// Check if new drip would exceed max
if (900k + 375k > 1,125k) {
  grant = 1,125k - 900k = 225k  // Cap at max
} else {
  grant = 375k  // Full amount
}
```

**What it does:**
1. Checks current active balance
2. Caps grant if it would exceed 1.125M
3. Inserts into `token_balances` with 90-day expiration
4. Grants 25GB storage on first cycle only
5. Records in `token_transactions` for audit trail

### `grant_trial_tokens(p_user_id UUID, p_subscription_id UUID, p_tokens INTEGER, p_trial_period_days INTEGER)`

Grants trial tokens with custom expiration period.

**What it does:**
1. Inserts into `token_balances` with custom expiration
2. Inserts into `user_storage` with 25GB quota
3. Records in `token_transactions` for audit trail

---

## Migration from Legacy System

### Removed Fields from `user_profiles`

The following fields have been removed and replaced:

| Old Field | Replacement | Notes |
|-----------|-------------|-------|
| `vibe_assistant_tokens_remaining` | `get_user_token_balance()` | Now computed from `token_balances` |
| `vibe_assistant_tokens_used` | Sum from `token_usage` | Historical usage tracking |
| `vibe_assistant_total_cost` | Sum from `token_usage.cost_estimate` | Cost tracking |
| `token_rollover_cycles` | Implicit in expiration dates | 90-day expiration = 3 cycles |
| `token_last_drip_date` | `token_balances.granted_at` | Per-grant timestamp |
| `storage_quota_gb` | `get_user_storage_quota()` | Now computed from `user_storage` |
| `auto_topup_enabled` | (removed) | Feature never implemented |
| `auto_topup_pack_id` | (removed) | Feature never implemented |
| `membership_tier_id` | `customer_subscriptions.membership_tier_id` | Use subscriptions table |

### Data Migration

The migration `20251114000000_cleanup_user_profiles.sql` automatically:
1. Creates `token_balances` and `user_storage` tables
2. Migrates existing token grants from `token_transactions`
3. Migrates existing storage quotas from `user_profiles`
4. Drops deprecated columns
5. Creates helper functions

---

## Integration Points

### Updated Files

**Database Functions:**
- `/supabase/migrations/20251114000000_cleanup_user_profiles.sql`

**Token Tracking:**
- `/src/lib/tokens/tracking.ts` - Now uses `get_user_token_balance()` and `deduct_tokens_with_fifo()`
- `/src/lib/tokens/transactions.ts` - Inserts into `token_balances` for grants

**API Routes:**
- `/src/app/api/tokens/route.ts` - Uses `get_user_token_balance()`
- `/src/app/api/admin/users/adjust-tokens/route.ts` - Uses `token_balances`
- `/src/app/api/admin/users/adjust-storage/route.ts` - Inserts into `user_storage`
- `/src/app/api/stripe/webhook/route.ts` - Storage grants via `user_storage`

**Household System:**
- `/src/lib/supabase/household.ts` - Updated `deductTokens()` to use new functions

**UI Components:**
- `/src/components/Sidebar.tsx` - Fetches balance from `get_user_token_balance()`

---

## Token Expiration Examples

### Example 1: 28-Day Plan with Rollover

```
Day 1:   Grant 375k (expires Day 90)  → Balance: 375k
Day 29:  Grant 375k (expires Day 118) → Balance: 750k
Day 57:  Grant 375k (expires Day 146) → Balance: 1,125k (max)
Day 85:  Grant capped at 0 (already at max) → Balance: 1,125k
Day 91:  First grant expires → Balance: 750k
Day 113: Grant 375k (expires Day 202) → Balance: 1,125k
```

### Example 2: Token Pack Purchase (Never Expires)

```
User has:
- Trial grant: 500k tokens (expires in 30 days)
- Token pack: 1M tokens (never expires)

Usage: Deduct 700k tokens via FIFO
Result:
- Trial grant: 0 tokens (fully consumed)
- Token pack: 800k tokens remaining
```

### Example 3: Annual Subscription

```
Purchase date: Jan 1, 2025
Grant: 5M tokens (expires Jan 1, 2026)

User consumes 3M tokens by June
Balance: 2M tokens

Renewal date: Jan 1, 2026
- Old grant expires (2M tokens lost)
- New grant: 5M tokens (expires Jan 1, 2027)
- Balance resets to 5M
```

---

## Best Practices

### For Developers

1. **Never query `user_profiles` for token balances** - Use `get_user_token_balance()` instead
2. **Never manually update `token_balances`** - Use `deduct_tokens_with_fifo()` for deductions
3. **Always use grant functions** - `grant_annual_tokens()`, `drip_tokens_28day()`, etc.
4. **Storage usage is dynamic** - Always calculate from S3, never store in database
5. **Test token expiration** - Verify 28-day plans cap at 1.125M tokens

### For Operations

1. **Run expiration job hourly** - `SELECT expire_old_token_grants();`
2. **Monitor token grants** - Check `token_balances` for unusual patterns
3. **Audit storage quotas** - Compare `user_storage` sum vs actual S3 usage
4. **Review expired tokens** - Users with high expired balances may need education

### For Support

1. **Check active balance** - `SELECT get_user_token_balance('user-id');`
2. **View grant history** - `SELECT * FROM token_balances WHERE user_id = 'user-id';`
3. **Check storage quota** - `SELECT get_user_storage_quota('user-id');`
4. **Manual grants** - Use admin API routes (automatically use new system)

---

## Performance Considerations

### Indexes

```sql
-- Critical indexes for performance
CREATE INDEX idx_token_balances_user_active 
  ON token_balances(user_id, granted_at ASC) 
  WHERE tokens_remaining > 0 AND (expires_at IS NULL OR expires_at > NOW());

CREATE INDEX idx_token_balances_expiration 
  ON token_balances(expires_at) 
  WHERE expires_at IS NOT NULL AND tokens_remaining > 0;

CREATE INDEX idx_user_storage_user_id 
  ON user_storage(user_id);
```

### Query Optimization

- `get_user_token_balance()` is fast (single table scan with WHERE clause)
- `deduct_tokens_with_fifo()` uses row-level locking for concurrency safety
- Storage quota lookup is O(n) where n = number of grants (typically < 10)

---

## Future Enhancements

### Potential Improvements

1. **Token expiration notifications** - Email users 7 days before tokens expire
2. **Token rollover insights** - Show users their rollover potential
3. **Storage usage alerts** - Notify when approaching quota
4. **Token usage analytics** - Track which features consume most tokens
5. **Household token pooling** - Already implemented via household system

### Technical Debt

1. **Clean up old token_usage records** - Archive records older than 2 years
2. **Optimize FIFO deduction** - Consider materialized view for active grants
3. **Storage calculation caching** - Cache S3 usage for 1 hour to reduce API calls

---

## Support & Troubleshooting

### Common Issues

**Issue:** User shows 0 tokens but should have balance
- **Check:** `SELECT * FROM token_balances WHERE user_id = 'user-id';`
- **Fix:** Verify grants exist and haven't expired

**Issue:** 28-day user not getting full 375k tokens
- **Cause:** Rollover cap at 1.125M
- **Expected:** System is working correctly

**Issue:** Storage quota incorrect
- **Check:** `SELECT SUM(quota_gb) FROM user_storage WHERE user_id = 'user-id';`
- **Fix:** Verify all subscription grants were recorded

### Debug Queries

```sql
-- Check user's token situation
SELECT 
  user_id,
  grant_type,
  tokens_granted,
  tokens_remaining,
  granted_at,
  expires_at,
  CASE 
    WHEN expires_at IS NULL THEN 'Never expires'
    WHEN expires_at > NOW() THEN 'Active'
    ELSE 'Expired'
  END as status
FROM token_balances
WHERE user_id = 'user-id'
ORDER BY granted_at ASC;

-- Check storage grants
SELECT 
  user_id,
  quota_gb,
  granted_at,
  subscription_id
FROM user_storage
WHERE user_id = 'user-id'
ORDER BY granted_at DESC;

-- Check token usage (for cost tracking)
SELECT 
  action_type,
  COUNT(*) as count,
  SUM(tokens_used) as total_tokens,
  SUM(cost_estimate) / 100 as total_cost_usd
FROM token_usage
WHERE user_id = 'user-id'
GROUP BY action_type
ORDER BY total_tokens DESC;
```

---

## Conclusion

The new `token_balances` and `user_storage` architecture provides:
- ✅ Proper token expiration with FIFO consumption
- ✅ Automatic rollover management for 28-day plans
- ✅ Separation of storage quota from usage
- ✅ Complete audit trail for all grants
- ✅ Better performance with indexed queries
- ✅ Easier debugging and support

This system replaces the unreliable token fields in `user_profiles` with a robust, scalable solution that properly handles token lifecycle from grant to expiration.

