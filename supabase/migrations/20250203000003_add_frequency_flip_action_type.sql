-- Migration: Add frequency_flip and transcription action types to token_usage table
-- These action types were added to the TypeScript interface but missing from the database constraint

-- Drop the existing constraint
ALTER TABLE token_usage DROP CONSTRAINT IF EXISTS token_usage_action_type_check;

-- Add the updated constraint with frequency_flip and transcription included
ALTER TABLE token_usage 
  ADD CONSTRAINT token_usage_action_type_check 
  CHECK (action_type IN (
    'assessment_scoring',
    'vision_generation', 
    'vision_refinement',
    'blueprint_generation',
    'chat_conversation',
    'audio_generation',
    'image_generation',
    'transcription',
    'admin_grant',
    'admin_deduct',
    'life_vision_category_summary',
    'life_vision_master_assembly',
    'prompt_suggestions',
    'frequency_flip'
  ));

