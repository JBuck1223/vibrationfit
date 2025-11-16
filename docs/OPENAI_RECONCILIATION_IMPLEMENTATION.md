# OpenAI Cost Reconciliation - Implementation Guide

**Last Updated:** November 16, 2025

---

## 🎯 What Changed

Added reconciliation fields to `token_usage` table to enable matching estimated costs against OpenAI's actual billing.

**Migration:** `20251116141218_add_openai_reconciliation_fields.sql`

---

## 📊 New Schema Fields

| Field | Type | Purpose |
|-------|------|---------|
| `openai_request_id` | TEXT | **🔑 KEY FIELD** - OpenAI's unique request ID (e.g., `chatcmpl-123`) |
| `openai_created` | BIGINT | Unix timestamp from OpenAI response |
| `system_fingerprint` | TEXT | Model version fingerprint (e.g., `fp_44709d6fcb`) |
| `actual_cost_cents` | INTEGER | Actual cost from OpenAI billing (after reconciliation) |
| `reconciled_at` | TIMESTAMPTZ | When reconciliation was performed |
| `reconciliation_status` | TEXT | `pending`, `matched`, `discrepancy`, `not_applicable` |

---

## 🔧 Code Changes Required

### 1. Update TypeScript Interface

**File:** `src/lib/tokens/tracking.ts`

```typescript
export interface TokenUsage {
  id?: string
  user_id: string
  action_type: '...'
  model_used: string
  tokens_used: number
  cost_estimate: number
  input_tokens?: number
  output_tokens?: number
  
  // ⭐ ADD THESE FIELDS
  openai_request_id?: string
  openai_created?: number
  system_fingerprint?: string
  actual_cost_cents?: number
  reconciliation_status?: 'pending' | 'matched' | 'discrepancy' | 'not_applicable'
  reconciled_at?: string
  
  success: boolean
  error_message?: string
  metadata?: Record<string, any>
  created_at?: string
}
```

### 2. Update AI Client Response Interface

**File:** `src/lib/ai/client.ts` (around line 19)

```typescript
export interface AIResponse {
  content: string
  model: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  // ⭐ ADD THESE FIELDS
  openai_request_id?: string
  openai_created?: number
  system_fingerprint?: string
  error?: string
}
```

### 3. Capture OpenAI Metadata in AI Client

**File:** `src/lib/ai/client.ts` (around line 87-100)

```typescript
const data = await response.json()
const choice = data.choices[0]

if (!choice || !choice.message) {
  throw new Error('No response from AI model')
}

return {
  content: choice.message.content,
  model: data.model,
  usage: data.usage,
  // ⭐ ADD THESE LINES
  openai_request_id: data.id,
  openai_created: data.created,
  system_fingerprint: data.system_fingerprint
}
```

### 4. Update Image Generation (if applicable)

**File:** `src/lib/ai/client.ts` (around line 154-164)

```typescript
const data = await response.json()
const imageData = data.data[0]

if (!imageData || !imageData.url) {
  throw new Error('No image generated')
}

return {
  url: imageData.url,
  revised_prompt: imageData.revised_prompt,
  // ⭐ ADD THESE LINES (if OpenAI returns them for DALL-E)
  openai_request_id: data.id,
  openai_created: data.created
}
```

### 5. Update All API Route Tracking Calls

**Example:** Any file that calls `trackTokenUsage`

**Before:**
```typescript
await trackTokenUsage({
  user_id: userId,
  action_type: 'chat_conversation',
  model_used: response.model,
  tokens_used: response.usage?.total_tokens || 0,
  input_tokens: response.usage?.prompt_tokens || 0,
  output_tokens: response.usage?.completion_tokens || 0,
  success: true
}, supabase)
```

**After:**
```typescript
await trackTokenUsage({
  user_id: userId,
  action_type: 'chat_conversation',
  model_used: response.model,
  tokens_used: response.usage?.total_tokens || 0,
  input_tokens: response.usage?.prompt_tokens || 0,
  output_tokens: response.usage?.completion_tokens || 0,
  // ⭐ ADD THESE LINES
  openai_request_id: response.openai_request_id,
  openai_created: response.openai_created,
  system_fingerprint: response.system_fingerprint,
  success: true
}, supabase)
```

### 6. Update Tracking Function

**File:** `src/lib/tokens/tracking.ts` (around line 235-249)

