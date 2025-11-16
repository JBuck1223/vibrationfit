-- Mark Intensive as Completed (Keeps Records)
-- Replace email below

-- SINGLE SOURCE OF TRUTH: intensive_checklist.status
UPDATE intensive_checklist 
SET 
  status = 'completed',
  completed_at = NOW()
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com')
  AND status IN ('pending', 'in_progress');

-- Verify
SELECT status, completed_at 
FROM intensive_checklist 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com');

