-- =====================================================================
-- Integrate AI Cost Tracking with Existing token_usage Table
-- =====================================================================

-- Add new columns for calculated costs and audio tracking
ALTER TABLE public.token_usage 
  ADD COLUMN IF NOT EXISTS calculated_cost_cents integer,
  ADD COLUMN IF NOT EXISTS audio_seconds numeric(10,2),
  ADD COLUMN IF NOT EXISTS audio_duration_formatted text;

COMMENT ON COLUMN public.token_usage.cost_estimate IS 'OLD: Inaccurate estimate (kept for reference)';
COMMENT ON COLUMN public.token_usage.calculated_cost_cents IS 'NEW: Accurate cost calculated from ai_model_pricing';
COMMENT ON COLUMN public.token_usage.audio_seconds IS 'Duration in seconds for audio transcriptions (Whisper)';
COMMENT ON COLUMN public.token_usage.audio_duration_formatted IS 'Human-readable duration (e.g., "2m 30s")';

-- Create index for cost queries
CREATE INDEX IF NOT EXISTS idx_token_usage_calculated_cost 
  ON public.token_usage(calculated_cost_cents) 
  WHERE calculated_cost_cents IS NOT NULL;

-- =====================================================================
-- Backfill calculated costs for existing records
-- =====================================================================

-- For records that have model_used and token counts
UPDATE public.token_usage
SET calculated_cost_cents = public.calculate_ai_cost(
  model_used,
  COALESCE(input_tokens, 0),
  COALESCE(output_tokens, 0),
  NULL
)
WHERE calculated_cost_cents IS NULL
  AND model_used IS NOT NULL
  AND (input_tokens > 0 OR output_tokens > 0)
  AND EXISTS (
    SELECT 1 FROM public.ai_model_pricing 
    WHERE model_name = token_usage.model_used 
    AND is_active = true
  );

-- =====================================================================
-- Enhanced apply_token_usage function
-- Updates to automatically calculate accurate costs
-- =====================================================================

CREATE OR REPLACE FUNCTION public.apply_token_usage(
  p_user_id uuid,
  p_action_type text,
  p_model_used text,
  p_tokens_used integer,
  p_input_tokens integer,
  p_output_tokens integer,
  p_cost_estimate_cents integer,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_audio_seconds numeric DEFAULT NULL  -- NEW: Audio duration parameter
)
RETURNS void AS $$
DECLARE
  v_effective_tokens integer;
  v_override integer;
  v_calculated_cost integer;
  v_audio_formatted text;
BEGIN
  IF p_tokens_used IS NULL THEN
    p_tokens_used := 0;
  END IF;

  -- Check for token override
  SELECT token_value INTO v_override
  FROM public.ai_action_token_overrides
  WHERE action_type = p_action_type;

  -- Calculate effective tokens
  v_effective_tokens := COALESCE(NULLIF(p_input_tokens, 0), 0) + COALESCE(NULLIF(p_output_tokens, 0), 0);
  IF v_effective_tokens = 0 THEN
    v_effective_tokens := COALESCE(NULLIF(p_tokens_used, 0), 0);
  END IF;
  IF v_effective_tokens = 0 THEN
    v_effective_tokens := COALESCE(v_override, 0);
  END IF;

  -- Calculate accurate cost using ai_model_pricing
  v_calculated_cost := public.calculate_ai_cost(
    p_model_used,
    COALESCE(p_input_tokens, 0),
    COALESCE(p_output_tokens, 0),
    p_audio_seconds  -- Pass audio seconds for Whisper/audio models
  );

  -- Format audio duration if provided (e.g., "2m 30s")
  IF p_audio_seconds IS NOT NULL AND p_audio_seconds > 0 THEN
    v_audio_formatted := CASE
      WHEN p_audio_seconds < 60 THEN ROUND(p_audio_seconds, 1)::text || 's'
      WHEN p_audio_seconds < 3600 THEN 
        FLOOR(p_audio_seconds / 60)::text || 'm ' || 
        ROUND(p_audio_seconds % 60)::text || 's'
      ELSE
        FLOOR(p_audio_seconds / 3600)::text || 'h ' ||
        FLOOR((p_audio_seconds % 3600) / 60)::text || 'm ' ||
        ROUND(p_audio_seconds % 60)::text || 's'
    END;
  END IF;

  -- Insert token_usage record with BOTH old estimate and new calculated cost
  INSERT INTO public.token_usage(
    user_id,
    action_type,
    model_used,
    tokens_used,
    input_tokens,
    output_tokens,
    audio_seconds,               -- NEW: Audio duration
    audio_duration_formatted,    -- NEW: Human-readable duration
    cost_estimate,               -- Keep old estimate for reference
    calculated_cost_cents,       -- NEW: Accurate cost
    success,
    metadata,
    created_at
  ) VALUES (
    p_user_id,
    p_action_type,
    p_model_used,
    v_effective_tokens,
    COALESCE(p_input_tokens, 0),
    COALESCE(p_output_tokens, 0),
    p_audio_seconds,              -- NEW: Audio duration
    v_audio_formatted,            -- NEW: Formatted duration
    COALESCE(p_cost_estimate_cents, 0),  -- Old estimate
    v_calculated_cost,                    -- NEW: Calculated cost
    true,
    COALESCE(p_metadata, '{}'),
    NOW()
  );

END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.apply_token_usage IS 'Tracks token usage with accurate cost calculation from ai_model_pricing';

-- =====================================================================
-- Helper view for cost analysis
-- =====================================================================

CREATE OR REPLACE VIEW public.token_usage_with_costs AS
SELECT 
  id,
  user_id,
  action_type,
  model_used,
  tokens_used,
  input_tokens,
  output_tokens,
  audio_seconds,
  audio_duration_formatted,
  
  -- Cost comparison
  cost_estimate / 100.0 as old_estimate_usd,
  calculated_cost_cents / 100.0 as accurate_cost_usd,
  (calculated_cost_cents - cost_estimate) / 100.0 as cost_difference_usd,
  
  -- Accuracy check
  CASE 
    WHEN calculated_cost_cents IS NOT NULL AND cost_estimate > 0 THEN
      ROUND(((calculated_cost_cents::numeric / cost_estimate) * 100), 2)
    ELSE NULL
  END as accuracy_percentage,
  
  -- Usage type indicator
  CASE
    WHEN audio_seconds IS NOT NULL AND audio_seconds > 0 THEN 'audio'
    WHEN input_tokens > 0 OR output_tokens > 0 THEN 'text'
    ELSE 'other'
  END as usage_type,
  
  success,
  error_message,
  metadata,
  created_at
FROM public.token_usage
WHERE success = true;

COMMENT ON VIEW public.token_usage_with_costs IS 'Shows token usage with both old estimates and accurate calculated costs, including audio tracking';

-- =====================================================================
-- Grant SELECT on view to authenticated users
-- =====================================================================

GRANT SELECT ON public.token_usage_with_costs TO authenticated;

