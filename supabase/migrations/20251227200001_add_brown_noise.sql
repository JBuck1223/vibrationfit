-- Add Brown Noise to audio_background_tracks
INSERT INTO public.audio_background_tracks (name, display_name, category, file_url, description, sort_order, is_active)
VALUES (
  'brown-noise',
  'Brown Noise',
  'noise',
  'https://media.vibrationfit.com/site-assets/audio/mixing-tracks/Brown-Noise.mp3',
  'Deep brown noise for deep relaxation',
  7,
  true
)
ON CONFLICT (name) DO NOTHING;

