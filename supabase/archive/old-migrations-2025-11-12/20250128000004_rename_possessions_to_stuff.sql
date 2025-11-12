-- Migration: Rename "possessions" to "stuff"
-- This changes the category name across all relevant tables

-- IMPORTANT: PostgreSQL enums cannot have values renamed or removed.
-- The enum type will contain BOTH 'possessions' and 'stuff' after this migration.
-- Application code should use 'stuff' going forward.

-- 0. Ensure AI scoring columns exist (idempotent)
ALTER TABLE assessment_responses
ADD COLUMN IF NOT EXISTS is_custom_response BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ai_score INTEGER CHECK (ai_score IN (2, 4, 6, 8, 10)),
ADD COLUMN IF NOT EXISTS ai_green_line TEXT CHECK (ai_green_line IN ('above', 'neutral', 'below')),
ADD COLUMN IF NOT EXISTS custom_text TEXT;

-- NOTE: 'stuff' enum value should already exist from migration 20250127000000_add_stuff_enum.sql

-- 1. Rename column in vision_versions table
ALTER TABLE vision_versions RENAME COLUMN possessions TO stuff;

-- 2. Update values in assessment_results.category_scores JSONB
UPDATE assessment_results
SET category_scores = 
    CASE 
        WHEN category_scores ? 'possessions' THEN
            jsonb_set(
                category_scores - 'possessions',
                '{stuff}',
                category_scores->'possessions'
            )
        ELSE category_scores
    END;

-- 3. Update assessment_responses table
-- Now we can use 'stuff' enum value
UPDATE assessment_responses 
SET category = 'stuff'::assessment_category 
WHERE category = 'possessions'::assessment_category;

-- 4. Update journal_entries table
UPDATE journal_entries
SET category = 'stuff'
WHERE category = 'possessions';

-- 5. Update refinements table
UPDATE refinements
SET category = 'stuff'
WHERE category = 'possessions';

-- 6. Update viva_conversations table
UPDATE viva_conversations
SET category = 'stuff'
WHERE category = 'possessions';

-- 7. Update vibrational_links table (for category_a and category_b)
UPDATE vibrational_links
SET category_a = 'stuff'
WHERE category_a = 'possessions';

UPDATE vibrational_links
SET category_b = 'stuff'
WHERE category_b = 'possessions';

-- Note: User profiles uses `possessions_lifestyle_story` column name
-- This stays as-is since it's a descriptive name, not a category reference

-- Verify the changes
DO $$
BEGIN
    RAISE NOTICE 'Migration complete. Possessions renamed to stuff in:';
    RAISE NOTICE '- vision_versions.possessions → vision_versions.stuff';
    RAISE NOTICE '- assessment_results.category_scores JSONB';
    RAISE NOTICE '- assessment_responses.category';
    RAISE NOTICE '- journal_entries.category';
    RAISE NOTICE '- refinements.category';
    RAISE NOTICE '- viva_conversations.category';
    RAISE NOTICE '- vibrational_links.category_a and category_b';
END $$;
