# OpenAI Cost Reconciliation Scripts

This directory contains scripts for reconciling OpenAI costs against actual billing.

---

## 📁 Files

| File | Purpose |
|------|---------|
| `reconcile-openai-costs.ts` | Main reconciliation script |
| `sample-openai-usage.csv` | Sample CSV for testing |

---

## 🚀 Quick Start

### 1. Export from OpenAI

Visit https://platform.openai.com/usage and export your usage data as CSV.

### 2. Run Reconciliation

```bash
# From project root
npm run reconcile:openai ~/Downloads/openai-usage.csv

# Or directly
npx tsx scripts/database/reconcile-openai-costs.ts ~/Downloads/openai-usage.csv
```

### 3. Test with Sample Data

```bash
# Use the included sample CSV for testing
npm run reconcile:openai scripts/database/sample-openai-usage.csv
```

---

## 📊 What It Does

1. **Parses CSV** - Reads OpenAI's usage export
2. **Matches Records** - Finds matching requests in your database by `openai_request_id`
3. **Compares Costs** - Checks estimated vs actual costs
4. **Updates Database** - Sets `actual_cost_cents` and `reconciliation_status`
5. **Reports Results** - Shows matched, discrepancies, and not found

---

## 🔍 Output Example

```
🚀 Starting OpenAI Cost Reconciliation
📁 CSV File: /Users/you/Downloads/openai-usage-2024-12.csv

📋 Parsing CSV...
✅ Found 1,234 billing rows

📊 Preview (first 3 rows):
  1. Request: chatcmpl-abc123, Model: gpt-4o-mini, Cost: $0.0012
  2. Request: chatcmpl-def456, Model: gpt-4o, Cost: $0.0450
  3. Request: chatcmpl-ghi789, Model: gpt-4o-mini, Cost: $0.0008

🔄 Reconciling...
📊 Progress: 10/1234
📊 Progress: 20/1234
...

✅ Reconciliation Complete!

📊 Summary:
   ✅ Matched: 1,180
   ⚠️  Discrepancies: 42
   ❓ Not Found: 12
   ❌ Errors: 0

💰 Cost Summary:
   Estimated Total: $145.67
   Actual Total: $148.23
   Difference: $2.56 (+1.8%)
```

---

## 🎯 Understanding Results

### Matched ✅
Actual cost matches estimated cost (within 5% or $0.05). No action needed.

### Discrepancies ⚠️
Actual cost differs from estimate by more than 5%. Common causes:
- OpenAI changed pricing
- Model variant pricing differences
- Rounding differences

**Action:** Check if pricing needs updating in `ai_model_pricing` table.

### Not Found ❓
Request ID in OpenAI export but not in your database. Common causes:
- Old data (before you started capturing request IDs)
- Requests from different environment
- API calls not tracked in your system

**Action:** Normal if reconciling old data. Only recent requests should match.

### Errors ❌
Failed to process a row. Check error messages in output.

**Action:** Review error details and fix data issues.

---

## 🛠️ Troubleshooting

### "No valid billing rows found"

**Cause:** CSV format not recognized  
**Fix:** Check CSV has headers like `request_id`, `model`, `cost`

### "Most requests not found"

**Cause:** Normal if reconciling old data  
**Fix:** Only requests after deploying reconciliation tracking will match

### "High discrepancy rate"

**Cause:** Pricing may have changed  
**Fix:** Update `ai_model_pricing` table with current OpenAI prices

```sql
UPDATE ai_model_pricing
SET 
  input_price_per_1k = 0.15,
  output_price_per_1k = 0.60,
  updated_at = NOW()
WHERE model_name = 'gpt-4o-mini' AND is_active = true;
```

---

## 📚 Full Documentation

See `docs/token-system/` for complete documentation:
- `RECONCILIATION_QUICK_START.md` - Quick setup guide
- `OPENAI_RECONCILIATION_GUIDE.md` - Complete reference
- `OPENAI_CSV_FORMAT.md` - CSV format details

---

## 🔄 Monthly Routine

**Recommended schedule:** 1st of each month

1. Export previous month from OpenAI
2. Run: `npm run reconcile:openai path/to/csv`
3. Review discrepancies
4. Update pricing if needed
5. Re-run if necessary
6. Archive CSV file

---

## 💡 Pro Tips

1. **Test first** - Use `sample-openai-usage.csv` to test the script
2. **Keep CSVs** - Archive OpenAI exports for audit trail
3. **Run monthly** - Don't wait too long between reconciliations
4. **Check trends** - Are estimates consistently high or low?
5. **Update pricing** - Keep `ai_model_pricing` current with OpenAI

---

**Questions?** Check the full documentation in `docs/token-system/`

