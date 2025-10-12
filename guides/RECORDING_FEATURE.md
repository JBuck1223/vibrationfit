# Audio/Video Recording & AI Transcription

## Overview

VibrationFit now supports native browser-based audio and video recording with automatic AI transcription using OpenAI's Whisper API. This feature allows users to record their stories, journal entries, and profile information by speaking instead of typing.

## Features

### 🎙️ Audio Recording
- **High-quality audio capture** using native MediaRecorder API
- **Automatic AI transcription** with OpenAI Whisper
- **Pause/resume functionality** during recording
- **Maximum duration limits** (configurable, default 10 minutes)
- **Real-time duration display**
- **WebM audio format** (opus codec)

### 🎥 Video Recording
- **Video + audio capture** from webcam/camera
- **Live camera preview** during recording
- **Pause/resume support**
- **WebM video format** (VP9/VP8 codec)
- **Same duration limits as audio**

### 🤖 AI Transcription
- **OpenAI Whisper API** integration
- **High accuracy** transcription
- **Word-level timestamps** (optional)
- **Multi-language support** (English default)
- **Cost: $0.006 per minute** (~$0.36/hour)

### ☁️ Cloud Storage
- **Direct S3 upload** using presigned URLs
- **CDN delivery** via CloudFront
- **Automatic file management**
- **Secure user-specific paths**

## Components

### 1. MediaRecorderComponent
The core recording component with full UI.

```tsx
import { MediaRecorderComponent } from '@/components/MediaRecorder'

<MediaRecorderComponent
  mode="audio" // or "video"
  onRecordingComplete={(blob, transcript) => {
    // Handle the recording and transcript
  }}
  autoTranscribe={true}
  maxDuration={600} // 10 minutes
/>
```

**Props:**
- `mode`: `'audio' | 'video'` - Recording type
- `onRecordingComplete`: Callback with blob and optional transcript
- `onTranscriptComplete`: Callback when transcription finishes
- `autoTranscribe`: Auto-transcribe audio recordings (default: true)
- `maxDuration`: Max recording time in seconds (default: 600)
- `className`: Additional CSS classes

### 2. RecordingTextarea
Integrated textarea with recording capability - perfect for profile stories.

```tsx
import { RecordingTextarea } from '@/components/RecordingTextarea'

<RecordingTextarea
  label="Your Story"
  value={storyText}
  onChange={setStoryText}
  placeholder="Type or record your story..."
  rows={6}
  allowVideo={false}
/>
```

**Props:**
- `value`: Current text value
- `onChange`: Text change handler
- `label`: Field label
- `placeholder`: Placeholder text
- `rows`: Textarea rows
- `allowVideo`: Enable video recording button (default: false)
- `disabled`: Disable input
- `className`: Additional CSS classes

### 3. Recording Service
Helper functions for uploading and transcribing.

```tsx
import { 
  uploadRecording, 
  uploadAndTranscribeRecording 
} from '@/lib/services/recordingService'

// Upload only
const { url, key } = await uploadRecording(blob, 'evidence')

// Upload + transcribe
const { url, key, transcript, duration } = await uploadAndTranscribeRecording(
  blob, 
  'evidence'
)
```

## API Routes

### POST /api/transcribe
Transcribes audio files using OpenAI Whisper.

**Request:**
```typescript
FormData {
  audio: File // Audio file (webm, mp3, wav, etc.)
}
```

**Response:**
```typescript
{
  transcript: string
  duration: number // seconds
  language: string
  words?: Array<{
    word: string
    start: number
    end: number
  }>
  success: true
}
```

**Error Response:**
```typescript
{
  error: string
  details?: string
}
```

## Setup

### 1. Environment Variables
Add your OpenAI API key to `.env.local`:

```bash
OPENAI_API_KEY=sk-...your-key-here
```

### 2. Install Dependencies
OpenAI SDK is already installed. If not:

```bash
npm install openai
```

### 3. S3 Configuration
Ensure your S3 bucket and presigned URL endpoints are configured (already done in VibrationFit).

