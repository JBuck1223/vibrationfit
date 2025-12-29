-- Migration: Add fal.ai models to ai_model_pricing
-- Created: December 29, 2025
-- Purpose: Add fal-ai/nano-banana and fal-ai/nano-banana/edit models for image generation pricing

-- Add fal.ai models to ai_model_pricing
-- Note: price_per_unit is in dollars (not cents)
-- User wants 1000 tokens per cent, which is calculated in code as: cost_in_cents * 1000
INSERT INTO ai_model_pricing (
  model_name, 
  provider, 
  model_family, 
  input_price_per_1m,   -- 0 for image models (per 1 million)
  output_price_per_1m,  -- 0 for image models (per 1 million)
  price_per_unit,       -- Cost per image in dollars
  unit_type,            -- Description of what 1 unit is
  is_active, 
  supports_temperature, 
  supports_json_mode, 
  supports_streaming, 
  is_reasoning_model, 
  max_tokens_param, 
  token_multiplier, 
  context_window
)
VALUES
  -- fal-ai/nano-banana (base image generation model)
  -- Cost: $0.040 per image (4 cents)
  -- Tokens: 4,000 tokens (4 cents * 1000 tokens/cent)
  (
    'fal-ai/nano-banana', 
    'fal', 
    'nano-banana', 
    0,              -- No token-based input pricing
    0,              -- No token-based output pricing
    0.040,          -- $0.040 per image (4 cents)
    'image',        -- Per image, any aspect ratio
    true,           -- Active
    false,          -- No temperature control
    false,          -- No JSON mode
    false,          -- No streaming
    false,          -- Not a reasoning model
    'max_tokens',   -- Standard param name
    1,              -- No multiplier
    NULL            -- No context window for image models
  ),
  
  -- fal-ai/nano-banana/edit (image editing model)
  -- Cost: $0.040 per edit (4 cents, same as generation)
  -- Tokens: 4,000 tokens (4 cents * 1000 tokens/cent)
  (
    'fal-ai/nano-banana/edit', 
    'fal', 
    'nano-banana', 
    0,              -- No token-based input pricing
    0,              -- No token-based output pricing
    0.040,          -- $0.040 per edit (4 cents)
    'image',        -- Per image edit
    true,           -- Active
    false,          -- No temperature control
    false,          -- No JSON mode
    false,          -- No streaming
    false,          -- Not a reasoning model
    'max_tokens',   -- Standard param name
    1,              -- No multiplier
    NULL            -- No context window for image models
  )
ON CONFLICT (model_name) DO UPDATE SET
  price_per_unit = EXCLUDED.price_per_unit,
  unit_type = EXCLUDED.unit_type,
  provider = EXCLUDED.provider,
  model_family = EXCLUDED.model_family,
  is_active = EXCLUDED.is_active;

-- Verify the models were added
DO $$
DECLARE
  v_nano_banana_price numeric;
  v_nano_banana_edit_price numeric;
BEGIN
  SELECT price_per_unit INTO v_nano_banana_price 
  FROM ai_model_pricing 
  WHERE model_name = 'fal-ai/nano-banana';
  
  SELECT price_per_unit INTO v_nano_banana_edit_price 
  FROM ai_model_pricing 
  WHERE model_name = 'fal-ai/nano-banana/edit';
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ fal.ai models added to ai_model_pricing:';
  RAISE NOTICE '  fal-ai/nano-banana: $% per image (% cents) = % tokens', 
    v_nano_banana_price, 
    ROUND(v_nano_banana_price * 100, 1),
    ROUND(v_nano_banana_price * 100 * 1000, 0);
  RAISE NOTICE '  fal-ai/nano-banana/edit: $% per edit (% cents) = % tokens', 
    v_nano_banana_edit_price,
    ROUND(v_nano_banana_edit_price * 100, 1),
    ROUND(v_nano_banana_edit_price * 100 * 1000, 0);
  RAISE NOTICE '';
  RAISE NOTICE 'Token pricing: 1000 tokens per cent of cost';
  RAISE NOTICE '';
END $$;

