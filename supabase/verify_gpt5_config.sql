-- Verify GPT-5 configuration
SELECT 
  model_name,
  supports_temperature,
  supports_json_mode,
  is_reasoning_model,
  max_tokens_param
FROM ai_model_pricing
WHERE model_name = 'gpt-5';




