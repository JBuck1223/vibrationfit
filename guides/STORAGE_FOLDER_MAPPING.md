# VibrationFit Storage Folder Mapping

## S3 Bucket Structure

**Bucket:** `vibration-fit-client-storage`  
**Base Path:** `user-uploads/{userId}/{folder}/...`

---

## Folder Mapping

### 1. **avatar** - Profile Pictures
- **Used by:** Profile picture upload
- **Files:** Profile headshots
- **Max Size:** 20MB per file
- **Types:** JPEG, PNG, WEBP
- **Upload Location:** `src/app/api/upload/profile-picture/route.ts`
- **S3 Path:** `user-uploads/{userId}/avatar/{timestamp}-{random}-{filename}`

### 2. **vision-board** - Vision Board Images
- **Used by:** Vision Board items
- **Files:** Manifestation images (uploaded or AI-generated)
- **Max Size:** 100MB per file
- **Types:** JPEG, PNG, GIF, WEBP
- **Upload Location:** `src/app/vision-board/new/page.tsx`
- **S3 Path:** `user-uploads/{userId}/vision-board/{timestamp}-{random}-{filename}`

### 3. **journal** - Journal Files
- **Used by:** Conscious Creation Journal
- **Files:** Photos, videos, audio evidence
- **Max Size:** 1GB per file
- **Types:** Images, videos (MP4, MOV, WEBM), audio (MP3, WAV)
- **Upload Location:** `src/app/journal/new/page.tsx`
- **S3 Path:** `user-uploads/{userId}/journal/{timestamp}-{random}-{filename}`

### 4. **life-vision** - Life Vision Audio
- **Used by:** Life Vision audio generation
- **Files:** TTS MP3 files for vision sections
- **Max Size:** 100MB per file
- **Types:** MP3, WAV
- **Upload Location:** `src/lib/services/audioService.ts`
- **S3 Path:** `user-uploads/{userId}/life-vision/audio/{visionId}/{sectionKey}-{hash}.mp3`
- **Note:** Nested structure includes visionId subfolder

### 5. **evidence** - Profile Story Recordings
- **Used by:** Profile edit sections (voice/video recordings)
- **Files:** WebM audio/video recordings
- **Max Size:** 1GB per file
- **Types:** Images, videos, audio (WEBM, MP3, WAV, OGG)
- **Upload Location:** `src/lib/services/recordingService.ts`
- **S3 Path:** `user-uploads/{userId}/evidence/{timestamp}-{random}-{filename}`

### 6. **alignment-plan** - Alignment Plans (Future)
- **Used by:** Alignment plan features (not yet implemented)
- **Files:** TBD
- **Max Size:** TBD
- **S3 Path:** `user-uploads/{userId}/alignment-plan/...`

### 7. **custom-tracks** - Custom Audio (Future)
- **Used by:** Custom audio uploads (not yet implemented)
- **Files:** User-uploaded audio tracks
- **Max Size:** TBD
- **S3 Path:** `user-uploads/{userId}/custom-tracks/...`

---

## Current Usage (Your Account)

Based on real data for user `720adebb-e6c0-4f6c-a5fc-164d128e083a`:

| Folder | Files | Storage | Usage |
|--------|-------|---------|-------|
| **Journal** | 1 | 349.76 MB | 86.3% | 
| **Life Vision** | 14 | 41.12 MB | 10.1% |
| **Evidence** | 15 | 13.97 MB | 3.4% |
| **Vision Board** | 2 | 0.39 MB | 0.1% |
| **Avatar** | 8 | 0.17 MB | 0.04% |
| **TOTAL** | 40 | 405.34 MB | 100% |

---

## Folder Type Mapping (in Code)

From `src/lib/storage/s3-storage-presigned.ts`:

```typescript
export const USER_FOLDERS = {
  visionBoard: 'vision-board',    // Maps to 'vision-board' in S3
  journal: 'journal',              // Maps to 'journal' in S3
  lifeVision: 'life-vision',       // Maps to 'life-vision' in S3
  alignmentPlan: 'alignment-plan', // Maps to 'alignment-plan' in S3
  evidence: 'evidence',            // Maps to 'evidence' in S3
  avatar: 'avatar',                // Maps to 'avatar' in S3
  customTracks: 'custom-tracks',   // Maps to 'custom-tracks' in S3
} as const
```

---

## Storage Dashboard Labels

From `src/app/dashboard/storage/page.tsx`:

```typescript
const FOLDER_LABELS = {
  'avatar': 'Profile',
  'vision-board': 'Vision Board',
  'journal': 'Journal',
  'life-vision': 'Life Vision',
  'evidence': 'Profile Recordings',
  'alignment-plan': 'Alignment Plans',
  'custom-tracks': 'Custom Audio',
  'other': 'Other',
}
```

---

## Validation Rules

From `src/lib/storage/s3-storage-presigned.ts`:

```typescript
export const FILE_VALIDATIONS = {
  visionBoard: {
    maxSize: 100 * 1024 * 1024,    // 100MB
    types: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },
  journal: {
    maxSize: 1024 * 1024 * 1024,   // 1GB
    types: ['image/*', 'video/*', 'audio/*'],
  },
  lifeVision: {
    maxSize: 100 * 1024 * 1024,    // 100MB  
    types: ['audio/mpeg', 'audio/wav'],
  },
  evidence: {
    maxSize: 1024 * 1024 * 1024,   // 1GB
    types: ['image/*', 'video/*', 'audio/*'],
  },
  avatar: {
    maxSize: 20 * 1024 * 1024,     // 20MB
    types: ['image/jpeg', 'image/png', 'image/webp'],
  },
}
```

---

## File Naming Conventions

All files follow this pattern:
```
{timestamp}-{randomString}-{sanitizedFilename}.{ext}
```

Example:
```
1759634394600-9rc9bvft1ik-flower-fields.jpeg
```

**Breakdown:**
- `1759634394600` - Unix timestamp (ms)
- `9rc9bvft1ik` - Random string for uniqueness
- `flower-fields` - Sanitized original filename
- `.jpeg` - File extension

---

## Special Cases

### Life Vision Audio
These files use a different naming pattern for caching:
```
{sectionKey}-{contentHash}.mp3
```

Example: `business-2be2da74f877.mp3`

**Why?** Content-based hashing allows regeneration detection - if the text is the same, reuse the cached audio file instead of calling OpenAI again.

### Nested Folders
Life Vision audio uses an extra nested level:
```
user-uploads/{userId}/life-vision/audio/{visionId}/...
```

This groups all audio tracks for a specific vision together.

---

## Audit Checklist

✅ All uploads use correct folder from `USER_FOLDERS` mapping  
✅ Vision Board → `vision-board`  
✅ Journal → `journal`  
✅ Profile Pictures → `avatar`  
✅ Profile Recordings → `evidence`  
✅ Life Vision Audio → `life-vision/audio/{visionId}/`  
✅ Storage tracker correctly parses all folder types  
✅ Labels match actual usage  

---

**Everything is correctly organized!** 🎯

