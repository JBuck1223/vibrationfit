# Agent Page Building Guide - VibrationFit
## Complete Guide for Building Perfect Pages From Scratch

> **🎯 Goal**: Build pages that follow the design system, mobile rules, and layout hierarchy perfectly on the first try.

---

## 📚 Quick Reference Documents

Before building, read these in order:
1. **This document** - Complete building guide
2. `rules/PAGE_BUILDING_RULES.md` - Layout hierarchy & patterns
3. `rules/mobile-design-rules.md` - Mobile-first requirements
4. `VibrationFit_Design_System_Overview.md` - Full design system reference

---

## 🚀 Start Here: Copy-Paste Template

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Container, Card, Button, Spinner, Heading, Text } from '@/lib/design-system/components'

export default function YourPageName() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch data
    fetchData()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  // Loading state
  if (loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  // Error state
  if (error) {
    return (
      <Container>
        <Card className="text-center p-4 md:p-6 lg:p-8">
          <div className="text-red-500 mb-4">
            <AlertCircle className="w-12 h-12 mx-auto" />
          </div>
          <Heading level={2} className="mb-2">Error</Heading>
          <Text size="sm" className="text-neutral-400 mb-6">{error}</Text>
          <Button size="sm" onClick={() => window.location.reload()}>Try Again</Button>
        </Card>
      </Container>
    )
  }

  // Main content
  return (
    <Container size="xl">
      {/* Header */}
      <div className="mb-8 md:mb-12">
        <Heading level={1} className="text-2xl md:text-3xl lg:text-4xl mb-2 md:mb-4">
          Page Title
        </Heading>
        <Text size="sm" className="text-neutral-400">
          Page description
        </Text>
      </div>

      {/* Content */}
      <Card className="p-4 md:p-6 lg:p-8">
        {/* Your content here */}
      </Card>
    </Container>
  )
}
```

---

## ✅ The 3 Critical Rules

### 1. **NEVER Use PageLayout**
```tsx
// ❌ WRONG - GlobalLayout already provides PageLayout
<PageLayout>
  <Container>...</Container>
</PageLayout>

// ✅ CORRECT - GlobalLayout provides PageLayout automatically
<Container size="xl">
  ...
</Container>
```

**Why**: `GlobalLayout` wraps ALL pages and provides `PageLayout` automatically. Using it again causes double padding.

### 2. **Container Has NO Padding**
```tsx
// ❌ WRONG - Container doesn't have padding
<Container className="px-4">...</Container>

// ✅ CORRECT - Container uses PageLayout's padding automatically
<Container size="xl">
  ...
</Container>
```

**Why**: `Container` only constrains width. `PageLayout` provides all padding automatically.

### 3. **Mobile-First ALWAYS**
```tsx
// ❌ WRONG - Fixed sizes
<h1 className="text-4xl">Title</h1>
<div className="p-12">Content</div>

// ✅ CORRECT - Responsive sizes
<h1 className="text-2xl md:text-3xl lg:text-4xl">Title</h1>
<div className="p-4 md:p-6 lg:p-8">Content</div>
```

**Why**: Mobile users first. Start small, enhance for desktop.

---

## 📐 Layout Hierarchy (Apple.com Style)

```
GlobalLayout (automatic - wraps all pages)
  └─ PageLayout (automatic - provides padding: px-4 sm:px-6 lg:px-8)
      └─ Your Page Component
          └─ Container (optional - constrains width, NO padding)
              └─ Your Content
```

### When to Use Container

**✅ Use Container when:**
- You want to constrain content width (max-width)
- You have standard page content that shouldn't span full width
- Most pages should use this

**❌ Don't use Container when:**
- You want full-width sections (like hero sections)
- Content should span edge-to-edge

---

## 📱 Mobile Design Rules Summary

### Text Sizes
```tsx
// Mobile: text-xs, text-sm, text-base, text-lg, text-xl (max)
// Desktop: text-xl, text-2xl, text-3xl, text-4xl, text-5xl
// Always responsive:
<h1 className="text-2xl md:text-3xl lg:text-4xl">Title</h1>
<p className="text-sm md:text-base">Body text</p>
```

### Spacing
```tsx
// Mobile: mx-1, mx-2, mx-3, mx-4 (max)
// Desktop: mx-4, mx-6, mx-8, mx-12
// Always responsive:
<div className="mx-2 md:mx-4 lg:mx-8">Content</div>
```

### Padding
```tsx
// Mobile: p-2, p-4, p-6 (max)
// Desktop: p-6, p-8, p-12, p-16
// Always responsive:
<Card className="p-4 md:p-6 lg:p-8">Content</Card>
```

### Grids
```tsx
// Always start with grid-cols-1 for mobile
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  ...
</div>
```

### Buttons
```tsx
// Use size="sm" for mobile-friendly buttons
<Button size="sm">Action</Button>

