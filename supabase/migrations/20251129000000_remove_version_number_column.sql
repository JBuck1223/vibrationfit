-- Remove version_number and completion_percent columns from vision_versions
-- Both are now calculated dynamically:
-- - version_number: based on created_at order using get_vision_version_number()
-- - completion_percent: based on filled category fields (calculated in frontend)

-- Drop the columns
ALTER TABLE public.vision_versions
DROP COLUMN IF EXISTS version_number,
DROP COLUMN IF EXISTS completion_percent;

COMMENT ON TABLE public.vision_versions IS 
'Life vision versions. Version numbers are calculated dynamically using get_vision_version_number() based on created_at order. Completion percentage is calculated in frontend based on filled fields.';

