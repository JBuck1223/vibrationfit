# OpenAI Cost Reconciliation - Troubleshooting Guide

**Last Updated:** December 13, 2024

---

## 🆘 Common Issues and Solutions

### Issue: "No valid billing rows found in CSV"

**Symptoms:**
```
📋 Parsing CSV...
❌ No valid billing rows found in CSV
```

**Causes:**
1. CSV file is empty
2. CSV headers don't match expected format
3. CSV is corrupted

**Solutions:**

1. **Check file content:**
   ```bash
   head -5 ~/Downloads/openai-usage.csv
   ```
   Should show headers and data rows.

2. **Verify headers:**
   CSV must have at least one of these combinations:
   - `request_id` or `id`
   - `timestamp` or `created` or `date`
   - `model`

3. **Check CSV format:**
   ```csv
   request_id,timestamp,model,prompt_tokens,completion_tokens,cost_usd
   chatcmpl-abc123,2024-12-01 10:30:45,gpt-4o-mini,150,75,0.0012
   ```

4. **Try sample CSV first:**
   ```bash
   npm run reconcile:openai scripts/database/sample-openai-usage.csv
   ```

---

### Issue: "Most requests not found in database"

**Symptoms:**
```
📊 Summary:
   ✅ Matched: 0
   ⚠️  Discrepancies: 0
   ❓ Not Found: 1,234 (100%)
```

**Causes:**
1. Reconciling old data (before request ID tracking was implemented)
2. CSV from different environment/account
3. Request IDs not being captured in your system

**Solutions:**

1. **Check if request IDs are being captured:**
   ```sql
   SELECT 
     COUNT(*) as total,
     COUNT(openai_request_id) as with_request_id,
     COUNT(openai_request_id)::float / COUNT(*) * 100 as percentage
   FROM token_usage
   WHERE created_at > NOW() - INTERVAL '7 days';
   ```

   **Expected:** 95%+ should have request IDs

2. **Verify recent data:**
   ```sql
   SELECT 
     openai_request_id,
     action_type,
     created_at
   FROM token_usage
   WHERE created_at > NOW() - INTERVAL '1 day'
   ORDER BY created_at DESC
   LIMIT 10;
   ```

   **Expected:** Recent records should have `openai_request_id` populated

3. **Check date range:**
   Only reconcile data from after you deployed request ID tracking (Nov 2025 or later).

4. **Verify environment:**
   Make sure CSV is from the same OpenAI account as your production system.

---

### Issue: "High discrepancy rate (>20%)"

**Symptoms:**
```
📊 Summary:
   ✅ Matched: 500
   ⚠️  Discrepancies: 700 (58%)
```

**Causes:**
1. OpenAI changed pricing
2. Your pricing table is outdated
3. Model name mismatch

**Solutions:**

1. **Check OpenAI's current pricing:**
   Visit https://openai.com/api/pricing/

2. **Compare with your pricing table:**
   ```sql
   SELECT 
     model_name,
     input_price_per_1k,
     output_price_per_1k,
     updated_at
   FROM ai_model_pricing
   WHERE is_active = true
   ORDER BY model_name;
   ```

3. **Update pricing (example for gpt-4o-mini):**
   ```sql
   UPDATE ai_model_pricing
   SET 
     input_price_per_1k = 0.15,   -- $0.15 per 1M tokens / 1000
     output_price_per_1k = 0.60,  -- $0.60 per 1M tokens / 1000
     updated_at = NOW()
   WHERE model_name = 'gpt-4o-mini' AND is_active = true;
   ```

4. **Re-run reconciliation:**
   ```bash
   npm run reconcile:openai ~/Downloads/openai-usage.csv
   ```

5. **Check model names match:**
   ```sql
   -- Your database
   SELECT DISTINCT model_used FROM token_usage;
   
   -- Should match CSV model names exactly
   ```

---

### Issue: "Authentication required" (API endpoint)

**Symptoms:**
```json
{
  "error": "Authentication required"
}
```

**Causes:**
1. Not logged in
2. Session expired
3. Not an admin user

**Solutions:**

1. **Check if logged in:**
   ```sql
   SELECT 
     user_id,
     email,
     is_admin
   FROM user_profiles
   WHERE user_id = 'YOUR_USER_ID';
   ```

2. **Grant admin access:**
   ```sql
   UPDATE user_profiles
   SET is_admin = true
   WHERE user_id = 'YOUR_USER_ID';
   ```

3. **Use CLI script instead:**
   The CLI script uses service role key, doesn't require authentication:
   ```bash
   npm run reconcile:openai ~/Downloads/openai-usage.csv
   ```

---

### Issue: "tsx: command not found"

**Symptoms:**
```bash
sh: tsx: command not found
```

**Causes:**
1. `tsx` not installed globally
2. Using wrong command

**Solutions:**

1. **Use npx (recommended):**
   ```bash
   npx tsx scripts/database/reconcile-openai-costs.ts path/to/csv
   ```

2. **Or use npm script:**
   ```bash
   npm run reconcile:openai path/to/csv
   ```

3. **Install tsx globally (optional):**
   ```bash
   npm install -g tsx
   ```

---

### Issue: "Cost column missing" or "Cost is $0.00"

**Symptoms:**
```
⚠️  Discrepancy: chatcmpl-abc123
   Estimated: $0.0012, Actual: $0.0000, Diff: -$0.0012
```

**Causes:**
1. OpenAI CSV doesn't include cost column
2. Cost column has different name
3. Cost values are missing

**Solutions:**

1. **Check CSV headers:**
   ```bash
   head -1 ~/Downloads/openai-usage.csv
   ```

