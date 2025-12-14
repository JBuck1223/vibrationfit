# OpenAI Cost Reconciliation - Complete Guide

**Last Updated:** December 13, 2024

---

## 🎯 Overview

This system allows you to reconcile your estimated OpenAI costs against actual billing from OpenAI. It matches API request IDs to update `actual_cost_cents` in your `token_usage` table.

---

## 📋 Prerequisites

1. ✅ Database migration applied: `20251116141218_add_openai_reconciliation_fields.sql`
2. ✅ Code updated to capture `openai_request_id` in all API calls
3. ✅ OpenAI billing data exported from OpenAI dashboard

---

## 📥 Getting OpenAI Usage Data

### Option 1: OpenAI Dashboard (Recommended)

1. Go to [OpenAI Usage Dashboard](https://platform.openai.com/usage)
2. Select date range (e.g., last month)
3. Click "Export" to download CSV
4. Save file (e.g., `openai-usage-2024-12.csv`)

### Option 2: OpenAI API (Limited)

OpenAI's API has limited per-request detail. The dashboard export is more complete.

---

## 🔄 Reconciliation Methods

### Method 1: Command Line Script (Recommended)

**Best for:** One-time reconciliation, testing, manual runs

```bash
# Install dependencies if needed
npm install

# Run reconciliation
npx tsx scripts/database/reconcile-openai-costs.ts ~/Downloads/openai-usage-2024-12.csv
```

**Output:**
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

### Method 2: Admin API Endpoint

**Best for:** Automated reconciliation, scheduled tasks, UI integration

**Endpoint:** `POST /api/admin/reconcile-openai-costs`

**Request:**
```typescript
const response = await fetch('/api/admin/reconcile-openai-costs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    csvContent: csvFileContent,
    dryRun: false // Set true to preview without updating
  })
})

const result = await response.json()
```

**Response:**
```json
{
  "message": "Reconciliation complete",
  "result": {
    "matched": 1180,
    "discrepancies": 42,
    "notFound": 12,
    "errors": []
  },
  "summary": {
    "total": 1234,
    "pending": 12,
    "matched": 1180,
    "discrepancies": 42,
    "totalEstimatedCents": 14567,
    "totalActualCents": 14823,
    "totalDifferenceCents": 256
  },
  "success": true
}
```

### Method 3: Get Summary (No Upload)

**Endpoint:** `GET /api/admin/reconcile-openai-costs`

```typescript
const response = await fetch('/api/admin/reconcile-openai-costs')
const data = await response.json()
```

**Response:**
```json
{
  "summary": {
    "total": 1234,
    "pending": 12,
    "matched": 1180,
    "discrepancies": 42,
    "totalEstimatedCents": 14567,
    "totalActualCents": 14823,
    "totalDifferenceCents": 256
  },
  "discrepancies": [
    {
      "id": "uuid",
      "action_type": "chat_conversation",
      "model_used": "gpt-4o",
      "calculated_cost_cents": 450,
      "actual_cost_cents": 475,
      "openai_request_id": "chatcmpl-abc123",
      "created_at": "2024-12-01T10:30:00Z"
    }
  ],
  "pendingCount": 12,
  "success": true
}
```

---

## 🔍 Understanding Reconciliation Status

| Status | Meaning |
|--------|---------|
| `pending` | OpenAI request ID captured, awaiting reconciliation |
| `matched` | Actual cost matches estimated (within 5% or $0.05) |
| `discrepancy` | Actual cost differs from estimate by >5% and >$0.05 |
| `not_applicable` | No OpenAI request ID (e.g., internal actions) |

---

## 📊 Querying Reconciled Data

### View Reconciliation Summary

```sql
SELECT 
  reconciliation_status,
  COUNT(*) as count,
  SUM(calculated_cost_cents) / 100.0 as estimated_usd,
  SUM(actual_cost_cents) / 100.0 as actual_usd,
  SUM(actual_cost_cents - calculated_cost_cents) / 100.0 as difference_usd
FROM token_usage
WHERE openai_request_id IS NOT NULL
GROUP BY reconciliation_status
ORDER BY reconciliation_status;
```

### Find Largest Discrepancies

```sql
SELECT 
  openai_request_id,
  action_type,
  model_used,
  calculated_cost_cents / 100.0 as estimated_usd,
  actual_cost_cents / 100.0 as actual_usd,
  (actual_cost_cents - calculated_cost_cents) / 100.0 as difference_usd,
  created_at
FROM token_usage
WHERE reconciliation_status = 'discrepancy'
ORDER BY ABS(actual_cost_cents - calculated_cost_cents) DESC
LIMIT 20;
```

### Check Pending Reconciliations

```sql
SELECT 
  COUNT(*) as pending_count,
  MIN(created_at) as oldest_pending,
  MAX(created_at) as newest_pending
FROM token_usage
WHERE reconciliation_status = 'pending';
```

### Monthly Cost Comparison

```sql
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as requests,
  SUM(calculated_cost_cents) / 100.0 as estimated_usd,
  SUM(actual_cost_cents) / 100.0 as actual_usd,
  SUM(actual_cost_cents - calculated_cost_cents) / 100.0 as difference_usd
FROM token_usage
WHERE openai_request_id IS NOT NULL
  AND reconciliation_status IN ('matched', 'discrepancy')
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;
```

---

## 🛠️ Handling Discrepancies

### Why Do Discrepancies Happen?

1. **Pricing updates** - OpenAI changes pricing, our table hasn't updated
2. **Rounding differences** - Minor floating point variations
3. **Model variants** - Different model versions with different prices
4. **Batch pricing** - OpenAI may batch certain requests

### Fixing Discrepancies

#### 1. Update Pricing Table

```sql
-- Check current pricing
SELECT * FROM ai_model_pricing WHERE is_active = true;

-- Update if OpenAI changed pricing
UPDATE ai_model_pricing
SET 
  input_price_per_1k = 0.15,  -- New price per 1M tokens / 1000
  output_price_per_1k = 0.60,
  updated_at = NOW()
WHERE model_name = 'gpt-4o-mini'
  AND is_active = true;
```

#### 2. Re-reconcile After Price Update

Run the reconciliation script again. Records will be updated with new calculations.

#### 3. Accept Small Discrepancies

If discrepancies are <1%, consider them acceptable:

```sql
UPDATE token_usage
SET reconciliation_status = 'matched'
WHERE reconciliation_status = 'discrepancy'
  AND ABS(actual_cost_cents - calculated_cost_cents) / NULLIF(calculated_cost_cents, 0) < 0.01;
```

---

## 🔄 Automated Reconciliation

### Option 1: Cron Job (Server)

```bash
# Add to crontab (runs monthly on 1st at 2am)
0 2 1 * * cd /path/to/vibrationfit && npx tsx scripts/database/reconcile-openai-costs.ts ~/openai-exports/latest.csv >> /var/log/openai-reconcile.log 2>&1
```

### Option 2: Vercel Cron (Recommended)

Create a Vercel cron endpoint:

```typescript
// src/app/api/cron/reconcile-openai/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch OpenAI usage via API or trigger manual upload flow
  // ... reconciliation logic ...

  return NextResponse.json({ success: true })
}
```

Add to `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/reconcile-openai",
    "schedule": "0 2 1 * *"
  }]
}
```

---

## 🎯 Best Practices

1. **Monthly Reconciliation** - Run at the start of each month for previous month
2. **Keep CSV Files** - Archive OpenAI exports for audit trail
3. **Review Discrepancies** - Investigate large differences (>5%)
4. **Update Pricing** - Keep `ai_model_pricing` table current
5. **Monitor Trends** - Track if estimates consistently over/under actual

---

## 📚 Files Reference

| File | Purpose |
|------|---------|
| `src/lib/openai/reconciliation.ts` | Core reconciliation logic |
| `src/app/api/admin/reconcile-openai-costs/route.ts` | Admin API endpoint |
| `scripts/database/reconcile-openai-costs.ts` | CLI reconciliation script |
| `supabase/migrations/20251116141218_add_openai_reconciliation_fields.sql` | Database schema |

---

## 🆘 Troubleshooting

### "No valid billing rows found"

**Cause:** CSV format not recognized  
**Fix:** Check CSV headers match expected format (request_id, model, cost, etc.)

### "Request ID not found in database"

**Cause:** OpenAI billing includes requests not in your DB  
**Fix:** Normal if you're reconciling old data. Only recent requests should match.

### "Discrepancy: Estimated $X, Actual $Y"

**Cause:** Pricing difference  
**Fix:** Update `ai_model_pricing` table with current OpenAI prices

### "Authentication required"

**Cause:** Not logged in as admin  
**Fix:** Ensure user has `is_admin = true` in `user_profiles`

---

## 🚀 Quick Start Checklist

- [ ] Export usage CSV from OpenAI dashboard
- [ ] Run: `npx tsx scripts/database/reconcile-openai-costs.ts path/to/csv`
- [ ] Review summary output
- [ ] Check for discrepancies
- [ ] Update pricing if needed
- [ ] Re-run reconciliation
- [ ] Set up monthly cron job

---

**Questions?** Check the implementation files or run with `--help` flag for more options.

