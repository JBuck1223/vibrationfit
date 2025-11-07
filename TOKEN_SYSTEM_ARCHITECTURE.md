# Token System Architecture

## Two Separate Tables for Different Purposes

### 1. `token_transactions` - Financial Transactions
**Purpose:** Track balance changes (grants, purchases, deductions, refunds)

**Use Cases:**
- Financial reporting
- Revenue tracking
- Balance reconciliation
- Purchase history
- Refund processing

**What Goes Here:**
- Token pack purchases
- Subscription grants
- Trial grants
- Admin grants/deductions
- Refunds
- Transfers

### 2. `token_usage` - AI Operations
**Purpose:** Track AI feature usage (which features, how many tokens)

**Use Cases:**
- Feature analytics
- Cost analysis per feature
- Usage patterns
- Performance monitoring

**What Goes Here:**
- Vision generation
- Chat conversations
- Blueprint generation
- Audio/image generation
- All AI API calls

## Key Differences

| Aspect | `token_transactions` | `token_usage` |
|--------|---------------------|---------------|
| **Purpose** | Financial tracking | Operational tracking |
| **Focus** | Balance changes | Feature usage |
| **Contains** | Grants, purchases | AI operations |
| **Metadata** | Payment info, Stripe IDs | Model used, feature context |
| **Updates Balance** | ✅ Yes (primary) | ✅ Yes (secondary) |

## Flow

### When User Purchases Tokens:
1. **Stripe webhook** → `recordTokenTransaction()` → `token_transactions` ✅
2. Balance updated in `user_profiles` ✅
3. (Optional) Also record in `token_usage` for unified history view

### When User Uses AI:
1. **AI API call** → `trackTokenUsage()` → `token_usage` ✅
2. Balance updated in `user_profiles` ✅
3. (NOT in `token_transactions` - this is usage, not a transaction)

## Benefits of Separation

1. **Clear Separation of Concerns**
   - Financial vs. operational data
   - Different reporting needs
   - Different access patterns

2. **Better Queries**
   - "Show me all purchases" → `token_transactions`
   - "Show me feature usage" → `token_usage`
   - "Show me everything" → Join both tables

3. **Easier Reconciliation**
   - Financial transactions are clean
   - Usage tracking is separate
   - Can verify balance from transactions alone

4. **Future-Proof**
   - Can add refunds, transfers easily
   - Can add more usage metrics without cluttering transactions
   - Can archive old usage without affecting financial records

## Implementation

### Recording a Transaction (Grant/Purchase)
```typescript
import { recordTokenTransaction } from '@/lib/tokens/transactions'

await recordTokenTransaction({
  user_id: userId,
  transaction_type: 'purchase',
  source: 'token_pack',
  token_amount: 5000000,
  amount_paid_cents: 9900,
  stripe_payment_intent_id: 'pi_xxx',
  token_pack_id: 'mega',
  // ...
})
```

### Recording Usage (AI Operation)
```typescript
import { trackTokenUsage } from '@/lib/tokens/tracking'

await trackTokenUsage({
  user_id: userId,
  action_type: 'vision_generation',
  model_used: 'gpt-5',
  tokens_used: 50000,
  // ...
})
```

---

**Status:** ✅ Properly separated - Transactions vs. Usage

