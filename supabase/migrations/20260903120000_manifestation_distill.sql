-- Migration: Manifestation Distill (why you want it / what it feels like)
-- 1. ai_tools row for manifestation_distill
-- 2. token_usage action_type: add manifestation_distill
-- 3. manifestation_essence_versions table (version history like vision refinement)
-- Date: 2026-09-03

-- ---------------------------------------------------------------------------
-- 1. AI tool config
-- ---------------------------------------------------------------------------
INSERT INTO ai_tools (tool_key, tool_name, description, model_name, temperature, max_tokens, system_prompt, is_active) VALUES
(
  'manifestation_distill',
  'Manifestation Distill',
  'Distills the essence of a manifestation — why the member wants it and what living it feels like (first person, present tense) — from their Life Vision, journal entries, conversations, and inspired action.',
  'gpt-4o',
  0.7,
  1200,
  'You are VIVA distilling the essence of one manifestation into why the member wants it and what living it feels like. Return strict JSON only.',
  true
)
ON CONFLICT (tool_key) DO UPDATE SET
  tool_name = EXCLUDED.tool_name,
  description = EXCLUDED.description,
  model_name = EXCLUDED.model_name,
  temperature = EXCLUDED.temperature,
  max_tokens = EXCLUDED.max_tokens,
  system_prompt = EXCLUDED.system_prompt,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ---------------------------------------------------------------------------
-- 2. token_usage action_type check constraint (full current list + new value)
-- ---------------------------------------------------------------------------
ALTER TABLE public.token_usage DROP CONSTRAINT IF EXISTS token_usage_action_type_check;
ALTER TABLE public.token_usage ADD CONSTRAINT token_usage_action_type_check
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
    'spark_query_generation'::text,
    'story_refinement'::text,
    'song_lyrics_generation'::text,
    'project_organize'::text,
    'travel_parse'::text,
    'song_music_generation'::text,
    'song_stems_generation'::text,
    'video_generation'::text,
    'background_processing'::text,
    'admin_tool'::text,
    'life_explorer_lesson'::text,
    'life_explorer_checkin'::text,
    'life_explorer_wall_photo'::text,
    'life_explorer_book'::text,
    'life_explorer_sidekick'::text,
    'life_explorer_compose'::text,
    'manifestation_distill'::text
  ]));

-- ---------------------------------------------------------------------------
-- 3. Essence version history (mirrors the vision-refinement versioning model)
-- ---------------------------------------------------------------------------
CREATE TABLE public.manifestation_essence_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manifestation_id uuid NOT NULL REFERENCES public.manifestations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  why_it_matters text,
  what_it_feels_like text,
  source text NOT NULL DEFAULT 'viva' CHECK (source IN ('viva', 'member')),
  version_number integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_manifestation_essence_versions_manifestation
  ON public.manifestation_essence_versions(manifestation_id, version_number DESC);

ALTER TABLE public.manifestation_essence_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own essence versions"
  ON public.manifestation_essence_versions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Members can create own essence versions"
  ON public.manifestation_essence_versions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can delete own essence versions"
  ON public.manifestation_essence_versions FOR DELETE
  USING (auth.uid() = user_id);
