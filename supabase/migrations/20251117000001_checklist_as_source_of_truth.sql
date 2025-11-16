-- Make intensive_checklist the single source of truth
-- Add status tracking fields to checklist

ALTER TABLE intensive_checklist
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP NULL;

-- Add comments
COMMENT ON COLUMN intensive_checklist.status IS 'Source of truth for intensive enrollment: pending, in_progress, completed';
COMMENT ON COLUMN intensive_checklist.started_at IS 'When user clicked Start button (begins 72-hour timer)';
COMMENT ON COLUMN intensive_checklist.completed_at IS 'When user completed all steps and graduated';

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_intensive_checklist_user_status 
  ON intensive_checklist(user_id, status);

-- intensive_purchases is now just for payment/purchase tracking
COMMENT ON TABLE intensive_purchases IS 'Payment records ONLY - intensive_checklist.status is source of truth for enrollment';

