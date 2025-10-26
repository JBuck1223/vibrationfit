# VIVA Vision Starter

This package ships a **Life Vision Generator** for VibrationFit. It composes present‑tense, first‑person, positively framed paragraphs for the 12 categories in `vision_versions` and saves progress as a draft until complete.

## Contents
- `api/coach/vision/generate/route.ts` — idempotent generator endpoint
- `api/coach/vision/complete/route.ts` — marks draft complete
- `components/CategoryComposer.tsx` — simple UI to feed wants / not_wants / vent
- `prompts/viva-system-prompt.txt` — VIVA persona + rules
- `prompts/categories/*.json` — seed questions per category
- `prisma_or_sql/vision_migrations.sql` — indexes + audios table

## Env
```
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
```

## Quick Start
1. Run the SQL in `prisma_or_sql/vision_migrations.sql`.
2. Drop `api/` and `components/` into your Next.js app (App Router).
3. Mount `<CategoryComposer userId="..." />` anywhere behind auth.
4. POST to `/api/coach/vision/generate` with `userId`, `category`, and inputs.
5. Watch `vision_versions.completion_percent` advance as you go.

## Notes
- Paragraphs are ≤150 words, include one simple ritual, and avoid negations.
- Use the forthcoming **Refine** tool to polish each category further.
