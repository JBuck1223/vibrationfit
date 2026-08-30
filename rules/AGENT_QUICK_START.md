# Agent Quick Start — Building Pages

## Studio area (multiple routes) — copy this

Layout (`src/app/your-area/layout.tsx`): AreaBar outside `<main>`. See `rules/STUDIO_PAGE_BUILDING_RULES.md`. Register `/your-area` in `STUDIO_ROUTE_PREFIXES`.

Page inside the studio:

```tsx
'use client'

import { Container, Stack, Card } from '@/lib/design-system/components'

export default function YourPage() {
  return (
    <Container size="xl">
      <Stack gap="lg">
        <Card>Content — no PageHero, AreaBar is the header</Card>
      </Stack>
    </Container>
  )
}
```

Admin is already a studio. Never add a boxed header on `/admin/*`.

## Standalone page (single route)

```tsx
'use client'

import { Container, Stack, PageHero, Card, Button } from '@/lib/design-system/components'

export default function YourPage() {
  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero title="Page title" subtitle="Optional">
          <Button size="sm">Action</Button>
        </PageHero>
        <Card>Content</Card>
      </Stack>
    </Container>
  )
}
```

`PageHero` is a slim left-aligned title row — not a gradient card.

## Non-negotiable

1. **NO PageLayout** — GlobalLayout already provides it
2. **NO boxed / gradient PageHero** — that pattern is retired
3. **NO PageHero inside a studio** — AreaBar is the chrome
4. Container has **no** padding — PageLayout / studio `<main>` own it
5. Mobile-first

Full rules: `rules/PAGE_BUILDING_RULES.md` · `rules/STUDIO_PAGE_BUILDING_RULES.md`
