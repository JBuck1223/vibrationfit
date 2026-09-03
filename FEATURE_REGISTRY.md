# VibrationFit Feature Registry

**Last Updated:** September 2, 2026
**Purpose:** What's locked, what's fragile, and the constraints agents must respect. Feature details live in `docs/features/`; history lives in git.

| Status | Agent action |
|--------|--------------|
| 🔒 LOCKED | Do not modify without explicit user permission |
| ✅ STABLE | Modify with caution; test the whole feature after changes |
| 🚧 IN PROGRESS | Safe to modify |
| ⚠️ NEEDS REVIEW | Verify it works before relying on it |

**Modifying a LOCKED feature:** ask permission first, make changes incrementally, test the ENTIRE feature (not just your change).

---

## Locked

### 🔒 Media Recorder — `src/components/MediaRecorder.tsx`
Audio/video recording used by Journal, VIVA chat, Life Vision audio, and video recordings. Four purposes with different cleanup logic: `quick`, `transcriptOnly`, `withFile`, `audioOnly`. IndexedDB persistence, S3 upload, Whisper transcription, waveform editing.

- Do NOT change recording purposes, IndexedDB schema, blob creation logic, or the transcription flow without testing every consumer
- Blob URLs must be revoked (memory leaks); recordings auto-clear from IndexedDB after 24h

### 🔒 Simple Level Meter — `src/components/SimpleLevelMeter.tsx`
Canvas-based audio level visualization used by MediaRecorder. Do NOT change canvas rendering or audio-context handling; always clean up audio nodes on unmount.

### 🔒 Life Vision Generation System
6-step vision creation across 12 life categories. Schema: `vision_versions`, `life_vision_category_state`, `frequency_flip`. API: `/api/viva/ideal-state`, `/api/viva/flip-frequency`, `/api/viva/merge-clarity`. Doc: `docs/features/life-vision/README.md`.

- Do NOT modify without testing the full 6-step flow end-to-end
- Do NOT change category keys (use `CATEGORY_KEYS` constants)

### 🔒 Design System — `src/lib/design-system/`
See `.cursor/rules/design-system.mdc` for components, colors, and patterns.

- Buttons always `rounded-full`; colors only from `tokens.ts`; no inline styles
- Do NOT modify component APIs without checking all usages
- **PageHero:** slim left-aligned title row (not a boxed gradient hero). Do not restore the old card/gradient-border header. Studio pages use `AreaBar` instead; do not add PageHero inside studio layouts.

### 🔒 Token System (Creation Credits)
Financial system. Schema: `token_transactions`, `token_usage`, `ai_model_pricing`. Doc: `docs/architecture/TOKEN_SYSTEM_SIMPLIFIED.md`.

- Do NOT modify token calculations or pricing without approval; never allow negative balances
- Every AI call must go through `trackTokenUsage()`

### 🔒 Database Schema
Source of truth: `supabase/COMPLETE_SCHEMA_DUMP.sql`. Auto-generated doc: `docs/generated/SCHEMA.md` (`npm run docs:schema`).

- Changes only via timestamped migrations in `supabase/migrations/`
- Do NOT modify RLS policies without a security review

---

## Stable

- ✅ **Audio Editor** — `src/components/AudioEditor.tsx`. Waveform trim/cut editing used by MediaRecorder and Journal.
- ✅ **Recording Textarea** — `src/components/RecordingTextarea.tsx`. Textarea + voice recording with transcript insertion; configurable `recordingPurpose`/`storageFolder`.
- ✅ **Global Playlist Audio** — `src/lib/design-system/components/media/global-audio/*`, state in `src/lib/stores/global-audio-store`. Doc: `docs/design-system/global-playlist-audio.md`. (Legacy single-track `AudioPlayer` is a different model.)
- ✅ **AI Model Pricing** — `ai_model_pricing` table, `/admin/ai-models`. Used for token cost calculation.
- ✅ **Household Accounts** — `households`, `household_members`, `household_invitations`. Doc: `docs/architecture/HOUSEHOLD_ACCOUNTS_ARCHITECTURE.md`.

---

## In Progress

