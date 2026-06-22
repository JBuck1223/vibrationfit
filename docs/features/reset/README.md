# Reset ("Phoenix")

**Last Updated:** June 21, 2026
**Status:** Active (In Progress)

A free, repeatable program for active members to "hit the reset button" on life.
Modeled on the Activation Intensive dashboard, but the member chooses what to
recommit to and completion is computed by comparing live state against anchors
captured when the Reset starts. When every selected item is recommitted, the
member graduates to a fresh start - phoenix style.

## Concept

A Reset is a recommitment cycle across six pillars:

| Pillar | Recommitment | Detection source |
|--------|--------------|------------------|
| Profile | Commit a new profile version | `user_profiles` (active id / committed count) |
| Life Vision | Commit a new vision version | `vision_versions` (active id / count, `refined_categories`) |
| Vision Board | Add/refresh board items | `vision_board_items` (created/updated after start) |
| Audio | Generate new audio | `audio_tracks` (completed after start) |
| Projects | Build a project with tasks | `projects` (created after start, `created_by`) |
| MAP | Commit a new habit | `commitments` (created after start) |

Each pillar attributes its activity to **life categories**, so a member can pick
**focus areas** (e.g. Money + Health) and see exactly what they've recommitted to
in each one.

## Architecture

```
Start (/reset or /reset/update)
  └─ POST /api/reset            → create `resets` row + `reset_items`, capture anchors
View (/reset)
  └─ POST /api/reset/[id]/verify → re-run detection, self-heal item status
  └─ GET  /api/reset             → active reset + live detection + progress
Complete
  └─ POST /api/reset/[id]/complete → guard all selected complete → status='completed'
```

### Anchor-based detection

When an item is selected, an **anchor** snapshot is captured
(`captureAnchor` in `src/lib/reset/detection.ts`):

- `profile` / `life_vision`: `{ activeId, count }` - completion = active id changed
  OR committed-row count increased. Changed categories are diffed against the
  anchor version's per-category fields (`state_<key>` / `<key>`), or
  `refined_categories` for visions.
- `vision_board` / `audio` / `project` / `map`: `{ startedAt }` - completion =
  a qualifying row created/updated after `started_at`. Categories come from the
  row's `categories[]` / `section_key` / `life_categories[]` / `category`.

This avoids false positives from in-place edits made before the Reset started.

## Data model

- `resets`: `id, user_id, household_id, title, focus_categories text[], status
  (pending|in_progress|completed), started_at, completed_at, …`
- `reset_items`: `id, reset_id, user_id, item_type
  (profile|life_vision|vision_board|audio|project|map), label, is_selected,
  status (pending|completed), completed_at, anchor jsonb, reference_id,
  detected_categories text[], sort_order, …`

RLS: owner-only (`user_id = auth.uid()`) with admin read access.

## Key files

- `src/lib/reset/reset-config.ts` - suggested item registry (label, href, icon, default).
- `src/lib/reset/detection.ts` - anchor capture + per-pillar, category-aware checkers.
- `src/lib/reset/service.ts` - shared API helpers (load, detect, persist, progress).
- `src/lib/profile/profile-category-map.ts` - profile section/field → life category.
- `src/app/api/reset/**` - REST endpoints.
- `src/components/reset-studio/**` - studio provider, area bar, Phoenix modal.
- `src/app/reset/**` - View + Update pages (layout mounts the studio).

## Notes

- Reset is repeatable and free; each cycle is independent with its own anchors.
- Selection IS the contract: every item the member selects must be recommitted to
  reach Phoenix. The core four (profile, life vision, vision board, audio) are
  selected by default; Projects + MAP are optional add-ons.
- No Stripe/billing wiring (unlike the Activation Intensive).
