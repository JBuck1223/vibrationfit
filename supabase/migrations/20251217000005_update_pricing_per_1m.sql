-- Update OpenAI Pricing (December 2024) - Now in per 1M token format
-- Source: https://openai.com/api/pricing/ (Standard tier)

-- Update GPT-5 family
UPDATE ai_model_pricing
SET 
  input_price_per_1m = 1.25,
  output_price_per_1m = 10.00
WHERE model_name = 'gpt-5';

-- Update GPT-4o
UPDATE ai_model_pricing
SET 
  input_price_per_1m = 2.50,
  output_price_per_1m = 10.00
WHERE model_name = 'gpt-4o';

-- Update GPT-4o-mini
UPDATE ai_model_pricing
SET 
  input_price_per_1m = 0.15,
  output_price_per_1m = 0.60
WHERE model_name = 'gpt-4o-mini';

-- Update gpt-4o-2024-11-20 (specific snapshot)
UPDATE ai_model_pricing
SET 
  input_price_per_1m = 2.50,
  output_price_per_1m = 10.00
WHERE model_name = 'gpt-4o-2024-11-20';

-- Update gpt-3.5-turbo
UPDATE ai_model_pricing
SET 
  input_price_per_1m = 0.50,
  output_price_per_1m = 1.50
WHERE model_name = 'gpt-3.5-turbo';

-- Update GPT-5 mini models
UPDATE ai_model_pricing
SET 
  input_price_per_1m = 0.25,
  output_price_per_1m = 2.00
WHERE model_name = 'gpt-5-mini';

UPDATE ai_model_pricing
SET 
  input_price_per_1m = 0.05,
  output_price_per_1m = 0.40
WHERE model_name = 'gpt-5-nano';

-- Update GPT-4 models
UPDATE ai_model_pricing
SET 
  input_price_per_1m = 30.00,
  output_price_per_1m = 60.00
WHERE model_name = 'gpt-4';

UPDATE ai_model_pricing
SET 
  input_price_per_1m = 10.00,
  output_price_per_1m = 30.00
WHERE model_name = 'gpt-4-turbo';

-- Update o1 models (reasoning models)
UPDATE ai_model_pricing
SET 
  input_price_per_1m = 15.00,
  output_price_per_1m = 60.00
WHERE model_name = 'o1';

UPDATE ai_model_pricing
SET 
  input_price_per_1m = 1.10,
  output_price_per_1m = 4.40
WHERE model_name = 'o1-mini';

-- Verify pricing updates
DO $$
BEGIN
  RAISE NOTICE '=== Updated Pricing (per 1M tokens) ===';
  RAISE NOTICE '';
  RAISE NOTICE 'GPT-5 Family:';
  RAISE NOTICE '  gpt-5: $% input, $% output', 
    (SELECT input_price_per_1m FROM ai_model_pricing WHERE model_name = 'gpt-5'),
    (SELECT output_price_per_1m FROM ai_model_pricing WHERE model_name = 'gpt-5');
  RAISE NOTICE '  gpt-5-mini: $% input, $% output', 
    (SELECT input_price_per_1m FROM ai_model_pricing WHERE model_name = 'gpt-5-mini'),
    (SELECT output_price_per_1m FROM ai_model_pricing WHERE model_name = 'gpt-5-mini');
  RAISE NOTICE '  gpt-5-nano: $% input, $% output', 
    (SELECT input_price_per_1m FROM ai_model_pricing WHERE model_name = 'gpt-5-nano'),
    (SELECT output_price_per_1m FROM ai_model_pricing WHERE model_name = 'gpt-5-nano');
  RAISE NOTICE '';
  RAISE NOTICE 'GPT-4 Family:';
  RAISE NOTICE '  gpt-4o: $% input, $% output', 
    (SELECT input_price_per_1m FROM ai_model_pricing WHERE model_name = 'gpt-4o'),
    (SELECT output_price_per_1m FROM ai_model_pricing WHERE model_name = 'gpt-4o');
  RAISE NOTICE '  gpt-4o-mini: $% input, $% output', 
    (SELECT input_price_per_1m FROM ai_model_pricing WHERE model_name = 'gpt-4o-mini'),
    (SELECT output_price_per_1m FROM ai_model_pricing WHERE model_name = 'gpt-4o-mini');
  RAISE NOTICE '  gpt-4o-2024-11-20: $% input, $% output', 
    (SELECT input_price_per_1m FROM ai_model_pricing WHERE model_name = 'gpt-4o-2024-11-20'),
    (SELECT output_price_per_1m FROM ai_model_pricing WHERE model_name = 'gpt-4o-2024-11-20');
  RAISE NOTICE '  gpt-3.5-turbo: $% input, $% output', 
    (SELECT input_price_per_1m FROM ai_model_pricing WHERE model_name = 'gpt-3.5-turbo'),
    (SELECT output_price_per_1m FROM ai_model_pricing WHERE model_name = 'gpt-3.5-turbo');
END $$;

