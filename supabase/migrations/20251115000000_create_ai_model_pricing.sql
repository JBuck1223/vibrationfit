-- =====================================================================
-- AI Model Pricing Table
-- Stores accurate pricing information for all AI models
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.ai_model_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Model identification
  model_name text NOT NULL UNIQUE,
  provider text NOT NULL DEFAULT 'openai',
  model_family text, -- e.g., 'gpt-4', 'gpt-3.5', 'claude', 'whisper'
  
  -- Pricing (in USD per 1K tokens)
  input_price_per_1k numeric(10, 6) NOT NULL,  -- $0.03 = 0.030000
  output_price_per_1k numeric(10, 6) NOT NULL, -- $0.06 = 0.060000
  
  -- Additional pricing for non-text models
  price_per_unit numeric(10, 6),     -- For audio (per second), images (per image)
  unit_type text,                     -- 'second', 'image', 'character', etc.
  
  -- Metadata
  is_active boolean DEFAULT true,
  effective_date timestamptz DEFAULT now(),
  notes text,
  
  -- Audit
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_ai_model_pricing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_model_pricing_updated_at
  BEFORE UPDATE ON public.ai_model_pricing
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_model_pricing_updated_at();

-- Insert current OpenAI pricing (as of Nov 2024)
INSERT INTO public.ai_model_pricing (model_name, provider, model_family, input_price_per_1k, output_price_per_1k, notes) VALUES
  -- GPT-4o models
  ('gpt-4o', 'openai', 'gpt-4', 0.005000, 0.015000, 'GPT-4o - Most capable multimodal model'),
  ('gpt-4o-mini', 'openai', 'gpt-4', 0.000150, 0.000600, 'GPT-4o mini - Fast and affordable'),
  ('gpt-4o-2024-11-20', 'openai', 'gpt-4', 0.002500, 0.010000, 'GPT-4o latest snapshot'),
  
  -- GPT-4 models
  ('gpt-4-turbo', 'openai', 'gpt-4', 0.010000, 0.030000, 'GPT-4 Turbo with 128K context'),
  ('gpt-4', 'openai', 'gpt-4', 0.030000, 0.060000, 'GPT-4 base model'),
  
  -- GPT-3.5 models
  ('gpt-3.5-turbo', 'openai', 'gpt-3.5', 0.001500, 0.002000, 'GPT-3.5 Turbo - Fast and efficient'),
  
  -- GPT-5 (placeholder - adjust when available)
  ('gpt-5', 'openai', 'gpt-5', 0.010000, 0.030000, 'GPT-5 - Future model (estimated pricing)'),
  ('gpt-5-mini', 'openai', 'gpt-5', 0.003000, 0.010000, 'GPT-5 mini (estimated pricing)'),
  ('gpt-5-nano', 'openai', 'gpt-5', 0.001000, 0.003000, 'GPT-5 nano (estimated pricing)')
ON CONFLICT (model_name) DO NOTHING;

-- Insert audio model pricing
INSERT INTO public.ai_model_pricing (model_name, provider, model_family, input_price_per_1k, output_price_per_1k, price_per_unit, unit_type, notes) VALUES
  ('whisper-1', 'openai', 'whisper', 0, 0, 0.006000, 'second', 'Whisper - $0.006 per second of audio'),
  ('tts-1', 'openai', 'tts', 0, 0, 0.015000, 'character', 'TTS-1 - $0.015 per 1K characters'),
  ('tts-1-hd', 'openai', 'tts', 0, 0, 0.030000, 'character', 'TTS-1 HD - $0.030 per 1K characters')
ON CONFLICT (model_name) DO NOTHING;

-- Insert image model pricing
INSERT INTO public.ai_model_pricing (model_name, provider, model_family, input_price_per_1k, output_price_per_1k, price_per_unit, unit_type, notes) VALUES
  ('dall-e-3', 'openai', 'dall-e', 0, 0, 0.040000, 'image', 'DALL-E 3 standard (1024x1024) - $0.040 per image'),
  ('dall-e-2', 'openai', 'dall-e', 0, 0, 0.020000, 'image', 'DALL-E 2 (1024x1024) - $0.020 per image')
ON CONFLICT (model_name) DO NOTHING;

-- Enable RLS
ALTER TABLE public.ai_model_pricing ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read pricing (needed for cost calculations)
CREATE POLICY "Anyone can read model pricing"
  ON public.ai_model_pricing
  FOR SELECT
  USING (true);

-- Policy: Only service_role can modify pricing (via admin panel)
-- Service role is used for admin operations, no user-level admin check needed
CREATE POLICY "Only service role can modify model pricing"
  ON public.ai_model_pricing
  FOR INSERT, UPDATE, DELETE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================================
-- Function to calculate cost for a token usage record
-- =====================================================================

CREATE OR REPLACE FUNCTION public.calculate_ai_cost(
  p_model_name text,
  p_prompt_tokens integer,
  p_completion_tokens integer,
  p_units numeric DEFAULT NULL  -- For audio/image models
)
RETURNS numeric AS $$
DECLARE
  v_input_price numeric;
  v_output_price numeric;
  v_unit_price numeric;
  v_total_cost numeric;
BEGIN
  -- Get pricing for the model
  SELECT 
    input_price_per_1k,
    output_price_per_1k,
    price_per_unit
  INTO 
    v_input_price,
    v_output_price,
    v_unit_price
  FROM public.ai_model_pricing
  WHERE model_name = p_model_name
    AND is_active = true
  LIMIT 1;
  
  -- If model not found, return 0
  IF v_input_price IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Calculate cost based on model type
  IF v_unit_price IS NOT NULL AND p_units IS NOT NULL THEN
    -- Audio/Image model - use unit pricing
    v_total_cost := v_unit_price * p_units;
  ELSE
    -- Text model - use token pricing
    v_total_cost := 
      (p_prompt_tokens / 1000.0) * v_input_price +
      (p_completion_tokens / 1000.0) * v_output_price;
  END IF;
  
  -- Return cost in cents (multiply by 100)
  RETURN ROUND(v_total_cost * 100);
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- Example usage:
-- SELECT calculate_ai_cost('gpt-4o', 1000, 500, NULL);  -- Text model
-- SELECT calculate_ai_cost('whisper-1', 0, 0, 60);      -- 60 seconds audio
-- =====================================================================

COMMENT ON TABLE public.ai_model_pricing IS 'Stores pricing information for AI models to calculate accurate usage costs';
COMMENT ON FUNCTION public.calculate_ai_cost IS 'Calculates cost in cents for a given AI model usage';

