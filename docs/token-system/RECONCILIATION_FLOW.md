# OpenAI Cost Reconciliation - Flow Diagram

**Last Updated:** December 13, 2024

---

## 🔄 Complete Reconciliation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    1. CAPTURE PHASE (Ongoing)                    │
└─────────────────────────────────────────────────────────────────┘

User makes API call
       ↓
Your API route (e.g., /api/viva/chat)
       ↓
generateText() in src/lib/ai/client.ts
       ↓
OpenAI API
       ↓
Response includes:
  - openai_request_id: "chatcmpl-abc123"
  - openai_created: 1701234567
  - system_fingerprint: "fp_44709d6fcb"
  - usage: { prompt_tokens, completion_tokens }
       ↓
trackTokenUsage() saves to database:
  - openai_request_id ✓
  - calculated_cost_cents (estimated)
  - reconciliation_status: "pending"
       ↓
Database now has: Request ID + Estimated Cost


┌─────────────────────────────────────────────────────────────────┐
│                  2. EXPORT PHASE (Monthly)                       │
└─────────────────────────────────────────────────────────────────┘

Visit https://platform.openai.com/usage
       ↓
Select date range (e.g., "Last 30 days")
       ↓
Click "Export" → Download CSV
       ↓
Save to ~/Downloads/openai-usage-2024-12.csv


┌─────────────────────────────────────────────────────────────────┐
│               3. RECONCILIATION PHASE (Monthly)                  │
└─────────────────────────────────────────────────────────────────┘

Run: npm run reconcile:openai ~/Downloads/openai-usage.csv
       ↓
┌──────────────────────────────────────────────────────────────┐
│  parseOpenAIBillingCSV()                                     │
│  - Read CSV file                                             │
│  - Parse headers (flexible matching)                         │
│  - Extract: request_id, model, tokens, cost                  │
│  - Return array of billing rows                              │
└──────────────────────────────────────────────────────────────┘
       ↓
For each billing row:
       ↓
┌──────────────────────────────────────────────────────────────┐
│  reconcileByRequestId()                                      │
│  1. Query database for matching openai_request_id           │
│  2. If found:                                                │
│     - Get calculated_cost_cents (estimated)                  │
│     - Get actual_cost_cents from CSV                         │
│     - Calculate difference                                   │
│  3. Determine status:                                        │
│     - If diff <= 5% or $0.05 → "matched"                    │
│     - If diff > 5% and > $0.05 → "discrepancy"             │
│  4. Update database:                                         │
│     - actual_cost_cents = CSV cost                          │
│     - reconciliation_status = matched/discrepancy           │
│     - reconciled_at = NOW()                                 │
│  5. If not found → "not_found" (normal for old data)        │
└──────────────────────────────────────────────────────────────┘
       ↓
Generate summary:
  - Matched: 1,180 (95%)
  - Discrepancies: 42 (3%)
  - Not Found: 12 (1%)
  - Errors: 0
       ↓
Display cost comparison:
  - Estimated Total: $145.67
  - Actual Total: $148.23
  - Difference: +$2.56 (+1.8%)


┌─────────────────────────────────────────────────────────────────┐
│                    4. REVIEW PHASE (As Needed)                   │
└─────────────────────────────────────────────────────────────────┘

If discrepancies > 5%:
       ↓
Check OpenAI pricing changes
       ↓
Update ai_model_pricing table:
  UPDATE ai_model_pricing
  SET input_price_per_1k = 0.15,
      output_price_per_1k = 0.60
  WHERE model_name = 'gpt-4o-mini'
       ↓
Re-run reconciliation:
  npm run reconcile:openai ~/Downloads/openai-usage.csv
       ↓
Verify discrepancies reduced
```

---

## 📊 Database State Changes

### Before Reconciliation

```sql
SELECT 
  openai_request_id,
  calculated_cost_cents,
  actual_cost_cents,
  reconciliation_status
FROM token_usage
WHERE openai_request_id = 'chatcmpl-abc123';
```

**Result:**
```
openai_request_id   | calculated_cost_cents | actual_cost_cents | reconciliation_status
--------------------+-----------------------+-------------------+----------------------
chatcmpl-abc123     | 120                   | NULL              | pending
```

### After Reconciliation

```sql
-- Same query
```

**Result:**
```
openai_request_id   | calculated_cost_cents | actual_cost_cents | reconciliation_status
--------------------+-----------------------+-------------------+----------------------
chatcmpl-abc123     | 120                   | 122               | matched
```

---

## 🔍 Matching Logic

### Primary: Match by Request ID

```
CSV Row:
  request_id: "chatcmpl-abc123"
  cost_usd: 0.00122

Database Query:
  SELECT * FROM token_usage
  WHERE openai_request_id = 'chatcmpl-abc123'

Match Found:
  calculated_cost_cents: 120
  actual_cost_cents: 122 (from CSV)
  difference: 2 cents (1.7%)
  
Status: "matched" (within 5% threshold)
```

### Fallback: Match by Timestamp + Model

```
CSV Row:
  timestamp: "2024-12-01 10:30:45"
  model: "gpt-4o-mini"
  cost_usd: 0.00122

