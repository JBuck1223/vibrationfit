# MAP Time Travel and Event Log

**Last Updated:** May 20, 2026  
**Status:** Active

## Overview

MAP plan history uses an append-only `commitment_change_events` table (vision-board pattern). Members browse past plans by **date**, not MAP version numbers.

## Data model

| Layer | Table | Role |
|-------|--------|------|
| Live plan | `commitments` (`status = active`) | Current MAP rituals (system + custom) |
| History | `commitment_change_events` | Full `state` JSON after each change |
| Practice | `commitment_occurrences` | What was logged on each calendar day |

`user_maps` stores activation prefs and weekly digest settings. `map_activation_id` on events groups bulk system activates.

## System vs custom

- **System:** pillar `category` + `activity_type` — configured via `/map/update/system` or intensive activate (`activate_system_map` RPC).
- **Custom:** life vision `category`, no `activity_type` — CRM on `/map/update/custom` (active / archived / delete).

## APIs

- `GET /api/map/snapshot?date=YYYY-MM-DD` — plan active at end of that day
- `POST /api/map/activate-system` — single-transaction system MAP activate

## UI

- **Time travel** — tap the date label on Day, Week, or Month (`MapDateTravelTrigger` + DatePicker); only days with an active MAP are selectable (no future dates, no gaps)
- Day / Week / Month use `planCommitments` from context (live or snapshot)
- `/map/history` redirects to `/map`

## Manual test checklist

1. Intensive or full system activate — `commitment_change_events` rows with `source = system_activate` and shared `map_activation_id`
2. Add custom — appears on MAP Day view
3. Archive custom — disappears from Day view; visible under Archived on Custom Update; restore returns to MAP
4. Delete custom — removed from lists; past snapshot still shows it on dates when it was active
5. Tap date on Day/Week/Month — past date shows historical plan rows + occurrences for that date
6. Week view on past date uses snapshot plan labels
