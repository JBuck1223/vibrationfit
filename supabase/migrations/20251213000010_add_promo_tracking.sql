-- Add promo code tracking for Vision Pro subscriptions and Intensive purchases
-- Migration: 20251213000010_add_promo_tracking.sql

-- Add promo code tracking to customer_subscriptions (Vision Pro)
ALTER TABLE customer_subscriptions
ADD COLUMN IF NOT EXISTS promo_code TEXT,
ADD COLUMN IF NOT EXISTS referral_source TEXT,
ADD COLUMN IF NOT EXISTS campaign_name TEXT;

-- Add promo code tracking to intensive_purchases (The Intensive)
ALTER TABLE intensive_purchases
ADD COLUMN IF NOT EXISTS promo_code TEXT,
ADD COLUMN IF NOT EXISTS referral_source TEXT,
ADD COLUMN IF NOT EXISTS campaign_name TEXT;

-- Create indexes for customer_subscriptions
CREATE INDEX IF NOT EXISTS idx_customer_subscriptions_promo_code 
ON customer_subscriptions(promo_code) WHERE promo_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customer_subscriptions_referral_source 
ON customer_subscriptions(referral_source) WHERE referral_source IS NOT NULL;

-- Create indexes for intensive_purchases
CREATE INDEX IF NOT EXISTS idx_intensive_purchases_promo_code 
ON intensive_purchases(promo_code) WHERE promo_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_intensive_purchases_referral_source 
ON intensive_purchases(referral_source) WHERE referral_source IS NOT NULL;

-- Add comments for customer_subscriptions
COMMENT ON COLUMN customer_subscriptions.promo_code IS 'Promo/coupon code used for this subscription (e.g., VISIONPRO50, EARLYBIRD)';
COMMENT ON COLUMN customer_subscriptions.referral_source IS 'Marketing source/affiliate identifier (e.g., partner_john, instagram_ad, email_campaign)';
COMMENT ON COLUMN customer_subscriptions.campaign_name IS 'Campaign name for grouping (e.g., Vision Pro Launch, Black Friday 2024)';

-- Add comments for intensive_purchases
COMMENT ON COLUMN intensive_purchases.promo_code IS 'Promo/coupon code used for this purchase (e.g., FREEINTENSIVE, BETA2024)';
COMMENT ON COLUMN intensive_purchases.referral_source IS 'Marketing source/affiliate identifier (e.g., partner_john, facebook_ad, email_campaign)';
COMMENT ON COLUMN intensive_purchases.campaign_name IS 'Campaign name for grouping (e.g., Beta Launch 2024, Holiday Sale)';

