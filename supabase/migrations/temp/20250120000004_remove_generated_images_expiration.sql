-- Remove expiration from generated_images and related helpers

ALTER TABLE IF EXISTS generated_images
  DROP COLUMN IF EXISTS expires_at,
  DROP COLUMN IF EXISTS is_expired;

-- Drop helper functions if they exist
DROP FUNCTION IF EXISTS mark_expired_generated_images();
DROP FUNCTION IF EXISTS cleanup_expired_generated_images();

-- Drop indexes that referenced removed columns
DROP INDEX IF EXISTS idx_generated_images_expires_at;
DROP INDEX IF EXISTS idx_generated_images_is_expired;


