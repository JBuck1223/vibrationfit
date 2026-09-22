# Life Activation

**Last Updated:** September 22, 2026
**Status:** Active

Paid continuation of the public Activation. Two chosen journeys, neither locked.

- **Onboarding** (`/begin`) — save account details, take a baseline survey, write the Life Vision, hear it, meet Vibe Tribe, find Alignment Gym, create and activate MAP, then a closing survey
- **Tools Training** (`/begin/training`) — optional studio walk-throughs. One tour per studio, tab by tab. The Walkthrough icon stays on every tool page. First Finish checks that tool off; later visits replay only.

Admin inspector: `/admin/begin` (includes a member-sidebar preview). Copy: `src/lib/life-activation/copy.ts`. Walk-through text: `/admin/walkthroughs` writes `src/lib/life-activation/walkthrough-overrides.json` on top of defaults in `src/lib/life-activation/walkthroughs.ts`.

Sidebar: while onboarding is open, the member sidebar lists the Getting Started steps on every page, including Account, Life Vision, Vibe Tribe, Alignment Gym, and MAP. The current room is highlighted. Collapse still works, on desktop and on the mobile drawer. After onboarding it becomes **Tools Training**. When every tool walk-through is done, the tab is gone.

## Onboarding

1. Welcome — `/begin/welcome` (explainer video + what a first Activation is)
2. Account — `/account/settings` (name, birthday, phone; shipping address optional)
3. Baseline Intake — `/begin/intake` (same questions as the Intensive pre survey)
4. Write Life Vision — `/life-vision/begin` (VIVA asks questions, seeds contrast and clarity into a Draft Session, then composes the whole vision in one pass)
5. Create your Activation Kit — voice, a mix, and at least one board scene. There is no skip.
6. Vibe Tribe — publishing a post completes the step
7. Alignment Gym — the guided tour completes the step, then opens MAP
8. MAP — `/map/update` opens with the four starter commitments (vision audio, journal, Vibe Tribe, Alignment Gym) and the rest of the catalog still available. Saving the plan completes the step and opens Unlock.
9. Unlock — `/begin/unlock` (closing survey). Completing this lands on `/map` with a congratulations modal, then the MAP walk-through. Last walk-through step sends them to Tools Training. `/begin/complete` redirects to `/map`.

Life Activation is the door for new buyers and for anyone with an open Intensive checklist. `/intensive/start`, `/intensive/welcome`, and `/intensive/dashboard` redirect to `/begin`. The locked Intensive shell is off. Checklist rows are not migrated.

## Training

Entered by choice after onboarding. Each studio has one walk-through. It goes tab by tab: Create (or Update) first so they see how to make something, then View as the empty archive — that is where a saved one lands — then any leftover tabs (Resources, spoken filters, songs). Next changes the tab. The tour does not type, save, or spend tokens. First Finish checks that studio off; later visits replay only. Finishing Stories also checks spoken tools; finishing Audio also checks songs. Optional snapshots live in `public/walkthroughs/` (inbox first, then attach to a step). Stories, spoken tools, songs, manifestations, journal, Daily Paper, voice, VIVA coach, MAP, plus Life Vision View. Baseline Intake stays in Getting Started. Life Vision Update stays its own overlay. Life Profile stays available for existing members and is not a Tools Training step.

## Data

`life_activation_progress` — one row per member. First-vision gathering uses `vision_draft_sessions` + `vision_draft_session_notes` (contrast and clarity per category). Vision body writes still go through existing draft/commit APIs.
