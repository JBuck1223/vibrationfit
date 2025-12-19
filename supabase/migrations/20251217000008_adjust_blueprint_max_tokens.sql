-- Adjust blueprint_generation max_tokens for gpt-4o's limit

-- gpt-4o has a max_completion_tokens limit of 16384
-- Update the tool configuration to use a safe value
UPDATE ai_tools
SET max_tokens = 8000
WHERE tool_key = 'blueprint_generation';

-- Verify the change
DO $$
DECLARE
  v_max_tokens INTEGER;
  v_model TEXT;
BEGIN
  SELECT max_tokens, model_name INTO v_max_tokens, v_model
  FROM ai_tools
  WHERE tool_key = 'blueprint_generation';
  
  RAISE NOTICE 'Blueprint Generation: model=%, max_tokens=%', v_model, v_max_tokens;
END $$;

COMMENT ON TABLE ai_tools IS 
  'Blueprint generation now uses 8000 max_tokens (safe for gpt-4o which has 16384 limit). With token_multiplier=1.25, actual request will be 10000 tokens.';




