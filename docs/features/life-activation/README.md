# Life Activation

**Last Updated:** October 17, 2026
**Status:** Active

Paid continuation of the public Activation. Two chosen journeys, neither locked.

- **Onboarding** (`/begin`) — take a baseline survey, save a Life Profile (personal information plus optional current state), write the Life Vision, hear it, meet Vibe Tribe, find Alignment Gym, create and activate MAP, then a closing survey
- **Tools Training** (`/begin/training`) — optional studio walk-throughs. One tour per studio, tab by tab. The Walkthrough icon stays on every tool page. First Finish checks that tool off; later visits replay only.

Admin inspector: `/admin/begin` (includes a member-sidebar preview). Copy: `src/lib/life-activation/copy.ts`. Walk-through text: `/admin/walkthroughs` writes `src/lib/life-activation/walkthrough-overrides.json` on top of defaults in `src/lib/life-activation/walkthroughs.ts`.

Sidebar: while onboarding is open, the member sidebar lists the Getting Started steps on every page, including Life Profile, Life Vision, Vibe Tribe, Alignment Gym, and MAP. The current room is highlighted. Collapse still works, on desktop and on the mobile drawer. After onboarding it becomes **Tools Training**. When every tool walk-through is done, the tab is gone.

## Onboarding

1. Welcome — `/begin/welcome` (explainer video + what a first Activation is)
2. Baseline Intake — `/begin/intake` (same questions as the Intensive pre survey). Saving goes straight to Life Profile.
3. Life Profile — `/profile/create`. Replaces the old Account step: the profile's Personal Information section saves name, birthday, and phone to `user_accounts`. With no profile yet, the page creates one and opens the editor. Continue requires a saved profile with those fields. The 12 current-state fields are optional. People who already finished Getting Started are not sent back.
4. Write Life Vision — `/life-vision/start`. Each area's "What's going on now" opens with the profile's current-state text for that area, if they wrote one. Only untouched areas are filled (`src/lib/life-vision/profile-now-prefill.ts`).
5. Create your Activation Kit — voice, a mix, and at least one board scene. There is no skip.
6. Record your voice — `/audio/record`. Record the Life Vision in your own voice, or skip. Same optional step as the Intensive.
7. Vibe Tribe — publishing a post completes the step
8. Alignment Gym — the guided tour completes the step, then opens MAP
9. MAP — `/map/update` opens with the four starter commitments (vision audio, journal, Vibe Tribe, Alignment Gym) and the rest of the catalog still available. Saving the plan completes the step and opens Unlock.
10. Unlock — `/begin/unlock` (closing survey). Scores are suggested from the Life Vision, kit, Vibe Tribe, Alignment Gym, and MAP already on the account, with a short write-up under each question. Completing this lands on `/map` with a congratulations modal, then the MAP walk-through. Last walk-through step sends them to Tools Training. `/begin/complete` redirects to `/map`.

Life Activation is the door for new buyers and for anyone with an open Intensive checklist. `/intensive/start`, `/intensive/welcome`, and `/intensive/dashboard` redirect to `/begin`. The locked Intensive shell is off. Checklist rows are not migrated.

## Training

Entered by choice after onboarding. Each studio has one walk-through. It goes tab by tab: Create (or Update) first so they see how to make something, then View as the empty archive — that is where a saved one lands — then any leftover tabs (Resources, spoken filters, songs). Next changes the tab. The tour does not type, save, or spend tokens. First Finish checks that studio off; later visits replay only. Finishing Stories also checks spoken tools; finishing Audio also checks songs. Optional snapshots live in `public/walkthroughs/` (inbox first, then attach to a step). Stories, spoken tools, songs, manifestations, journal, Daily Paper, voice, VIVA coach, MAP, plus Life Vision View. Baseline Intake and Life Profile stay in Getting Started. Life Vision Update stays its own overlay.

## Data

`life_activation_progress` — one row per member. First-vision gathering uses `vision_draft_sessions` + `vision_draft_session_notes` (contrast and clarity per category). Vision body writes still go through existing draft/commit APIs.
