-- Add source_profile_id to track which profile version was used
-- when generating category content and assembling visions.

ALTER TABLE vision_new_category_state
  ADD COLUMN IF NOT EXISTS source_profile_id uuid REFERENCES user_profiles(id);

ALTER TABLE vision_versions
  ADD COLUMN IF NOT EXISTS source_profile_id uuid REFERENCES user_profiles(id);
