---
name: MAP v2 Living Vision
overview: "Evolve the existing `/map` feature from \"weekly reminders\" into MAP — My Actualization Plan: a portfolio of vision-tied commitments (recurring + project) with Yes/No verifications, optional journal-style evidence, per-commitment streaks, and a layered timeline so daily commitments (protein, movement, content) stay visible during projects (Costa Rica trip). Reuses Journal media infra, area_activations streak system, and existing MAP SMS reminders. Retires the broken Actualization Blueprints feature."
todos:
  - id: decide-1
    content: "Confirm or override: journal evidence model (default recommendation: optional, auto-creates a linked journal_entries row when user adds evidence)"
    status: pending
  - id: decide-2
    content: "Confirm or override: MVP includes both recurring + project commitment types, or wedge to recurring(daily) only"
    status: pending
  - id: registry-archive-bp
    content: Mark Actualization Blueprints as ARCHIVED in FEATURE_REGISTRY.md and move src/app/actualization-blueprints/page.tsx to _archive/
    status: pending
  - id: schema-1
    content: "Write migration: commitments table + commitment_occurrences table + commitment_occurrence_id FK on journal_entries + RLS + indexes"
    status: pending
  - id: types-1
    content: Create src/lib/map/types.ts with Commitment, CommitmentOccurrence, Cadence types tied to LifeCategoryKey
    status: pending
  - id: cadence-1
    content: "Build src/lib/map/cadence.ts: pure functions for computing next N occurrence dates from a cadence + start_date"
    status: pending
  - id: generator-1
    content: "Build src/lib/map/occurrence-generator.ts: materialize 14-day rolling window for all active commitments; idempotent on (commitment_id, occurred_on) unique constraint"
    status: pending
  - id: api-commitments
    content: Build /api/map/commitments CRUD with vision_version_id linkage and category validation
    status: pending
  - id: api-occurrences
    content: "Build /api/map/occurrences endpoints: list-for-day, verify (yes/no/skip), attach-evidence (creates journal_entries row, sets bidirectional FKs, writes area_activations on yes)"
    status: pending
  - id: api-cron
    content: Build /api/map/generate-occurrences endpoint (cron-callable) and wire to existing scheduler if present, or document manual trigger
    status: pending
  - id: migrate-data
    content: "Write data migration: convert active user_map_items rows into commitments(type=recurring, cadence=weekly:days), preserving SMS reminder linkages via scheduled_messages"
    status: pending
  - id: ui-today
    content: "Rewrite /map page as Today view: list of today's pending occurrences grouped by category, big Yes/No/Skip targets, evidence sheet drawer"
    status: pending
  - id: ui-week
    content: "Build /map/week: 7-column grid x N commitment rows with project blocks spanning days; glanceable portfolio health"
    status: pending
  - id: ui-portfolio
    content: "Build /map/portfolio: commitments grouped by category, each showing streak + last 14 days dot-strip, add/pause/edit"
    status: pending
  - id: ui-detail
    content: "Build /map/c/[id] detail and /map/c/[id]/edit: full history, evidence threads, cadence editing, project sub-task management"
    status: pending
  - id: ui-new
    content: "Replace /map/new builder: type picker (recurring/project) → category picker → cadence/dates → review; for projects, sub-task composer"
    status: pending
  - id: viva-reflection
    content: Build src/lib/viva/prompts/map-weekly-reflection-prompt.ts and a /api/viva/map-weekly-summary endpoint with token tracking
    status: pending
  - id: viva-ui
    content: Add weekly reflection card to /map (gated by weekly cadence + token cost)
    status: pending
  - id: registry-update
    content: "Update FEATURE_REGISTRY.md: bump MAP entry to v2.0.0 with new schema/routes/scope; cross-reference Living The Vision branding"
    status: pending
  - id: docs-1
    content: Create docs/features/map/README.md with model, schema, cadence semantics, evidence flow, and migration notes
    status: pending
  - id: qa-loop
    content: "End-to-end test: create one recurring commitment + one project, verify occurrences materialize correctly, mark several yes/no, attach evidence, confirm journal entry appears in /journal, confirm streak fires in area-stats"
    status: pending
isProject: false
---

# MAP v2 — Living The Vision

## Why this plan

You have most of the pieces already; they just don't talk. `/map` schedules but doesn't verify. `/journal` verifies (logs what happened) but isn't tied to a plan. `/abundance-tracker` and `/daily-paper` log to streaks but each in their own silo. The Actualization Blueprints feature was structurally wrong (project-shaped only) and is currently broken (see [docs/misc/ACTUALIZATION_BLUEPRINTS_BROKEN.md](docs/misc/ACTUALIZATION_BLUEPRINTS_BROKEN.md)).

Your Costa Rica example unlocked the real model: **a portfolio of concurrent commitments**, where recurring threads (190g protein, daily movement, social content) layer on top of project containers (Costa Rica trip with sub-tasks). No thread pauses for another. Every Yes is a vibrational affirmation that the user is *doing* the vision, not just planning it.

## Core model — two primitives, one feature

