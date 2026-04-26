# Studio Page Building Rules - VibrationFit Design System

## Core Principle

**Studio pages (audio, life-vision, journal, profile, story, vision-board) use a different layout pattern than regular pages.** The AreaBar must be full-width on mobile, so studio layouts own their own padding instead of relying on PageLayout.

Regular pages follow PAGE_BUILDING_RULES.md. Studio pages follow these rules.

---

## Layout Hierarchy

### How GlobalLayout Handles Studio Routes

GlobalLayout detects studio routes and strips PageLayout's mobile padding:

```tsx
const isStudioRoute = pathname?.startsWith('/audio') || pathname?.startsWith('/life-vision') || ...
const audioPageLayoutClass = isStudioRoute ? 'max-md:!pt-0 max-md:!px-0' : undefined
```

This hands layout control to the studio's own `<main>` element on mobile.

### Studio Layout Structure

```
GlobalLayout
  PageLayout (padding stripped on mobile for studio routes)
    StudioLayout
      StudioProvider
        AreaBar           <-- OUTSIDE <main>, naturally full-width
        <main>            <-- provides px-4 on mobile, gap below AreaBar
          {children}      <-- pages use Container + Stack per normal rules
        </main>
```

### Correct Studio Layout Template

```tsx
'use client'

import React from 'react'
import { YourStudioProvider } from '@/components/your-studio/YourStudioContext'
import { YourAreaBar } from '@/components/your-studio/YourAreaBar'

export default function YourStudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <YourStudioProvider>
      <YourAreaBar />
      <main
        className="flex-1 pt-6 pb-3 md:pt-8 md:pb-3 lg:pt-6 px-4 md:px-0"
        style={{ '--content-px': '1rem' } as React.CSSProperties}
      >
        {children}
      </main>
    </YourStudioProvider>
  )
}
```

### Key Rules

- AreaBar renders OUTSIDE `<main>` -- this is what makes it full-width on mobile
- `<main>` provides `px-4` on mobile (re-applying what PageLayout stripped)
- `<main>` provides `md:px-0` on desktop (PageLayout handles desktop padding)
- `<main>` provides `pt-6` for the gap between AreaBar and content
- `--content-px: 1rem` CSS variable enables the FullBleed component (see below)

### Wrong Patterns

```tsx
// WRONG -- AreaBar inside Container (gets padded on mobile)
<Container size="xl">
  <Stack gap="lg">
    <AreaBar />
    {children}
  </Stack>
</Container>

// WRONG -- Negative margins on AreaBar to break out of padding
<div className="-mx-4">
  <AreaBar />
</div>

// WRONG -- Wrapping AreaBar and children in the same padding wrapper
<main className="px-4">
  <AreaBar />
  {children}
</main>
```

---

## Pages Inside Studio Layouts

Pages rendered inside a studio layout still follow the standard Container + Stack pattern from PAGE_BUILDING_RULES.md:

```tsx
export default function YourStudioPage() {
  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          eyebrow="THE LIFE I CHOOSE"
          title="Page Title"
          subtitle="Description"
        />
        <Card>Content</Card>
      </Stack>
    </Container>
  )
}
```

The `<main>` in the layout provides the outer padding. Container provides width constraints. Stack provides section spacing. Same as always.

---

## FullBleed Component

For sections inside `<main>` that need to go edge-to-edge on mobile (horizontal scrollers, full-width dividers, etc.), use the `FullBleed` component.

### How It Works

The studio layout's `<main>` sets a CSS custom property `--content-px` equal to its horizontal padding value. `FullBleed` reads that variable and expands by exactly that amount. They are always in sync -- change the padding in one place and FullBleed automatically adjusts.

### Import

```tsx
import { FullBleed } from '@/lib/design-system'
```

### Usage

```tsx
<FullBleed>
  <div className="flex gap-2 overflow-x-auto px-4 md:px-0 scrollbar-hide">
    {/* Scrollable pills, cards, etc. */}
  </div>
</FullBleed>
```

### Important: Inner Padding

FullBleed removes the parent's horizontal padding on mobile. If you need content inside the full-bleed section to still align with padded content above/below, re-apply `px-4 md:px-0` to the inner elements:

```tsx
<FullBleed>
  <section className="space-y-2">
    {/* Label stays aligned with other content */}
    <p className="px-4 md:px-0 text-sm text-neutral-500">Categories</p>
    {/* Scroller extends to screen edges */}
    <div className="flex gap-2 overflow-x-auto px-4 md:px-0 scrollbar-hide">
      {pills}
    </div>
  </section>
</FullBleed>
```

### When to Use FullBleed

- Horizontally scrollable pill strips / tag selectors
- Edge-to-edge dividers or background sections
- Any section that looks cramped within the mobile padding

### When NOT to Use FullBleed

- Regular content (text, forms, cards) -- these should respect the padding
- Desktop layouts -- FullBleed only applies on mobile (`md:mx-0`)
- Outside of studio layouts -- FullBleed requires the `--content-px` CSS variable

### Wrong Patterns

```tsx
// WRONG -- Hardcoded negative margins (breaks if padding changes)
<div className="-mx-4">
  <ScrollableSection />
</div>

// WRONG -- Using FullBleed without inner padding (content misaligned)
<FullBleed>
  <p>This label is now flush to screen edge</p>
  <div className="overflow-x-auto">{pills}</div>
</FullBleed>
```

---

## Adding --content-px to Other Studio Layouts

If you want FullBleed to work in other studio layouts (audio, life-vision, profile, etc.), add the CSS variable to their `<main>` element:

```tsx
<main
  className="flex-1 pt-6 pb-3 md:pt-8 md:pb-3 lg:pt-6 px-4 md:px-0"
  style={{ '--content-px': '1rem' } as React.CSSProperties}
>
  {children}
</main>
```

The value of `--content-px` must match the `px-4` class (1rem = 16px). If you change the padding class, update the variable to match.

---

## Reference Files

- **Studio Layouts**: `src/app/journal/layout.tsx`, `src/app/audio/layout.tsx`, `src/app/life-vision/layout.tsx`, `src/app/profile/layout.tsx`
- **FullBleed Component**: `src/lib/design-system/components/layout/FullBleed.tsx`
- **AreaBar Component**: `src/lib/design-system/components/navigation/AreaBar.tsx`
- **GlobalLayout**: `src/components/GlobalLayout.tsx`
- **Regular Page Rules**: `rules/PAGE_BUILDING_RULES.md`

---

## Quick Reference

### Studio Layout Pattern

```
StudioProvider
  AreaBar                 <-- outside <main>, full-width on mobile
  <main px-4 md:px-0>    <-- owns mobile padding, sets --content-px
    Container + Stack     <-- standard page structure
  </main>
```

### Golden Rules

1. **AreaBar outside `<main>`** -- never wrap it in a padding container
2. **`<main>` owns mobile padding** -- `px-4 md:px-0` with `--content-px: 1rem`
3. **Pages use Container + Stack** -- same as regular pages inside `<main>`
4. **FullBleed for edge-to-edge** -- wrap any section that needs to break out
5. **No hardcoded negative margins** -- always use FullBleed with CSS variables
6. **Re-apply inner padding** -- use `px-4 md:px-0` inside FullBleed for aligned content

---

**Last Updated**: April 25, 2026
**Version**: 1.0 - Studio Layout System
