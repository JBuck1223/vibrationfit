# Household Vision Implementation Plan

**Last Updated:** December 13, 2024  
**Status:** Planning  

## 🎯 Overview

Implement household-level Life Visions that can be created and shared by household members (couples, families). These visions use "we/our" perspective instead of "I/my" and are accessible to all household members.

---

## 📊 Current State Analysis (Based on Actual Schema)

### ✅ What's Already Built

| Component | Status | Location |
|-----------|--------|----------|
| **Households Table** | ✅ Live | `households` (id, name, admin_user_id, max_members, shared_tokens_enabled) |
| **Household Members** | ✅ Live | `household_members` (household_id, user_id, role, status) |
| **Household Settings UI** | ✅ Live | `/household/settings` - invite members, manage tokens |
| **Household Invitations** | ✅ Live | Email invites, acceptance flow |
| **Shared Tokens** | ✅ Live | Token pool that household members can share |
| **Perspective Field** | ✅ Live | `vision_versions.perspective` ('singular' or 'plural') |
| **Parent ID Field** | ✅ Live | `vision_versions.parent_id` (tracks cloned visions) |
| **Stripe Integration** | ✅ Live | Creates households on "household" plan purchase |
| **Household RLS Infrastructure** | ✅ Live | Policies for household_members, invitations exist |

### ❌ What's Missing (To Be Built)

| Component | Status | Priority |
|-----------|--------|----------|
| **`household_id` on visions** | ❌ Missing | 🔥 Critical |
| **`user_id` nullable** | ❌ NOT NULL currently | 🔥 Critical |
| **Ownership constraint** | ❌ Missing | 🔥 Critical |
| **RLS policies for vision sharing** | ❌ Only personal policies exist | 🔥 Critical |
| **Household vision creation flow** | ❌ Missing | High |
| **Household vision list view** | ❌ Missing | High |
| **"Create Household Vision" UI** | ❌ Missing | High |
| **VIVA perspective handling** | ❌ Hardcoded to singular | Medium |
| **Household vision refinement** | ❌ Missing | Medium |

### 🔍 Schema Findings

**Current `vision_versions` table:**
```sql
CREATE TABLE public.vision_versions (
  id uuid NOT NULL,
  user_id uuid NOT NULL,  -- ⚠️ Needs to be nullable
  -- ... 14 category columns ...
  perspective text DEFAULT 'singular'::text,  -- ✅ Already exists!
  parent_id uuid,  -- ✅ Already exists!
  -- household_id uuid  -- ❌ MISSING - needs to be added
  CONSTRAINT vision_versions_perspective_check 
    CHECK (perspective IN ('singular', 'plural'))
);
```

**Current RLS Policies (need replacement):**
- ❌ Duplicate policies exist (cleanup needed)
- ❌ Only support personal visions (`auth.uid() = user_id`)
- ❌ No household vision access

---

## 🗄️ Where Household Visions Will Live

### Database Schema: Add `household_id` to `vision_versions`

Household visions will live in the **same `vision_versions` table**, but with:
1. `household_id` field (links to household)
2. `perspective` = 'plural' (uses "we/our" language)
3. Updated RLS policies (allow household members to access)

```sql
-- Migration: Add household_id to vision_versions
ALTER TABLE vision_versions
  ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES households(id) ON DELETE CASCADE;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_vision_versions_household_id 
  ON vision_versions(household_id);

-- Add check constraint: vision must belong to EITHER user OR household (not both)
ALTER TABLE vision_versions
  ADD CONSTRAINT vision_ownership_check 
  CHECK (
    (user_id IS NOT NULL AND household_id IS NULL) OR
    (user_id IS NULL AND household_id IS NOT NULL)
  );

COMMENT ON COLUMN vision_versions.household_id IS 'Household ID if this is a shared household vision (mutually exclusive with user_id)';
```

### Why This Approach?

**✅ Pros of Single Table:**
- Single source of truth for all visions
- Reuse all existing vision logic (audio, refinement, categories)
- Simple version management
- Easy to query "all my visions" (user + household)

