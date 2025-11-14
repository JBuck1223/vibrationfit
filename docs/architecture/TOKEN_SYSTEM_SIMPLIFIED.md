# Token System - Simplified Architecture

**Date:** November 14, 2025  
**Status:** ✅ Implemented and Ready to Deploy

---

## 🎯 **The Simplification**

We removed the `token_balances` table entirely and moved to a much simpler system:

**Balance = SUM(unexpired grants) - SUM(usage)**

All calculated on-the-fly from two tables:
1. `token_transactions` (with new `expires_at` field)
2. `token_usage` (already existed)

---

## 📊 **Architecture**

### **Table 1: `token_transactions`**

Records all token grants and admin deductions.

| Column | Type | Purpose |
|--------|------|---------|
| `user_id` | UUID | Who received the tokens |
| `action_type` | ENUM | `subscription_grant`, `trial_grant`, `admin_grant`, `token_pack_purchase`, etc. |
| `tokens_used` | INTEGER | **Positive** for grants, **Negative** for admin deductions |
| `expires_at` | TIMESTAMPTZ | **NEW!** When tokens expire (NULL = never) |
| `subscription_id` | UUID | Link to subscription |
| `metadata` | JSONB | Additional context |
| `created_at` | TIMESTAMPTZ | When grant was issued |

**Expiration Rules:**
- Annual subscriptions: `expires_at = granted_at + 365 days`
- 28-day subscriptions: `expires_at = granted_at + 90 days` (3 cycles max rollover)
- Trial grants: `expires_at = granted_at + 56 days`
- Admin grants: `expires_at = granted_at + 365 days`
- Token pack purchases: `expires_at = NULL` (**never expire**)

### **Table 2: `token_usage`**

Records all token consumption from AI operations.

| Column | Type | Purpose |
|--------|------|---------|
| `user_id` | UUID | Who used the tokens |
| `action_type` | TEXT | `vision_generation`, `chat_conversation`, etc. |
| `tokens_used` | INTEGER | Always positive |
| `success` | BOOLEAN | Only count successful operations |
| `model_used` | TEXT | AI model (gpt-5, gpt-4o, etc.) |
| `created_at` | TIMESTAMPTZ | When tokens were used |

### **Table 3: `user_storage`**

Unchanged - tracks storage quota grants.

---

## 🔧 **How It Works**

### **1. Grant Tokens**

```typescript
// Example: Grant annual subscription
INSERT INTO token_transactions (
  user_id,
  action_type,
  tokens_used,
  expires_at,
  subscription_id
) VALUES (
  'user-uuid',
  'subscription_grant',
  5000000, -- 5M tokens
  NOW() + INTERVAL '365 days', -- Expires in 1 year
  'sub-uuid'
)
```

### **2. Use Tokens**

```typescript
// Example: User generates a vision
INSERT INTO token_usage (
  user_id,
  action_type,
  tokens_used,
  model_used,
  success
) VALUES (
  'user-uuid',
  'vision_generation',
  50000,
  'gpt-5',
  true
)
```

### **3. Get Balance (Automatic)**

```sql
CREATE FUNCTION get_user_token_balance(p_user_id UUID)
RETURNS JSONB AS $$
  DECLARE
    v_total_granted BIGINT;
    v_total_used BIGINT;
    v_active_balance BIGINT;
  BEGIN
    -- Sum unexpired grants
    SELECT COALESCE(SUM(tokens_used), 0)
    INTO v_total_granted
    FROM token_transactions
    WHERE user_id = p_user_id
      AND action_type IN ('subscription_grant', 'trial_grant', 'admin_grant', 'token_pack_purchase')
      AND tokens_used > 0
      AND (expires_at IS NULL OR expires_at > NOW()); -- Only unexpired
    
    -- Sum usage
    SELECT COALESCE(SUM(tokens_used), 0)
    INTO v_total_used
    FROM token_usage
    WHERE user_id = p_user_id
      AND success = true;
    
    -- Calculate balance
    v_active_balance := v_total_granted - v_total_used;
    
    IF v_active_balance < 0 THEN
      v_active_balance := 0;
    END IF;
    
    RETURN JSONB_BUILD_OBJECT(
      'total_active', v_active_balance,
      'total_granted', v_total_granted,
      'total_used', v_total_used
    );
  END;
$$ LANGUAGE plpgsql;
```

