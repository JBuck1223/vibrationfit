# 🎨 Design System & Page Building Documentation

**Complete documentation for VibrationFit's design system, components, and page building rules.**

---

## 📋 Quick Navigation

| Category | Files | Purpose |
|----------|-------|---------|
| **Page Building** | 2 files | How to build pages correctly |
| **Mobile Rules** | 2 files | Mobile-first design requirements |
| **Design System** | 3 files | Component analysis & examples |

**Total:** 7 documentation files

---

## 🚀 Quick Start (For Agents Building Pages)

### Essential Reading Order:
1. **`AGENT_PAGE_BUILDING_GUIDE.md`** ← **START HERE!**
2. **`mobile-design-rules.md`** ← Critical for mobile
3. **`PAGE_BUILDING_RULES.md`** ← Full details when needed

**Or use quick reference:** `/rules/AGENT_QUICK_START.md` (40 lines, ultra-fast)

---

## 📁 Files in This Folder

### Page Building Guides

#### **AGENT_PAGE_BUILDING_GUIDE.md**
**Complete page building guide for AI agents**
- Page template
- 3 non-negotiable rules
- Common patterns (headers, buttons, loading, error states)
- Pre-build checklist
- Quick reference

**When to use:** Building ANY new page

---

#### **PAGE_BUILDING_RULES.md** (424 lines)
**Comprehensive page building rulebook**
- Layout hierarchy explained
- Container usage details
- Mobile design rules
- Design system components
- Common patterns with code
- Mistakes to avoid
- Pre-build checklist

**When to use:** Need detailed examples or understanding WHY

---

### Mobile-First Design

#### **mobile-design-rules.md** (127 lines)
**Mobile-first design rules (CRITICAL!)**
- 🚨 3 critical rules NEVER to violate
- Card layout rules
- Button rules
- Text and content rules
- Icon rules
- Container rules
- Mobile testing checklist
- Common anti-patterns to avoid

**When to use:** Before building ANY component

---

#### **MOBILE_DESIGN_SYSTEM_GUIDE.md**
**Complete mobile design system guide**
- Mobile-first principles
- Component usage patterns
- Responsive breakpoints
- Mobile testing checklist

**When to use:** Comprehensive mobile reference

---

### Design System Analysis

#### **DESIGN_SYSTEM_COMPONENT_ANALYSIS.md**
**Analysis of design system components**
- Component inventory
- Usage patterns
- Best practices

**When to use:** Understanding component architecture

---

#### **DESIGN_SYSTEM_EXAMPLES_FIXES.md**
**Fixed design system examples**
- Before/after comparisons
- Common fixes
- Pattern improvements

**When to use:** Learning from past mistakes

---

#### **DESIGN_SYSTEM_INDEX.md**
**Index of design system documentation**
- Documentation map
- Component locations
- Quick links

**When to use:** Finding specific components

---

## ✅ The 3 Non-Negotiable Rules

### **Rule #1: NO PageLayout**
GlobalLayout provides PageLayout automatically. **Never** wrap pages in `<PageLayout>`.

```tsx
// ❌ WRONG
<PageLayout>
  <Container>...</Container>
</PageLayout>

// ✅ CORRECT
<Container>...</Container>
```

### **Rule #2: Container has NO padding**
Container uses PageLayout's padding automatically. **Never** add padding to Container.

```tsx
// ❌ WRONG
<Container className="px-4">...</Container>

// ✅ CORRECT
<Container>...</Container>
```

### **Rule #3: Mobile-first ALWAYS**
Start with mobile, then add desktop styles. **Always** use responsive classes.

```tsx
// ❌ WRONG
<h1 className="text-4xl">Title</h1>

// ✅ CORRECT
<h1 className="text-2xl md:text-3xl lg:text-4xl">Title</h1>
```

---

## 🎯 Quick Page Template

```tsx
'use client'

import { Container, Card, Button, Spinner } from '@/lib/design-system/components'

export default function YourPage() {
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

## 📚 Related Documentation

### In This Repo:
- **Quick Rules**: `/rules/` folder (for fast access)
- **Component Code**: `src/lib/design-system/components.tsx`
- **Global Layout**: `src/components/GlobalLayout.tsx`
- **Cursor Rules**: `.cursorrules` (lines 96-445)

### In Docs:
- **Architecture**: `docs/architecture/`
- **UI Components**: `docs/ui-components/`
- **Layouts**: `docs/layouts/`

---

## 🔍 Finding What You Need

### Need to build a page?
→ Start with `AGENT_PAGE_BUILDING_GUIDE.md`

### Need mobile rules?
→ Read `mobile-design-rules.md` (127 lines, essential)

### Need full details?
→ `PAGE_BUILDING_RULES.md` (424 lines, comprehensive)

### Need quick reference?
→ `/rules/AGENT_QUICK_START.md` (40 lines, fastest)

### Need component details?
→ `src/lib/design-system/components.tsx` (actual code)

---

## ✨ Key Principles

1. **GlobalLayout wraps all pages** - Provides PageLayout automatically
2. **Container has NO padding** - Uses PageLayout's padding
3. **Mobile-first always** - Start mobile, enhance for desktop
4. **Use design system components** - Don't create custom layouts
5. **Test on 375px minimum** - Smallest mobile viewport

---

## 🚨 Common Mistakes to Avoid

1. ❌ **Double PageLayout** - GlobalLayout already provides it
2. ❌ **Adding padding to Container** - It uses PageLayout's padding
3. ❌ **Fixed text sizes** - Always use responsive (`text-base md:text-lg`)
4. ❌ **Fixed grid columns** - Always start with `grid-cols-1` for mobile
5. ❌ **Excessive padding** - Use responsive (`p-4 md:p-6 lg:p-8`)
6. ❌ **Missing Container** - Content needs width constraints
7. ❌ **Ignoring mobile** - Test everything on 375px viewport

---

## 📊 Documentation Stats

| Category | Files | Lines | Purpose |
|----------|-------|-------|---------|
| Page Building | 2 | ~860 | How to build pages |
| Mobile Rules | 2 | ~250 | Mobile-first design |
| Design System | 3 | ~500 | Component reference |
| **Total** | **7** | **~1,610** | Complete guide |

---

**Last Updated:** November 12, 2025  
**Version:** 2.0 (Consolidated from multiple sources)

**Remember:** Start with the quick guide, reference the details when needed! 🚀