## Usage Examples

### Example 1: Simple Audio Recording

```tsx
'use client'

import { MediaRecorderComponent } from '@/components/MediaRecorder'

export default function MyPage() {
  const handleRecording = (blob: Blob, transcript?: string) => {
    console.log('Recording:', blob)
    console.log('Transcript:', transcript)
  }

  return (
    <MediaRecorderComponent
      mode="audio"
      onRecordingComplete={handleRecording}
      autoTranscribe={true}
    />
  )
}
```

### Example 2: Profile Story with Recording

```tsx
'use client'

import { RecordingTextarea } from '@/components/RecordingTextarea'
import { useState } from 'react'

export default function ProfileStory() {
  const [story, setStory] = useState('')

  return (
    <RecordingTextarea
      label="My Health Story"
      value={story}
      onChange={setStory}
      placeholder="Share your health journey..."
      rows={8}
    />
  )
}
```

### Example 3: Manual Transcription

```tsx
const transcribeAudio = async (audioBlob: Blob) => {
  const formData = new FormData()
  formData.append('audio', audioBlob, 'recording.webm')

  const response = await fetch('/api/transcribe', {
    method: 'POST',
    body: formData
  })

  const { transcript } = await response.json()
  return transcript
}
```

## Browser Compatibility

### Audio Recording
- ✅ Chrome 49+
- ✅ Firefox 25+
- ✅ Safari 14.1+
- ✅ Edge 79+
- ✅ Mobile browsers (iOS Safari 14.3+, Chrome Android)

### Video Recording
- ✅ Chrome 53+
- ✅ Firefox 29+
- ✅ Safari 14.1+
- ✅ Edge 79+
- ⚠️ Limited mobile support (check device capabilities)

## Pricing

### OpenAI Whisper API
- **$0.006 per minute** of audio
- **$0.36 per hour** of audio
- **25MB max file size**
- **No monthly minimums**

### Example Costs:
- 1 minute recording: $0.006
- 5 minute recording: $0.03
- 10 minute recording: $0.06
- 100 recordings (5 min each): $3.00

### S3 Storage
- Standard S3 pricing applies
- Minimal cost for audio/video files
- CDN delivery included

## Security

### Authentication
- All API routes require authentication
- User-specific S3 paths
- Presigned URLs with expiration

### Privacy
- Recordings stored in user's private S3 folder
- Transcripts processed by OpenAI (see their privacy policy)
- No recordings stored on VibrationFit servers

### Permissions
- Browser requests microphone/camera permission
- Users must explicitly grant access
- Permissions can be revoked anytime

## Testing

Visit `/test-recording` to test all recording features:

```bash
npm run dev
# Navigate to http://localhost:3000/test-recording
```

The test page includes:
- Audio recording with transcription
- Video recording
- Integrated textarea component
- Feature demonstrations

## Troubleshooting

### "Failed to access camera/microphone"
- Check browser permissions
- Ensure HTTPS (required for getUserMedia)
- Try a different browser
- Check if another app is using the device

### "Transcription failed"
- Verify OPENAI_API_KEY is set
- Check audio file size (< 25MB)
- Ensure audio is clear and audible
- Check API quota/billing

### "Upload failed"
- Verify S3 configuration
- Check presigned URL expiration
- Ensure network connectivity
- Check file size limits

### Recording quality issues
- Use a good microphone
- Minimize background noise
- Speak clearly and at normal pace
- Check browser audio settings

## Future Enhancements

Potential improvements:
- [ ] Real-time transcription (streaming)
- [ ] Speaker diarization (who said what)
- [ ] Multiple language support UI
- [ ] Audio/video editing tools
- [ ] Noise cancellation
- [ ] Custom vocabulary/terminology
- [ ] Transcript editing interface
- [ ] Export transcripts as PDF/DOCX

## Support

For issues or questions:
1. Check the test page at `/test-recording`
2. Review browser console for errors
3. Verify environment variables
4. Check OpenAI API status

## License

Part of VibrationFit application. All rights reserved.

