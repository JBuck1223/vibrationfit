-- Drop dream_[key] and worry_[key] fields from user_profiles
-- These fields were originally added for profile enrichment but are being removed
-- to simplify the profile structure and reduce redundancy with clarity/contrast fields

-- Drop dream columns
ALTER TABLE user_profiles
  DROP COLUMN IF EXISTS dream_fun,
  DROP COLUMN IF EXISTS dream_health,
  DROP COLUMN IF EXISTS dream_travel,
  DROP COLUMN IF EXISTS dream_love,
  DROP COLUMN IF EXISTS dream_family,
  DROP COLUMN IF EXISTS dream_social,
  DROP COLUMN IF EXISTS dream_home,
  DROP COLUMN IF EXISTS dream_work,
  DROP COLUMN IF EXISTS dream_money,
  DROP COLUMN IF EXISTS dream_stuff,
  DROP COLUMN IF EXISTS dream_giving,
  DROP COLUMN IF EXISTS dream_spirituality;

-- Drop worry columns
ALTER TABLE user_profiles
  DROP COLUMN IF EXISTS worry_fun,
  DROP COLUMN IF EXISTS worry_health,
  DROP COLUMN IF EXISTS worry_travel,
  DROP COLUMN IF EXISTS worry_love,
  DROP COLUMN IF EXISTS worry_family,
  DROP COLUMN IF EXISTS worry_social,
  DROP COLUMN IF EXISTS worry_home,
  DROP COLUMN IF EXISTS worry_work,
  DROP COLUMN IF EXISTS worry_money,
  DROP COLUMN IF EXISTS worry_stuff,
  DROP COLUMN IF EXISTS worry_giving,
  DROP COLUMN IF EXISTS worry_spirituality;

-- Drop and recreate the get_field_label function to remove dream/worry field labels
DROP FUNCTION IF EXISTS public.get_field_label(text);

CREATE FUNCTION public.get_field_label(p_field_name text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  field_labels JSONB := '{
    "clarity_health": "Health Clarity",
    "clarity_love": "Love Clarity",
    "clarity_family": "Family Clarity",
    "clarity_work": "Work Clarity",
    "clarity_money": "Money Clarity",
    "clarity_fun": "Fun Clarity",
    "clarity_travel": "Travel Clarity",
    "clarity_social": "Social Clarity",
    "clarity_home": "Home Clarity",
    "clarity_stuff": "Stuff Clarity",
    "clarity_spirituality": "Spirituality Clarity",
    "clarity_giving": "Giving Clarity",
    "contrast_health": "Health Contrast",
    "contrast_love": "Love Contrast",
    "contrast_family": "Family Contrast",
    "contrast_work": "Work Contrast",
    "contrast_money": "Money Contrast",
    "contrast_fun": "Fun Contrast",
    "contrast_travel": "Travel Contrast",
    "contrast_social": "Social Contrast",
    "contrast_home": "Home Contrast",
    "contrast_stuff": "Stuff Contrast",
    "contrast_spirituality": "Spirituality Contrast",
    "contrast_giving": "Giving Contrast"
  }';
BEGIN
  -- Return the label from the JSONB object, or the p_field_name if not found
  RETURN COALESCE(field_labels->>p_field_name, p_field_name);
END;
$$;

COMMENT ON FUNCTION public.get_field_label IS 'Returns human-readable labels for profile field keys (dream/worry fields removed)';

