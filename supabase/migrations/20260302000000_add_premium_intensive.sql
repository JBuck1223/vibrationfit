-- Migration 1 of 2: Add new enum values for premium intensive tiers
-- These must be committed in a separate transaction before they can be used in INSERTs.

ALTER TYPE public.membership_tier_type ADD VALUE IF NOT EXISTS 'intensive_premium';
ALTER TYPE public.membership_tier_type ADD VALUE IF NOT EXISTS 'intensive_premium_household';
