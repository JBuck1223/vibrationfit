-- Add 'vision_board_ideas' to token_usage action_type check constraint

ALTER TABLE token_usage DROP CONSTRAINT IF EXISTS token_usage_action_type_check;

ALTER TABLE token_usage
  ADD CONSTRAINT token_usage_action_type_check CHECK (
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
      'vision_board_ideas'::text
    ])
  );




