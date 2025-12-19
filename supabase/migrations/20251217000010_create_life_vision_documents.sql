-- Create table to store final assembled life vision documents
-- This is the STEP 5 output (after categories, imagination, blueprints, and scenes)

CREATE TABLE IF NOT EXISTS life_vision_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Core vision content
  markdown_content text NOT NULL,
  json_content jsonb NOT NULL,
  
  -- Metadata
  version_number integer NOT NULL DEFAULT 1,
  is_active boolean DEFAULT true,
  
  -- Richness/quality metrics
  richness_metadata jsonb,
  total_word_count integer,
  categories_included text[] DEFAULT ARRAY[]::text[],
  
  -- AI metadata
  model_used text,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  
  -- Ensure one active vision per user
  CONSTRAINT one_active_vision_per_user UNIQUE NULLS NOT DISTINCT (user_id, is_active) 
    WHERE is_active = true
);

-- Indexes
CREATE INDEX idx_life_vision_documents_user_id ON life_vision_documents(user_id);
CREATE INDEX idx_life_vision_documents_active ON life_vision_documents(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_life_vision_documents_created ON life_vision_documents(created_at DESC);

-- RLS Policies
ALTER TABLE life_vision_documents ENABLE ROW LEVEL SECURITY;

-- Users can only see their own visions
CREATE POLICY "Users can view own vision documents"
  ON life_vision_documents
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own visions
CREATE POLICY "Users can create own vision documents"
  ON life_vision_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own visions
CREATE POLICY "Users can update own vision documents"
  ON life_vision_documents
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own visions
CREATE POLICY "Users can delete own vision documents"
  ON life_vision_documents
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE life_vision_documents IS 
  'Final assembled life vision documents - Step 5 of the Life Vision flow. Contains the complete synthesized vision from all 12 categories.';

COMMENT ON COLUMN life_vision_documents.markdown_content IS 
  'Full markdown content of the assembled life vision document';

COMMENT ON COLUMN life_vision_documents.json_content IS 
  'Structured JSON with forward, 12 category sections, and conclusion';

COMMENT ON COLUMN life_vision_documents.version_number IS 
  'Auto-incrementing version number for this user (1, 2, 3, etc.)';

COMMENT ON COLUMN life_vision_documents.is_active IS 
  'Only one vision can be active per user. Setting a new one as active deactivates previous ones.';

COMMENT ON COLUMN life_vision_documents.richness_metadata IS 
  'Per-category richness scores (density, clarity, detail) from text-metrics analysis';

COMMENT ON COLUMN life_vision_documents.categories_included IS 
  'Array of category keys that were included in this vision (e.g., [''fun'', ''health'', ''travel''])';

-- Trigger to auto-increment version_number
CREATE OR REPLACE FUNCTION set_vision_version_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the max version for this user and increment
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO NEW.version_number
  FROM life_vision_documents
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_vision_version
  BEFORE INSERT ON life_vision_documents
  FOR EACH ROW
  EXECUTE FUNCTION set_vision_version_number();

-- Trigger to deactivate previous active visions when a new one is set as active
CREATE OR REPLACE FUNCTION deactivate_previous_visions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    -- Deactivate all other visions for this user
    UPDATE life_vision_documents
    SET is_active = false, updated_at = now()
    WHERE user_id = NEW.user_id 
      AND id != NEW.id 
      AND is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deactivate_previous_visions
  BEFORE INSERT OR UPDATE ON life_vision_documents
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION deactivate_previous_visions();

-- Updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON life_vision_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Verify
DO $$
BEGIN
  RAISE NOTICE 'Created life_vision_documents table for final assembled visions';
  RAISE NOTICE 'Columns: markdown_content, json_content, richness_metadata, version_number, is_active';
  RAISE NOTICE 'Auto-versioning: Each new vision for a user gets incremented version number';
  RAISE NOTICE 'Auto-deactivation: Setting is_active=true deactivates all previous visions';
END $$;




