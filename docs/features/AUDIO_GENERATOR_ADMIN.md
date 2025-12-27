# Audio Generator Admin Tool

**Last Updated:** December 23, 2024  
**Status:** Active

## 🎯 Overview

Beautiful web-based admin tool for generating healing frequency audio tracks with real-time progress tracking. No command line needed - everything happens in your browser!

## 🚀 Quick Start

1. Navigate to `/admin/audio-generator`
2. Click "Generate Solfeggio Tracks" or "Generate Basic Binaural"
3. Watch real-time progress
4. Tracks are automatically:
   - ✅ Generated with FFmpeg
   - ✅ Uploaded to S3
   - ✅ Added to database
   - ✅ Ready to use immediately!

## ✨ Features

### Real-Time Progress
- Live progress bar showing completion percentage
- File-by-file status updates
- Time elapsed counter
- Scrolling log of all actions

### Automatic Workflow
1. **Generation** - FFmpeg creates high-quality audio files
2. **Upload** - S3 upload with proper CDN configuration
3. **Database** - Auto-insert into `audio_background_tracks`
4. **Cleanup** - Temp files automatically removed

### Two Generation Types

#### Solfeggio Binaural System
- **40 total files** (36 combinations + 4 journeys)
- **9 Solfeggio frequencies** (174 Hz - 963 Hz)
- **4 Brainwave states** (Delta, Theta, Alpha, Beta)
- **~10 minute** generation time
- **~53 MB** total size

#### Basic Binaural Beats
- **6 files** (pure brainwave frequencies)
- **Delta through Gamma**
- **~2 minute** generation time
- **~7 MB** total size

## 🎨 User Interface

### Main Cards
- **Generation Options** - Choose Solfeggio or Basic
- **Current Job Status** - Real-time progress tracking
- **System Info** - Requirements and how it works

### Status Indicators
- 🟡 **Generating** - Creating audio files
- 🔵 **Uploading** - Sending to S3
- 🟢 **Inserting** - Adding to database
- ✅ **Complete** - All done!
- ❌ **Error** - Something went wrong

### Progress Display
```
Generating tracks...
23 / 40 files · 528hz-theta.mp3
[=================================>          ] 57%

[12:34:56] 🎵 Generating 528hz-theta.mp3...
[12:34:58] 📤 Uploading 528hz-theta.mp3...
[12:34:59] 💾 Adding 528hz-theta.mp3 to database...
[12:35:00] ✅ Complete!
```

## 🔧 Technical Details

### Server-Side Generation
- **Technology:** Node.js + FFmpeg
- **Method:** Server-Sent Events (SSE) for real-time updates
- **Duration:** 15 minute max (Next.js maxDuration)
- **Storage:** Temp files in `temp/solfeggio-binaural/`

### API Route
**Endpoint:** `POST /api/audio/generate-tracks`

**Request:**
```json
{
  "type": "solfeggio" | "binaural"
}
```

**Response:** Stream of Server-Sent Events
```
data: {"type":"progress","progress":25,"completed":10,"currentFile":"528hz-theta.mp3"}
data: {"type":"status","status":"uploading"}
data: {"type":"complete","message":"All done!"}
```

### File Generation

Each track is generated using FFmpeg:
```bash
ffmpeg -y \
  -f lavfi -i sine=frequency=525:duration=300 \  # Left ear
  -f lavfi -i sine=frequency=531:duration=300 \  # Right ear
  -filter_complex "[0:a]volume=-32dB[left];[1:a]volume=-32dB[right];[left][right]join=inputs=2:channel_layout=stereo[out]" \
  -map "[out]" \
  -codec:a libmp3lame \
  -b:a 128k \
  -ar 44100 \
  output.mp3
```

### S3 Upload

Files are uploaded with optimal settings:
- **Content-Type:** `audio/mpeg`
- **Cache-Control:** `max-age=31536000` (1 year)
- **ACL:** Public read
- **Path:** `site-assets/audio/mixing-tracks/solfeggio/binaural/`

### Database Insertion

Automatic upsert into `audio_background_tracks`:
```sql
INSERT INTO audio_background_tracks (
  name,
  display_name,
  category,
  file_url,
  description,
  sort_order,
  is_active
) VALUES (
  '528hz-theta',
  'DNA Repair Theta',
  'solfeggio',
  'https://media.vibrationfit.com/site-assets/audio/mixing-tracks/solfeggio/binaural/528hz-theta.mp3',
  'Love frequency, DNA repair, miracles with Deep meditation, creativity',
  200,
  true
)
ON CONFLICT (name) DO UPDATE SET ...
```

## 🎵 What Gets Generated

### Solfeggio Binaural (40 files)