```mermaid
flowchart TD
    Vision[vision_versions / life_vision_category_state]
    
    subgraph commitments [commitments table]
        Recurring["type = recurring<br/>cadence: daily, weekly, days_per_week<br/>e.g., 190g protein daily"]
        Project["type = project<br/>start_date, end_date<br/>e.g., Costa Rica 14 days<br/>has parent_commitment_id children"]
    end
    
    subgraph occurrences [commitment_occurrences table]
        Occ["one row per scheduled instance<br/>occurred_on date<br/>status: pending, yes, no, skipped<br/>note + optional journal_entry_id"]
    end
    
    Vision --> commitments
    commitments --> occurrences
    occurrences -.->|"if user adds evidence"| journal[journal_entries]
    occurrences -->|"yes ticks"| area[area_activations<br/>existing streak system]
```



- **Commitment** = the thing you've committed to. Two shapes:
  - `type='recurring'` with a `cadence` JSONB (`{kind:'daily'}` | `{kind:'weekly', days:['mon','wed']}` | `{kind:'days_per_week', count:5}`).
  - `type='project'` with explicit `start_date`/`end_date`. Projects can have child commitments via `parent_commitment_id` (e.g., Costa Rica trip → "book flights", "find lodging", "homeschool plan").
- **Occurrence** = each scheduled instance to verify. Auto-generated from cadence (recurring) or from sub-task due dates (projects). The verification surface.
- **Layering is automatic** because recurring commitments generate daily occurrences regardless of whether a project is also active that day. Costa Rica's daily occurrences for protein/movement/content just appear alongside the trip's sub-task occurrences.

## Schema additions (new migration)

New file: `supabase/migrations/YYYYMMDDHHMMSS_living_the_vision.sql` (no edits to existing tables; only adds + one optional FK column on `journal_entries`).

```sql
CREATE TABLE commitments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vision_version_id uuid REFERENCES vision_versions(id) ON DELETE SET NULL,
  category text NOT NULL,                 -- LifeCategoryKey
  parent_commitment_id uuid REFERENCES commitments(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('recurring','project')),
  title text NOT NULL,
  description text,
  cadence jsonb,                           -- recurring only
  start_date date,                         -- both (recurring optional)
  end_date date,                           -- project required, recurring optional
  status text NOT NULL DEFAULT 'active'    -- active|paused|completed|archived
    CHECK (status IN ('active','paused','completed','archived')),
  imported_from_map_item_id uuid,          -- migration trace
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE commitment_occurrences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commitment_id uuid NOT NULL REFERENCES commitments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,                   -- denormalized for fast RLS + queries
  occurred_on date NOT NULL,
  status text NOT NULL DEFAULT 'pending'   -- pending|yes|no|skipped
    CHECK (status IN ('pending','yes','no','skipped')),
  verified_at timestamptz,
  note text,
  journal_entry_id uuid REFERENCES journal_entries(id) ON DELETE SET NULL,
  alignment text CHECK (alignment IN ('above','below','neutral')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (commitment_id, occurred_on)
);

ALTER TABLE journal_entries
  ADD COLUMN commitment_occurrence_id uuid 
  REFERENCES commitment_occurrences(id) ON DELETE SET NULL;

CREATE INDEX idx_commitments_user_status ON commitments(user_id, status);
CREATE INDEX idx_commitments_parent ON commitments(parent_commitment_id);
CREATE INDEX idx_occurrences_user_date ON commitment_occurrences(user_id, occurred_on);
CREATE INDEX idx_occurrences_commitment ON commitment_occurrences(commitment_id, occurred_on);
```

Plus standard RLS (user owns rows via `user_id`).

## Decisions baked in (with rationale)

These are the forks I made so the plan can land. Push back on any of them.

- **Journal evidence is optional, but the lightweight default**. Tapping Yes is one tap. If the user opts to add a note/photo/audio/video, we **create a real `journal_entries` row** and bidirectionally link via `commitment_occurrence_id` (FK on `journal_entries`) and `journal_entry_id` (FK on the occurrence). Evidence is then visible in `/journal` AND tied to the commitment. Zero new media plumbing — reuse [src/components/RecordingTextarea.tsx](src/components/RecordingTextarea.tsx), `FileUpload`, S3 `journal/uploads`, `audio_recordings` JSONB.
- `**/map` URL stays.** Same acronym, same muscle memory. Internal naming evolves: "My Activation Plan" → "My Actualization Plan." User-visible nav copy can stay "MAP" or become "Living The Vision" — that's a brand call, not a code call.
- **MVP cadence support: `daily` and `days_per_week` only.** Covers all four of your real commitments (protein/move/content/trip). Add `weekly:days` and custom-interval in v1.1 once you've used it.
- **Occurrences are generated lazily in a 14-day rolling window.** A daily cron (or RPC on first daily login) materializes upcoming occurrences for active commitments, capped 14 days out. Past pending occurrences auto-mark `no` after a 48h grace window (configurable per commitment). This avoids generating millions of empty future rows.
- **Streaks reuse `area_activations**` (created in [supabase/migrations/20260324120000_create_area_activations.sql](supabase/migrations/20260324120000_create_area_activations.sql)). When an occurrence flips to `yes`, we write to `area_activations` with `area = 'map'` (and optionally a per-commitment area). All your existing badge/streak UI already reads from this — no new streak engine needed.
- **VIVA's role in v1 is reflective only.** No AI-generated commitments. Weekly portfolio digest: "You moved 5/7 days, hit protein 6/7, posted content 3/7. Costa Rica is on track. Want to talk about content?" Trade tokens for the weekly summary; rate-limit to one paid summary per week.
- **Blueprints retires.** The page at [src/app/actualization-blueprints/page.tsx](src/app/actualization-blueprints/page.tsx) currently 404s on its API call. Move to `_archive/`, mark the registry entry `ARCHIVED` with note "Replaced by MAP v2."

