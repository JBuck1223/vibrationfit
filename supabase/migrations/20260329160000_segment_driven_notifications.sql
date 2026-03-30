-- Segment-driven notifications: notification_configs reference blast_segments
-- for dynamic audience resolution at send time.

-- 1. Add segment_id to notification_configs
ALTER TABLE notification_configs
  ADD COLUMN IF NOT EXISTS segment_id uuid REFERENCES blast_segments(id) ON DELETE SET NULL;

-- 2. Add notification job columns to scheduled_messages
--    These allow a single row to represent a "fire this notification at this time"
--    job instead of pre-queuing per-recipient rows.
ALTER TABLE scheduled_messages
  ADD COLUMN IF NOT EXISTS notification_config_slug text,
  ADD COLUMN IF NOT EXISTS notification_variables jsonb;

-- 3. Seed a default "Alignment Gym Audience" segment
--    Filters: members only, email opt-in = yes
INSERT INTO blast_segments (id, name, description, filters, created_at)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Alignment Gym Audience',
  'All members with email opt-in enabled. Used by Alignment Gym notifications.',
  '{"audience": "members", "email_opt_in": "yes"}'::jsonb,
  now()
)
ON CONFLICT (id) DO NOTHING;

-- 4. Link all alignment gym notification configs to this segment
UPDATE notification_configs
  SET segment_id = 'a0000000-0000-0000-0000-000000000001'
  WHERE slug IN (
    'alignment_gym_created',
    'alignment_gym_going_live',
    'alignment_gym_reminder_1hr',
    'alignment_gym_reminder_15min'
  );