**❌ Why NOT a Separate Table:**
- Would duplicate all 14 category columns
- Would need to duplicate all APIs
- Would fragment vision management code
- Harder to maintain consistency

---

## 🔐 Row Level Security (RLS) Policies

### Current State: Individual Only

```sql
-- Current policy (only individual visions)
CREATE POLICY "Users can view their own visions" 
  ON vision_versions FOR SELECT 
  USING (auth.uid() = user_id);
```

### New State: Individual OR Household

```sql
-- Drop old policies
DROP POLICY IF EXISTS "Users can view their own visions" ON vision_versions;
DROP POLICY IF EXISTS "Users can insert their own visions" ON vision_versions;
DROP POLICY IF EXISTS "Users can update their own visions" ON vision_versions;
DROP POLICY IF EXISTS "Users can delete their own visions" ON vision_versions;

-- NEW: View personal visions OR household visions they're a member of
CREATE POLICY "Users can view their visions or household visions" 
  ON vision_versions FOR SELECT 
  USING (
    -- Personal visions
    (user_id = auth.uid()) 
    OR 
    -- Household visions where user is an active member
    (household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid() 
        AND status = 'active'
    ))
  );

-- NEW: Insert personal visions OR household visions (if admin or member)
CREATE POLICY "Users can insert their visions or household visions" 
  ON vision_versions FOR INSERT 
  WITH CHECK (
    -- Personal visions
    (user_id = auth.uid() AND household_id IS NULL)
    OR
    -- Household visions (any active member can create)
    (user_id IS NULL AND household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid() 
        AND status = 'active'
    ))
  );

-- NEW: Update personal visions OR household visions (if admin or member)
CREATE POLICY "Users can update their visions or household visions" 
  ON vision_versions FOR UPDATE 
  USING (
    (user_id = auth.uid())
    OR
    (household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid() 
        AND status = 'active'
    ))
  );

-- NEW: Delete personal visions OR household visions (admin only)
CREATE POLICY "Users can delete their visions or household admins can delete household visions" 
  ON vision_versions FOR DELETE 
  USING (
    (user_id = auth.uid())
    OR
    (household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid() 
        AND status = 'active'
        AND role = 'admin'
    ))
  );
```

---

## 🎨 User Interface Changes

### 1. `/life-vision` List Page

**Add Tab Toggle:**

```tsx
[Personal] [Household]
```

- **Personal Tab:** Shows `user_id = current_user` visions
- **Household Tab:** Shows `household_id = user_household` visions (only if in household)

**Query Logic:**

```tsx
// Personal visions
const { data: personalVisions } = await supabase
  .from('vision_versions')
  .select('*')
  .eq('user_id', user.id)
  .is('household_id', null)
  .order('created_at', { ascending: false })

// Household visions (if user is in a household)
const { data: householdVisions } = await supabase
  .from('vision_versions')
  .select('*')
  .eq('household_id', userProfile.household_id)
  .order('created_at', { ascending: false })
```

### 2. "Create New Vision" Button

**Current:** Single "Create New Vision" button

**New:** Split based on household membership

```tsx
{/* If NOT in household: single button */}
<Button onClick={() => router.push('/life-vision/new')}>
  Create New Vision
</Button>

{/* If IN household: dropdown menu */}
<DropdownMenu>
  <DropdownMenuTrigger>
    <Button>Create New Vision ▼</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => router.push('/life-vision/new')}>
      📝 Personal Vision (I/My)
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => router.push('/life-vision/new?mode=household')}>
      👥 Household Vision (We/Our)
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### 3. `/life-vision/new` Creation Flow

**Detect Mode from URL:**

```tsx
const searchParams = useSearchParams()
const mode = searchParams.get('mode') // 'household' or null

const isHouseholdMode = mode === 'household'
```

**On Assembly/Save:**

```tsx
// Personal vision
if (!isHouseholdMode) {
  await supabase.from('vision_versions').insert({
    user_id: user.id,
    household_id: null,
    perspective: 'singular',
    // ... other fields
  })
}

