# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

VibrationFit is a Next.js (App Router, Turbopack) SaaS on Supabase, deployed to Vercel, with a Capacitor wrapper for iOS/Android (`mobile/`). Product overview: `PRODUCT_BRIEF.md`. Docs index: `docs/README.md`.

## Commands

```bash
npm run dev                 # dev server on :3000 (Turbopack); npm run dev:webpack as fallback
npm run build               # production build
npm run lint                # eslint
npx tsc --noEmit            # type check
npm run pre-deploy          # pre-deploy checks
npx tsx --test src/lib/script-studio/sections.test.ts   # run a single test file
npm run docs:generate       # regenerate docs/generated/ (schema, api, constants) — never hand-edit that folder
npm run mobile:sync         # cap sync after web changes that affect the native shell
```

Tests are colocated `*.test.ts` files using Node's built-in `node:test` + `node:assert/strict` (mostly in `src/lib/viva/`, `src/lib/life-vision/`, `src/lib/journal/`). There is no `npm test` script; run them with `npx tsx --test <file>` (plain `node --test` fails on extensionless imports).

## Verification policy

Keep verification lightweight. Rely on TypeScript/lint errors; run at most one `tsc --noEmit` or build per non-trivial task. Do not open a browser, screenshot, curl pages repeatedly, or restart the dev server to verify UI changes unless asked — hand visual confirmation back to the user. If tooling looks stale, say so and stop.

## Feature Registry — read before touching core systems

`FEATURE_REGISTRY.md` marks features LOCKED / STABLE / IN PROGRESS with hard constraints. LOCKED (ask permission first, then test the whole feature): `MediaRecorder.tsx`, `SimpleLevelMeter.tsx`, the Life Vision Generation System (6 steps, 12 categories — never change `CATEGORY_KEYS`), the Design System, the Token System, and the Database Schema/RLS. Check the registry entry for any in-progress feature (VIVA Coach, Manifestations, Activation, Life Activation `/begin`, Vision Update, Activation Kit, Household Sharing, etc.) before editing it — each lists rules that are easy to violate.

## Architecture

**Auth & routing.** `src/proxy.ts` (Next.js proxy, formerly middleware) redirects stray auth params (`code`/`token_hash`) to `/auth/callback` and gates admin routes via `src/middleware/admin.ts` with server-verified `getUser()`. Supabase clients in `src/lib/supabase/`: `client.ts` (browser), `server.ts` (RSC/route handlers, cookie session), `service.ts` (service role, bypasses RLS — trusted server code only), `admin.ts` (admin client + `verifyAdminAccess`).

**API.** Route handlers under `src/app/api/<feature>/`, with matching domain logic in `src/lib/<feature>/`. Keep business logic in `src/lib`, not in routes. Cron jobs live under `src/app/api/cron/`, webhooks (Stripe, SES inbound, etc.) under `src/app/api/webhooks/`.

**AI ("VIVA").** All model calls go through the Vercel AI Gateway (`src/lib/ai/gateway.ts`: `gateway` for the AI SDK, `gatewayClient` for the OpenAI SDK). Every AI call must record usage via `trackTokenUsage()` (`src/lib/tokens/tracking.ts`), storing the gateway generation id (`gatewayGenerationId()`) so the reconciliation cron can fetch billed cost. Balances are tracked, not enforced. Prompts live only in `src/lib/viva/prompts/` — never inline in API routes. The conversational coach (`/api/viva/coach`, `src/lib/viva/coach-*.ts`) is retrieve → interpreter → response → background memory/embedding extraction run in-process via `after()` (never HTTP self-calls). Several features stream structured content with marker blocks (e.g. `<<<VISION key>>> … <<<END VISION>>>`) parsed client-side.

**Client data.** TanStack Query is the only client cache. Query keys come from `src/lib/query/keys.ts` (scope child keys under a registry prefix). After mutations, `invalidateQueries` on the key; Supabase Realtime (`src/components/RealtimeInvalidationBridge.tsx`) is the backstop. Don't write `useEffect`+`useState` fetch-on-mount for shared data or add manual refresh events. A new table that client queries depend on must be mapped in `TABLE_TO_KEYS` and added to the `supabase_realtime` publication. Studio contexts (`LifeVisionStudioContext`, `JournalStudioContext`, …) are query-backed; keep their APIs stable.

**Database.** Schema source of truth is `supabase/COMPLETE_SCHEMA_DUMP.sql` — never edit or regenerate it (the user does). Never reference `supabase/archive/`. Changes go in `supabase/migrations/YYYYMMDDHHMMSS_description.sql`, applied via Supabase MCP (`execute_sql` / `apply_migration`). See `supabase/MIGRATION_STRATEGY.md`. Household sharing is enforced by RLS: new feature APIs drop owner filters, rely on RLS, and return `isMine` + attribution; drafts (`is_draft`) never leak through share-all.

**Media.** S3 uploads are processed by the MediaConvert Lambda (`lambda-video-processor/`) into `-1080p.mp4`, `-720p.mp4`, `-original.mp4`, `-thumb.0000000.jpg`. Derive thumbnails by suffix swap or `getVideoThumbnailUrl()`; never guess `-poster.jpg`. The design-system `<Video>` derives posters automatically. Prefer CDN `https://media.vibrationfit.com/...` over direct S3 URLs.

## UI conventions

- Design system: import from `@/lib/design-system/components`; colors only from `src/lib/design-system/tokens.ts`; no inline styles. Buttons `rounded-full`, cards `rounded-2xl` with 2px `#333` borders. Reference: `docs/agent-guides/DESIGN_SYSTEM_REFERENCE.md`.
- Page chrome: multi-route areas are studios — layout renders `AreaBar` outside `<main>`, prefix registered in `STUDIO_ROUTE_PREFIXES` (`src/lib/navigation/page-classifications.ts`), and pages inside add no header of their own. Standalone pages use the slim `PageHero` title row. Never boxed/gradient hero cards or centered giant titles. See `rules/STUDIO_PAGE_BUILDING_RULES.md`.
- VIVA chat UIs use the shared `VivaUserMessage` (purple `accent`, never Electric Lime), `VivaAssistantMessage` + `VivaMarkdown` (no bubble), `VivaThinkingIndicator`, `VivaChatInput`.
- Icons from `lucide-react`; no emojis in code or UI text.

## Brand voice (user-facing copy)

- Never say "AI" — say "VIVA". Internal identifiers may keep "AI".
- VIVA is the member's "guide", never their "coach" (no "your coach", "VIVA Coach", "VIVA coaching"). Human-led Alignment Gym "group coaching" is separate and keeps its name. Internal identifiers (`/api/viva/coach`, `coach-*.ts`, the `coach` mode key) may stay.
- "Actualize" not "Complete", "Vision" not "Goal", "Alignment" not "Progress". Never say "kit" to members (it's a manifestation).
- "Above the Green Line" = aligned/success; "Below the Green Line" = contrast.

## File placement

- Docs go in `docs/<category>/` (architecture, features/<name>, database, viva, design-system, technical) with a `**Last Updated:**` / `**Status:**` header — never in the repo root, never status docs ("COMPLETE", "FIXED") or dated filenames.
- Components `src/components/` (PascalCase); utilities `src/lib/` (kebab-case).
- Scratch/debug files in `temp/` (gitignored). One-off scripts in `scripts/<category>/`, moved to `scripts/archive/` after a successful run.
- Leave `homeschool/oliver-ocean-adventures/` untouched.
