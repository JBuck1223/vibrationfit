# Journal Video Recording Feature

**Last Updated:** December 21, 2024  
**Status:** Active

## Overview

Added standalone video recording functionality to the journal system, allowing users to record videos directly from their camera with front/back camera selection.

## Features

### 1. Dedicated Video Recording UI
- **Full-screen recording interface** with camera preview
- **Camera selection modal** - Choose between front (user) or back (environment) camera
- **3-second countdown** before recording starts
- **Live recording indicator** with duration counter
- **Camera switching** during recording
- **Preview playback** before saving
- **Retake option** if not satisfied

### 2. Upload Flow
- Videos are uploaded to S3 in the `journal` folder
- Upload progress shown with file size and status
- Videos stored as line items with metadata (URL, type, size, timestamp)
- Combined with audio recordings in the `audio_recordings` JSONB field

### 3. Display & Playback
- Video recordings shown as cards with video icon
- Inline video player with controls
- File size and timestamp metadata displayed
- Videos displayed on journal entry view page
- Videos can be deleted before saving

## Technical Implementation

### Components Created

#### `JournalVideoRecorder.tsx`
Full-screen video recording modal with:
- Three-step flow: Choose Camera → Recording → Preview
- MediaRecorder API integration
- WebM video format (VP9 codec)
- Real-time duration tracking
- S3 upload integration

### Modified Files

#### `src/app/journal/new/page.tsx`
- Added `videoRecordings` state array
- Added "Record Video" button above journal content
- Integrated `JournalVideoRecorder` modal
- Combined video + audio recordings before saving
- Display video recordings as cards with preview

#### `src/app/journal/[id]/page.tsx`
- Added `SavedRecordings` component to display recordings
- Shows both audio and video recordings from `audio_recordings` field

#### `src/app/journal/[id]/edit/page.tsx`
- Already supports video recordings through existing `audioRecordings` state
- No changes needed (uses same JSONB field)

## Database Schema

The `journal_entries` table uses the existing `audio_recordings` JSONB field to store both audio and video recordings:

```sql
audio_recordings jsonb DEFAULT '[]'::jsonb NOT NULL
```

**Structure:**
```json
[
  {
    "url": "https://s3.../video-123.webm",
    "type": "video",
    "category": "journal",
    "created_at": "2024-12-21T...",
    "size": 5242880
  }
]
```

## User Flow

1. **Navigate to** `/journal/new`
2. **Click** "Record Video" button
3. **Choose** front or back camera
4. **Camera opens** in full-screen with 3-second countdown
5. **Record** video (can switch cameras during recording)
6. **Stop** recording with red square button
7. **Preview** video with playback controls
8. **Choose:**
   - **Retake** → Returns to camera selection
   - **Save Video** → Uploads to S3 and adds to entry
9. **Video appears** as upload line item with preview
10. **Submit** journal entry to save everything

## Storage

- **Folder:** `journal/` in S3
- **Format:** WebM (video/webm with VP9 codec)
- **Naming:** `video-{timestamp}.webm`
- **Fallback:** Uses default WebM if VP9 not supported

## Browser Compatibility

- **Chrome/Edge:** Full support (VP9 codec)
- **Firefox:** Full support (VP9 codec)
- **Safari:** WebM support (may use different codec)
- **Mobile:** Full support on iOS Safari and Android Chrome

## Future Enhancements

- [ ] Video thumbnail generation
- [ ] Video trimming/editing before upload
- [ ] Multiple video recordings per entry
- [ ] Video compression options
- [ ] Transcription for video audio track
- [ ] Video quality selection (720p, 1080p)
- [ ] Time limit configuration
- [ ] Video filters/effects

## Related Files

- `src/components/JournalVideoRecorder.tsx` - Main video recorder component
- `src/components/SavedRecordings.tsx` - Display component for recordings
- `src/app/journal/new/page.tsx` - New journal entry page
- `src/app/journal/[id]/page.tsx` - View journal entry page
- `src/app/journal/[id]/edit/page.tsx` - Edit journal entry page
- `src/lib/services/recordingService.ts` - S3 upload service

## Testing Checklist

- [x] Camera permission request works
- [x] Front camera selection works
- [x] Back camera selection works
- [x] Camera switching during recording works
- [x] Recording duration counter updates
- [x] Stop recording creates valid video blob
- [x] Preview playback works
- [x] Retake returns to camera selection
- [x] Save uploads to S3 successfully
- [x] Video appears as line item with preview
- [x] Video can be deleted before submission
- [x] Journal entry saves with video recording
- [x] Video displays on entry view page
- [x] Video plays in SavedRecordings component

