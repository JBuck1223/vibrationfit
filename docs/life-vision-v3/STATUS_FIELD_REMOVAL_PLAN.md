# Status Field Removal Plan

**Last Updated:** November 12, 2025  
**Status:** 🔄 Ready to Execute  
**Goal:** Remove `status` field entirely, use only `is_draft` and `is_active`

---

## 🎯 Overview

**Why Remove?**
- ✅ Redundant with `is_draft` and `is_active` flags
- ✅ Confusing to have two state systems
- ✅ Cleaner, more consistent codebase

**What To Do:**
1. Remove `status` column from database
2. Update all TypeScript interfaces
3. Replace all `status` checks with `is_draft`/`is_active`
4. Update display logic for badges/labels

---

## 📋 Files to Update

### 1. **Database Migration**
✅ **Created:** `supabase/migrations/20251112000003_remove_status_field.sql`

```sql
ALTER TABLE "public"."vision_versions" DROP COLUMN IF EXISTS "status";
```

---

### 2. **TypeScript Interfaces (11 files)**

Remove `status: 'draft' | 'complete' | string` from interfaces in:

| File | Interface | Lines |
|------|-----------|-------|
| `src/app/life-vision/page.tsx` | `VisionData` | ~44 |
| `src/app/life-vision/[id]/page.tsx` | `VisionData` | ~52 |
| `src/app/life-vision/[id]/refine/page.tsx` | `VisionData` | ~69 |
| `src/app/life-vision/[id]/refine/draft/page.tsx` | `VisionData` | ~38 |
| `src/app/life-vision/[id]/experiment/page.tsx` | `VisionData` | ~40 |
| `src/app/life-vision/components/VisionVersionCard.tsx` | `version` prop | ~12 |
| `src/app/api/vision/route.ts` | Vision interfaces | Multiple |
| `src/lib/vision/draft-helpers.ts` | Vision types | Multiple |
| `src/lib/viva/vision-persistence.ts` | Vision types | Multiple |
| `src/lib/pdf/generators/vision.ts` | Vision interface | Multiple |
| `src/app/api/pdf/vision/route.ts` | Vision interface | Multiple |

---

### 3. **Status Field Usage (11 files with logic changes)**

#### **Display/Badge Logic**

**src/app/life-vision/page.tsx**
```typescript
// CURRENT:
const completedVisions = versions.filter(v => v.status === 'complete').length

// REPLACE WITH:
const completedVisions = versions.filter(v => !v.is_draft && v.is_active).length
```

---

**src/app/life-vision/[id]/page.tsx**
```typescript
// CURRENT (Line 653):
{vision.status === 'complete' ? (
  <Badge variant="success">Complete</Badge>
) : (
  <Badge variant="warning">Draft</Badge>
)}

// REPLACE WITH:
{!vision.is_draft ? (
  vision.is_active ? (
    <Badge variant="success">Active</Badge>
  ) : (
    <Badge variant="info">Complete</Badge>
  )
) : (
  <Badge variant="warning">Draft</Badge>
)}
```

```typescript
// CURRENT (Line 497):
status: isDraft ? 'draft' : 'complete'

// REPLACE WITH:
is_draft: isDraft,
is_active: !isDraft  // Only active if not draft
```

---

**src/app/life-vision/[id]/audio-sets/[audioSetId]/page.tsx**
```typescript
// CURRENT (Lines 228, 249):
{vision.status === 'complete' ? 'Active' : 'Draft'}

// REPLACE WITH:
{!vision.is_draft ? (vision.is_active ? 'Active' : 'Complete') : 'Draft'}
```

---

**src/app/life-vision/[id]/refine/draft/page.tsx**
```typescript
// CURRENT (Line 764):
version.status === 'draft' ? (
  <Button>Continue Editing</Button>
) : (
  <Button>View Vision</Button>
)

// REPLACE WITH:
version.is_draft ? (
  <Button>Continue Editing</Button>
) : (
  <Button>View Vision</Button>
)
```

---

**src/app/life-vision/components/VisionVersionCard.tsx**
```typescript
// CURRENT (Lines 52, 76, 81, 87):
version.status === 'complete' && isActive
version.status === 'draft' && !isDraftVersion
version.status === 'complete' && isActive && !isDraftVersion
version.status === 'complete' && !isActive && !isDraftVersion

// REPLACE WITH:
!version.is_draft && version.is_active
version.is_draft && !isDraftVersion
!version.is_draft && version.is_active && !isDraftVersion
!version.is_draft && !version.is_active && !isDraftVersion
```

---

**src/app/life-vision/refine/page.tsx**
```typescript
// CURRENT (Line 33):
.neq('status', 'draft')

// REPLACE WITH:
.eq('is_draft', false)
```

---

**src/app/life-vision/[id]/experiment/page.tsx**
```typescript
// CURRENT (Line 417):
{vision.status === 'complete' ? (
  <Badge variant="success">Complete</Badge>
) : (
  <Badge variant="warning">Draft</Badge>
)}

// REPLACE WITH:
{!vision.is_draft ? (
  vision.is_active ? (
    <Badge variant="success">Active</Badge>
  ) : (
    <Badge variant="info">Complete</Badge>
  )
) : (
  <Badge variant="warning">Draft</Badge>
)}
```

