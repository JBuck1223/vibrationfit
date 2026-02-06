-- Manual Intensive Enrollment for Existing User
-- Replace 'USER_EMAIL_HERE' with the actual user's email

-- Step 1: Get the user ID (replace with actual email)
SELECT id, email FROM auth.users WHERE email = 'USER_EMAIL_HERE';

-- Step 2: Create order + intensive order item (replace USER_ID with result from above)
INSERT INTO orders (
  user_id,
  total_amount,
  currency,
  status,
  paid_at
) VALUES (
  'USER_ID_HERE',
  49900,
  'usd',
  'paid',
  NOW()
) RETURNING id;

INSERT INTO order_items (
  order_id,
  product_id,
  quantity,
  amount,
  currency,
  is_subscription,
  stripe_payment_intent_id,
  payment_plan,
  installments_total,
  installments_paid,
  completion_status,
  activation_deadline
) VALUES (
  (SELECT id FROM orders WHERE user_id = 'USER_ID_HERE' ORDER BY created_at DESC LIMIT 1),
  (SELECT id FROM products WHERE key = 'intensive' LIMIT 1),
  1,
  49900,
  'usd',
  FALSE,
  'manual_enrollment_' || extract(epoch from now())::text,
  'full',
  1,
  1,
  'pending',
  NOW() + INTERVAL '72 hours'
) RETURNING id;

-- Step 3: Create matching checklist (replace INTENSIVE_ID with result from above)
INSERT INTO intensive_checklist (intensive_id, user_id)
VALUES ('10652d64-62ae-441d-98de-5ad34b965dbe', '720adebb-e6c0-4f6c-a5fc-164d128e083a');

-- Verify the enrollment
SELECT 
  oi.id as intensive_id,
  o.user_id,
  u.email,
  oi.activation_deadline,
  oi.completion_status,
  ic.profile_completed,
  ic.assessment_completed
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
JOIN auth.users u ON o.user_id = u.id
LEFT JOIN intensive_checklist ic ON ic.intensive_id = oi.id
WHERE u.email = 'USER_EMAIL_HERE';
