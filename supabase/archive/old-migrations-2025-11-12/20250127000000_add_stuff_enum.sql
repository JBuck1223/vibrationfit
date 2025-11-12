-- Migration: Add 'stuff' to assessment_category enum
-- This must be run BEFORE the rename_possessions_to_stuff migration

ALTER TYPE assessment_category ADD VALUE IF NOT EXISTS 'stuff';
