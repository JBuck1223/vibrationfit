# VibrationFit S3 Compression System

## Overview

The VibrationFit compression system automatically optimizes media files (images and videos) before uploading them to Amazon S3. This reduces storage costs, improves load times, and provides a better user experience.

## Architecture

```
Journal Upload Flow:
┌─────────────────┐
│   User Upload   │
│    Image/Video  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│   File Size Check       │
│   (Multipart vs Direct) │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│   Compression Decision  │
│   Images > 5MB          │
│   Videos > 20MB         │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐      ┌──────────────────────┐
│  Image Compression      │ OR   │  Video Compression    │
│  (Sharp - Server-side)  │      │  (FFmpeg - Server)   │
└────────┬────────────────┘      └──────────┬───────────┘
         │                                   │
         └───────────────────┬──────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   S3 Upload      │
                    │   + Thumbnail    │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   Database Save  │
                    │   (Journal Entry)│
                    └──────────────────┘
```

## Compression Settings

### Image Compression

#### Threshold
- **Size**: 5MB
- Files larger than 5MB are automatically optimized
- Smaller files are uploaded as-is

#### Default Settings
```typescript
{
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 85,
  format: 'webp',
  progressive: true
}
```

#### Presets
- **Thumbnail**: 200x200, quality 80
- **Card**: 400x400, quality 85
- **Fullscreen**: 1920x1080, quality 90
- **Hero**: 2560x1440, quality 95

### Video Compression

#### Thresholds
- **Compression**: 20MB - Videos larger are compressed
- **MediaConvert**: 100MB - Very large videos use AWS MediaConvert

#### Settings Based on File Size

| Size Range | Max Resolution | Bitrate | Quality | Preset |
|-----------|----------------|---------|---------|--------|
| >500MB    | 1920x1080     | 2M      | 50      | fast   |
| 200-500MB | 1920x1080     | 3M      | 60      | medium |
| 100-200MB | 1920x1080     | 4M      | 70      | medium |
| 50-100MB  | 1920x1080     | 5M      | 75      | slow   |
| 20-50MB   | 1920x1080     | 6M      | 80      | slow   |

## File Structure

### Configuration
```
src/lib/config/compression.ts
```
Centralized compression settings that can be adjusted without touching upload logic.

### Image Optimization
```
src/lib/utils/imageOptimization.ts
```
Handles image compression using Sharp library.

### Video Optimization
```
src/lib/utils/videoOptimization.ts
```
Handles video compression using FFmpeg.

### Upload Route
```
src/app/api/upload/route.ts
```
Main upload handler that orchestrates compression and S3 upload.

## Usage

### Client-Side Upload

```typescript
import { uploadUserFile } from '@/lib/storage/s3-storage'

const result = await uploadUserFile(
  'journal',
  file,
  userId,
  (progress) => console.log(`Progress: ${progress}%`)
)

// Result contains:
// - url: CDN URL for the file
// - key: S3 key (for deletion)
```

### Compression is Automatic

The system automatically:
1. Detects file type (image/video)
2. Checks file size
3. Applies appropriate compression
4. Uploads to S3
5. Saves metadata to database

### Error Handling

- If FFmpeg is not available, videos are uploaded without compression
- If compression fails, original file is uploaded
- All errors are logged but don't block uploads
- Thumbnail generation failures are non-blocking

## Environment Variables

Required for S3 uploads:
```bash
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-2
```

Optional for MediaConvert:
```bash
MEDIACONVERT_ROLE_ARN=arn:aws:iam::...
MEDIACONVERT_ENDPOINT=https://...
```

## Dependencies

### Required
- **sharp**: Image processing and optimization
- **fluent-ffmpeg**: Video processing (needs FFmpeg binary)
- **@aws-sdk/client-s3**: S3 uploads

### FFmpeg Installation

#### Local Development
```bash
# macOS
brew install ffmpeg

# Ubuntu
sudo apt-get install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html
```

#### Production (Vercel)
Vercel doesn't include FFmpeg by default. For serverless functions:
1. Use MediaConvert for large videos (>100MB)
2. Or deploy with a custom runtime that includes FFmpeg

## Optimization Tips

### Adjusting Compression

Edit `src/lib/config/compression.ts`:

```typescript
// More aggressive compression (smaller files)
quality: 70  // Lower = smaller files

// Less compression (higher quality)
quality: 90  // Higher = better quality

// Different resolution
maxWidth: 1280  // Downscale to 720p
maxHeight: 720
```

### Choosing Upload Method

- **<50MB**: Direct upload with compression
- **50-100MB**: Multipart upload (no compression)
- **>100MB**: MediaConvert processing

## Monitoring

### Compression Logs

The system logs compression metrics:

```
✅ Compression completed:
   Original: 45.23MB
   Compressed: 12.34MB
   Ratio: 72.7%
```

### Check Compression Status

View browser console or server logs for:
- File size before/after
- Compression ratio
- Processing time
- Error messages

## Troubleshooting

### Videos Not Compressing

**Symptom**: Videos uploaded without compression

**Causes**:
1. FFmpeg not installed
2. File size below 20MB threshold
3. Unsupported format

**Solutions**:
1. Install FFmpeg: `brew install ffmpeg`
2. Adjust threshold in config
3. Convert to supported format (MP4)

### Images Not Optimizing

**Symptom**: Images uploaded as-is

**Causes**:
1. File smaller than 5MB
2. Already in WebP format
3. Sharp library error

**Solutions**:
1. Adjust threshold in config
2. Force optimization by lowering threshold
3. Check server logs for Sharp errors

### Slow Uploads

**Symptom**: Uploads taking too long

**Causes**:
1. Large files
2. Compression taking time
3. Slow network

**Solutions**:
1. Use MediaConvert for >100MB videos
2. Adjust compression quality/preset
3. Optimize on client-side first (future feature)

## Future Enhancements

- [ ] Client-side compression for better UX
- [ ] Progressive upload with live preview
- [ ] Multiple quality versions (adaptive streaming)
- [ ] Automatic format conversion
- [ ] Batch upload optimization

## Support

For issues or questions:
1. Check server logs for error messages
2. Verify FFmpeg installation: `ffmpeg -version`
3. Test with smaller files first
4. Review compression configuration

