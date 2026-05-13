---
name: MAP v2 Living Vision
overview: "MAP v2 as a full Studio area (like Journal, Audio, Life Vision) with two-tier UX: simple inline-toggle activity picker in Intensive Step 13 with consolidated weekly SMS (Tier 1), then full Living The Vision portfolio for graduated members with Today/Week/Portfolio views, daily verification, projects, and VIVA reflection (Tier 2). Same commitments + commitment_occurrences schema powers both tiers. Retires the broken Actualization Blueprints feature."
todos:
  # Phase 1: Schema + Studio Shell + Shared Model
  - id: schema-1
    content: "Write migration: vision_targets + commitments + commitment_occurrences tables + RLS + indexes"
    status: pending
  - id: types-1
    content: Create/update src/lib/map/types.ts with VisionTarget, Commitment, CommitmentOccurrence, Cadence types tied to LifeCategoryKey
    status: pending
  - id: cadence-1
    content: "Build src/lib/map/cadence.ts: pure functions for computing next N occurrence dates from a cadence + start_date"
    status: pending
  - id: studio-context
    content: "Build src/components/map-studio/MapStudioContext.tsx: commitments, today occurrences, streak summary, refresh functions"
    status: pending
  - id: studio-areabar
    content: "Build src/components/map-studio/MapAreaBar.tsx: Today/Week/Portfolio tabs + commitment detail version selector"
    status: pending
  - id: studio-layout
    content: "Create src/app/map/layout.tsx following STUDIO_PAGE_BUILDING_RULES (MapStudioProvider + MapAreaBar + main)"
    status: pending
  - id: register-studio
    content: "Add '/map' to STUDIO_ROUTE_PREFIXES in src/lib/navigation/page-classifications.ts"
    status: pending
  - id: api-targets
    content: Build /api/map/targets CRUD (create, list, achieve with evidence, archive)
    status: pending
  - id: api-commitments
    content: Build /api/map/commitments CRUD with vision_target_id linkage and category validation
    status: pending
  # Phase 2: Tier 1 (Intensive)
  - id: suggestion-engine
    content: "Build src/lib/map/suggestion-engine.ts: rule-based mapping from assessment Green Line status to VibrationFit activity commitments per category"
    status: pending
  - id: step13-auto-map
    content: "Evolve /intensive/map Step 13: auto-create 'Above the Green Line' vision target, show Green Line diagnosis, present rule-based commitment suggestions, user reviews/accepts, create commitment rows on completion"
    status: pending
  - id: weekly-digest-sms
    content: "Build consolidated weekly SMS digest (map_weekly_digest type) + /api/map/weekly-digest cron endpoint"
    status: pending
  - id: viva-wobble-detection
    content: "Build VIVA wobble detection: reads assessment + profile + vision, identifies what's in the way of above-the-line, suggests extra reps on wobble categories"
    status: pending
  # Phase 3: Tier 2 (Graduated Member)
  - id: generator-1
    content: "Build src/lib/map/occurrence-generator.ts + /api/map/generate-occurrences cron: materialize 14-day rolling window; idempotent on (commitment_id, occurred_on)"
    status: pending
  - id: api-occurrences
    content: "Build /api/map/occurrences endpoints: list-for-day, verify (yes/no/skip), attach-evidence (creates journal_entries row, sets bidirectional FKs, writes area_activations on yes)"
    status: pending
  - id: ui-today
    content: "Rewrite /map page as Today view: list of today's pending occurrences grouped by category, big Yes/No/Skip targets, evidence sheet drawer"
    status: pending
  - id: ui-portfolio
    content: "Build /map/portfolio: vision targets grouped by category, each with child commitments showing streak + dot-strip, add/pause/edit targets and commitments"
    status: pending
  - id: ui-week
    content: "Build /map/week: 7-column grid x N commitment rows with project blocks spanning days; glanceable portfolio health"
    status: pending
  - id: ui-target-detail
    content: "Build /map/t/[id] target detail: all linked commitments + their histories, achievement flow (mark achieved + add evidence)"
    status: pending
  - id: ui-detail
    content: "Build /map/c/[id] commitment detail and /map/c/[id]/edit: full history, cadence editing, project sub-task management"
    status: pending
  - id: ui-new
    content: "Replace /map/new builder: type picker (recurring/project) -> category picker -> cadence/dates -> review; for projects, sub-task composer"
    status: pending
  - id: migrate-data
    content: "Write data migration: convert active user_map_items rows into commitments(type=recurring, cadence=weekly:days), preserving SMS reminder linkages via scheduled_messages"
    status: pending
  # Phase 4: Polish
  - id: viva-reflection
    content: Build src/lib/viva/prompts/map-weekly-reflection-prompt.ts and a /api/viva/map-weekly-summary endpoint with token tracking
    status: pending
  - id: viva-ui
    content: Add weekly reflection card to /map (gated by weekly cadence + token cost)
    status: pending
  - id: registry-archive-bp
    content: Mark Actualization Blueprints as ARCHIVED in FEATURE_REGISTRY.md and move src/app/actualization-blueprints/page.tsx to _archive/
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

