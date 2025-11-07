-- ============================================================================
-- Verify Action Types Migration
-- ============================================================================
-- Run this to verify all action types are properly configured

-- Check current constraint
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'token_usage_action_type_check'
AND conrelid = 'token_usage'::regclass;

-- List all valid action types from constraint
SELECT 
  'Valid action types in database:' AS info;

-- Check if transcription action type exists in any records
SELECT 
  action_type,
  COUNT(*) as usage_count,
  SUM(tokens_used) as total_tokens,
  MIN(created_at) as first_usage,
  MAX(created_at) as last_usage
FROM token_usage
WHERE action_type = 'transcription'
GROUP BY action_type;

-- Check if frequency_flip action type exists in any records
SELECT 
  action_type,
  COUNT(*) as usage_count,
  SUM(tokens_used) as total_tokens,
  MIN(created_at) as first_usage,
  MAX(created_at) as last_usage
FROM token_usage
WHERE action_type = 'frequency_flip'
GROUP BY action_type;

-- Show all action types currently in use
SELECT 
  action_type,
  COUNT(*) as record_count,
  SUM(tokens_used) as total_tokens_used,
  COUNT(DISTINCT user_id) as unique_users
FROM token_usage
GROUP BY action_type
ORDER BY record_count DESC;

-- Verify action types match TypeScript interface
-- Expected: assessment_scoring, vision_generation, vision_refinement, 
--           blueprint_generation, chat_conversation, audio_generation, 
--           image_generation, transcription, admin_grant, admin_deduct,
--           life_vision_category_summary, life_vision_master_assembly,
--           prompt_suggestions, frequency_flip

