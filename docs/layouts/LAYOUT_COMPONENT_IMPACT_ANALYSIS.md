# Layout Component Impact Analysis

## Usage Statistics Across Codebase

### Component Usage Counts:
- **Stack**: 524 occurrences (HIGH usage - most common)
- **Inline**: 36 occurrences (MODERATE usage)
- **Grid**: 43 occurrences (MODERATE usage)
- **TwoColumn**: 9 occurrences (LOW usage)
- **Switcher**: 6 occurrences (VERY LOW usage)
- **FourColumn**: 4 occurrences (VERY LOW usage)

### Total Files Using Design System: 107 files

---

## Impact Assessment by Component

### ✅ Stack (524 uses) - SAFE TO REFACTOR
**Impact**: HIGH usage but SAFE
- Used extensively across 107+ files
- Refactoring to Grid-backed Stack would be **invisible** to consumers
- Zero breaking changes - Stack API stays the same
- Example usage: `<Stack gap="md">` → Still works, just uses Grid internally

**Files Affected**: Nearly every page
- Home page (`/page.tsx`)
- Profile pages (`/profile/**`)
- Life Vision pages (`/life-vision/**`)
- Design system pages
- All component pages

**Risk Level**: 🟢 **LOW** - Wrapper approach means no breaking changes

---

### ✅ Inline (36 uses) - SAFE TO REFACTOR
**Impact**: MODERATE usage, SAFE
- Used for button groups, action bars, tags
- Can be Grid-backed with `mode="flex-row"`
- API remains identical

**Risk Level**: 🟢 **LOW** - Wrapper approach

---

### ✅ Grid (43 uses) - NO CHANGE
**Impact**: Core component - stays the same
- Already the foundation
- Enhanced to support responsiveCols prop
- No breaking changes

**Risk Level**: 🟢 **NONE** - Core component

---

### ⚠️ TwoColumn (9 uses) - LOW RISK
**Impact**: LOW usage, can be migrated
**Files Using TwoColumn:**
- Homepage guarantees section
- Design system templates
- A few other pages

**Migration Path**: 
```tsx
// Before
<TwoColumn gap="lg">...</TwoColumn>

// After (if we keep wrapper)
<TwoColumn gap="lg">...</TwoColumn> // Still works!

// Or direct Grid
<Grid responsiveCols={{mobile: 1, desktop: 2}} gap="lg">...</Grid>
```

**Risk Level**: 🟡 **LOW** - Small number of files, can migrate easily

---

### 🚨 FourColumn (4 uses) - SAFE TO DEPRECATE
**Impact**: VERY LOW usage - safe to deprecate
**Only Found In:**
- Design system examples
- Experimental pages

**Files:**
- `src/app/design-system/component/[componentName]/component-examples.tsx`
- `src/app/experiment/design-system/component/[componentName]/component-examples.tsx`

**Risk Level**: 🟢 **VERY LOW** - Only in documentation/examples

---

### 🚨 Switcher (6 uses) - SAFE TO DEPRECATE
**Impact**: VERY LOW usage - safe to deprecate
**Only Found In:**
- Homepage (`src/app/page.tsx`) - 2 instances
- Old experimental homepage
- Design system examples

**Files:**
- `src/app/page.tsx`
- `src/app/experiment/old-home/page.tsx`
- Design system component examples

**Risk Level**: 🟡 **LOW** - Used in homepage, but easy to replace

---

## Recommended Refactoring Strategy

### Phase 1: Unify Implementation (Zero Breaking Changes)
1. **Enhance Grid** with `responsiveCols` prop
2. **Refactor Stack** to use Grid internally (`cols={1}` or flex-col mode)
3. **Refactor Inline** to use Grid internally (flex-row mode)
4. **Refactor TwoColumn** to use Grid internally
5. **Result**: All components work exactly the same, but share one engine

### Phase 2: Deprecate Low-Usage Components
1. **Deprecate Switcher** - Replace with Grid
2. **Deprecate FourColumn** - Replace with Grid
3. **Add deprecation warnings** in console (development only)
4. **Provide migration guide**

### Phase 3: Documentation
1. Update design system docs
2. Add migration examples
3. Update templates

---

## Files That Would Need Changes

### If We Deprecate Switcher & FourColumn (Total: ~10 files)

**Switcher Replacements (6 uses):**
- `src/app/page.tsx` - 2 instances (homepage hero/navigation)
- `src/app/experiment/old-home/page.tsx` - 1 instance
- Design system examples - 3 instances

**FourColumn Replacements (4 uses):**
- Design system examples only - 4 instances

**Total Files Needing Manual Changes**: ~5-6 files (mainly homepage + examples)

---

## Risk Assessment Summary

| Component | Usage | Risk | Action |
|-----------|-------|------|--------|
| **Stack** | 524 | 🟢 LOW | Refactor to Grid wrapper (no breaking changes) |
| **Inline** | 36 | 🟢 LOW | Refactor to Grid wrapper (no breaking changes) |
| **Grid** | 43 | 🟢 NONE | Enhance with responsiveCols prop |
| **TwoColumn** | 9 | 🟡 LOW | Refactor to Grid wrapper OR migrate to Grid |
| **Switcher** | 6 | 🟡 LOW | Deprecate, replace with Grid (5-6 files) |
| **FourColumn** | 4 | 🟢 VERY LOW | Deprecate, replace with Grid (examples only) |

---

## Implementation Plan

### Step 1: Enhance Grid (Add responsiveCols)
- Add `responsiveCols?: {mobile?: number, tablet?: number, desktop?: number}` prop
- Generate Tailwind classes: `grid-cols-{mobile} md:grid-cols-{tablet} lg:grid-cols-{desktop}`
- Backward compatible - existing Grid usage unchanged

### Step 2: Create Wrapper Components
```tsx
// Stack becomes Grid wrapper
export const Stack = (props) => (
  <Grid mode="flex-col" {...props} />
)

// Inline becomes Grid wrapper  
export const Inline = (props) => (
  <Grid mode="flex-row" wrap {...props} />
)

// TwoColumn becomes Grid wrapper
export const TwoColumn = ({reverse, ...props}) => (
  <Grid 
    responsiveCols={{mobile: 1, desktop: 2}}
    className={reverse ? 'flex-col-reverse md:flex-row-reverse' : ''}
    {...props} 
  />
)
```

### Step 3: Deprecate & Replace
- Mark Switcher/FourColumn as deprecated
- Replace homepage Switcher uses with Grid
- Update design system examples

---

## Benefits

✅ **Unified Engine**: One Grid component powers everything
✅ **Zero Breaking Changes**: Stack/Inline/TwoColumn API unchanged
✅ **Easier Maintenance**: Fix Grid, all layouts benefit
✅ **Better Performance**: Single optimized implementation
✅ **Smaller Bundle**: Less duplicate code (minimal, but still better)
✅ **Future-Proof**: Easy to add new layout patterns

---

## Conclusion

**Impact is MINIMAL and SAFE:**
- 524 Stack uses: Zero breaking changes (wrapper approach)
- 36 Inline uses: Zero breaking changes (wrapper approach)
- 9 TwoColumn uses: Zero breaking changes (wrapper approach)
- 6 Switcher uses: ~5-6 files need Grid replacement (low risk)
- 4 FourColumn uses: Examples only (zero risk)

**Recommended Action**: ✅ Proceed with unified Grid approach

