# Profile System Architecture Guide

## Overview

This document provides a complete understanding of how the `/profile` area works, including where functions live (site files vs Supabase) and how data flows through the system.

---

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [File Structure](#file-structure)
3. [Where Functions Live](#where-functions-live)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Data Flow](#data-flow)
7. [Key Functions Reference](#key-functions-reference)

---

## System Architecture Overview

The profile system uses a **hybrid architecture**:
- **Site Files (Next.js API Routes)**: Handle HTTP requests, business logic, and client-server communication
- **Supabase Database Functions**: Handle complex database operations, versioning logic, and data integrity

### Key Concept: Versioning System
- Users can have multiple profile versions
- Only **one active version** per user (`is_active = true`)
- Users can create **draft versions** for editing (`is_draft = true`)
- Version numbers are calculated chronologically (not stored)

---

## File Structure

### Frontend Pages
```
src/app/profile/
├── page.tsx                    # Profile dashboard (list of versions)
├── edit/page.tsx               # Edit active profile
├── new/page.tsx                # Create new profile version
├── [id]/page.tsx               # View specific profile version
└── [id]/edit/page.tsx          # Edit specific profile version
```

### API Routes (Site Files)
```
src/app/api/profile/
├── route.ts                    # Main profile API (GET, POST, PUT, DELETE)
├── compare/                    # Version comparison endpoints
└── versions/[id]/route.ts      # Individual version operations
```

### Utility Libraries
```
src/lib/
├── supabase/
│   ├── profile.ts              # Profile TypeScript types & helpers
│   └── server.ts               # Supabase server client
└── utils/
    └── profile-completion.ts   # Completion percentage calculation
```

### Database Functions (Supabase)
```
supabase/migrations/
├── 20250105000000_create_user_profiles.sql          # Initial table creation
├── 20250126000000_profile_versioning_system.sql     # Versioning functions
├── 20250201000007_calculate_version_number_by_date.sql  # Version numbering
└── 20251105000000_remove_completion_percentage.sql  # Schema updates
```

---

## Where Functions Live

### ✅ Site Files (Next.js API Routes)

These functions live in **your site files** and handle HTTP requests:

#### `src/app/api/profile/route.ts`
- **GET**: Fetches profile data, versions, or specific version
- **POST**: Creates new profile or version
- **PUT**: Updates profile fields
- **DELETE**: Deletes a profile version

**Key Site Functions:**
- Request handling and validation
- Authentication (via Supabase)
- Business logic (when to create versions, what to update)
- Response formatting
- Completion percentage calculation (via utility)

#### `src/lib/utils/profile-completion.ts`
- `calculateProfileCompletion()` - Calculates profile completion percentage
- This is the **single source of truth** for completion logic
- Used by both API routes and frontend components

---

### ✅ Supabase Database Functions

These functions live in **Supabase** and are called via `.rpc()`:

#### Database Functions (Stored Procedures)

1. **`create_draft_from_version(p_source_profile_id, p_user_id, p_version_notes)`**
   - **Location**: Supabase database
   - **Purpose**: Creates a new draft version by copying an existing profile
   - **Returns**: UUID of new draft profile
   - **Called from**: `src/app/api/profile/route.ts` (POST handler)

2. **`commit_draft_as_active(p_draft_profile_id, p_user_id)`**
   - **Location**: Supabase database
   - **Purpose**: Makes a draft the active version (deactivates others)
   - **Returns**: Boolean (success/failure)
   - **Called from**: `src/app/api/profile/route.ts` (POST handler when committing)

3. **`set_version_active(p_profile_id, p_user_id)`**
   - **Location**: Supabase database
   - **Purpose**: Sets a specific version as active (deactivates others)
   - **Returns**: Boolean
   - **Called from**: API routes when switching active versions

4. **`get_profile_version_number(p_profile_id)`**
   - **Location**: Supabase database
   - **Purpose**: Calculates version number based on chronological order
   - **Returns**: Integer (version number: 1, 2, 3, etc.)
   - **Called from**: API routes when displaying version info

5. **`get_next_version_number(p_user_id)`**
   - **Location**: Supabase database
   - **Purpose**: Gets the next version number for a user
   - **Returns**: Integer
   - **Used internally** by `create_draft_from_version`

---

## Database Schema

### Table: `user_profiles`

**Primary Key**: `id` (UUID)

**Versioning Fields:**
- `version_number` (INTEGER) - Stored but recalculated on-the-fly
- `is_draft` (BOOLEAN) - True if this is a draft version
- `is_active` (BOOLEAN) - True if this is the active version (only one per user)
- `version_notes` (TEXT) - Optional notes about this version
- `parent_version_id` (UUID) - Reference to the version this was created from

**Profile Data Fields** (too many to list all - see `src/lib/supabase/profile.ts`):
- Personal: `first_name`, `last_name`, `email`, `phone`, `date_of_birth`, `gender`, `profile_picture_url`
- Relationship: `relationship_status`, `partner_name`, `relationship_length`
- Family: `has_children`, `number_of_children`, `children_ages`
- Health: `height`, `weight`, `exercise_frequency`, `units`
- Location: `city`, `state`, `postal_code`, `country`, `living_situation`
- Career: `employment_type`, `occupation`, `company`, `education`
- Financial: `household_income`, `savings_retirement`, `assets_equity`, `consumer_debt`
- Stories: `fun_story`, `health_story`, `travel_story`, `love_story`, etc. (12 categories)
- Structured: `hobbies`, `travel_frequency`, `spiritual_practice`, etc.

**Timestamps:**
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

---

## API Endpoints

### GET `/api/profile`

**Query Parameters:**
- `versionId` - Get specific version by ID
- `includeVersions` - Include list of all versions

**Response:**
```json
{
  "profile": { /* profile data */ },
  "completionPercentage": 75,
  "versions": [ /* array of version metadata */ ]
}
```

**Flow:**
1. Authenticates user
2. If `versionId` provided: fetches that specific version
3. Otherwise: fetches active profile (`is_active = true`, `is_draft = false`)
4. Calculates completion percentage using `calculateProfileCompletion()`
5. If `includeVersions=true`: fetches all versions and calculates their version numbers

---

### POST `/api/profile`

**Body:**
```json
{
  "profileData": { /* profile fields */ },
  "saveAsVersion": true/false,
  "isDraft": true/false,
  "sourceProfileId": "uuid" // optional
}
```

**Flow:**

**If `saveAsVersion = true`:**
1. Checks for existing draft (if `isDraft = true`)
2. If draft exists: updates it
3. If no draft: calls `create_draft_from_version()` (Supabase function)
4. Updates the draft with new data
5. If `isDraft = false`: calls `commit_draft_as_active()` (Supabase function)

**If `saveAsVersion = false`:**
1. Updates the active profile directly
2. Or creates first profile if none exists

---

### PUT `/api/profile?profileId={id}`

**Body:**
```json
{
  "field_name": "value",
  "another_field": "value"
}
```

**Flow:**
1. Finds profile to update (by `profileId` or active/draft logic)
2. Updates specified fields
3. Recalculates completion percentage
4. Returns updated profile

---

### DELETE `/api/profile?versionId={id}`

**Flow:**
1. Verifies profile belongs to user
2. Prevents deletion of active version
3. Deletes the profile version
4. Returns success

---

## Data Flow

### Creating a New Profile Version

```
User clicks "Create Draft"
  ↓
Frontend calls: POST /api/profile
  {
    saveAsVersion: true,
    isDraft: true,
    sourceProfileId: "abc-123"
  }
  ↓
API Route (route.ts):
  1. Validates request
  2. Calls Supabase: .rpc('create_draft_from_version', {...})
     ↓
     Supabase Function (create_draft_from_version):
       - Finds source profile
       - Gets next version number
       - Deletes existing draft
       - Creates new draft with copied data
       - Returns new draft ID
  3. Updates draft with new profileData
  4. Calculates completion (calculateProfileCompletion)
  5. Returns response
  ↓
Frontend receives new draft profile
  ↓
User edits and saves
  ↓
PUT /api/profile?profileId={draftId}
  ↓
Profile updated
```

### Viewing Profile

```
User visits /profile
  ↓
Frontend calls: GET /api/profile?includeVersions=true
  ↓
API Route (route.ts):
  1. Authenticates user
  2. Fetches active profile from user_profiles table
  3. If includeVersions:
     - Fetches all versions
     - For each version:
       - Calls .rpc('get_profile_version_number', {p_profile_id})
       - Calculates completion (calculateProfileCompletion)
  4. Returns profile + versions list
  ↓
Frontend displays dashboard
```

### Committing a Draft

```
User clicks "Save as Active Version"
  ↓
Frontend calls: POST /api/profile
  {
    profileData: {...},
    saveAsVersion: true,
    isDraft: false
  }
  ↓
API Route (route.ts):
  1. Creates/updates draft
  2. Calls Supabase: .rpc('commit_draft_as_active', {...})
     ↓
     Supabase Function (commit_draft_as_active):
       - Finds draft profile
       - Deactivates current active version
       - Sets draft as active (is_active=true, is_draft=false)
       - Updates version_number
  3. Returns committed profile
  ↓
Frontend updates UI
```

---

## Key Functions Reference

### Site File Functions

#### `calculateProfileCompletion(profileData)`
- **Location**: `src/lib/utils/profile-completion.ts`
- **Purpose**: Calculates completion percentage (0-100)
- **Logic**: Counts filled fields vs total fields, handles conditionals
- **Used by**: API routes and frontend components

#### `cleanProfileData(profileData)`
- **Location**: `src/app/api/profile/route.ts`
- **Purpose**: Removes invalid fields (e.g., old `education_level`)
- **Used by**: POST/PUT handlers

### Supabase Database Functions

#### `create_draft_from_version`
```sql
CREATE OR REPLACE FUNCTION create_draft_from_version(
  p_source_profile_id UUID,
  p_user_id UUID,
  p_version_notes TEXT DEFAULT NULL
)
RETURNS UUID
```
- Creates new draft by copying source profile
- Deletes existing draft (only one draft per user)
- Returns UUID of new draft

#### `commit_draft_as_active`
```sql
CREATE OR REPLACE FUNCTION commit_draft_as_active(
  p_draft_profile_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
```
- Makes draft the active version
- Deactivates previous active version
- Sets `is_draft = false`, `is_active = true`

#### `set_version_active`
```sql
CREATE OR REPLACE FUNCTION set_version_active(
  p_profile_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
```
- Sets any version as active
- Ensures only one active version per user

#### `get_profile_version_number`
```sql
CREATE OR REPLACE FUNCTION get_profile_version_number(
  p_profile_id UUID
)
RETURNS INTEGER
```
- Calculates version number based on `created_at` chronological order
- Ensures sequential numbering (1, 2, 3...) even after deletions

---

## Summary: Where Things Live

| Component | Location | Type |
|-----------|----------|------|
| HTTP Request Handling | `src/app/api/profile/route.ts` | Site File |
| Authentication | `src/lib/supabase/server.ts` | Site File |
| Completion Calculation | `src/lib/utils/profile-completion.ts` | Site File |
| Profile Types | `src/lib/supabase/profile.ts` | Site File |
| Create Draft Function | Supabase Database | Database Function |
| Commit Draft Function | Supabase Database | Database Function |
| Version Numbering | Supabase Database | Database Function |
| Profile Data Storage | Supabase Database | Database Table |
| RLS Policies | Supabase Database | Database Policies |

---

## Important Notes

1. **Completion Percentage**: No longer stored in database (removed in migration `20251105000000`). Always calculated on-the-fly.

2. **Version Numbers**: Stored but recalculated based on chronological order. This ensures sequential numbering even after deletions.

3. **Draft Management**: Users can only have **one draft at a time**. Creating a new draft deletes the existing one.

4. **Active Version**: Only **one active version** per user. Setting a new active version automatically deactivates the previous one.

5. **Security**: All database functions use Row Level Security (RLS) to ensure users can only access their own profiles.

---

## Quick Reference: Function Locations

**To modify profile creation logic**: Edit `src/app/api/profile/route.ts` (POST handler)

**To modify completion calculation**: Edit `src/lib/utils/profile-completion.ts`

**To modify versioning behavior**: Edit Supabase functions in `supabase/migrations/`

**To add new profile fields**: 
1. Add to database schema (migration)
2. Add to `UserProfile` interface in `src/lib/supabase/profile.ts`
3. Update `calculateProfileCompletion()` if needed
4. Update form components in `src/app/profile/components/`

---

## Where Supabase Functions Physically Live

### 📁 Location 1: SQL Migration Files (Source of Truth)

The functions are **defined** in SQL migration files in your codebase:

```
supabase/migrations/
├── 20250126000000_profile_versioning_system.sql
│   ├── get_next_version_number()
│   ├── set_version_active()
│   ├── create_draft_from_version()
│   └── commit_draft_as_active()
│
├── 20250201000007_calculate_version_number_by_date.sql
│   ├── calculate_version_number()
│   └── get_profile_version_number()
│
└── 20251105000000_remove_completion_percentage.sql
    └── (updated versions of above functions)
```

**These files are the source of truth** - when you modify them and run migrations, the changes are deployed to Supabase.

### 🗄️ Location 2: Supabase Database (Live/Deployed)

Once migrations run, the functions **live in your Supabase PostgreSQL database** in the `public` schema.

You can view them in several ways:

#### Option A: Supabase Dashboard (Web UI)
1. Go to your Supabase project dashboard
2. Navigate to **Database** → **Functions** (or **Database** → **Functions/Stored Procedures**)
3. You'll see all your functions listed
4. Click on a function to view its SQL definition
5. **Note**: You can view them here, but **editing directly in the dashboard is not recommended** - always use migrations

#### Option B: Supabase SQL Editor
1. Go to **SQL Editor** in Supabase dashboard
2. Run this query to see all profile-related functions:
```sql
SELECT 
  proname AS function_name,
  pg_get_functiondef(oid) AS definition
FROM pg_proc
WHERE proname LIKE '%profile%' 
   OR proname LIKE '%version%'
   OR proname LIKE '%draft%'
ORDER BY proname;
```

#### Option C: Direct PostgreSQL Query
If you have direct database access:
```sql
-- List all functions
\df+ *profile*
\df+ *version*
\df+ *draft*

-- View function definition
\sf+ create_draft_from_version
```

### 🔄 How Functions Are Deployed

**Development Workflow:**
1. **Edit** the SQL migration file in `supabase/migrations/`
2. **Test locally** (if using Supabase CLI): `supabase db reset`
3. **Deploy to production**: 
   - Via Supabase Dashboard: Copy SQL and run in SQL Editor
   - Via Supabase CLI: `supabase db push`
   - Via CI/CD: If you have migrations automated

**Important**: Always use migrations (`.sql` files) rather than editing directly in the dashboard to maintain version control and consistency.

### 📍 Specific Function File Locations

| Function Name | Migration File | Line Range |
|--------------|----------------|------------|
| `create_draft_from_version` | `supabase/migrations/20250126000000_profile_versioning_system.sql` | ~96-290 |
| `commit_draft_as_active` | `supabase/migrations/20250126000000_profile_versioning_system.sql` | ~293-330 |
| `set_version_active` | `supabase/migrations/20250126000000_profile_versioning_system.sql` | ~66-95 |
| `get_next_version_number` | `supabase/migrations/20250126000000_profile_versioning_system.sql` | ~48-64 |
| `get_profile_version_number` | `supabase/migrations/20250201000007_calculate_version_number_by_date.sql` | ~43-70 |

### 🔍 Viewing Functions in Code

To view a function's current definition:

```bash
# View entire migration file
cat supabase/migrations/20250126000000_profile_versioning_system.sql

# Search for specific function
grep -A 50 "CREATE OR REPLACE FUNCTION create_draft_from_version" supabase/migrations/20250126000000_profile_versioning_system.sql
```

### ⚠️ Important Notes

1. **Don't edit functions directly in Supabase Dashboard** - Always use migration files
2. **Migration files are version-controlled** - Changes are tracked in git
3. **Functions are PostgreSQL stored procedures** - They execute inside the database
4. **Multiple migrations can update the same function** - Later migrations override earlier ones
5. **Functions persist in the database** - Even if you delete the migration file locally, the function still exists in Supabase until you explicitly drop it

### 🛠️ Modifying Functions

**To modify a Supabase function:**

1. **Find the migration file** containing the function
2. **Edit the SQL** in that file (or create a new migration)
3. **Test locally** (if possible)
4. **Deploy**: Run the migration on your Supabase instance
5. **Verify**: Check that the function was updated in the dashboard

**Example - Creating a new migration to update a function:**
```sql
-- File: supabase/migrations/20250131XXXXXX_update_draft_function.sql

-- Update the create_draft_from_version function
CREATE OR REPLACE FUNCTION create_draft_from_version(
  p_source_profile_id UUID,
  p_user_id UUID,
  p_version_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
-- Your updated function logic here
$$ LANGUAGE plpgsql;
```

Then deploy this migration to update the function in Supabase.
