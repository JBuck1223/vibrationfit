# AGENTS.md

## Cursor Cloud specific instructions

### Overview

VibrationFit is a Next.js 16 SaaS application (App Router + Turbopack dev, Webpack build). It uses a cloud-hosted Supabase backend (PostgreSQL, auth, storage), plus several third-party APIs (OpenAI, AWS, Stripe, etc.).

### Quick commands

| Action | Command |
|--------|---------|
| Dev server | `npm run dev` (port 3000, Turbopack) |
| Build | `npm run build` (uses `--webpack` flag) |
| Lint | `npx eslint` or `npm run lint` |
| TypeScript check | `npx tsc --noEmit` |

### Environment variables

A `.env.local` file is required in the project root. At minimum, the dev server needs:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` (typically `http://localhost:3000`)

Without real Supabase credentials, the app renders pages (including the full landing/marketing page) but auth and data-fetching features will not work. Additional optional keys: `OPENAI_API_KEY`, `AWS_*`, `STRIPE_SECRET_KEY`, `FAL_KEY`, `ELEVENLABS_API_KEY`, `DAILY_API_KEY`.

### Gotchas and caveats

- **No test suite**: The project currently has no automated test framework (no Jest, Vitest, or Playwright config). Linting (`npm run lint`) is the primary automated check.
- **Turbopack vs Webpack**: Dev uses `--turbopack`, build uses `--webpack`. These can behave differently for edge cases.
- **Pre-existing lint errors**: `src/app/page.tsx` has ~56 existing `react/no-unescaped-entities` lint errors. These are in the landing page copy and are known/expected.
- **Build time**: Full production build takes ~2.5 minutes due to the large number of routes.
- **Package manager**: npm (lockfile is `package-lock.json`). Do not use yarn/pnpm.
- **Node version**: v22+ works. No `.nvmrc` or engine constraints are set.
- **External services**: All infrastructure (Supabase, S3, Stripe, etc.) is cloud-hosted. No Docker or local database setup is needed for development.
