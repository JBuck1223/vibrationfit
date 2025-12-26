-- Create audio_recommended_combos table
-- Allows admins to curate preset combinations of background tracks + mix ratios

CREATE TABLE public.audio_recommended_combos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  background_track_id uuid NOT NULL REFERENCES public.audio_background_tracks(id) ON DELETE CASCADE,
  mix_ratio_id uuid NOT NULL REFERENCES public.audio_mix_ratios(id) ON DELETE CASCADE,
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

-- Add comments
COMMENT ON TABLE public.audio_recommended_combos IS 'Curated preset combinations of background tracks and mix ratios';
COMMENT ON COLUMN public.audio_recommended_combos.name IS 'Display name for the combo (e.g., "Sleep Journey", "Focus Session")';
COMMENT ON COLUMN public.audio_recommended_combos.description IS 'Optional description explaining why this combo works well';
COMMENT ON COLUMN public.audio_recommended_combos.background_track_id IS 'Reference to the background track';
COMMENT ON COLUMN public.audio_recommended_combos.mix_ratio_id IS 'Reference to the mix ratio';

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

-- Seed some recommended combos (using the seeded tracks and ratios)
-- Note: These will work after the flexible_audio_mixing migration runs

INSERT INTO public.audio_recommended_combos (name, description, background_track_id, mix_ratio_id, sort_order)
SELECT 
  'Deep Sleep Journey',
  'Gentle ocean waves with mostly background for deep relaxation',
  tracks.id,
  ratios.id,
  1
FROM 
  public.audio_background_tracks tracks,
  public.audio_mix_ratios ratios
WHERE 
  tracks.name = 'ocean-waves-1'
  AND ratios.name = 'Background Dominant (10/90)'
LIMIT 1;

INSERT INTO public.audio_recommended_combos (name, description, background_track_id, mix_ratio_id, sort_order)
SELECT 
  'Meditation Balance',
  'Calm meditation tones with balanced voice and background',
  tracks.id,
  ratios.id,
  2
FROM 
  public.audio_background_tracks tracks,
  public.audio_mix_ratios ratios
WHERE 
  tracks.name = 'ambient-meditation'
  AND ratios.name = 'Even Mix (50/50)'
LIMIT 1;

INSERT INTO public.audio_recommended_combos (name, description, background_track_id, mix_ratio_id, sort_order)
SELECT 
  'Focused Learning',
  'Binaural beats with voice-focused mix for concentration',
  tracks.id,
  ratios.id,
  3
FROM 
  public.audio_background_tracks tracks,
  public.audio_mix_ratios ratios
WHERE 
  tracks.name = 'binaural-alpha'
  AND ratios.name = 'Voice Strong (80/20)'
LIMIT 1;

INSERT INTO public.audio_recommended_combos (name, description, background_track_id, mix_ratio_id, sort_order)
SELECT 
  'Energizing Morning',
  'Uplifting energy with voice dominant for motivation',
  tracks.id,
  ratios.id,
  4
FROM 
  public.audio_background_tracks tracks,
  public.audio_mix_ratios ratios
WHERE 
  tracks.name = 'uplifting-energy'
  AND ratios.name = 'Voice Dominant (90/10)'
LIMIT 1;

INSERT INTO public.audio_recommended_combos (name, description, background_track_id, mix_ratio_id, sort_order)
SELECT 
  'Nature Walk',
  'Forest sounds with balanced mix for peaceful reflection',
  tracks.id,
  ratios.id,
  5
FROM 
  public.audio_background_tracks tracks,
  public.audio_mix_ratios ratios
WHERE 
  tracks.name = 'forest-ambience'
  AND ratios.name = 'Voice Balanced (60/40)'
LIMIT 1;

