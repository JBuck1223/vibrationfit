-- ============================================================================
-- Remove Default 100 Tokens
-- ============================================================================
-- Change default from 100 to 0 (or NULL) so users start with no tokens
-- unless explicitly granted

-- Step 1: Change the default value to 0
ALTER TABLE user_profiles 
  ALTER COLUMN vibe_assistant_tokens_remaining SET DEFAULT 0;

-- Step 2: Update existing profiles that have exactly 100 tokens (the old default)
-- to 0, unless they have transaction records showing they were granted tokens
-- This only affects users who got the default 100 and never had any grants
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

-- Step 3: Remove the trigger that tracks default tokens (no longer needed)
DROP TRIGGER IF EXISTS track_default_tokens_on_profile_create ON user_profiles;
DROP FUNCTION IF EXISTS record_default_token_grant();

-- Step 4: Verify the change
SELECT 
  column_name,
  column_default,
  data_type
FROM information_schema.columns
WHERE table_name = 'user_profiles'
  AND column_name = 'vibe_assistant_tokens_remaining';

