-- SQL Queries to Get Vision Audio Tracks from Supabase
-- Run these in your Supabase SQL Editor

-- ============================================================================
-- QUERY 1: Get all vision audio tracks for a specific user
-- ============================================================================
SELECT 
  at.id,
  at.vision_id,
  at.section_key,
  at.audio_url,
  at.status,
  at.voice_id,
  at.content_hash,
  at.created_at,
  at.updated_at,
  vv.title as vision_title,
  vv.version_number,
  vv.user_id
FROM vision_audio_tracks at
JOIN vision_versions vv ON at.vision_id = vv.id
WHERE vv.user_id = 'YOUR_USER_ID_HERE'  -- Replace with actual user ID
ORDER BY at.created_at DESC;

-- ============================================================================
-- QUERY 2: Get vision audio tracks for a specific vision
-- ============================================================================
SELECT 
  at.id,
  at.section_key,
  at.audio_url,
  at.status,
  at.voice_id,
  at.content_hash,
  at.created_at,
  at.updated_at
FROM vision_audio_tracks at
WHERE at.vision_id = 'bd8e6440-a65b-4b01-bca0-28ae8e875b3f'  -- Replace with actual vision ID
  AND at.status = 'completed'
ORDER BY at.section_key;

-- ============================================================================
-- QUERY 3: Get all vision sections with audio for a vision
-- ============================================================================
WITH section_labels AS (
  SELECT 
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
    END as pretty_title
FROM vision_audio_tracks at
WHERE at.vision_id = 'bd8e6440-a65b-4b01-bca0-28ae8e875b3f'
)
SELECT 
  at.section_key,
  section_labels.pretty_title as title,
  at.audio_url as url,
  at.status,
  at.voice_id,
  CASE 
    WHEN at.status = 'completed' THEN TRUE 
    ELSE FALSE 
  END as is_ready,
  at.created_at,
  EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - at.created_at))::INTEGER as seconds_ago
FROM vision_audio_tracks at
LEFT JOIN section_labels ON at.section_key = section_labels.section_key
WHERE at.vision_id = 'bd8e6440-a65b-4b01-bca0-28ae8e875b3f'
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
  END;

-- ============================================================================
-- QUERY 4: Get user ID for a specific vision
-- ============================================================================
SELECT 
  id,
  user_id,
  title,
  version_number,
  created_at
FROM vision_versions
WHERE id = 'bd8e6440-a65b-4b01-bca0-28ae8e875b3f';

-- ============================================================================
-- QUERY 5: Get all completed audio tracks for the design system showcase
-- ============================================================================
SELECT 
  at.section_key,
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
  END as title,
  'VibrationFit AI' as artist,
  180 as duration,  -- Default duration, you can calculate actual duration if stored
  at.audio_url as url,
  at.status
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
LIMIT 10;  -- Get first 10 tracks for demo

