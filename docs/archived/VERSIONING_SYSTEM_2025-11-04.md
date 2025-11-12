# Profile Versioning System

**Date:** November 4, 2025  
**System:** VibrationFit User Profiles  
**Status:** Production

---

## Overview

The VibrationFit profile versioning system enables users to create and manage multiple versions of their profile data through a draft-based workflow. This system maintains a clear separation between active, draft, and archived versions, ensuring data integrity and providing a robust editing experience.

## Core Concepts

### Version States

Profiles can exist in three distinct states:

1. **Draft** (`is_draft=true`, `is_active=false`)
   - Work-in-progress version
   - Only one draft can exist per user at a time
   - Not considered the "active" profile
   - Can be edited freely without affecting the active version

2. **Active** (`is_draft=false`, `is_active=true`)
   - Current live version used across the application
   - Only one active version per user (excluding drafts)
   - Automatically deactivated when a new version becomes active
   - Cannot be deleted directly (must deactivate first)

3. **Complete** (`is_draft=false`, `is_active=false`)
   - Archived/previous versions
   - Historical record of profile changes
   - Can be reactivated or deleted

### Database Schema

The versioning system adds the following fields to `user_profiles`:

```sql
version_number INTEGER DEFAULT 1
is_draft BOOLEAN DEFAULT false
is_active BOOLEAN DEFAULT false
version_notes TEXT
parent_version_id UUID REFERENCES user_profiles(id)
completion_percentage INTEGER DEFAULT 0
```

## Business Rules

### Database Constraints

1. **One Active Version Per User** (excluding drafts)
   - Enforced via unique partial index:
   ```sql
   CREATE UNIQUE INDEX idx_user_profiles_one_active_per_user 
     ON user_profiles(user_id) 
     WHERE is_active = true AND is_draft = false;
   ```

2. **One Draft Per User**
   - Enforced via unique partial index:
   ```sql
   CREATE UNIQUE INDEX idx_user_profiles_one_draft_per_user 
     ON user_profiles(user_id) 
     WHERE is_draft = true;
   ```

3. **Cannot Delete Active Versions**
   - Active versions must be deactivated before deletion
   - Prevents accidental data loss

4. **Cannot Set Draft as Active Directly**
   - Drafts must be committed (not just activated)
   - Ensures proper version number assignment

## Database Functions

### `get_next_version_number(p_user_id UUID)`

Returns the next sequential version number for a user.

**Usage:**
```sql
SELECT get_next_version_number('user-uuid');
```

**Logic:**
- Finds the maximum `version_number` for the user
- Returns `MAX(version_number) + 1`
- Defaults to `1` if no versions exist

### `create_draft_from_version(p_source_profile_id UUID, p_user_id UUID, p_version_notes TEXT)`

Creates a new draft version from an existing profile.

**Parameters:**
- `p_source_profile_id`: UUID of the profile to copy from
- `p_user_id`: UUID of the user (for security)
- `p_version_notes`: Optional notes about this version

**Returns:** UUID of the newly created draft

**Behavior:**
1. Validates source profile exists and belongs to user
2. Calculates next version number
3. **Deletes any existing draft** for this user (enforces one draft rule)
4. Copies all profile data fields from source
5. Sets `is_draft=true`, `is_active=false`
6. Sets `parent_version_id` to source profile
7. Preserves `completion_percentage` from source

**Example:**
```sql
SELECT create_draft_from_version(
  'source-profile-uuid',
  'user-uuid',
  'Updating career information'
);
```

### `commit_draft_as_active(p_draft_profile_id UUID, p_user_id UUID)`

Commits a draft version as the new active version.

**Parameters:**
- `p_draft_profile_id`: UUID of the draft to commit
- `p_user_id`: UUID of the user (for security)

**Returns:** `true` on success

**Behavior:**
1. Validates draft exists, belongs to user, and is actually a draft
2. Calculates next version number
3. **Deactivates current active version** (`is_active=false`)
4. Sets draft to `is_draft=false`, `is_active=true`
5. Assigns new `version_number`
6. Updates `updated_at` timestamp

**Example:**
```sql
SELECT commit_draft_as_active('draft-profile-uuid', 'user-uuid');
```

### `set_version_active(p_profile_id UUID, p_user_id UUID)`

Sets an existing (non-draft) version as active.

**Parameters:**
- `p_profile_id`: UUID of the profile to activate
- `p_user_id`: UUID of the user (for security)

**Returns:** `true` on success, `false` if profile not found

**Behavior:**
1. Validates profile exists and belongs to user
2. **Deactivates all other active versions** for this user
3. Sets specified version to `is_active=true`, `is_draft=false`
4. Updates `updated_at` timestamp

**Note:** Cannot be used on drafts - drafts must be committed first.