**Static Combinations (36 files):**
```
174hz-delta.mp3      285hz-delta.mp3      ... 963hz-delta.mp3
174hz-theta.mp3      285hz-theta.mp3      ... 963hz-theta.mp3
174hz-alpha.mp3      285hz-alpha.mp3      ... 963hz-alpha.mp3
174hz-beta.mp3       285hz-beta.mp3       ... 963hz-beta.mp3
```

**Journey Tracks (4 files):**
```
journey-sleep-journey.mp3       (7 min)
journey-meditation-journey.mp3  (7 min)
journey-focus-journey.mp3       (7 min)
journey-healing-journey.mp3     (7 min)
```

### Basic Binaural (6 files)
```
delta.mp3         (2 Hz - Deep sleep)
theta.mp3         (6 Hz - Meditation)
alpha.mp3         (10 Hz - Relaxed focus)
beta-low.mp3      (15 Hz - Alert)
beta-high.mp3     (20 Hz - Concentration)
gamma.mp3         (40 Hz - Peak awareness)
```

## ⚙️ System Requirements

### Server Requirements
- ✅ FFmpeg installed
- ✅ Node.js 18+
- ✅ 100MB+ free disk space (temp files)
- ✅ Write access to `temp/` directory

### AWS Requirements
- ✅ S3 bucket: `vibration-fit-client-storage`
- ✅ CloudFront CDN configured
- ✅ Public read permissions
- ✅ AWS credentials in environment variables:
  - `AWS_REGION`
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`

### Database Requirements
- ✅ Supabase connection configured
- ✅ `audio_background_tracks` table exists
- ✅ Write permissions via service role

## 🔍 Monitoring & Debugging

### Check FFmpeg Installation
```bash
# Vercel/Production
which ffmpeg

# Should return: /usr/bin/ffmpeg or similar
```

### Check Logs
Real-time logs appear in the UI, but also check:
- **Browser Console** - Client-side errors
- **Vercel Logs** - Server-side generation errors
- **CloudWatch** - If running on AWS

### Common Issues

#### "FFmpeg not found"
**Solution:** Install FFmpeg on your server or add FFmpeg layer to Vercel

#### "S3 Upload Failed"
**Solution:** Verify AWS credentials and bucket permissions

#### "Database Insert Failed"  
**Solution:** Check Supabase connection and table schema

#### "Generation Timeout"
**Solution:** Increase `maxDuration` in API route (max 900s on Hobby plan)

## 📊 Performance

### Generation Speed
- **Solfeggio (40 files):** ~10 minutes
  - Generation: ~6 minutes
  - Upload: ~2 minutes
  - Database: ~2 minutes

- **Basic (6 files):** ~2 minutes
  - Generation: ~1 minute
  - Upload: ~30 seconds
  - Database: ~30 seconds

### Resource Usage
- **CPU:** High during FFmpeg generation
- **Memory:** ~200-300 MB
- **Disk:** ~100 MB temp (auto-cleaned)
- **Bandwidth:** ~50-60 MB upload

## 🚀 Deployment Notes

### Vercel Deployment
If deploying to Vercel, you'll need FFmpeg:

**Option 1: Use FFmpeg Layer**
```javascript
// vercel.json
{
  "functions": {
    "app/api/audio/generate-tracks/route.ts": {
      "maxDuration": 900,
      "memory": 1024
    }
  }
}
```

**Option 2: Use External Service**
Consider using:
- AWS Lambda with FFmpeg layer
- Cloudflare Workers + external FFmpeg API
- Dedicated generation server

### Environment Variables
```env
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

## 🎯 Future Enhancements

Potential additions:
1. **Batch generation** - Queue multiple types
2. **Custom parameters** - User-defined frequencies
3. **Preview** - Listen before generating all
4. **Scheduling** - Generate during off-peak hours
5. **Notifications** - Email when complete
6. **Analytics** - Track most-used frequencies

## 📚 Related Documentation

- **Solfeggio System:** `docs/features/SOLFEGGIO_BINAURAL_SYSTEM.md`
- **Lambda Mixer:** `docs/features/LAMBDA_MIXER_COMPATIBILITY.md`
- **Audio Mixing:** `docs/features/FLEXIBLE_AUDIO_MIXING_SYSTEM.md`
- **Admin Panel:** `src/app/admin/audio-mixer/page.tsx`

## 🔗 Quick Links

- **Admin Tool:** `/admin/audio-generator`
- **Audio Mixer:** `/admin/audio-mixer`
- **User Interface:** `/life-vision/[id]/audio/generate`

---

**Pro Tip:** Run generation during off-peak hours to minimize server load. The process is fully automated - just click and walk away!

🎵 **Generate healing frequencies with a single click!** 🎵

