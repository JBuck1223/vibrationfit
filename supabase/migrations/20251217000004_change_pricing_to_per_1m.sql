-- Change pricing columns from per_1k to per_1m for clarity
-- This matches OpenAI's pricing page format and eliminates mental math

-- First, change column types to support larger numbers
-- Old: numeric(10, 6) - max 9999.999999
-- New: numeric(10, 2) - max 99999999.99 (plenty for per-1M pricing)
ALTER TABLE ai_model_pricing 
  ALTER COLUMN input_price_per_1k TYPE numeric(10, 2);

ALTER TABLE ai_model_pricing 
  ALTER COLUMN output_price_per_1k TYPE numeric(10, 2);

-- Multiply all existing values by 1000 to convert from per-1k to per-1m
UPDATE ai_model_pricing
SET 
  input_price_per_1k = input_price_per_1k * 1000,
  output_price_per_1k = output_price_per_1k * 1000;

-- Now rename columns
ALTER TABLE ai_model_pricing 
  RENAME COLUMN input_price_per_1k TO input_price_per_1m;

ALTER TABLE ai_model_pricing 
  RENAME COLUMN output_price_per_1k TO output_price_per_1m;

-- Verify the conversion
DO $$
BEGIN
  RAISE NOTICE '=== Pricing now stored per 1M tokens ===';
  RAISE NOTICE 'gpt-4o: $% input, $% output', 
    (SELECT input_price_per_1m FROM ai_model_pricing WHERE model_name = 'gpt-4o'),
    (SELECT output_price_per_1m FROM ai_model_pricing WHERE model_name = 'gpt-4o');
  RAISE NOTICE 'gpt-4o-mini: $% input, $% output', 
    (SELECT input_price_per_1m FROM ai_model_pricing WHERE model_name = 'gpt-4o-mini'),
    (SELECT output_price_per_1m FROM ai_model_pricing WHERE model_name = 'gpt-4o-mini');
END $$;

