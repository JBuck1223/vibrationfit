-- Fix token_usage table constraints
-- Add missing action types: vision_board_ideas, voice_profile_analysis

-- Drop existing constraint
ALTER TABLE token_usage DROP CONSTRAINT IF EXISTS token_usage_action_type_check;

-- Add updated constraint with all action types
ALTER TABLE token_usage ADD CONSTRAINT token_usage_action_type_check CHECK (
  action_type = ANY (ARRAY[
    'assessment_scoring'::text,
    'vision_generation'::text,
    'vision_refinement'::text,
    'blueprint_generation'::text,
    'chat_conversation'::text,
    'audio_generation'::text,
    'image_generation'::text,
    'transcription'::text,
    'admin_grant'::text,
    'admin_deduct'::text,
    'subscription_grant'::text,
    'trial_grant'::text,
    'token_pack_purchase'::text,
    'life_vision_category_summary'::text,
    'life_vision_master_assembly'::text,
    'prompt_suggestions'::text,
    'frequency_flip'::text,
    'vibrational_analysis'::text,
    'viva_scene_generation'::text,
    'north_star_reflection'::text,
    'voice_profile_analysis'::text,
    'vision_board_ideas'::text
  ])
);

COMMENT ON CONSTRAINT token_usage_action_type_check ON token_usage IS 
  'Ensures action_type matches one of the supported AI action types';




