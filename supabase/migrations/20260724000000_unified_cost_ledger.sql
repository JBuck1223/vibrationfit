-- ============================================================================
-- Unified AI Cost Ledger
-- ============================================================================
-- Purpose:
--   1. token_usage becomes the single per-user cost ledger across ALL
--      providers (OpenAI, Vercel AI Gateway, Mureka, fal.ai, ElevenLabs, ...)
--      - provider:            which vendor billed us for the call
--      - provider_request_id: vendor-side id (gateway generationId, Mureka
--                             task id, fal request id) for reconciliation
--      - billable:            false = cost-tracking only; never deducts a
--                             member's token balance (background/admin/system)
--   2. provider_costs_daily stores daily provider-billed totals fetched from
--      each vendor's billing API (source of truth for variance reporting).
--   3. Balance RPCs exclude billable = false rows so newly-instrumented
--      background/admin usage never reduces member balances.
--   4. Pricing rows for previously-untracked models (Mureka, fal cinematic,
--      Google TTS, fal Whisper).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. token_usage: new ledger columns
-- ----------------------------------------------------------------------------

ALTER TABLE public.token_usage
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS provider_request_id text,
  ADD COLUMN IF NOT EXISTS billable boolean NOT NULL DEFAULT true;

-- Allow system-attributed cost rows (cron transcription, cinematic pipeline)
-- that have no acting member. Balance RPCs match on user_id = ANY(...), so
-- NULL rows can never affect member balances.
ALTER TABLE public.token_usage ALTER COLUMN user_id DROP NOT NULL;

COMMENT ON COLUMN public.token_usage.provider IS
  'Vendor billed for this call: openai | vercel_gateway | mureka | fal | elevenlabs | google';
COMMENT ON COLUMN public.token_usage.provider_request_id IS
  'Vendor-side request id (gateway generationId, Mureka task id, fal request id) used for cost reconciliation';
COMMENT ON COLUMN public.token_usage.billable IS
  'false = cost-tracking only (background/admin/system work); excluded from member token balance math';

CREATE INDEX IF NOT EXISTS idx_token_usage_provider_created
  ON public.token_usage (provider, created_at);

-- Fast lookup of rows awaiting per-request cost reconciliation
CREATE INDEX IF NOT EXISTS idx_token_usage_pending_reconciliation
  ON public.token_usage (created_at)
  WHERE reconciliation_status = 'pending';

-- Backfill provider from model naming conventions.
-- Gateway routes historically stored the gateway generation id in
-- openai_request_id, so copy it to provider_request_id for gemini rows.
UPDATE public.token_usage SET provider = 'vercel_gateway'
WHERE provider IS NULL AND model_used ILIKE 'gemini%';

UPDATE public.token_usage
SET provider_request_id = openai_request_id
WHERE provider = 'vercel_gateway'
  AND provider_request_id IS NULL
  AND openai_request_id IS NOT NULL;

UPDATE public.token_usage SET provider = 'fal'
WHERE provider IS NULL AND model_used ILIKE 'fal-ai%';

UPDATE public.token_usage SET provider = 'elevenlabs'
WHERE provider IS NULL AND model_used ILIKE 'elevenlabs%';

UPDATE public.token_usage SET provider = 'openai'
WHERE provider IS NULL
  AND (model_used ILIKE 'gpt%'
    OR model_used ILIKE 'o1%'
    OR model_used ILIKE 'o3%'
    OR model_used ILIKE 'chatgpt%'
    OR model_used ILIKE 'dall-e%'
    OR model_used ILIKE 'whisper%'
    OR model_used ILIKE 'tts%');

-- Claude models and provider-prefixed models (e.g. google/gemini-2.5-pro)
-- are only reachable through the Vercel AI Gateway in this app.
UPDATE public.token_usage
SET provider = 'vercel_gateway',
    provider_request_id = COALESCE(provider_request_id, openai_request_id)
WHERE provider IS NULL
  AND (model_used ILIKE 'claude%' OR model_used ILIKE '%/%');

-- ----------------------------------------------------------------------------
-- 2. token_usage: new action types
-- ----------------------------------------------------------------------------

