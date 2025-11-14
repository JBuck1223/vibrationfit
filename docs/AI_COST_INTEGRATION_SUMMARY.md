# AI Cost Integration Summary

**Last Updated:** November 15, 2025

---

## ✅ What You Already Have

Your `token_usage` table already tracks:

```sql
CREATE TABLE token_usage (
  id uuid,
  user_id uuid,
  action_type text,
  model_used text,                  -- ✅ Already captures model
  tokens_used integer,              -- ✅ Total tokens
  input_tokens integer,             -- ✅ Input tokens  
  output_tokens integer,            -- ✅ Output tokens
  cost_estimate numeric(10,4),     -- ⚠️ Inaccurate estimate
  success boolean,
  error_message text,
  metadata jsonb,
  created_at timestamptz
);
```

**You already have all the data needed!** ✅

---

## 🆕 What The Migrations Add

### Migration 1: `20251115000000_create_ai_model_pricing.sql`

Creates the pricing reference table:
- Stores accurate input/output pricing per model
- Pre-populated with current OpenAI pricing
- Admin-manageable pricing updates

### Migration 2: `20251115000001_integrate_cost_tracking.sql`

Integrates with your existing `token_usage`:
- Adds `calculated_cost_cents` column (keeps old `cost_estimate` for comparison)
- Backfills accurate costs for existing records
- Updates `apply_token_usage()` function to auto-calculate costs
- Creates analysis view for cost comparison

---

## 📊 Before vs After

### Before
```sql
-- Your existing tracking (ALREADY GOOD!)
INSERT INTO token_usage (
  user_id,
  action_type,
  model_used,
  input_tokens,
  output_tokens,
  cost_estimate,  -- ⚠️ Inaccurate hardcoded estimate
  ...
);
```

### After
```sql
-- Same tracking, but with auto-calculated accurate cost
INSERT INTO token_usage (
  user_id,
  action_type,
  model_used,
  input_tokens,
  output_tokens,
  cost_estimate,          -- Old estimate (kept for reference)
  calculated_cost_cents,  -- ✅ NEW: Accurate from ai_model_pricing
  ...
);
```

---

## 🔧 How It Works

### 1. Pricing Table (Reference)
```sql
SELECT * FROM ai_model_pricing WHERE model_name = 'gpt-4o';
```
```
model_name  | input_price_per_1k | output_price_per_1k
------------|--------------------|--------------------- 
gpt-4o      | 0.005000          | 0.015000
```

### 2. Calculation Function
```sql
SELECT calculate_ai_cost('gpt-4o', 1000, 500, NULL);
-- Returns: 1250 cents = $12.50
-- Formula: (1000/1000 * $0.005) + (500/1000 * $0.015) = $0.005 + $0.0075 = $0.0125
```

### 3. Auto-Integration
When you call `apply_token_usage()`, it now:
1. Takes your `input_tokens` and `output_tokens` ✅ (you're already providing these)
2. Looks up pricing from `ai_model_pricing`
3. Calculates accurate cost
4. Stores BOTH old estimate and new accurate cost

---

## 📈 New Queries You Can Run

### Total Accurate Costs
```sql
SELECT 
  SUM(calculated_cost_cents) / 100.0 as total_cost_usd,
  COUNT(*) as requests,
  SUM(input_tokens + output_tokens) as total_tokens
FROM token_usage
WHERE user_id = 'user-id'
  AND calculated_cost_cents IS NOT NULL;
```

### Cost by Model
```sql
SELECT 
  model_used,
  COUNT(*) as requests,
  SUM(input_tokens) as input_tokens,
  SUM(output_tokens) as output_tokens,
  SUM(calculated_cost_cents) / 100.0 as accurate_cost_usd
FROM token_usage
WHERE user_id = 'user-id'
GROUP BY model_used
ORDER BY accurate_cost_usd DESC;
```

### Cost Accuracy Comparison
```sql
SELECT 
  action_type,
  COUNT(*) as requests,
  SUM(cost_estimate) / 100.0 as old_estimate_usd,
  SUM(calculated_cost_cents) / 100.0 as accurate_cost_usd,
  (SUM(calculated_cost_cents) - SUM(cost_estimate)) / 100.0 as difference_usd,
  ROUND(AVG(calculated_cost_cents::numeric / NULLIF(cost_estimate, 0) * 100), 2) as accuracy_pct
FROM token_usage
WHERE calculated_cost_cents IS NOT NULL
  AND cost_estimate > 0
GROUP BY action_type;
```

### Using the Analysis View
```sql
SELECT * FROM token_usage_with_costs
WHERE user_id = 'user-id'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🎯 What You Need To Do

### 1. Run Both Migrations
```bash
# In Supabase dashboard:
1. supabase/migrations/20251115000000_create_ai_model_pricing.sql
2. supabase/migrations/20251115000001_integrate_cost_tracking.sql
```

### 2. That's It!
Your existing tracking code doesn't need to change. The `apply_token_usage()` function is already enhanced to calculate accurate costs automatically.

---

## 📊 Admin View: Cost Comparison

After running migrations, check the accuracy:

```sql
-- See how accurate your old estimates were
SELECT 
  COUNT(*) as records_with_both,
  AVG(old_estimate_usd) as avg_old_estimate,
  AVG(accurate_cost_usd) as avg_accurate_cost,
  AVG(cost_difference_usd) as avg_difference,
  AVG(accuracy_percentage) as avg_accuracy_pct
FROM token_usage_with_costs
WHERE old_estimate_usd > 0 AND accurate_cost_usd > 0;
```

---

## ✅ Benefits

| Before | After |
|--------|-------|
| ⚠️ Cost estimates possibly inaccurate | ✅ Accurate costs from pricing table |
| ❌ Can't update pricing easily | ✅ Update via admin panel |
| ❌ No input/output cost separation | ✅ Proper input/output pricing |
| ❌ Hard to compare estimate vs actual | ✅ Both stored for analysis |

---

## 🔄 Ongoing Usage

Once migrations are run, your existing code continues to work. The `apply_token_usage()` function just does more:

```typescript
// Your existing tracking call (NO CHANGES NEEDED)
await supabase.rpc('apply_token_usage', {
  p_user_id: userId,
  p_action_type: 'chat_conversation',
  p_model_used: 'gpt-4o',
  p_tokens_used: 1500,
  p_input_tokens: 1000,
  p_output_tokens: 500,
  p_cost_estimate_cents: 1000, // Old estimate (optional)
  p_metadata: {}
})

// Backend now automatically:
// 1. Looks up accurate pricing
// 2. Calculates: (1000/1000 * 0.005) + (500/1000 * 0.015) = $0.0125
// 3. Stores calculated_cost_cents: 1250 (cents)
```

---

## 📚 Files

1. **Pricing Table:** `migrations/20251115000000_create_ai_model_pricing.sql`
2. **Integration:** `migrations/20251115000001_integrate_cost_tracking.sql`
3. **Full Guide:** `docs/AI_COST_TRACKING_GUIDE.md`
4. **This Summary:** `docs/AI_COST_INTEGRATION_SUMMARY.md`

---

**Your existing `token_usage` table is perfect!** These migrations just add accurate cost calculation on top of what you already have. 🎯

