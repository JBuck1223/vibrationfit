-- Add started_at column to intensive_purchases
-- This allows timer to start when user clicks "Start" instead of on purchase

ALTER TABLE intensive_purchases 
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMP NULL;

-- Make activation_deadline nullable (it will be set when intensive starts)
ALTER TABLE intensive_purchases 
  ALTER COLUMN activation_deadline DROP NOT NULL;

-- Add comment explaining the fields
COMMENT ON COLUMN intensive_purchases.started_at IS 'When user clicked Start button (timer begins)';
COMMENT ON COLUMN intensive_purchases.activation_deadline IS '72 hours after started_at (NULL until started)';
COMMENT ON COLUMN intensive_purchases.created_at IS 'When purchase was made (may be hours/days before started_at)';

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_intensive_started_at ON intensive_purchases(started_at);

