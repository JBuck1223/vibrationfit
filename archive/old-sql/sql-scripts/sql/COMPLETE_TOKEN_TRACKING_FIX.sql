-- ============================================================================
-- Complete Token Tracking Fix
-- ============================================================================
-- This migration ensures ALL tokens are tracked in token_transactions or token_usage
-- No untracked tokens allowed!
--
-- SAFETY NOTES:
-- 1. This script includes SAFETY CHECKS that show what will be affected BEFORE making changes
-- 2. The UPDATE only affects users with exactly 100 tokens AND no grant records (safe)
-- 3. The INSERT statements use ON CONFLICT DO NOTHING (safe, won't duplicate)
-- 4. Review the NOTICE messages before proceeding if you're concerned
--
-- DESTRUCTIVE OPERATIONS:
-- - UPDATE: Sets tokens_remaining to 0 for users with 100 tokens and no grant records
-- - DROP TRIGGER/FUNCTION: Removes old default token tracking (safe, uses IF EXISTS)
--
-- NON-DESTRUCTIVE OPERATIONS:
-- - ALTER TABLE: Only changes DEFAULT value (doesn't affect existing data)
-- - INSERT: Only adds records (uses ON CONFLICT DO NOTHING)
-- - CREATE VIEW: Only creates a view (doesn't modify data)

-- ============================================================================
-- STEP 1: Add Missing Action Types to Enum
-- ============================================================================
DO $$ 
BEGIN
  -- Add admin_grant if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'admin_grant' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'token_action_type')) THEN
    ALTER TYPE token_action_type ADD VALUE 'admin_grant';
  END IF;

  -- Add admin_deduct if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'admin_deduct' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'token_action_type')) THEN
    ALTER TYPE token_action_type ADD VALUE 'admin_deduct';
  END IF;

  -- Add trial_grant if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'trial_grant' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'token_action_type')) THEN
    ALTER TYPE token_action_type ADD VALUE 'trial_grant';
  END IF;

  -- Add token_pack_purchase if it doesn't exist (may be called pack_purchase)
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'token_pack_purchase' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'token_action_type')) THEN
    ALTER TYPE token_action_type ADD VALUE 'token_pack_purchase';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Remove Default 100 Tokens
-- ============================================================================
-- Change default from 100 to 0 so users start with no tokens unless explicitly granted
ALTER TABLE user_profiles 
  ALTER COLUMN vibe_assistant_tokens_remaining SET DEFAULT 0;

-- SAFETY CHECK: Show what will be affected BEFORE updating
-- Run this first to see which users will be affected:
DO $$
DECLARE
  affected_count INTEGER;
  rec RECORD;
BEGIN
  SELECT COUNT(*) INTO affected_count
  FROM user_profiles up
  WHERE up.vibe_assistant_tokens_remaining = 100
    AND NOT EXISTS (
      SELECT 1 
      FROM token_transactions tt 
      WHERE tt.user_id = up.user_id
        AND tt.action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
        AND tt.tokens_used > 0
    )
    AND NOT EXISTS (
      SELECT 1 
      FROM token_usage tu 
      WHERE tu.user_id = up.user_id 
        AND tu.action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
        AND tu.tokens_used > 0
    );
  
  RAISE NOTICE 'Users with 100 tokens and no grant records: %', affected_count;
  
  -- Show the affected users
  IF affected_count > 0 THEN
    RAISE NOTICE 'Affected user_ids:';
    FOR rec IN 
      SELECT up.user_id, up.created_at
      FROM user_profiles up
      WHERE up.vibe_assistant_tokens_remaining = 100
        AND NOT EXISTS (
          SELECT 1 
          FROM token_transactions tt 
          WHERE tt.user_id = up.user_id
            AND tt.action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
            AND tt.tokens_used > 0
        )
        AND NOT EXISTS (
          SELECT 1 
          FROM token_usage tu 
          WHERE tu.user_id = up.user_id 
            AND tu.action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
            AND tu.tokens_used > 0
        )
    LOOP
      RAISE NOTICE '  User: %, Created: %', rec.user_id, rec.created_at;
    END LOOP;
  END IF;
END $$;

