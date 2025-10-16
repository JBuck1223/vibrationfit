-- Token overrides and atomic apply usage
-- 1) ai_action_token_overrides: allow admin to set a fixed token value per action
-- 2) apply_token_usage(): single-transaction insert + balance update

-- Create overrides table
CREATE TABLE IF NOT EXISTS public.ai_action_token_overrides (
  action_type TEXT PRIMARY KEY,
  token_value INTEGER NOT NULL CHECK (token_value >= 0),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.ai_action_token_overrides ENABLE ROW LEVEL SECURITY;

-- Admin-only access (adjust to your admin RLS strategy). For now, allow no public selects.
DROP POLICY IF EXISTS "overrides_select" ON public.ai_action_token_overrides;
DROP POLICY IF EXISTS "overrides_modify" ON public.ai_action_token_overrides;

-- Optional: allow authenticated admins via function-based checks. Replace with your admin policy.
CREATE POLICY "overrides_select"
ON public.ai_action_token_overrides FOR SELECT TO authenticated
USING (true);

CREATE POLICY "overrides_modify"
ON public.ai_action_token_overrides FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- RPC: apply_token_usage
-- Ensures token_usage insert and user_profiles update happen atomically
CREATE OR REPLACE FUNCTION public.apply_token_usage(
  p_user_id UUID,
  p_action_type TEXT,
  p_model_used TEXT,
  p_tokens_used INTEGER,
  p_input_tokens INTEGER,
  p_output_tokens INTEGER,
  p_cost_estimate_cents INTEGER,
  p_metadata JSONB DEFAULT '{}'
) RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_effective_tokens INTEGER;
  v_override INTEGER;
BEGIN
  IF p_tokens_used IS NULL THEN
    p_tokens_used := 0;
  END IF;

  -- If no explicit tokens, try override for this action_type
  SELECT token_value INTO v_override
  FROM public.ai_action_token_overrides
  WHERE action_type = p_action_type;

  v_effective_tokens := COALESCE(NULLIF(p_input_tokens, 0), 0) + COALESCE(NULLIF(p_output_tokens, 0), 0);
  IF v_effective_tokens = 0 THEN
    v_effective_tokens := COALESCE(NULLIF(p_tokens_used, 0), 0);
  END IF;
  IF v_effective_tokens = 0 THEN
    v_effective_tokens := COALESCE(v_override, 0);
  END IF;

  -- Insert token_usage record
  INSERT INTO public.token_usage(
    user_id,
    action_type,
    model_used,
    tokens_used,
    cost_estimate,
    input_tokens,
    output_tokens,
    success,
    metadata,
    created_at
  ) VALUES (
    p_user_id,
    p_action_type,
    p_model_used,
    v_effective_tokens,
    COALESCE(p_cost_estimate_cents, 0),
    COALESCE(p_input_tokens, 0),
    COALESCE(p_output_tokens, 0),
    true,
    COALESCE(p_metadata, '{}'),
    NOW()
  );

  -- Update user profile balances
  UPDATE public.user_profiles
  SET
    vibe_assistant_tokens_used = COALESCE(vibe_assistant_tokens_used, 0) + v_effective_tokens,
    vibe_assistant_tokens_remaining = GREATEST(COALESCE(vibe_assistant_tokens_remaining, 0) - v_effective_tokens, 0),
    vibe_assistant_total_cost = COALESCE(vibe_assistant_total_cost, 0) + COALESCE(p_cost_estimate_cents, 0)
  WHERE user_id = p_user_id;

END;
$$;