## UI surfaces (3 views, then a 4th if/when stable)

```mermaid
flowchart LR
    Today["Today /map<br/>Vertical list of pending occurrences<br/>Big Yes/No/Skip targets<br/>Optional 'add evidence' sheet"]
    Week["Week /map/week<br/>7 columns x N commitment rows<br/>Project blocks span days<br/>Glanceable portfolio health"]
    Portfolio["Portfolio /map/portfolio<br/>Grouped by category<br/>Each commitment: streak + last 14 days<br/>Add or pause commitments here"]
    Detail["Commitment detail /map/c/[id]<br/>Full history, edit cadence,<br/>view all evidence threads"]

    Today --> Detail
    Week --> Detail
    Portfolio --> Detail
```



The Today view is the daily-driver. Week view is the magic — it's where Costa Rica appears as a 14-day block AND the protein/movement/content rows tick across it. Portfolio is the Sunday-planning surface for adding/editing commitments.

For component fidelity, all three reuse [src/lib/design-system/components.tsx](src/lib/design-system/components.tsx) (Card, Button, ProgressBar, Badge). No new design primitives.

## Migration from existing MAP

Migrate, don't drop, existing `user_maps` + `user_map_items`:

- Each active `user_map_items` row → one `commitments` row with `type='recurring'`, `cadence='{kind:"weekly", days:[...]}'`, `imported_from_map_item_id` set for trace.
- Existing `scheduled_messages` for SMS reminders **keep working unchanged**. We add new reminder rows when commitments fire, using the same plumbing.
- Old `/map` page renders the new Today view; old behaviors (SMS opt-in, weekly schedule) remain accessible via the Portfolio view's commitment editor.
- Zero downtime migration: data flows in, UI swaps, SMS keeps firing.

## What's explicitly OUT of v1 (so we don't drift back into Blueprints)

- AI-generated commitment plans. (User picks what feels aligned. VIVA only reflects.)
- Phases, dependencies, success criteria, priority levels (these killed Blueprints v1).
- Task assignment to others / household sharing of commitments.
- Public sharing or social streaks.
- Calendar import/export.
- Native push notifications (SMS only via existing `scheduled_messages`).
- Custom evidence requirements per commitment ("must include photo").
- `weekly:days` and custom-interval cadences.
- Cross-commitment correlation insights ("you posted more on days you moved").

These are all v1.1+ once the core loop is sticky.

## File map (where new code lives)

- [src/app/map/page.tsx](src/app/map/page.tsx) — rewrite to Today view (was the existing MAP hub)
- `src/app/map/week/page.tsx` — new
- `src/app/map/portfolio/page.tsx` — new
- `src/app/map/c/[id]/page.tsx` — new
- `src/app/map/c/[id]/edit/page.tsx` — new
- `src/app/map/new/page.tsx` — replace existing builder; add type=recurring|project flow
- `src/app/api/map/commitments/route.ts` — new (CRUD)
- `src/app/api/map/occurrences/route.ts` — new (verify, link evidence)
- `src/app/api/map/generate-occurrences/route.ts` — new (cron-callable)
- `src/lib/map/types.ts` — `Commitment`, `CommitmentOccurrence`, `Cadence` types
- `src/lib/map/cadence.ts` — pure cadence math (next N occurrences from a date)
- `src/lib/map/occurrence-generator.ts` — materializes window
- `src/lib/viva/prompts/map-weekly-reflection-prompt.ts` — new VIVA prompt
- [FEATURE_REGISTRY.md](FEATURE_REGISTRY.md) — bump MAP entry, ARCHIVE Blueprints
- `docs/features/map/README.md` — new feature doc

## Two open decisions before code

I made calls on these but want explicit confirmation because they're load-bearing:

1. **Confirm: optional journal evidence with auto-create on add** (recommendation above) — vs. inline-only evidence on the occurrence row, vs. always-prompt-for-journal-entry.
2. **Confirm: ship MAP v2 with both `recurring(daily, days_per_week)` and `project` types in v1**, OR ship only `recurring(daily)` first as a tighter wedge and add `project` (Costa Rica) in v1.1.

Once confirmed, the todo list below executes in order.