ALTER TABLE token_usage DROP CONSTRAINT IF EXISTS token_usage_action_type_check;
ALTER TABLE token_usage ADD CONSTRAINT token_usage_action_type_check
  CHECK (action_type = ANY (ARRAY[
    'assessment_scoring'::text,
    'vision_generation'::text,
    'vision_refinement'::text,
    'blueprint_generation'::text,
    'chat_conversation'::text,
    'audio_generation'::text,
    'image_generation'::text,
    'transcription'::text,
    'admin_grant'::text,
    'admin_deduct'::text,
    'subscription_grant'::text,
    'trial_grant'::text,
    'token_pack_purchase'::text,
    'life_vision_category_summary'::text,
    'life_vision_master_assembly'::text,
    'prompt_suggestions'::text,
    'frequency_flip'::text,
    'vibrational_analysis'::text,
    'viva_scene_generation'::text,
    'north_star_reflection'::text,
    'voice_profile_analysis'::text,
    'vision_board_ideas'::text,
    'life_vision_category_generation'::text,
    'imagination_starter'::text,
    'focus_story_generation'::text,
    'incantation_generation'::text,
    'story_refinement'::text,
    'song_lyrics_generation'::text,
    'project_organize'::text,
    -- New: previously-untracked spend categories
    'song_music_generation'::text,
    'song_stems_generation'::text,
    'video_generation'::text,
    'background_processing'::text,
    'admin_tool'::text
  ]));

-- ----------------------------------------------------------------------------
-- 3. Balance RPCs: exclude non-billable usage
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_user_token_balance(p_user_id uuid) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
DECLARE
  v_grant_user_id UUID;
  v_household_id UUID;
  v_household_user_ids UUID[];
  v_total_granted BIGINT;
  v_total_used BIGINT;
  v_total_expired BIGINT;
  v_active_balance BIGINT;
  v_grants JSONB;
BEGIN
  -- Check if user is in an active household (household_id lives on user_accounts)
  SELECT ua.household_id INTO v_household_id
  FROM user_accounts ua
  WHERE ua.id = p_user_id
    AND ua.household_id IS NOT NULL;

  IF v_household_id IS NOT NULL THEN
    -- Get the admin (bill-payer) of this household
    SELECT h.admin_user_id INTO v_grant_user_id
    FROM households h
    WHERE h.id = v_household_id;

    -- All active members share usage against the admin's grants
    SELECT ARRAY_AGG(hm.user_id) INTO v_household_user_ids
    FROM household_members hm
    WHERE hm.household_id = v_household_id
      AND hm.status = 'active';

    -- Safety: if array is null, fall back to just the requesting user
    IF v_household_user_ids IS NULL THEN
      v_household_user_ids := ARRAY[p_user_id];
    END IF;
  ELSE
    -- Solo user: grants and usage are their own
    v_grant_user_id := p_user_id;
    v_household_user_ids := ARRAY[p_user_id];
  END IF;

  -- Unexpired grants (from the grant owner = admin or self)
  SELECT COALESCE(SUM(tokens_used), 0)
  INTO v_total_granted
  FROM token_transactions
  WHERE user_id = v_grant_user_id
    AND action_type IN ('subscription_grant', 'renewal_grant', 'trial_grant',
                        'token_pack_purchase', 'pack_purchase', 'admin_grant')
    AND tokens_used > 0
    AND (expires_at IS NULL OR expires_at > NOW());

  -- Expired grants (from the grant owner)
  SELECT COALESCE(SUM(tokens_used), 0)
  INTO v_total_expired
  FROM token_transactions
  WHERE user_id = v_grant_user_id
    AND action_type IN ('subscription_grant', 'renewal_grant', 'trial_grant', 'admin_grant')
    AND tokens_used > 0
    AND expires_at IS NOT NULL
    AND expires_at <= NOW();

  -- Total usage from ALL household members (or just the solo user).
  -- billable = false rows are cost-tracking only (background/admin work)
  -- and never reduce a member's balance.
  SELECT COALESCE(SUM(tokens_used), 0)
  INTO v_total_used
  FROM token_usage
  WHERE user_id = ANY(v_household_user_ids)
    AND success = true
    AND billable = true
    AND action_type NOT IN ('admin_grant', 'subscription_grant', 'renewal_grant',
                            'trial_grant', 'token_pack_purchase', 'pack_purchase',
                            'admin_deduct');

  v_active_balance := v_total_granted - v_total_used;
  IF v_active_balance < 0 THEN
    v_active_balance := 0;
  END IF;

  -- Grants summary (from grant owner)
  SELECT JSONB_AGG(
    JSONB_BUILD_OBJECT(
      'action_type', action_type,
      'total_granted', total_granted,
      'expires_at', expires_at,
      'is_expired', (expires_at IS NOT NULL AND expires_at <= NOW())
    )
  )
  INTO v_grants
  FROM (
    SELECT
      action_type,
      SUM(tokens_used) as total_granted,
      MAX(expires_at) as expires_at
    FROM token_transactions
    WHERE user_id = v_grant_user_id
      AND action_type IN ('subscription_grant', 'renewal_grant', 'trial_grant',
                          'token_pack_purchase', 'pack_purchase', 'admin_grant')
      AND tokens_used > 0
    GROUP BY action_type
    ORDER BY MAX(created_at)
  ) grants_summary;

  RETURN JSONB_BUILD_OBJECT(
    'total_active', v_active_balance,
    'total_granted', v_total_granted,
    'total_used', v_total_used,
    'total_expired', v_total_expired,
    'grants', COALESCE(v_grants, '[]'::jsonb),
    'is_household_shared', v_household_id IS NOT NULL,
    'grant_owner_id', v_grant_user_id
  );