Database Query:
  SELECT * FROM token_usage
  WHERE model_used = 'gpt-4o-mini'
    AND created_at BETWEEN '2024-12-01 10:29:45' AND '2024-12-01 10:31:45'
    AND reconciliation_status IS NULL
  LIMIT 1

Match Found: (less precise, but works for old data)
```

---

## 🎯 Status Decision Tree

```
For each matched record:

Calculate difference:
  diff = actual_cost_cents - calculated_cost_cents
  diff_percent = (diff / calculated_cost_cents) * 100

                    ┌─────────────────┐
                    │  Check Diff %   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  diff <= 5%     │
                    │  OR              │
                    │  diff <= $0.05   │
                    └────────┬────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
            YES │                         │ NO
                │                         │
        ┌───────▼────────┐        ┌──────▼──────┐
        │  Status:       │        │  Status:     │
        │  "matched"     │        │  "discrepancy"│
        └────────────────┘        └──────────────┘
```

---

## 💰 Cost Calculation

### In Your System (Estimated)

```typescript
// src/lib/tokens/tracking.ts
const inputCost = (inputTokens / 1000) * pricing.input_price_per_1k
const outputCost = (outputTokens / 1000) * pricing.output_price_per_1k
const calculatedCostCents = Math.round((inputCost + outputCost) * 100)
```

### From OpenAI (Actual)

```typescript
// src/lib/openai/reconciliation.ts
const actualCostCents = Math.round(csvRow.cost_usd * 100)
```

### Comparison

```
Estimated: $0.0120 (120 cents)
Actual:    $0.0122 (122 cents)
Diff:      $0.0002 (2 cents)
Percent:   1.7%
Status:    "matched" ✓
```

---

## 🔄 Monthly Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    MONTHLY ROUTINE                               │
└─────────────────────────────────────────────────────────────────┘

Day 1 of Month:
  ↓
1. Export previous month from OpenAI
   Time: 2 minutes
   ↓
2. Run reconciliation script
   Command: npm run reconcile:openai path/to/csv
   Time: 1 minute
   ↓
3. Review results
   Check: matched vs discrepancies
   Time: 2 minutes
   ↓
4. If discrepancies > 5%:
   ├─→ Check OpenAI pricing
   ├─→ Update ai_model_pricing table
   └─→ Re-run reconciliation
   Time: 5 minutes (if needed)
   ↓
5. Archive CSV file
   Location: ~/openai-exports/2024-12.csv
   Time: 1 minute
   ↓
TOTAL TIME: 5-10 minutes/month
```

---

## 📈 Reporting Flow

```
After reconciliation:

┌──────────────────────────────────────────────────────────────┐
│  getReconciliationSummary()                                  │
│  - Query all reconciled records                              │
│  - Count by status                                           │
│  - Sum estimated costs                                       │
│  - Sum actual costs                                          │
│  - Calculate total difference                                │
└──────────────────────────────────────────────────────────────┘
       ↓
Display summary:
  Total records: 1,234
  Pending: 12 (1%)
  Matched: 1,180 (95%)
  Discrepancies: 42 (3%)
  
  Estimated Total: $145.67
  Actual Total: $148.23
  Difference: +$2.56 (+1.8%)
       ↓
Query discrepancies:
  SELECT * FROM token_usage
  WHERE reconciliation_status = 'discrepancy'
  ORDER BY ABS(actual_cost_cents - calculated_cost_cents) DESC
  LIMIT 20
       ↓
Review largest differences:
  1. chatcmpl-xyz: Est $0.45, Act $0.52, Diff +$0.07 (15%)
  2. chatcmpl-abc: Est $0.12, Act $0.14, Diff +$0.02 (17%)
  ...
```

---

## 🎯 Success Metrics

```
Good Reconciliation:
├─ Matched: 95-99%
├─ Discrepancies: 1-5%
├─ Not Found: 0-1%
└─ Errors: 0%

Pricing Update Needed:
├─ Matched: 50-70%
├─ Discrepancies: 30-50%
├─ Not Found: 0-1%
└─ Errors: 0%

First Run (No Historical Data):
├─ Matched: 0%
├─ Discrepancies: 0%
├─ Not Found: 100%
└─ Errors: 0%
```

---

## 🔗 Integration Points

```
┌─────────────────────────────────────────────────────────────────┐
│                    SYSTEM INTEGRATION                            │
└─────────────────────────────────────────────────────────────────┘

Your API Routes
  ↓
src/lib/ai/client.ts
  ↓ (captures request_id)
src/lib/tokens/tracking.ts
  ↓ (saves to database)
Database: token_usage table
  ↓ (monthly reconciliation)
src/lib/openai/reconciliation.ts
  ↓ (updates actual costs)
Database: token_usage table (updated)
  ↓
Admin Dashboard / Reports
```

---

## 📚 Related Documentation

- **Quick Start:** `RECONCILIATION_QUICK_START.md`
- **Complete Guide:** `OPENAI_RECONCILIATION_GUIDE.md`
- **CSV Format:** `OPENAI_CSV_FORMAT.md`
- **Implementation:** `IMPLEMENTATION_SUMMARY.md`

---

**Visual learner?** This flow diagram shows the complete reconciliation process from API call to final reporting.

