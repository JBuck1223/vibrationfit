-- Flexible Audio Mixing System
-- Allows users to choose any background track and any mix ratio

-- Create audio_background_tracks table
CREATE TABLE public.audio_background_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  display_name text NOT NULL,
  category text NOT NULL, -- e.g., 'nature', 'music', 'ambient'
  file_url text NOT NULL, -- Full S3 URL to the audio file
  duration_seconds integer,
  description text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create audio_mix_ratios table
CREATE TABLE public.audio_mix_ratios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, -- e.g., "Voice Focused", "Balanced", "Music Focused"
  voice_volume integer NOT NULL CHECK (voice_volume >= 0 AND voice_volume <= 100),
  bg_volume integer NOT NULL CHECK (bg_volume >= 0 AND bg_volume <= 100),
  description text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  icon text, -- Optional icon identifier
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT mix_ratios_total_100 CHECK ((voice_volume + bg_volume) = 100)
);

-- Add indexes for performance
CREATE INDEX idx_audio_background_tracks_category ON public.audio_background_tracks(category);
CREATE INDEX idx_audio_background_tracks_active ON public.audio_background_tracks(is_active);
CREATE INDEX idx_audio_background_tracks_sort ON public.audio_background_tracks(sort_order);
CREATE INDEX idx_audio_mix_ratios_active ON public.audio_mix_ratios(is_active);
CREATE INDEX idx_audio_mix_ratios_sort ON public.audio_mix_ratios(sort_order);

-- Seed background tracks
INSERT INTO public.audio_background_tracks (name, display_name, category, file_url, description, sort_order) VALUES
  ('ocean-waves-1', 'Ocean Waves', 'nature', 'https://media.vibrationfit.com/site-assets/audio/mixing-tracks/Ocean-Waves-1.mp3', 'Gentle ocean waves lapping on shore', 1),
  ('ocean-waves-2', 'Ocean Waves (Calm)', 'nature', 'https://media.vibrationfit.com/site-assets/audio/mixing-tracks/Ocean-Waves-2.mp3', 'Calm and peaceful ocean sounds', 2),
  ('rain-gentle', 'Gentle Rain', 'nature', 'https://media.vibrationfit.com/site-assets/audio/mixing-tracks/Rain-Gentle.mp3', 'Soft rainfall on leaves', 3),
  ('forest-ambience', 'Forest Ambience', 'nature', 'https://media.vibrationfit.com/site-assets/audio/mixing-tracks/Forest-Ambience.mp3', 'Birds and gentle forest sounds', 4),
  ('white-noise', 'White Noise', 'ambient', 'https://media.vibrationfit.com/site-assets/audio/mixing-tracks/White-Noise.mp3', 'Pure white noise for focus', 5),
  ('pink-noise', 'Pink Noise', 'ambient', 'https://media.vibrationfit.com/site-assets/audio/mixing-tracks/Pink-Noise.mp3', 'Softer pink noise', 6),
  ('ambient-meditation', 'Meditation Tones', 'ambient', 'https://media.vibrationfit.com/site-assets/audio/mixing-tracks/Ambient-Meditation.mp3', 'Soothing ambient meditation music', 7),
  ('binaural-alpha', 'Binaural Alpha', 'music', 'https://media.vibrationfit.com/site-assets/audio/mixing-tracks/Binaural-Alpha.mp3', 'Alpha wave binaural beats', 8),
  ('calm-piano', 'Calm Piano', 'music', 'https://media.vibrationfit.com/site-assets/audio/mixing-tracks/Calm-Piano.mp3', 'Soft piano melody', 9),
  ('uplifting-energy', 'Uplifting Energy', 'music', 'https://media.vibrationfit.com/site-assets/audio/mixing-tracks/Uplifting-Energy.mp3', 'Energizing background music', 10);

-- Seed mix ratios (common presets)
INSERT INTO public.audio_mix_ratios (name, voice_volume, bg_volume, description, sort_order, icon) VALUES
  ('Voice Only', 100, 0, 'Pure voice, no background', 1, 'mic'),
  ('Voice Dominant (90/10)', 90, 10, 'Mostly voice with subtle background', 2, 'volume-2'),
  ('Voice Strong (80/20)', 80, 20, 'Voice clear with light background', 3, 'volume-2'),
  ('Voice Focused (70/30)', 70, 30, 'Strong voice, moderate background', 4, 'volume-1'),
  ('Voice Balanced (60/40)', 60, 40, 'Balanced voice and background', 5, 'equal'),
  ('Even Mix (50/50)', 50, 50, 'Equal voice and background', 6, 'balance'),
  ('Background Balanced (40/60)', 40, 60, 'Background prominent, voice audible', 7, 'music'),
  ('Background Focused (30/70)', 30, 70, 'Background strong, voice soft', 8, 'music'),
  ('Background Strong (20/80)', 20, 80, 'Background very strong, voice gentle', 9, 'music-2'),
  ('Background Dominant (10/90)', 10, 90, 'Mostly background, voice whisper', 10, 'music-2');

-- Add comments
COMMENT ON TABLE public.audio_background_tracks IS 'Available background audio tracks for mixing with voice recordings';
COMMENT ON TABLE public.audio_mix_ratios IS 'Preset mix ratios for voice/background volume levels';

COMMENT ON COLUMN public.audio_background_tracks.category IS 'Category for organizing tracks: nature, ambient, music, etc.';
COMMENT ON COLUMN public.audio_background_tracks.file_url IS 'Full URL to the audio file in S3';
COMMENT ON COLUMN public.audio_mix_ratios.voice_volume IS 'Voice volume percentage (0-100)';
COMMENT ON COLUMN public.audio_mix_ratios.bg_volume IS 'Background volume percentage (0-100)';
COMMENT ON COLUMN public.audio_mix_ratios.icon IS 'Optional icon identifier for UI display';

-- Enable RLS (Row Level Security) - allow authenticated users to read
ALTER TABLE public.audio_background_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_mix_ratios ENABLE ROW LEVEL SECURITY;

-- Create policies for read access (authenticated users can read active tracks/ratios)
CREATE POLICY "Allow authenticated users to read active background tracks"
  ON public.audio_background_tracks
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Allow authenticated users to read active mix ratios"
  ON public.audio_mix_ratios
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Service role can manage everything (for admin operations via API)
CREATE POLICY "Allow service role to manage background tracks"
  ON public.audio_background_tracks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role to manage mix ratios"
  ON public.audio_mix_ratios
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