## Two-tier UX: Intensive vs Graduated

A brand-new intensive user and a seasoned member need fundamentally different MAP experiences, but they share the same underlying data model so the transition is seamless.

```mermaid
flowchart TD
    subgraph tier1 [Tier 1: Intensive User]
        Step13["Step 13: Watch video + pick activities via inline toggles"]
        SimpleView["Simple card view: 4 weekly intentions + deep links"]
        WeeklySMS["1 consolidated weekly SMS with all commitments"]
    end

    subgraph graduation [Graduation: Step 14 Unlock]
        Transition["intensive_checklist.status = completed"]
    end

    subgraph tier2 [Tier 2: Graduated Member -- MAP Studio]
        TodayView["/map Today: daily Yes/No/Skip"]
        WeekView["/map/week: 7-column grid"]
        Portfolio["/map/portfolio: manage commitments"]
        Projects["Project commitments"]
        VIVA["VIVA weekly reflection"]
    end

    Step13 --> SimpleView
    SimpleView --> WeeklySMS
    SimpleView --> graduation
    graduation --> TodayView
    TodayView --> WeekView
    TodayView --> Portfolio
    Portfolio --> Projects
    TodayView --> VIVA
```

**Tier 1 (Intensive):** Step 13 evolves from education-only to an intelligent, auto-suggested first MAP. By Step 13, the system already has everything: assessment scores (Green Line status per category), profile (current state), life vision (desired state), audio, vision board, journal. Instead of asking the user to pick activities manually, the system does the work:

1. **One universal first target (auto-created):** "Above the Green Line -- achieve an above-the-line emotional state in harmony with your new Life Vision."
2. **Personalized diagnosis:** Show which life categories are below / transition / above the Green Line, pulled from assessment results.
3. **Rule-based auto-suggestions:** Deterministic mapping from Green Line gaps to VibrationFit tool commitments. Below-the-line categories get targeted reps. The suggestions are all actions the user just built during Steps 1-12:
   - **Activate:** Morning Vision + Daily Paper (read Life Vision, scan Vision Board)
   - **Activate:** Night Sleep Immersion (play immersion track)
   - **Connect:** Vibe Tribe engagement (community support)
   - **Attend:** Alignment Gym session (live or replay)
   - **Create:** Journal entries (evidence of alignment)
4. **User reviews and accepts** (can adjust), then these become their first commitments with a consolidated weekly SMS.
5. **VIVA wobble detection (enhancement):** VIVA reads assessment + profile + vision and identifies potential wobbles -- what's in the way of getting above the line. When the user has spare time, VIVA suggests extra reps on those wobble categories.

The key insight: every suggested commitment is something the user just *built* during the intensive. MAP doesn't ask them to do new things -- it tells them how to *use their tools* to get above the Green Line. Advanced external commitments (protein tracking, Costa Rica trip) come later in the full MAP Studio after graduation.

**Tier 2 (Graduated Member):** After Step 14 unlock, the user gets the full MAP Studio with Today/Week/Portfolio views, daily verification, projects, VIVA reflection. Their Tier 1 commitments carry forward as seed data. Graduation is the transition -- no milestone gates, no feature unlocks.

