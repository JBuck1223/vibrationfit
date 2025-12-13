-- Add promo code tracking to intensive_purchases for affiliate tracking
-- Migration: 20251213000010_add_promo_tracking.sql

-- Add promo code field to intensive_purchases
ALTER TABLE intensive_purchases
ADD COLUMN IF NOT EXISTS promo_code TEXT,
ADD COLUMN IF NOT EXISTS referral_source TEXT,
ADD COLUMN IF NOT EXISTS campaign_name TEXT;

-- Create index for fast promo code lookups
CREATE INDEX IF NOT EXISTS idx_intensive_purchases_promo_code 
ON intensive_purchases(promo_code) WHERE promo_code IS NOT NULL;

-- Create index for referral source lookups
CREATE INDEX IF NOT EXISTS idx_intensive_purchases_referral_source 
ON intensive_purchases(referral_source) WHERE referral_source IS NOT NULL;

-- Add comment
COMMENT ON COLUMN intensive_purchases.promo_code IS 'Promo/coupon code used for this purchase (e.g., FREEINTENSIVE, BETA2024)';
COMMENT ON COLUMN intensive_purchases.referral_source IS 'Marketing source/affiliate identifier (e.g., partner_john, facebook_ad, email_campaign)';
COMMENT ON COLUMN intensive_purchases.campaign_name IS 'Campaign name for grouping (e.g., Beta Launch 2024, Holiday Sale)';