### 🚧 VIVA Conversational Coach
Conversational brain: retrieve → Luna interpreter (theory of the moment + context selections) → Terra response → background memory/constraint extraction + embedding sync. Threads, compounding memory (`viva_memory_items`), semantic recall (pgvector `member_embeddings`), constraint ledger, in-app tool actions, opt-in household lens.
In-thread modes (member-chosen, not a hidden classifier): Auto / Friend / Coach / Builder / Assistant. Mode shapes stance and tools. Persist `conversation_sessions.viva_mode`; log switches in `viva_mode_switches`; stamp `ai_conversations.context.selected_mode`. Stored mode key is `builder`.
Schema: `conversation_sessions`, `ai_conversations`, `viva_memory_items`, `vibrational_constraints`, `member_embeddings`, `viva_mode_switches`. API: `/api/viva/coach`, `/api/viva/conversations`, `/api/viva/mode`, `/api/viva/constraints`. Lib: `src/lib/viva/coach-*.ts`, `modes.ts`, `memory-extractor.ts`, `embeddings.ts`, `household-lens.ts`. UI: `/viva`.

- Memory extraction runs in-process via `after()` — do NOT reintroduce HTTP self-calls (the old empty-Cookie fetch silently failed every session)
- Do NOT reintroduce the five-mode detector or mandatory A.U.R.A. sequencing
- Do NOT inject `vibrational_events` / `emotional_snapshots` into coach context (deprecated lens)
- Preserve crisis safety behavior and no-medical/legal/financial-advice guardrails
- Friend = tools off; Coach = journal/flip only; Builder = manifestation + create tools + `find_kit_candidates`; Assistant = `find_asset` only
- Never say "kit" to the member — the object is a manifestation

### 🚧 Manifestations (Vision Board merged in)
One record per desire: the `manifestations` table (renamed from `vision_board_items`; a compat view keeps the old name queryable until the rename ships) holds the manifestation (image + Active/Actualized state) with depth spokes — why you want it / what it feels like (owned text, Life Vision only seeds a copy), Inspired Action Steps (nested `projects` + `project_tasks`), The Journey (journal entries via `manifestation_assets`, many-to-many), and the Actualization Story. The board grid at `/manifestations` is the visualizer. The old hub table is archived as `manifestations_legacy_hub` — do not use it.
Schema: `manifestations`, `manifestation_assets`, `manifestation_activations`, `projects` (+`project_tasks`, `manifestation_id` → `manifestations`). API: `/api/manifestations*`, `/api/vision-board/*` (items), `/api/projects*` (action groups). Lib: `src/lib/manifestations/*`. UI: `/manifestations`, `/manifestations/new`, `/manifestations/[id]`. Studio: `src/components/manifestations-studio/*`. Legacy `/vision-board/*` and member `/projects/*` routes redirect here.
VIVA flows: `add_manifestation` (desire detection + optional image, offer first), `actualize_manifestation` → `draft_vibe_post` (explicit approval only, never auto-post), `save_journal_entry` with `manifestation_ids` (journal documentation engine).

- Join-table assets only — do not add `manifestation_id` to journal / abundance / daily_papers
- Do NOT auto-declare Actualized from scores or event counts
- Continue an existing manifestation for the same idea — never create a second one
- Never silent-attach; never say Complete; no 0–100% bar; never say "kit" in member-facing copy
- Do NOT hook Daily Paper, MAP, or Travel in this slice

### 🚧 Activation Experience (public lead magnet)
Public funnel: email capture creates a free account (`signup_source: 'activation'`, 100k trial-token grant) → Current State → VIVA reflection → Dream Layer → category confirmation → core written assets (Life I Choose vision, Future-Self Story, Incantation, SparkQuery, text-only manifestations) → text preview → "Enter My Activation" → Immersion screen with enrichment (vision audio, Mureka song, manifestation images) arriving async. Completion states: `activation_ready` (core assets) → `activation_entered` (primary metric) → `activation_enriched` (secondary). Doc: `docs/features/activation/README.md`.
Schema: `activations` (owner-only RLS, realtime). API: `/api/activation/start`, `/api/activation/track`, `/api/activation/[id]` (+ `/reflect`, `/category`, `/generate`, `/enrich`). Lib: `src/lib/activation/*` (orchestrator, events). Prompts: `src/lib/viva/prompts/activation-experience-prompts.ts`. UI: `/activation`, `/activation/experience`, `/activation/[id]`.

- Never block entry or the Immersion screen on audio/song/images — enrichment is per-asset (`asset_status` jsonb) and failure-tolerant
- No commitment / 72-hour language anywhere in the public flow; the optional field is `inspired_next_step`
- Existing-member emails must NOT be auto-logged-in at `/api/activation/start` — magic-link email only (account-takeover guard)
- Assets live in the shared tables (`stories` entity_type `custom`, `songs`, `audio_sets`, `manifestations`) with `metadata.feature = 'activation'`
- Funnel events go through `journey_events` (check constraint lists the allowed `activation_*` event types)

