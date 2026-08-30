# Page Building Rules - VibrationFit Design System

**Last Updated:** August 30, 2026  
**Version:** 3.0 — Studio chrome + slim titles (PageHero-as-boxed-hero is retired)

## Core Principle

GlobalLayout wraps every page with PageLayout. Individual pages never add `PageLayout`.

Page chrome is **not** a giant gradient card. Areas with more than one route are **studios** (AreaBar). Standalone pages use a slim left-aligned title.

---

## Layout Hierarchy

```
GlobalLayout (automatic)
  └─ PageLayout (automatic padding; stripped on mobile for studio routes)
      └─ Studio layout (if this area is a studio)
           AreaBar  ← outside <main>
           <main>   ← owns mobile padding
             Container + Stack + content
      └─ Or standalone page
           Container + Stack + slim PageHero + content
```

Never wrap content in `<PageLayout>`.

---

## Pick a chrome pattern

### 1. Studio (default for any area with multiple routes)

Audio, Life Vision, Journal, Profile, Story, Vision Board, Account, Map, Admin, and any new multi-page area.

Follow `rules/STUDIO_PAGE_BUILDING_RULES.md`. Add the prefix to `STUDIO_ROUTE_PREFIXES` in `src/lib/navigation/page-classifications.ts`.

Pages **inside** a studio layout:

```tsx
export default function YourStudioPage() {
  return (
    <Container size="xl">
      <Stack gap="lg">
        <Card>Content</Card>
      </Stack>
    </Container>
  )
}
```

- Do **not** add `PageHero`, `PageHeader`, or a custom title banner
- AreaBar already names the area, tabs, and current page
- Put primary actions in the page body (toolbars, first row), not in a hero

### 2. Standalone page (single route, no AreaBar)

```tsx
'use client'

import { Container, Stack, PageHero, Card, Button } from '@/lib/design-system/components'

export default function YourPage() {
  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero title="Page title" subtitle="Optional one-line description">
          <Button size="sm">Primary action</Button>
        </PageHero>
        <Card>Content</Card>
      </Stack>
    </Container>
  )
}
```

`PageHero` is a **slim left-aligned title row**. It is not a card, not centered, and not a marketing hero.

A plain `h1` is also fine:

```tsx
<div>
  <h1 className="text-lg md:text-2xl font-semibold text-white">Page title</h1>
  <p className="mt-1 text-sm text-neutral-400">Optional description</p>
</div>
```

---

## Retired — do not copy

```tsx
// WRONG — boxed gradient hero (old Dec 2025 standard)
<PageHero
  eyebrow="THE LIFE I CHOOSE"
  title="Huge Centered Title"
  subtitle="Inside a neon gradient card"
/>

// WRONG — PageHero on a studio page (AreaBar already exists)
<Container>
  <Stack>
    <PageHero title="Journal" />
    ...
  </Stack>
</Container>

// WRONG — double PageLayout
<PageLayout>
  <Container>...</Container>
</PageLayout>
```

---

## Container + Stack

- Outermost wrapper: `<Container size="xl">` (width only, **no padding**)
- Vertical rhythm: `<Stack gap="lg">` (32px). Do not add `mb-*` / `mt-*` on direct Stack children
- Loading: center a `Spinner` inside Container
- Cards: `p-4 md:p-6 lg:p-8`
- Grids: start `grid-cols-1`, then `sm:` / `md:`
- Buttons: `size="sm"`, `flex-col md:flex-row`

**Container sizes:** `sm` 768px · `md` 1024px · `default` 1280px · `lg` 1400px · `xl` 1600px (standard) · `full` unconstrained

---

## Pre-build checklist

- [ ] Multi-route area? Studio layout + AreaBar, prefix in `STUDIO_ROUTE_PREFIXES`
- [ ] Studio pages have **no** PageHero / PageHeader
- [ ] Standalone pages use slim PageHero or an `h1`, never a boxed hero
- [ ] No `<PageLayout>` on the page
- [ ] Container has no extra `px-*` / `py-*` on the outer wrapper
- [ ] Mobile-first text, spacing, and grids

---

## Reference

- Studio layouts: `rules/STUDIO_PAGE_BUILDING_RULES.md`
- AreaBar: `src/lib/design-system/components/navigation/AreaBar.tsx`
- Admin studio: `src/components/admin-studio/`
- Life Vision (canonical studio): `src/app/life-vision/layout.tsx`
- Tokens: `src/lib/design-system/tokens.ts`
