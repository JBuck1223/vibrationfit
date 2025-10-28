# Audio Processing Flow - Current Architecture

## How It Works NOW (Browser-Based)

### 1. Recording (In Browser)
- **MediaRecorder API** captures audio/video in browser memory
- **Chunks stored in memory**: `chunksRef.current.push(event.data)` (line 140)
- **Data collection**: Every 1 second (`mediaRecorder.start(1000)`)
- **Storage**: In browser memory only during recording
- **Max Duration**: 600 seconds (10 minutes)

### 2. Recording Completion
- When user clicks "Stop", `mediaRecorder.onstop` fires
- Creates Blob from chunks: `new Blob(chunksRef.current)`
- Blob stored in state: `setRecordedBlob(blob)`
- URL created: `URL.createObjectURL(blob)` (for playback)

### 3. Transcription
- Sends Blob to `/api/transcribe` endpoint
- OpenAI Whisper API processes it server-side
- Returns transcript text

### 4. Upload to S3
- Only happens if user checks "Save Recording" checkbox
- Uploads Blob to S3 via presigned URL
- Stores in appropriate folder (lifeVisionAudioRecordings, etc.)

---

## 🔴 RISKS WITH LONG RECORDINGS

### Current Data Loss Risks:

1. **Browser Crash/Close** = Lose all chunks (they're in memory)
2. **Tab Refresh** = Lose all chunks
3. **Power Loss** = Lose all chunks
4. **System Crash** = Lose all chunks
5. **No Auto-Save** = User manually stops before data is persisted
6. **Memory Limits** = Very long recordings could cause browser issues

### What IS Saved:
- ✅ Blob is created and stored in React state
- ✅ Can be re-transcribed if needed
- ✅ Can be uploaded after recording completes

### What is NOT Saved:
- ❌ No intermediate saves during recording
- ❌ Chunks only in browser memory
- ❌ Nothing persisted until user explicitly saves

---

## 🟢 CURRENT SAFEGUARDS

1. **Pause/Resume**: User can pause to take breaks
2. **Progress Timer**: Shows time elapsed
3. **Max Duration**: 10 minutes prevents extremely long recordings
4. **Manual Save Option**: Checkbox to save file
5. **Transcript Backup**: Transcript is stored even if file isn't saved
6. **Re-record Option**: Can start over if needed

---

## 💡 RECOMMENDATIONS FOR ROBUSTNESS

### Option 1: Progressive Auto-Save (Best for Long Recordings)
- Save chunks periodically to IndexedDB (browser storage)
- Every 30 seconds, save chunks to localStorage/IndexedDB
- Resume from saved state if browser crashes
- Upload to S3 in background

### Option 2: Stream to Server (Most Robust)
- Stream chunks to server in real-time
- Server saves to S3 as chunks arrive
- No data loss even if browser crashes
- More complex implementation

### Option 3: Warnings & Reminders (Simplest)
- Show "Save frequently!" warnings for long recordings
- Auto-save to IndexedDB every minute
- Remind users to complete the flow before leaving

---

## 📊 CURRENT STATE: 
**Risk Level**: Medium
- Data is in browser memory during recording
- Safe once Blob is created and saved
- Loses data on browser crash/close before completion
