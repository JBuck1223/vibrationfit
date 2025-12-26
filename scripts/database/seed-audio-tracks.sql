-- Script to add additional background tracks to the flexible mixing system
-- Run this after the main migration if you want to add more tracks

-- Additional Nature Sounds
INSERT INTO public.audio_background_tracks (name, display_name, category, file_url, description, sort_order) VALUES
  ('ocean-waves-3', 'Ocean Waves (Stormy)', 'nature', 'https://media.vibrationfit.com/site-assets/audio/mixing-tracks/Ocean-Waves-3.mp3', 'Powerful ocean waves with storm ambience', 11),
  ('rain-heavy', 'Heavy Rain', 'nature', 'https://media.vibrationfit.com/site-assets/audio/mixing-tracks/Rain-Heavy.mp3', 'Strong rainfall with thunder', 12),
  ('rain-on-tent', 'Rain on Tent', 'nature', 'https://media.vibrationfit.com/site-assets/audio/mixing-tracks/Rain-On-Tent.mp3', 'Cozy rain sounds on canvas', 13),
  ('river-stream', 'River Stream', 'nature', 'https://media.vibrationfit.com/site-assets/audio/mixing-tracks/River-Stream.mp3', 'Gentle flowing river', 14),
  ('waterfall', 'Waterfall', 'nature', 'https://media.vibrationfit.com/site-assets/audio/mixing-tracks/Waterfall.mp3', 'Cascading waterfall sounds', 15),
  ('birds-morning', 'Morning Birds', 'nature', 'https://media.vibrationfit.com/site-assets/audio/mixing-tracks/Birds-Morning.mp3', 'Peaceful morning bird songs', 16),
  ('crickets-night', 'Night Crickets', 'nature', 'https://media.vibrationfit.com/site-assets/audio/mixing-tracks/Crickets-Night.mp3', 'Soothing cricket sounds', 17),
  ('wind-leaves', 'Wind Through Leaves', 'nature', 'https://media.vibrationfit.com/site-assets/audio/mixing-tracks/Wind-Leaves.mp3', 'Gentle wind rustling leaves', 18);

-- Additional Ambient Sounds
INSERT INTO public.audio_background_tracks (name, display_name, category, file_url, description, sort_order) VALUES
  ('brown-noise', 'Brown Noise', 'ambient', 'https://media.vibrationfit.com/site-assets/audio/mixing-tracks/Brown-Noise.mp3', 'Deep brown noise for focus', 19),
  ('cafe-ambience', 'Cafe Ambience', 'ambient', 'https://media.vibrationfit.com/site-assets/audio/mixing-tracks/Cafe-Ambience.mp3', 'Gentle coffee shop background', 20),
  ('library-ambience', 'Library Ambience', 'ambient', 'https://media.vibrationfit.com/site-assets/audio/mixing-tracks/Library-Ambience.mp3', 'Quiet library atmosphere', 21),
  ('fireplace', 'Crackling Fireplace', 'ambient', 'https://media.vibrationfit.com/site-assets/audio/mixing-tracks/Fireplace.mp3', 'Warm fireplace crackling', 22),
  ('space-ambience', 'Space Ambience', 'ambient', 'https://media.vibrationfit.com/site-assets/audio/mixing-tracks/Space-Ambience.mp3', 'Cosmic ambient sounds', 23);

-- Additional Music
INSERT INTO public.audio_background_tracks (name, display_name, category, file_url, description, sort_order) VALUES
  ('binaural-theta', 'Binaural Theta', 'music', 'https://media.vibrationfit.com/site-assets/audio/mixing-tracks/Binaural-Theta.mp3', 'Theta wave binaural beats for deep relaxation', 24),
  ('binaural-delta', 'Binaural Delta', 'music', 'https://media.vibrationfit.com/site-assets/audio/mixing-tracks/Binaural-Delta.mp3', 'Delta wave binaural beats for sleep', 25),
  ('binaural-beta', 'Binaural Beta', 'music', 'https://media.vibrationfit.com/site-assets/audio/mixing-tracks/Binaural-Beta.mp3', 'Beta wave binaural beats for focus', 26),
  ('singing-bowls', 'Tibetan Singing Bowls', 'music', 'https://media.vibrationfit.com/site-assets/audio/mixing-tracks/Singing-Bowls.mp3', 'Healing singing bowl tones', 27),
  ('ambient-guitar', 'Ambient Guitar', 'music', 'https://media.vibrationfit.com/site-assets/audio/mixing-tracks/Ambient-Guitar.mp3', 'Soft ambient guitar melody', 28),
  ('lo-fi-beats', 'Lo-Fi Beats', 'music', 'https://media.vibrationfit.com/site-assets/audio/mixing-tracks/Lo-Fi-Beats.mp3', 'Chill lo-fi hip hop beats', 29),
  ('classical-piano', 'Classical Piano', 'music', 'https://media.vibrationfit.com/site-assets/audio/mixing-tracks/Classical-Piano.mp3', 'Gentle classical piano pieces', 30);

-- Additional Custom Mix Ratios (if you want more granular control)
INSERT INTO public.audio_mix_ratios (name, voice_volume, bg_volume, description, sort_order, icon) VALUES
  ('Voice Extreme (95/5)', 95, 5, 'Almost pure voice with barely audible background', 11, 'volume-2'),
  ('Voice Very Strong (85/15)', 85, 15, 'Very strong voice with subtle background', 12, 'volume-2'),
  ('Voice Moderate (75/25)', 75, 25, 'Moderate voice with light background', 13, 'volume-1'),
  ('Slightly Voice Heavy (65/35)', 65, 35, 'Slightly more voice than background', 14, 'equal'),
  ('Slightly Background Heavy (35/65)', 35, 65, 'Slightly more background than voice', 15, 'music'),
  ('Background Very Strong (25/75)', 25, 75, 'Very strong background with soft voice', 16, 'music-2'),
  ('Background Extreme (5/95)', 5, 95, 'Almost pure background with whisper voice', 17, 'music-2');

-- Query to see all tracks by category
-- SELECT category, COUNT(*) as track_count 
-- FROM audio_background_tracks 
-- WHERE is_active = true 
-- GROUP BY category 
-- ORDER BY category;

-- Query to see all mix ratios
-- SELECT name, voice_volume, bg_volume 
-- FROM audio_mix_ratios 
-- WHERE is_active = true 
-- ORDER BY sort_order;