---

## ✅ **What We Removed**

❌ `token_balances` table (entire table deleted)  
❌ `token_drips` table (deprecated - drips tracked in `token_transactions`)  
❌ `deduct_tokens_with_fifo()` function (no longer needed)  
❌ `expire_old_token_grants()` function (expiration automatic)  
❌ Complex FIFO allocation logic  
❌ Tracking `tokens_remaining` per grant  
❌ Tracking rollover history separately  
❌ Data sync issues between tables  

---

## ✅ **What We Added**

✅ `expires_at` column to `token_transactions`  
✅ Simplified `get_user_token_balance()` function  
✅ Index on `token_transactions(user_id, expires_at)`  
✅ Automatic expiration via SQL `WHERE expires_at > NOW()`  

---

## 🎯 **Benefits**

1. **Single Source of Truth** - `token_transactions` only
2. **No Data Duplication** - Don't track `tokens_remaining` separately
3. **No Sync Issues** - Can't get out of sync with single table
4. **Simpler Code** - No complex FIFO deduction logic
5. **Easier to Reason** - Just SUM grants minus SUM usage
6. **Natural Expiration** - Oldest grants expire first automatically
7. **Matches Existing Pattern** - Already doing this for storage

---

## 📝 **Grant Functions Updated**

All grant functions now set `expires_at`:

```typescript
// grant_annual_tokens()
INSERT INTO token_transactions (..., expires_at)
VALUES (..., NOW() + INTERVAL '365 days')

// drip_tokens_28day()
INSERT INTO token_transactions (..., expires_at)
VALUES (..., NOW() + INTERVAL '90 days') -- 3 cycles

// grant_trial_tokens()
INSERT INTO token_transactions (..., expires_at)
VALUES (..., NOW() + (p_trial_period_days || ' days')::INTERVAL)
```

---

## 🔄 **Migration Plan**

1. ✅ **Migration 20251114000002_simplify_to_transactions_only.sql**
   - Drops `token_balances` table
   - Drops `deduct_tokens_with_fifo()` function
   - Adds `expires_at` to `token_transactions`
   - Backfills `expires_at` for existing grants
   - Creates simplified `get_user_token_balance()` function
   - Updates all grant functions

2. ✅ **Code Updates**
   - `src/lib/tokens/tracking.ts` - Removed FIFO deduction calls
   - `src/lib/tokens/transactions.ts` - Sets `expires_at` when recording grants
   - `src/lib/supabase/household.ts` - Removed explicit deduction calls
   - `src/app/api/tokens/route.ts` - Queries `token_transactions` instead of `token_balances`

---

## 🧪 **Testing**

After deployment, verify:

1. ✅ Check user balances: `/api/tokens`
2. ✅ Grant tokens via admin panel
3. ✅ Use AI features and verify deduction
4. ✅ Check expiration works (query `WHERE expires_at < NOW()`)
5. ✅ Verify household token sharing still works

---

## 🚀 **Deploy**

```bash
supabase migration up
```

---

## 📚 **Related Files**

- **Migration:** `/supabase/migrations/20251114000002_simplify_to_transactions_only.sql`
- **Tracking:** `/src/lib/tokens/tracking.ts`
- **Transactions:** `/src/lib/tokens/transactions.ts`
- **Household:** `/src/lib/supabase/household.ts`
- **API:** `/src/app/api/tokens/route.ts`
- **Cleanup Migration:** `/supabase/migrations/20251114000000_cleanup_user_profiles.sql` (still valid - removed fields from user_profiles)

---

**This is SO much simpler!** 🎉

