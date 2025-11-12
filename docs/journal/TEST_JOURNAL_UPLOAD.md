# Journal Video Upload Test Plan

## 🎯 Goal
Test the complete video upload, processing, and playback flow for the `/journal` page.

## 📋 Test Steps

### 1️⃣ Upload a Video (Choose one scenario)

#### Scenario A: Small Video (< 20MB) - FFmpeg Compression
- Upload a video under 20MB (e.g., 5–10MB `.mov` or `.mp4`)
- Expected: FFmpeg compresses to MP4, uploads to S3, and should play in browser
- Location: `user-uploads/{userId}/journal/uploads/`

#### Scenario B: Large Video (> 20MB) - MediaConvert Processing
- Upload a video over 20MB (e.g., 50–100MB `.mov`)
- Expected: MediaConvert job is triggered, processed video appears later
- Location: `user-uploads/{userId}/journal/uploads/processed/`

### 2️⃣ Watch the Console Logs

Open browser DevTools Console and look for:

```
✅ Upload started logs
✅ Video processing check logs
✅ Compression completed OR MediaConvert job created logs
✅ S3 upload success logs
✅ Journal entry saved logs
```

### 3️⃣ Check S3 Storage

Go to AWS S3 Console → `vibration-fit-client-storage` bucket:

**For Small Videos (< 20MB):**
- File should appear in: `user-uploads/{userId}/journal/uploads/`
- Filename should be: `{timestamp}-{randomId}-{filename}-compressed.mp4}`

**For Large Videos (> 20MB):**
- Original should appear in: `user-uploads/{userId}/journal/uploads/`
- Processed should appear in: `user-uploads/{userId}/journal/uploads/processed/`
- Filename should be: `{originalFilename}-compressed.mp4`

### 4️⃣ Verify Journal Entry

1. Go to `/journal` page
2. Find your new entry
3. Click on the entry
4. Video should play automatically

### 5️⃣ Check AWS MediaConvert (For Large Videos)

Go to AWS MediaConvert Console:
1. Filter by your user ID or timestamp
2. Look for job with status: `COMPLETE`, `PROGRESSING`, or `SUBMITTED`
3. Check job details for output path

## 🐛 Debugging Commands

If something fails, run these to diagnose:

### Check if files are in S3:
```bash
aws s3 ls s3://vibration-fit-client-storage/user-uploads/{userId}/journal/uploads/ --recursive
```

### Check MediaConvert jobs:
```bash
aws mediaconvert list-jobs --region us-east-2 --max-results 10
```

### Check environment variables:
```bash
# These should be set in Vercel:
# MEDIACONVERT_ROLE_ARN
# MEDIACONVERT_ENDPOINT
```

## 🔍 What to Look For

### Success Indicators ✅
- Video uploads immediately to S3
- Console shows "Compression completed" for small videos
- Console shows "MediaConvert job created" for large videos
- Video plays in browser
- File appears in S3 bucket

### Failure Indicators ❌
- Console errors during upload
- Video doesn't appear in S3
- Video exists in S3 but won't play
- MediaConvert job not found
- "403 Forbidden" errors when loading video

## 🎬 Ready to Test!

Pick a scenario (A or B) and let's go! 🚀

