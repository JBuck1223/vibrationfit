# OpenAI Cost Reconciliation - Quick Start

**Last Updated:** December 13, 2024

---

## 🚀 5-Minute Setup

### Step 1: Export Data from OpenAI (2 minutes)

1. Go to https://platform.openai.com/usage
2. Select date range (e.g., "Last 30 days")
3. Click "Export" button
4. Save CSV file to `~/Downloads/openai-usage.csv`

### Step 2: Run Reconciliation (1 minute)

```bash
npx tsx scripts/database/reconcile-openai-costs.ts ~/Downloads/openai-usage.csv
```

### Step 3: Review Results (2 minutes)

Check the output:

```
✅ Matched: 1,180        ← These costs are accurate
⚠️  Discrepancies: 42    ← Check these (see below)
❓ Not Found: 12         ← Normal for old data
❌ Errors: 0             ← Should be zero
```

---

## 🔍 What to Check

### If You See Discrepancies

**Normal (< 5% difference):** 
- Rounding differences
- Model variant pricing
- **Action:** None needed

**Larger differences:**
- OpenAI changed pricing
- **Action:** Update `ai_model_pricing` table

```sql
-- Check current pricing
SELECT model_name, input_price_per_1k, output_price_per_1k 
FROM ai_model_pricing 
WHERE is_active = true;

-- Update if needed (example)
UPDATE ai_model_pricing
SET 
  input_price_per_1k = 0.15,  -- New price from OpenAI
  output_price_per_1k = 0.60,
  updated_at = NOW()
WHERE model_name = 'gpt-4o-mini' AND is_active = true;
```

---

## 📊 Quick Queries

### Check reconciliation status:

```sql
SELECT 
  reconciliation_status,
  COUNT(*) as count,
  SUM(actual_cost_cents) / 100.0 as actual_cost_usd
FROM token_usage
WHERE openai_request_id IS NOT NULL
GROUP BY reconciliation_status;
```

### Find biggest differences:

```sql
SELECT 
  openai_request_id,
  model_used,
  calculated_cost_cents / 100.0 as estimated,
  actual_cost_cents / 100.0 as actual,
  (actual_cost_cents - calculated_cost_cents) / 100.0 as diff
FROM token_usage
WHERE reconciliation_status = 'discrepancy'
ORDER BY ABS(actual_cost_cents - calculated_cost_cents) DESC
LIMIT 10;
```

---

## 🔄 Monthly Routine

**Recommended schedule:** 1st of each month

1. Export previous month from OpenAI
2. Run reconciliation script
3. Update pricing if discrepancies > 5%
4. Re-run if needed
5. Archive CSV file

---

## 🎯 Expected Results

**Typical reconciliation:**
- 95%+ matched
- <5% discrepancies
- <1% not found (older data)
- 0 errors

**If your results differ significantly:**
- Check OpenAI pricing hasn't changed
- Verify `openai_request_id` is being captured
- Review CSV format matches expected headers

---

## 💡 Pro Tips

1. **Keep CSV files** - Archive for future reference
2. **Run monthly** - Don't wait too long between reconciliations
3. **Check trends** - Are you consistently over/under estimating?
4. **Update pricing** - Keep `ai_model_pricing` current

---

## 🆘 Common Issues

**Issue:** "No valid billing rows found"  
**Fix:** Check CSV format. Should have headers like `request_id`, `model`, `cost`

**Issue:** "Most requests not found"  
**Fix:** Normal if reconciling old data. Only recent requests (with `openai_request_id`) will match.

**Issue:** "High discrepancy rate"  
**Fix:** OpenAI likely changed pricing. Update `ai_model_pricing` table.

---

## 📚 Full Documentation

For complete details, see: `docs/token-system/OPENAI_RECONCILIATION_GUIDE.md`

---

**That's it!** Your actual costs are now tracked in the database. 🎉

