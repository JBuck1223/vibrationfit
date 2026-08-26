# Life Explorer — Vibration Fit Homeschool

**Status:** In Progress  
**Audience:** Parent/household tooling (v1 for Oliver)  
**Product name (long-term):** Vibration Fit Homeschool  
**UI home:** `/homeschool/life-explorer`

Life Explorer is the homeschool we run. The point is a **tool-enabled human** — a child who uses books, hands, people, and VIVA to learn what he needs. Expeditions, ladders, and maps are the current shape, not a locked religion. See [PHILOSOPHY.md](./PHILOSOPHY.md).

## Product truth

**Life Explorer turns the life this child chose into unique days, with tools (including layered books) and automatic proof for the state.** Everything else is a view of that truth.

## Current shape (working bets, not locks)

| Piece | Job |
|-------|-----|
| **Life I Choose** | Why. Whole-life vision on the student — seeded by the parent’s current-state profile, drafted by VIVA, made his by the child. Printable book + hear-it. |
| **Current-state profile** | Where he is now, 12 categories through a kid lens. Parent-filled once, grounds the vision, World Map, and year arc drafts. |
| **VIVA** | Who writes the days, map, year arc, week, expedition suggestions, and second explanation. Never called “AI” in the UI. |
| **Expedition** | How. One real world; first-grade (then mixed) work integrated. |
| **Selection engine** | When a new direction is needed, VIVA offers 3 — comfort, stretch, unknown. The child picks; the week composes around it. |
| **World Map + 9-month arc** | What he’ll taste. Ours. Honest hits only. |
| **Life Learning** | Year-long practice worlds: sight words, time, money, life sentences, fast facts, Life Compass. One weekly focus in the packet. |
| **Year Map** | Grade-level science/social-studies Big Ideas; status derived, untouched ideas softly steer lessons, suggestions, and books. |
| **Mastery** | Secure, then climb — math, reading, and writing ladders. Wobbly stays in a new unique lesson. |
| **Semester** | Sem 1 = this grade secure. Sem 2 = next grade mixed in only where earned. |

## Parent IA

Top-level nav is **Today · Week · Map · Progress · Profile** — one tab per time horizon: run the day, shape the week, see the year, prove the growth, know the child. Each tab carries a panel row; nothing is ever a second school.

| Tab | Panels (routes under `/homeschool/life-explorer`) | Job |
|-----|-----|-----|
| **Today** | Expedition (`/`), Record (`/record`), Wonder Wall (`/wonder`), Storybooks (`/books`) | What do we do today, and why (from Life I Choose)? Then the 2-minute check-in. |
| **Week** | Coming Week (`/week`), Calendar (`/calendar`), New Direction (`/change`), Resources (`/resources`) | Five unique days VIVA composed, the Sunday packet, day tracking, and VIVA’s 3 suggestion cards (comfort / stretch / unknown) when a new expedition is needed. |
| **Map** | Learning Map (`/map`), How It Works (`/overview`) | On-track sentence + World Map + Year Map Big Ideas + year arc + Florida ledger weather. |
| **Progress** | Progress (`/progress`), Expeditions (`/expeditions`, drill into `/expeditions/[id]` → `/lesson/[id]`), Portfolio (`/portfolio`), Lesson Log (`/lessons`) | Ladder rungs (incl. writing), Life Learning weather, strong vs wobbly, semester aim, evaluation readiness + countdown, every expedition with its lessons, evidence gallery. |
| **Profile** | Explorer (`/profile`), Life I Choose (`/vision`) | Who is this learner — identity, current-state profile intake, and the vision flow: where he is now → VIVA’s draft → his turn → tighten, print, hear it. |

## Curriculum engine

