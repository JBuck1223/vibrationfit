# Fetch Real OpenAI Costs - Quick Guide

**What this does:** Fetches **aggregated billing totals** from OpenAI's API and updates your `actual_cost_cents` field for verification.

**Important:** OpenAI doesn't provide per-request costs. This fetches daily/monthly totals and distributes them proportionally across your records for verification purposes. Your `calculated_cost_cents` (from tokens) is your actual cost - this just verifies it's accurate.

---

## 🚀 Quick Start

### Fetch costs for yesterday:
```bash
npm run fetch:real-costs
```

### Fetch costs for specific date range:
```bash
npm run fetch:real-costs 2024-12-01 2024-12-13
```

---

## 📊 What Happens

1. **Fetches real costs** from OpenAI's Costs API (`/v1/organization/costs`)
2. **Gets total actual cost** for your date range
3. **Updates pending records** in `token_usage` table
4. **Calculates proportional costs** based on actual vs estimated
5. **Sets reconciliation_status** to `matched` or `discrepancy`

---

## 📈 Example Output

```bash
$ npm run fetch:real-costs 2024-12-01 2024-12-13

🚀 Fetching Real OpenAI Costs

📅 Date Range: 2024-12-01 to 2024-12-13
📊 Found 1,234 pending records to reconcile

🔄 Fetching real costs from OpenAI...
Reconciling 1,234 records
Total estimated: $145.67
Total actual: $148.23
Scaling factor: 1.0176

✅ Reconciliation Complete!

📊 Summary:
   Records Updated: 1,234
   Total Actual Cost: $148.23

📈 Reconciliation Status:
   matched: 1,180
   discrepancy: 54
```

---

## 🔍 How It Works (Important!)

**OpenAI's API returns aggregated daily/monthly costs**, not per-request costs. This means:

1. Gets total actual cost from OpenAI for the date range (e.g., $148.23 for Dec 1-13)
2. Gets total calculated cost from your database for same range (e.g., $145.67)
3. Calculates scaling factor: `actual / calculated` (e.g., 1.0176)
4. Applies proportional adjustment to each record

**Example:**
- Your calculated total: $145.67
- OpenAI's actual total: $148.23
- Scaling factor: 1.0176
- Each record's `actual_cost_cents = calculated_cost_cents * 1.0176`

**What this means:**
- `calculated_cost_cents` = Your real per-request cost (from tokens)
- `actual_cost_cents` = Verification value (proportional share of aggregate)
- Use `calculated_cost_cents` for billing/reporting
- Use `actual_cost_cents` to verify your pricing table is accurate

---

## 📋 API Endpoints

### Fetch real costs:
```bash
POST /api/admin/fetch-real-costs
```

**Body:**
```json
{
  "startDate": "2024-12-01",
  "endDate": "2024-12-13"
}
```

**Response:**
```json
{
  "message": "Real costs fetched and updated",
  "updated": 1234,
  "totalActualCost": 14823,
  "totalActualCostUSD": "148.23",
  "errors": [],
  "success": true
}
```

### Check pending:
```bash
GET /api/admin/fetch-real-costs
```

**Response:**
```json
{
  "pendingCount": 1234,
  "oldestPending": "2024-12-01T10:30:00Z",
  "recommendedAction": "Run reconciliation to update actual costs",
  "success": true
}
```

---

## 🔄 Daily Routine

**Run daily to keep costs updated:**

```bash
# Add to cron (runs daily at 2am)
0 2 * * * cd /path/to/vibrationfit && npm run fetch:real-costs >> /var/log/openai-costs.log 2>&1
```

Or use Vercel cron:
```json
{
  "crons": [{
    "path": "/api/admin/fetch-real-costs",
    "schedule": "0 2 * * *"
  }]
}
```

---

## 📊 Check Results

```sql
-- See reconciliation status
SELECT 
  reconciliation_status,
  COUNT(*) as count,
  SUM(actual_cost_cents) / 100.0 as actual_cost_usd
FROM token_usage
WHERE reconciliation_status IN ('matched', 'discrepancy')
GROUP BY reconciliation_status;

-- Compare estimated vs actual
SELECT 
  DATE(created_at) as date,
  SUM(calculated_cost_cents) / 100.0 as estimated_usd,
  SUM(actual_cost_cents) / 100.0 as actual_usd,
  (SUM(actual_cost_cents) - SUM(calculated_cost_cents)) / 100.0 as diff_usd
FROM token_usage
WHERE reconciliation_status IN ('matched', 'discrepancy')
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## ⚠️ Important Notes

1. **OpenAI's API gives aggregated costs**, not per-request costs
2. **Costs are prorated** across all requests in the date range
3. **Run regularly** (daily) for best accuracy
4. **Old data may not be available** from OpenAI's API (typically 30-90 days)

---

## 🆘 Troubleshooting

### "No cost data returned from OpenAI"
- OpenAI's Costs API may have delays (24-48 hours)
- Try fetching costs for 2-3 days ago instead of yesterday

### "No pending records to reconcile"
- All records already reconciled
- Or no records have `openai_request_id` in that date range

### "Authentication error"
- Check `OPENAI_API_KEY` is set in `.env.local`
- Verify API key has organization access

---

**That's it!** Your database now has REAL costs from OpenAI.

