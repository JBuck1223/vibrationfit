# Life Explorer — Agent Rules

**Last Updated:** August 23, 2026  
**Status:** Active

Read before changing Life Explorer code or generating lessons:

1. [PHILOSOPHY.md](./PHILOSOPHY.md) — north star (tool-enabled human). Pedagogy is a working bet, not a lock.
2. [LESSON_CONTRACT.md](./LESSON_CONTRACT.md)
3. [DATA_MODEL.md](./DATA_MODEL.md)
4. [DAILY_WORKFLOW.md](./DAILY_WORKFLOW.md)

Do not tell the parent “you’ve already decided” about how school works. That sentence came from these files treating design bets as law. If a bet is in the way, change the doc and the code.

## North star

Build a **tool-enabled human**. VIVA composes days and layered books (story / sounded-out words / sentence structure). The child uses tools to learn what he needs. User-facing name is **VIVA**, never “AI.”

## Engineering conventions

These keep the software honest. They are not pedagogy.

1. VIVA prompts live in `src/lib/viva/prompts/` only — never inline in API routes. Tokens through the gateway and `trackTokenUsage`.
2. Never invent a title, page number, runtime, review score, or URL. Omit or set `needs_parent_link: true`. Generated VF books we actually authored are first-class; we know those titles because we made them.
3. Do not edit `supabase/COMPLETE_SCHEMA_DUMP.sql`.
4. Leave `homeschool/oliver-ocean-adventures/` untouched (archive).
5. Product lives in Vibration Fit, not Company Engineers’ knowledge base.
6. Homeschool v1: parent-held screen; no child login until we build one on purpose.
7. Catalogs live in code (`skill-catalog.ts`, Life Learning, Year Map, VF Kids). Progress stays on `le_skill_progress`. Progress is the master checklist: finishing the day marks keys `developing`; the parent can tap empty → `secure` or uncheck → `needs_support`. Do not add a second benchmark-progress table.
8. Life I Choose is seeded from `le_student_profiles` and edited into his words. Do not hard-code a canned vision paragraph as if it were his.

## Working bets (change when they stop serving)

- Expeditions, ladders, Flashback, Life Learning, three-card discovery, semester mix, Fun Contract, compass-as-lens — current shape, not frozen.
- Materials may be household, VF-original, generated layered books, library books, or a page from someone else’s program. Nothing is banned for having a publisher.
- Wobbly skill → a *new* unique practice is still a good default (not a cloned worksheet). Revisit if a better drill shows up.
- Do not force every subject into every lesson.
- Preserve the child’s language on Wonder Wall “Know.”
- Do not tell the parent they are behind.
- Smallest complete experience that keeps the parent prepared, the child engaged, and the learning documented — still the quality bar.
