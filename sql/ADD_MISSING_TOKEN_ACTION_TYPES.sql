-- Add missing action types to token_action_type enum if they don't exist
-- These are needed for admin grants, deductions, and token pack purchases

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

-- Verify the enum values
SELECT 
  t.typname AS enum_name,
  e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'token_action_type'
ORDER BY e.enumsortorder;

