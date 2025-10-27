# VibrationFit Video File Management System

**Last Updated:** January 27, 2025  
**Author:** VibrationFit Development Team

## Overview

The VibrationFit video file management system provides automated video processing, transcoding, thumbnail generation, and storage optimization for user-uploaded videos. The system uses AWS MediaConvert for video processing and automatically manages original uploads, processed versions, and database synchronization.

## Architecture

### Components

1. **AWS S3 Bucket** (`vibration-fit-client-storage`)
   - Stores original uploads and processed video versions
   - Organized by user ID and content type (journal, vision-board, evidence)

2. **AWS Lambda Function** (`video-processor-trigger`)
   - Monitors S3 for new video uploads
   - Triggers MediaConvert jobs
   - Updates database with processed video URLs
   - Deletes original uploads after processing

3. **AWS MediaConvert**
   - Transcodes videos into multiple quality versions
   - Generates thumbnails
   - Provides consistent video formats

4. **Supabase Database**
   - Stores journal entries with video URLs
   - Maintains `image_urls` and `thumbnail_urls` fields

## File Structure

### S3 Directory Layout

```
s3://vibration-fit-client-storage/
└── user-uploads/
    └── {userId}/
        └── {folder}/           # journal, vision-board, evidence, etc.
            └── uploads/        # Original uploads stored here
                ├── original-file.mov
                └── processed/  # MediaConvert outputs
                    ├── original-file-thumb.0000000.jpg
                    ├── original-file-1080p.mp4
                    ├── original-file-720p.mp4
                    └── original-file-original.mp4
```

### File Naming Convention

**Original Upload:** `{timestamp}-{random}.{ext}`  
Example: `1761543527733-z3kh6prflj8-oliver-test.mov`

**Processed Versions:**
- `{baseFilename}-thumb.0000000.jpg` - Thumbnail (1920x1080, captured at 1 second)
- `{baseFilename}-1080p.mp4` - High quality (1920x1080, 5 Mbps)
- `{baseFilename}-720p.mp4` - Medium quality (1280x720, 2.5 Mbps)
- `{baseFilename}-original.mp4` - Compressed original (8 Mbps)

## Processing Flow

### 1. Upload Phase

When a user uploads a video:

```javascript
// Frontend upload via presigned URL
const uploadUrl = await getPresignedUrl(s3Key, fileType)
await fetch(uploadUrl, { method: 'PUT', body: file })
```

The file is uploaded directly to S3 using a presigned URL, bypassing the Next.js server.

**S3 Path:** `user-uploads/{userId}/journal/uploads/{filename}.mov`

### 2. MediaConvert Trigger

When a new file is uploaded to S3:

1. **S3 Event Notification** triggers the Lambda function
2. **Lambda validates** that it's a video file (.mp4, .mov, .avi, .mkv, .webm)
3. **Lambda checks** that it's not already processed (not in `/processed/` folder)
4. **Lambda creates** a MediaConvert job with multiple outputs

### 3. MediaConvert Job Configuration

The Lambda creates a job with **4 output groups**, processed in order:

#### Output 1: Thumbnail (Processed First)
- **Format:** JPEG (RAW container)
- **Resolution:** 1920x1080
- **Capture Time:** 1 second into video
- **Quality:** 90
- **Naming:** `{baseFilename}-thumb.0000000.jpg`
- **Purpose:** Immediate placeholder while videos transcode

#### Output 2: Original Compressed
- **Format:** MP4 (H.264/AAC)
- **Bitrate:** 8 Mbps (max 10 Mbps)
- **Quality:** Single-pass HQ
- **Naming:** `{baseFilename}-original.mp4`
- **Purpose:** MP4 version of original (handles 4K uploads)

#### Output 3: 1080p High Quality
- **Format:** MP4 (H.264/AAC)
- **Resolution:** 1920x1080
- **Bitrate:** 5 Mbps (max 6 Mbps)
- **Profile:** High Profile, Level 4.1
- **Naming:** `{baseFilename}-1080p.mp4`
- **Purpose:** Default playback quality

