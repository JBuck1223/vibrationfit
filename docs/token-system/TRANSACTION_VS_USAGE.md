# Token Transactions vs. Token Usage

## ✅ Proper Separation Implemented

### `token_transactions` - Financial Transactions
**Purpose:** Track balance changes (grants, purchases, deductions)

**What Goes Here:**
- ✅ Token pack purchases
- ✅ Subscription grants  
- ✅ Trial grants
- ✅ Admin grants/deductions
- ✅ Refunds (future)
- ✅ Transfers (future)

**Key Fields:**
- `transaction_type`: grant, purchase, deduction, refund, transfer
- `source`: admin, subscription, trial, token_pack, stripe
- `token_amount`: Positive for grants/purchases, negative for deductions
- `balance_before` / `balance_after`: Balance snapshot
- `amount_paid_cents`: Payment amount (for purchases)
- `stripe_payment_intent_id`: Stripe reference

### `token_usage` - AI Operations
**Purpose:** Track AI feature usage

**What Goes Here:**
- ✅ Vision generation
- ✅ Chat conversations
- ✅ Blueprint generation
- ✅ Audio/image generation
- ✅ All AI API calls

**Key Fields:**
- `action_type`: vision_generation, chat_conversation, etc.
- `model_used`: gpt-5, gpt-4, etc.
- `tokens_used`: Tokens consumed
- `input_tokens` / `output_tokens`: Detailed breakdown
- `cost_estimate`: AI cost in cents

## Updated Code

### Token Pack Purchase (Webhook)
**Before:** Used `trackTokenUsage()` with `admin_grant`
**After:** Uses `recordTokenPackPurchase()` → `token_transactions` ✅

### Admin Grant/Deduction
**Before:** Used `trackTokenUsage()` with `admin_grant`/`admin_deduct`
**After:** Uses `grantTokens()` / `recordAdminDeduction()` → `token_transactions` ✅

### AI Operations
**Still:** Uses `trackTokenUsage()` → `token_usage` ✅

## Benefits

1. **Clear Separation**
   - Financial data separate from operational data
   - Easier to audit purchases vs. usage

2. **Better Reporting**
   - "Show all purchases" → Query `token_transactions`
   - "Show feature usage" → Query `token_usage`
   - "Show everything" → Join both tables

3. **Proper Balance Tracking**
   - Balance changes tracked in `token_transactions`
   - Balance snapshots (`balance_before` / `balance_after`)
   - Can reconcile balance from transactions alone

4. **Future-Proof**
   - Easy to add refunds, transfers
   - Can archive old usage without affecting financial records

## Migration Status

✅ **Migration Created:** `20250203000006_create_token_transactions_table.sql`
✅ **Transaction Functions:** `src/lib/tokens/transactions.ts`
✅ **Webhook Updated:** Uses `recordTokenPackPurchase()`
✅ **Admin Route Updated:** Uses `grantTokens()` / `recordAdminDeduction()`

## Next Steps

1. Run migration to create proper `token_transactions` table
2. Test token pack purchase → Should create transaction record
3. Test admin grant → Should create transaction record
4. Verify balance updates correctly

---

**Status:** ✅ Properly separated - Transactions vs. Usage

