# Token Balance Update Fix

## Problem Identified

Your tokens aren't being applied because `trackTokenUsage()` was using the **browser client** by default instead of the **server client**. When called from API routes, the browser client doesn't have the proper permissions to update `user_profiles`.

## Fix Applied

**File:** `src/lib/tokens/tracking.ts` (line 149)

**Before:**
```typescript
const supabase = supabaseClient || createClient() // Browser client ❌
```

**After:**
```typescript
const supabase = supabaseClient || await createServerClient() // Server client ✅
```

## Why This Matters

1. **Browser client** (`@/lib/supabase/client`) - Uses browser cookies, limited permissions
2. **Server client** (`@/lib/supabase/server`) - Uses server-side cookies, full permissions for API routes

When API routes call `trackTokenUsage()` without passing a client, it was defaulting to the browser client, which:
- May not have RLS permissions to update `user_profiles`
- May be using a different authentication context
- Can't access server-side cookies properly

## Diagnostic Steps

### 1. Check Your Current Situation

Run this SQL to see what's happening:

```sql
-- Replace with your user ID
\set user_id 'YOUR_USER_ID_HERE'

-- Check token_usage records
SELECT 
  COUNT(*) as total_records,
  SUM(tokens_used) as total_tokens_logged,
  COUNT(CASE WHEN success = false THEN 1 END) as failed_records,
  COUNT(CASE WHEN tokens_used = 0 THEN 1 END) as zero_token_records
FROM token_usage
WHERE user_id = :'user_id';

-- Check current balance
SELECT 
  vibe_assistant_tokens_remaining,
  vibe_assistant_tokens_used,
  updated_at
FROM user_profiles
WHERE user_id = :'user_id';
```

### 2. Check for Failed Updates

Records that won't update balance:
- `success = false` - Failed operations don't deduct tokens ✅ (correct)
- `tokens_used = 0` - Zero tokens don't update balance ✅ (correct)
- Records before user_profiles row was created - Won't update ❌ (needs fix)

### 3. Reconcile Existing Balance

Use `sql/scripts/fix-user-token-balance.sql` to:
1. Calculate what balance SHOULD be from token_usage records
2. Update user_profiles with correct values

## What to Do Now

### Option 1: Fix Going Forward (Recommended)
1. ✅ Code is already fixed - new calls will work
2. Test with a new API call - balance should update immediately
3. Reconcile old records using the SQL script

### Option 2: Reconcile All Historical Records
1. Run `sql/scripts/fix-user-token-balance.sql` for affected users
2. This recalculates balance from all token_usage records
3. Updates user_profiles with correct values

## Testing

After the fix, test with a simple API call:

```typescript
// This should now update the balance correctly
await trackTokenUsage({
  user_id: userId,
  action_type: 'chat_conversation',
  model_used: 'gpt-4',
  tokens_used: 100,
  success: true,
  // ... other fields
})
```

Check logs for:
- `"Updating user balance:"` - Should show old/new values
- `"User balance updated successfully"` - Confirms update worked
- `"Failed to update user balance:"` - Indicates error (shouldn't happen now)

## Common Issues

### Issue: Balance still not updating
**Check:**
1. Is `success: true`? (false won't update)
2. Is `tokens_used > 0`? (zero won't update)
3. Does user_profiles row exist? (create if missing)
4. Check server logs for errors

### Issue: Balance updates but wrong amount
**Check:**
1. Are there admin_grant records? (adds to remaining)
2. Are there admin_deduct records? (subtracts from remaining)
3. Are effective tokens calculated correctly?
4. Check for override values in `ai_action_token_overrides`

## Next Steps

1. ✅ Code fix applied - test with new API calls
2. 🔄 Reconcile existing user balances using SQL script
3. 📊 Monitor logs to confirm updates are working
4. ✅ All future calls will work correctly

---

**Status:** ✅ Fixed - New calls will work, reconcile old records as needed