- **VIVA composer** — lessons, World Map, year arc, week arc, Life I Choose draft + diction, expedition suggestions, Ask / Another way. Prompts in `src/lib/viva/prompts/`. Tokens on the gateway.
- **Fun Contract** — six required beats per lesson (hook, story mission, embodiment, artifact, choice point, celebration). Validated in `generate.ts`; failures ship the Expedition Pack fallback.
- **Facilitation guarantees** — weekly materials forecast, low-battery mode, sibling tag-along, parent answer key, resource play queue, time-boxed blocks.
- **Retention engine** — Expedition Flashback spaced retrieval (`flashback.ts`).
- **Sequential ladders** — math + phonics + writing with a `grade` and FL benchmark codes on each rung; mastery gates climb and semester mix (`ladders.ts`, `semester.ts`).
- **Life Learning** — six year-long practice worlds with rungs and weekly packet inserts (`life-learning.ts`); progress on `le_skill_progress`.
- **Year Map** — grade-level Big Ideas with derived status and soft lesson steers (`year-map.ts`); untouched ideas feed the unknown suggestion card and the book composer.
- **VF Kids compass** — 12 slices + 3 truths as rituals and naming at existing lesson beats (`vf-kids.ts`).
- **Layered books** — a story VIVA authors can exist as the text, the same words sounded out, and the same sentences taken apart (with audio). Current composer still has `i_read` / `read_to_me`; the three-layer book is the next tool to build.
- **Two-pass read-aloud** — pass 1 is a cold record (no help). Pass 2: tap a word or play the sentence, then record again. Whisper aligns to the page; misses light up. The page is the test.
- **Resource curation** — household materials, VF originals, generated layered books, library/other readers when they fit. Never invent a URL. No publisher is required or banned.
- **State ledger + readiness** — Florida weather from evidence, ladders, and the activity log (`state-standards.ts`); evaluation readiness rollup and anniversary countdown derived in `readiness.ts`.
- **Expedition Packs** — human-curated fallback. Antarctica is **ours** (Expedition 1 of this life), not a Travel unit.

**Origin chat:** [1st Grade Learning Requirements](https://chatgpt.com/share/6a7539f9-5274-83ea-9fe8-b30a72569e06) — see [CHAT_CONTEXT.md](./CHAT_CONTEXT.md)

## Canonical documents (source of truth)

| Document | Purpose |
|----------|---------|
| [PHILOSOPHY.md](./PHILOSOPHY.md) | North star: tool-enabled human; working bets vs engineering |
| [LESSON_CONTRACT.md](./LESSON_CONTRACT.md) | Fields a generated lesson currently includes |
| [DATA_MODEL.md](./DATA_MODEL.md) | Stored shapes + Supabase table mapping |
| [DAILY_WORKFLOW.md](./DAILY_WORKFLOW.md) | Sequence for composing and updating lessons |
| [AGENT_RULES.md](./AGENT_RULES.md) | Engineering conventions + changeable bets |

## Expedition 1 content pack (Antarctica)

A pack we made. Recast in service of the Life I Choose — useful material, not a religion.

- Expedition pack: `src/lib/life-explorer/packs/antarctica.ts`
- Typed catalog: `src/lib/life-explorer/antarctica-resources.ts`
- Parent UI: `/homeschool/life-explorer/resources`

Printables are generated live — never stored as static PDFs:

| Layer | Route | When |
|-------|-------|------|
| Life I Choose book | `/api/life-explorer/print/vision` | Whenever the parent wants the child to hold the why |
| Expedition Kit | `/api/life-explorer/print/kit` | Once at expedition launch — includes the color-in Life Compass fridge page |
| Weekly Explorer Packet | `/api/life-explorer/print/week` | With the Sunday forecast — cover carries the parent on-track strip; includes the week’s Life Learning story page + cut cards |
| Per-lesson sheet | `/api/life-explorer/print/lesson?id=` | Only when the activity needs a recording sheet |

Shared ink-minimal brand shell: `src/lib/life-explorer/print/layout.ts`. The teacher guide is never printed — the lesson screen is the teacher guide.

Only verified URLs from the pack may be linked. Everything else uses `needs_parent_link`.

## Related

- **Oliver Ocean Adventures** (`homeschool/oliver-ocean-adventures/`) — finished static unit. Do not regenerate or replace it.
- **Yearly curriculum overview** (`docs/jordan/VibrationFit_Homeschool_Curriculum.md`) and **admin overview** (`/admin/homeschool`) — narrative/reference only. **Life Explorer is the pacing truth.**
- **Kids Activation Intensive** — later product. Life I Choose still lives in the school.

## Code map

| Area | Path |
|------|------|
| Domain lib | `src/lib/life-explorer/` |
| VIVA prompts | `src/lib/viva/prompts/life-explorer-*.ts` |
| APIs | `src/app/api/life-explorer/` |
| Parent UI | `src/app/homeschool/life-explorer/` |
| Antarctica pack | `src/lib/life-explorer/packs/antarctica.ts` |
| Print shell + routes | `src/lib/life-explorer/print/` + `src/app/api/life-explorer/print/` |
| Migration | `supabase/migrations/*_life_explorer*.sql` |
| Cursor rule | `.cursor/rules/life-explorer.mdc` |