END;
$$;

COMMENT ON FUNCTION public.get_user_token_balance(p_user_id uuid)
IS 'Shared-pool model: household members resolve to admin grants minus all members billable usage. billable=false rows are cost-tracking only.';

CREATE OR REPLACE FUNCTION public.calculate_token_balance(p_user_id uuid) RETURNS integer
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
  v_grants INTEGER;
  v_usage INTEGER;
  v_deductions INTEGER;
BEGIN
  -- Get total grants from token_transactions (source of truth)
  SELECT COALESCE(SUM(tokens_used), 0) INTO v_grants
  FROM token_transactions
  WHERE user_id = p_user_id
    AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
    AND tokens_used > 0;

  -- Get total billable AI usage from token_usage
  SELECT COALESCE(SUM(tokens_used), 0) INTO v_usage
  FROM token_usage
  WHERE user_id = p_user_id
    AND action_type NOT IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase', 'admin_deduct')
    AND tokens_used > 0
    AND success = true
    AND billable = true;

  -- Get deductions from token_transactions
  SELECT COALESCE(SUM(ABS(tokens_used)), 0) INTO v_deductions
  FROM token_transactions
  WHERE user_id = p_user_id
    AND (action_type = 'admin_deduct' OR tokens_used < 0);

  -- Return calculated balance (grants - usage - deductions)
  RETURN GREATEST(0, v_grants - v_usage - v_deductions);
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. provider_costs_daily: provider-billed totals (source of truth)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.provider_costs_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  day date NOT NULL,
  line_item text NOT NULL DEFAULT '',
  amount_cents numeric(14,4) NOT NULL DEFAULT 0,
  raw jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, day, line_item)
);

COMMENT ON TABLE public.provider_costs_daily IS
  'Daily provider-billed cost totals fetched from vendor billing APIs (OpenAI Costs API, Vercel AI Gateway credits, Mureka account billing). Source of truth for variance vs the token_usage ledger.';

-- Service-role only: RLS enabled with no policies. Admin API routes read this
-- through the service client.
ALTER TABLE public.provider_costs_daily ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 5. Pricing rows for previously-untracked models
-- ----------------------------------------------------------------------------
-- unit_type semantics (matched in src/lib/tokens/tracking.ts):
--   'song' / 'stems' / 'call' : flat price_per_unit * unit_count
--   'second'                  : price_per_unit * audio_seconds (also used for video seconds)
--   'minute'                  : price_per_unit * minutes
--   'per_1k_chars'            : price_per_unit per 1000 characters
--   'image'                   : flat price_per_unit per image

INSERT INTO public.ai_model_pricing
  (model_name, provider, unit_type, input_price_per_1m, output_price_per_1m, price_per_unit, is_active, notes)
