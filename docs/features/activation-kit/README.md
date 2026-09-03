# Activation Kit on Commit

**Last Updated:** September 3, 2026
**Status:** Active

When a member commits a Life Vision as active, VIVA offers to generate their **Activation Kit** — voice tracks, audio mixes, and board images — from saved preset settings, behind a single confirmation. This replaces the manual trip to `/audio` after every vision update.

## Flow

1. Any commit entry point opens the shared `CommitVisionDialog` (`src/components/life-vision/CommitVisionDialog.tsx`), which wraps the existing `POST /api/vision/draft/commit`.
2. After a successful commit, the dialog shows **"Generate your Activation Kit?"** with the member's default kit prefilled: a saved-kit selector, asset toggles (voice / mix / board), voice, background track, volume balance, optional frequency layer, output format, and a "save these settings to this kit" option — plus **Skip**.
3. Nothing generates until they confirm (kit generation costs tokens). On confirm, the client fires `POST /api/activation-kit/generate` and lands on `/life-vision/[id]`, where `ActivationKitProgressCard` polls the run and links each finished asset.

Commit entry points wired: `/life-vision/update`, `/life-vision/new` banner, `/life-vision/new/[category]` banner, `/life-vision/[id]` toolbar, `/life-vision/[id]/draft`. The VIVA coach `commit_vision_draft` tool directs members to the vision page to start the kit — it never auto-spends tokens. The progress card also offers "Generate Kit" for an active vision with no recent run (kit-only dialog mode).

## Schema

One migration: `supabase/migrations/20260903110000_create_activation_kits.sql` (applied via Supabase MCP).

- **`activation_kits`** — saved presets, multiple per user, one `is_default` (partial unique index). Settings: enabled slots, `voice_id` (may be composite `voice__vibe`), `background_track_id`, `voice_volume`/`bg_volume`, `binaural_track_id` + `binaural_volume` (0–30), `mix_output_format`. The first kit is seeded lazily from the member's last Audio studio batch (`getOrSeedKits` in `src/lib/activation-kit/kits.ts`).
- **`activation_kit_runs`** — one row per run: `vision_id`, `kit_id` + `settings` snapshot, overall `status` (running/completed/partial/failed), per-asset `asset_status` jsonb (same pattern as `activations`), output refs (`voice_audio_set_id`, `mix_audio_set_id`, `mix_batch_id`, `manifestation_ids`).

Both tables: owner-only RLS, realtime publication, mapped in `TABLE_TO_KEYS` (`src/lib/query/keys.ts`).

## Orchestrator

`src/lib/activation-kit/orchestrator.ts` — idempotent, failure-tolerant, separate namespace from the lead-magnet `src/lib/activation/`.

1. **Voice** — `generateAudioTracks()` (variant `standard`) for every written section. Content-hash dedupe + `carry_over_audio_to_new_vision` mean unchanged sections reuse existing tracks free; only refined sections cost TTS. A combined full track concatenates via Lambda afterwards.
2. **Mix** — after voice is ready: creates an `audio_generation_batches` row, generates the `custom-<batchId>` variant set (reuses the standard voice tracks), and invokes the `audio-mixer` Lambda (`batch-mix`) with the kit's background/binaural preset. The Lambda finishes async; `syncKitRunStatus()` (called by the status GET) flips the asset to ready from the batch state.
3. **Board** — for refined life categories (capped at 4; falls back to the first 3 written categories on a first vision): one LLM distillation each (`activation-kit-prompts.ts` → title/description/image_prompt), a `manifestations` row, and a `generateImage()` call landing on the member's board.

Re-running a run (`POST /api/activation-kit/generate` with `runId`) only regenerates missing/failed assets.

## API

| Route | Purpose |
|---|---|
| `POST /api/activation-kit/generate` | Start (or retry) a run for a committed vision — `{ visionId, kitId?, settings?, runId? }` |
| `GET /api/activation-kit/runs/[id]` | Status polling; lazily syncs the async mix asset |
| `GET/POST/PATCH/DELETE /api/activation-kit/kits` | Saved kit presets (list lazily seeds a default) |

## Guardrails

- No song generation in the kit (excluded by design).
- The commit RPC and draft semantics are untouched — the kit hooks in at the UI level after commit succeeds.
- Token balance is validated up front; TTS/LLM/image usage all go through `trackTokenUsage`.
