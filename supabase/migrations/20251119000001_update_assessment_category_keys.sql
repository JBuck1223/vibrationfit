-- Migration: Update assessment category keys to use clean names
-- Part 2 of 2: Update data to use new enum values
-- Changes: romance -> love, business -> work, possessions -> stuff
-- Date: November 19, 2025
-- NOTE: Run 20251119000000_add_assessment_category_enum_values.sql FIRST!

-- Update assessment_responses table
UPDATE assessment_responses
SET category = 'love'
WHERE category = 'romance';

UPDATE assessment_responses
SET category = 'work'
WHERE category = 'business';

UPDATE assessment_responses
SET category = 'stuff'
WHERE category = 'possessions';

-- Update assessment_results table (category_scores and green_line_status are JSONB)
-- We need to rename the keys in the JSONB objects

-- Update category_scores JSONB keys
UPDATE assessment_results
SET category_scores = category_scores - 'romance' || jsonb_build_object('love', category_scores->'romance')
WHERE category_scores ? 'romance';

UPDATE assessment_results
SET category_scores = category_scores - 'business' || jsonb_build_object('work', category_scores->'business')
WHERE category_scores ? 'business';

UPDATE assessment_results
SET category_scores = category_scores - 'possessions' || jsonb_build_object('stuff', category_scores->'possessions')
WHERE category_scores ? 'possessions';

-- Update green_line_status JSONB keys
UPDATE assessment_results
SET green_line_status = green_line_status - 'romance' || jsonb_build_object('love', green_line_status->'romance')
WHERE green_line_status ? 'romance';

UPDATE assessment_results
SET green_line_status = green_line_status - 'business' || jsonb_build_object('work', green_line_status->'business')
WHERE green_line_status ? 'business';

UPDATE assessment_results
SET green_line_status = green_line_status - 'possessions' || jsonb_build_object('stuff', green_line_status->'possessions')
WHERE green_line_status ? 'possessions';

-- Update assessment_insights table
UPDATE assessment_insights
SET category = 'love'
WHERE category = 'romance';

UPDATE assessment_insights
SET category = 'work'
WHERE category = 'business';

UPDATE assessment_insights
SET category = 'stuff'
WHERE category = 'possessions';

