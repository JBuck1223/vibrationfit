-- Update get_field_label function to use new field names
-- Remove references to old field names that no longer exist

CREATE OR REPLACE FUNCTION public.get_field_label(p_field_name text) RETURNS text
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
  label_map JSONB;
BEGIN
  label_map := '{
    "first_name": "First Name",
    "last_name": "Last Name",
    "email": "Email",
    "phone": "Phone",
    "date_of_birth": "Date of Birth",
    "gender": "Gender",
    "relationship_status": "Relationship Status",
    "has_children": "Has Children",
    "children_ages": "Children Ages",
    "height": "Height",
    "weight": "Weight",
    "exercise_frequency": "Exercise Frequency",
    "city": "City",
    "state": "State",
    "country": "Country",
    "occupation": "Occupation",
    "company": "Company",
    "household_income": "Household Income",
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
    "contrast_giving": "Giving Contrast",
    "dream_health": "Health Dreams",
    "dream_love": "Love Dreams",
    "dream_family": "Family Dreams",
    "dream_work": "Work Dreams",
    "dream_money": "Money Dreams",
    "dream_fun": "Fun Dreams",
    "dream_travel": "Travel Dreams",
    "dream_social": "Social Dreams",
    "dream_home": "Home Dreams",
    "dream_stuff": "Stuff Dreams",
    "dream_spirituality": "Spirituality Dreams",
    "dream_giving": "Giving Dreams",
    "worry_health": "Health Worries",
    "worry_love": "Love Worries",
    "worry_family": "Family Worries",
    "worry_work": "Work Worries",
    "worry_money": "Money Worries",
    "worry_fun": "Fun Worries",
    "worry_travel": "Travel Worries",
    "worry_social": "Social Worries",
    "worry_home": "Home Worries",
    "worry_stuff": "Stuff Worries",
    "worry_spirituality": "Spirituality Worries",
    "worry_giving": "Giving Worries"
  }'::JSONB;
  
  RETURN COALESCE(label_map->>p_field_name, INITCAP(REPLACE(p_field_name, '_', ' ')));
END;
$$;

COMMENT ON FUNCTION public.get_field_label(p_field_name text) IS 'Returns human-readable labels for profile field names - updated to use new category keys (love, work, stuff)';

