-- Drop legacy/unused tables
-- Generated: November 16, 2025
-- 
-- SAFE TO DROP (Not referenced in code):
-- - ai_usage_logs (analytics only)
-- - blueprint_insights (legacy blueprint system)
-- - blueprint_phases (legacy blueprint system)
-- - blueprint_tasks (legacy blueprint system)
-- - prompt_suggestions_cache (cache table)
-- - refinements_backup_20251111 (backup from Nov 11)
-- - user_stats (analytics only)
-- - vision_audios (replaced by audio_tracks)
-- - vision_conversations (replaced by viva_conversations)
-- - vision_versions_backup_20251111 (backup from Nov 11)
--
-- INTENTIONALLY DROPPING (User wants to rebuild):
-- - actualization_blueprints (2 references in code - will break /actualization-blueprints route)

BEGIN;

-- Drop backup tables (completely safe)
DROP TABLE IF EXISTS refinements_backup_20251111 CASCADE;
DROP TABLE IF EXISTS vision_versions_backup_20251111 CASCADE;

-- Drop legacy blueprint system tables
DROP TABLE IF EXISTS blueprint_tasks CASCADE;
DROP TABLE IF EXISTS blueprint_phases CASCADE;
DROP TABLE IF EXISTS blueprint_insights CASCADE;

-- Drop legacy/replaced tables
DROP TABLE IF EXISTS vision_audios CASCADE;
DROP TABLE IF EXISTS vision_conversations CASCADE;

-- Drop analytics/cache tables
DROP TABLE IF EXISTS ai_usage_logs CASCADE;
DROP TABLE IF EXISTS user_stats CASCADE;
DROP TABLE IF EXISTS prompt_suggestions_cache CASCADE;

-- Drop actualization_blueprints (user wants to rebuild)
-- WARNING: This will break /actualization-blueprints/[id]/page.tsx
-- User is aware and wants to start over
DROP TABLE IF EXISTS actualization_blueprints CASCADE;

COMMIT;

