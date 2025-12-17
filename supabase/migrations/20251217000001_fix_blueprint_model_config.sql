-- Fix GPT-5 Model Configuration
-- GPT-5 is a reasoning model with different capabilities than GPT-4

-- Update the ai_model_pricing table to set correct capabilities for gpt-5
UPDATE ai_model_pricing
SET 
  max_tokens_param = 'max_completion_tokens',  -- GPT-5 uses max_completion_tokens
  supports_temperature = false,                 -- GPT-5 does not support temperature
  supports_json_mode = false,                   -- GPT-5 requires "json" in prompt, not response_format
  is_reasoning_model = true                     -- GPT-5 is a reasoning model
WHERE model_name = 'gpt-5';

-- Verify the changes
DO $$
DECLARE
  v_config RECORD;
BEGIN
  SELECT 
    max_tokens_param,
    supports_temperature,
    supports_json_mode,
    is_reasoning_model
  INTO v_config
  FROM ai_model_pricing
  WHERE model_name = 'gpt-5';
  
  RAISE NOTICE 'GPT-5 Configuration:';
  RAISE NOTICE '  max_tokens_param: %', v_config.max_tokens_param;
  RAISE NOTICE '  supports_temperature: %', v_config.supports_temperature;
  RAISE NOTICE '  supports_json_mode: %', v_config.supports_json_mode;
  RAISE NOTICE '  is_reasoning_model: %', v_config.is_reasoning_model;
  RAISE NOTICE '';
  RAISE NOTICE 'Tools using GPT-5: %', 
    (SELECT string_agg(tool_key, ', ') FROM ai_tools WHERE model_name = 'gpt-5');
END $$;