**Example:**
```sql
SELECT set_version_active('profile-uuid', 'user-uuid');
```

## API Endpoints

### GET `/api/profile`

Fetches the current active profile and optionally all versions.

**Query Parameters:**
- `versionId`: (optional) Fetch specific version by ID
- `includeVersions`: (optional) If `true`, returns all versions

**Response:**
```json
{
  "profile": { /* full profile object */ },
  "completionPercentage": 75,
  "versions": [ /* array of version summaries */ ]
}
```

**Behavior:**
- Returns active profile (non-draft) by default
- Falls back to latest profile if no active exists
- Auto-activates single non-draft profile if none are active
- Calculates version numbers chronologically

### POST `/api/profile`

Creates or updates profiles with optional versioning.

**Request Body:**
```json
{
  "profileData": { /* profile fields */ },
  "saveAsVersion": boolean,
  "isDraft": boolean,
  "sourceProfileId": "uuid" // required if saveAsVersion=true
}
```

**Behavior:**

**When `saveAsVersion=false` (Regular Update):**
- Updates existing active profile directly
- No versioning occurs
- First profile ever created is set as active

**When `saveAsVersion=true`:**
- **If `isDraft=true`:**
  - Checks for existing draft
  - Updates existing draft if found
  - Creates new draft via `create_draft_from_version()` if not
  - Requires `sourceProfileId` (or uses active profile as source)
- **If `isDraft=false`:**
  - Creates draft first
  - Immediately commits it as active via `commit_draft_as_active()`
  - Creates a new versioned profile

### PUT `/api/profile`

Updates specific fields in a profile.

**Query Parameters:**
- `profileId`: (optional) Specific profile to update

**Request Body:**
```json
{
  "field1": "value1",
  "field2": "value2"
}
```

**Behavior:**
- Updates draft if one exists
- Falls back to active profile if no draft
- Prevents updating versioning fields (`is_draft`, `is_active`, etc.)
- Recalculates `completion_percentage` automatically

### DELETE `/api/profile?versionId=uuid`

Deletes a specific version.

**Query Parameters:**
- `versionId`: UUID of version to delete

**Behavior:**
- Validates version belongs to user
- **Prevents deletion of active versions**
- Deletes version and all its data

### GET `/api/profile/versions`

Fetches all versions for the current user.

**Response:**
```json
{
  "versions": [
    {
      "id": "uuid",
      "version_number": 3,
      "is_draft": false,
      "is_active": true,
      "completion_percentage": 75,
      "created_at": "2025-11-04T10:00:00Z",
      "updated_at": "2025-11-04T10:00:00Z"
    }
  ]
}
```

### POST `/api/profile/versions/draft`

Creates a draft from an existing version.

**Request Body:**
```json
{
  "sourceProfileId": "uuid",
  "versionNotes": "Optional notes"
}
```

**Response:**
```json
{
  "success": true,
  "draft": { /* draft profile object */ },
  "message": "Draft created successfully"
}
```

### PUT `/api/profile/versions/commit`

Commits a draft as the new active version.

**Request Body:**
```json
{
  "draftProfileId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "profile": { /* updated profile object */ },
  "message": "Draft committed successfully"
}
```

### PATCH `/api/profile/versions/active`

Sets a non-draft version as active.

**Request Body:**
```json
{
  "profileId": "uuid"
}
```

**Behavior:**
- Validates profile is not a draft
- Calls `set_version_active()` database function
- Returns updated profile with new status

## Version Number Calculation

Version numbers are calculated chronologically based on creation date, not by the stored `version_number` field. This ensures consistent numbering even if versions are created or deleted out of order.

**Calculation Logic:**
- Versions are sorted by `created_at` timestamp
- First version = 1, second = 2, etc.
- Database function `get_profile_version_number(p_profile_id)` provides this calculation

## User Workflows

### Creating a Draft

1. User clicks "Create Draft" on profile dashboard
2. System finds active profile
3. Calls `create_draft_from_version()` with active profile as source
4. Draft is created with all current profile data
5. User is redirected to draft editing page

### Editing a Draft

1. User navigates to `/profile/[draft-id]/edit/draft`
2. All edits save to the draft version
3. Active profile remains unchanged
4. User can save multiple times
5. User can commit or discard draft

### Committing a Draft

1. User clicks "Commit Draft" after editing
2. System calls `commit_draft_as_active()`
3. Current active version is deactivated
4. Draft becomes new active version
5. Draft is assigned new version number
6. User is redirected to profile view

### Reactivating Old Version

1. User views version list
2. User selects an old version
3. User clicks "Set as Active" (if not draft)
4. System calls `set_version_active()`
5. Current active version is deactivated
6. Selected version becomes active

### Deleting a Version

