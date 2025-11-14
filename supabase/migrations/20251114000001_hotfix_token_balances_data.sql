-- ============================================================================
-- Hotfix: Migrate Token Balances Data (Corrected Sign)
-- ============================================================================
-- Purpose: The previous migration had the sign backwards (tokens_used < 0)
--          when grants are actually positive. This fixes the data migration.
--
-- Date: November 14, 2025
-- ============================================================================

-- Clear any incorrect data that may have been inserted
-- Note: user_storage should have migrated correctly, only token_balances had the sign bug
TRUNCATE token_balances CASCADE;

-- Migrate token grants from token_transactions to token_balances
-- CORRECTED: grants have tokens_used > 0 (positive), not negative!
INSERT INTO token_balances (
  user_id,
  grant_type,
  tokens_granted,
  tokens_remaining,
  granted_at,
  expires_at,
  subscription_id,
  metadata
)
SELECT 
  tt.user_id,
  CASE 
    -- Check metadata to distinguish between annual and 28-day
    WHEN tt.action_type = 'subscription_grant' AND (tt.metadata->>'plan' = 'vision_pro_annual' OR tt.tokens_used >= 5000000) THEN 'annual'
    WHEN tt.action_type = 'subscription_grant' THEN '28day'
    WHEN tt.action_type = 'renewal_grant' AND tt.tokens_used >= 5000000 THEN 'annual'
    WHEN tt.action_type = 'renewal_grant' THEN '28day'
    WHEN tt.action_type = 'trial_grant' THEN 'trial'
    WHEN tt.action_type = 'token_pack_purchase' THEN 'purchase'
    WHEN tt.action_type = 'pack_purchase' THEN 'purchase'
    WHEN tt.action_type = 'admin_grant' THEN 'admin'
    ELSE 'admin'
  END as grant_type,
  tt.tokens_used as tokens_granted, -- Positive value
  -- Calculate remaining: need to subtract all usage since this grant
  tt.tokens_used - COALESCE(
    (SELECT COALESCE(SUM(tu.tokens_used), 0)
     FROM token_usage tu
     WHERE tu.user_id = tt.user_id
       AND tu.created_at >= tt.created_at
       AND tu.success = true
       AND tu.action_type NOT IN ('admin_grant', 'subscription_grant', 'renewal_grant', 'trial_grant', 'token_pack_purchase', 'pack_purchase', 'admin_deduct')
    ), 0
  ) as tokens_remaining,
  tt.created_at as granted_at,
  CASE 
    -- Determine expiration based on grant type
    WHEN (tt.action_type = 'subscription_grant' AND (tt.metadata->>'plan' = 'vision_pro_annual' OR tt.tokens_used >= 5000000)) THEN tt.created_at + INTERVAL '365 days'
    WHEN (tt.action_type = 'renewal_grant' AND tt.tokens_used >= 5000000) THEN tt.created_at + INTERVAL '365 days'
    WHEN tt.action_type = 'subscription_grant' THEN tt.created_at + INTERVAL '90 days'
    WHEN tt.action_type = 'renewal_grant' THEN tt.created_at + INTERVAL '90 days'
    WHEN tt.action_type = 'trial_grant' THEN tt.created_at + INTERVAL '56 days'
    WHEN tt.action_type = 'token_pack_purchase' THEN NULL
    WHEN tt.action_type = 'pack_purchase' THEN NULL
    WHEN tt.action_type = 'admin_grant' THEN tt.created_at + INTERVAL '365 days'
    ELSE tt.created_at + INTERVAL '365 days'
  END as expires_at,
  tt.subscription_id,
  tt.metadata
FROM token_transactions tt
WHERE tt.action_type IN (
  'subscription_grant',
  'renewal_grant',
  'trial_grant',
  'token_pack_purchase',
  'pack_purchase',
  'admin_grant'
)
AND tt.tokens_used > 0 -- CORRECTED: Positive means grant (not negative!)
ORDER BY tt.created_at ASC;

-- Verify migration results
DO $$
DECLARE
  grant_count INTEGER;
  balance_count INTEGER;
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO grant_count FROM token_transactions 
  WHERE action_type IN ('subscription_grant', 'renewal_grant', 'trial_grant', 'token_pack_purchase', 'pack_purchase', 'admin_grant')
    AND tokens_used > 0;
  
  SELECT COUNT(*) INTO balance_count FROM token_balances;
  
  SELECT COUNT(DISTINCT user_id) INTO user_count FROM token_balances;
  
  RAISE NOTICE 'Migration Complete:';
  RAISE NOTICE '  - Found % grant transactions', grant_count;
  RAISE NOTICE '  - Created % token_balance records', balance_count;
  RAISE NOTICE '  - Covering % unique users', user_count;
END $$;

