# Household Sharing System

**Last Updated:** July 9, 2026  
**Status:** Active

Household members can share their creations with each other across six
features: Life Visions, Vision Board, Abundance Tracker, Audios, Projects,
and Stories. Sharing is configured per member, per feature, and every page
that shows shared content offers a household lens with creator attribution.

---

## Data Model

### `household_sharing_settings`

One row per member per household (unique on `household_id, user_id`).

| Column | Values | Meaning |
|--------|--------|---------|
| `life_visions_mode` … `stories_mode` | `'all'` \| `'select'` | Share everything in this feature, or only items I explicitly share |
| `default_view` | `'me'` \| `'both'` | Preferred starting lens on shared pages |
| `setup_completed_at` | timestamptz | Set when the one-time builder is finished |

Defaults are `'select'` everywhere — nothing is shared until the member opts in.

### `household_id` columns

Each shareable table has a nullable `household_id uuid REFERENCES households(id)`:

- `NULL` = personal/private
- Set = shared with (or belonging to) the household
- The creator is always tracked via the row's owner column (`user_id` / `created_by`)

Tables: `vision_versions` (pre-existing, used for joint visions),
`vision_board_items` (pre-existing), `abundance_events`, `abundance_goals`,
`audio_sets`, `projects`, `stories`.

---

## Visibility Model (RLS)

A row is visible to another household member when **any** of:

1. **Owner** — `user_id / created_by = auth.uid()` (pre-existing policies)
2. **Explicitly shared** — `household_id` set + viewer is an active member
3. **Share-all** — `household_shares_all(owner_id, feature, viewer_id)` is true
   (the owner has that feature's mode set to `'all'`)

Rules layered on top:

- **Drafts never leak.** Share-all policies exclude `is_draft = true` rows
  (vision drafts, etc.). A draft only becomes visible once committed.
- **Shared content is fully editable** by household members (UPDATE policies
  mirror the SELECT conditions).
- **Delete stays with the creator** — plus the household admin for explicitly
  shared (`household_id` set) items. Share-all alone never grants delete.

### SECURITY DEFINER helpers

| Function | Purpose |
|----------|---------|
| `is_active_household_member(household_id, user_id)` | Membership check without RLS recursion |
| `is_household_admin(household_id, user_id)` | Admin check for delete policies |
| `household_shares_all(owner_id, feature, viewer_id)` | Reads `household_sharing_settings` for share-all mode |
| `can_listen_audio_set(set_id, user_id)` | Owner, shared set, audio share-all, household-vision audio, or shared-story audio |
| `can_collaborate_on_project(project_id, user_id)` | Full-edit collaboration on shared projects (tasks, comments) |

Migrations: `20260708120000_household_sharing_settings.sql`,
`20260708120100_household_sharing_feature_policies.sql`
(plus `20260706140000_fix_households_rls_recursion.sql` for the recursion fix).

---

## Two-Document Life Vision Model

- **Life I Choose** — each member's personal vision document.
- **Life We Choose** — the joint household vision (`household_id` set),
  built by merging/synthesizing the partners' personal visions.
- **Shared With Me** — a partner's personal visions visible via share-all.

Each group numbers its versions independently starting at 1. Selectors in the
Life Vision area bar, Audio studio, and audio source dropdowns group options
under these three headers (group headers only render when more than one group
exists).

Audio sets generated from a household vision (or a shared story) inherit the
source's `household_id`, so both partners can listen — including "listen as we
sleep" playlists.

---

## API Surface

| Endpoint | Purpose |
|----------|---------|
| `GET/PATCH /api/household/sharing-settings` | Read/update the current member's modes + default view; `setup_completed` marks the builder done |
| `GET /api/household/context` | Lightweight household summary (members, names, avatars) for client pages that query Supabase directly |
| `GET /api/household/hub` | Aggregated shared content across all six features with attribution |

Feature APIs accept a scope (e.g. `?scope=all`) and return rows enriched with
`isMine` and a `member` attribution object; reads/updates rely on RLS instead
of owner filters. Creation endpoints accept `shareWithHousehold` to set
`household_id`.

---

## UI Conventions

- **`HouseholdScopeToggle`** (design system, `@/lib/design-system/components`):
  the standard lens — `Me` / member name(s) / `Both` (couples) or `Everyone`
  (3+ members). Renders nothing for solo households.
- **Attribution badges** (cyan `#00FFFF` pills with the creator's first name)
  appear whenever the lens is not `Me` and the item belongs to someone else.
- **Edit is open, delete is guarded**: edit/delete buttons hide for non-creators
  except household admins on explicitly shared items.
- **One-time setup**: `/household/welcome` hosts `HouseholdSharingBuilder`
  (MapSystemBuilder-style card grid). Users land here after a household plan
  upgrade or after accepting an invitation.
- **Ongoing settings**: `HouseholdSharingSettingsCard` in `/account/household`.
- **Hub**: `/household` shows all six features' shared items with attribution.

---

## Key Files

```
supabase/migrations/20260708120000_household_sharing_settings.sql
supabase/migrations/20260708120100_household_sharing_feature_policies.sql
src/lib/household/sharing.ts                       # getShareAllMemberIds()
src/lib/household/context.ts                       # getHouseholdContext()
src/lib/design-system/components/utils/HouseholdScopeToggle.tsx
src/components/household/HouseholdSharingBuilder.tsx
src/components/account-studio/HouseholdSharingSettingsCard.tsx
src/app/household/page.tsx                         # hub
src/app/household/welcome/page.tsx                 # one-time builder
src/app/api/household/sharing-settings/route.ts
src/app/api/household/context/route.ts
src/app/api/household/hub/route.ts
```
