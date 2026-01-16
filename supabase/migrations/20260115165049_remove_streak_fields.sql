-- Migration: Remove legacy streak fields from intensive_checklist
-- These fields were part of the old 7-day activation protocol that is no longer used

ALTER TABLE public.intensive_checklist
  DROP COLUMN IF EXISTS streak_day_1,
  DROP COLUMN IF EXISTS streak_day_2,
  DROP COLUMN IF EXISTS streak_day_3,
  DROP COLUMN IF EXISTS streak_day_4,
  DROP COLUMN IF EXISTS streak_day_5,
  DROP COLUMN IF EXISTS streak_day_6,
  DROP COLUMN IF EXISTS streak_day_7,
  DROP COLUMN IF EXISTS streak_day_7_reached_at;

-- Also remove related legacy fields if they exist
ALTER TABLE public.intensive_checklist
  DROP COLUMN IF EXISTS activation_protocol_started,
  DROP COLUMN IF EXISTS activation_started_at;
