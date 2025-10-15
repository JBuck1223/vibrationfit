-- Refine Intensive Checklist to Use Existing System Components
-- Drop old columns and add new refined flow columns

-- Add new checklist columns for refined flow
ALTER TABLE intensive_checklist 
  ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMP,
  
  ADD COLUMN IF NOT EXISTS assessment_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS assessment_completed_at TIMESTAMP,
  
  ADD COLUMN IF NOT EXISTS call_scheduled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS call_scheduled_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS call_scheduled_time TIMESTAMP,
  
  ADD COLUMN IF NOT EXISTS vision_built BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS vision_built_at TIMESTAMP,
  
  ADD COLUMN IF NOT EXISTS vision_refined BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS vision_refined_at TIMESTAMP,
  
  ADD COLUMN IF NOT EXISTS audio_generated BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS audio_generated_at TIMESTAMP,
  
  ADD COLUMN IF NOT EXISTS vision_board_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS vision_board_completed_at TIMESTAMP,
  
  ADD COLUMN IF NOT EXISTS first_journal_entry BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS first_journal_entry_at TIMESTAMP,
  
  ADD COLUMN IF NOT EXISTS calibration_call_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS calibration_call_completed_at TIMESTAMP,
  
  ADD COLUMN IF NOT EXISTS activation_protocol_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS activation_protocol_completed_at TIMESTAMP;

-- Drop old columns (keep them for now for backwards compatibility)
-- We'll mark them as deprecated in comments
COMMENT ON COLUMN intensive_checklist.intake_completed IS 'DEPRECATED: Use profile_completed instead';
COMMENT ON COLUMN intensive_checklist.vision_drafted IS 'DEPRECATED: Use vision_built instead';
COMMENT ON COLUMN intensive_checklist.builder_session_started IS 'DEPRECATED: Use vision_built instead';
COMMENT ON COLUMN intensive_checklist.builder_session_completed IS 'DEPRECATED: Use vision_built instead';
COMMENT ON COLUMN intensive_checklist.vision_board_created IS 'DEPRECATED: Use vision_board_completed instead';
COMMENT ON COLUMN intensive_checklist.calibration_scheduled IS 'DEPRECATED: Use call_scheduled instead';
COMMENT ON COLUMN intensive_checklist.calibration_attended IS 'DEPRECATED: Use calibration_call_completed instead';
COMMENT ON COLUMN intensive_checklist.audios_generated IS 'DEPRECATED: Use audio_generated instead';

-- Create helper function to get intensive progress percentage
CREATE OR REPLACE FUNCTION get_intensive_progress(checklist_row intensive_checklist)
RETURNS INTEGER AS $$
DECLARE
  total_steps INTEGER := 10;
  completed_steps INTEGER := 0;
BEGIN
  IF checklist_row.profile_completed THEN completed_steps := completed_steps + 1; END IF;
  IF checklist_row.assessment_completed THEN completed_steps := completed_steps + 1; END IF;
  IF checklist_row.call_scheduled THEN completed_steps := completed_steps + 1; END IF;
  IF checklist_row.vision_built THEN completed_steps := completed_steps + 1; END IF;
  IF checklist_row.vision_refined THEN completed_steps := completed_steps + 1; END IF;
  IF checklist_row.audio_generated THEN completed_steps := completed_steps + 1; END IF;
  IF checklist_row.vision_board_completed THEN completed_steps := completed_steps + 1; END IF;
  IF checklist_row.first_journal_entry THEN completed_steps := completed_steps + 1; END IF;
  IF checklist_row.calibration_call_completed THEN completed_steps := completed_steps + 1; END IF;
  IF checklist_row.activation_protocol_completed THEN completed_steps := completed_steps + 1; END IF;
  
  RETURN (completed_steps * 100 / total_steps);
END;
$$ LANGUAGE plpgsql STABLE;

-- Create helper function to get next uncompleted step
CREATE OR REPLACE FUNCTION get_next_intensive_step(checklist_row intensive_checklist)
RETURNS TEXT AS $$
BEGIN
  IF NOT checklist_row.profile_completed THEN RETURN 'profile'; END IF;
  IF NOT checklist_row.assessment_completed THEN RETURN 'assessment'; END IF;
  IF NOT checklist_row.call_scheduled THEN RETURN 'schedule_call'; END IF;
  IF NOT checklist_row.vision_built THEN RETURN 'build_vision'; END IF;
  IF NOT checklist_row.vision_refined THEN RETURN 'refine_vision'; END IF;
  IF NOT checklist_row.audio_generated THEN RETURN 'generate_audio'; END IF;
  IF NOT checklist_row.vision_board_completed THEN RETURN 'vision_board'; END IF;
  IF NOT checklist_row.first_journal_entry THEN RETURN 'journal'; END IF;
  IF NOT checklist_row.calibration_call_completed THEN RETURN 'calibration_call'; END IF;
  IF NOT checklist_row.activation_protocol_completed THEN RETURN 'activation'; END IF;
  
  RETURN 'completed';
END;
$$ LANGUAGE plpgsql STABLE;

