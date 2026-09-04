# Activation Kit on Commit

**Last Updated:** September 3, 2026
**Status:** Active

When a member commits a Life Vision as active, VIVA offers to generate their **Activation Kit** — voice tracks, audio mixes, and board images — from saved preset settings, behind a single confirmation. This replaces the manual trip to `/audio` after every vision update.

## Flow

1. Any commit entry point opens the shared `CommitVisionDialog` (`src/components/life-vision/CommitVisionDialog.tsx`), which wraps the existing `POST /api/vision/draft/commit`.
2. After a successful commit, the dialog shows **"Generate Activation Kit"** with the member's default kit prefilled: a saved-kit selector, asset toggles (voice / mix / board), voice, one or more background tracks (each becomes its own mix — sleep, meditation, workout), volume balance, optional frequency layer, output format, and a "save these settings to this kit" option — plus **Skip**. Turning on **Board Images** loads VIVA scene suggestions from the committed vision (favoring what changed vs the previous version). Nothing generates until the member checks the scenes they want (up to 8).
3. Nothing generates until they confirm (kit generation costs tokens). On confirm, the client fires `POST /api/activation-kit/generate` and lands on `/life-vision/[id]`, where `ActivationKitProgressCard` polls the run and links each finished asset.

Commit entry points wired: `/life-vision/update`, `/life-vision/new` banner, `/life-vision/new/[category]` banner, `/life-vision/[id]` toolbar, `/life-vision/[id]/draft`. The VIVA coach `commit_vision_draft` tool directs members to the vision page to start the kit — it never auto-spends tokens. The progress card also offers "Generate Kit" for an active vision with no recent run (kit-only dialog mode).

## Schema

One migration: `supabase/migrations/20260903110000_create_activation_kits.sql` (applied via Supabase MCP).

- **`activation_kits`** — saved presets, multiple per user, one `is_default` (partial unique index). Settings: enabled slots, `voice_id` (may be composite `voice__vibe`), `background_track_id`, `extra_background_track_ids` (additional mixes in the same run), `voice_volume`/`bg_volume`, `binaural_track_id` + `binaural_volume` (0–30), `mix_output_format`. The first kit is seeded lazily from the member's last Audio studio batch (`getOrSeedKits` in `src/lib/activation-kit/kits.ts`).
- **`activation_kit_runs`** — one row per run: `vision_id`, `kit_id` + `settings` snapshot, overall `status` (running/completed/partial/failed), per-asset `asset_status` jsonb (same pattern as `activations`), output refs (`voice_audio_set_id`, `mix_audio_set_id`, `mix_batch_id`, `manifestation_ids`).

Both tables: owner-only RLS, realtime publication, mapped in `TABLE_TO_KEYS` (`src/lib/query/keys.ts`).

## Orchestrator

`src/lib/activation-kit/orchestrator.ts` — idempotent, failure-tolerant, separate namespace from the lead-magnet `src/lib/activation/`.

1. **Voice** — `generateAudioTracks()` (variant `standard`) for every written section. Content-hash dedupe + `carry_over_audio_to_new_vision` mean unchanged sections reuse existing tracks free; only refined sections cost TTS. A combined full track concatenates via Lambda afterwards.
2. **Mix** — after voice is ready: one mix per selected background track (primary + extras). Each creates an `audio_generation_batches` row, generates the `custom-<batchId>` variant set (reuses the standard voice tracks), and invokes the `audio-mixer` Lambda (`batch-mix`) with that track plus the shared frequency layer. The Lambda finishes async; `syncKitRunStatus()` (called by the status GET) flips the asset to ready when every mix batch is terminal.
3. **Board** — generates only the scenes the member checked in the dialog (`settings.board_suggestions` on the run snapshot, not on the saved kit). Each pick becomes a `manifestations` row plus `generateImage()`. If Board Images is on but nothing is checked, the board asset is skipped. Older runs without `board_suggestions` still distill one scene per refined (or first few) life category.

Re-running a run (`POST /api/activation-kit/generate` with `runId`) only regenerates missing/failed assets.

## API

| Route | Purpose |
|---|---|
| `POST /api/activation-kit/generate` | Start (or retry) a run for a committed vision — `{ visionId, kitId?, settings?, runId? }` |
| `POST /api/activation-kit/board-suggestions` | Lean VIVA pass — `{ visionId }` → scene list for the kit dialog picker |
| `GET /api/activation-kit/runs/[id]` | Status polling; lazily syncs the async mix asset |
| `GET/POST/PATCH/DELETE /api/activation-kit/kits` | Saved kit presets (list lazily seeds a default) |

## Guardrails

- No song generation in the kit (excluded by design).
- The commit RPC and draft semantics are untouched — the kit hooks in at the UI level after commit succeeds.
- Token balance is validated up front; TTS/LLM/image usage all go through `trackTokenUsage`.
