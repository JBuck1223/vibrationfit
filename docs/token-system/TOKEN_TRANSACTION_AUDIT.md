# Token Transaction Tracking Audit

## Current State Analysis

### ✅ What IS Being Tracked

#### 1. Token Pack Purchases
**Location:** `src/app/api/stripe/webhook/route.ts` (line 171)
- ✅ Tracked in `token_usage` table
- ✅ Action type: `admin_grant`
- ✅ Includes Stripe metadata (payment_intent, session_id, amount_paid)
- ✅ Updates `user_profiles.vibe_assistant_tokens_remaining`

#### 2. Admin Manual Grants/Deductions
**Location:** `src/app/api/admin/users/adjust-tokens/route.ts`
- ✅ Tracked in `token_usage` table
- ✅ Action type: `admin_grant` or `admin_deduct`
- ✅ Includes admin metadata (reason, delta)
- ✅ Updates `user_profiles.vibe_assistant_tokens_remaining`

### ❌ What IS NOT Being Tracked Properly

#### 1. Annual Subscription Grants
**Location:** `src/app/api/stripe/webhook/route.ts` (line 118)
- ❌ Uses RPC function `grant_annual_tokens()`
- ❌ Writes to `token_transactions` table (NOT `token_usage`)
- ❌ NOT visible in unified token tracking system
- ✅ Updates `user_profiles.vibe_assistant_tokens_remaining`

#### 2. Trial Token Grants
**Location:** `src/app/api/stripe/webhook/route.ts` (multiple locations)
- ❌ Uses RPC function `grant_trial_tokens()`
- ❓ Unknown if tracked anywhere
- ✅ Updates `user_profiles.vibe_assistant_tokens_remaining`

## The Problem

**Two separate tracking systems:**
1. `token_usage` - Used by `trackTokenUsage()` (modern, unified)
2. `token_transactions` - Used by RPC functions (legacy, inconsistent)

**Result:**
- Token pack purchases → `token_usage` ✅
- Admin grants → `token_usage` ✅
- Subscription grants → `token_transactions` ❌
- Trial grants → Unknown ❓

**Impact:**
- Can't see all token grants in one place
- Reconciliation is difficult
- User history is incomplete
- Admin reporting is fragmented

## Recommended Solution

### Option 1: Migrate Everything to `token_usage` (Recommended)

**Pros:**
- Single source of truth
- Already has all the metadata fields
- Works with existing admin UI
- Consistent with current codebase

**Implementation:**
1. Update `grant_annual_tokens()` RPC to also write to `token_usage`
2. Update `grant_trial_tokens()` RPC to write to `token_usage`
3. Keep `token_transactions` for backward compatibility (read-only)
4. Add `action_type` values: `subscription_grant`, `trial_grant`

### Option 2: Create Unified Transaction View

**Pros:**
- Can keep both tables
- Historical data preserved

**Implementation:**
1. Create view that unions both tables
2. Use view for reporting/admin UI
3. Standardize going forward

### Option 3: Deprecate `token_transactions`, Migrate All

**Pros:**
- Cleanest solution
- Single table to maintain

**Implementation:**
1. Migrate existing `token_transactions` records to `token_usage`
2. Update all RPC functions to use `trackTokenUsage()`
3. Drop `token_transactions` table

## Current Action Types in `token_usage`

```typescript
'assessment_scoring'
'vision_generation'
'vision_refinement'
'blueprint_generation'
'chat_conversation'
'audio_generation'
'image_generation'
'transcription'
'admin_grant'          // ✅ Used for manual grants & token packs
'admin_deduct'         // ✅ Used for manual deductions
'life_vision_category_summary'
'life_vision_master_assembly'
'prompt_suggestions'
'frequency_flip'
```

## Missing Action Types Needed

```typescript
'subscription_grant'   // ❌ Annual/28-day subscription grants
'trial_grant'          // ❌ Trial token grants
'token_pack_purchase'  // ⚠️ Currently uses 'admin_grant' (could be more specific)
```

## Immediate Actions Needed

1. **Audit `grant_trial_tokens()` function**
   - Check if it writes to any table
   - Verify it updates `user_profiles`

2. **Update `grant_annual_tokens()` RPC**
   - Add `trackTokenUsage()` call
   - Keep `token_transactions` write for backward compatibility

3. **Update `grant_trial_tokens()` RPC**
   - Add `trackTokenUsage()` call
   - Ensure proper tracking

4. **Add new action types to database**
   - `subscription_grant`
   - `trial_grant`
   - Optionally: `token_pack_purchase` (more specific than `admin_grant`)

5. **Create migration script**
   - Migrate existing `token_transactions` → `token_usage`
   - Map old action types to new ones

## SQL Query to Check Current State

```sql
-- Check what's in token_transactions
SELECT 
  action_type,
  COUNT(*) as count,
  SUM(CASE WHEN tokens_used < 0 THEN ABS(tokens_used) ELSE 0 END) as total_grants
FROM token_transactions
GROUP BY action_type;

-- Check what's in token_usage for grants
SELECT 
  action_type,
  COUNT(*) as count,
  SUM(tokens_used) as total_tokens
FROM token_usage
WHERE action_type IN ('admin_grant', 'admin_deduct')
GROUP BY action_type;

-- Find users with grants in token_transactions but not token_usage
SELECT DISTINCT user_id
FROM token_transactions
WHERE user_id NOT IN (
  SELECT DISTINCT user_id 
  FROM token_usage 
  WHERE action_type = 'admin_grant'
);
```

---

**Status:** ⚠️ Inconsistent - Needs unification

