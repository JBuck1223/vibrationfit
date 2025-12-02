-- Drop the redundant user_revenue_metrics table
-- We use existing customer_subscriptions + payment_history instead

DROP TABLE IF EXISTS user_revenue_metrics CASCADE;

-- Add helpful comment
COMMENT ON TABLE customer_subscriptions IS 'Source of truth for user subscriptions. Join with membership_tiers for pricing. Use payment_history to calculate LTV/MRR.';




