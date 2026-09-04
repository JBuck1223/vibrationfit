# Activation Experience

The public lead magnet: a VIVA-led conversation where a visitor tells the truth
about now, says what they actually want, and receives a personalized Activation
they can immediately enter. It is one complete step of the larger paid system —
the proof that VIVA can take someone from contrast to a chosen reality.

**Core promise:** clarity, emotional activation, and an aligned next step.
Never external results or guaranteed manifestation.

Admin step inspector: `/admin/activation`. Member-facing copy lives in
`src/lib/activation/copy.ts`. Landing-page long-form copy still lives in
`src/app/activation/page.tsx`.

## User flow

```
/activation            Welcome → email capture (free account + branded resume email)
/activation/experience Orientation (I am ready) → pick one life category
                       → bounded VIVA chat in that area → Create My Activation
/activation/[id]       Preview (checklist only) → Enter My Activation (opened)
                       → Immersion shows the writing; audio / song / images queue
                       → I've Entered This Reality (entered)
                       → Offer #continue + Download Everything + optional inspired step
```

Resume: same user + incomplete Activation reopens that id. Already `entered`
returns to `/activation/[id]`. Signed-in visitors hitting experience without
`?id=` load their latest Activation. Existing emails without a session are never
auto-logged-in; they get a branded magic link that includes the id.
`/auth/callback` honors `/activation` `returnTo` and does not steal the funnel
to setup-password, Intensive, or dashboard.

## Completion model

| State / event | Meaning | Set by |
|---|---|---|
| `activation_oriented` | They committed on the orientation screen | `PATCH { action: 'orient' }` |
| `activation_intake_ready` | `current_state` + `dream.want` + category exist | chat route, on finish |
| `activation_ready` | Core written assets exist | `/api/activation/[id]/generate` |
| `activation_opened` | **Enter My Activation** from Preview | `PATCH { action: 'open' }` |
| `activation_entered` | **I've Entered This Reality** after Start Here — north-star | `PATCH { action: 'enter' }` |
| `activation_enriched` | Audio, song, and board all terminal (secondary) | lazy, on `GET /api/activation/[id]` |
| `offer_video_viewed` | Offer section entered the viewport once | client track |
| `converted_to_paid` | Checkout fulfillment when the user has an Activation | Stripe webhook / fulfillment |

There is **no commitment step**. `inspired_next_step` is optional, offered after
entry, and is never called a commitment or MAP. The offer is not shown until
`entered`.

## Architecture

- **Table:** `activations` — one row per Activation. Inputs (`current_state`,
  `dream_response`, `category`), conversation jsonb, eval columns
  (`prompt_version`, `intake_turn_count`, `intake_ready_at`, `needs_support`,
  `resume_email_sent_at`), the structured vision, asset refs, `asset_status`,
  `ready_at` / `opened_at` / `entered_at`. Owner-only RLS.
- **Chat:** `POST /api/activation/[id]/chat` streams with the same padding /
  `readCoachStream` path as `/viva`. Model `gpt-5.6-terra` via `activation_chat`.
  Same Conversational Intelligence brain as coach, plus a finish line. Hidden
  `<<<FIELD>>>` markers are parsed on the server. Max 8 model turns; hard stop
  at 10. Transcript stays on the Activation row — not in `/viva` sessions.
- **Orchestrator:** `src/lib/activation/orchestrator.ts`
  - `generateCoreAssets` — vision object first, then story + incantation +
    SparkQuery in parallel. Ready requires vision + story.
  - `runEnrichment` — spoken audio, song, manifestation images. Never gates
    Preview, Immersion, or Offer. Failed assets get a quiet retry.
- **Account capture:** `/api/activation/start` — new emails get a free account,
  a 100,000 trial-token grant, a lead row, a same-response silent sign-in, and
  a **separate** branded `activation-begun` magic link. Existing emails without
  a matching session only get the branded link (account-takeover guard). Latest
  incomplete Activation is resumed instead of inserting a second row.
- **Prompts:** `src/lib/viva/prompts/activation-chat-prompts.ts` (intake) and
  `activation-experience-prompts.ts` (vision / generate jobs).
- **Shared asset tables:** stories (`entity_type: 'custom'`), `songs`,
  `audio_sets` / `audio_tracks`, `manifestations`. `metadata.feature: 'activation'`.

## Instrumentation

`journey_events` has a first-class `activation_id` column. Event types include
`activation_started`, `activation_oriented`, `activation_resume_email_sent`,
`activation_resumed`, `activation_intake_ready`, `activation_generate_failed`,
`activation_ready`, `activation_opened`, `activation_entered`,
`activation_enriched`, `inspired_step_saved`, `story_viewed`, `audio_played`,
`song_played`, `assets_downloaded`, `offer_video_viewed`, `paid_offer_clicked`,
`converted_to_paid`. Do **not** emit a journey event per chat turn.

Token spend uses `trackTokenUsage` with
`{ feature: 'activation', activation_id, prompt_version }`.

**North-star metric:** `activation_entered ÷ activation_started` where entered
means they completed Start Here.

## Guardrails

- Same VIVA as `/viva` — friend first, honor pain, no therapy-speak
- Never auto-generate; they confirm Create My Activation
- No mental-health diagnosis; crisis language sets `needs_support`
- No guaranteed-manifestation claims
- Free users hold real token balances; every model call goes through
  `validateTokenBalance` + `trackTokenUsage`
