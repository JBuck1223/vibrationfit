# Life Explorer — Vibration Fit Homeschool

**Status:** In Progress  
**Audience:** Parent/household tooling (v1 for Oliver)  
**Product name (long-term):** Vibration Fit Homeschool  
**UI home:** `/homeschool/life-explorer`

Life Explorer is a curiosity-driven homeschool system organized through the 12 Vibration Fit Life Categories. An Expedition (e.g. Travel → Antarctica) provides context for reading, writing, math, science, geography, art, communication, and life skills.

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

ChatGPT-authored Antarctica PDFs are ingested at:

- Markdown index: [`homeschool/life-explorer/antarctica/README.md`](../../../homeschool/life-explorer/antarctica/README.md)
- Downloadable PDFs: `public/homeschool/life-explorer/antarctica/*.pdf`
- Typed catalog: `src/lib/life-explorer/antarctica-resources.ts`
- Parent UI: `/homeschool/life-explorer/resources`

Only verified URLs from that pack may be linked. Everything else uses `needs_parent_link`.

## Related (not Life Explorer)

- **Oliver Ocean Adventures** (`homeschool/oliver-ocean-adventures/`) — finished static Month 1 unit. Do not regenerate or replace it.
- **Yearly curriculum overview** — `docs/jordan/VibrationFit_Homeschool_Curriculum.md`
- **Admin overview** — `/admin/homeschool`

## Code map

| Area | Path |
|------|------|
| Domain lib | `src/lib/life-explorer/` |
| APIs | `src/app/api/life-explorer/` |
| Parent UI | `src/app/homeschool/life-explorer/` |
| Antarctica pack | `homeschool/life-explorer/antarctica/` + `public/homeschool/life-explorer/antarctica/` |
| Migration | `supabase/migrations/*_life_explorer.sql` |
| Cursor rule | `.cursor/rules/life-explorer.mdc` |
