-- Add OpenAI reconciliation fields to token_usage
-- Generated: November 16, 2025
-- 
-- PURPOSE: Enable cost reconciliation by tracking OpenAI's request IDs
-- This allows matching our estimated costs against OpenAI's actual billing
--
-- KEY FIELD: openai_request_id - matches against OpenAI's billing reports

BEGIN;

-- ============================================================================
-- 1. ADD RECONCILIATION COLUMNS
-- ============================================================================

-- Core reconciliation field - OpenAI's unique request ID
ALTER TABLE token_usage
ADD COLUMN openai_request_id TEXT;

COMMENT ON COLUMN token_usage.openai_request_id IS 
  'OpenAI API request ID (e.g., chatcmpl-123). Used to match against OpenAI billing reports.';

-- OpenAI's timestamp (Unix epoch seconds)
ALTER TABLE token_usage
ADD COLUMN openai_created BIGINT;

COMMENT ON COLUMN token_usage.openai_created IS 
  'Unix timestamp from OpenAI response. Helps with date-based reconciliation.';

-- Model version fingerprint
ALTER TABLE token_usage
ADD COLUMN system_fingerprint TEXT;

COMMENT ON COLUMN token_usage.system_fingerprint IS 
  'OpenAI system fingerprint (e.g., fp_44709d6fcb). Identifies exact model version used.';

-- Actual cost from OpenAI (after reconciliation)
ALTER TABLE token_usage
ADD COLUMN actual_cost_cents INTEGER;

COMMENT ON COLUMN token_usage.actual_cost_cents IS 
  'Actual cost in cents from OpenAI billing (populated during reconciliation).';

-- When reconciliation was performed
ALTER TABLE token_usage
ADD COLUMN reconciled_at TIMESTAMPTZ;

COMMENT ON COLUMN token_usage.reconciled_at IS 
  'Timestamp when this record was reconciled against OpenAI billing.';

-- Reconciliation status
ALTER TABLE token_usage
ADD COLUMN reconciliation_status TEXT DEFAULT 'pending';

COMMENT ON COLUMN token_usage.reconciliation_status IS 
  'Status of cost reconciliation: pending (not yet reconciled), matched (within tolerance), discrepancy (significant difference), not_applicable (non-OpenAI action)';

-- ============================================================================
-- 2. ADD CONSTRAINTS
-- ============================================================================

-- Ensure reconciliation_status is valid
ALTER TABLE token_usage
ADD CONSTRAINT token_usage_reconciliation_status_check 
CHECK (reconciliation_status IN ('pending', 'matched', 'discrepancy', 'not_applicable'));

-- If reconciled_at is set, actual_cost_cents should be set too
ALTER TABLE token_usage
ADD CONSTRAINT token_usage_reconciliation_consistency_check
CHECK (
  (reconciled_at IS NULL AND actual_cost_cents IS NULL) OR
  (reconciled_at IS NOT NULL AND actual_cost_cents IS NOT NULL)
);

-- ============================================================================
-- 3. ADD INDEXES FOR RECONCILIATION QUERIES
-- ============================================================================

-- Most important: lookup by OpenAI request ID
CREATE INDEX idx_token_usage_openai_request_id 
ON token_usage(openai_request_id)
WHERE openai_request_id IS NOT NULL;

-- Find pending reconciliations
CREATE INDEX idx_token_usage_reconciliation_status 
ON token_usage(reconciliation_status)
WHERE reconciliation_status = 'pending';

-- Date-based reconciliation queries (index on timestamp for range queries)
-- Use: WHERE created_at >= '2025-11-16' AND created_at < '2025-11-17'
CREATE INDEX idx_token_usage_created_at_reconciliation
ON token_usage(created_at)
WHERE openai_request_id IS NOT NULL;

-- Find discrepancies quickly
CREATE INDEX idx_token_usage_discrepancies
ON token_usage(reconciliation_status, created_at)
WHERE reconciliation_status = 'discrepancy';

-- ============================================================================
-- 4. UPDATE token_usage_with_costs VIEW
-- ============================================================================

-- Drop the existing view
DROP VIEW IF EXISTS token_usage_with_costs;

-- Recreate with reconciliation fields
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
  
  -- Cost calculations (original)
  (cost_estimate / 100.0) AS old_estimate_usd,
  (calculated_cost_cents::numeric / 100.0) AS accurate_cost_usd,
  ((calculated_cost_cents::numeric - cost_estimate) / 100.0) AS cost_difference_usd,
  
  -- Cost accuracy
  CASE
    WHEN (calculated_cost_cents IS NOT NULL AND cost_estimate > 0) 
    THEN ROUND(((calculated_cost_cents::numeric / cost_estimate) * 100), 2)
    ELSE NULL
  END AS accuracy_percentage,
  
  -- NEW: Reconciliation fields
  openai_request_id,
  openai_created,
  system_fingerprint,
  (actual_cost_cents::numeric / 100.0) AS actual_cost_usd,
  reconciled_at,
  reconciliation_status,
  
  -- NEW: Reconciliation cost comparison
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
  'Shows token usage with cost analysis including OpenAI reconciliation data. Only includes successful operations.';

-- ============================================================================
-- 5. MARK NON-OPENAI ACTIONS AS NOT APPLICABLE
-- ============================================================================

-- Actions that don't use OpenAI API (e.g., admin grants, token purchases)
UPDATE token_usage
SET reconciliation_status = 'not_applicable'
WHERE action_type IN (
  'admin_grant',
  'admin_deduct',
  'subscription_grant',
  'trial_grant',
  'token_pack_purchase'
)
AND reconciliation_status = 'pending';

COMMIT;

-- ============================================================================
-- RECONCILIATION USAGE EXAMPLES
-- ============================================================================
--
-- 1. Find pending reconciliations for a specific date:
--    SELECT * FROM token_usage
--    WHERE created_at >= '2025-11-16' AND created_at < '2025-11-17'
--    AND reconciliation_status = 'pending'
--    AND openai_request_id IS NOT NULL;
--
-- 2. Reconcile a specific request:
--    UPDATE token_usage
--    SET actual_cost_cents = 150,
--        reconciled_at = NOW(),
--        reconciliation_status = 'matched'
--    WHERE openai_request_id = 'chatcmpl-123';
--
-- 3. Find all discrepancies:
--    SELECT * FROM token_usage_with_costs
--    WHERE reconciliation_status = 'discrepancy'
--    ORDER BY reconciliation_difference_usd DESC;
--
-- 4. Get reconciliation accuracy by model:
--    SELECT 
--      model_used,
--      COUNT(*) as reconciled_count,
--      AVG(reconciliation_accuracy_percentage) as avg_accuracy,
--      SUM(reconciliation_difference_usd) as total_difference_usd
--    FROM token_usage_with_costs
--    WHERE reconciled_at IS NOT NULL
--    GROUP BY model_used
--    ORDER BY total_difference_usd DESC;
--
-- ============================================================================

