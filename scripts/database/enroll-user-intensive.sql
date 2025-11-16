-- Manually Enroll User in Intensive
-- Replace 'user-email@example.com' with the actual user's email

-- Step 1: Get user ID
SELECT id, email FROM auth.users WHERE email = 'user-email@example.com';

-- Step 2: Create intensive purchase record
INSERT INTO intensive_purchases (
  user_id,
  payment_plan,
  amount,
  installments_total,
  installments_paid,
  completion_status,
  stripe_payment_intent_id
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'user-email@example.com'),
  'full',
  49900,
  1,
  1,
  'pending',
  'manual_enrollment_' || extract(epoch from now())::text
) RETURNING id;

-- Step 3: Create checklist (use the intensive ID from above)
INSERT INTO intensive_checklist (
  intensive_id,
  user_id
) VALUES (
  (SELECT id FROM intensive_purchases WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user-email@example.com') ORDER BY created_at DESC LIMIT 1),
  (SELECT id FROM auth.users WHERE email = 'user-email@example.com')
);

-- Verify enrollment
SELECT 
  ip.id as intensive_id,
  u.email,
  ip.completion_status,
  ip.started_at,
  ip.created_at
FROM intensive_purchases ip
JOIN auth.users u ON u.id = ip.user_id
WHERE u.email = 'user-email@example.com'
ORDER BY ip.created_at DESC
LIMIT 1;

