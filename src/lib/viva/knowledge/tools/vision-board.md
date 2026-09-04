# Manifestations (formerly Vision Board)

**Last Updated:** September 1, 2026
**Version:** 3.0
**Status:** Production - Current

## Overview

Each manifestation is one active desire: an image, an Active/Actualized state, and depth spokes. The board grid (the old Vision Board) is the visualizer for manifestations — they are the same record.

## The Manifestation Record

One `manifestations` row per desire:

- Name/title, description, image
- Status: active, actualized, inactive
- Category tags (12 life categories)
- `why_it_matters` — why you want it (owned text; Life Vision can seed the language, but it is a copy, never a live link)
- `what_it_feels_like` — the feeling of already living it (owned text)
- `actualization_story`, `actualized_image_url`, `actualized_at` — How It Manifested

## Depth Spokes (on the detail page)

- **Why you want it / What it feels like** — editable text owned by the manifestation, with a "Pull from my Life Vision" affordance that copies matching category language at that moment
- **Inspired Action Steps** — action groups (projects) with nested steps (tasks), absorbed from the old Project Hub
- **The Journey** — evidence of becoming this: journal entries, abundance wins, and Daily Papers attached via `manifestation_assets`. Stories, songs, Life Vision, and related desires land under **Living it**. One journal entry can attach to many manifestations. **Gather from what I have** finds matching library items and pins them into these sections.
- **How It Manifested** — actualization story + evidence photo, shown when actualized

## Access Points

- Board: `/manifestations` (grid/list with Active/Actualized filters)
- Create New: `/manifestations/new`
- VIVA Ideas: `/manifestations/ideas`
- Detail: `/manifestations/[id]`
- Legacy `/vision-board/*` and `/projects/*` routes redirect here

## VIVA Flows

1. **Desire detection** — when a clear active desire surfaces in conversation, offer: "This sounds like an active desire. Let's add it to Manifestations. Want me to generate an image for this?" On yes, call `add_manifestation` (with `generate_image: true` only if they said yes to the image). Never create a duplicate for the same reality.
2. **Vibe Tribe share** — after `actualize_manifestation` succeeds, offer: "Want to share this in the Vibe Tribe? I can create a post based on our convo you can check." Show the exact draft, get an explicit yes, then call `draft_vibe_post` with `vibe_tag: 'win'` and the manifestation image. Never auto-post.
3. **Journal documentation engine** — when a conversation produces a clarity moment, a decision, or a step taken toward a desire, offer: "Want me to capture this in your Journal?" and propose which manifestation(s) it relates to. On yes, call `save_journal_entry` with `manifestation_ids` so the entry appears in The Journey of each.

## Database Schema

- `manifestations` — the manifestation record (see fields above)
- `manifestation_assets` — join table linking journal entries, stories, songs, etc. to manifestations
- `projects` + `project_tasks` — nested action groups and steps, `projects.manifestation_id` points at the owning manifestation
- `manifestations_legacy_hub` — the retired hub table (do not use)

## Integration Points

- Life Vision seeds language only (copy at creation/pull time, never a live link — visions evolve, manifestations remain)
- Part of Align (step 2 of the Conscious Creation Cycle)
- VIVA image generation via the standard image service with token tracking

---

**Keep This Updated:** Manifestation features and workflows should be documented here.
