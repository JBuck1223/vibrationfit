-- Add 2-pay recurring price for Premium Activation Intensive - Household
-- $2,100/installment x 2 = $4,200 total

WITH premium_household AS (
  SELECT id FROM public.products WHERE key = 'intensive_premium_household'
)
INSERT INTO public.product_prices (product_id, stripe_price_id, currency, unit_amount, interval_unit, interval_count, is_active, metadata)
VALUES (
  (SELECT id FROM premium_household),
  NULL, 'usd', 210000, 'month', 1, true,
  '{"payment_plan": "2pay", "plan_type": "household", "installments": 2, "stripe_price_env": "STRIPE_PRICE_PREMIUM_HOUSEHOLD_INTENSIVE_2PAY", "description": "Premium Activation Intensive Household - 2 payments of $2,100"}'::jsonb
)
ON CONFLICT DO NOTHING;
