-- Migration: Remove status field from vision_versions
-- Date: 2025-11-12
-- Description: Consolidate to is_draft/is_active flags only

-- Drop the status column from vision_versions
ALTER TABLE "public"."vision_versions" DROP COLUMN IF EXISTS "status";

-- Add comment explaining the consolidation
COMMENT ON TABLE "public"."vision_versions" IS 'User life visions. State managed by is_draft and is_active flags.';

-- Rollback instructions (if needed):
-- ALTER TABLE "public"."vision_versions" ADD COLUMN "status" text DEFAULT 'complete';
-- ALTER TABLE "public"."vision_versions" ADD CONSTRAINT "vision_versions_status_check" 
--   CHECK (status IN ('draft', 'complete', 'archived'));

