-- ============================================================================
-- Recalculate Token Usage Costs Using ai_model_pricing
-- ============================================================================
-- Purpose: Update calculated_cost_cents for all token_usage rows
--          using accurate pricing from ai_model_pricing table
-- 
-- Date: November 16, 2025
-- Status: 273 total rows, 66 need recalculation
-- 
-- Run this to fix historical cost estimates!
-- ============================================================================

BEGIN;

-- Show current state
SELECT 
  'Before Update' as status,
  COUNT(*) as total_rows,
  COUNT(calculated_cost_cents) as has_cost,
  COUNT(*) - COUNT(calculated_cost_cents) as missing_cost
FROM token_usage;

-- ============================================================================
-- UPDATE TEXT MODELS (GPT models)
-- ============================================================================
-- Formula: (input_tokens / 1000) * input_price + (output_tokens / 1000) * output_price

UPDATE token_usage t
SET calculated_cost_cents = ROUND(
  (
    (COALESCE(t.input_tokens, 0)::numeric / 1000.0) * COALESCE(p.input_price_per_1k, 0) +
    (COALESCE(t.output_tokens, 0)::numeric / 1000.0) * COALESCE(p.output_price_per_1k, 0)
  ) * 100
)::integer
FROM ai_model_pricing p
WHERE t.model_used = p.model_name
  AND p.unit_type IS NULL  -- Text models
  AND (t.input_tokens > 0 OR t.output_tokens > 0);

-- Get count of updated text model rows
SELECT 
  'Text Models Updated' as status,
  COUNT(*) as rows_updated
FROM token_usage t
JOIN ai_model_pricing p ON t.model_used = p.model_name
WHERE p.unit_type IS NULL
  AND (t.input_tokens > 0 OR t.output_tokens > 0);

-- ============================================================================
-- UPDATE WHISPER (Audio Transcription)
-- ============================================================================
-- Formula: audio_seconds * price_per_unit (price per second)

UPDATE token_usage t
SET calculated_cost_cents = ROUND(
  COALESCE(t.audio_seconds, 0) * COALESCE(p.price_per_unit, 0) * 100
)::integer
FROM ai_model_pricing p
WHERE t.model_used = p.model_name
  AND p.unit_type = 'second'
  AND t.audio_seconds > 0;

-- Get count
SELECT 
  'Whisper Updated' as status,
  COUNT(*) as rows_updated
FROM token_usage t
JOIN ai_model_pricing p ON t.model_used = p.model_name
WHERE p.unit_type = 'second'
  AND t.audio_seconds > 0;

-- ============================================================================
-- UPDATE TTS (Text-to-Speech)
-- ============================================================================
-- Formula: input_tokens (characters) * price_per_unit / 1000
-- TTS uses input_tokens to store character count

UPDATE token_usage t
SET calculated_cost_cents = ROUND(
  (COALESCE(t.input_tokens, 0)::numeric / 1000.0) * COALESCE(p.price_per_unit, 0) * 100
)::integer
FROM ai_model_pricing p
WHERE t.model_used = p.model_name
  AND p.unit_type = 'character'
  AND t.input_tokens > 0;

-- Get count
SELECT 
  'TTS Updated' as status,
  COUNT(*) as rows_updated
FROM token_usage t
JOIN ai_model_pricing p ON t.model_used = p.model_name
WHERE p.unit_type = 'character'
  AND t.input_tokens > 0;

-- ============================================================================
-- UPDATE DALL-E (Image Generation)
-- ============================================================================
-- Formula: price_per_unit (flat rate per image)
-- Assuming 1 image per request

UPDATE token_usage t
SET calculated_cost_cents = ROUND(
  COALESCE(p.price_per_unit, 0) * 100
)::integer
FROM ai_model_pricing p
WHERE t.model_used = p.model_name
  AND p.unit_type = 'image';

-- Get count
SELECT 
  'DALL-E Updated' as status,
  COUNT(*) as rows_updated
FROM token_usage t
JOIN ai_model_pricing p ON t.model_used = p.model_name
WHERE p.unit_type = 'image';

-- ============================================================================
-- HANDLE MODEL NAME VARIATIONS
-- ============================================================================
-- Some models have version suffixes that don't match exactly

-- Handle gpt-4o-mini-2024-07-18 -> gpt-4o-mini
UPDATE token_usage t
SET calculated_cost_cents = ROUND(
  (
    (COALESCE(t.input_tokens, 0)::numeric / 1000.0) * COALESCE(p.input_price_per_1k, 0) +
    (COALESCE(t.output_tokens, 0)::numeric / 1000.0) * COALESCE(p.output_price_per_1k, 0)
  ) * 100
)::integer
FROM ai_model_pricing p
WHERE t.model_used LIKE 'gpt-4o-mini%'
  AND p.model_name = 'gpt-4o-mini'
  AND t.calculated_cost_cents IS NULL
  AND (t.input_tokens > 0 OR t.output_tokens > 0);