-- Update existing profiles that have exactly 100 tokens (the old default)
-- to 0, ONLY if they have NO transaction records showing grants
-- This is SAFE because:
-- 1. Only affects users with exactly 100 tokens (the old default)
-- 2. Only if they have NO grant records in token_transactions
-- 3. Only if they have NO grant records in token_usage
-- 4. These are users who got the default 100 and never had any grants
UPDATE user_profiles up
SET vibe_assistant_tokens_remaining = 0
WHERE up.vibe_assistant_tokens_remaining = 100
  AND NOT EXISTS (
    -- Don't update if they have any transaction records showing grants
    SELECT 1 
    FROM token_transactions tt 
    WHERE tt.user_id = up.user_id
      AND tt.action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
      AND tt.tokens_used > 0
  )
  AND NOT EXISTS (
    -- Don't update if they have any usage records showing grants
    SELECT 1 
    FROM token_usage tu 
    WHERE tu.user_id = up.user_id 
      AND tu.action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
      AND tu.tokens_used > 0
  );

-- ============================================================================
-- STEP 3: Remove Trigger for Default Tokens (No Longer Needed)
-- ============================================================================
DROP TRIGGER IF EXISTS track_default_tokens_on_profile_create ON user_profiles;
DROP FUNCTION IF EXISTS record_default_token_grant();

-- ============================================================================
-- STEP 4: Create Audit View for Untracked Token Changes
-- ============================================================================
CREATE OR REPLACE VIEW untracked_token_changes AS
SELECT DISTINCT
  up.user_id,
  up.vibe_assistant_tokens_remaining AS current_balance,
  -- Calculate expected balance:
  -- Grants: Prefer token_transactions (source of truth), only use token_usage if NO transactions exist
  COALESCE((
    SELECT SUM(tokens_used)
    FROM token_transactions
    WHERE user_id = up.user_id
      AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
      AND tokens_used > 0
  ), (
    -- Fallback: Only use token_usage grants if NO token_transactions exist (avoid double-counting)
    CASE 
      WHEN EXISTS (SELECT 1 FROM token_transactions WHERE user_id = up.user_id) THEN 0
      ELSE (
        SELECT COALESCE(SUM(tokens_used), 0)
        FROM token_usage
        WHERE user_id = up.user_id
          AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
          AND tokens_used > 0
      )
    END
  ), 0) -
  -- Deductions from token_transactions
  COALESCE((
    SELECT SUM(ABS(tokens_used))
    FROM token_transactions
    WHERE user_id = up.user_id
      AND (action_type = 'admin_deduct' OR tokens_used < 0)
  ), 0) -
  -- AI Usage from token_usage (subtracts tokens)
  COALESCE((
    SELECT SUM(tokens_used)
    FROM token_usage
    WHERE user_id = up.user_id
      AND action_type NOT IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase', 'admin_deduct')
      AND tokens_used > 0
      AND success = true
  ), 0) AS expected_balance,
  -- Calculate discrepancy (same logic)
  up.vibe_assistant_tokens_remaining - (
    COALESCE((
      SELECT SUM(tokens_used)
      FROM token_transactions
      WHERE user_id = up.user_id
        AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
        AND tokens_used > 0
    ), (
      CASE 
        WHEN EXISTS (SELECT 1 FROM token_transactions WHERE user_id = up.user_id) THEN 0
        ELSE (
          SELECT COALESCE(SUM(tokens_used), 0)
          FROM token_usage
          WHERE user_id = up.user_id
            AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
            AND tokens_used > 0
        )
      END
    ), 0) -
    COALESCE((
      SELECT SUM(ABS(tokens_used))
      FROM token_transactions
      WHERE user_id = up.user_id
        AND (action_type = 'admin_deduct' OR tokens_used < 0)
    ), 0) -
    COALESCE((
      SELECT SUM(tokens_used)
      FROM token_usage
      WHERE user_id = up.user_id
        AND action_type NOT IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase', 'admin_deduct')
        AND tokens_used > 0
        AND success = true
    ), 0)
  ) AS discrepancy
FROM user_profiles up
WHERE ABS(up.vibe_assistant_tokens_remaining - (
    COALESCE((
      SELECT SUM(tokens_used)
      FROM token_transactions
      WHERE user_id = up.user_id
        AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
        AND tokens_used > 0
    ), (
      CASE 
        WHEN EXISTS (SELECT 1 FROM token_transactions WHERE user_id = up.user_id) THEN 0
        ELSE (
          SELECT COALESCE(SUM(tokens_used), 0)
          FROM token_usage
          WHERE user_id = up.user_id
            AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
            AND tokens_used > 0
        )
      END
    ), 0) -
    COALESCE((
      SELECT SUM(ABS(tokens_used))
      FROM token_transactions
      WHERE user_id = up.user_id
        AND (action_type = 'admin_deduct' OR tokens_used < 0)
    ), 0) -
    COALESCE((
      SELECT SUM(tokens_used)
      FROM token_usage
      WHERE user_id = up.user_id
        AND action_type NOT IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase', 'admin_deduct')
        AND tokens_used > 0
        AND success = true
    ), 0)
  )) > 0;  -- Only show users with discrepancies

