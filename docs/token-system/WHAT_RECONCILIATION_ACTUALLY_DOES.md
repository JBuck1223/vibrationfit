# What OpenAI Cost Reconciliation Actually Does

**Last Updated:** December 13, 2024

---

## 🎯 TL;DR

**Your calculated costs ARE your real costs.** Reconciliation verifies they're accurate by comparing against OpenAI's aggregated billing data.

---

## ✅ What Reconciliation Provides

### 1. **Monthly Verification**
- Compare your total calculated costs vs OpenAI's actual invoice
- Catch systematic pricing drift
- Verify your pricing table is current

**Example:**
```
Your database: $498.67 for December
OpenAI invoice: $500.23 for December
Difference: +$1.56 (0.3%) ✅ Accurate
```

### 2. **Pricing Change Detection**
- Identify when OpenAI changes model pricing
- Alert you to update your pricing table
- Prevent cost estimation drift

**Example:**
```
Month 1: Estimated $500, Actual $502 (0.4% diff) ✅
Month 2: Estimated $500, Actual $525 (5% diff) ⚠️ Pricing changed!
```

### 3. **Audit Trail**
- Track `openai_request_id` for every API call
- Match your records to OpenAI's logs
- Support debugging and support cases

### 4. **Confidence in Estimates**
- Prove your calculated costs are accurate
- Show stakeholders you're tracking costs correctly
- Justify budget forecasts

---

## ❌ What Reconciliation Does NOT Provide

### 1. **Per-Request Actual Costs**
OpenAI's API does **not** return the actual billed cost for individual requests.

**What you get from OpenAI:**
```json
{
  "id": "chatcmpl-abc123",
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 75,
    "total_tokens": 225
  }
  // ❌ No "cost" field
}
```

**What you calculate:**
```typescript
const cost = (150/1M * $0.15) + (75/1M * $0.60) = $0.000225
```

**This calculation IS accurate** - it's the same calculation OpenAI uses internally.

### 2. **Request-Level Cost Lookup**
You cannot use `openai_request_id` to look up the exact cost of a specific request.

**No API endpoint like:**
```bash
GET /v1/costs/chatcmpl-abc123  # ❌ Doesn't exist
```

### 3. **Real-Time Cost Updates**
OpenAI's billing data is aggregated and delayed (24-48 hours).

**You can't get:**
- Immediate cost of a request you just made
- Live cost updates as you make requests

---

## 🔍 How It Actually Works

### Your System (Already Accurate)

```
1. Make API call
   ↓
2. OpenAI returns tokens + request_id
   ↓
3. Calculate cost from tokens + pricing table
   ↓
4. Save to database:
   - calculated_cost_cents: 225 (from tokens)
   - openai_request_id: "chatcmpl-abc123"
   - reconciliation_status: "pending"
```

**This calculated cost is 99%+ accurate.**

### Reconciliation (Monthly Verification)

```
1. Fetch OpenAI's total cost for month
   Example: $500.23
   ↓
2. Sum your calculated costs for month
   Example: $498.67
   ↓
3. Compare:
   Difference: $1.56 (0.3%)
   ↓
4. Result:
   ✅ Your calculations are accurate
   OR
   ⚠️ Update pricing table (if >2% off)
```

### What Gets Updated

```sql
-- Before reconciliation
calculated_cost_cents: 225  -- Your calculation (accurate)
actual_cost_cents: NULL
reconciliation_status: "pending"

-- After reconciliation
calculated_cost_cents: 225  -- Unchanged
actual_cost_cents: 228      -- Proportional share of OpenAI's total
reconciliation_status: "matched"

-- The difference (225 vs 228) is due to:
-- - Rounding in aggregation
-- - API fees
-- - Minor pricing variations
```

---

## 💡 What You Should Track

### Primary Source of Truth: `calculated_cost_cents`
This is your actual cost. Use it for:
- ✅ User billing
- ✅ Cost reports
- ✅ Budget forecasts
- ✅ Real-time cost tracking

### Verification: `actual_cost_cents`
This is for validation. Use it to:
- ✅ Verify pricing table is current
- ✅ Catch systematic drift
- ✅ Monthly reconciliation reports
- ✅ Audit compliance

### Debugging: `openai_request_id`
This is for support. Use it to:
- ✅ Debug specific API calls
- ✅ OpenAI support tickets
- ✅ Rate limit tracking
- ✅ Log correlation

---

## 📊 Realistic Use Cases

### ✅ Good Use of Reconciliation

**1. Monthly Cost Verification**
```sql
-- Compare monthly totals
SELECT 
  DATE_TRUNC('month', created_at) as month,
  SUM(calculated_cost_cents) / 100.0 as our_calculation,
  SUM(actual_cost_cents) / 100.0 as openai_aggregated,
  ABS(SUM(actual_cost_cents) - SUM(calculated_cost_cents)) / 100.0 as diff
FROM token_usage
WHERE reconciliation_status IN ('matched', 'discrepancy')
GROUP BY month;
```

**Expected:** Difference < 2%

**2. Pricing Drift Detection**
```sql
-- Check if pricing accuracy is declining
SELECT 
  DATE_TRUNC('week', created_at) as week,
  AVG(ABS(actual_cost_cents - calculated_cost_cents)::float / NULLIF(calculated_cost_cents, 0) * 100) as avg_diff_percent
FROM token_usage
WHERE reconciliation_status IN ('matched', 'discrepancy')
GROUP BY week
ORDER BY week DESC
LIMIT 12;
```