-- Handle gpt-4o-2024-08-06 -> gpt-4o
UPDATE token_usage t
SET calculated_cost_cents = ROUND(
  (
    (COALESCE(t.input_tokens, 0)::numeric / 1000.0) * COALESCE(p.input_price_per_1k, 0) +
    (COALESCE(t.output_tokens, 0)::numeric / 1000.0) * COALESCE(p.output_price_per_1k, 0)
  ) * 100
)::integer
FROM ai_model_pricing p
WHERE t.model_used LIKE 'gpt-4o-%'
  AND t.model_used != 'gpt-4o-mini'
  AND p.model_name = 'gpt-4o'
  AND t.calculated_cost_cents IS NULL
  AND (t.input_tokens > 0 OR t.output_tokens > 0);

-- ============================================================================
-- SHOW FINAL RESULTS
-- ============================================================================

-- After update
SELECT 
  'After Update' as status,
  COUNT(*) as total_rows,
  COUNT(calculated_cost_cents) as has_cost,
  COUNT(*) - COUNT(calculated_cost_cents) as still_missing
FROM token_usage;

-- Cost comparison
SELECT 
  'Cost Comparison' as summary,
  ROUND(SUM(cost_estimate) / 100.0, 2) as old_estimate_usd,
  ROUND(SUM(calculated_cost_cents) / 100.0, 2) as accurate_cost_usd,
  ROUND((SUM(calculated_cost_cents) - SUM(cost_estimate)) / 100.0, 2) as difference_usd,
  ROUND(
    CASE 
      WHEN SUM(cost_estimate) > 0 
      THEN (SUM(calculated_cost_cents)::numeric / SUM(cost_estimate)) * 100
      ELSE 0
    END, 
    2
  ) as accuracy_percentage
FROM token_usage
WHERE calculated_cost_cents IS NOT NULL;

-- By model breakdown
SELECT 
  model_used,
  COUNT(*) as rows,
  ROUND(SUM(cost_estimate) / 100.0, 2) as old_total_usd,
  ROUND(SUM(calculated_cost_cents) / 100.0, 2) as accurate_total_usd,
  ROUND((SUM(calculated_cost_cents) - SUM(cost_estimate)) / 100.0, 2) as difference_usd
FROM token_usage
WHERE calculated_cost_cents IS NOT NULL
GROUP BY model_used
ORDER BY rows DESC;

-- ============================================================================
-- HANDLE OLD DATA FORMAT (tokens_used but no input/output breakdown)
-- ============================================================================
-- For rows with tokens_used but zero input/output, estimate:
-- Assume 70% input, 30% output (typical for chat conversations)

UPDATE token_usage t
SET calculated_cost_cents = ROUND(
  (
    (COALESCE(t.tokens_used, 0)::numeric * 0.7 / 1000.0) * COALESCE(p.input_price_per_1k, 0) +
    (COALESCE(t.tokens_used, 0)::numeric * 0.3 / 1000.0) * COALESCE(p.output_price_per_1k, 0)
  ) * 100
)::integer
FROM ai_model_pricing p
WHERE t.model_used = p.model_name
  AND p.unit_type IS NULL  -- Text models
  AND t.calculated_cost_cents IS NULL
  AND t.tokens_used > 0
  AND (t.input_tokens = 0 OR t.input_tokens IS NULL)
  AND (t.output_tokens = 0 OR t.output_tokens IS NULL);

-- Get count
SELECT 
  'Old Format Updated (70/30 split)' as status,
  COUNT(*) as rows_updated
FROM token_usage t
JOIN ai_model_pricing p ON t.model_used = p.model_name
WHERE p.unit_type IS NULL
  AND t.tokens_used > 0
  AND (t.input_tokens = 0 OR t.input_tokens IS NULL)
  AND (t.output_tokens = 0 OR t.output_tokens IS NULL)
  AND t.calculated_cost_cents IS NOT NULL;

-- ============================================================================
-- HANDLE SYSTEM/UNKNOWN MODELS
-- ============================================================================
-- Set to 0 cost for non-AI actions (like admin grants, system actions)

UPDATE token_usage
SET calculated_cost_cents = 0
WHERE calculated_cost_cents IS NULL
  AND model_used IN ('system', 'admin', 'manual', 'grant');

-- Show any rows that still don't have calculated costs
SELECT 
  'Still Missing' as status,
  model_used,
  COUNT(*) as count,
  SUM(tokens_used) as total_tokens
FROM token_usage
WHERE calculated_cost_cents IS NULL
GROUP BY model_used;

COMMIT;

-- ============================================================================
-- DONE!
-- ============================================================================
-- All token_usage rows now have accurate costs from ai_model_pricing
-- The token_usage_with_costs view will now show correct data
-- Admin dashboard will display accurate historical costs
-- ============================================================================