## MAP Studio Architecture

MAP currently has no layout, no shared context, no area bar -- just loose pages. Every other major area (Journal, Audio, Life Vision, Vision Board, Profile, Story) follows the Studio pattern. MAP v2 adopts the same:

**New files (studio infrastructure):**
- `src/components/map-studio/MapStudioContext.tsx` -- holds commitments, today's occurrences, streak summary; shared by all `/map/*` pages
- `src/components/map-studio/MapAreaBar.tsx` -- tabs: Today | Week | Portfolio; commitment version selector on detail pages
- `src/components/map-studio/index.ts` -- barrel export
- `src/app/map/layout.tsx` -- studio layout per [rules/STUDIO_PAGE_BUILDING_RULES.md](rules/STUDIO_PAGE_BUILDING_RULES.md)

**Layout follows the standard template:**
```tsx
<MapStudioProvider>
  <MapAreaBar />
  <main className="flex-1 pt-6 pb-3 md:pt-8 md:pb-3 lg:pt-6 px-4 md:px-0"
        style={{ '--content-px': '1rem' } as React.CSSProperties}>
    {children}
  </main>
</MapStudioProvider>
```

**Registration:** Add `'/map'` to `STUDIO_ROUTE_PREFIXES` in [src/lib/navigation/page-classifications.ts](src/lib/navigation/page-classifications.ts).

## Core model — three layers

```mermaid
flowchart TD
    LV["Life Vision (12 categories)"]
    
    subgraph targets [vision_targets table]
        VT["Concrete achievable goal<br/>e.g., Body: 190 -> 178 lbs<br/>status: active / achieved / archived"]
    end
    
    subgraph commitments [commitments table]
        Recurring["type = recurring<br/>cadence: daily, weekly, days_per_week<br/>e.g., 190g protein daily"]
        Project["type = project<br/>start_date, end_date<br/>e.g., Costa Rica trip<br/>has parent_commitment_id children"]
    end
    
    subgraph occurrences [commitment_occurrences table]
        Occ["one row per scheduled instance<br/>occurred_on date<br/>status: pending, yes, no, skipped"]
    end
    
    subgraph achievement [Achievement]
        Done["Mark target achieved<br/>add evidence note/journal entry<br/>all commitment history rolls up"]
    end
    
    LV --> targets
    targets --> commitments
    commitments --> occurrences
    occurrences -->|"yes ticks"| area[area_activations<br/>existing streak system]
    targets --> achievement
```

- **Vision Target** = a concrete, achievable goal extracted from a life vision category. "Go from 190 to 178 lbs" (Body). "Launch side business" (Wealth). "Costa Rica family trip" (Family). Open-ended by default -- no deadline required. Multiple commitments feed one target.
- **Commitment** = a bite-size action that feeds a target. Two shapes:
  - `type='recurring'` with a `cadence` JSONB (`{kind:'daily'}` | `{kind:'weekly', days:['mon','wed']}` | `{kind:'days_per_week', count:5}`).
  - `type='project'` with explicit `start_date`/`end_date`. Projects can have child commitments via `parent_commitment_id` (e.g., Costa Rica trip -> "book flights", "find lodging", "homeschool plan").
- **Occurrence** = each scheduled instance to verify. Auto-generated from cadence (recurring) or from sub-task due dates (projects). The verification surface. Yes/No/Skip -- pure tracking, no journal entry created.
- **Achievement** = when a vision target is done, mark it achieved + add evidence (note, optional journal entry link). All the commitment history rolls up: "200 protein days got you here."
- **Layering is automatic** because recurring commitments generate daily occurrences regardless of whether a project is also active that day. Costa Rica's daily occurrences for protein/movement/content just appear alongside the trip's sub-task occurrences.

## Schema additions (new migration)

New file: `supabase/migrations/YYYYMMDDHHMMSS_living_the_vision.sql`.