#### Output 4: 720p Medium Quality
- **Format:** MP4 (H.264/AAC)
- **Resolution:** 1280x720
- **Bitrate:** 2.5 Mbps (max 3 Mbps)
- **Profile:** Main Profile, Level 4
- **Naming:** `{baseFilename}-720p.mp4`
- **Purpose:** Fallback for slower connections

### 4. Database Updates

As MediaConvert completes each output, S3 events trigger database updates:

#### Thumbnail Processed (`-thumb.0000000.jpg`)
1. Lambda receives S3 event
2. Extracts thumbnail URL
3. Finds matching journal entry by video URL
4. Adds thumbnail URL to `thumbnail_urls` JSONB array

```javascript
// Database update
{
  thumbnail_urls: [
    "https://media.vibrationfit.com/user-uploads/.../processed/file-thumb.0000000.jpg"
  ]
}
```

#### 1080p Video Processed (`-1080p.mp4`)
1. Lambda receives S3 event
2. Extracts 1080p URL
3. Finds matching journal entry by original video URL
4. **Replaces** original URL in `image_urls` with 1080p URL

```javascript
// Before
{
  image_urls: [
    "https://media.vibrationfit.com/user-uploads/.../uploads/file.mov"
  ]
}

// After
{
  image_urls: [
    "https://media.vibrationfit.com/user-uploads/.../processed/file-1080p.mp4"
  ]
}
```

#### Original Processed (`-original.mp4`)
1. Lambda receives S3 event
2. After database updates, **deletes original upload**
3. Tries multiple file extensions (.mov, .mp4, .webm, etc.)
4. Logs deletion for debugging

### 5. Frontend Playback

The frontend video player automatically selects the best quality:

```typescript
// Priority: 1080p → 720p → Original
const getProcessedVideoUrl = (originalUrl: string) => {
  // If already processed, use as-is
  if (originalUrl.includes('/processed/')) {
    return originalUrl
  }
  
  // Check for 1080p first
  const url1080p = originalUrl.replace(/\/uploads\//, '/uploads/processed/')
    .replace(/\.(mov|mp4|webm)$/i, '-1080p.mp4')
  
  // If 1080p exists, return it; otherwise fall back to original
  return url1080p // or fallback logic
}
```

**Thumbnail Display:**
```typescript
// Use thumbnail from database
const thumbnailUrl = entry.thumbnail_urls?.[0] || generateThumbnailUrl(entry.image_urls[0])

<Video 
  src={processedUrl} 
  poster={thumbnailUrl}
  variant="card"
  controls={true}
/>
```

## Deletion Flow

When a user deletes a journal entry:

### 1. Frontend Request
```javascript
// Collect all media URLs (original + processed + thumbnails)
const allMediaUrls = [
  ...entry.image_urls,
  ...entry.thumbnail_urls
]

// Send to delete API
await fetch('/api/journal/delete-media', {
  method: 'POST',
  body: JSON.stringify({ urls: allMediaUrls })
})
```

### 2. Delete API Processing
The `/api/journal/delete-media` API route:

1. **Extracts S3 keys** from URLs
2. **Identifies processed files** (containing `/processed/`)
3. **Derives base filename** (removes quality suffixes)
4. **Generates all related files**:
   - Original file with all possible extensions
   - All processed versions (-1080p, -720p, -original)
   - Thumbnail files
5. **Batch deletes** all files via S3 `DeleteObjectsCommand`

### 3. Database Deletion
After S3 files are deleted:
```javascript
await supabase
  .from('journal_entries')
  .delete()
  .eq('id', entryId)
```

## Key Features

### Automatic Cleanup
- **Original uploads** are automatically deleted after processing completes
- **No manual intervention** required
- **Storage costs** are minimized

### Quality Fallback
- **1080p** is the default quality
- **720p** available as fallback
- **Original** only used if processed versions unavailable

