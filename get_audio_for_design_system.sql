-- ============================================================================
-- SQL Query to Get Audio Tracks for Design System Showcase
-- Run this in Supabase SQL Editor
-- Replace 'bd8e6440-a65b-4b01-bca0-28ae8e875b3f' with your actual vision ID
-- ============================================================================

-- This query returns data ready to paste into the design system page
SELECT 
  'const sampleTracks: AudioTrack[] = [' || chr(10) ||
  string_agg(
    '    {' || chr(10) ||
    '      id: ''' || at.id || ''',' || chr(10) ||
    '      title: ''' || 
      CASE at.section_key
        WHEN 'meta_intro' THEN 'Forward - Your Life Vision'
        WHEN 'meta_outro' THEN 'Conclusion - Integration'
        WHEN 'health' THEN 'Health & Vitality'
        WHEN 'money' THEN 'Money & Abundance'
        WHEN 'business' THEN 'Business & Career'
        WHEN 'family' THEN 'Family & Parenting'
        WHEN 'romance' THEN 'Romance & Partnership'
        WHEN 'social' THEN 'Social & Friends'
        WHEN 'fun' THEN 'Fun & Recreation'
        WHEN 'travel' THEN 'Travel & Adventure'
        WHEN 'home' THEN 'Home & Living'
        WHEN 'possessions' THEN 'Possessions & Lifestyle'
        WHEN 'giving' THEN 'Giving & Legacy'
        WHEN 'spirituality' THEN 'Spirituality & Growth'
        ELSE at.section_key
      END || ''',' || chr(10) ||
    '      artist: ''VibrationFit AI'',' || chr(10) ||
    '      duration: 180,' || chr(10) ||
    '      url: ''' || at.audio_url || ''',' || chr(10) ||
    '      thumbnail: ''''' || chr(10) ||
    '    }',
    ',' || chr(10)
  ) || chr(10) || '  ]' as formatted_tracks
FROM vision_audio_tracks at
WHERE at.vision_id = 'bd8e6440-a65b-4b01-bca0-28ae8e875b3f'
  AND at.status = 'completed'
  AND at.audio_url IS NOT NULL
  AND at.audio_url != ''
ORDER BY 
  CASE at.section_key
    WHEN 'meta_intro' THEN 1
    WHEN 'health' THEN 2
    WHEN 'money' THEN 3
    WHEN 'business' THEN 4
    WHEN 'family' THEN 5
    WHEN 'romance' THEN 6
    WHEN 'social' THEN 7
    WHEN 'fun' THEN 8
    WHEN 'travel' THEN 9
    WHEN 'home' THEN 10
    WHEN 'possessions' THEN 11
    WHEN 'giving' THEN 12
    WHEN 'spirituality' THEN 13
    WHEN 'meta_outro' THEN 14
    ELSE 99
  END
LIMIT 10;

-- ============================================================================
-- Alternative: Simple JSON output for easier copying
-- ============================================================================
SELECT json_agg(
  json_build_object(
    'id', id,
    'title', 
      CASE section_key
        WHEN 'meta_intro' THEN 'Forward - Your Life Vision'
        WHEN 'meta_outro' THEN 'Conclusion - Integration'
        WHEN 'health' THEN 'Health & Vitality'
        WHEN 'money' THEN 'Money & Abundance'
        WHEN 'business' THEN 'Business & Career'
        WHEN 'family' THEN 'Family & Parenting'
        WHEN 'romance' THEN 'Romance & Partnership'
        WHEN 'social' THEN 'Social & Friends'
        WHEN 'fun' THEN 'Fun & Recreation'
        WHEN 'travel' THEN 'Travel & Adventure'
        WHEN 'home' THEN 'Home & Living'
        WHEN 'possessions' THEN 'Possessions & Lifestyle'
        WHEN 'giving' THEN 'Giving & Legacy'
        WHEN 'spirituality' THEN 'Spirituality & Growth'
        ELSE section_key
      END,
    'artist', 'VibrationFit AI',
    'duration', 180,
    'url', audio_url,
    'thumbnail', ''
  ) ORDER BY 
    CASE section_key
      WHEN 'meta_intro' THEN 1
      WHEN 'health' THEN 2
      WHEN 'money' THEN 3
      WHEN 'business' THEN 4
      WHEN 'family' THEN 5
      WHEN 'romance' THEN 6
      WHEN 'social' THEN 7
      WHEN 'fun' THEN 8
      WHEN 'travel' THEN 9
      WHEN 'home' THEN 10
      WHEN 'possessions' THEN 11
      WHEN 'giving' THEN 12
      WHEN 'spirituality' THEN 13
      WHEN 'meta_outro' THEN 14
      ELSE 99
    END
) as tracks
FROM vision_audio_tracks
WHERE vision_id = 'bd8e6440-a65b-4b01-bca0-28ae8e875b3f'
  AND status = 'completed'
  AND audio_url IS NOT NULL
  AND audio_url != '';

