-- ============================================================================
-- Update Existing token_transactions Table
-- ============================================================================
-- Enhance existing token_transactions table with payment fields
-- Don't recreate - just add missing columns if they don't exist

-- Add payment-related columns if they don't exist
DO $$ 
BEGIN
  -- Add amount_paid_cents if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'token_transactions' 
                 AND column_name = 'amount_paid_cents') THEN
    ALTER TABLE token_transactions ADD COLUMN amount_paid_cents INTEGER;
  END IF;
  
  -- Add currency if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'token_transactions' 
                 AND column_name = 'currency') THEN
    ALTER TABLE token_transactions ADD COLUMN currency TEXT DEFAULT 'USD';
  END IF;
  
  -- Add stripe_payment_intent_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'token_transactions' 
                 AND column_name = 'stripe_payment_intent_id') THEN
    ALTER TABLE token_transactions ADD COLUMN stripe_payment_intent_id TEXT;
  END IF;
  
  -- Add stripe_session_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'token_transactions' 
                 AND column_name = 'stripe_session_id') THEN
    ALTER TABLE token_transactions ADD COLUMN stripe_session_id TEXT;
  END IF;
  
  -- Add subscription_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'token_transactions' 
                 AND column_name = 'subscription_id') THEN
    ALTER TABLE token_transactions ADD COLUMN subscription_id UUID REFERENCES customer_subscriptions(id);
  END IF;
  
  -- Add token_pack_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'token_transactions' 
                 AND column_name = 'token_pack_id') THEN
    ALTER TABLE token_transactions ADD COLUMN token_pack_id TEXT;
  END IF;
  
  -- Add metadata if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'token_transactions' 
                 AND column_name = 'metadata') THEN
    ALTER TABLE token_transactions ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;
  
  -- Add notes if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'token_transactions' 
                 AND column_name = 'notes') THEN
    ALTER TABLE token_transactions ADD COLUMN notes TEXT;
  END IF;
  
  -- Add created_by if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'token_transactions' 
                 AND column_name = 'created_by') THEN
    ALTER TABLE token_transactions ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_token_transactions_stripe_payment ON token_transactions(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_token_transactions_subscription ON token_transactions(subscription_id) WHERE subscription_id IS NOT NULL;

-- Add constraint for transaction_type if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'token_transactions_transaction_type_check'
  ) THEN
    ALTER TABLE token_transactions 
    ADD CONSTRAINT token_transactions_transaction_type_check 
    CHECK (transaction_type IN ('grant', 'purchase', 'deduction', 'refund', 'transfer'));
  END IF;
END $$;

-- Add constraint for source if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'token_transactions_source_check'
  ) THEN
    ALTER TABLE token_transactions 
    ADD CONSTRAINT token_transactions_source_check 
    CHECK (source IN ('admin', 'subscription', 'trial', 'token_pack', 'stripe', 'refund', 'transfer'));
  END IF;
END $$;

COMMENT ON TABLE token_transactions IS 'Financial transactions: grants, purchases, deductions. Separate from token_usage (AI operations) and token_drips (subscription drips).';

