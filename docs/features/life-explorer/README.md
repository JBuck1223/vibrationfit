# Life Explorer — Vibration Fit Homeschool

**Status:** In Progress  
**Audience:** Parent/household tooling (v1 for Oliver)  
**Product name (long-term):** Vibration Fit Homeschool  
**UI home:** `/homeschool/life-explorer`

Life Explorer is a curiosity-driven homeschool system organized through the 12 Vibration Fit Life Categories. An Expedition (e.g. Travel → Antarctica) provides context for reading, writing, math, science, geography, art, communication, and life skills.

## Product truth

**Life Explorer turns a child's curiosity inside the 12 Life Categories into daily experiential lessons, while automatically proving learning for the state.** Everything else is a view of that truth.

## Three surfaces only (parent IA)

Top-level nav is only **Today · Map · Profile**. Wonder Wall, Resources, Portfolio, Calendar, and Progress are panels inside those three — never peer destinations.

| Surface | Route | Job |
|---------|-------|-----|
| **Today (Expedition)** | `/homeschool/life-explorer` | "What do we do today, and what is the child curious about?" — lesson path, Wonder Wall, resources, materials forecast, check-in |
| **Learning Map** | `/homeschool/life-explorer/map` | "Are we learning enough, across life, and can I prove it?" — categories/expeditions, coverage radar, Learning Calendar tab, one-click Reports tab |
| **Profile** | `/homeschool/life-explorer/profile` | "Who is my child as a learner right now?" — portrait, facet depth, skills, Journey Feed |

## Curriculum engine

- **Fun Contract** — six required beats per lesson (hook, story mission, embodiment, artifact, choice point, celebration). Validated in `generate.ts`; failures ship the Expedition Pack fallback lesson instead.
- **Facilitation guarantees** — weekly materials forecast, low-battery mode, sibling tag-along, parent answer key, resource play queue, time-boxed blocks.
- **Retention engine** — Expedition Flashback spaced retrieval (`flashback.ts`).
- **Sequential ladders** — expedition-independent math + phonics scope-and-sequences with mastery checks (`ladders.ts`).
- **Resource curation** — Tier 1 franchises / Tier 2 verified / Tier 3 VF originals with quality gates (`curation.ts`). Never invent a URL.
- **State Requirements Engine** — Florida profile, standards crosswalk, coverage radar, derived compliance artifacts (`state-standards.ts`, `/api/life-explorer/reports/binder`).
- **Expedition Packs** — human-curated content unit with pre-built fallback lessons (`packs/`). Antarctica is the proving pack.

**Origin chat:** [1st Grade Learning Requirements](https://chatgpt.com/share/6a7539f9-5274-83ea-9fe8-b30a72569e06) — see [CHAT_CONTEXT.md](./CHAT_CONTEXT.md)

## Canonical documents (source of truth)

| Document | Purpose |
|----------|---------|
| [PHILOSOPHY.md](./PHILOSOPHY.md) | Permanent brain: purpose, categories, learning cycle, Wonder Wall, parent experience, pacing |
| [LESSON_CONTRACT.md](./LESSON_CONTRACT.md) | Exact fields every generated lesson must contain |
| [DATA_MODEL.md](./DATA_MODEL.md) | Stored shapes + Supabase table mapping |
| [DAILY_WORKFLOW.md](./DAILY_WORKFLOW.md) | Sequence for generating and updating lessons |
| [AGENT_RULES.md](./AGENT_RULES.md) | Hard rules for coding and lesson-generation agents |

## Expedition 1 content pack (Antarctica)

- Expedition pack (lessons, resources, printables): `src/lib/life-explorer/packs/antarctica.ts`
- Typed catalog: `src/lib/life-explorer/antarctica-resources.ts`
- Parent UI: `/homeschool/life-explorer/resources`

Printables are generated live — never stored as static PDFs:

| Layer | Route | When |
|-------|-------|------|
| Expedition Kit (passport, Wonder Wall headers, map, experiment sheets, certificate) | `/api/life-explorer/print/kit` | Once at expedition launch |
| Weekly Explorer Packet (5 field-notes pages, reading cards at current rung, vocab cards) | `/api/life-explorer/print/week` | With the Sunday forecast |
| Per-lesson sheet (only when the activity needs a recording sheet) | `/api/life-explorer/print/lesson?id=` | Button appears on the lesson page |

Shared ink-minimal brand shell: `src/lib/life-explorer/print/layout.ts`. The teacher guide is never printed — the lesson screen is the teacher guide.

Only verified URLs from the pack may be linked. Everything else uses `needs_parent_link`.

## Related

- **Oliver Ocean Adventures** (`homeschool/oliver-ocean-adventures/`) — finished static unit, surfaced on the Learning Map as a completed archive expedition. Do not regenerate or replace it.
- **Yearly curriculum overview** (`docs/jordan/VibrationFit_Homeschool_Curriculum.md`) and **admin overview** (`/admin/homeschool`) — narrative/reference only. **The Learning Map is the pacing truth**; these documents do not define pacing.

## Code map

| Area | Path |
|------|------|
| Domain lib | `src/lib/life-explorer/` |
| APIs | `src/app/api/life-explorer/` |
| Parent UI | `src/app/homeschool/life-explorer/` |
| Antarctica pack | `src/lib/life-explorer/packs/antarctica.ts` |
| Print shell + routes | `src/lib/life-explorer/print/` + `src/app/api/life-explorer/print/` |
| Migration | `supabase/migrations/*_life_explorer.sql` |
| Cursor rule | `.cursor/rules/life-explorer.mdc` |