### Immediate Placeholder
- **Thumbnail** processes first (within seconds)
- **Displays immediately** while videos transcode
- **Provides user feedback** that video is processing

### Database Synchronization
- **Automatic updates** as processing completes
- **No polling** required from frontend
- **Event-driven architecture**

### Error Handling
- **S3 deletion errors** are logged but don't block database deletion
- **Missing files** are gracefully handled
- **Extension guessing** handles unknown original formats

## Monitoring & Debugging

### CloudWatch Logs
Monitor Lambda execution:
```bash
aws logs tail /aws/lambda/video-processor-trigger --follow
```

### Common Log Messages
- `🎬 Triggering MediaConvert for video` - Job created
- `✅ MediaConvert job created` - Job submitted successfully
- `🎬 Processing ${quality} file` - Database update started
- `✅ Successfully updated ${tableName}` - Database updated
- `🧹 All processing complete, deleting original` - Cleanup started
- `✅ Deleted original file` - Original removed

### Database Verification
Check processing status:
```sql
-- View entries with processed videos
SELECT 
  id, 
  title, 
  image_urls, 
  thumbnail_urls,
  created_at
FROM journal_entries
WHERE image_urls::text LIKE '%processed/-1080p%'
ORDER BY created_at DESC;
```

## Configuration

### Lambda Environment Variables
- `BUCKET_NAME` - S3 bucket name
- `MEDIACONVERT_ROLE_ARN` - MediaConvert execution role
- `MEDIACONVERT_ENDPOINT` - MediaConvert API endpoint
- `SUPABASE_URL` - Supabase API URL
- `SUPABASE_SERVICE_KEY` - Supabase service role key

### S3 Event Notification
Trigger for: `ObjectCreated` events in `user-uploads/`  
Target: Lambda function `video-processor-trigger`

### MediaConvert Settings
- **Role:** `MediaConvertRole` with S3 read/write permissions
- **Region:** `us-east-2`
- **Endpoint:** `https://mediaconvert.us-east-2.amazonaws.com`
- **Output location:** Same path as input, in `/processed/` subfolder

## Cost Considerations

### Storage Costs
- **Original uploads** deleted after processing (saves ~80% storage)
- **Multiple quality versions** stored for playback flexibility
- **Thumbnails** are small (~500KB each)

### MediaConvert Costs
- **Per minute** of video processed
- **Multiple outputs** count as separate processing
- **Thumbnail** processing is minimal cost

### Best Practices
- Upload videos at source resolution (let MediaConvert handle encoding)
- Delete unused journal entries regularly
- Monitor CloudWatch for processing errors
- Use 1080p as default to balance quality and cost

## Future Enhancements

1. **Adaptive Bitrate Streaming** - HLS/DASH support for seamless quality switching
2. **Video Analytics** - Track playback, engagement, drop-off points
3. **Background Processing** - Queue large uploads for batch processing
4. **Watermarking** - Add VibrationFit branding to videos
5. **Content Moderation** - Automated video content review

## Troubleshooting

### Videos Not Processing
**Symptoms:** Original video remains unchanged, no processed versions  
**Solutions:**
- Check CloudWatch logs for Lambda errors
- Verify S3 event notification is configured
- Check MediaConvert job status in AWS console
- Verify Lambda IAM permissions

### Thumbnails Not Showing
**Symptoms:** Video loads but no poster image  
**Solutions:**
- Check `thumbnail_urls` field in database
- Verify MediaConvert thumbnail output exists in S3
- Check CloudWatch logs for thumbnail processing errors

### Originals Not Deleting
**Symptoms:** Original uploads remain in S3 after processing  
**Solutions:**
- Check Lambda logs for deletion errors
- Verify S3 permissions on Lambda execution role
- Check that `-original.mp4` is being created by MediaConvert

---

**Document Version:** 1.0  
**Maintained By:** VibrationFit Engineering Team  
**Last Review:** January 27, 2025
