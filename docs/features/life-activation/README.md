# Life Activation

**Last Updated:** September 9, 2026
**Status:** Active

Paid continuation of the public Activation. Two chosen journeys, neither locked.

- **Onboarding** (`/begin`) — write the Life Vision, hear it, meet Vibe Tribe, find Alignment Gym
- **Tools Training** (`/begin/training`) — optional studio walk-throughs. One tour per studio, tab by tab. The Walkthrough icon stays on every tool page. First Finish checks that tool off; later visits replay only.

Admin inspector: `/admin/begin` (includes a member-sidebar preview). Copy: `src/lib/life-activation/copy.ts`. Walk-through text: `/admin/walkthroughs` writes `src/lib/life-activation/walkthrough-overrides.json` on top of defaults in `src/lib/life-activation/walkthroughs.ts`.

Sidebar: **Getting Started** → `/begin` while onboarding is open (including accounts with no progress row). After onboarding it becomes **Tools Training**. When every tool walk-through is done, the tab is gone.

## Onboarding

1. Welcome — `/begin/welcome` (explainer video + what a first Activation is)
2. Write Life Vision — `/life-vision/begin` (VIVA asks questions, seeds contrast and clarity into a Draft Session, then composes the whole vision in one pass)
3. Hear it — Activation Kit
4. Vibe Tribe
5. Alignment Gym
6. You're started

Life Activation is additive. Intensive stays at `/intensive/*` and is not redirected or migrated. Members enter `/begin` by choice.

## Training

Entered by choice after onboarding. Each studio has one walk-through. It goes tab by tab: Create (or Update) first so they see how to make something, then View as the empty archive — that is where a saved one lands — then any leftover tabs (Resources, spoken filters, songs). Next changes the tab. The tour does not type, save, or spend tokens. First Finish checks that studio off; later visits replay only. Finishing Stories also checks spoken tools; finishing Audio also checks songs. Optional snapshots live in `public/walkthroughs/` (inbox first, then attach to a step). Profile, intake, stories, spoken tools, songs, manifestations, journal, Daily Paper, voice, VIVA coach, MAP, plus Life Vision View. Life Vision Update stays its own overlay.

## Data

`life_activation_progress` — one row per member. First-vision gathering uses `vision_draft_sessions` + `vision_draft_session_notes` (contrast and clarity per category). Vision body writes still go through existing draft/commit APIs.