// Household vision
if (isHouseholdMode) {
  await supabase.from('vision_versions').insert({
    user_id: null,
    household_id: userProfile.household_id,
    perspective: 'plural',
    // ... other fields
  })
}
```

### 4. Vision Display Badge

Add visual indicator on vision cards:

```tsx
{vision.household_id && (
  <Badge variant="secondary" className="!bg-secondary-500/20">
    👥 Household Vision
  </Badge>
)}

{vision.user_id && (
  <Badge variant="primary" className="!bg-primary-500/20">
    📝 Personal Vision
  </Badge>
)}
```

---

## 🗣️ VIVA Prompts: Perspective Handling

### Current State

All VIVA prompts use "I/my/me" language:
- "What does your ideal health look like?"
- "Describe your perfect day in this area"

### New State: Dynamic Perspective

**Update all VIVA prompts:**

```typescript
// src/lib/viva/prompts/category-summary-prompt.ts

export function getCategorySummaryPrompt(
  category: string,
  userInput: string,
  perspective: 'singular' | 'plural' = 'singular'
) {
  const pronoun = perspective === 'plural' 
    ? { subject: 'you', possessive: 'your', object: 'you' }
    : { subject: 'you', possessive: 'your', object: 'you' }
  
  // For household mode, guide with "we" language
  const examplePrompt = perspective === 'plural'
    ? `Create a compelling vision statement that uses "we/our/us" perspective.`
    : `Create a compelling vision statement that uses "I/my/me" perspective.`
  
  return `...` // rest of prompt
}
```

**Update Category Summary:**

```typescript
// src/app/api/viva/category-summary/route.ts

const perspective = vision.perspective || 'singular'
const prompt = getCategorySummaryPrompt(category, transcript, perspective)
```

---

## 🎯 Permission Model

### Who Can Do What?

| Action | Admin | Member | Solo User |
|--------|-------|--------|-----------|
| **Create Personal Vision** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Create Household Vision** | ✅ Yes | ✅ Yes | ❌ N/A |
| **View Personal Vision** | ✅ Own | ✅ Own | ✅ Own |
| **View Household Vision** | ✅ All | ✅ All | ❌ N/A |
| **Edit Personal Vision** | ✅ Own | ✅ Own | ✅ Own |
| **Edit Household Vision** | ✅ All | ✅ All | ❌ N/A |
| **Delete Personal Vision** | ✅ Own | ✅ Own | ✅ Own |
| **Delete Household Vision** | ✅ Yes | ❌ No | ❌ N/A |
| **Generate Audio for Household** | ✅ Yes | ✅ Yes | ❌ N/A |
| **Refine Household Vision** | ✅ Yes | ✅ Yes | ❌ N/A |

**Key Principle:** All household members can collaboratively create and edit household visions. Only admins can delete.

---

## 🚀 Implementation Steps

### Phase 1: Database Migration ✅ CREATED

- [x] Review plan and current schema
- [x] Create migration: `20251213000200_add_household_visions.sql`
- [x] Add `household_id` column with FK to households
- [x] Make `user_id` nullable (for household visions)
- [x] Add ownership check constraint (user XOR household)
- [x] Clean up duplicate RLS policies
- [x] Create new RLS policies for household access
- [ ] **Run migration in development**
- [ ] **Test household vision creation**
- [ ] **Test RLS policies work correctly**

### Phase 2: Backend APIs

- [ ] Update `/api/vision/route.ts` to handle `household_id`
- [ ] Update `/api/vision/draft/create-manual/route.ts`
- [ ] Update all VIVA prompts to accept `perspective` parameter
- [ ] Update `/api/viva/category-summary/route.ts` for perspective
- [ ] Test household vision creation via API

### Phase 3: Frontend - List View

- [ ] Update `/life-vision/page.tsx` to add tabs
- [ ] Fetch personal visions
- [ ] Fetch household visions (if in household)
- [ ] Add household badge to vision cards
- [ ] Test vision list display

### Phase 4: Frontend - Creation Flow

- [ ] Update "Create New Vision" button with dropdown (if in household)
- [ ] Add `?mode=household` URL parameter detection
- [ ] Update `/life-vision/new/category/[key]/page.tsx` to handle household mode
- [ ] Update assembly page to save with `household_id`
- [ ] Test end-to-end household vision creation

### Phase 5: Frontend - View/Edit

- [ ] Update `/life-vision/[id]/page.tsx` to show household badge
- [ ] Update `/life-vision/[id]/draft/page.tsx` for household mode
- [ ] Update `/life-vision/[id]/refine/page.tsx` for household perspective
- [ ] Test household vision viewing/editing

### Phase 6: Refinement & Polish

- [ ] Update audio generation for household visions
- [ ] Update activation flow for household visions
- [ ] Add household member avatars to vision cards
- [ ] Add "Created by [Name]" attribution
- [ ] Test with real household accounts

---

## 📝 Migration File (Created)

**File:** `supabase/migrations/20251213000200_add_household_visions.sql`

**Status:** ✅ Created, ready to run

**What it does:**
1. Adds `household_id` column to `vision_versions`
2. Makes `user_id` nullable (allows household-only visions)
3. Adds ownership constraint (user XOR household)
4. Drops 8 duplicate RLS policies
5. Creates 4 new RLS policies supporting household access
6. Updates table comments

**Full SQL:**

```sql
-- File: supabase/migrations/20251213000200_add_household_visions.sql

