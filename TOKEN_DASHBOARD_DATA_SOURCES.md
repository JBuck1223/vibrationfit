# Token Dashboard Data Sources Verification

## Top 4 Cards on `/dashboard/tokens`

### 1. Current Balance ✅
**Card:** Shows remaining tokens
**Data Source:** `user_profiles.vibe_assistant_tokens_remaining`
**API Path:** `profile?.vibe_assistant_tokens_remaining || 0`
**Status:** ✅ CORRECT - This is the source of truth for current balance

### 2. Tokens Used ✅
**Card:** Shows lifetime tokens used
**Data Source:** `user_profiles.vibe_assistant_tokens_used`
**API Path:** `profile?.vibe_assistant_tokens_used || 0`
**Status:** ✅ CORRECT - This is the source of truth for total usage

### 3. Total Granted ✅
**Card:** Shows lifetime tokens granted/purchased
**Data Source:** 
- **Primary:** `token_transactions` (sum of positive `token_amount`)
- **Fallback:** `token_usage` (if no transactions exist yet, for backward compatibility)
**API Path:** 
```typescript
const totalGrantedFromTransactions = transactions
  .filter(tx => tx.token_amount > 0)
  .reduce((sum, tx) => sum + tx.token_amount, 0)

const totalGranted = totalGrantedFromTransactions > 0 
  ? totalGrantedFromTransactions 
  : grantsFromUsage // Only if no transactions exist
```
**Status:** ✅ CORRECT - Prefers transactions table, avoids double-counting

### 4. Total Cost ✅
**Card:** Shows total AI usage cost
**Data Source:** `user_profiles.vibe_assistant_total_cost`
**API Path:** `(profile?.vibe_assistant_total_cost || 0) / 100` (converts cents to dollars)
**Status:** ✅ CORRECT - This is the source of truth for cost tracking

## Summary

All cards are pulling from the correct sources:
- **Balance & Used & Cost:** From `user_profiles` (single source of truth)
- **Total Granted:** From `token_transactions` (preferred) or `token_usage` (fallback)

The calculation logic ensures:
- No double-counting (only uses `token_usage` if `token_transactions` is empty)
- Accurate balance from `user_profiles`
- Proper separation of transactions vs usage

