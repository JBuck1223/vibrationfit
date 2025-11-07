-- ============================================================================
-- Track Default 100 Tokens on Profile Creation
-- ============================================================================
-- This trigger automatically creates a transaction record when a profile is created
-- with the default 100 tokens, ensuring ALL tokens are tracked

-- Step 1: Create function to record default token grant
CREATE OR REPLACE FUNCTION record_default_token_grant()
RETURNS TRIGGER AS $$
BEGIN
  -- Only record if tokens_remaining is 100 (the default)
  -- This ensures we don't double-record if someone explicitly sets a different value
  IF NEW.vibe_assistant_tokens_remaining = 100 AND 
     (OLD IS NULL OR OLD.vibe_assistant_tokens_remaining IS NULL) THEN
    
    -- Record the default 100 token grant in token_transactions
    INSERT INTO token_transactions (
      user_id,
      action_type,
      tokens_used,
      tokens_remaining,
      metadata,
      created_at
    ) VALUES (
      NEW.user_id,
      'trial_grant',  -- Default tokens are like a trial grant
      100,
      100,
      jsonb_build_object(
        'source', 'profile_creation',
        'type', 'default_trial_tokens',
        'reason', 'Default tokens granted on profile creation'
      ),
      NEW.created_at
    );
    
    -- Also record in token_usage for unified tracking
    INSERT INTO token_usage (
      user_id,
      action_type,
      model_used,
      tokens_used,
      cost_estimate,
      success,
      metadata,
      created_at
    ) VALUES (
      NEW.user_id,
      'trial_grant',
      'system',
      100,
      0,
      true,
      jsonb_build_object(
        'source', 'profile_creation',
        'type', 'default_trial_tokens',
        'reason', 'Default tokens granted on profile creation'
      ),
      NEW.created_at
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create trigger to fire after profile creation
DROP TRIGGER IF EXISTS track_default_tokens_on_profile_create ON user_profiles;
CREATE TRIGGER track_default_tokens_on_profile_create
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION record_default_token_grant();

COMMENT ON FUNCTION record_default_token_grant IS 'Automatically records default 100 token grant when a profile is created';
COMMENT ON TRIGGER track_default_tokens_on_profile_create ON user_profiles IS 'Tracks default 100 tokens granted on profile creation';

-- Step 3: Backfill existing profiles that have 100 tokens but no transaction record
-- This creates historical records for existing users
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
  'trial_grant',
  100,
  100,
  jsonb_build_object(
    'source', 'profile_creation_backfill',
    'type', 'default_trial_tokens',
    'reason', 'Historical record: Default tokens granted on profile creation (backfilled)'
  ),
  up.created_at
FROM user_profiles up
WHERE up.vibe_assistant_tokens_remaining = 100
  AND NOT EXISTS (
    SELECT 1 
    FROM token_transactions tt 
    WHERE tt.user_id = up.user_id 
      AND tt.action_type = 'trial_grant'
      AND tt.tokens_used = 100
      AND tt.metadata->>'source' = 'profile_creation'
  )
  AND NOT EXISTS (
    SELECT 1 
    FROM token_transactions tt 
    WHERE tt.user_id = up.user_id 
      AND tt.action_type = 'trial_grant'
      AND tt.tokens_used = 100
      AND tt.metadata->>'source' = 'profile_creation_backfill'
  )
ON CONFLICT DO NOTHING;

-- Also backfill token_usage
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
  'trial_grant',
  'system',
  100,
  0,
  true,
  jsonb_build_object(
    'source', 'profile_creation_backfill',
    'type', 'default_trial_tokens',
    'reason', 'Historical record: Default tokens granted on profile creation (backfilled)'
  ),
  up.created_at
FROM user_profiles up
WHERE up.vibe_assistant_tokens_remaining = 100
  AND NOT EXISTS (
    SELECT 1 
    FROM token_usage tu 
    WHERE tu.user_id = up.user_id 
      AND tu.action_type = 'trial_grant'
      AND tu.tokens_used = 100
      AND tu.metadata->>'source' = 'profile_creation'
  )
  AND NOT EXISTS (
    SELECT 1 
    FROM token_usage tu 
    WHERE tu.user_id = up.user_id 
      AND tu.action_type = 'trial_grant'
      AND tu.tokens_used = 100
      AND tu.metadata->>'source' = 'profile_creation_backfill'
  )
ON CONFLICT DO NOTHING;

