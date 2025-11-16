-- ============================================================================
-- Drop Deprecated cost_estimate Column
-- ============================================================================
-- Date: November 16, 2025
-- 
-- REASON: cost_estimate column is deprecated and no longer used
-- - Used flawed hardcoded pricing (10x off for some models)
-- - Replaced by calculated_cost_cents (accurate from ai_model_pricing)
-- - New code sets it to 0, so it's dead weight
-- 
-- SAFE TO DROP:
-- - Admin dashboard uses calculated_cost_cents
-- - No code references cost_estimate anymore
-- - Historical data already recalculated
-- ============================================================================

BEGIN;

-- Check current state
SELECT 
  'Before Drop' as status,
  COUNT(*) as total_rows,
  COUNT(cost_estimate) as has_cost_estimate,
  COUNT(calculated_cost_cents) as has_calculated_cost
FROM token_usage;

-- Step 1: Drop the view first (it depends on cost_estimate column)
DROP VIEW IF EXISTS token_usage_with_costs;

-- Step 2: Now we can drop the column
ALTER TABLE token_usage 
DROP COLUMN IF EXISTS cost_estimate;

-- Step 3: Recreate view without cost_estimate references

CREATE VIEW token_usage_with_costs AS
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
  
  -- Cost calculations (only accurate costs now)
  (calculated_cost_cents::numeric / 100.0) AS accurate_cost_usd,
  
  -- NEW: Reconciliation fields
  openai_request_id,
  openai_created,
  system_fingerprint,
  (actual_cost_cents::numeric / 100.0) AS actual_cost_usd,
  reconciled_at,
  reconciliation_status,
  
  -- Reconciliation cost comparison
  CASE
    WHEN actual_cost_cents IS NOT NULL AND calculated_cost_cents IS NOT NULL
    THEN ((actual_cost_cents - calculated_cost_cents)::numeric / 100.0)
    ELSE NULL
  END AS reconciliation_difference_usd,
  
  CASE
    WHEN actual_cost_cents IS NOT NULL AND calculated_cost_cents > 0
    THEN ROUND(((actual_cost_cents::numeric / calculated_cost_cents) * 100), 2)
    ELSE NULL
  END AS reconciliation_accuracy_percentage,
  
  -- Usage type
  CASE
    WHEN (audio_seconds IS NOT NULL AND audio_seconds > 0) THEN 'audio'
    WHEN (input_tokens > 0 OR output_tokens > 0) THEN 'text'
    ELSE 'other'
  END AS usage_type,
  
  success,
  error_message,
  metadata,
  created_at
FROM token_usage
WHERE success = true;

COMMENT ON VIEW token_usage_with_costs IS 
  'Shows token usage with accurate cost analysis and OpenAI reconciliation data. Only includes successful operations.';

-- Verify it's gone
SELECT 
  'After Drop' as status,
  column_name
FROM information_schema.columns
WHERE table_name = 'token_usage'
  AND table_schema = 'public'
ORDER BY ordinal_position;

COMMIT;

-- ============================================================================
-- DONE!
-- ============================================================================
-- The flawed cost_estimate column is now gone
-- Only calculated_cost_cents (our estimate) remains
-- actual_cost_cents will be populated during OpenAI reconciliation
-- ============================================================================

