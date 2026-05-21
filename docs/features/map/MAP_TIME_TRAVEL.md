# MAP Time Travel and Event Log

**Last Updated:** May 21, 2026  
**Status:** Active

## Overview

MAP plan history uses an append-only `commitment_change_events` table (vision-board pattern). Members browse past plans by **date**, not MAP version numbers.

Navigation (selected date, Day / Week / Month) lives in **MapStudioContext** — there are no `?date=` or `?view=` URL parameters on `/map`.

## Data model

| Layer | Table | Role |
|-------|--------|------|
| Live plan | `commitments` (`status = active`) | Current MAP rituals (system + custom) |
| History | `commitment_change_events` | Full `state` JSON after each change |
| Practice | `commitment_occurrences` | What was logged on each calendar day |

`user_maps` stores activation prefs and weekly digest settings. `map_activation_id` on events groups bulk system activates.

## System vs custom

- **System:** pillar `category` + `activity_type` — `/map/update/system` or intensive activate (`activate_system_map` RPC).
- **Custom:** life vision `category`, no `activity_type` — CRM on `/map/update/custom` (active / archived / delete).

## APIs

| Endpoint | Purpose |
|----------|---------|
| `GET /api/map/snapshot?date=` | Historical plan via event replay; today returns live active rows |
| `GET /api/map/selectable-dates` | Calendar days with an active MAP (for date picker) |
| `POST /api/map/activate-system` | Wraps `activate_system_map` RPC |
| `PATCH /api/map/commitments/[id]` | Reminder fields + status (archive / restore / delete) |

## Libraries

- `src/lib/map/snapshot.ts` — `resolveMapPlanSnapshot`, `getMapSelectableDates`, date helpers
- Types in `src/lib/map/types.ts`
- Migration: `supabase/migrations/20260520120000_commitment_change_events.sql`

## Studio UX

| Piece | Behavior |
|-------|----------|
| `MapStudioContext` | `planCommitments`, `isHistoricalPlan`, `selectablePlanDates`, `refreshPlanForDate`; live load is active only |
| Time travel | Tap date on Day / Week / Month → `MapDateTravelTrigger` + `DatePicker` (only MAP-active days) |
| Day arrows | ±1 day via context (`goToDate`), no URL updates |
| Day view | Historical banner when `selectedDate < today` |
| Month view | Progress ring + check when day fully complete |
| `MapSystemBuilder` | `POST /api/map/activate-system` (no client-side versioned bulk writes) |
| `MapCustomUpdate` | Active list, Archive, Archived + Restore, Delete with confirm |
| History | `/map/history` redirects to `/map`; no History tab in area bar |

## Key files

```
supabase/migrations/20260520120000_commitment_change_events.sql
src/lib/map/snapshot.ts
src/app/api/map/snapshot/route.ts
src/app/api/map/selectable-dates/route.ts
src/app/api/map/activate-system/route.ts
src/components/map-studio/MapStudioContext.tsx
src/components/map-studio/MapDateTravelTrigger.tsx
src/components/map-studio/use-map-navigation.ts
src/components/map-studio/MapDayView.tsx
src/components/map-studio/MapWeekView.tsx
src/components/map-studio/MapMonthView.tsx
src/components/map-studio/MapSystemBuilder.tsx
src/components/map-studio/MapCustomUpdate.tsx
```

## Manual test checklist

1. **System activate** — `commitment_change_events` rows with `source = system_activate` and shared `map_activation_id` (Supabase or logs).
2. **Add custom** — appears on MAP Day view; event `custom_create`.
3. **Archive custom** — off Day view; under Archived on Custom Update; restore returns to MAP; events logged.
4. **Delete custom** — removed from lists; snapshot on past dates still shows it when it was active that day.
5. **Time travel** — tap date → pick a past MAP-active day → plan rows match that day; occurrences still reflect logs for that day.
6. **Day arrows** — prev/next change date without `?date=` in the URL; URL stays `/map`.
7. **Week / Month** — tap day header or cell → switches to Day view at that date (context only).
8. **Today** — live `commitments` (active), not snapshot replay.

## Known gaps / follow-ups

- Legacy bookmarks with `?date=` / `?view=` are read once on `/map` load then stripped from the URL.
- Week view still uses local `weekAnchor` (not fully synced to `selectedDate` when switching from Week tab).
- `planSnapshotLoading` is not surfaced in the Day UI (optional loading state on date change).
