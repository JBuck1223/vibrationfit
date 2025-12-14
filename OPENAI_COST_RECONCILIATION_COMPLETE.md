# OpenAI Cost Reconciliation - Implementation Complete ✅

**Date:** December 13, 2024  
**Status:** Ready to Use  

---

## 🎯 What Was Built

A complete system to verify your calculated OpenAI costs against OpenAI's aggregated billing, enabling you to:

1. ✅ Track `openai_request_id` for every API call
2. ✅ Compare your calculated totals vs OpenAI's billed totals
3. ✅ Identify pricing table updates needed
4. ✅ Maintain complete audit trail
5. ✅ Run monthly reconciliation verification

**Important:** Your `calculated_cost_cents` (from tokens) IS your real cost. Reconciliation verifies it's accurate by comparing aggregate totals. OpenAI doesn't provide per-request actual costs.

---

## 📦 What's Included

### 1. Core Library (`src/lib/openai/reconciliation.ts`)

**Functions:**
- `parseOpenAIBillingCSV()` - Parse OpenAI's CSV exports
- `reconcileBillingData()` - Match and update database records
- `getReconciliationSummary()` - Get reconciliation statistics
- `calculateOpenAICost()` - Calculate costs from tokens

### 2. Admin API (`src/app/api/admin/reconcile-openai-costs/route.ts`)

**Endpoints:**
- `POST /api/admin/reconcile-openai-costs` - Upload CSV and reconcile
- `GET /api/admin/reconcile-openai-costs` - Get reconciliation summary

**Features:**
- Admin-only access
- Dry-run mode for testing
- Detailed error reporting
- Discrepancy tracking

### 3. CLI Script (`scripts/database/reconcile-openai-costs.ts`)

**Usage:**
```bash
npm run reconcile:openai path/to/openai-usage.csv
```

**Features:**
- Progress indicators
- Detailed output
- Error handling
- Summary statistics
- Cost comparison

### 4. Documentation

| File | Purpose |
|------|---------|
| `docs/token-system/RECONCILIATION_QUICK_START.md` | **Start here** - 5-minute setup |
| `docs/token-system/OPENAI_RECONCILIATION_GUIDE.md` | Complete reference guide |
| `docs/token-system/OPENAI_CSV_FORMAT.md` | CSV format reference |
| `docs/token-system/README.md` | Documentation index |
| `scripts/database/README-RECONCILIATION.md` | Script documentation |

### 5. Sample Data

- `scripts/database/sample-openai-usage.csv` - Test CSV file

---

## 🚀 How to Use

### Quick Start (5 minutes)

1. **Export from OpenAI:**
   - Go to https://platform.openai.com/usage
   - Select date range
   - Click "Export" → Save CSV

2. **Run reconciliation:**
   ```bash
   npm run reconcile:openai ~/Downloads/openai-usage.csv
   ```

3. **Review results:**
   ```
   ✅ Matched: 1,180        ← Accurate costs
   ⚠️  Discrepancies: 42    ← Check these
   ❓ Not Found: 12         ← Normal for old data
   ```

### Test First

```bash
# Test with sample data
npm run reconcile:openai scripts/database/sample-openai-usage.csv
```

---

## 📊 Database Schema

Your `token_usage` table already has these fields (from Nov 2025 migration):

```sql
openai_request_id       TEXT         -- OpenAI's unique request ID
openai_created          BIGINT       -- Unix timestamp from OpenAI
system_fingerprint      TEXT         -- Model version identifier
calculated_cost_cents   INTEGER      -- Your estimated cost
actual_cost_cents       INTEGER      -- OpenAI's actual cost (after reconciliation)
reconciliation_status   TEXT         -- pending, matched, discrepancy, not_applicable
reconciled_at           TIMESTAMPTZ  -- When reconciliation was performed
```

---

## 🔍 Reconciliation Status

| Status | Meaning | Action |
|--------|---------|--------|
| `pending` | Request ID captured, awaiting reconciliation | Run reconciliation script |
| `matched` | Actual cost matches estimated (within 5%) | ✅ No action needed |
| `discrepancy` | Costs differ by >5% | Check pricing, update if needed |
| `not_applicable` | No OpenAI request ID (internal actions) | N/A |

---

## 📈 Common Queries

### Check reconciliation status:

```sql
SELECT 
  reconciliation_status,
  COUNT(*) as count,
  SUM(actual_cost_cents) / 100.0 as cost_usd
FROM token_usage
WHERE openai_request_id IS NOT NULL
GROUP BY reconciliation_status;
```

### Find discrepancies:

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
LIMIT 20;
```

### Monthly cost comparison:

```sql
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as requests,
  SUM(calculated_cost_cents) / 100.0 as estimated_usd,
  SUM(actual_cost_cents) / 100.0 as actual_usd,
  SUM(actual_cost_cents - calculated_cost_cents) / 100.0 as diff_usd