COMMENT ON VIEW untracked_token_changes IS 'Shows users whose token balance doesn''t match their transaction history. Indicates untracked token changes.';

-- ============================================================================
-- STEP 5: Backfill Historical Records for Untracked Tokens
-- ============================================================================
-- This creates historical transaction records for users who have tokens
-- but no transaction records showing where they came from

-- SAFETY CHECK: Show what will be backfilled BEFORE inserting
DO $$
DECLARE
  backfill_count INTEGER;
  rec RECORD;
BEGIN
  SELECT COUNT(*) INTO backfill_count
  FROM user_profiles up
  WHERE up.vibe_assistant_tokens_remaining > 0
    AND NOT EXISTS (
      SELECT 1 
      FROM token_transactions tt 
      WHERE tt.user_id = up.user_id
    )
    AND NOT EXISTS (
      SELECT 1 
      FROM token_usage tu 
      WHERE tu.user_id = up.user_id 
        AND tu.action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
        AND tu.tokens_used > 0
    );
  
  RAISE NOTICE 'Users needing backfill: %', backfill_count;
  
  IF backfill_count > 0 THEN
    RAISE NOTICE 'Users to backfill (user_id, tokens, created_at):';
    FOR rec IN 
      SELECT up.user_id, up.vibe_assistant_tokens_remaining, up.created_at
      FROM user_profiles up
      WHERE up.vibe_assistant_tokens_remaining > 0
        AND NOT EXISTS (
          SELECT 1 
          FROM token_transactions tt 
          WHERE tt.user_id = up.user_id
        )
        AND NOT EXISTS (
          SELECT 1 
          FROM token_usage tu 
          WHERE tu.user_id = up.user_id 
            AND tu.action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
            AND tu.tokens_used > 0
        )
      ORDER BY up.vibe_assistant_tokens_remaining DESC
    LOOP
      RAISE NOTICE '  User: %, Tokens: %, Created: %', rec.user_id, rec.vibe_assistant_tokens_remaining, rec.created_at;
    END LOOP;
  END IF;
END $$;

-- Find users with untracked tokens and create historical records
-- This handles TWO cases:
-- 1. Users with NO transaction records at all
-- 2. Users with SOME transaction records but missing grants (discrepancy exists)
INSERT INTO token_transactions (
  user_id,
  action_type,
  tokens_used,
  tokens_remaining,
  metadata,
  created_at
)
SELECT 
  up.user_id,
  'admin_grant' AS action_type,
  -- Calculate the untracked amount: current balance - tracked grants + tracked usage
  -- IMPORTANT: Only count grants from token_transactions (avoid double-counting)
  GREATEST(0, up.vibe_assistant_tokens_remaining - (
    COALESCE((
      SELECT SUM(tokens_used)
      FROM token_transactions
      WHERE user_id = up.user_id
        AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
        AND tokens_used > 0
    ), (
      -- Only use token_usage grants if NO token_transactions exist
      CASE 
        WHEN EXISTS (SELECT 1 FROM token_transactions WHERE user_id = up.user_id) THEN 0
        ELSE (
          SELECT COALESCE(SUM(tokens_used), 0)
          FROM token_usage
          WHERE user_id = up.user_id
            AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
            AND tokens_used > 0
        )
      END
    ), 0) -
    COALESCE((
      SELECT SUM(ABS(tokens_used))
      FROM token_transactions
      WHERE user_id = up.user_id
        AND (action_type = 'admin_deduct' OR tokens_used < 0)
    ), 0) -
    COALESCE((
      SELECT SUM(tokens_used)
      FROM token_usage
      WHERE user_id = up.user_id
        AND action_type NOT IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase', 'admin_deduct')
        AND tokens_used > 0
        AND success = true
    ), 0)
  )) AS tokens_used,
  up.vibe_assistant_tokens_remaining AS tokens_remaining,
  jsonb_build_object(
    'source', 'historical_backfill',
    'type', 'untracked_tokens',
    'reason', 'Historical record: Tokens existed in profile but were not tracked in transactions (backfilled)',
    'original_balance', up.vibe_assistant_tokens_remaining,
    'calculated_untracked', GREATEST(0, up.vibe_assistant_tokens_remaining - (
      COALESCE((
        SELECT SUM(tokens_used)
        FROM token_transactions
        WHERE user_id = up.user_id
          AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
          AND tokens_used > 0
      ), 0) +
      COALESCE((
        SELECT SUM(tokens_used)
        FROM token_usage
        WHERE user_id = up.user_id
          AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
          AND tokens_used > 0
      ), 0) -
      COALESCE((
        SELECT SUM(ABS(tokens_used))
        FROM token_transactions
        WHERE user_id = up.user_id
          AND (action_type = 'admin_deduct' OR tokens_used < 0)
      ), 0) -
      COALESCE((
        SELECT SUM(tokens_used)
        FROM token_usage
        WHERE user_id = up.user_id
          AND action_type NOT IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase', 'admin_deduct')
          AND tokens_used > 0
          AND success = true
      ), 0)
    ))
  ) AS metadata,
  up.created_at AS created_at -- Use profile creation date as approximate grant date
