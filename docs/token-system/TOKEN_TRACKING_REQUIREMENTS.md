# Token Tracking Requirements

## Rule: All Token Changes Must Be Tracked

**Every change to `user_profiles.vibe_assistant_tokens_remaining` MUST be recorded in either:**
1. `token_transactions` - For financial transactions (grants, purchases, deductions)
2. `token_usage` - For AI operations and operational grants

## Approved Functions

### ✅ Financial Transactions (use `token_transactions`)
- `recordTokenTransaction()` - Core function for all financial transactions
- `grantTokens()` - Admin grants, subscription grants, trial grants
- `recordTokenPackPurchase()` - Token pack purchases
- `recordAdminDeduction()` - Admin deductions

### ✅ AI Operations (use `token_usage`)
- `trackTokenUsage()` - All AI operations (chat, image generation, etc.)

### ✅ RPC Functions (write to both)
- `grant_annual_tokens()` - Annual subscription grants (writes to both tables)
- `grant_trial_tokens()` - Trial token grants (writes to token_usage)

## ❌ Forbidden Patterns

**DO NOT:**
```typescript
// ❌ Direct update without transaction record
await supabase
  .from('user_profiles')
  .update({ vibe_assistant_tokens_remaining: newBalance })
  .eq('user_id', userId)

// ❌ SQL UPDATE without transaction
UPDATE user_profiles 
SET vibe_assistant_tokens_remaining = 100000 
WHERE user_id = '...'
```

**DO:**
```typescript
// ✅ Use transaction functions
await grantTokens(userId, 100000, 'admin', metadata, supabase)

// ✅ Or recordTokenTransaction
await recordTokenTransaction({
  user_id: userId,
  action_type: 'admin_grant',
  tokens_used: 100000,
  // ... other fields
}, supabase)
```

## Audit Query

To find users with untracked token changes:

```sql
SELECT * FROM untracked_token_changes
WHERE ABS(discrepancy) > 0
ORDER BY ABS(discrepancy) DESC;
```

This view compares the actual balance in `user_profiles` against the calculated balance from `token_transactions` and `token_usage`.

## Migration Path

If you have existing untracked tokens:

1. **Identify the source** - Check when/how the tokens were added
2. **Create historical records** - Insert into `token_transactions` or `token_usage` with appropriate `created_at` dates
3. **Verify balance** - Run the audit query to confirm reconciliation

Example historical record:
```sql
INSERT INTO token_transactions (
  user_id,
  action_type,
  tokens_used,
  tokens_remaining,
  metadata,
  created_at
)
VALUES (
  'user-id',
  'admin_grant',
  100000,
  100100,  -- 100 (default) + 100000
  '{"reason": "Historical grant (pre-transaction-tracking)", "admin_action": true}',
  '2025-10-05T14:14:58.865151+00'::timestamptz
);
```