FROM token_usage
WHERE openai_request_id IS NOT NULL
  AND reconciliation_status IN ('matched', 'discrepancy')
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;
```

---

## 🛠️ Handling Discrepancies

### Why do they happen?

1. **Pricing changes** - OpenAI updates pricing
2. **Model variants** - Different model versions
3. **Rounding** - Minor floating point differences

### How to fix:

1. **Check current OpenAI pricing:**
   - Visit https://openai.com/api/pricing/

2. **Update your pricing table:**
   ```sql
   UPDATE ai_model_pricing
   SET 
     input_price_per_1k = 0.15,  -- New price per 1M tokens / 1000
     output_price_per_1k = 0.60,
     updated_at = NOW()
   WHERE model_name = 'gpt-4o-mini' AND is_active = true;
   ```

3. **Re-run reconciliation:**
   ```bash
   npm run reconcile:openai ~/Downloads/openai-usage.csv
   ```

---

## 🔄 Monthly Routine

**Recommended schedule:** 1st of each month

1. Export previous month from OpenAI
2. Run: `npm run reconcile:openai path/to/csv`
3. Review discrepancies (should be <5%)
4. Update pricing if needed
5. Re-run if necessary
6. Archive CSV file for audit trail

---

## 🎯 Success Metrics

**Good reconciliation:**
- ✅ 95%+ matched
- ✅ <5% discrepancies
- ✅ <1% not found
- ✅ 0 errors

**If results differ:**
- Check OpenAI pricing changes
- Verify `openai_request_id` is being captured
- Review CSV format

---

## 🔗 API Integration

### Upload CSV via API:

```typescript
const formData = new FormData()
formData.append('csvContent', csvFileContent)

const response = await fetch('/api/admin/reconcile-openai-costs', {
  method: 'POST',
  body: JSON.stringify({
    csvContent: csvFileContent,
    dryRun: false
  }),
  headers: { 'Content-Type': 'application/json' }
})

const result = await response.json()
console.log(result.summary)
```

### Get summary:

```typescript
const response = await fetch('/api/admin/reconcile-openai-costs')
const data = await response.json()
console.log(data.summary)
console.log(data.discrepancies)
```

---

## 📁 File Reference

### Implementation Files

```
src/
├── lib/
│   └── openai/
│       └── reconciliation.ts          ← Core logic
└── app/
    └── api/
        └── admin/
            └── reconcile-openai-costs/
                └── route.ts            ← API endpoint

scripts/
└── database/
    ├── reconcile-openai-costs.ts      ← CLI script
    ├── sample-openai-usage.csv        ← Test data
    └── README-RECONCILIATION.md       ← Script docs

docs/
└── token-system/
    ├── README.md                      ← Index
    ├── RECONCILIATION_QUICK_START.md  ← Start here
    ├── OPENAI_RECONCILIATION_GUIDE.md ← Complete guide
    └── OPENAI_CSV_FORMAT.md           ← CSV reference
```

---

## ✅ Testing Checklist

- [ ] Test with sample CSV: `npm run reconcile:openai scripts/database/sample-openai-usage.csv`
- [ ] Export real data from OpenAI
- [ ] Run reconciliation on real data
- [ ] Check results in database
- [ ] Verify discrepancies make sense
- [ ] Update pricing if needed
- [ ] Test API endpoint (if using)
- [ ] Set up monthly routine

---

## 🆘 Troubleshooting

### "No valid billing rows found"
**Fix:** Check CSV format. Must have headers like `request_id`, `model`, `cost`

### "Most requests not found"
**Fix:** Normal if reconciling old data. Only recent requests (with `openai_request_id`) will match.

### "High discrepancy rate"
**Fix:** OpenAI likely changed pricing. Update `ai_model_pricing` table.

### "Authentication required"
**Fix:** Ensure user has `is_admin = true` in `user_profiles` table.

---

## 💡 Pro Tips

1. **Archive CSVs** - Keep OpenAI exports for audit trail
2. **Run monthly** - Don't wait too long between reconciliations
3. **Check trends** - Are estimates consistently high or low?
4. **Update pricing** - Keep `ai_model_pricing` current
5. **Test first** - Use sample CSV before running on production data

---

## 🎉 You're All Set!

Your OpenAI cost reconciliation system is ready to use. Start with the Quick Start guide:

👉 **[docs/token-system/RECONCILIATION_QUICK_START.md](docs/token-system/RECONCILIATION_QUICK_START.md)**

---

## 📚 Additional Resources

- **OpenAI Usage Dashboard:** https://platform.openai.com/usage
- **OpenAI Pricing:** https://openai.com/api/pricing/
- **Your Token Usage View:** Check `token_usage_with_costs` view in database

---

**Questions?** All documentation is in `docs/token-system/` directory.

