-- Add pricing entry for the songwriter lyrics model so cost tracking stops
-- falling back to legacy costs ("Model claude-opus-4-5 not found").
-- Standard Anthropic Opus tier pricing (USD per 1M tokens).

INSERT INTO public.ai_model_pricing (model_name, provider, model_family, input_price_per_1m, output_price_per_1m, is_active, token_multiplier, notes)
VALUES ('claude-opus-4-5', 'anthropic', 'claude', 15.00, 75.00, true, 1, 'Used for song lyrics generation (songwriter).')
ON CONFLICT (model_name) DO UPDATE SET
  provider = EXCLUDED.provider,
  model_family = EXCLUDED.model_family,
  input_price_per_1m = EXCLUDED.input_price_per_1m,
  output_price_per_1m = EXCLUDED.output_price_per_1m,
  is_active = true,
  updated_at = now();
