# Token Balances Data Migration Hotfix

**Date:** November 14, 2025  
**Status:** Fixed and Ready to Deploy

---

## 🐛 The Bug

The initial migration `20251114000000_cleanup_user_profiles.sql` had a critical logic error on **line 130**:

```sql
AND tt.tokens_used < 0 -- Negative means grant  ❌ WRONG!
```

### Why This Was Wrong

In the `token_transactions` table schema:
- ✅ **Grants are POSITIVE** (`tokens_used > 0`)
- ❌ **Deductions are NEGATIVE** (`tokens_used < 0`)

This is documented in `src/lib/tokens/transactions.ts`:
```typescript
tokens_used: number // Positive for grants/purchases, negative for deductions
```

### Impact

**Zero rows were migrated** from `token_transactions` to `token_balances` because the migration was looking for negative grant values when all actual grants are positive.

Result: The new `token_balances` table is empty despite users having active token grants.

---

## ✅ The Fix

### 1. Hotfix Migration Created

**File:** `supabase/migrations/20251114000001_hotfix_token_balances_data.sql`

This migration:
1. ✅ Clears the empty `token_balances` table
2. ✅ Re-runs the data migration with **corrected sign** (`tokens_used > 0`)
3. ✅ Properly calculates remaining tokens by subtracting usage
4. ✅ Sets correct expiration dates based on grant type
5. ✅ Prints summary of migrated records

### 2. Original Migration Fixed

**File:** `supabase/migrations/20251114000000_cleanup_user_profiles.sql`

Updated lines:
- **Line 95:** Removed `ABS()` since tokens are already positive
- **Line 97:** Removed `ABS()` from calculation
- **Line 130:** Changed `tokens_used < 0` to `tokens_used > 0`

This ensures future fresh deployments work correctly.

---

## 🚀 How to Deploy

Run the hotfix migration:

```bash
supabase migration up
```

This will apply migration `20251114000001_hotfix_token_balances_data.sql`.

### Expected Output

You should see a notice like:

```
Migration Complete:
  - Found 47 grant transactions
  - Created 47 token_balance records
  - Covering 23 unique users
```

*(Numbers will vary based on your actual data)*

---

## 🧪 Verification Steps

After running the migration, verify the data:

### 1. Check Token Balances Table

```sql
-- Should show records for all users with token grants
SELECT 
  user_id,
  grant_type,
  tokens_granted,
  tokens_remaining,
  expires_at,
  granted_at
FROM token_balances
ORDER BY user_id, granted_at;
```

### 2. Verify Balance Calculation

```sql
-- Test the balance function
SELECT get_user_token_balance('USER_ID_HERE');
```

Should return:
```json
{
  "total_active": 500000,
  "total_expired": 0,
  "grants": [
    {
      "grant_type": "trial",
      "tokens_remaining": 500000,
      "expires_at": "2025-01-09T..."
    }
  ]
}
```

### 3. Check User Storage

```sql
-- Should show storage quotas (this part should have worked initially)
SELECT user_id, quota_gb, granted_at
FROM user_storage
ORDER BY user_id;
```

### 4. Test in App

1. ✅ Visit `/dashboard` - Sidebar should show correct token balance
2. ✅ Visit `/api/tokens` - Should return active balance and history
3. ✅ Use any AI feature - Tokens should deduct properly with FIFO
4. ✅ Check admin panel - Token adjustments should work

---

## 📊 Migration Logic Details

### Grant Type Mapping

| `token_transactions.action_type` | `token_balances.grant_type` | Expiration |
|----------------------------------|----------------------------|------------|
| `subscription_grant` (≥5M tokens) | `annual` | 365 days |
| `subscription_grant` (<5M tokens) | `28day` | 90 days |
| `renewal_grant` (≥5M tokens) | `annual` | 365 days |
| `renewal_grant` (<5M tokens) | `28day` | 90 days |
| `trial_grant` | `trial` | 56 days |
| `token_pack_purchase` | `purchase` | Never |
| `admin_grant` | `admin` | 365 days |

### Tokens Remaining Calculation

```sql
tokens_remaining = tokens_granted - (
  SELECT SUM(tokens_used) FROM token_usage
  WHERE user_id = grant.user_id
    AND created_at >= grant.created_at
    AND success = true
    AND action_type NOT IN (grant types)
)
```

This accounts for all token usage that occurred after each grant was issued.

---

## 🔍 Root Cause Analysis

### Why Did This Happen?

1. **Assumption Error:** Initial assumption that grants in `token_transactions` were stored as negative values
2. **No Test Data:** Migration wasn't tested against actual production data
3. **Silent Failure:** The migration completed successfully but inserted 0 rows (no error raised)

### Preventions for Future

1. ✅ Always verify sign conventions in schema documentation
2. ✅ Add `RAISE NOTICE` statements to show row counts after data migrations
3. ✅ Test migrations against production-like data before deploying
4. ✅ Add assertions/checks for expected minimum row counts

---

## 📝 Files Modified

1. ✅ `supabase/migrations/20251114000000_cleanup_user_profiles.sql` - Fixed for future deployments
2. ✅ `supabase/migrations/20251114000001_hotfix_token_balances_data.sql` - Hotfix for existing deployment
3. ✅ `docs/architecture/TOKEN_MIGRATION_HOTFIX.md` - This document

---

## ✅ Status

- [x] Bug identified
- [x] Root cause analyzed
- [x] Hotfix migration created
- [x] Original migration fixed
- [ ] **Hotfix deployed to production** ← Run this next!
- [ ] Data verified in production
- [ ] App functionality tested

---

**Next Step:** Run `supabase migration up` to apply the hotfix.