---

#### **Print/Export Logic**

**src/app/life-vision/[id]/print/html/route.ts**
```typescript
// CURRENT (Lines 251-252, 257, 283, 331-332):
background: ${vision.status === 'complete' ? primary : '#FFB701'}15;
border: 2px solid ${vision.status === 'complete' ? primary : '#FFB701'};
color: ${vision.status === 'complete' ? primary : '#FFB701'};
Version ${vision.version_number} • ${vision.status === 'complete' ? 'Complete' : 'Draft'}
${vision.status === 'complete' ? 'Complete' : 'Draft'}

// REPLACE WITH:
const isComplete = !vision.is_draft
const isActive = vision.is_active
const statusColor = isActive ? primary : (isComplete ? primary : '#FFB701')
const statusLabel = isActive ? 'Active' : (isComplete ? 'Complete' : 'Draft')

background: ${statusColor}15;
border: 2px solid ${statusColor};
color: ${statusColor};
Version ${vision.version_number} • ${statusLabel}
${statusLabel}
```

---

#### **Audio Generation**

**src/app/life-vision/[id]/audio/page.tsx**
```typescript
// CURRENT (Lines 72-73):
const hasCompletedVoice = tracks?.some((t: any) => t.status === 'completed')
const hasCompletedMixing = tracks?.some((t: any) => t.mix_status === 'completed')

// NOTE: This is AUDIO TRACK status, not vision status - KEEP AS IS
```

**src/app/life-vision/[id]/audio-generate/page.tsx**
```typescript
// CURRENT (Lines 131, 241, 569):
j.status === 'completed' && (j.mixStatus === 'completed' || j.mixStatus === 'not_required')
status: 'completed'
job.status === 'completed'

// NOTE: This is AUDIO JOB status, not vision status - KEEP AS IS
```

---

#### **API Routes**

**src/app/api/vision/draft/create/route.ts**
```typescript
// LIKELY HAS:
status: 'draft'

// REPLACE WITH:
is_draft: true,
is_active: false
```

**src/app/api/vision/draft/commit/route.ts**
```typescript
// LIKELY HAS:
status: 'complete'

// REPLACE WITH:
is_draft: false,
is_active: true
// + deactivate other active visions
```

---

### 4. **Helper Functions**

**src/lib/vision/draft-helpers.ts**
- Update any status-related helper functions
- Replace with is_draft/is_active checks

**src/lib/viva/vision-persistence.ts**
- Update vision persistence logic
- Remove status field from saved data

---

## 🔄 Replacement Pattern

### Simple Check
```typescript
// OLD
if (vision.status === 'complete')

// NEW
if (!vision.is_draft)
```

### Active vs Complete
```typescript
// OLD
vision.status === 'complete' ? 'Active' : 'Draft'

// NEW
!vision.is_draft ? (vision.is_active ? 'Active' : 'Complete') : 'Draft'
```

### Database Query
```typescript
// OLD
.eq('status', 'complete')
.neq('status', 'draft')

// NEW
.eq('is_draft', false)
.eq('is_draft', false).eq('is_active', true)  // For active only
```

---

## 📊 Summary

| Category | Count | Status |
|----------|-------|--------|
| **Database Migration** | 1 file | ✅ Created |
| **Interface Updates** | 11 files | 🔄 Pending |
| **Logic Updates** | 11 files | 🔄 Pending |
| **Total Files** | 22 files | 🔄 Ready |

---

## ✅ Testing Checklist

After removing status field:

### Creation Flow
- [ ] Assembly creates with `is_draft=true, is_active=false`
- [ ] Final updates to `is_draft=false, is_active=true`
- [ ] Other active visions deactivated

### Refinement Flow
- [ ] Draft created with `is_draft=true, is_active=false`
- [ ] Commit creates new version with `is_draft=false, is_active=true`
- [ ] Old version marked `is_active=false`

### Display
- [ ] Draft visions show "Draft" badge
- [ ] Active visions show "Active" badge
- [ ] Completed (non-active) visions show "Complete" badge
- [ ] Version history displays correctly

### Export/Print
- [ ] PDF exports show correct status label
- [ ] HTML print shows correct status badge
- [ ] Downloaded files have correct metadata

---

## 🚀 Execution Plan

1. **Run Migration** (user does manually)
   ```bash
   # Run: supabase/migrations/20251112000003_remove_status_field.sql
   ```

2. **Update Interfaces** (remove `status` field)
   - All VisionData interfaces
   - Version prop types

3. **Update Logic** (replace status checks)
   - Badge/display logic
   - Database queries
   - API routes

4. **Test** (verify all flows)
   - Creation flow
   - Refinement flow
   - View/display pages
   - Export/print

5. **Commit** (push to git)
   - One commit for all changes
   - Clear commit message

---

## 🎯 Benefits

After removal:
- ✅ Single source of truth (`is_draft` + `is_active`)
- ✅ No confusion between state systems
- ✅ Cleaner database schema
- ✅ Simpler queries
- ✅ Better UX (Active/Complete/Draft is clearer)

---

**Ready to execute?** All 22 files identified and mapped!

