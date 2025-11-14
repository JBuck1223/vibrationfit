# AI Cost Tracking - Proper Implementation Guide

**Last Updated:** November 15, 2025

## 🎯 Overview

This guide explains how to properly track AI costs in VibrationFit using accurate model pricing and actual token usage.

---

## 📊 Database Architecture

### `ai_model_pricing` Table

Stores accurate pricing for all AI models:

```sql
CREATE TABLE ai_model_pricing (
  id uuid PRIMARY KEY,
  model_name text UNIQUE,           -- 'gpt-4o', 'whisper-1', etc.
  provider text,                     -- 'openai', 'anthropic', etc.
  model_family text,                 -- 'gpt-4', 'gpt-3.5', 'whisper'
  
  -- Pricing in USD per 1K tokens
  input_price_per_1k numeric(10,6), -- $0.005 per 1K input tokens
  output_price_per_1k numeric(10,6),-- $0.015 per 1K output tokens
  
  -- For non-text models
  price_per_unit numeric(10,6),     -- Per second, image, etc.
  unit_type text,                    -- 'second', 'image', 'character'
  
  is_active boolean,
  effective_date timestamptz,
  notes text
);
```

### Current Pricing (Nov 2024)

| Model | Input (per 1K) | Output (per 1K) | Notes |
|-------|----------------|-----------------|-------|
| **gpt-4o** | $0.005 | $0.015 | Most capable |
| **gpt-4o-mini** | $0.00015 | $0.0006 | Fast & cheap |
| **gpt-4-turbo** | $0.01 | $0.03 | 128K context |
| **gpt-3.5-turbo** | $0.0015 | $0.002 | Budget option |
| **whisper-1** | - | - | $0.006/second |
| **dall-e-3** | - | - | $0.04/image |

---

## 🔧 Cost Calculation Function

### SQL Function

```sql
SELECT calculate_ai_cost(
  'gpt-4o',    -- model name
  1000,        -- prompt tokens
  500,         -- completion tokens
  NULL         -- units (for audio/image)
);
-- Returns: 1250 (cents = $12.50)
```

### Calculation Logic

```sql
-- Text models:
cost = (prompt_tokens / 1000) * input_price + 
       (completion_tokens / 1000) * output_price

-- Audio models:
cost = seconds * price_per_unit

-- Image models:
cost = images * price_per_unit
```

---

## 📝 Integration with Token Tracking

### Update `token_usage` Table

Ensure these fields exist:

```sql
ALTER TABLE token_usage ADD COLUMN IF NOT EXISTS prompt_tokens integer;
ALTER TABLE token_usage ADD COLUMN IF NOT EXISTS completion_tokens integer;
ALTER TABLE token_usage ADD COLUMN IF NOT EXISTS calculated_cost_cents integer;
```

### When Tracking AI Usage

```typescript
// In your AI tracking code (lib/tokens/tracking.ts)
import { trackTokenUsage } from '@/lib/tokens/tracking'

// After OpenAI API call
const response = await openai.chat.completions.create({...})

await trackTokenUsage({
  userId: user.id,
  action_type: 'chat_conversation',
  model_used: 'gpt-4o',
  prompt_tokens: response.usage.prompt_tokens,
  completion_tokens: response.usage.completion_tokens,
  success: true
})
```

### Backend Cost Calculation

```typescript
// In your tracking function
export async function trackTokenUsage(data: TokenUsageData) {
  const supabase = await createServerClient()
  
  // Calculate accurate cost using database function
  const { data: costData } = await supabase
    .rpc('calculate_ai_cost', {
      p_model_name: data.model_used,
      p_prompt_tokens: data.prompt_tokens || 0,
      p_completion_tokens: data.completion_tokens || 0,
      p_units: data.units || null
    })
  
  // Insert with calculated cost
  await supabase.from('token_usage').insert({
    user_id: data.userId,
    action_type: data.action_type,
    model_used: data.model_used,
    prompt_tokens: data.prompt_tokens,
    completion_tokens: data.completion_tokens,
    calculated_cost_cents: costData, // Accurate cost in cents
    tokens_used: (data.prompt_tokens || 0) + (data.completion_tokens || 0),
    success: data.success
  })
}
```

---

## 🎨 Admin Interface

### `/admin/ai-models` Enhancements

Add a "Pricing" tab to manage model costs:

```typescript
// Show current pricing
const { data: pricing } = await supabase
  .from('ai_model_pricing')
  .select('*')
  .eq('is_active', true)
  .order('model_family, model_name')

// Update pricing
await supabase
  .from('ai_model_pricing')
  .update({
    input_price_per_1k: 0.005,
    output_price_per_1k: 0.015,
    effective_date: new Date()
  })
  .eq('model_name', 'gpt-4o')
```

---

## 📊 Accurate Cost Reporting

### Query Total Costs

```sql
-- Get accurate costs for user
SELECT 
  SUM(calculated_cost_cents) / 100.0 as total_cost_usd,
  COUNT(*) as total_requests,
  SUM(prompt_tokens + completion_tokens) as total_tokens
FROM token_usage
WHERE user_id = 'user-id'
  AND calculated_cost_cents IS NOT NULL;
```

### Cost by Model

```sql
SELECT 
  model_used,
  COUNT(*) as requests,
  SUM(prompt_tokens) as total_prompt_tokens,
  SUM(completion_tokens) as total_completion_tokens,
  SUM(calculated_cost_cents) / 100.0 as total_cost_usd
FROM token_usage
WHERE user_id = 'user-id'
  AND calculated_cost_cents IS NOT NULL
GROUP BY model_used
ORDER BY total_cost_usd DESC;
```

### Cost by Feature

```sql
SELECT 
  action_type,
  COUNT(*) as requests,
  SUM(calculated_cost_cents) / 100.0 as total_cost_usd,
  AVG(calculated_cost_cents) / 100.0 as avg_cost_per_request
FROM token_usage
WHERE user_id = 'user-id'
  AND calculated_cost_cents IS NOT NULL
GROUP BY action_type
ORDER BY total_cost_usd DESC;
```

---

## 🔄 Migration Strategy

### Recalculate Historical Costs

```sql
-- For existing records with model_used and token counts
UPDATE token_usage
SET calculated_cost_cents = calculate_ai_cost(
  model_used,
  prompt_tokens,
  completion_tokens,
  NULL
)
WHERE calculated_cost_cents IS NULL
  AND model_used IS NOT NULL
  AND (prompt_tokens > 0 OR completion_tokens > 0);
```

---

## ✅ Benefits

### Accurate Tracking
- Real pricing from database (not estimates)
- Separates input/output token costs
- Handles different model types (text, audio, image)

### Easy Updates
- Update pricing in one place (database)
- Historical costs remain accurate
- No code changes needed for price updates

### Better Reporting
- True cost per feature
- Cost per model comparison
- Cost trends over time

### Admin Control
- Manage pricing via admin panel
- Track pricing changes over time
- Add new models easily

---

## 🚀 Next Steps

1. **Run migration:** `20251115000000_create_ai_model_pricing.sql`
2. **Update tracking:** Capture `prompt_tokens` and `completion_tokens`
3. **Enhance admin:** Add pricing management UI
4. **Display costs:** Only for admins (not end users)

---

## 📚 Related Files

- Migration: `supabase/migrations/20251115000000_create_ai_model_pricing.sql`
- Admin Page: `src/app/admin/ai-models/page.tsx`
- Tracking: `src/lib/tokens/tracking.ts`
- Config: `src/lib/ai/config.ts`

