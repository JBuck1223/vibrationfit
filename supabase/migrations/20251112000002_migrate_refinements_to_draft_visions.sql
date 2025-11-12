-- Migrate existing refinements to draft vision records
-- This converts individual category refinements into full draft vision_versions rows

-- Function to convert refinements to draft visions
CREATE OR REPLACE FUNCTION migrate_refinements_to_draft_visions()
RETURNS TABLE(
  user_id UUID,
  draft_vision_id UUID,
  categories_migrated TEXT[]
) AS $$
DECLARE
  user_record RECORD;
  active_vision RECORD;
  draft_vision_id UUID;
  refinement_record RECORD;
  categories_with_drafts TEXT[];
BEGIN
  -- For each user with refinements
  FOR user_record IN 
    SELECT DISTINCT r.user_id, r.vision_id
    FROM refinements r
    WHERE r.operation_type = 'refine_vision'
    AND r.output_text IS NOT NULL
    AND r.output_text != ''
  LOOP
    -- Get their active vision
    SELECT * INTO active_vision
    FROM vision_versions
    WHERE id = user_record.vision_id
    LIMIT 1;
    
    IF active_vision.id IS NOT NULL THEN
      -- Check if draft vision already exists
      SELECT id INTO draft_vision_id
      FROM vision_versions
      WHERE user_id = user_record.user_id
      AND is_draft = true
      AND is_active = false
      LIMIT 1;
      
      -- Create draft vision if doesn't exist
      IF draft_vision_id IS NULL THEN
        INSERT INTO vision_versions (
          user_id,
          version_number,
          title,
          status,
          completion_percent,
          forward, fun, travel, home, family, romance, health, money,
          business, social, possessions, giving, spirituality, conclusion,
          is_active,
          is_draft,
          created_at,
          updated_at
        ) VALUES (
          active_vision.user_id,
          active_vision.version_number, -- Same version as base
          active_vision.title || ' (Draft)',
          'draft',
          active_vision.completion_percent,
          active_vision.forward,
          active_vision.fun,
          active_vision.travel,
          active_vision.home,
          active_vision.family,
          active_vision.romance,
          active_vision.health,
          active_vision.money,
          active_vision.business,
          active_vision.social,
          active_vision.possessions,
          active_vision.giving,
          active_vision.spirituality,
          active_vision.conclusion,
          false, -- is_active
          true,  -- is_draft
          NOW(),
          NOW()
        )
        RETURNING id INTO draft_vision_id;
      END IF;
      
      -- Apply all refinements to draft vision
      categories_with_drafts := ARRAY[]::TEXT[];
      
      FOR refinement_record IN
        SELECT DISTINCT ON (category) *
        FROM refinements
        WHERE user_id = user_record.user_id
        AND vision_id = user_record.vision_id
        AND operation_type = 'refine_vision'
        AND output_text IS NOT NULL
        AND output_text != ''
        ORDER BY category, created_at DESC
      LOOP
        -- Update the appropriate category in draft vision
        EXECUTE format(
          'UPDATE vision_versions SET %I = $1, updated_at = NOW() WHERE id = $2',
          refinement_record.category
        ) USING refinement_record.output_text, draft_vision_id;
        
        categories_with_drafts := array_append(categories_with_drafts, refinement_record.category);
      END LOOP;
      
      -- Return info about migration
      RETURN QUERY SELECT user_record.user_id, draft_vision_id, categories_with_drafts;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Uncomment to run migration (run manually when ready)
-- SELECT * FROM migrate_refinements_to_draft_visions();

COMMENT ON FUNCTION migrate_refinements_to_draft_visions IS 
'Migrates existing refinements to draft vision_versions rows. Run once during deployment.';

