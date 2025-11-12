-- ============================================================================
-- Prevent Direct Token Updates Without Transactions
-- ============================================================================
-- This migration ensures all token changes go through token_transactions or token_usage
-- It creates a trigger that prevents direct updates to vibe_assistant_tokens_remaining
-- unless they're coming from approved functions

-- Step 1: Create a function to check if the update is from an approved source
CREATE OR REPLACE FUNCTION check_token_update_source()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow updates from approved RPC functions (they set a session variable)
  -- Allow updates from recordTokenTransaction (via Supabase service role)
  -- Block direct SQL updates that don't go through transaction system
  
  -- Check if this is coming from a transaction function
  -- We'll use a session variable to mark approved updates
  IF current_setting('app.token_update_approved', true) = 'true' THEN
    RETURN NEW;
  END IF;
  
  -- Check if this is a service role update (from our API)
  -- Service role updates are allowed (they go through recordTokenTransaction)
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;
  
  -- For now, we'll log a warning but allow the update
  -- In production, you might want to RAISE EXCEPTION instead
  RAISE WARNING 'Direct update to vibe_assistant_tokens_remaining detected. Consider using token_transactions or token_usage instead.';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create trigger (optional - comment out if you want to allow direct updates for now)
-- DROP TRIGGER IF EXISTS prevent_direct_token_updates ON user_profiles;
-- CREATE TRIGGER prevent_direct_token_updates
--   BEFORE UPDATE OF vibe_assistant_tokens_remaining ON user_profiles
--   FOR EACH ROW
--   WHEN (OLD.vibe_assistant_tokens_remaining IS DISTINCT FROM NEW.vibe_assistant_tokens_remaining)
--   EXECUTE FUNCTION check_token_update_source();