```typescript
const { error: auditError } = await supabase
  .from('token_usage')
  .insert({
    user_id: usage.user_id,
    action_type: usage.action_type,
    model_used: usage.model_used,
    tokens_used: effectiveTokens,
    cost_estimate: Math.round(costEstimate * 100),
    input_tokens: usage.input_tokens || 0,
    output_tokens: usage.output_tokens || 0,
    // ⭐ ADD THESE LINES
    openai_request_id: usage.openai_request_id,
    openai_created: usage.openai_created,
    system_fingerprint: usage.system_fingerprint,
    reconciliation_status: usage.openai_request_id ? 'pending' : 'not_applicable',
    success: usage.success,
    error_message: usage.error_message,
    metadata: usage.metadata || {},
    created_at: new Date().toISOString()
  })
```

---

## 🔍 Files to Update

Search and update these locations:

```bash
# Find all places that call trackTokenUsage
grep -r "trackTokenUsage" src/app/api --include="*.ts"

# Find all places that call generateText
grep -r "generateText" src/app/api --include="*.ts"

# Common locations:
# - src/app/api/viva/chat/route.ts
# - src/app/api/viva/refine-category/route.ts
# - src/app/api/assessment/*/route.ts
# - Any API that uses AI
```

---

## 🔄 Reconciliation Process (Future)

### Step 1: Get OpenAI Usage Data

OpenAI provides usage data through their API:

```bash
# Get usage for a specific date
curl https://api.openai.com/v1/usage \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d "date=2025-11-16"
```

### Step 2: Match and Update

```sql
-- Update actual costs from OpenAI billing
UPDATE token_usage
SET 
  actual_cost_cents = :openai_cost_cents,
  reconciled_at = NOW(),
  reconciliation_status = CASE
    WHEN ABS(:openai_cost_cents - calculated_cost_cents) <= 5 THEN 'matched'
    ELSE 'discrepancy'
  END
WHERE openai_request_id = :request_id;
```

### Step 3: Analyze Discrepancies

```sql
-- Find where estimates are off
SELECT 
  action_type,
  model_used,
  COUNT(*) as requests,
  AVG(calculated_cost_cents) as avg_estimated_cents,
  AVG(actual_cost_cents) as avg_actual_cents,
  AVG(actual_cost_cents - calculated_cost_cents) as avg_diff_cents
FROM token_usage
WHERE reconciliation_status = 'discrepancy'
GROUP BY action_type, model_used
ORDER BY avg_diff_cents DESC;
```

---

## 📈 View Usage

The updated `token_usage_with_costs` view includes reconciliation data:

```sql
-- See reconciliation status for recent usage
SELECT 
  created_at,
  action_type,
  model_used,
  accurate_cost_usd,
  actual_cost_usd,
  reconciliation_difference_usd,
  reconciliation_status,
  openai_request_id
FROM token_usage_with_costs
ORDER BY created_at DESC
LIMIT 50;
```

---

## 🎯 Testing

1. **Before deploying**, make one AI request
2. Check that `openai_request_id` is populated:

```sql
SELECT 
  id,
  action_type,
  openai_request_id,
  openai_created,
  system_fingerprint,
  reconciliation_status
FROM token_usage
ORDER BY created_at DESC
LIMIT 5;
```

3. Should see:
   - ✅ `openai_request_id` like `chatcmpl-xyz123`
   - ✅ `reconciliation_status` = `pending`
   - ✅ `openai_created` = Unix timestamp

---

## 🚀 Deployment Checklist

- [ ] Run migration on production
- [ ] Update `src/lib/tokens/tracking.ts` interface
- [ ] Update `src/lib/ai/client.ts` response interface
- [ ] Update `src/lib/ai/client.ts` to capture OpenAI metadata
- [ ] Update all API routes that call `trackTokenUsage`
- [ ] Test one API call to verify `openai_request_id` is captured
- [ ] Monitor for a day to ensure no errors
- [ ] Set up monthly reconciliation process

---

## 💡 Benefits

After implementation:

1. **Exact Cost Tracking** - Match every dollar to OpenAI's billing
2. **Cost Accuracy** - See where your estimates are off
3. **Billing Disputes** - Have OpenAI request IDs for any questions
4. **Model Analysis** - See actual costs by model version
5. **Audit Trail** - Complete reconciliation history

---

## 🔗 Related Files

- Migration: `supabase/migrations/20251116141218_add_openai_reconciliation_fields.sql`
- Tracking: `src/lib/tokens/tracking.ts`
- AI Client: `src/lib/ai/client.ts`
- View: `token_usage_with_costs` (auto-updated by migration)

---

**Next Step:** Update the code to capture `openai_request_id` in all AI API calls!

