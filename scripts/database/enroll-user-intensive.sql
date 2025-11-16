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

-- Step 3: Create checklist (SINGLE SOURCE OF TRUTH)
INSERT INTO intensive_checklist (
  intensive_id,
  user_id,
  status
) VALUES (
  (SELECT id FROM intensive_purchases WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user-email@example.com') ORDER BY created_at DESC LIMIT 1),
  (SELECT id FROM auth.users WHERE email = 'user-email@example.com'),
  'pending'
);

-- Verify enrollment (check intensive_checklist - source of truth)
SELECT 
  ic.id as checklist_id,
  u.email,
  ic.status,
  ic.started_at,
  ic.created_at
FROM intensive_checklist ic
JOIN auth.users u ON u.id = ic.user_id
WHERE u.email = 'user-email@example.com'
ORDER BY ic.created_at DESC
LIMIT 1;

