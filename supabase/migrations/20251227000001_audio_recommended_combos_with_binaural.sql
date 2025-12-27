-- Create audio_recommended_combos table with binaural support
-- Allows admins to curate preset combinations of background tracks + mix ratios + optional binaural

CREATE TABLE public.audio_recommended_combos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  background_track_id uuid NOT NULL REFERENCES public.audio_background_tracks(id) ON DELETE CASCADE,
  mix_ratio_id uuid NOT NULL REFERENCES public.audio_mix_ratios(id) ON DELETE CASCADE,
  binaural_track_id uuid REFERENCES public.audio_background_tracks(id) ON DELETE SET NULL,
  binaural_volume integer DEFAULT 0 CHECK (binaural_volume >= 0 AND binaural_volume <= 30),
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes
CREATE INDEX idx_audio_recommended_combos_active ON public.audio_recommended_combos(is_active);
CREATE INDEX idx_audio_recommended_combos_sort ON public.audio_recommended_combos(sort_order);
CREATE INDEX idx_audio_recommended_combos_track ON public.audio_recommended_combos(background_track_id);
CREATE INDEX idx_audio_recommended_combos_ratio ON public.audio_recommended_combos(mix_ratio_id);
CREATE INDEX idx_audio_recommended_combos_binaural ON public.audio_recommended_combos(binaural_track_id) WHERE binaural_track_id IS NOT NULL;

-- Add comments
COMMENT ON TABLE public.audio_recommended_combos IS 'Curated preset combinations of background tracks, mix ratios, and optional binaural enhancements';
COMMENT ON COLUMN public.audio_recommended_combos.name IS 'Display name for the combo (e.g., "Deep Sleep Journey", "Focus Session")';
COMMENT ON COLUMN public.audio_recommended_combos.description IS 'Optional description explaining why this combo works well';
COMMENT ON COLUMN public.audio_recommended_combos.background_track_id IS 'Reference to the background track';
COMMENT ON COLUMN public.audio_recommended_combos.mix_ratio_id IS 'Reference to the mix ratio';
COMMENT ON COLUMN public.audio_recommended_combos.binaural_track_id IS 'Optional reference to a binaural/solfeggio track';
COMMENT ON COLUMN public.audio_recommended_combos.binaural_volume IS 'Volume percentage for binaural track (0-30)';

-- Enable RLS
ALTER TABLE public.audio_recommended_combos ENABLE ROW LEVEL SECURITY;

-- Create policies (authenticated users can read active combos)
CREATE POLICY "Allow authenticated users to read active combos"
  ON public.audio_recommended_combos
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Service role can manage everything
CREATE POLICY "Allow service role to manage recommended combos"
  ON public.audio_recommended_combos
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Seed some recommended combos
-- Note: Binaural tracks may not exist yet - these inserts will work when tracks are available

-- 2-Track Combos (No Binaural)
INSERT INTO public.audio_recommended_combos (name, description, background_track_id, mix_ratio_id, binaural_track_id, binaural_volume, sort_order)
SELECT 
  'Pure Ocean Meditation',
  'Gentle ocean waves with balanced voice for peaceful meditation',
  tracks.id,
  ratios.id,
  NULL,
  0,
  1
FROM 
  public.audio_background_tracks tracks,
  public.audio_mix_ratios ratios
WHERE 
  tracks.name = 'ocean-waves-1'
  AND ratios.name = 'Even Mix (50/50)'
LIMIT 1;

INSERT INTO public.audio_recommended_combos (name, description, background_track_id, mix_ratio_id, binaural_track_id, binaural_volume, sort_order)
SELECT 
  'Voice Clear Focus',
  'Minimal background, maximum voice clarity for affirmations',
  tracks.id,
  ratios.id,
  NULL,
  0,
  2
FROM 
  public.audio_background_tracks tracks,
  public.audio_mix_ratios ratios
WHERE 
  tracks.name = 'ambient-meditation'
  AND ratios.name = 'Voice Dominant (90/10)'
LIMIT 1;

-- 3-Track Combos with Binaural (these will insert when binaural tracks exist)
INSERT INTO public.audio_recommended_combos (name, description, background_track_id, mix_ratio_id, binaural_track_id, binaural_volume, sort_order)
SELECT 
  'Deep Sleep Journey',
  'Ocean waves with delta binaural for deep, restorative sleep',
  bg_tracks.id,
  ratios.id,
  bin_tracks.id,
  15,
  10
FROM 
  public.audio_background_tracks bg_tracks,
  public.audio_mix_ratios ratios,
  public.audio_background_tracks bin_tracks
WHERE 
  bg_tracks.name = 'ocean-waves-1'
  AND ratios.name = 'Background Dominant (10/90)'
  AND bin_tracks.name LIKE '%delta%'
LIMIT 1;

INSERT INTO public.audio_recommended_combos (name, description, background_track_id, mix_ratio_id, binaural_track_id, binaural_volume, sort_order)
SELECT 
  'Alpha Focus Session',
  'Ambient background with alpha binaural for concentrated work',
  bg_tracks.id,
  ratios.id,
  bin_tracks.id,
  20,
  11
FROM 
  public.audio_background_tracks bg_tracks,
  public.audio_mix_ratios ratios,
  public.audio_background_tracks bin_tracks
WHERE 
  bg_tracks.name = 'ambient-meditation'
  AND ratios.name = 'Voice Balanced (60/40)'
  AND bin_tracks.name LIKE '%alpha%'
LIMIT 1;

INSERT INTO public.audio_recommended_combos (name, description, background_track_id, mix_ratio_id, binaural_track_id, binaural_volume, sort_order)
SELECT 
  'Theta Meditation',
  'Deep meditation with theta brainwave entrainment',
  bg_tracks.id,
  ratios.id,
  bin_tracks.id,
  15,
  12
FROM 
  public.audio_background_tracks bg_tracks,
  public.audio_mix_ratios ratios,
  public.audio_background_tracks bin_tracks
WHERE 
  bg_tracks.name = 'ambient-meditation'
  AND ratios.name = 'Even Mix (50/50)'
  AND bin_tracks.name LIKE '%theta%'
LIMIT 1;

INSERT INTO public.audio_recommended_combos (name, description, background_track_id, mix_ratio_id, binaural_track_id, binaural_volume, sort_order)
SELECT 
  '528Hz Heart Healing',
  'Solfeggio love frequency for emotional balance and heart healing',
  bg_tracks.id,
  ratios.id,
  bin_tracks.id,
  15,
  13
FROM 
  public.audio_background_tracks bg_tracks,
  public.audio_mix_ratios ratios,
  public.audio_background_tracks bin_tracks
WHERE 
  bg_tracks.name = 'ambient-meditation'
  AND ratios.name = 'Voice Balanced (60/40)'
  AND bin_tracks.name LIKE '528%'
LIMIT 1;

INSERT INTO public.audio_recommended_combos (name, description, background_track_id, mix_ratio_id, binaural_track_id, binaural_volume, sort_order)
SELECT 
  '432Hz Natural Harmony',
  'Universal healing frequency aligned with nature',
  bg_tracks.id,
  ratios.id,
  bin_tracks.id,
  10,
  14
FROM 
  public.audio_background_tracks bg_tracks,
  public.audio_mix_ratios ratios,
  public.audio_background_tracks bin_tracks
WHERE 
  bg_tracks.name = 'ambient-meditation'
  AND ratios.name = 'Even Mix (50/50)'
  AND bin_tracks.name LIKE '432%'
LIMIT 1;

