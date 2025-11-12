# Token Flow Clarification

## 1. Token Drips - Subscription Purchases ✅

**Yes, token drips automatically generate with subscription purchase!**

### Annual Subscription Purchase:
```
User subscribes to Vision Pro Annual ($999/year)
  ↓
Stripe webhook: checkout.session.completed
  ↓
Calls grant_annual_tokens() RPC
  ↓
Writes to token_transactions table ✅
  ↓
Grants 5M tokens immediately
```

### 28-Day Subscription Purchase:
```
User subscribes to Vision Pro 28-Day ($99/28 days)
  ↓
Stripe webhook: checkout.session.completed
  ↓
Calls drip_tokens_28day() RPC
  ↓
Writes to token_drips table ✅
  ↓
Grants 375k tokens (first cycle)
```

**Future cycles:** Stripe billing webhook → `drip_tokens_28day()` → `token_drips` table

---

## 2. Token Transactions - Direct Purchases ✅

**Yes, token transactions are for direct token purchases!**

### Token Pack Purchase:
```
User buys token pack ($99, $199, or $399)
  ↓
Stripe webhook: checkout.session.completed
  ↓
Calls recordTokenPackPurchase()
  ↓
Writes to token_transactions table ✅
  ↓
Grants tokens (2M, 5M, or 12M)
```

**Table:** `token_transactions`
- `transaction_type`: 'purchase'
- `source`: 'token_pack'
- `token_amount`: Positive (grants tokens)
- `amount_paid_cents`: Payment amount
- `stripe_payment_intent_id`: Stripe reference

---

## 3. Admin Token Grants - `/admin/users` Page ✅

**The `/admin/ai-models` page does NOT grant tokens!**

### `/admin/ai-models` Page:
- **Purpose:** Configure AI models (which model to use, temperature, etc.)
- **Does NOT grant tokens** - it's for model configuration only

### `/admin/users` Page:
- **Purpose:** Manage users and grant/deduct tokens
- **Location:** `src/app/admin/users/page.tsx`
- **Action:** Click "Add Tokens" or "Deduct Tokens" button
- **API:** Calls `/api/admin/users/adjust-tokens`
- **Function:** Uses `grantTokens()` or `recordAdminDeduction()`
- **Table:** Writes to `token_transactions` ✅

### Flow:
```
Admin goes to /admin/users
  ↓
Enters token amount (positive or negative)
  ↓
Clicks "Add Tokens" or "Deduct Tokens"
  ↓
POST /api/admin/users/adjust-tokens
  ↓
Calls grantTokens() or recordAdminDeduction()
  ↓
Writes to token_transactions table ✅
  ↓
Updates user balance
```

**Table:** `token_transactions`
- `transaction_type`: 'grant' (positive) or 'deduction' (negative)
- `source`: 'admin'
- `token_amount`: Positive for grants, negative for deductions
- `created_by`: Admin user ID (audit trail)

---

## Summary Table

| Action | Trigger | Table | Function |
|--------|---------|-------|----------|
| **Annual Subscription** | Stripe webhook | `token_transactions` | `grant_annual_tokens()` RPC |
| **28-Day Subscription** | Stripe webhook | `token_drips` | `drip_tokens_28day()` RPC |
| **Token Pack Purchase** | Stripe webhook | `token_transactions` | `recordTokenPackPurchase()` |
| **Admin Grant** | `/admin/users` page | `token_transactions` | `grantTokens()` |
| **Admin Deduction** | `/admin/users` page | `token_transactions` | `recordAdminDeduction()` |
| **AI Usage** | API calls | `token_usage` | `trackTokenUsage()` |

---

## Key Points

1. ✅ **Token drips** automatically happen with subscription purchase (webhook)
2. ✅ **Token transactions** are for direct purchases (token packs) AND admin grants
3. ✅ **Admin grants** happen at `/admin/users` page (NOT `/admin/ai-models`)
4. ✅ **`/admin/ai-models`** is for configuring AI models, not granting tokens

---

**Status:** ✅ All flows properly separated by table and purpose

