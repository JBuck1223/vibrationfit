-- Migration: Add new action types to token_usage table
-- This updates the CHECK constraint to include the new life vision action types

-- Drop the existing constraint
ALTER TABLE token_usage DROP CONSTRAINT IF EXISTS token_usage_action_type_check;

-- Add the new constraint with all action types
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
    'admin_grant',
    'admin_deduct',
    'life_vision_category_summary',
    'life_vision_master_assembly',
    'prompt_suggestions'
  ));

