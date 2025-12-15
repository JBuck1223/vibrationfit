-- AI Tools Configuration System
-- Adds capability columns to ai_model_pricing and creates ai_tools table
-- Admin configures all values through /admin/ai-models UI
-- Replaces hardcoded src/lib/ai/config.ts

-- Step 1: Add capabilities to ai_model_pricing
ALTER TABLE ai_model_pricing
  ADD COLUMN IF NOT EXISTS supports_temperature BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS supports_json_mode BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS supports_streaming BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_reasoning_model BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_tokens_param TEXT DEFAULT 'max_tokens',
  ADD COLUMN IF NOT EXISTS token_multiplier INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS context_window INTEGER,
  ADD COLUMN IF NOT EXISTS capabilities_notes TEXT;

COMMENT ON COLUMN ai_model_pricing.supports_temperature IS 'Whether model supports custom temperature - configure in admin';
COMMENT ON COLUMN ai_model_pricing.supports_json_mode IS 'Whether model supports response_format json_object mode - configure in admin';
COMMENT ON COLUMN ai_model_pricing.supports_streaming IS 'Whether model supports streaming responses - configure in admin';
COMMENT ON COLUMN ai_model_pricing.is_reasoning_model IS 'Whether model uses tokens for internal reasoning - configure in admin';
COMMENT ON COLUMN ai_model_pricing.max_tokens_param IS 'OpenAI parameter name: max_tokens or max_completion_tokens - configure in admin';
COMMENT ON COLUMN ai_model_pricing.token_multiplier IS 'Token allocation multiplier (e.g., reasoning models may need more) - configure in admin';
COMMENT ON COLUMN ai_model_pricing.context_window IS 'Maximum context window size in tokens - configure in admin';