### 🚧 Household Sharing System
Per-member, per-feature sharing (share all vs select items) across Life Visions, Vision Board, Abundance, Audios, Projects, Stories, Travel. RLS: owner + explicitly shared (`household_id` set) + share-all members. Doc: `docs/features/household-sharing/README.md`.

- Do NOT expose drafts through share-all (RLS excludes `is_draft = true`)
- Share-all must NOT grant delete on someone else's personal content
- New feature APIs: drop owner filters on reads/updates, rely on RLS, return `isMine` + attribution

### 🚧 Project Hub (admin only — member surface folded into Manifestations)
Project management on `project_*` tables (renamed from `idea_*`). Admin at `/admin/projects`. The member `/projects` surface is retired: member projects are "Inspired Action Steps" inside a manifestation (`projects.manifestation_id` required for member-facing rows; old routes redirect). Agent workflow: `.cursor/rules/idea-hub-agent-workflow.mdc`.

- Member access is ownership-scoped (`created_by = auth.uid()`) + household collaboration via `can_collaborate_on_project()`
- `project_reference_links` = external bookmarks; `project_links` = inter-project relations — don't confuse them

### 🚧 Travel Tracker
Trip records with flights, media, links, world map, insights, and a Dream List, plus VIVA email import (paste-in at `/api/travel/parse` and forward-to-address via the SES inbound webhook creating `draft_import` trips). Schema: `trips`, `trip_flights`, `dream_destinations`, `travel_attachments`, `travel_reference_links`. API: `/api/travel/*`. Lib: `src/lib/travel/*` (bundled IATA airport dataset for miles flown). UI: `/travel-tracker` (Trips, Map, Insights, Dream List).

- Household sharing follows the standard pattern (`travel_mode`, `household_shares_all(..., 'travel', ...)`, `can_access_trip()` / `can_access_dream_destination()`)
- `user_profiles.trips` entries were migrated in (`source = 'migrated'`); the profile section now links out to the tracker
- Every VIVA parse must go through `trackTokenUsage()` (`action_type = 'travel_parse'`, tool config `travel_parse` in `ai_tools`)

### 🚧 Reset ("Phoenix")
Repeatable recommitment program. Schema: `resets`, `reset_items`. Doc: `docs/features/reset/README.md`. Detection is anchor-based (snapshot at start) to avoid false positives from in-place edits; every selected item must complete to reach Phoenix.

### 🚧 Actualization Blueprints
Vision-to-action steps, 5-phase framework. Schema: `actualization_blueprints`, `blueprint_phases`, `blueprint_tasks`. Known issues: phase completion logic needs review; task dependencies not implemented.

### 🚧 Cinematic Universe
Keyframe execution engine: story prompt → keyframe images → video clips (Veo first-last-frame chaining). Lib: `src/lib/cinematic/`, UI: `/admin/cinematic/*`, schema: `cu_*` tables.

### 🚧 Slide Decks
Static HTML teaching decks in `public/slide-decks/`. Catalog: `src/lib/slide-decks/catalog.ts`. Admin: `/admin/slide-decks` (sidebar under Slide Decks). Public URLs stay `/slide-decks/<slug>.html`. Add new decks to the catalog so they appear in the admin sidebar.

### 🚧 Life Explorer (Vibration Fit Homeschool)
VIVA-composed homeschool: profile-seeded Life I Choose, expeditions, skill ladders + Life Learning + Year Map, daily lessons, layered books, parent check-in, portfolio. Schema: `le_*`. API: `/api/life-explorer/*`. UI: `/homeschool/life-explorer`. Rule: `.cursor/rules/life-explorer.mdc`. North star: tool-enabled human (see `docs/features/life-explorer/PHILOSOPHY.md`). Engineering: never invent resource titles/URLs/runtimes; never regenerate `homeschool/oliver-ocean-adventures/`; progress on `le_skill_progress` — no parent standards form unless requested. Pedagogy is a working bet, not a lock.

---

## Needs Review

- ⚠️ **Vision Refinement Flow** — `/life-vision/[id]/refine`, `/api/viva/refine`. Verify integration with the current `vision_versions` structure before relying on it.

---

## Maintaining This Registry

- New feature → add a short entry (status, pointers, critical rules only). Details go in `docs/features/[name]/README.md`.
- Status changes and lock/unlock decisions belong here; everything else (versions, dates, change history) belongs in git.
- Keep entries under ~10 lines. If an entry needs more, it needs a doc, not a longer entry.
