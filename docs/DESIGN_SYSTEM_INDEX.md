# VibrationFit Design System - Complete Index

## 🎯 Start Here for Building Pages

**For Agents Building New Pages:**
1. **Read First**: `rules/AGENT_QUICK_START.md` (2-minute read)
2. **Full Guide**: `docs/AGENT_PAGE_BUILDING_GUIDE.md` (complete reference)
3. **Page Rules**: `rules/PAGE_BUILDING_RULES.md` (layout patterns)
4. **Mobile Rules**: `rules/mobile-design-rules.md` (mobile requirements)

---

## 📚 Document Structure

### Quick References (Start Here)
- **`rules/AGENT_QUICK_START.md`** ⚡ - One-page quick start guide
- **`docs/AGENT_PAGE_BUILDING_GUIDE.md`** 📖 - Complete building guide with templates

### Core Rules
- **`rules/PAGE_BUILDING_RULES.md`** 📐 - Layout hierarchy & page patterns
- **`rules/mobile-design-rules.md`** 📱 - Mobile-first design rules

### Design System Reference
- **`VibrationFit_Design_System_Overview.md`** 🎨 - Complete design system overview
- **`docs/MOBILE_DESIGN_SYSTEM_GUIDE.md`** 📱 - Mobile utilities & patterns
- **`src/lib/design-system/components.tsx`** 💻 - Component source code

### Implementation
- **`src/components/GlobalLayout.tsx`** 🏗️ - Global layout wrapper
- **`src/lib/design-system/components.tsx`** 🧩 - Component library
- **`src/lib/design-system/tokens.ts`** 🎨 - Design tokens

---

## 🚀 Quick Commands for Agents

### Building a New Page

```bash
# 1. Read the quick start (2 minutes)
# File: rules/AGENT_QUICK_START.md

# 2. Copy the template from:
# File: docs/AGENT_PAGE_BUILDING_GUIDE.md

# 3. Follow the 3 critical rules:
# - NO PageLayout
# - Container has NO padding
# - Mobile-first responsive
```

### Template to Copy

```tsx
'use client'

import { Container, Card, Button } from '@/lib/design-system/components'

export default function YourPage() {
  return (
    <Container size="xl">
      {/* Your content */}
    </Container>
  )
}
```

---

## ✅ The 3 Critical Rules

1. **NO PageLayout** - GlobalLayout provides it automatically
2. **Container has NO padding** - Uses PageLayout's padding automatically
3. **Mobile-first ALWAYS** - Responsive everything

---

## 📱 Mobile Rules Summary

- **Text**: Always responsive (`text-2xl md:text-3xl lg:text-4xl`)
- **Padding**: Always responsive (`p-4 md:p-6 lg:p-8`)
- **Grids**: Always start with `grid-cols-1` for mobile
- **Buttons**: Use `size="sm"` (mobile-friendly)
- **Test**: Always test on 375px width (iPhone SE)

---

## 🎨 Design System Components

### Layout
- `Container` - Width constraint (no padding)
- `Stack` - Vertical layout
- `Grid` - Responsive grid

### Components
- `Button` - All variants (primary, secondary, accent, etc.)
- `Card` - Card containers
- `Badge` - Status badges
- `Spinner` - Loading indicator
- `Heading` - Typography headings
- `Text` - Body text

**Full list**: `src/lib/design-system/components.tsx`

---

## 📋 Pre-Build Checklist

- [ ] Read `rules/AGENT_QUICK_START.md`
- [ ] NO `<PageLayout>` wrapper
- [ ] Use `<Container size="xl">` for content
- [ ] NO padding on Container
- [ ] All text responsive
- [ ] All spacing responsive
- [ ] Grids start with `grid-cols-1`
- [ ] Buttons use `size="sm"`
- [ ] Test on 375px width

---

## 🔍 Finding What You Need

### "How do I build a page?"
→ Read `rules/AGENT_QUICK_START.md` or `docs/AGENT_PAGE_BUILDING_GUIDE.md`

### "What's the layout structure?"
→ Read `rules/PAGE_BUILDING_RULES.md`

### "What are the mobile rules?"
→ Read `rules/mobile-design-rules.md`

### "What components are available?"
→ Read `VibrationFit_Design_System_Overview.md` or check `src/lib/design-system/components.tsx`

### "How do I use Container?"
→ Read `rules/PAGE_BUILDING_RULES.md` section on Container

### "What are the color tokens?"
→ Read `VibrationFit_Design_System_Overview.md` Color System section

---

## 🎯 Document Purpose

| Document | Purpose | When to Use |
|----------|---------|-------------|
| `rules/AGENT_QUICK_START.md` | Quick reference | Building a simple page |
| `docs/AGENT_PAGE_BUILDING_GUIDE.md` | Complete guide | Building complex pages |
| `rules/PAGE_BUILDING_RULES.md` | Layout patterns | Understanding structure |
| `rules/mobile-design-rules.md` | Mobile requirements | Ensuring mobile compliance |
| `VibrationFit_Design_System_Overview.md` | Full system reference | Deep dive into design system |

---

## 📖 Additional Resources

- **Live Examples**: Visit `/design-system` page in the app
- **Component Source**: `src/lib/design-system/components.tsx`
- **Design Tokens**: `src/lib/design-system/tokens.ts`
- **Global Layout**: `src/components/GlobalLayout.tsx`

---

**Last Updated**: 2025-01-31  
**Version**: 1.0  
**Maintained By**: VibrationFit Design System Team




