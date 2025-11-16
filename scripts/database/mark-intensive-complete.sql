-- Mark Intensive as Completed (Keeps Records)
-- Replace email below

UPDATE intensive_purchases 
SET 
  completion_status = 'completed',
  completed_at = NOW()
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com')
  AND completion_status IN ('pending', 'in_progress');

-- Verify
SELECT completion_status, completed_at 
FROM intensive_purchases 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com');

