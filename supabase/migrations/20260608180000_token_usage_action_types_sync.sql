-- Sync token_usage.action_type check constraint with the action types the app
-- actually emits (src/lib/tokens/tracking.ts). It was missing several values,
-- causing token-usage audit inserts to fail (e.g. song_lyrics_generation).

ALTER TABLE public.token_usage DROP CONSTRAINT IF EXISTS token_usage_action_type_check;

ALTER TABLE public.token_usage ADD CONSTRAINT token_usage_action_type_check CHECK (action_type = ANY (ARRAY[
  'assessment_scoring','vision_generation','vision_refinement','blueprint_generation','chat_conversation','audio_generation','image_generation','transcription','admin_grant','admin_deduct','subscription_grant','trial_grant','token_pack_purchase','life_vision_category_summary','life_vision_master_assembly','life_vision_category_generation','prompt_suggestions','frequency_flip','vibrational_analysis','viva_scene_generation','north_star_reflection','voice_profile_analysis','vision_board_ideas','imagination_starter','focus_story_generation','incantation_generation','story_refinement','song_lyrics_generation','song_music_generation'
]::text[]));
