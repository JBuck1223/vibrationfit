# fal.ai Image Generation Pricing

**Last Updated:** December 29, 2025  
**Status:** Active

## Overview

VibrationFit uses fal.ai's nano-banana models for hyper-realistic image generation and editing. This document explains the pricing structure and token calculation.

## Pricing Strategy

**User's Goal:** 1000 tokens per cent of actual cost

This means:
- **1 cent** of actual cost = **1,000 tokens** charged to user
- **$0.040** (4 cents) per image = **4,000 tokens** charged

## Models

### fal-ai/nano-banana (Image Generation)

| Parameter | Value |
|-----------|-------|
| **Model Name** | `fal-ai/nano-banana` |
| **Provider** | `fal` |
| **Actual Cost** | $0.040 per image (4 cents) |
| **Tokens Charged** | 4,000 tokens |
| **Calculation** | `4 cents × 1000 tokens/cent = 4,000 tokens` |

**Supported Aspect Ratios:**
- Square (1:1)
- Landscape 4:3
- Landscape 16:9
- Portrait 4:3 (3:4)
- Portrait 16:9 (9:16)

### fal-ai/nano-banana/edit (Image Editing)

| Parameter | Value |
|-----------|-------|
| **Model Name** | `fal-ai/nano-banana/edit` |
| **Provider** | `fal` |
| **Actual Cost** | $0.040 per edit (4 cents) |
| **Tokens Charged** | 4,000 tokens |
| **Calculation** | `4 cents × 1000 tokens/cent = 4,000 tokens` |

**Features:**
- Edit existing images with text prompts
- Replace objects/elements in photos
- Same aspect ratio support as generation

## Database Schema

### ai_model_pricing Table

```sql
INSERT INTO ai_model_pricing (
  model_name, 
  provider, 
  model_family, 
  input_price_per_1k,   -- 0 for image models
  output_price_per_1k,  -- 0 for image models
  price_per_unit,       -- $0.040 (cost per image in dollars)
  unit_type,            -- 'image'
  is_active
) VALUES
  ('fal-ai/nano-banana', 'fal', 'nano-banana', 0, 0, 0.040, 'image', true),
  ('fal-ai/nano-banana/edit', 'fal', 'nano-banana', 0, 0, 0.040, 'image', true);
```

### token_usage Table

When an image is generated or edited:

```typescript
await trackTokenUsage({
  user_id: userId,
  action_type: 'image_generation',
  model_used: 'fal-ai/nano-banana', // or 'fal-ai/nano-banana/edit'
  tokens_used: 4000,                // cost_cents * 1000
  input_tokens: 1,                  // 1 image unit
  output_tokens: 0,
  success: true,
  metadata: {
    context: 'vision_board',
    prompt: 'User prompt...',
    size: '4:3',
    quality: 'standard',
    style: 'vivid',
    provider: 'fal',
    cost_cents: 4.0,
  },
})
```

## Code Implementation

### Token Calculation Logic

```typescript
// Get cost from ai_model_pricing table
const { data: pricingData } = await supabase
  .from('ai_model_pricing')
  .select('price_per_unit')
  .eq('model_name', falModel)
  .eq('is_active', true)
  .single()

// Convert dollars to cents, then to tokens
const costInCents = pricingData?.price_per_unit ? pricingData.price_per_unit * 100 : 4.0
const tokensForImage = Math.round(costInCents * 1000)

// Result: $0.040 → 4 cents → 4,000 tokens
```

### Files Modified

1. **Migration:** `supabase/migrations/20251229000001_add_fal_ai_models.sql`
   - Adds fal.ai models to `ai_model_pricing` table

2. **Service:** `src/lib/services/imageService.ts`
   - `generateImageWithFal()`: Updated token calculation for image generation
   - `editImage()`: Updated token calculation for image editing
   - Both functions now query `ai_model_pricing` and calculate tokens as `cost_cents * 1000`

## Example Scenarios

### Scenario 1: Generate Vision Board Image

```typescript
const result = await generateImage({
  userId: 'user-123',
  prompt: 'White Tesla Cybertruck in Sarasota Florida',
  dimension: 'landscape_4_3',
  quality: 'standard',
  style: 'vivid',
  context: 'vision_board',
})

// Result:
// - Cost: $0.040 (4 cents)
// - Tokens charged: 4,000
// - User balance reduced by 4,000 tokens
```

### Scenario 2: Edit Existing Image

```typescript
const result = await editImage({
  userId: 'user-123',
  imageUrl: 'https://...',
  prompt: 'Replace minivan with white Cybertruck',
  dimension: 'square',
  quality: 'standard',
  style: 'vivid',
  context: 'vision_board',
})

// Result:
// - Cost: $0.040 (4 cents)
// - Tokens charged: 4,000
// - User balance reduced by 4,000 tokens
```

## Token Balance Calculation

User token balance is calculated as:

```sql
-- From get_user_token_balance() function
balance = SUM(unexpired_token_grants) - SUM(successful_token_usage)
```

Each successful image generation/edit:
- Adds a record to `token_usage` with `tokens_used = 2500`
- Automatically reduces the user's available balance
- No manual deduction needed (calculated on-the-fly)

## Pricing Comparison

| Model | Provider | Cost per Image | Tokens Charged |
|-------|----------|----------------|----------------|
| fal-ai/nano-banana | fal | $0.040 (4¢) | 4,000 |
| fal-ai/nano-banana/edit | fal | $0.040 (4¢) | 4,000 |
| dall-e-3 (standard) | OpenAI | $0.040 (4¢) | 4,000 |
| dall-e-3 (HD) | OpenAI | $0.080 (8¢) | 8,000 |

**fal.ai nano-banana has the same cost as DALL-E 3 standard quality!**

## Migration Instructions

1. **Run the migration:**
   ```bash
   # User will run this manually
   psql $DATABASE_URL -f supabase/migrations/20251229000001_add_fal_ai_models.sql
   ```

2. **Verify models were added:**
   ```sql
   SELECT model_name, provider, price_per_unit, unit_type 
   FROM ai_model_pricing 
   WHERE provider = 'fal';
   ```

3. **Test image generation:**
   - Generate a test image via the UI
   - Check `token_usage` table for correct token deduction
   - Verify user balance decreased by 2,500 tokens

## Troubleshooting

### Issue: Tokens not being deducted

**Check:**
1. Is the model active in `ai_model_pricing`?
   ```sql
   SELECT * FROM ai_model_pricing WHERE model_name LIKE 'fal-ai%';
   ```

2. Is the token usage being tracked?
   ```sql
   SELECT * FROM token_usage 
   WHERE model_used LIKE 'fal-ai%' 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```

3. Check the `tokens_used` value - should be 4000, not 1 or 380

### Issue: Wrong token amount charged

**Verify calculation:**
```typescript
// Should be:
const costInCents = 4.0
const tokensForImage = Math.round(costInCents * 1000) // = 4000

// NOT:
const tokensForImage = 1 // ❌ Wrong
const tokensForImage = prompt.length // ❌ Wrong
```

## References

- **Migration:** `supabase/migrations/20251229000001_add_fal_ai_models.sql`
- **Service:** `src/lib/services/imageService.ts`
- **Token Tracking:** `src/lib/tokens/tracking.ts`
- **Database Schema:** `supabase/COMPLETE_SCHEMA_DUMP.sql`

