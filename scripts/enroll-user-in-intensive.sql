-- Manual Intensive Enrollment for Existing User
-- Replace 'USER_EMAIL_HERE' with the actual user's email

-- Step 1: Get the user ID (replace with actual email)
SELECT id, email FROM auth.users WHERE email = 'USER_EMAIL_HERE';

-- Step 2: Create intensive purchase (replace USER_ID with result from above)
INSERT INTO intensive_purchases (
  user_id, 
  payment_plan, 
  installments_total, 
  installments_paid,
  completion_status, 
  activation_deadline,
  stripe_payment_intent_id,
  continuity_plan
) VALUES (
  'USER_ID_HERE',  -- Replace with actual user ID
  'full', 
  1, 
  1, 
  'pending', 
  NOW() + INTERVAL '72 hours',
  'manual_enrollment_' || extract(epoch from now())::text,  -- Fake payment intent ID
  'annual'
) RETURNING id;

-- Step 3: Create matching checklist (replace INTENSIVE_ID with result from above)
INSERT INTO intensive_checklist (intensive_id, user_id)
VALUES ('10652d64-62ae-441d-98de-5ad34b965dbe', '720adebb-e6c0-4f6c-a5fc-164d128e083a');

-- Verify the enrollment
SELECT 
  ip.id as intensive_id,
  ip.user_id,
  u.email,
  ip.activation_deadline,
  ip.completion_status,
  ic.profile_completed,
  ic.assessment_completed
FROM intensive_purchases ip
JOIN auth.users u ON ip.user_id = u.id
LEFT JOIN intensive_checklist ic ON ic.intensive_id = ip.id
WHERE u.email = 'USER_EMAIL_HERE';
