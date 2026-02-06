-- Reset Intensive for Testing
-- Replace 'your-email@example.com' with your actual email

-- OPTION 1: Reset to "Not Started" (shows welcome screen again)
UPDATE order_items
SET 
  started_at = NULL,
  activation_deadline = NULL,
  completion_status = 'pending',
  completed_at = NULL
WHERE order_id IN (
  SELECT id FROM orders WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com')
);

UPDATE intensive_checklist
SET 
  profile_completed = false,
  profile_completed_at = NULL,
  assessment_completed = false,
  assessment_completed_at = NULL,
  call_scheduled = false,
  call_scheduled_at = NULL,
  vision_built = false,
  vision_built_at = NULL,
  vision_refined = false,
  vision_refined_at = NULL,
  audio_generated = false,
  audio_generated_at = NULL,
  vision_board_completed = false,
  vision_board_completed_at = NULL,
  first_journal_entry = false,
  first_journal_entry_at = NULL,
  calibration_call_completed = false,
  calibration_call_completed_at = NULL,
  activation_protocol_completed = false,
  activation_protocol_completed_at = NULL
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');


-- OPTION 2: Delete intensive completely
-- DELETE FROM intensive_checklist WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
-- DELETE FROM orders WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');


-- OPTION 3: Fast-forward to 90% complete (test completion flow)
-- UPDATE intensive_checklist SET 
--   profile_completed = true, assessment_completed = true, call_scheduled = true,
--   vision_built = true, vision_refined = true, audio_generated = true,
--   vision_board_completed = true, first_journal_entry = true,
--   calibration_call_completed = true
-- WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
