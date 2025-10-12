# Recording Feature Setup Guide

## Quick Start (5 minutes)

### 1. Add OpenAI API Key

Add this to your `.env.local` file:

```bash
OPENAI_API_KEY=sk-proj-your-key-here
```

**Get your API key:**
1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key and paste it in `.env.local`

### 2. Restart Your Dev Server

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

### 3. Test the Feature

Visit: http://localhost:3000/test-recording

Try:
- ✅ Record audio and see automatic transcription
- ✅ Record video
- ✅ Use the integrated textarea with recording

### 4. Use in Your App

The HealthSection already has recording enabled! Go to:
- `/profile/edit` → Health & Vitality section
- Click the microphone icon in the story field
- Record your health story

## Adding Recording to Other Sections

### Option 1: Use RecordingTextarea (Recommended)

Replace any `Textarea` with `RecordingTextarea`:

```tsx
// Before
import { Textarea } from '@/lib/design-system/components'

<Textarea
  value={profile.career_work_story || ''}
  onChange={(e) => handleInputChange('career_work_story', e.target.value)}
  placeholder="Your career story..."
  rows={4}
/>

// After
import { RecordingTextarea } from '@/components/RecordingTextarea'

<RecordingTextarea
  label="My Career Story"
  value={profile.career_work_story || ''}
  onChange={(value) => handleInputChange('career_work_story', value)}
  placeholder="Type or record your career story..."
  rows={6}
  allowVideo={false} // Set to true if you want video recording too
/>
```

### Option 2: Use MediaRecorderComponent Directly

For custom implementations:

```tsx
import { MediaRecorderComponent } from '@/components/MediaRecorder'

<MediaRecorderComponent
  mode="audio"
  onRecordingComplete={(blob, transcript) => {
    // Do something with the recording and transcript
    console.log('Transcript:', transcript)
  }}
  autoTranscribe={true}
  maxDuration={600}
/>
```

## Pricing & Costs

### OpenAI Whisper API
- **$0.006 per minute** of audio
- No monthly minimum
- Pay only for what you use

**Example costs:**
- 10 users × 5 min recording = $0.30
- 100 users × 5 min recording = $3.00
- 1000 users × 5 min recording = $30.00

**Very affordable!** Even with heavy usage, costs are minimal.

### S3 Storage
- Recordings stored in your existing S3 bucket
- Standard S3 pricing applies (pennies per GB)
- CDN delivery included

## Deployment Checklist

Before deploying to production:

- [ ] Add `OPENAI_API_KEY` to Vercel environment variables
- [ ] Test recording on production URL (HTTPS required)
- [ ] Verify S3 bucket permissions
- [ ] Test on mobile devices
- [ ] Check browser compatibility

### Add to Vercel

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add:
   - Name: `OPENAI_API_KEY`
   - Value: `sk-proj-your-key-here`
   - Environment: Production, Preview, Development
4. Redeploy

## Features Included

✅ **Audio Recording**
- High-quality audio capture
- Automatic transcription
- Pause/resume
- Duration limits

✅ **Video Recording**
- Video + audio capture
- Live preview
- WebM format

✅ **AI Transcription**
- OpenAI Whisper API
- High accuracy
- Word timestamps
- Multi-language support

✅ **Cloud Storage**
- S3 upload
- CDN delivery
- Secure URLs

✅ **Components**
- MediaRecorderComponent (full UI)
- RecordingTextarea (integrated)
- Recording service (helpers)

## Browser Requirements

**Audio Recording:**
- Chrome 49+
- Firefox 25+
- Safari 14.1+
- Edge 79+
- Mobile browsers ✅

**Video Recording:**
- Chrome 53+
- Firefox 29+
- Safari 14.1+
- Edge 79+
- Mobile limited ⚠️

**HTTPS Required:**
- Recording requires HTTPS (or localhost)
- Production must use HTTPS
- Vercel provides HTTPS automatically

## Troubleshooting

### "OpenAI API key is invalid"
- Check `.env.local` has correct key
- Restart dev server
- Verify key at https://platform.openai.com

### "Failed to access microphone"
- Grant browser permissions
- Check if another app is using mic
- Try different browser
- Ensure HTTPS (not HTTP)

### "Transcription failed"
- Check API key is set
- Verify audio is clear
- Check file size (< 25MB)
- Check OpenAI API status

### Recording not working on mobile
- Ensure HTTPS
- Grant permissions
- Try different browser
- Check device compatibility

## Next Steps

1. **Add to all story fields** - Update remaining profile sections
2. **Add to journal** - Enable recording in journal entries
3. **Add to vision board** - Record vision statements
4. **Customize UI** - Match your brand colors
5. **Add features** - Real-time transcription, editing, etc.

## Support

- **Documentation:** See `RECORDING_FEATURE.md`
- **Test Page:** `/test-recording`
- **OpenAI Docs:** https://platform.openai.com/docs/guides/speech-to-text

## Summary

You now have a complete recording and transcription system! 

**What you can do:**
- Record audio/video anywhere in your app
- Automatic AI transcription
- Upload to S3 storage
- Seamless user experience

**Cost:** ~$0.006/minute (very affordable!)

**Next:** Add `OPENAI_API_KEY` to `.env.local` and test at `/test-recording`

🎉 **You're all set!**

