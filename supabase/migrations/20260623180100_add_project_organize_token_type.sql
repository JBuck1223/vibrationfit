-- Migration: Add project_organize to token_usage action_type + AI tool config
-- Created: 2026-06-23

-- Add project_organize to token_usage action_type check constraint
-- First drop and recreate with the new value included
ALTER TABLE token_usage DROP CONSTRAINT IF EXISTS token_usage_action_type_check;
ALTER TABLE token_usage ADD CONSTRAINT token_usage_action_type_check
  CHECK (action_type = ANY (ARRAY[
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
    'vision_board_ideas'::text,
    'life_vision_category_generation'::text,
    'imagination_starter'::text,
    'focus_story_generation'::text,
    'incantation_generation'::text,
    'story_refinement'::text,
    'song_lyrics_generation'::text,
    'project_organize'::text
  ]));

-- Add AI tool config for project_organize
INSERT INTO ai_tool_configs (tool_key, tool_name, model_name, temperature, is_enabled, is_reasoning_model)
VALUES ('project_organize', 'Project Brain Dump Organizer', 'gpt-4o', 0.7, true, false)
ON CONFLICT (tool_key) DO NOTHING;