FROM user_profiles up
WHERE up.vibe_assistant_tokens_remaining > 0
  -- Only backfill if there's a discrepancy (untracked tokens exist)
  -- IMPORTANT: Only count grants from token_transactions to avoid double-counting
  AND up.vibe_assistant_tokens_remaining > (
    COALESCE((
      SELECT SUM(tokens_used)
      FROM token_transactions
      WHERE user_id = up.user_id
        AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
        AND tokens_used > 0
    ), (
      -- Only use token_usage grants if NO token_transactions exist
      CASE 
        WHEN EXISTS (SELECT 1 FROM token_transactions WHERE user_id = up.user_id) THEN 0
        ELSE (
          SELECT COALESCE(SUM(tokens_used), 0)
          FROM token_usage
          WHERE user_id = up.user_id
            AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
            AND tokens_used > 0
        )
      END
    ), 0) -
    COALESCE((
      SELECT SUM(ABS(tokens_used))
      FROM token_transactions
      WHERE user_id = up.user_id
        AND (action_type = 'admin_deduct' OR tokens_used < 0)
    ), 0) -
    COALESCE((
      SELECT SUM(tokens_used)
      FROM token_usage
      WHERE user_id = up.user_id
        AND action_type NOT IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase', 'admin_deduct')
        AND tokens_used > 0
        AND success = true
    ), 0)
  )
  -- Don't create duplicate backfill records
  -- Check if backfill already exists for this user
  AND NOT EXISTS (
    SELECT 1 
    FROM token_transactions tt 
    WHERE tt.user_id = up.user_id
      AND tt.metadata->>'source' = 'historical_backfill'
  )
  -- Also check that the calculated untracked amount is > 0
  AND GREATEST(0, up.vibe_assistant_tokens_remaining - (
    COALESCE((
      SELECT SUM(tokens_used)
      FROM token_transactions
      WHERE user_id = up.user_id
        AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
        AND tokens_used > 0
    ), (
      CASE 
        WHEN EXISTS (SELECT 1 FROM token_transactions WHERE user_id = up.user_id) THEN 0
        ELSE (
          SELECT COALESCE(SUM(tokens_used), 0)
          FROM token_usage
          WHERE user_id = up.user_id
            AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
            AND tokens_used > 0
        )
      END
    ), 0) -
    COALESCE((
      SELECT SUM(ABS(tokens_used))
      FROM token_transactions
      WHERE user_id = up.user_id
        AND (action_type = 'admin_deduct' OR tokens_used < 0)
    ), 0) -
    COALESCE((
      SELECT SUM(tokens_used)
      FROM token_usage
      WHERE user_id = up.user_id
        AND action_type NOT IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase', 'admin_deduct')
        AND tokens_used > 0
        AND success = true
    ), 0)
  )) > 0
ON CONFLICT DO NOTHING;

-- Also backfill in token_usage for unified tracking (same logic)
INSERT INTO token_usage (
  user_id,
  action_type,
  model_used,
  tokens_used,
  cost_estimate,
  success,
  metadata,
  created_at
)
SELECT 
  up.user_id,
  'admin_grant' AS action_type,
  'system' AS model_used,
  -- Calculate the untracked amount (same as token_transactions)
  GREATEST(0, up.vibe_assistant_tokens_remaining - (
    COALESCE((
      SELECT SUM(tokens_used)
      FROM token_transactions
      WHERE user_id = up.user_id
        AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
        AND tokens_used > 0
    ), 0) +
    COALESCE((
      SELECT SUM(tokens_used)
      FROM token_usage
      WHERE user_id = up.user_id
        AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
        AND tokens_used > 0
    ), 0) -
    COALESCE((
      SELECT SUM(ABS(tokens_used))
      FROM token_transactions
      WHERE user_id = up.user_id
        AND (action_type = 'admin_deduct' OR tokens_used < 0)
    ), 0) -
    COALESCE((
      SELECT SUM(tokens_used)
      FROM token_usage
      WHERE user_id = up.user_id
        AND action_type NOT IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase', 'admin_deduct')
        AND tokens_used > 0
        AND success = true
    ), 0)
  )) AS tokens_used,
  0 AS cost_estimate,
  true AS success,
  jsonb_build_object(
    'source', 'historical_backfill',
    'type', 'untracked_tokens',
    'reason', 'Historical record: Tokens existed in profile but were not tracked in usage (backfilled)',
    'original_balance', up.vibe_assistant_tokens_remaining
  ) AS metadata,
  up.created_at AS created_at