-- =================================================================
-- Add Household Vision Support to vision_versions
-- =================================================================

-- 1. Add household_id column
ALTER TABLE vision_versions
  ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES households(id) ON DELETE CASCADE;

-- 2. Create index for household queries
CREATE INDEX IF NOT EXISTS idx_vision_versions_household_id 
  ON vision_versions(household_id);

-- 3. Add ownership constraint (vision belongs to user OR household, not both)
ALTER TABLE vision_versions
  ADD CONSTRAINT vision_ownership_check 
  CHECK (
    (user_id IS NOT NULL AND household_id IS NULL) OR
    (user_id IS NULL AND household_id IS NOT NULL)
  );

-- 4. Add comment
COMMENT ON COLUMN vision_versions.household_id IS 
  'Household ID if this is a shared household vision. Mutually exclusive with user_id. When set, all household members can view/edit this vision.';

-- 5. Drop old RLS policies
DROP POLICY IF EXISTS "Users can view their own visions" ON vision_versions;
DROP POLICY IF EXISTS "Users can insert their own visions" ON vision_versions;
DROP POLICY IF EXISTS "Users can update their own visions" ON vision_versions;
DROP POLICY IF EXISTS "Users can delete their own visions" ON vision_versions;

-- 6. Create new RLS policies supporting household access
CREATE POLICY "Users can view personal or household visions" 
  ON vision_versions FOR SELECT 
  USING (
    -- Personal visions
    (user_id = auth.uid()) 
    OR 
    -- Household visions where user is an active member
    (household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid() 
        AND status = 'active'
    ))
  );

CREATE POLICY "Users can insert personal or household visions" 
  ON vision_versions FOR INSERT 
  WITH CHECK (
    -- Personal visions
    (user_id = auth.uid() AND household_id IS NULL)
    OR
    -- Household visions (any active member can create)
    (user_id IS NULL AND household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid() 
        AND status = 'active'
    ))
  );

CREATE POLICY "Users can update personal or household visions" 
  ON vision_versions FOR UPDATE 
  USING (
    -- Personal visions
    (user_id = auth.uid())
    OR
    -- Household visions (any active member can edit)
    (household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid() 
        AND status = 'active'
    ))
  );

CREATE POLICY "Users can delete personal visions or admins can delete household visions" 
  ON vision_versions FOR DELETE 
  USING (
    -- Personal visions
    (user_id = auth.uid())
    OR
    -- Household visions (admin only)
    (household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid() 
        AND status = 'active'
        AND role = 'admin'
    ))
  );

-- 7. Update table comment
COMMENT ON TABLE vision_versions IS 
  'Life vision versions. Can be personal (user_id) or shared household visions (household_id). Version numbers are calculated dynamically using get_vision_version_number() based on created_at order.';
