-- Migration: Add fields for new 14-step Activation Intensive flow
-- Adds intake_completed, audios_generated, and unlock_completed fields

-- Add intake_completed (Step 2: Baseline Intake)
ALTER TABLE public.intensive_checklist
  ADD COLUMN IF NOT EXISTS intake_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS intake_completed_at timestamptz;

-- Add audios_generated (Step 9: Audio Mix - completion of full audio mixing)
ALTER TABLE public.intensive_checklist
  ADD COLUMN IF NOT EXISTS audios_generated boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS audios_generated_at timestamptz;

-- Add unlock_completed (Step 14: Full Platform Unlock)
ALTER TABLE public.intensive_checklist
  ADD COLUMN IF NOT EXISTS unlock_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS unlock_completed_at timestamptz;

-- Add comment documenting the 14-step flow
COMMENT ON TABLE public.intensive_checklist IS '
Tracks progress through the 14-step Activation Intensive:
Step 1: Settings (tracked via user_accounts table)
Step 2: Baseline Intake (intake_completed)
Step 3: Profile (profile_completed)
Step 4: Assessment (assessment_completed)
Step 5: Life Vision (vision_built)
Step 6: Refine Vision (vision_refined)
Step 7: Generate Audio (audio_generated)
Step 8: Record Audio (optional, can be skipped)
Step 9: Audio Mix (audios_generated)
Step 10: Vision Board (vision_board_completed)
Step 11: Journal (first_journal_entry)
Step 12: Book Call (call_scheduled)
Step 13: My Activation Plan (activation_protocol_completed)
Step 14: Platform Unlock (unlock_completed)
';