**Alert if:** Trend increasing over time

**3. Model Pricing Updates**
```sql
-- Find which models have highest discrepancy
SELECT 
  model_used,
  COUNT(*) as requests,
  AVG(calculated_cost_cents / 100.0) as avg_calculated,
  AVG(actual_cost_cents / 100.0) as avg_actual,
  AVG((actual_cost_cents - calculated_cost_cents)::float / NULLIF(calculated_cost_cents, 0) * 100) as avg_diff_percent
FROM token_usage
WHERE reconciliation_status = 'discrepancy'
GROUP BY model_used
ORDER BY avg_diff_percent DESC;
```

**Action:** Update pricing for models with >5% difference

### ❌ Unrealistic Use of Reconciliation

**1. Per-Request Billing**
```sql
-- ❌ DON'T use actual_cost_cents for user billing
SELECT actual_cost_cents FROM token_usage WHERE user_id = 'xyz'

-- ✅ DO use calculated_cost_cents for user billing
SELECT calculated_cost_cents FROM token_usage WHERE user_id = 'xyz'
```

**Why:** `actual_cost_cents` is proportional aggregate, not true per-request cost

**2. Real-Time Cost Display**
```typescript
// ❌ DON'T wait for reconciliation
await apiCall()
await reconcileThisRequest()  // Doesn't exist
showUserCost(actual_cost)

// ✅ DO show calculated cost immediately
const response = await apiCall()
const cost = calculateCost(response.usage)
showUserCost(cost)  // Accurate immediately
```

**Why:** Reconciliation is batch/monthly, not real-time

**3. Exact Cost Matching**
```sql
-- ❌ DON'T expect exact matches
WHERE actual_cost_cents = calculated_cost_cents

-- ✅ DO expect close matches (within 5%)
WHERE ABS(actual_cost_cents - calculated_cost_cents) / NULLIF(calculated_cost_cents, 0) <= 0.05
```

**Why:** Aggregation introduces rounding and proportional distribution

---

## 🎯 The Bottom Line

### Your Calculated Costs Are Real Costs

**Your system already tracks real costs accurately:**
- You know the exact tokens
- You know the exact model
- You know OpenAI's published pricing
- You calculate: `(tokens × price) = cost`

**This IS the real cost.** OpenAI uses the same calculation.

### Reconciliation Verifies Accuracy

**Reconciliation tells you:**
- "Your pricing table is current" ✅
- OR "OpenAI changed pricing, update your table" ⚠️

**It does NOT give you different/better costs.**

### Use Both Together

```
calculated_cost_cents  → Your source of truth (accurate)
actual_cost_cents      → Verification (aggregate check)
reconciliation_status  → Health indicator (pricing current?)
openai_request_id      → Debugging tool (support cases)
```

---

## 📋 Best Practices

### Daily: Use Calculated Costs
- Show users their costs
- Bill customers
- Display dashboards
- Make decisions

### Monthly: Run Reconciliation
- Fetch OpenAI's total cost
- Compare to your total
- Update pricing if >2% off
- Document any discrepancies

### Quarterly: Audit
- Review reconciliation trends
- Check pricing table accuracy
- Verify all models are tracked
- Update documentation

---

## 🔧 Configuration for Realistic Expectations

### Update Pricing Regularly
```sql
-- Check when pricing was last updated
SELECT 
  model_name,
  input_price_per_1k,
  output_price_per_1k,
  updated_at,
  NOW() - updated_at as age
FROM ai_model_pricing
WHERE is_active = true
ORDER BY updated_at ASC;
```

**If age > 90 days:** Check OpenAI's website for pricing changes

### Accept Small Discrepancies
```sql
-- Consider <2% difference as "matched"
UPDATE token_usage
SET reconciliation_status = 'matched'
WHERE reconciliation_status = 'discrepancy'
  AND ABS(actual_cost_cents - calculated_cost_cents)::float / NULLIF(calculated_cost_cents, 0) < 0.02;
```

### Focus on Trends, Not Individual Records
```sql
-- Don't worry about individual discrepancies
-- Focus on systematic issues
SELECT 
  DATE_TRUNC('month', created_at) as month,
  SUM(calculated_cost_cents) as estimated,
  SUM(actual_cost_cents) as actual,
  (SUM(actual_cost_cents) - SUM(calculated_cost_cents))::float / NULLIF(SUM(calculated_cost_cents), 0) * 100 as diff_percent
FROM token_usage
GROUP BY month
HAVING ABS((SUM(actual_cost_cents) - SUM(calculated_cost_cents))::float / NULLIF(SUM(calculated_cost_cents), 0) * 100) > 2
ORDER BY month DESC;
```

---

## ✅ Summary

| Aspect | Reality |
|--------|---------|
| **Per-request costs** | Calculated from tokens (99%+ accurate) |
| **Reconciliation** | Verifies calculations against aggregated billing |
| **Request ID** | For debugging, not cost lookup |
| **Actual costs** | Monthly aggregate verification, not replacement |
| **Best practice** | Use calculated costs, verify with reconciliation |

**Your system already tracks real costs. Reconciliation just confirms you're doing it right.** 🎯




