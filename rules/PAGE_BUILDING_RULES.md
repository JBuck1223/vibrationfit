# Page Building Rules - VibrationFit Design System

## 🎯 Core Principle
**Every page must follow the Apple.com-style layout pattern: GlobalLayout provides PageLayout automatically. Individual pages should NEVER use PageLayout directly.**

---

## 📐 Layout Hierarchy

### ✅ CORRECT Structure (Always Use This)

```
GlobalLayout (automatic - wraps all pages)
  └─ PageLayout (automatic - provides padding)
      └─ Your Page Content
          └─ Container (optional - for width constraints, NO padding)
              └─ Your actual content
```

### ❌ WRONG Structure (Never Do This)

```
❌ <PageLayout>  ← DON'T! GlobalLayout already provides this
  <Container>
    ...
  </Container>
</PageLayout>
```

---

## 🏗️ Page Template

### Standard Page Structure

```tsx
'use client'

import { Container, Card, Button } from '@/lib/design-system/components'
// ... other imports

export default function YourPage() {
  // ... your logic

  return (
    <Container size="xl">
      {/* Your content here */}
    </Container>
  )
}
```

### Key Points:
- ✅ **NO** `<PageLayout>` wrapper - GlobalLayout provides it automatically
- ✅ Use `<Container>` when you need width constraints
- ✅ Use `size="xl"` for standard content (1600px max-width)
- ✅ Container has NO padding - uses PageLayout's padding automatically

---

## 📱 Mobile Design Rules

### 1. Text Sizes (Mobile-First)

```tsx
// ❌ WRONG - Fixed large text
<h1 className="text-4xl">Title</h1>

// ✅ CORRECT - Responsive text
<h1 className="text-2xl md:text-3xl lg:text-4xl">Title</h1>
```

**Rules:**
- Mobile: `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl` (max)
- Desktop: `text-xl`, `text-2xl`, `text-3xl`, `text-4xl`, `text-5xl`
- Always use responsive variants: `text-base md:text-lg lg:text-xl`

### 2. Spacing (Mobile-First)

```tsx
// ❌ WRONG - Fixed large spacing
<div className="mx-12 py-16">Content</div>

// ✅ CORRECT - Responsive spacing
<div className="mx-2 md:mx-4 lg:mx-8 py-4 md:py-8 lg:py-12">Content</div>
```

**Rules:**
- Mobile: `mx-1`, `mx-2`, `mx-3`, `mx-4` (max)
- Desktop: `mx-4`, `mx-6`, `mx-8`, `mx-12`
- Padding: `p-2`, `p-4`, `p-6` (mobile) → `p-6`, `p-8`, `p-12` (desktop)

### 3. Grid Layouts

```tsx
// ❌ WRONG - Fixed columns
<div className="grid grid-cols-3 gap-4">...</div>

// ✅ CORRECT - Responsive columns
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">...</div>
```

**Rules:**
- Always start with `grid-cols-1` for mobile
- Use `sm:grid-cols-2` for tablets
- Use `md:grid-cols-3` or `lg:grid-cols-4` for desktop

### 4. Button Sizes

```tsx
// ❌ WRONG - Fixed size
<Button>Click Me</Button>

// ✅ CORRECT - Responsive size
<Button size="sm">Click Me</Button>
```

**Rules:**
- Use `size="sm"` for most buttons (mobile-friendly)
- Use `size="md"` or `size="lg"` only when needed
- Buttons should stack vertically on mobile: `flex-col md:flex-row`

### 5. Card Padding

```tsx
// ❌ WRONG - Fixed padding
<Card className="p-8">Content</Card>

// ✅ CORRECT - Responsive padding
<Card className="p-4 md:p-6 lg:p-8">Content</Card>
```

**Rules:**
- Mobile: `p-4` or `p-6` (max)
- Desktop: `p-6`, `p-8`, `p-12`
- Always use responsive: `p-4 md:p-6 lg:p-8`

---

## 🎨 Design System Components

### Container Usage

```tsx
// ✅ CORRECT - Inside GlobalLayout (automatic PageLayout)
// Container automatically uses PageLayout's padding - no double padding!
<Container size="xl">
  <Card>Content</Card>
</Container>

// ✅ CORRECT - Standalone (if not using GlobalLayout - rare, like homepage)
// Standalone Container needs its own padding wrapper
<div className="px-4 sm:px-6 lg:px-8">
  <Container size="xl">
    <Card>Content</Card>
  </Container>
</div>
```

**Important**: Container has NO padding. It only constrains width. PageLayout provides all padding automatically.

