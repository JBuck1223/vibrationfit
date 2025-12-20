-- Add forbidden_words column to voice_profiles table
-- This allows users to specify individual words that should be avoided in AI-generated content

ALTER TABLE public.voice_profiles
ADD COLUMN IF NOT EXISTS forbidden_words text[];

COMMENT ON COLUMN public.voice_profiles.forbidden_words IS 'Array of words that should be avoided in AI-generated content for this user';