```sql
-- Vision Targets: concrete goals extracted from life vision categories
CREATE TABLE vision_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vision_version_id uuid REFERENCES vision_versions(id) ON DELETE SET NULL,
  category text NOT NULL,                  -- LifeCategoryKey
  title text NOT NULL,                     -- "Go from 190 to 178 lbs"
  description text,
  status text NOT NULL DEFAULT 'active'    -- active|achieved|archived
    CHECK (status IN ('active','achieved','archived')),
  achieved_at timestamptz,
  achievement_note text,                   -- freeform evidence when achieved
  achievement_journal_entry_id uuid REFERENCES journal_entries(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Commitments: bite-size actions that feed a vision target
CREATE TABLE commitments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vision_target_id uuid REFERENCES vision_targets(id) ON DELETE SET NULL,
  category text NOT NULL,                  -- LifeCategoryKey (denormalized from target for queries)
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

-- Occurrences: one row per scheduled instance, pure Yes/No/Skip tracking
CREATE TABLE commitment_occurrences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commitment_id uuid NOT NULL REFERENCES commitments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,                   -- denormalized for fast RLS + queries
  occurred_on date NOT NULL,
  status text NOT NULL DEFAULT 'pending'   -- pending|yes|no|skipped
    CHECK (status IN ('pending','yes','no','skipped')),
  verified_at timestamptz,
  note text,                               -- optional quick note
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (commitment_id, occurred_on)
);

CREATE INDEX idx_targets_user_status ON vision_targets(user_id, status);
CREATE INDEX idx_targets_category ON vision_targets(user_id, category);
CREATE INDEX idx_commitments_user_status ON commitments(user_id, status);
CREATE INDEX idx_commitments_target ON commitments(vision_target_id);
CREATE INDEX idx_commitments_parent ON commitments(parent_commitment_id);
CREATE INDEX idx_occurrences_user_date ON commitment_occurrences(user_id, occurred_on);
CREATE INDEX idx_occurrences_commitment ON commitment_occurrences(commitment_id, occurred_on);
```

Plus standard RLS (user owns rows via `user_id`).

**Key changes from earlier draft:**
- Added `vision_targets` table as the top-level goal container
- `commitments.vision_version_id` replaced with `commitments.vision_target_id` (targets hold the vision link)
- Removed `journal_entry_id` and `alignment` from occurrences -- occurrences are pure tracking (Yes/No/Skip + optional note)
- Evidence lives at the target achievement level, not per-occurrence

## Decisions (settled)

- **Evidence lives at the target level, not per-occurrence.** Occurrences are pure Yes/No/Skip tracking (with an optional quick note). When a vision target is achieved, the user adds evidence (achievement note + optional linked journal entry). This keeps daily tracking lightweight (hundreds of taps, no friction) while giving the achievement moment its weight.
- **Both recurring + project commitment types ship in v1.** Covers the full vision: recurring actions (protein, movement, content) + projects with sub-tasks (Costa Rica trip).
- **Vision targets are core to v1.** Commitments feed vision targets. The target is the "why" behind the bite-size steps. Targets can be marked achieved with evidence.
- **`/map` URL stays.** Same acronym, same muscle memory. Internal naming evolves: "My Activation Plan" -> "My Actualization Plan." User-visible nav copy can stay "MAP" or become "Living The Vision" -- brand call, not code call.
- **MVP cadence support: `daily` and `days_per_week` only.** Covers all real commitments. Add `weekly:days` and custom-interval in v1.1.
- **Occurrences are generated lazily in a 14-day rolling window.** A daily cron materializes upcoming occurrences for active commitments, capped 14 days out. Past pending occurrences auto-mark `no` after a 48h grace window. Avoids generating millions of empty future rows.
- **Streaks reuse `area_activations`** (created in [supabase/migrations/20260324120000_create_area_activations.sql](supabase/migrations/20260324120000_create_area_activations.sql)). When an occurrence flips to `yes`, we write to `area_activations`. Existing badge/streak UI already reads from this.
- **VIVA's role in v1 is reflective only.** No AI-generated commitments. Weekly portfolio digest. Token-gated.
- **Blueprints retires.** The page at [src/app/actualization-blueprints/page.tsx](src/app/actualization-blueprints/page.tsx) currently 404s. Move to `_archive/`, mark `ARCHIVED`.

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

