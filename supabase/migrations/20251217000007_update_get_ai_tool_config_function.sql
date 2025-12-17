-- Update get_ai_tool_config RPC function to use new per_1m column names

-- Drop the old function first (return type is changing)
DROP FUNCTION IF EXISTS get_ai_tool_config(TEXT);

-- Recreate with updated column names
CREATE FUNCTION get_ai_tool_config(p_tool_key TEXT)
RETURNS TABLE(
  tool_key TEXT,
  tool_name TEXT,
  model_name TEXT,
  temperature NUMERIC,
  max_tokens INTEGER,
  system_prompt TEXT,
  -- Model capabilities
  supports_temperature BOOLEAN,
  supports_json_mode BOOLEAN,
  supports_streaming BOOLEAN,
  is_reasoning_model BOOLEAN,
  max_tokens_param TEXT,
  token_multiplier INTEGER,
  context_window INTEGER,
  -- Pricing (now per 1M tokens)
  input_price_per_1m NUMERIC,
  output_price_per_1m NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    t.tool_key,
    t.tool_name,
    t.model_name,
    t.temperature,
    t.max_tokens,
    t.system_prompt,
    m.supports_temperature,
    m.supports_json_mode,
    m.supports_streaming,
    m.is_reasoning_model,
    m.max_tokens_param,
    m.token_multiplier,
    m.context_window,
    m.input_price_per_1m,
    m.output_price_per_1m
  FROM ai_tools t
  JOIN ai_model_pricing m ON t.model_name = m.model_name
  WHERE t.tool_key = p_tool_key
    AND t.is_active = true
    AND m.is_active = true;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_ai_tool_config(TEXT) TO authenticated, anon;

COMMENT ON FUNCTION get_ai_tool_config(p_tool_key TEXT) IS 
  'Returns complete AI tool configuration including model capabilities and pricing (per 1M tokens). Used by all VIVA endpoints.';

-- Verify
DO $$
BEGIN
  RAISE NOTICE 'Updated get_ai_tool_config function to use input_price_per_1m and output_price_per_1m';
END $$;