// Stack on mobile, inline on desktop
<div className="flex flex-col md:flex-row gap-2 md:gap-4">
  <Button size="sm" className="flex-1 md:flex-none">Action 1</Button>
  <Button size="sm" className="flex-1 md:flex-none">Action 2</Button>
</div>
```

---

## 🎨 Design System Components

### Container
```tsx
<Container size="xl">  {/* Standard: max-w-1600px */}
<Container size="lg">  {/* Narrower: max-w-1400px */}
<Container size="default">  {/* Default: max-w-1280px */}
<Container size="sm">  {/* Small: max-w-768px */}
```

### Button
```tsx
<Button variant="primary" size="sm">Primary Action</Button>
<Button variant="secondary" size="sm">Secondary</Button>
<Button variant="accent" size="sm">Premium/AI</Button>
<Button variant="ghost" size="sm">Subtle</Button>
<Button variant="outline" size="sm">Tertiary</Button>
<Button variant="danger" size="sm">Delete</Button>
```

### Card
```tsx
<Card className="p-4 md:p-6 lg:p-8">Standard Card</Card>
<Card variant="elevated" className="p-4 md:p-6 lg:p-8">Elevated</Card>
<Card variant="outlined" className="p-4 md:p-6 lg:p-8">Outlined</Card>
```

### Typography
```tsx
<Heading level={1} className="text-2xl md:text-3xl lg:text-4xl">H1</Heading>
<Heading level={2} className="text-xl md:text-2xl lg:text-3xl">H2</Heading>
<Heading level={3} className="text-lg md:text-xl lg:text-2xl">H3</Heading>
<Text size="sm">Small text</Text>
<Text size="base">Base text</Text>
<Text size="lg">Large text</Text>
```

---

## 📋 Common Patterns

### Page Header
```tsx
<div className="mb-8 md:mb-12">
  <Heading level={1} className="text-2xl md:text-3xl lg:text-4xl mb-2 md:mb-4">
    Page Title
  </Heading>
  <Text size="sm" className="text-neutral-400">
    Description
  </Text>
</div>
```

### Action Buttons
```tsx
<div className="flex flex-col md:flex-row gap-2 md:gap-4">
  <Button variant="primary" size="sm" className="flex-1 md:flex-none">
    Primary Action
  </Button>
  <Button variant="secondary" size="sm" className="flex-1 md:flex-none">
    Secondary Action
  </Button>
</div>
```

### Loading State
```tsx
if (loading) {
  return (
    <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
      <Spinner size="lg" />
    </Container>
  )
}
```

### Error State
```tsx
if (error) {
  return (
    <Container>
      <Card className="text-center p-4 md:p-6 lg:p-8">
        <div className="text-red-500 mb-4">
          <AlertCircle className="w-12 h-12 mx-auto" />
        </div>
        <Heading level={2} className="mb-2">Error</Heading>
        <Text size="sm" className="text-neutral-400 mb-6">{error}</Text>
        <Button size="sm" onClick={retry}>Try Again</Button>
      </Card>
    </Container>
  )
}
```

### Empty State
```tsx
<Card className="text-center p-4 md:p-6 lg:p-8">
  <div className="text-neutral-500 mb-4">
    <Inbox className="w-12 h-12 mx-auto" />
  </div>
  <Heading level={3} className="mb-2">No Items</Heading>
  <Text size="sm" className="text-neutral-400 mb-6">
    Get started by adding your first item.
  </Text>
  <Button size="sm" onClick={onCreate}>Create Item</Button>
