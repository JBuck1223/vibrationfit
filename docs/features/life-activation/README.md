# Life Activation

**Last Updated:** September 6, 2026
**Status:** Active

Paid continuation of the public Activation. Two chosen journeys, neither locked.

- **Onboarding** (`/begin`) — write the Life Vision, hear it, meet Vibe Tribe, find Alignment Gym
- **Tools Training** (`/begin/training`) — optional tool walk-throughs (not on the live sidebar yet)

Admin inspector: `/admin/begin` (includes a member-sidebar preview). Copy: `src/lib/life-activation/copy.ts`.

Sidebar: **Getting Started** → `/begin` while onboarding is open (including accounts with no progress row). After onboarding it becomes **Tools Training**. When every tool walk-through is done, the tab is gone.

## Onboarding

1. Welcome — `/begin/welcome` (explainer video + what a first Activation is)
2. Write Life Vision — `/life-vision/begin` (VIVA create mode)
3. Hear it — Activation Kit
4. Vibe Tribe
5. Alignment Gym
6. You're started

Life Activation is additive. Intensive stays at `/intensive/*` and is not redirected or migrated. Members enter `/begin` by choice.

## Training

Entered by choice after onboarding. Each tool gets a short walk-through on its page, like Life Vision. Completing a tour checks that tool off. Profile, intake, stories, spoken tools, songs, manifestations, journal, Daily Paper, voice, VIVA coach, MAP.

## Data

`life_activation_progress` — one row per member. Vision writes still go through existing draft/commit APIs.
