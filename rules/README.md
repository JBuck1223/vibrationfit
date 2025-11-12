# 🎯 Agent Rules & Quick References

**Quick-access rules for AI agents building pages in VibrationFit.**

---

## 📋 Files in This Folder

| File | Purpose | When to Use |
|------|---------|-------------|
| **AGENT_QUICK_START.md** | Ultra-quick page template + 3 rules | **START HERE!** Every new page |
| **PAGE_BUILDING_RULES.md** | Complete page building guide | When you need full details |
| **mobile-design-rules.md** | Mobile-first design requirements | Before building ANY component |

---

## 🚀 Quick Start for Agents

### Building a New Page? Read This:

1. **Read:** `AGENT_QUICK_START.md` (40 lines) ← **START HERE**
2. **Copy:** The page template
3. **Follow:** The 3 non-negotiable rules
4. **Build:** Your page

That's it! 🎉

---

## 📚 Complete Documentation

**All rules are also available in `docs/design-system/` for comprehensive reference:**

- `docs/design-system/AGENT_PAGE_BUILDING_GUIDE.md` - Complete guide
- `docs/design-system/PAGE_BUILDING_RULES.md` - Full page rules
- `docs/design-system/mobile-design-rules.md` - Mobile requirements
- `docs/design-system/MOBILE_DESIGN_SYSTEM_GUIDE.md` - Mobile system

---

## ✅ The 3 Non-Negotiable Rules

1. **NO PageLayout** - GlobalLayout provides it automatically
2. **Container has NO padding** - Uses PageLayout's padding automatically
3. **Mobile-first ALWAYS** - Responsive everything

---

## 🎨 Quick Template

```tsx
'use client'

import { Container, Card, Button, Spinner } from '@/lib/design-system/components'

export default function YourPage() {
  return (
    <Container size="xl">
      {/* Your content */}
    </Container>
  )
}
```

---

## 🔍 When to Use Each File

### AGENT_QUICK_START.md
- ✅ Starting a new page
- ✅ Need template quickly
- ✅ Don't remember the 3 rules

### PAGE_BUILDING_RULES.md
- ✅ Need detailed examples
- ✅ Building complex layouts
- ✅ Want to understand WHY

### mobile-design-rules.md
- ✅ Building cards or grids
- ✅ Making buttons or forms
- ✅ Need responsive patterns

---

## 🎯 Purpose of This Folder

**This `rules/` folder exists for SPEED.**

When agents are building pages, they need:
1. **Fast access** - No digging through docs
2. **Essential rules** - Not everything, just what matters
3. **Quick templates** - Copy/paste and go

For comprehensive documentation, see `docs/design-system/`.

---

## 📖 Related Documentation

- **Design System Components**: `src/lib/design-system/components.tsx`
- **Design System Guide**: `.cursorrules` (lines 96-445)
- **Full Docs Index**: `docs/README.md`

---

**Remember:** Start with `AGENT_QUICK_START.md`. It has everything you need! 🚀

