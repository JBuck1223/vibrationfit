-- Add audio_recordings JSONB column to vision_board_items, abundance_events, and daily_papers
-- Mirrors the existing journal_entries.audio_recordings pattern: [{ url, transcript, type, category, created_at }]

ALTER TABLE public.vision_board_items
  ADD COLUMN IF NOT EXISTS audio_recordings jsonb DEFAULT '[]'::jsonb NOT NULL;

COMMENT ON COLUMN public.vision_board_items.audio_recordings
  IS 'Array of audio/video recordings with metadata: [{ url, transcript, type, category, created_at }]';

ALTER TABLE public.abundance_events
  ADD COLUMN IF NOT EXISTS audio_recordings jsonb DEFAULT '[]'::jsonb NOT NULL;

COMMENT ON COLUMN public.abundance_events.audio_recordings
  IS 'Array of audio/video recordings with metadata: [{ url, transcript, type, category, created_at }]';

ALTER TABLE public.daily_papers
  ADD COLUMN IF NOT EXISTS audio_recordings jsonb DEFAULT '[]'::jsonb NOT NULL;

COMMENT ON COLUMN public.daily_papers.audio_recordings
  IS 'Array of audio/video recordings with metadata: [{ url, transcript, type, category, created_at }]';
