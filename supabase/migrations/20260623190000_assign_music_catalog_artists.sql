-- Assign official Vibration Fit catalog songs to Jordan and Vanessa Buckingham
-- instead of the generic "Vibration Fit" artist label.

-- Jordan Buckingham: 5 songs
UPDATE public.music_catalog
SET
  artist = 'Jordan Buckingham',
  tags = CASE
    WHEN 'creator:2a0fc1a7-5b8a-46a4-97e4-d5c5ddefdf1a' = ANY(COALESCE(tags, '{}'))
      THEN tags
    ELSE array_append(COALESCE(tags, '{}'), 'creator:2a0fc1a7-5b8a-46a4-97e4-d5c5ddefdf1a')
  END,
  updated_at = now()
WHERE preview_url LIKE '%/site-assets/music/%'
  AND title IN (
    'Follow Your Bliss',
    'Freedom is the Basis of Life',
    'Relentless',
    'The Life I Choose',
    'Vibrational Universe'
  );

-- Vanessa Buckingham: remaining official catalog songs
UPDATE public.music_catalog
SET
  artist = 'Vanessa Buckingham',
  tags = CASE
    WHEN 'creator:30082787-6ae1-4413-9a32-293cc63e38ee' = ANY(COALESCE(tags, '{}'))
      THEN tags
    ELSE array_append(COALESCE(tags, '{}'), 'creator:30082787-6ae1-4413-9a32-293cc63e38ee')
  END,
  updated_at = now()
WHERE preview_url LIKE '%/site-assets/music/%'
  AND title NOT IN (
    'Follow Your Bliss',
    'Freedom is the Basis of Life',
    'Relentless',
    'The Life I Choose',
    'Vibrational Universe'
  );
