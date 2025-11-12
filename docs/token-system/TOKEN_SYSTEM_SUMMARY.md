# Token System Summary - Working with Existing Tables

## ✅ Three Tables, Three Purposes

### 1. `token_transactions` - Financial Transactions
**Use for:** Grants, purchases, deductions, refunds

**Current Schema:**
- `transaction_type`: grant, purchase, deduction, refund, transfer
- `source`: admin, subscription, trial, token_pack, stripe
- `token_amount`: Positive for grants/purchases, negative for deductions
- `balance_before` / `balance_after`: Balance snapshots
- `amount_paid_cents`, `stripe_payment_intent_id`, etc. (added via migration)

**What Goes Here:**
- ✅ Token pack purchases
- ✅ Admin grants/deductions
- ✅ Subscription grants (annual - one-time grant)
- ✅ Trial grants

### 2. `token_drips` - Subscription Drips
**Use for:** 28-day subscription token dripping

**Current Schema:**
- `drip_amount`: 375k per cycle
- `cycle_number`: Cycle tracking
- `rollover_from_previous`: Rollover amount
- `rollover_cycles_count`: How many cycles rolled over
- `expired_tokens`: Tokens that expired
- `balance_before` / `balance_after`: Balance snapshots

**What Goes Here:**
- ✅ 28-day subscription token drips (handled by `drip_tokens_28day()` RPC)

### 3. `token_usage` - AI Operations
**Use for:** AI feature usage tracking

**Current Schema:**
- `action_type`: vision_generation, chat_conversation, etc.
- `model_used`: gpt-5, gpt-4, etc.
- `tokens_used`: Tokens consumed
- `input_tokens` / `output_tokens`: Detailed breakdown
- `cost_estimate`: AI cost in cents

**What Goes Here:**
- ✅ All AI API calls
- ✅ Vision generation
- ✅ Chat conversations
- ✅ Blueprint generation
- ✅ Audio/image generation

## Updated Code

### ✅ Token Pack Purchase (Webhook)
**Now uses:** `recordTokenPackPurchase()` → `token_transactions`

### ✅ Admin Grant/Deduction
**Now uses:** `grantTokens()` / `recordAdminDeduction()` → `token_transactions`

### ✅ Subscription Grants (Annual)
**Already uses:** `grant_annual_tokens()` RPC → `token_transactions` ✅

### ✅ Subscription Drips (28-Day)
**Already uses:** `drip_tokens_28day()` RPC → `token_drips` ✅

### ✅ AI Operations
**Already uses:** `trackTokenUsage()` → `token_usage` ✅

## Migration Applied

**File:** `supabase/migrations/20250203000007_update_token_transactions_schema.sql`

**What it does:**
- Adds payment fields to existing `token_transactions` table
- Adds constraints for `transaction_type` and `source`
- Adds indexes for performance
- Doesn't recreate table - just enhances existing one

## Query Examples

### View All Financial Transactions
```sql
SELECT * FROM token_transactions
WHERE user_id = 'USER_ID'
ORDER BY created_at DESC;
```

### View Subscription Drips
```sql
SELECT * FROM token_drips
WHERE user_id = 'USER_ID'
ORDER BY drip_date DESC;
```

### View AI Usage
```sql
SELECT * FROM token_usage
WHERE user_id = 'USER_ID'
ORDER BY created_at DESC;
```

### View Everything Together
```sql
-- Transactions
SELECT 'transaction' as type, created_at, token_amount, transaction_type
FROM token_transactions WHERE user_id = 'USER_ID'

UNION ALL

-- Drips
SELECT 'drip' as type, drip_date as created_at, drip_amount as token_amount, 'drip' as transaction_type
FROM token_drips WHERE user_id = 'USER_ID'

UNION ALL

-- Usage (negative for display)
SELECT 'usage' as type, created_at, -tokens_used as token_amount, action_type as transaction_type
FROM token_usage WHERE user_id = 'USER_ID'

ORDER BY created_at DESC;
```

---

**Status:** ✅ Working with existing tables - Properly separated by purpose