```

---

## 🎨 UI Mockups

### Vision List Page

```
┌──────────────────────────────────────────┐
│  Life Visions                            │
│  ┌─────────┐ ┌──────────┐               │
│  │Personal │ │Household │  [Create ▼]   │
│  └─────────┘ └──────────┘               │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ 👥 Our Dream Life - V2             │ │
│  │ [Household Vision]                 │ │
│  │ Created by Jordan • Dec 13, 2024   │ │
│  │ 12/14 categories • Perspective: We │ │
│  │ [View] [Refine] [•••]              │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ 👥 Family Vision 2025 - V1         │ │
│  │ [Household Vision]                 │ │
│  │ Created by Sarah • Dec 10, 2024    │ │
│  │ 8/14 categories • Perspective: We  │ │
│  │ [View] [Refine] [•••]              │ │
│  └────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

### Create Vision Dropdown

```
┌───────────────────────────┐
│ Create New Vision ▼       │
│ ┌─────────────────────────┤
│ │ 📝 Personal Vision       │ → /life-vision/new
│ │    (I/My perspective)    │
│ ├─────────────────────────│
│ │ 👥 Household Vision      │ → /life-vision/new?mode=household
│ │    (We/Our perspective)  │
│ └─────────────────────────┘
```

---

## 🧪 Testing Checklist

### Database Tests

- [ ] Can create vision with `user_id` and NULL `household_id`
- [ ] Can create vision with `household_id` and NULL `user_id`
- [ ] CANNOT create vision with both `user_id` AND `household_id`
- [ ] CANNOT create vision with neither `user_id` NOR `household_id`
- [ ] Household member can view household vision
- [ ] Non-household member CANNOT view household vision
- [ ] Admin can delete household vision
- [ ] Non-admin member CANNOT delete household vision

### UI Tests

- [ ] "Create Vision" shows dropdown if in household
- [ ] "Create Vision" shows single button if NOT in household
- [ ] Personal tab shows only personal visions
- [ ] Household tab shows only household visions
- [ ] Household tab hidden if user not in household
- [ ] Household badge displays on household visions
- [ ] Personal badge displays on personal visions

### VIVA Tests

- [ ] Household vision uses "we/our" in generated content
- [ ] Personal vision uses "I/my" in generated content
- [ ] Audio generation works for household visions
- [ ] Refinement works for household visions
- [ ] Blueprint works for household visions

---

## 🚨 Edge Cases to Handle

1. **User leaves household:**
   - Can they still see old household visions? 
   - Answer: No (RLS policy checks active status)

2. **Household deleted:**
   - What happens to household visions?
   - Answer: CASCADE delete (visions deleted with household)

3. **User in multiple households:**
   - Not supported yet (user_profiles.household_id is single value)
   - Future enhancement if needed

4. **Converting personal → household vision:**
   - Not implemented in Phase 1
   - Future enhancement if requested

5. **Converting household → personal vision:**
   - Admin could "clone" as personal
   - Future enhancement if requested

---

## 💰 Token Usage for Household Visions

**Current System:** Tokens are per-user with optional sharing

**For Household Visions:**
- Use `shared_tokens_enabled` setting from household
- If enabled: deduct from household admin's token pool
- If disabled: deduct from creating user's token pool
- Track who initiated the action in `token_transactions`

---

## 📚 Related Files to Update

| File | Change Needed |
|------|---------------|
| `supabase/migrations/...` | Add household_id migration |
| `src/app/life-vision/page.tsx` | Add tabs, fetch household visions |
| `src/app/life-vision/new/category/[key]/page.tsx` | Detect household mode |
| `src/app/life-vision/new/assembly/page.tsx` | Save with household_id |
| `src/app/api/vision/route.ts` | Handle household_id in queries |
| `src/app/api/viva/category-summary/route.ts` | Pass perspective to prompts |
| `src/lib/viva/prompts/*.ts` | Add perspective parameter |
| `src/lib/design-system/components.tsx` | Add household badge variant |

---

## ✅ Ready to Implement?

This plan provides:
- ✅ Database schema design
- ✅ RLS policy strategy
- ✅ UI/UX mockups
- ✅ Permission model
- ✅ Step-by-step implementation phases
- ✅ Testing checklist
- ✅ Edge case handling

**Next Step:** Review this plan and approve, then we'll create the migration and start Phase 1! 🚀

