-- Manually Enroll User in Intensive
-- Replace 'user-email@example.com' with the actual user's email

-- Step 1: Get user ID
SELECT id, email FROM auth.users WHERE email = 'user-email@example.com';

-- Step 2: Create order + intensive order item
INSERT INTO orders (
  user_id,
  total_amount,
  currency,
  status,
  paid_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'user-email@example.com'),
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
  completion_status
) VALUES (
  (SELECT id FROM orders WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user-email@example.com') ORDER BY created_at DESC LIMIT 1),
  (SELECT id FROM products WHERE key = 'intensive' LIMIT 1),
  1,
  49900,
  'usd',
  FALSE,
  'manual_enrollment_' || extract(epoch from now())::text,
  'full',
  1,
  1,
  'pending'
) RETURNING id;

-- Step 3: Create checklist (SINGLE SOURCE OF TRUTH)
INSERT INTO intensive_checklist (
  intensive_id,
  user_id,
  status
) VALUES (
  (SELECT id FROM order_items WHERE order_id = (SELECT id FROM orders WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user-email@example.com') ORDER BY created_at DESC LIMIT 1) ORDER BY created_at DESC LIMIT 1),
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