**Studio infrastructure (new):**
- `src/components/map-studio/MapStudioContext.tsx`
- `src/components/map-studio/MapAreaBar.tsx`
- `src/components/map-studio/index.ts`
- `src/app/map/layout.tsx`

**Shared model (new/update):**
- `src/lib/map/types.ts` -- update with `VisionTarget`, `Commitment`, `CommitmentOccurrence`, `Cadence` types
- `src/lib/map/cadence.ts` -- pure cadence math (next N occurrences from a date)
- `src/lib/map/occurrence-generator.ts` -- materializes 14-day rolling window
- `src/lib/map/suggestion-engine.ts` -- rule-based mapping: assessment Green Line status -> VibrationFit activity commitments

**API routes (new):**
- `src/app/api/map/commitments/route.ts` -- CRUD
- `src/app/api/map/occurrences/route.ts` -- verify, link evidence
- `src/app/api/map/generate-occurrences/route.ts` -- cron-callable occurrence materializer
- `src/app/api/map/weekly-digest/route.ts` -- consolidated weekly SMS cron

**Pages (new or rewrite):**
- [src/app/map/page.tsx](src/app/map/page.tsx) -- rewrite to Today view
- `src/app/map/week/page.tsx` -- new
- `src/app/map/portfolio/page.tsx` -- new
- `src/app/map/c/[id]/page.tsx` -- new
- `src/app/map/c/[id]/edit/page.tsx` -- new
- `src/app/map/new/page.tsx` -- rewrite builder for recurring + project types

**Intensive (modify):**
- [src/app/intensive/map/page.tsx](src/app/intensive/map/page.tsx) -- auto-suggested first MAP: Green Line diagnosis, rule-based commitments, user review/accept

**Config (modify):**
- [src/lib/navigation/page-classifications.ts](src/lib/navigation/page-classifications.ts) -- add `/map` to `STUDIO_ROUTE_PREFIXES`
- `vercel.json` -- add weekly-digest cron
- [FEATURE_REGISTRY.md](FEATURE_REGISTRY.md) -- bump MAP entry, ARCHIVE Blueprints

**Other:**
- `src/lib/viva/prompts/map-weekly-reflection-prompt.ts` -- new VIVA prompt
- `docs/features/map/README.md` -- new feature doc

## Build order (4 phases)

**Phase 1: Schema + Studio Shell + Shared Model**
1. Schema migration (commitments + commitment_occurrences + RLS + indexes)
2. Types + cadence.ts (pure functions)
3. MapStudioContext + MapAreaBar + layout.tsx (empty shell reading from new tables)
4. Register `/map` in `STUDIO_ROUTE_PREFIXES`
5. Commitments CRUD API

**Phase 2: Tier 1 (Intensive) -- can ship independently**
6. Evolve Step 13 with inline toggles + commitment creation
7. Consolidated weekly SMS + cron endpoint

**Phase 3: Tier 2 (Graduated Member)**
8. Occurrence generator + cron
9. Occurrences API (verify, link evidence)
10. Today view (`/map` rewrite)
11. Portfolio view
12. Week view
13. Commitment detail + edit pages
14. New commitment builder (recurring + project)
15. Data migration (existing `user_map_items` -> `commitments`)

**Phase 4: Polish**
16. VIVA weekly reflection prompt + UI card
17. Archive Actualization Blueprints
18. Update FEATURE_REGISTRY.md + docs
19. End-to-end QA

## Decisions settled (from planning conversation)

1. **Evidence model:** Occurrences are pure Yes/No/Skip tracking. Evidence lives at the vision target achievement level (not per-occurrence). SETTLED.
2. **Commitment types:** Both recurring + project ship in v1. SETTLED.
3. **Vision targets:** Core to v1, not deferred. Commitments feed targets. SETTLED.
4. **Two-tier UX:** Intensive users get simple Step 13 picker + weekly SMS. Graduated members get full MAP Studio. Graduation is the transition. SETTLED.
5. **Studio pattern:** MAP becomes a full Studio area (context, area bar, layout). SETTLED.

All decisions are resolved. The todo list executes in phase order.