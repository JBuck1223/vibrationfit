-- Add parent_id field to user_profiles table for version tracking
-- This allows us to track which version a profile was created from
-- Similar to the parent_id in vision_versions table

ALTER TABLE user_profiles
ADD COLUMN parent_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL;

-- Create index for faster parent lookups
CREATE INDEX idx_user_profiles_parent_id ON user_profiles(parent_id);

-- Add comment to document the field
COMMENT ON COLUMN user_profiles.parent_id IS 'References the profile version this was created from (for drafts and clones)';

-- Update existing drafts to set parent_id if they have a source
-- This will help with existing data, though parent tracking may be incomplete for old versions
UPDATE user_profiles up1
SET parent_id = (
  SELECT up2.id
  FROM user_profiles up2
  WHERE up2.user_id = up1.user_id
    AND up2.is_active = true
    AND up2.is_draft = false
    AND up2.created_at < up1.created_at
  ORDER BY up2.created_at DESC
  LIMIT 1
)
WHERE up1.is_draft = true
  AND up1.parent_id IS NULL;

-- Function to automatically set parent_id when creating a draft
-- This ensures new drafts always track their parent
CREATE OR REPLACE FUNCTION set_draft_parent_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If creating a draft and parent_id is not set, try to find the active profile
  IF NEW.is_draft = true AND NEW.parent_id IS NULL THEN
    SELECT id INTO NEW.parent_id
    FROM user_profiles
    WHERE user_id = NEW.user_id
      AND is_active = true
      AND is_draft = false
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to set parent_id automatically
DROP TRIGGER IF EXISTS set_draft_parent_id_trigger ON user_profiles;
CREATE TRIGGER set_draft_parent_id_trigger
  BEFORE INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_draft_parent_id();



