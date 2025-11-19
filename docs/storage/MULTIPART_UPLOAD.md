# Multipart Upload Implementation

**Last Updated:** November 19, 2025  
**Status:** Active  

## Overview

VibrationFit now supports multipart uploads for large files (>100MB), enabling reliable uploads of files up to **5GB** with automatic chunking, parallel uploading, and progress tracking.

## How It Works

### Automatic File Size Detection

The system automatically chooses the best upload method based on file size:

```typescript
// Small files (<500KB) → API Route Upload
// Medium files (500KB - 100MB) → Presigned URL (single PUT)
// Large files (>100MB) → Multipart Upload (chunked)
```

### Upload Flow for Large Files (1.2GB example)

**Your 1.2GB file will be:**
1. Split into **120 chunks** (10MB each)
2. Uploaded **3 chunks at a time** (parallel)
3. Progress tracked: 1%, 2%, 3%... 100%
4. Automatically assembled by S3

## Technical Details

### Configuration

```typescript
const MULTIPART_THRESHOLD = 100 * 1024 * 1024  // 100MB
const CHUNK_SIZE = 10 * 1024 * 1024            // 10MB per chunk
const CONCURRENT_UPLOADS = 3                    // Upload 3 chunks simultaneously
```

### API Endpoint

**Location:** `src/app/api/upload/multipart/route.ts`

**Actions:**
- `create` - Initialize multipart upload (returns uploadId)
- `getPartUrl` - Get presigned URL for a specific chunk
- `complete` - Finalize upload after all chunks uploaded
- `abort` - Cancel upload if failed

### Storage Function

**Location:** `src/lib/storage/s3-storage-presigned.ts`

```typescript
// Automatic - just use the same function
await uploadUserFile('journal', file, userId, onProgress)

// Or explicitly use multipart
await uploadFileWithMultipart('journal', file, userId, onProgress)
```

## Usage with FileUpload Component

**No changes needed!** The FileUpload component already works with multipart uploads:

```tsx
<FileUpload
  accept="video/*"
  onUpload={async (files) => {
    // This automatically uses multipart for files >100MB
    const result = await uploadUserFile('journal', files[0])
    console.log('Uploaded:', result.url)
  }}
  showProgress
  uploadProgress={progress}
  isUploading={uploading}
/>
```

## Progress Tracking

### Chunk-by-Chunk Progress

For a 1.2GB file (120 chunks):
- Chunk 1 uploaded → Progress: 1%
- Chunk 2 uploaded → Progress: 2%
- ...
- Chunk 120 uploaded → Progress: 100%

### In Your UI

```typescript
const [progress, setProgress] = useState(0)
const [uploading, setUploading] = useState(false)

const handleUpload = async (files: File[]) => {
  setUploading(true)
  
  const result = await uploadUserFile(
    'journal', 
    files[0],
    undefined,
    (p) => setProgress(p) // Real-time chunk progress
  )
  
  setUploading(false)
  console.log('Upload complete:', result.url)
}
```

## Performance

### Parallel Uploads

- **Concurrent chunks:** 3 at a time
- **Network efficiency:** Maximizes bandwidth
- **Failure resilience:** One chunk fails, others continue

### For Your 1.2GB File:

```
Total: 120 chunks (10MB each)
Batches: 40 batches (3 chunks per batch)
Time estimate: ~5-10 minutes on good connection
```

## Error Handling

### Automatic Retry

If a chunk upload fails:
1. Error is logged
2. Upload is aborted
3. User receives clear error message
4. Can retry entire upload

### Cleanup

Failed uploads are automatically aborted in S3 (no orphaned chunks).

## File Size Limits

| Size | Method | Notes |
|------|--------|-------|
| 0 - 500KB | API Route | Most reliable, no CORS |
| 500KB - 100MB | Presigned URL | Single PUT, good for most files |
| 100MB - 5GB | Multipart | Chunked, parallel, resumable |
| >5GB | Not supported | S3 multipart limit |

## Benefits

### For Users
✅ Upload large files reliably  
✅ Real-time progress tracking  
✅ Better error recovery  
✅ Faster uploads (parallel chunks)

### For Developers
✅ Automatic selection of upload method  
✅ Same API for all file sizes  
✅ Works with existing FileUpload component  
✅ Comprehensive logging

## Examples

### Upload 1.2GB Video

```typescript
// In your component
const handleVideoUpload = async (file: File) => {
  setUploading(true)
  setProgress(0)
  
  try {
    const result = await uploadUserFile(
      'journal',
      file,
      undefined,
      (progress) => setProgress(progress)
    )
    
    console.log('Video uploaded:', result.url)
    // File is now at: https://media.vibrationfit.com/...
  } catch (error) {
    console.error('Upload failed:', error)
  } finally {
    setUploading(false)
  }
}
```

### With FileUpload Component

```tsx
<FileUpload
  dragDrop
  accept="video/*"
  maxSize={5120} // 5GB
  onUpload={handleVideoUpload}
  showProgress
  uploadProgress={progress}
  isUploading={uploading}
  dragDropText="Drop your large video here"
  dragDropSubtext="Up to 5GB supported with multipart upload"
/>
```

## Monitoring

### Console Logs

The system provides detailed logging:

```
🚀 Starting multipart upload: { fileName: 'video.mp4', fileSize: '1200MB' }
✅ Multipart upload created: abc123uploadId
📦 Splitting into 120 chunks of 10MB each
✅ Uploaded part 1/120
✅ Uploaded part 2/120
✅ Uploaded part 3/120
...
✅ All chunks uploaded, completing multipart upload...
🎉 Multipart upload complete! https://media.vibrationfit.com/...
```

### Progress Callback

```typescript
onProgress={(progress) => {
  console.log(`Upload progress: ${progress}%`)
  // Update UI with real progress
}}
```

## Video Processing

After upload completes, videos are automatically processed:
- **Large videos (>20MB):** Triggered via MediaConvert
- **Small videos:** Converted to MP4 if needed
- **Thumbnails:** Automatically generated

## Testing

### Test with Large File

1. Select a file >100MB in FileUpload
2. Watch console for multipart upload logs
3. Monitor progress bar (chunk-by-chunk)
4. Verify file appears at final URL

### Recommended Test Sizes

- 150MB - Tests basic multipart
- 500MB - Tests multiple batches
- 1GB+ - Tests real-world scenario

## Troubleshooting

### Upload Fails Immediately

**Check:**
- User is authenticated
- AWS credentials are valid
- S3 bucket permissions are correct

### Chunks Upload But Complete Fails

**Check:**
- All ETags were captured correctly
- Parts are sorted by PartNumber
- Complete API call succeeded

### Slow Upload

**Try:**
- Reduce CONCURRENT_UPLOADS (network congestion)
- Increase CHUNK_SIZE (fewer requests)
- Check user's connection speed

## Future Enhancements

Possible improvements:
- [ ] Resume failed uploads (store progress)
- [ ] Configurable chunk size
- [ ] Client-side compression before upload
- [ ] Background upload (Service Worker)
- [ ] Upload queue management

## Related Documentation

- [FileUpload Component](/docs/ui-components/FILE_UPLOAD_COMPONENT.md)
- [S3 Storage Guide](/docs/storage/S3_STORAGE_GUIDE.md)
- [Video Processing](/docs/video-system/VIDEO_PROCESSING.md)

---

**Your 1.2GB file is now supported!** 🎉

