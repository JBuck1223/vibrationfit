# Cost Recalculation Guide 💰

**Last Updated:** November 16, 2025

---

## 🎯 Purpose

Your `token_usage` table has **flawed cost estimates** in the `cost_estimate` column. You've built an accurate `ai_model_pricing` table with correct pricing. This script recalculates ALL historical costs using the accurate pricing data and stores them in `calculated_cost_cents`.

---

## 📊 Current State

```
Total Rows: 273
Has Accurate Cost: 207
Needs Recalculation: 66
```

**The Problem:**
- `cost_estimate` = Old, inaccurate estimates
- `calculated_cost_cents` = NULL or outdated for some rows

**The Solution:**
- Recalculate ALL rows using `ai_model_pricing` table
- Update `calculated_cost_cents` with accurate values
- Admin dashboard will show correct costs

---

## 🚀 How to Run

### Option 1: Quick Run (Recommended)
```bash
cd /Users/jordanbuckingham/Desktop/vibrationfit
./scripts/database/run-recalculate-costs.sh
```

### Option 2: Manual SQL
```bash
cd /Users/jordanbuckingham/Desktop/vibrationfit

psql "postgresql://postgres:$(grep PGPASSWORD .env.local | cut -d '=' -f2)@db.nxjhqibnlbwzzphewncj.supabase.co:5432/postgres" \
  -f scripts/database/recalculate-token-costs.sql
```

### Option 3: Via Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/nxjhqibnlbwzzphewncj/sql/new
2. Copy/paste contents of `scripts/database/recalculate-token-costs.sql`
3. Click "Run"

---

## 🔍 What It Does

### 1. **Text Models (GPT)**
Calculates: `(input_tokens/1000) × input_price + (output_tokens/1000) × output_price`

**Models:**
- gpt-4o: $0.005/$0.015 per 1K tokens
- gpt-4o-mini: $0.00015/$0.0006 per 1K tokens
- gpt-4-turbo: $0.01/$0.03 per 1K tokens
- gpt-5: $0.01/$0.03 per 1K tokens

### 2. **Whisper (Audio Transcription)**
Calculates: `audio_seconds × $0.006`

**Models:**
- whisper-1: $0.006 per second

### 3. **TTS (Text-to-Speech)**
Calculates: `(input_tokens/1000) × price_per_character`

**Models:**
- tts-1: $0.015 per 1K characters
- tts-1-hd: $0.030 per 1K characters

### 4. **DALL-E (Image Generation)**
Calculates: Flat rate per image

**Models:**
- dall-e-2: $0.020 per image
- dall-e-3: $0.040 per image

### 5. **Model Variations**
Handles:
- `gpt-4o-mini-2024-07-18` → Uses `gpt-4o-mini` pricing
- `gpt-4o-2024-08-06` → Uses `gpt-4o` pricing

---

## 📊 What You'll See

### Before:
```
model_used    | rows | old_total | accurate_total | difference
--------------|------|-----------|----------------|------------
whisper-1     |   95 |   $45.00  |   NULL         | N/A
gpt-4-turbo   |   58 |  $120.00  |   NULL         | N/A
```

### After:
```
model_used    | rows | old_total | accurate_total | difference
--------------|------|-----------|----------------|------------
whisper-1     |   95 |   $45.00  |   $63.58       | +$18.58
gpt-4-turbo   |   58 |  $120.00  |  $142.30       | +$22.30
gpt-4o        |   14 |   $15.00  |   $11.87       | -$3.13
dall-e-3      |   30 |   $30.00  |   $12.00       | -$18.00
```

**Summary:**
- ✅ All costs recalculated
- ✅ More accurate pricing
- ✅ Can now reconcile with OpenAI billing

---

## 🎨 Impact on Admin Dashboard

**Before Running Script:**
- Shows zeros or inaccurate old estimates
- Can't trust the cost data

**After Running Script:**
- `/admin/token-usage` shows accurate historical costs
- "Overall Summary" displays correct totals
- "By User" shows real per-user costs
- "Reconciliation" tab ready for OpenAI matching

---

## ⚠️ Important Notes

### Safe to Run
- ✅ Read-only SELECT queries for reporting
- ✅ Updates ONLY `calculated_cost_cents` column
- ✅ Does NOT touch `cost_estimate` (kept for comparison)
- ✅ Wrapped in transaction (all or nothing)
- ✅ Can be run multiple times safely

### What It Doesn't Touch
- ❌ Original `cost_estimate` values (preserved)
- ❌ Token counts (input_tokens, output_tokens)
- ❌ User data
- ❌ Any other tables

### When to Run
- ✅ After adding new models to `ai_model_pricing`
- ✅ When pricing changes
- ✅ To fix historical data
- ✅ Before reconciling with OpenAI billing

---

## 🔧 Troubleshooting

### Problem: "model not found in ai_model_pricing"
**Solution:** Add the model to `ai_model_pricing` table first

```sql
INSERT INTO ai_model_pricing (
  model_name,
  provider,
  model_family,
  input_price_per_1k,
  output_price_per_1k
) VALUES (
  'new-model-name',
  'openai',
  'gpt-4',
  0.010,
  0.030
);
```

### Problem: "Still Missing" shows rows
**Check:** Those models might not be in `ai_model_pricing`

```sql
-- See what models are missing
SELECT DISTINCT model_used
FROM token_usage
WHERE calculated_cost_cents IS NULL;

-- Check if they exist in pricing table
SELECT model_name FROM ai_model_pricing;
```

---

## 📈 Example Output

```
Before Update
total_rows | has_cost | missing_cost
-----------+----------+--------------
       273 |      207 |           66

Text Models Updated: 124 rows
Whisper Updated: 95 rows
TTS Updated: 40 rows
DALL-E Updated: 30 rows

After Update
total_rows | has_cost | still_missing
-----------+----------+---------------
       273 |      273 |             0

Cost Comparison
old_estimate_usd | accurate_cost_usd | difference_usd | accuracy_%
-----------------|-------------------|----------------|------------
        $1,320.24|          $1,287.45|        -$32.79 |      97.52%

✅ Cost recalculation complete!
```

---

## 🎯 Next Steps After Running

1. **Check Admin Dashboard**
   - Visit `/admin/token-usage`
   - Verify numbers look correct
   - Compare "old estimate" vs "accurate cost"

2. **Review the View**
   ```sql
   SELECT * FROM token_usage_with_costs
   ORDER BY created_at DESC
   LIMIT 10;
   ```

3. **Spot Check**
   ```sql
   -- Compare old vs new for a specific model
   SELECT 
     model_used,
     COUNT(*),
     SUM(cost_estimate) / 100.0 as old_usd,
     SUM(calculated_cost_cents) / 100.0 as accurate_usd
   FROM token_usage
   WHERE model_used = 'gpt-4o'
   GROUP BY model_used;
   ```

---

## 📚 Related Files

- Script: `scripts/database/recalculate-token-costs.sql`
- Runner: `scripts/database/run-recalculate-costs.sh`
- Pricing Table: `ai_model_pricing`
- View: `token_usage_with_costs`

---

**Ready to fix your costs?** Just run the script! 🚀