**Container Sizes:**
- `sm`: `max-w-3xl` (768px)
- `md`: `max-w-5xl` (1024px)
- `default`: `max-w-7xl` (1280px)
- `lg`: `max-w-[1400px]`
- `xl`: `max-w-[1600px]` ← **Use this for standard pages**
- `full`: `max-w-full` (no constraint)

### Button Variants

```tsx
<Button variant="primary">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="accent">Premium/AI Feature</Button>
<Button variant="ghost">Subtle Action</Button>
<Button variant="outline">Tertiary Action</Button>
<Button variant="danger">Delete/Destructive</Button>
```

### Card Variants

```tsx
<Card variant="default">Standard Card</Card>
<Card variant="elevated">Elevated Card</Card>
<Card variant="outlined">Outlined Card</Card>
```

---

## 📋 Common Patterns

### Page Header

```tsx
<Container size="xl">
  {/* Header */}
  <div className="mb-8 md:mb-12">
    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-4">
      Page Title
    </h1>
    <p className="text-sm md:text-base text-neutral-400">
      Page description
    </p>
  </div>

  {/* Content */}
  <Card className="p-4 md:p-6 lg:p-8">
    ...
  </Card>
</Container>
```

### Action Buttons (Mobile-First)

```tsx
{/* Mobile: Stacked, Desktop: Inline */}
<div className="flex flex-col md:flex-row gap-2 md:gap-4">
  <Button variant="primary" size="sm" className="flex-1 md:flex-none">
    Primary Action
  </Button>
  <Button variant="secondary" size="sm" className="flex-1 md:flex-none">
    Secondary Action
  </Button>
</div>
```

### Loading States

```tsx
if (loading) {
  return (
    <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
      <Spinner size="lg" />
    </Container>
  )
}
```

### Error States

```tsx
if (error) {
  return (
    <Container>
      <Card className="text-center p-4 md:p-6 lg:p-8">
        <div className="text-red-500 mb-4">
          <AlertCircle className="w-12 h-12 mx-auto" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold mb-2">Error</h2>
        <p className="text-neutral-400 mb-6 text-sm md:text-base">{error}</p>
        <Button size="sm" onClick={retry}>Try Again</Button>
      </Card>
    </Container>
  )
}
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

// ✅ CORRECT - Container uses PageLayout's padding automatically
<Container>...</Container>
```

---

## ✅ Pre-Build Checklist

Before building a new page, ensure:

- [ ] **NO** `<PageLayout>` wrapper (GlobalLayout provides it)
- [ ] Use `<Container size="xl">` for content width constraints
- [ ] **NO** padding on Container (uses PageLayout's padding)
- [ ] All text sizes are responsive (`text-base md:text-lg`)
- [ ] All spacing is responsive (`p-4 md:p-6 lg:p-8`)
- [ ] Grid layouts start with `grid-cols-1` for mobile
- [ ] Buttons use `size="sm"` and stack on mobile
- [ ] Cards use responsive padding (`p-4 md:p-6 lg:p-8`)
- [ ] Loading/error states follow the patterns above
- [ ] Test on mobile viewport (375px width minimum)

---

## 📚 Reference Files

- **Layout Components**: `src/lib/design-system/components.tsx`
- **Global Layout**: `src/components/GlobalLayout.tsx`
- **Design System Guide**: `VibrationFit Design System Guide.md`
- **Mobile Rules**: See RESPONSIVE DESIGN GUIDELINES in `components.tsx`

---

## 🎯 Quick Reference

### Standard Page Template

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Container, Card, Button, Spinner } from '@/lib/design-system/components'

export default function YourPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  useEffect(() => {
    // Fetch data
    fetchData().then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  return (
    <Container size="xl">
      {/* Header */}
      <div className="mb-8 md:mb-12">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-4">
          Page Title
        </h1>
        <p className="text-sm md:text-base text-neutral-400">
          Description
        </p>
      </div>

      {/* Content */}
      <Card className="p-4 md:p-6 lg:p-8">
        {/* Your content */}
      </Card>
    </Container>
  )
}
```

---

## 🚨 Remember

1. **GlobalLayout wraps ALL pages** - Never add PageLayout manually
2. **Container has NO padding** - Uses PageLayout's padding automatically
3. **Mobile-first always** - Start with mobile, then add desktop styles
4. **Test on 375px** - Minimum mobile viewport width
5. **Use design system components** - Don't create custom layouts

---

**Last Updated**: 2025-01-31
**Version**: 1.0



