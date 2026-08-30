# 🎯 Agent Rules & Quick References

**Quick-access rules for AI agents building pages in VibrationFit.**

---

## 📋 Files in This Folder

| File | Purpose | When to Use |
|------|---------|-------------|
| **AGENT_QUICK_START.md** | Studio vs standalone templates | **START HERE!** Every new page |
| **PAGE_BUILDING_RULES.md** | Page chrome + Container/Stack | When you need full details |
| **STUDIO_PAGE_BUILDING_RULES.md** | AreaBar layouts (Life Vision, Admin, …) | Any multi-route area |
| **mobile-design-rules.md** | Mobile-first design requirements | Before building ANY component |
| **CATEGORY_MAPPING_SYSTEM.md** | 🔒 Category key conversion system | **CRITICAL!** Before using any category keys |

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

- `rules/AGENT_QUICK_START.md` - Start here
- `rules/PAGE_BUILDING_RULES.md` - Chrome + layout
- `rules/STUDIO_PAGE_BUILDING_RULES.md` - AreaBar studios (including admin)
- `docs/design-system/PAGE_BUILDING_RULES.md` - Pointer to the canonical rules

---

## Non-negotiable

1. **NO PageLayout** — GlobalLayout provides it automatically
2. **NO boxed PageHero** — AreaBar for studios; slim title for standalone pages
3. **Container has NO padding** — PageLayout / studio `<main>` own it
4. **Mobile-first ALWAYS**

---

## 🎨 Quick Template

Studio pages: AreaBar in the layout, Container + Stack in the page, **no PageHero**.

Standalone pages: slim `PageHero` (title row) or a plain `h1`. Never a gradient header card.

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

### CATEGORY_MAPPING_SYSTEM.md
- ✅ **🚨 CRITICAL:** Using category keys anywhere
- ✅ Converting between assessment/vision/recording/profile keys
- ✅ Working with profile sections, audio, assessments
- ✅ Dealing with legacy data ('romance', 'business', 'possessions')

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

