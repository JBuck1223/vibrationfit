# OpenAI CSV Export Format Reference

**Last Updated:** December 13, 2024

---

## 📋 Expected CSV Format

The reconciliation script expects a CSV file from OpenAI's usage dashboard with the following columns:

### Required Columns

| Column Name | Type | Example | Description |
|-------------|------|---------|-------------|
| `request_id` or `id` | string | `chatcmpl-abc123xyz` | Unique OpenAI request identifier |
| `timestamp` or `created` or `date` | datetime | `2024-12-01 10:30:45` | When the request was made |
| `model` | string | `gpt-4o-mini` | Model used for the request |
| `prompt_tokens` or `input_tokens` | integer | `150` | Number of input tokens |
| `completion_tokens` or `output_tokens` | integer | `75` | Number of output tokens |
| `total_tokens` | integer | `225` | Total tokens used |
| `cost` or `amount` or `cost_usd` | decimal | `0.0012` | Cost in USD |

### Optional Columns

These are helpful but not required:

- `user_id` - Your OpenAI user/org identifier
- `endpoint` - API endpoint used (e.g., `/v1/chat/completions`)
- `status` - Request status (success, error)

---

## 📄 Sample CSV

```csv
request_id,timestamp,model,prompt_tokens,completion_tokens,total_tokens,cost_usd
chatcmpl-abc123,2024-12-01 10:30:45,gpt-4o-mini,150,75,225,0.0012
chatcmpl-def456,2024-12-01 10:31:12,gpt-4o,200,100,300,0.0450
chatcmpl-ghi789,2024-12-01 10:32:05,gpt-4o-mini,180,90,270,0.0015
```

---

## 🔄 How to Export from OpenAI

### Method 1: Usage Dashboard (Recommended)

1. Visit https://platform.openai.com/usage
2. Select your date range
3. Click "Export" button (top right)
4. Choose "CSV" format
5. Download file

### Method 2: Organization Settings

1. Visit https://platform.openai.com/settings/organization/billing/overview
2. Go to "Usage" tab
3. Select date range
4. Click "Export usage data"
5. Download CSV

---

## 🔍 CSV Format Variations

OpenAI's CSV format may vary slightly. The reconciliation script is flexible and looks for common column name patterns:

### Request ID Variations
- `request_id`
- `id`
- `request-id`
- Any column containing "request" and "id"

### Timestamp Variations
- `timestamp`
- `created`
- `date`
- `time`
- Any column containing "timestamp" or "date"

### Token Variations
- `prompt_tokens` / `input_tokens`
- `completion_tokens` / `output_tokens`
- `total_tokens`

### Cost Variations
- `cost`
- `cost_usd`
- `amount`
- `price`
- Any column containing "cost" or "amount"

---

## 🛠️ Testing Your CSV

Before running full reconciliation, test with a small sample:

```bash
# Create a test CSV with just 5 rows
head -6 openai-usage.csv > test-sample.csv

# Run reconciliation on test file
npm run reconcile:openai test-sample.csv
```

Expected output:
```
📋 CSV Headers: request_id, timestamp, model, prompt_tokens, completion_tokens, total_tokens, cost_usd
✅ Found 5 billing rows

📊 Preview (first 3 rows):
  1. Request: chatcmpl-abc123, Model: gpt-4o-mini, Cost: $0.0012
  2. Request: chatcmpl-def456, Model: gpt-4o, Cost: $0.0450
  3. Request: chatcmpl-ghi789, Model: gpt-4o-mini, Cost: $0.0015
```

---

## ⚠️ Common Issues

### Issue: "No valid billing rows found"

**Cause:** CSV headers don't match expected format

**Fix:** Check your CSV headers. Must include at least:
- A request ID column
- A timestamp column
- A model column

### Issue: "Request ID not found in database"

**Cause:** Normal - OpenAI export includes all requests, but your database only has requests where you captured the `openai_request_id`

**Expected:** Only recent requests (after you deployed the reconciliation tracking) will match

### Issue: Cost column missing

**Cause:** OpenAI didn't include cost in export

**Fix:** Script will calculate cost based on tokens and model. Ensure `prompt_tokens` and `completion_tokens` are present.

---

## 📊 Manual CSV Creation (Advanced)

If you need to create a CSV manually from OpenAI's API or other sources:

```csv
request_id,timestamp,model,prompt_tokens,completion_tokens,total_tokens,cost_usd
chatcmpl-abc123,2024-12-01T10:30:45Z,gpt-4o-mini,150,75,225,0.0012
```

**Requirements:**
1. First row must be headers
2. At least `request_id` or `timestamp` must be present
3. Model name must match your database (e.g., `gpt-4o-mini`, not `gpt-4o-mini-2024-07-18`)
4. Timestamps should be ISO 8601 format or similar
5. Costs in USD (will be converted to cents internally)

---

## 🔗 Related Documentation

- **Full Guide:** `docs/token-system/OPENAI_RECONCILIATION_GUIDE.md`
- **Quick Start:** `docs/token-system/RECONCILIATION_QUICK_START.md`
- **Script:** `scripts/database/reconcile-openai-costs.ts`

---

**Questions?** Check the reconciliation script output for detailed error messages.

