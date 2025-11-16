-- Remove User from Intensive (Clean Exit)
-- Replace email below

DELETE FROM intensive_checklist 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com');

DELETE FROM intensive_purchases 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com');

-- Verify removed
SELECT 'No rows = success' as status, COUNT(*) as remaining_rows
FROM intensive_purchases 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com');

