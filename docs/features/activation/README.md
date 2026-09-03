# Activation Experience

The public lead magnet: a VIVA-led experience where a visitor honestly describes
what's wrong, clarifies what they want instead, and receives a personalized
Activation they can immediately enter. It is one complete step of the larger
paid system — the proof object that VIVA can take someone from emotional
disorder to a personally meaningful vision in one session.

**Core promise:** clarity, emotional activation, and an aligned next step.
Never external results or guaranteed manifestation.

## User flow

```
/activation            Welcome → email capture (free account created + signed in)
/activation/experience Current State → VIVA reflection → Dream Layer
                       → Category confirmation → Generate → Vision preview
                       → "Enter My Activation"
/activation/[id]       Immersion: Start Here guide, Life I Choose, Future-Self
                       Story, Incantation, SparkQuery, enrichment queue
                       (audio / song / vision images arrive live), downloads,
                       post-immersion offer, optional inspired next step
```

## Completion model

| State | Meaning | Set by |
|---|---|---|
| `activation_ready` | Core written assets exist (vision + story minimum) | `/api/activation/[id]/generate` |
| `activation_entered` | User clicked **Enter My Activation** — the primary conversion + engagement metric | `PATCH /api/activation/[id]` `{ action: 'enter' }` |
| `activation_enriched` | Audio, song, and board images all reached a terminal state (secondary) | lazy, on `GET /api/activation/[id]` |

There is **no commitment step**. `inspired_next_step` is optional, offered after
entry, and is never called a commitment or MAP.

## Architecture

- **Table:** `activations` — one row per Activation. Inputs (`current_state`,
  `dream_response`, `category`), the structured vision (`reflection`,
  `vision_statement`, `essence`, `desired_emotional_state`), asset refs
  (`story_id`, `incantation_id`, `spark_query_id`, `song_id`, `audio_set_id`,
  `audio_track_id`, `manifestation_ids`), and the per-asset state machine
  `asset_status` (`{ [asset]: { state, retry_count, error_message } }`).
  Owner-only RLS; in the realtime publication; query keys registered in
  `src/lib/query/keys.ts`.
- **Orchestrator:** `src/lib/activation/orchestrator.ts`
  - `generateCoreAssets` — vision object first (single source every asset
    inherits from), then story + incantation + SparkQuery in parallel, plus
    text-only manifestation rows. Idempotent: only missing/failed assets
    regenerate. Ready requires vision + story; incantation/SparkQuery failures
    degrade gracefully.
  - `runEnrichment` — vision audio (OpenAI TTS via `audioService`), song
    (lyrics → Mureka submit; the client polls `/api/songs/poll/[taskId]` and
    the activation GET flips the state when the song lands), manifestation
    images (`imageService`). Called by the Immersion screen; never gates entry.
    In-flight assets fresher than 5 minutes are left alone (stale-crash guard).
- **Account capture:** `/api/activation/start` — new emails get a free account
  (`user_metadata.signup_source = 'activation'`), a 100,000 trial-token grant
  (`trial_grant`, never expires, ≈2.5× one full Activation), a lead row
  (type `activation`), and a same-response magic-link session. Existing emails
  are **never** auto-logged-in — if the browser doesn't already hold their
  session we email a magic link (account-takeover guard).
- **Prompts:** `src/lib/viva/prompts/activation-experience-prompts.ts` —
  reflection (validate before reframing, never shame, `needs_support` safety
  flag), category inference (one of the 12 keys + member-facing confirmation
  line), vision object (Life I Choose + essence + 2-3 imageable manifestation
  desires; 80%+ of wording reframed from the user's own words).
- **Shared asset tables:** stories (`entity_type: 'custom'`, `entity_id:
  activationId`, `metadata.feature: 'activation'`), `songs`, `audio_sets` /
  `audio_tracks`, `manifestations`. Nothing activation-specific was added to
  locked schemas.

## Instrumentation

All funnel events are `journey_events` rows (the `event_type` check constraint
lists them): `activation_started`, `current_state_completed`,
`dream_layer_completed`, `category_confirmed`, `activation_ready`,
`activation_opened`, `activation_entered`, `activation_enriched`,
`inspired_step_saved`, `story_viewed`, `audio_played`, `song_played`,
`assets_downloaded`, `paid_offer_clicked` — plus `email_captured` at capture.
Server routes record directly (`recordActivationEvent`); client moments go
through `POST /api/activation/track`. Pixels: `trackConversion('lead')`
client-side + `sendServerConversion('lead')` (Meta CAPI / GA4 / TikTok) at
email capture.

**North-star metric:** activation entry rate (`activation_entered` ÷
`activation_started`). Secondary: audio/song replay, enrichment completion,
paid conversion.

## Guardrails

- Validate before reframing; never shame the current state
- No mental-health diagnosis; crisis language sets `needs_support`
- No guaranteed-manifestation claims
- Outputs must be specific and user-derived — generic output destroys trust
- Free users hold real token balances; every AI call goes through
  `validateTokenBalance` + `trackTokenUsage` like the rest of the platform