FROM user_profiles up
WHERE up.vibe_assistant_tokens_remaining > 0
  -- Only backfill if there's a discrepancy (untracked tokens exist)
  -- IMPORTANT: Only count grants from token_transactions to avoid double-counting
  AND up.vibe_assistant_tokens_remaining > (
    COALESCE((
      SELECT SUM(tokens_used)
      FROM token_transactions
      WHERE user_id = up.user_id
        AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
        AND tokens_used > 0
    ), (
      -- Only use token_usage grants if NO token_transactions exist
      CASE 
        WHEN EXISTS (SELECT 1 FROM token_transactions WHERE user_id = up.user_id) THEN 0
        ELSE (
          SELECT COALESCE(SUM(tokens_used), 0)
          FROM token_usage
          WHERE user_id = up.user_id
            AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
            AND tokens_used > 0
        )
      END
    ), 0) -
    COALESCE((
      SELECT SUM(ABS(tokens_used))
      FROM token_transactions
      WHERE user_id = up.user_id
        AND (action_type = 'admin_deduct' OR tokens_used < 0)
    ), 0) -
    COALESCE((
      SELECT SUM(tokens_used)
      FROM token_usage
      WHERE user_id = up.user_id
        AND action_type NOT IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase', 'admin_deduct')
        AND tokens_used > 0
        AND success = true
    ), 0)
  )
  -- Don't create duplicate backfill records
  -- Check if backfill already exists for this user
  AND NOT EXISTS (
    SELECT 1 
    FROM token_usage tu 
    WHERE tu.user_id = up.user_id 
      AND tu.action_type = 'admin_grant'
      AND tu.metadata->>'source' = 'historical_backfill'
  )
  -- Also check that the calculated untracked amount is > 0
  AND GREATEST(0, up.vibe_assistant_tokens_remaining - (
    COALESCE((
      SELECT SUM(tokens_used)
      FROM token_transactions
      WHERE user_id = up.user_id
        AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
        AND tokens_used > 0
    ), (
      CASE 
        WHEN EXISTS (SELECT 1 FROM token_transactions WHERE user_id = up.user_id) THEN 0
        ELSE (
          SELECT COALESCE(SUM(tokens_used), 0)
          FROM token_usage
          WHERE user_id = up.user_id
            AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
            AND tokens_used > 0
        )
      END
    ), 0) -
    COALESCE((
      SELECT SUM(ABS(tokens_used))
      FROM token_transactions
      WHERE user_id = up.user_id
        AND (action_type = 'admin_deduct' OR tokens_used < 0)
    ), 0) -
    COALESCE((
      SELECT SUM(tokens_used)
      FROM token_usage
      WHERE user_id = up.user_id
        AND action_type NOT IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase', 'admin_deduct')
        AND tokens_used > 0
        AND success = true
    ), 0)
  )) > 0
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 6: Verify Changes
-- ============================================================================

-- Verify default changed to 0
SELECT 
  column_name,
  column_default,
  data_type
FROM information_schema.columns
WHERE table_name = 'user_profiles'
  AND column_name = 'vibe_assistant_tokens_remaining';

-- Verify enum values
SELECT 
  t.typname AS enum_name,
  e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'token_action_type'
ORDER BY e.enumsortorder;

-- Show users with discrepancies (should be empty after backfill)
SELECT 
  user_id,
  current_balance,
  expected_balance,
  discrepancy
FROM untracked_token_changes
WHERE ABS(discrepancy) > 0
ORDER BY ABS(discrepancy) DESC
LIMIT 20;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- ✅ Added missing action types: admin_grant, admin_deduct, trial_grant, token_pack_purchase
-- ✅ Removed default 100 tokens (now defaults to 0)
-- ✅ Removed trigger for default tokens
-- ✅ Created audit view to find untracked token changes
-- ✅ Backfilled historical records for users with untracked tokens
-- ✅ All tokens should now be tracked in token_transactions or token_usage

