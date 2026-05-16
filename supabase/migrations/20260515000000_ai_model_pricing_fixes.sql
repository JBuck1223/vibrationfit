-- ============================================================================
-- AI Model Pricing Fixes
-- ============================================================================
-- Purpose:
--   1. Add missing models that have been actively tracked in token_usage but
--      had no row in ai_model_pricing (causing $0 estimates).
--   2. Refresh stale per-token prices for already-listed models.
--
-- Notes:
--   - unit_type values intentionally use the strings the application code
--     now matches against in src/lib/tokens/tracking.ts::calculateAccurateTokenCost
--   - input_price_per_1m / output_price_per_1m are USD per 1,000,000 tokens
--   - price_per_unit is USD per "unit" (image, minute, 1k chars)
-- ============================================================================

-- Make sure the pricing helper has a unique key on model_name
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'ai_model_pricing'
      AND indexname = 'ai_model_pricing_model_name_key'
  ) THEN
    -- Some installs already have it; only add if it does not exist
    BEGIN
      ALTER TABLE public.ai_model_pricing
        ADD CONSTRAINT ai_model_pricing_model_name_key UNIQUE (model_name);
    EXCEPTION WHEN duplicate_table OR duplicate_object THEN
      -- ignore
      NULL;
    END;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- INSERT / UPSERT pricing rows
-- ----------------------------------------------------------------------------

INSERT INTO public.ai_model_pricing
  (model_name, unit_type, input_price_per_1m, output_price_per_1m, price_per_unit, is_active)
VALUES
  -- OpenAI text models (refresh)
  ('gpt-4-turbo',     NULL,  10.00,  30.00, NULL, true),
  ('gpt-4o',          NULL,   2.50,  10.00, NULL, true),
  ('gpt-4o-mini',     NULL,   0.15,   0.60, NULL, true),
  ('gpt-5',           NULL,   1.25,  10.00, NULL, true),
  ('gpt-5-mini',      NULL,   0.25,   2.00, NULL, true),
  ('gpt-5-nano',      NULL,   0.05,   0.40, NULL, true),
  ('gpt-3.5-turbo',   NULL,   0.50,   1.50, NULL, true),

  -- Vercel AI Gateway: Google Gemini (canonical, prefix-stripped form)
  ('gemini-2.5-pro',  NULL,   1.25,  10.00, NULL, true),

  -- OpenAI media (canonical unit_type strings the app now understands)
  ('whisper-1',       'minute',       0,    0, 0.006, true),
  ('tts-1',           'per_1k_chars', 0,    0, 0.015, true),
  ('tts-1-hd',        'per_1k_chars', 0,    0, 0.030, true),
  ('dall-e-2',        'image',        0,    0, 0.020, true),
  ('dall-e-3',        'image',        0,    0, 0.040, true),

  -- fal.ai image models (per-image flat pricing)
  ('fal-ai/nano-banana',          'image', 0, 0, 0.040, true),
  ('fal-ai/nano-banana/edit',     'image', 0, 0, 0.040, true),
  ('fal-ai/flux/schnell',         'image', 0, 0, 0.003, true),
  ('fal-ai/flux/dev',             'image', 0, 0, 0.025, true),
  ('fal-ai/flux-pro/v1.1-ultra',  'image', 0, 0, 0.060, true),

  -- ElevenLabs (legacy data, kept for historical cost backfills)
  ('elevenlabs-eleven_multilingual_v2', 'per_1k_chars', 0, 0, 0.30, true),
  ('elevenlabs-eleven_turbo_v2_5',      'per_1k_chars', 0, 0, 0.15, true)

ON CONFLICT (model_name) DO UPDATE SET
  unit_type           = EXCLUDED.unit_type,
  input_price_per_1m  = EXCLUDED.input_price_per_1m,
  output_price_per_1m = EXCLUDED.output_price_per_1m,
  price_per_unit      = EXCLUDED.price_per_unit,
  is_active           = EXCLUDED.is_active,
  updated_at          = now();

-- ----------------------------------------------------------------------------
-- Sanity check (informational)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  cnt int;
BEGIN
  SELECT COUNT(*) INTO cnt FROM public.ai_model_pricing WHERE is_active = true;
  RAISE NOTICE 'Active ai_model_pricing rows after migration: %', cnt;
END $$;
