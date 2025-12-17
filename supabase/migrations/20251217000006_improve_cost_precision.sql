-- Improve cost precision for accurate tracking with per-1M pricing
-- Change from integer cents to numeric with 4 decimal places (0.0001 cents precision)

-- Step 1: Drop dependent view
DROP VIEW IF EXISTS token_usage_with_costs;

-- Step 2: Update cost columns to support fractional cents
ALTER TABLE token_usage 
  ALTER COLUMN calculated_cost_cents TYPE numeric(12, 4);

ALTER TABLE token_usage 
  ALTER COLUMN actual_cost_cents TYPE numeric(12, 4);

-- Add comments for clarity
COMMENT ON COLUMN token_usage.calculated_cost_cents IS 'Calculated cost in cents (supports 4 decimal places for sub-cent precision)';
COMMENT ON COLUMN token_usage.actual_cost_cents IS 'Actual reconciled cost from OpenAI in cents (supports 4 decimal places)';

-- Step 3: Recreate the view (works the same with numeric columns)
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
  (calculated_cost_cents::numeric / 100.0) AS accurate_cost_usd,
  openai_request_id,
  openai_created,
  system_fingerprint,
  (actual_cost_cents::numeric / 100.0) AS actual_cost_usd,
  reconciled_at,
  reconciliation_status,
  CASE 
    WHEN actual_cost_cents IS NOT NULL AND calculated_cost_cents IS NOT NULL 
    THEN ((actual_cost_cents - calculated_cost_cents)::numeric / 100.0)
    ELSE NULL
  END AS reconciliation_difference_usd,
  CASE 
    WHEN actual_cost_cents IS NOT NULL AND calculated_cost_cents > 0 
    THEN ROUND((actual_cost_cents::numeric / calculated_cost_cents::numeric) * 100, 2)
    ELSE NULL
  END AS reconciliation_accuracy_percentage,
  CASE
    WHEN audio_seconds IS NOT NULL AND audio_seconds > 0 THEN 'audio'::text
    WHEN input_tokens > 0 OR output_tokens > 0 THEN 'text'::text
    ELSE 'other'::text
  END AS usage_type,
  success,
  error_message,
  metadata,
  created_at
FROM token_usage
WHERE success = true;

COMMENT ON VIEW token_usage_with_costs IS 'Shows token usage with accurate cost analysis and OpenAI reconciliation data. Only includes successful operations.';

-- Verify the change
DO $$
BEGIN
  RAISE NOTICE 'Cost columns updated to numeric(12, 4) for fractional cent precision';
  RAISE NOTICE 'View token_usage_with_costs recreated successfully';
  RAISE NOTICE 'Example: 100 tokens @ $2.50/1M = 0.025 cents can now be stored accurately';
END $$;