VALUES
  -- Mureka music generation (fixed per-call pricing from platform.mureka.ai/pricing)
  ('mureka-song',   'mureka', 'song',  0, 0, 0.045, true, 'Per generated song (V8/O2 rate; V7.6 is $0.03). Task returns multiple songs; unit_count = song count.'),
  ('mureka-stems',  'mureka', 'stems', 0, 0, 0.060, true, 'Audio separation (stems) per song.'),
  ('mureka-upload', 'mureka', 'call',  0, 0, 0.000, true, 'Reference file upload — free, tracked for audit trail.'),

  -- fal.ai cinematic image models (per image)
  ('fal-ai/flux-2-pro',           'fal', 'image', 0, 0, 0.060, true, 'Estimate — verify against fal.ai pricing and adjust in admin.'),
  ('fal-ai/flux-2-pro/edit',      'fal', 'image', 0, 0, 0.060, true, 'Estimate — verify against fal.ai pricing and adjust in admin.'),
  ('fal-ai/flux-2',               'fal', 'image', 0, 0, 0.030, true, 'Estimate — verify against fal.ai pricing and adjust in admin.'),
  ('fal-ai/nano-banana-2',        'fal', 'image', 0, 0, 0.040, true, 'Estimate — verify against fal.ai pricing and adjust in admin.'),
  ('fal-ai/nano-banana-pro/edit', 'fal', 'image', 0, 0, 0.100, true, 'Estimate — verify against fal.ai pricing and adjust in admin.'),

  -- fal.ai cinematic video models (per second of generated video)
  ('fal-ai/veo3.1/first-last-frame-to-video',      'fal', 'second', 0, 0, 0.400, true, 'Estimate — verify against fal.ai pricing and adjust in admin.'),
  ('fal-ai/veo3.1/image-to-video',                 'fal', 'second', 0, 0, 0.400, true, 'Estimate — verify against fal.ai pricing and adjust in admin.'),
  ('fal-ai/veo3.1',                                'fal', 'second', 0, 0, 0.400, true, 'Estimate — verify against fal.ai pricing and adjust in admin.'),
  ('fal-ai/veo3/image-to-video',                   'fal', 'second', 0, 0, 0.500, true, 'Estimate — verify against fal.ai pricing and adjust in admin.'),
  ('fal-ai/veo3',                                  'fal', 'second', 0, 0, 0.500, true, 'Estimate — verify against fal.ai pricing and adjust in admin.'),
  ('fal-ai/veo2/image-to-video',                   'fal', 'second', 0, 0, 0.500, true, 'Estimate — verify against fal.ai pricing and adjust in admin.'),
  ('fal-ai/kling-video/v3/pro/image-to-video',     'fal', 'second', 0, 0, 0.280, true, 'Estimate — verify against fal.ai pricing and adjust in admin.'),
  ('fal-ai/kling-video/v3/pro/text-to-video',      'fal', 'second', 0, 0, 0.280, true, 'Estimate — verify against fal.ai pricing and adjust in admin.'),
  ('fal-ai/kling-video/v3/standard/image-to-video','fal', 'second', 0, 0, 0.140, true, 'Estimate — verify against fal.ai pricing and adjust in admin.'),
  ('fal-ai/kling-video/v2.1/master/image-to-video','fal', 'second', 0, 0, 0.280, true, 'Estimate — verify against fal.ai pricing and adjust in admin.'),
  ('fal-ai/kling-video/v2/master/image-to-video',  'fal', 'second', 0, 0, 0.280, true, 'Estimate — verify against fal.ai pricing and adjust in admin.'),
  ('bytedance/seedance-2.0/image-to-video',        'fal', 'second', 0, 0, 0.150, true, 'Estimate — verify against fal.ai pricing and adjust in admin.'),
  ('bytedance/seedance-2.0/text-to-video',         'fal', 'second', 0, 0, 0.150, true, 'Estimate — verify against fal.ai pricing and adjust in admin.'),

  -- fal.ai Whisper transcription (session recordings)
  ('fal-ai/whisper', 'fal', 'minute', 0, 0, 0.005, true, 'Estimate — verify against fal.ai pricing and adjust in admin.'),

  -- Google Cloud TTS (admin audio preview)
  ('google-tts', 'google', 'per_1k_chars', 0, 0, 0.016, true, 'Google Cloud TTS WaveNet/Neural2 rate ($16 per 1M chars).')

ON CONFLICT (model_name) DO UPDATE SET
  provider            = EXCLUDED.provider,
  unit_type           = EXCLUDED.unit_type,
  input_price_per_1m  = EXCLUDED.input_price_per_1m,
  output_price_per_1m = EXCLUDED.output_price_per_1m,
  price_per_unit      = EXCLUDED.price_per_unit,
  is_active           = EXCLUDED.is_active,
  notes               = EXCLUDED.notes,
  updated_at          = now();