1. User views version list
2. User clicks "Delete" on a version
3. System validates version is not active
4. Version is deleted permanently
5. Version list refreshes

## UI Components

### VersionCard

Displays version information with status badges.

**Props:**
```typescript
interface VersionCardProps {
  version: {
    id: string
    version_number: number
    is_draft: boolean
    is_active: boolean
    completion_percentage?: number
    created_at: string
  }
  actions?: React.ReactNode
  className?: string
}
```

**Status Badges:**
- **Draft:** Warning badge (yellow) when `is_draft=true`
- **Active:** Success badge (green) when `is_active=true` and `!is_draft`
- **Complete:** Info badge (blue) when `!is_active && !is_draft`

### Profile Dashboard (`/profile/page.tsx`)

Displays:
- Current active profile summary
- Profile statistics (total profiles, active count, completion %)
- List of all versions using `VersionCard` components
- Action buttons: View, Edit, Create Draft, Edit Draft

### Draft Edit Page (`/profile/[id]/edit/draft/page.tsx`)

Special editing interface for drafts:
- Shows draft status indicator
- Provides commit and discard options
- Warns before leaving unsaved changes
- Blocks access to non-draft profiles

## Data Flow Examples

### Example 1: Creating First Profile

```
1. User creates profile → POST /api/profile (saveAsVersion=false)
2. No existing profile found
3. Profile created with:
   - is_active = true
   - is_draft = false
   - version_number = 1
4. Profile is now active
```

### Example 2: Creating Draft from Active

```
1. User clicks "Create Draft" → POST /api/profile (saveAsVersion=true, isDraft=true)
2. System finds active profile (V2)
3. Calls create_draft_from_version(source=V2)
4. Existing draft deleted (if any)
5. New draft created:
   - is_active = false
   - is_draft = true
   - parent_version_id = V2.id
   - version_number = 3 (next available)
6. User edits draft
7. User commits → PUT /api/profile/versions/commit
8. System calls commit_draft_as_active()
9. V2 becomes inactive
10. Draft becomes V3 active
```

### Example 3: Regular Profile Update

```
1. User edits active profile → POST /api/profile (saveAsVersion=false)
2. System finds active profile
3. Profile updated directly
4. No versioning occurs
5. Profile remains active
```

## Error Handling

### Common Errors

1. **"Cannot delete active version"**
   - Solution: Deactivate version first, then delete

2. **"Cannot set draft as active"**
   - Solution: Commit draft first using commit endpoint

3. **"Cannot create version: No source profile found"**
   - Solution: Ensure user has an active profile first

4. **"Source profile not found or access denied"**
   - Solution: Verify profile belongs to current user

### Validation

- All database functions validate user ownership
- API endpoints check authentication
- Version state transitions are validated
- Constraints prevent invalid states

## Performance Considerations

1. **Indexes:**
   - Indexes on `user_id`, `is_draft`, `is_active` for fast queries
   - Composite index on `(user_id, version_number DESC)` for version listing

2. **Version Number Calculation:**
   - Calculated on-demand via database function
   - Consider caching if performance becomes an issue

3. **Draft Cleanup:**
   - Only one draft exists at a time (auto-deleted when creating new)
   - No manual cleanup needed

## Migration Notes

The versioning system was added via migration `20250126000000_profile_versioning_system.sql`.

**Existing Profiles:**
- All existing profiles were set to:
  - `is_active = true`
  - `is_draft = false`
  - `version_number = 1`
  - `completion_percentage = 0`

## Future Considerations

1. **Version History Tracking:**
   - Consider adding diff/changelog system
   - Track which fields changed between versions

2. **Version Notes:**
   - Currently optional - could be enhanced with UI
   - Could add automatic notes based on changes

3. **Version Comparison:**
   - UI to compare two versions side-by-side
   - Highlight differences

4. **Bulk Operations:**
   - Delete multiple versions at once
   - Archive old versions

5. **Version Limits:**
   - Consider limiting number of versions per user
   - Auto-archive old versions

## Related Files

- **Migration:** `supabase/migrations/20250126000000_profile_versioning_system.sql`
- **API Routes:**
  - `src/app/api/profile/route.ts`
  - `src/app/api/profile/versions/route.ts`
  - `src/app/api/profile/versions/[id]/route.ts`
- **UI Components:**
  - `src/app/profile/page.tsx` (Dashboard)
  - `src/app/profile/components/VersionCard.tsx`
  - `src/app/profile/[id]/edit/draft/page.tsx` (Draft Editor)
- **Database Functions:**
  - `get_next_version_number()`
  - `create_draft_from_version()`
  - `commit_draft_as_active()`
  - `set_version_active()`

---

**Document Version:** 1.0  
**Last Updated:** November 4, 2025  
**Author:** VibrationFit Development Team