-- Step 2: Create AI tools table (replaces hardcoded config)
CREATE TABLE IF NOT EXISTS ai_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_key TEXT NOT NULL UNIQUE,  -- e.g. 'blueprint_generation', 'category_summary'
  tool_name TEXT NOT NULL,
  description TEXT,
  model_name TEXT NOT NULL REFERENCES ai_model_pricing(model_name),
  temperature NUMERIC(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 1500,
  system_prompt TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_tools_key ON ai_tools(tool_key);
CREATE INDEX IF NOT EXISTS idx_ai_tools_model ON ai_tools(model_name);
CREATE INDEX IF NOT EXISTS idx_ai_tools_active ON ai_tools(is_active) WHERE is_active = true;

COMMENT ON TABLE ai_tools IS 'AI tool configurations - admin-configurable, replaces hardcoded config.ts';
COMMENT ON COLUMN ai_tools.tool_key IS 'Unique key used in code: getAIToolConfig(tool_key)';
COMMENT ON COLUMN ai_tools.model_name IS 'References ai_model_pricing.model_name';
COMMENT ON COLUMN ai_tools.system_prompt IS 'System prompt for this specific tool';

-- Trigger for updated_at
CREATE TRIGGER update_ai_tools_updated_at
  BEFORE UPDATE ON ai_tools
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 3: Seed current tools from hardcoded config
-- Admin can modify these through /admin/ai-models UI
INSERT INTO ai_tools (tool_key, tool_name, description, model_name, temperature, max_tokens, system_prompt) VALUES

('life_vision_category_summary', 'Life Vision Category Summary', 
 'Generates personalized category summaries from user input, profile, and assessment',
 'gpt-4o', 0.7, 1500,
 'You are VIVA — the Vibrational Intelligence Virtual Assistant for Vibration Fit. Your purpose is to help members articulate and activate the life they choose through vibrational alignment. You are a warm, wise, intuitive life coach — never a therapist or problem-solver. All responses must be in present tense, first person, and vibrationally activating.'),

('blueprint_generation', 'Blueprint Generation',
 'Creates detailed Being/Doing/Receiving actualization blueprints',
 'gpt-5', 0.6, 2500,
 'You are VIVA, creating detailed actualization blueprints to help users implement their life visions step by step.'),

('vision_refinement', 'Vision Refinement',
 'Refines life visions for maximum vibrational alignment and clarity',
 'gpt-5', 0.5, 1500,
 'You are VIVA, helping users refine their life visions for maximum vibrational alignment and clarity.'),

('master_vision_assembly', 'Master Vision Assembly',
 'Assembles complete life vision document from all category summaries',
 'gpt-4-turbo', 0.7, 4000,
 'You are VIVA — the Vibrational Intelligence Virtual Assistant for Vibration Fit. Your purpose is to help members articulate and activate the life they choose through vibrational alignment. You are a warm, wise, intuitive life coach — never a therapist or problem-solver. All responses must be in present tense, first person, and vibrationally activating.'),

('prompt_suggestions', 'Prompt Suggestions',
 'Generates personalized reflection prompts for life vision creation',
 'gpt-4o', 0.8, 1000,
 'You are VIVA, VibrationFit''s AI Vision Assistant. You generate personalized, creative prompts to help users reflect deeply on their life experiences.'),

('scene_generation', 'Scene Generation',
 'Creates vivid, cinematic first-person scenes for visualization',
 'gpt-4o', 0.75, 2200,
 'You are VIVA, the Vibrational Visualization Architect. You craft vivid, cinematic first-person scenes that help members embody the feelings of their chosen life. You honor the data provided, avoid speculation, and always end scenes with an Essence line.'),

('final_assembly', 'Final Assembly & Activation',
 'Synthesizes final vision document and creates activation message',
 'gpt-4o', 0.7, 3000,
 'You are VIVA, assembling the final life vision and creating an activating message.'),

('merge_clarity', 'Merge Clarity Statements',
 'Merges multiple clarity statements into one cohesive summary',
 'gpt-4o', 0.7, 1500,
 'You are VIVA, synthesizing clarity statements into a unified vision.'),

('north_star_reflection', 'North Star Reflection',
 'Generates personalized dashboard reflections based on emotional snapshots',
 'gpt-4o', 0.6, 1200,
 'You are VIVA, the warm, wise vibrational ally guiding a member through their North Star Dashboard. You reflect their current emotional snapshot, name their Essence, and offer one gentle present-tense focus. You never mention metrics or database terminology.'),

('voice_analyzer', 'Voice Profile Analyzer',
 'Analyzes user writing samples to infer natural voice and style',
 'gpt-4o-mini', 0.2, 600,
 'You are VIVA''s Voice Analyst. You study a member''s own words and return ONLY structured JSON describing their natural writing voice. You never add commentary or prose.'),

('vibrational_analyzer', 'Vibrational State Analyzer',
 'Analyzes emotional/vibrational state from user text',
 'gpt-4o-mini', 0.2, 800,
 'You are VIVA''s Vibrational Analyzer. Your job is to read one short piece of user text and return ONLY a JSON object describing their emotional state for a specific life category. You never coach, advise, or add commentary.')

ON CONFLICT (tool_key) DO NOTHING;

-- Step 4: RLS Policies (admin configures all model capabilities through /admin/ai-models)
ALTER TABLE ai_tools ENABLE ROW LEVEL SECURITY;

-- Anyone can read (needed for frontend/API)
CREATE POLICY "Anyone can view active tools"
  ON ai_tools FOR SELECT
  USING (is_active = true);

-- Only service_role can modify
CREATE POLICY "Only admins can modify tools"
  ON ai_tools FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Step 6: Create helper function to get tool config
CREATE OR REPLACE FUNCTION get_ai_tool_config(p_tool_key TEXT)
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
  -- Pricing
  input_price_per_1k NUMERIC,
  output_price_per_1k NUMERIC
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
    m.input_price_per_1k,
    m.output_price_per_1k
  FROM ai_tools t
  JOIN ai_model_pricing m ON t.model_name = m.model_name
  WHERE t.tool_key = p_tool_key
    AND t.is_active = true
    AND m.is_active = true;
$$;

GRANT EXECUTE ON FUNCTION get_ai_tool_config(TEXT) TO authenticated, anon;

COMMENT ON FUNCTION get_ai_tool_config(p_tool_key TEXT) IS 
  'Returns complete AI tool configuration including model capabilities and pricing. Used by all VIVA endpoints.';