</Card>
```

### Grid of Cards
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
  {items.map((item) => (
    <Card key={item.id} className="p-4 md:p-6">
      {/* Card content */}
    </Card>
  ))}
</div>
```

---

## ❌ Common Mistakes to Avoid

### 1. Double PageLayout
```tsx
// ❌ WRONG
<PageLayout>
  <Container>...</Container>
</PageLayout>

// ✅ CORRECT
<Container>...</Container>
```

### 2. Fixed Text Sizes
```tsx
// ❌ WRONG
<h1 className="text-4xl">Title</h1>

// ✅ CORRECT
<h1 className="text-2xl md:text-3xl lg:text-4xl">Title</h1>
```

### 3. Fixed Grid Columns
```tsx
// ❌ WRONG
<div className="grid grid-cols-3">...</div>

// ✅ CORRECT
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">...</div>
```

### 4. Excessive Padding
```tsx
// ❌ WRONG
<div className="p-12">Content</div>

// ✅ CORRECT
<div className="p-4 md:p-6 lg:p-8">Content</div>
```

### 5. Missing Container
```tsx
// ❌ WRONG - Content spans full width
<div>
  <Card>Content</Card>
</div>

// ✅ CORRECT - Content constrained
<Container size="xl">
  <Card>Content</Card>
</Container>
```

### 6. Adding Padding to Container
```tsx
// ❌ WRONG - Container doesn't need padding
<Container className="px-4">...</Container>

// ✅ CORRECT - Container uses PageLayout's padding
<Container>...</Container>
```

---

## ✅ Pre-Build Checklist

Before building a new page, verify:

- [ ] **NO** `<PageLayout>` wrapper in the page component
- [ ] Using `<Container size="xl">` for content width constraints
- [ ] **NO** padding classes on Container (uses PageLayout's padding)
- [ ] All text sizes are responsive (`text-base md:text-lg`)
- [ ] All spacing is responsive (`p-4 md:p-6 lg:p-8`)
- [ ] Grid layouts start with `grid-cols-1` for mobile
- [ ] Buttons use `size="sm"` and stack on mobile
- [ ] Cards use responsive padding (`p-4 md:p-6 lg:p-8`)
- [ ] Loading/error/empty states follow patterns above
- [ ] Test on mobile viewport (375px width minimum)

---

## 🧪 Testing Checklist

After building, test:

- [ ] Page renders without errors
- [ ] No double padding (check browser DevTools)
- [ ] Content doesn't overflow on mobile (375px)
- [ ] Text is readable on mobile
- [ ] Buttons are tappable on mobile (min 44px height)
- [ ] Grid cards stack properly on mobile
- [ ] Spacing looks good on mobile and desktop
- [ ] Loading states work correctly
- [ ] Error states display properly

---

## 📖 Component Reference

### From `@/lib/design-system/components`

**Layout:**
- `Container` - Width constraint (no padding)
- `Stack` - Vertical layout
- `Grid` - Responsive grid
- `TwoColumn` - Two-column layout

**Components:**
- `Button` - All button variants
- `Card` - Card containers
- `Badge` - Status badges
- `Spinner` - Loading indicator
- `Heading` - Typography headings
- `Text` - Body text
- `Input` - Form inputs
- `Textarea` - Text areas

**Full list**: See `src/lib/design-system/components.tsx`

---

## 🎯 Quick Command Reference

When an agent asks you to build a page, use this template:

```tsx
'use client'

import { Container, Card, Button } from '@/lib/design-system/components'

export default function PageName() {
  return (
    <Container size="xl">
      {/* Content */}
    </Container>
  )
}
```

**Remember:**
1. NO PageLayout wrapper
2. Use Container for width constraints
3. Mobile-first responsive everything
4. Test on 375px width

---

## 📚 Additional Resources

- **Layout Rules**: `rules/PAGE_BUILDING_RULES.md`
- **Mobile Rules**: `rules/mobile-design-rules.md`
- **Design System**: `VibrationFit_Design_System_Overview.md`
- **Components**: `src/lib/design-system/components.tsx`
- **Design Showcase**: `/design-system` page (live examples)

---

**Last Updated**: 2025-01-31  
**Version**: 1.0  
**Status**: Authoritative Guide

