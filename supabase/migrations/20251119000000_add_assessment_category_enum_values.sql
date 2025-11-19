-- Migration: Add new enum values for clean category names
-- Part 1 of 2: Add enum values (must be in separate transaction)
-- Date: November 19, 2025

ALTER TYPE assessment_category ADD VALUE IF NOT EXISTS 'love';
ALTER TYPE assessment_category ADD VALUE IF NOT EXISTS 'work';
ALTER TYPE assessment_category ADD VALUE IF NOT EXISTS 'stuff';

