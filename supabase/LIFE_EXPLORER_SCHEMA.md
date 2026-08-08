# Life Explorer Schema

**Migration:** `supabase/migrations/20260806190000_life_explorer.sql`  
**Canonical shapes:** `docs/features/life-explorer/DATA_MODEL.md`

## Tables

| Table | Purpose |
|-------|---------|
| `le_students` | Child learner profile (parent `created_by`, optional `household_id`) |
| `le_expeditions` | Active learning journey (`life_category` + title); one `active` per student |
| `le_wonder_items` | Know / Wonder / Learned wall items |
| `le_lessons` | Generated lessons (`payload` JSONB = lesson contract) |
| `le_lesson_records` | Check-in + completion per lesson |
| `le_learning_evidence` | Portfolio artifacts |
| `le_skill_progress` | Skill observations (emerging / developing / secure / needs_support) |

## RLS

Owner (`created_by = auth.uid()`) OR active household member via `is_active_household_member(household_id, auth.uid())`. Deletes for core entities also allow household admin.

## Token action types

- `life_explorer_lesson`
- `life_explorer_checkin`