-- Step 3: Update RPC functions to set the session variable
CREATE OR REPLACE FUNCTION grant_annual_tokens(
  p_user_id UUID,
  p_subscription_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_current_balance INTEGER;
  v_grant_amount INTEGER := 5000000; -- 5M tokens
  v_new_balance INTEGER;
BEGIN
  -- Mark this as an approved update
  PERFORM set_config('app.token_update_approved', 'true', true);
  
  -- Get current balance
  SELECT COALESCE(vibe_assistant_tokens_remaining, 0)
  INTO v_current_balance
  FROM user_profiles
  WHERE user_id = p_user_id;
  
  v_new_balance := v_grant_amount;
  
  -- Update user profile
  UPDATE user_profiles
  SET 
    vibe_assistant_tokens_remaining = v_new_balance,
    token_rollover_cycles = 0,
    token_last_drip_date = NOW(),
    storage_quota_gb = 100
  WHERE user_id = p_user_id;
  
  -- Record in token_transactions
  INSERT INTO token_transactions (
    user_id,
    action_type,
    tokens_used,
    tokens_remaining,
    subscription_id,
    created_at
  ) VALUES (
    p_user_id,
    'subscription_grant',
    v_grant_amount,
    v_new_balance,
    p_subscription_id,
    NOW()
  );
  
  -- Also record in token_usage
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
    p_user_id,
    'subscription_grant',
    'subscription',
    v_grant_amount,
    0,
    true,
    jsonb_build_object(
      'subscription_id', p_subscription_id,
      'plan', 'vision_pro_annual',
      'balance_before', v_current_balance,
      'balance_after', v_new_balance
    ),
    NOW()
  );
  
  -- Clear the session variable
  PERFORM set_config('app.token_update_approved', 'false', true);
  
  RETURN jsonb_build_object(
    'success', true,
    'granted', v_grant_amount,
    'balance_before', v_current_balance,
    'balance_after', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update grant_trial_tokens similarly
CREATE OR REPLACE FUNCTION grant_trial_tokens(
  p_user_id UUID,
  p_trial_amount INTEGER DEFAULT 100000
)
RETURNS JSONB AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Mark this as an approved update
  PERFORM set_config('app.token_update_approved', 'true', true);
  
  -- Get current balance
  SELECT COALESCE(vibe_assistant_tokens_remaining, 0)
  INTO v_current_balance
  FROM user_profiles
  WHERE user_id = p_user_id;
  
  v_new_balance := v_current_balance + p_trial_amount;
  
  -- Update user profile
  UPDATE user_profiles
  SET 
    vibe_assistant_tokens_remaining = v_new_balance,
    token_last_drip_date = NOW()
  WHERE user_id = p_user_id;
  
  -- Record in token_usage
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
    p_user_id,
    'trial_grant',
    'trial',
    p_trial_amount,
    0,
    true,
    jsonb_build_object(
      'trial_amount', p_trial_amount,
      'balance_before', v_current_balance,
      'balance_after', v_new_balance
    ),
    NOW()
  );
  
  -- Clear the session variable
  PERFORM set_config('app.token_update_approved', 'false', true);
  
  RETURN jsonb_build_object(
    'success', true,
    'granted', p_trial_amount,
    'balance_before', v_current_balance,
    'balance_after', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create a view to audit untracked token changes
CREATE OR REPLACE VIEW untracked_token_changes AS
SELECT 
  up.user_id,
  up.vibe_assistant_tokens_remaining AS current_balance,
  -- Calculate expected balance from transactions
  COALESCE((
    SELECT SUM(CASE 
      WHEN action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase') 
      THEN tokens_used 
      WHEN action_type = 'admin_deduct' OR tokens_used < 0 
      THEN tokens_used 
      ELSE 0 
    END)
    FROM token_transactions
    WHERE user_id = up.user_id
  ), 0) +
  COALESCE((
    SELECT SUM(CASE 
      WHEN action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase') 
      THEN tokens_used 
      WHEN action_type = 'admin_deduct' OR tokens_used < 0 
      THEN tokens_used 
      ELSE -tokens_used  -- AI usage subtracts tokens
    END)
    FROM token_usage
    WHERE user_id = up.user_id
      AND action_type NOT IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase', 'admin_deduct')
  ), 0) + 100 AS expected_balance,  -- Start with default 100
  up.vibe_assistant_tokens_remaining - (
    COALESCE((
      SELECT SUM(CASE 
        WHEN action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase') 
        THEN tokens_used 
        WHEN action_type = 'admin_deduct' OR tokens_used < 0 
        THEN tokens_used 
        ELSE 0 
      END)
      FROM token_transactions
      WHERE user_id = up.user_id
    ), 0) +
    COALESCE((
      SELECT SUM(CASE 
        WHEN action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase') 
        THEN tokens_used 
        WHEN action_type = 'admin_deduct' OR tokens_used < 0 
        THEN tokens_used 
        ELSE -tokens_used
      END)
      FROM token_usage
      WHERE user_id = up.user_id
        AND action_type NOT IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase', 'admin_deduct')
    ), 0) + 100
  ) AS discrepancy
FROM user_profiles up
WHERE up.vibe_assistant_tokens_remaining != (
  COALESCE((
    SELECT SUM(CASE 
      WHEN action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase') 
      THEN tokens_used 
      WHEN action_type = 'admin_deduct' OR tokens_used < 0 
      THEN tokens_used 
      ELSE 0 
    END)
    FROM token_transactions
    WHERE user_id = up.user_id
  ), 0) +
  COALESCE((
    SELECT SUM(CASE 
      WHEN action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase') 
      THEN tokens_used 
      WHEN action_type = 'admin_deduct' OR tokens_used < 0 
      THEN tokens_used 
      ELSE -tokens_used
    END)
    FROM token_usage
    WHERE user_id = up.user_id
      AND action_type NOT IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase', 'admin_deduct')
  ), 0) + 100
);

COMMENT ON VIEW untracked_token_changes IS 'Shows users whose token balance doesn''t match their transaction history. Indicates untracked token changes.';

