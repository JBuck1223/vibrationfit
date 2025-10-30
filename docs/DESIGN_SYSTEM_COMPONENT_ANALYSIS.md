# Design System Component Analysis - Duplicate Functionality

## Analysis Date: January 2025

This document analyzes the VibrationFit design system components for duplicate or overlapping functionality.

---

## 🔍 Layout Component Overlap Analysis

### 1. **Switcher vs TwoColumn** ⚠️ PARTIAL OVERLAP

**Switcher:**
```tsx
className="flex flex-col md:flex-row"  // Flexbox
// Wraps children directly, no width constraints
```

**TwoColumn:**
```tsx
className="flex flex-col md:flex-row"  // Flexbox
// Wraps each child in: <div className="w-full md:w-1/2">
// Has reverse prop for mobile order reversal
```

**Overlap:**
- Both use the same flexbox pattern (`flex-col md:flex-row`)
- Both stack on mobile, row on desktop
- TwoColumn is **specifically optimized for 2 children** with fixed 50% widths
- Switcher is **more flexible** for any number of children

**Recommendation:**
- ✅ **Keep both** - They serve different use cases:
  - Use `TwoColumn` when you have exactly 2 items and want guaranteed 50/50 split
  - Use `Switcher` when you have multiple items that should flex naturally
- TwoColumn's `reverse` prop and fixed widths provide value that Switcher doesn't

---

### 2. **Grid vs FourColumn** ⚠️ SIGNIFICANT OVERLAP

**Grid:**
```tsx
// Can do fixed columns: cols={4}
// Or auto-fit: minWidth="280px"
// Uses CSS Grid: gridTemplateColumns: repeat(${cols}, 1fr)
```

**FourColumn:**
```tsx
className="grid grid-cols-2 md:grid-cols-4"  // CSS Grid
// Hardcoded to 2 cols mobile, 4 cols desktop
```

**Overlap:**
- FourColumn is **essentially a specific Grid configuration**
- Could be replaced by: `<Grid cols={4} className="grid-cols-2 md:grid-cols-4" />`
- FourColumn provides no unique functionality that Grid can't do

**Recommendation:**
- ⚠️ **Consider deprecating FourColumn** - It's redundant
- Grid can achieve the same with: `<Grid cols={4} className="!grid-cols-2 md:!grid-cols-4">` or a prop

---

### 3. **Stack vs TwoColumn (when used vertically)** ⚠️ MINOR OVERLAP

**Stack:**
```tsx
// Always vertical
// Uses flex-col
```

**TwoColumn (on mobile):**
```tsx
// flex-col on mobile (stacks)
// But forces w-full on children
```

**Overlap:**
- On mobile, TwoColumn behaves like Stack
- Stack is simpler and more semantic for vertical-only layouts

**Recommendation:**
- ✅ **Keep both** - Clear separation of purpose:
  - Stack: Always vertical, use for vertical lists/content
  - TwoColumn: Side-by-side on desktop, use for two-column layouts

---

### 4. **Inline vs Switcher** ⚠️ MINOR OVERLAP

**Inline:**
```tsx
className="flex flex-row"  // Always horizontal
// Never stacks to vertical
// Has wrap option
```

**Switcher:**
```tsx
className="flex flex-col md:flex-row"  // Stacks on mobile
```

**Overlap:**
- On desktop (md+), both create horizontal rows
- Inline is **always horizontal**, Switcher **responds to screen size**

**Recommendation:**
- ✅ **Keep both** - Different use cases:
  - Inline: Always stay horizontal, use for buttons/tags that wrap
  - Switcher: Responsive stacking, use for navigation/content that should stack on mobile

---

## 📊 Component Usage Analysis

### Usage Frequency (from codebase search):
- **Grid**: High usage (main layout component)
- **Stack**: High usage (main vertical layout)
- **Inline**: High usage (buttons, tags, horizontal items)
- **TwoColumn**: Moderate usage (two-column layouts)
- **Switcher**: Low usage ⚠️
- **FourColumn**: Very low usage ⚠️

---

## 🎯 Recommendations Summary

### Safe to Keep (Clear Separation):
1. ✅ **Stack** - Vertical-only, semantic
2. ✅ **Inline** - Always horizontal, wrapping
3. ✅ **Grid** - Flexible CSS Grid with auto-fit or fixed columns
4. ✅ **TwoColumn** - Optimized for 2 items with reverse option

### Consider Deprecating:
1. ⚠️ **FourColumn** - Redundant, can use Grid with `cols={4}`
2. ⚠️ **Switcher** - Low usage, could be replaced by:
   - Grid with `minWidth` for auto-wrapping
   - TwoColumn for 2-item cases
   - Custom className for specific cases

### Options for Switcher:
**Option A: Keep it**
- Provides semantic meaning ("switches layout")
- Good for navigation/menu items
- Simple API

**Option B: Deprecate it**
- Low usage suggests it's not needed
- Grid + TwoColumn cover most cases
- Reduces component surface area

**Option C: Enhance it**
- Make it more powerful (threshhold-based, not just md:)
- Add props for custom breakpoints
- Could replace TwoColumn's use cases too

---

## 🔧 Suggested Actions

1. **Immediate**: Document when to use each component clearly
2. **Short-term**: Monitor Switcher and FourColumn usage
3. **Long-term**: Consider consolidating FourColumn into Grid with a preset

---

## Component Purpose Matrix

| Component | Type | Mobile | Desktop | Children | When to Use |
|-----------|------|--------|---------|----------|-------------|
| **Stack** | Flex | Vertical | Vertical | Any | Vertical lists, content sections |
| **Inline** | Flex | Horizontal | Horizontal | Any | Buttons, tags, always-horizontal items |
| **Grid** | Grid | Auto-fit | Auto-fit/Fixed | Any | Cards, flexible grid layouts |
| **TwoColumn** | Flex | Stack | 50/50 | 2 | Side-by-side content (text/image) |
| **Switcher** | Flex | Stack | Row | Any | Navigation, items that stack on mobile |
| **FourColumn** | Grid | 2 cols | 4 cols | Any | Four-column layouts (can use Grid) |

---

## Conclusion

The overlap is **intentional semantic separation** in most cases:
- Switcher vs TwoColumn: Different use cases (flexible vs fixed 2-item)
- Grid vs FourColumn: FourColumn is redundant
- Inline vs Switcher: Different responsive behavior

**Main issue**: FourColumn provides no unique value over Grid.

**Secondary consideration**: Switcher has low usage and could potentially be replaced, but it does provide semantic value for "items that switch layout on mobile."