2. **Script will calculate cost if missing:**
   The reconciliation script can calculate cost from tokens:
   ```typescript
   // Automatic calculation if cost_usd is missing
   const actualCostCents = calculateOpenAICost(
     row.model,
     row.prompt_tokens,
     row.completion_tokens
   )
   ```

3. **Ensure token columns exist:**
   CSV must have `prompt_tokens` and `completion_tokens` if `cost` is missing.

---

### Issue: "Database connection error"

**Symptoms:**
```
❌ Error fetching record: Connection refused
```

**Causes:**
1. Supabase credentials not configured
2. Network issue
3. Database is down

**Solutions:**

1. **Check environment variables:**
   ```bash
   # In .env.local
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   ```

2. **Test connection:**
   ```bash
   npx supabase db ping
   ```

3. **Check Supabase status:**
   Visit https://status.supabase.com/

4. **Verify credentials:**
   ```bash
   # Test with psql
   psql "postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres"
   ```

---

### Issue: "Script runs but no updates in database"

**Symptoms:**
```
✅ Matched: 1,234
```
But database shows no changes.

**Causes:**
1. Dry-run mode enabled (API only)
2. Database transaction rolled back
3. Wrong database environment

**Solutions:**

1. **Check dry-run mode (API):**
   ```typescript
   // Make sure dryRun is false
   fetch('/api/admin/reconcile-openai-costs', {
     body: JSON.stringify({
       csvContent: csv,
       dryRun: false  // ← Must be false
     })
   })
   ```

2. **Verify updates:**
   ```sql
   SELECT 
     COUNT(*) as total_reconciled,
     MAX(reconciled_at) as last_reconciliation
   FROM token_usage
   WHERE reconciliation_status IN ('matched', 'discrepancy');
   ```

3. **Check for errors in logs:**
   ```bash
   # Check terminal output for error messages
   ```

---

### Issue: "Percentage shows NaN%"

**Symptoms:**
```
💰 Cost Summary:
   Difference: $0.00 (NaN%)
```

**Causes:**
1. No reconciled records yet
2. All estimated costs are $0.00
3. Division by zero

**Solutions:**

1. **Normal for first run:**
   If all requests are "not found", this is expected.

2. **Wait for matching data:**
   Only records with matching request IDs will show cost comparison.

3. **Check if costs are being calculated:**
   ```sql
   SELECT 
     COUNT(*) as total,
     COUNT(NULLIF(calculated_cost_cents, 0)) as with_cost
   FROM token_usage
   WHERE created_at > NOW() - INTERVAL '7 days';
   ```

---

## 🔍 Diagnostic Queries

### Check system health:

```sql
-- Overall reconciliation status
SELECT 
  reconciliation_status,
  COUNT(*) as count,
  ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER () * 100, 1) as percentage
FROM token_usage
WHERE openai_request_id IS NOT NULL
GROUP BY reconciliation_status
ORDER BY count DESC;
```

### Find problematic records:

```sql
-- Records with request ID but no reconciliation
SELECT 
  id,
  openai_request_id,
  action_type,
  created_at,
  reconciliation_status
FROM token_usage
WHERE openai_request_id IS NOT NULL
  AND reconciliation_status IS NULL
ORDER BY created_at DESC
LIMIT 10;
```

### Check recent activity:

```sql
-- Recent reconciliations
SELECT 
  DATE(reconciled_at) as date,
  COUNT(*) as reconciled_count,
  SUM(CASE WHEN reconciliation_status = 'matched' THEN 1 ELSE 0 END) as matched,
  SUM(CASE WHEN reconciliation_status = 'discrepancy' THEN 1 ELSE 0 END) as discrepancies
FROM token_usage
WHERE reconciled_at IS NOT NULL
GROUP BY DATE(reconciled_at)
ORDER BY date DESC
LIMIT 7;
```

---

## 📊 Validation Checklist

Before reconciliation:
- [ ] OpenAI CSV exported successfully
- [ ] CSV file has headers
- [ ] CSV file has data rows
- [ ] Environment variables configured
- [ ] Database is accessible

After reconciliation:
- [ ] Script completed without errors
- [ ] Matched percentage is reasonable (>80%)
- [ ] Discrepancies are reviewed
- [ ] Database records updated
- [ ] Cost summary makes sense

---

## 🆘 Getting Help

### 1. Check Documentation
- Quick Start: `RECONCILIATION_QUICK_START.md`
- Complete Guide: `OPENAI_RECONCILIATION_GUIDE.md`
- CSV Format: `OPENAI_CSV_FORMAT.md`
- Flow Diagram: `RECONCILIATION_FLOW.md`

### 2. Review Script Output
The script provides detailed error messages. Look for:
- ❌ Error messages
- ⚠️ Warnings
- 📊 Summary statistics

### 3. Check Database Logs
```sql
-- Recent errors in token_usage
SELECT 
  error_message,
  COUNT(*) as count
FROM token_usage
WHERE error_message IS NOT NULL
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY error_message;
```

### 4. Test with Sample Data
```bash
# Always works - good for testing
npm run reconcile:openai scripts/database/sample-openai-usage.csv
```

---

## 💡 Pro Tips

1. **Start small:** Test with 1 month of data before reconciling everything
2. **Keep CSVs:** Archive exports for future reference
3. **Run regularly:** Monthly reconciliation is easier than yearly
4. **Check pricing:** OpenAI updates pricing occasionally
5. **Monitor trends:** Are discrepancies increasing over time?

---

## 🔗 Related Resources

- **OpenAI Status:** https://status.openai.com/
- **OpenAI Pricing:** https://openai.com/api/pricing/
- **OpenAI Usage:** https://platform.openai.com/usage
- **Supabase Status:** https://status.supabase.com/

---

**Still stuck?** Review the implementation files for detailed comments and logic.

