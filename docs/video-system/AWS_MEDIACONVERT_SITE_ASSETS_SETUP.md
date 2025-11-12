# AWS MediaConvert - Site Assets Configuration ✅

## What Was Configured

Your AWS Lambda function `video-processor-trigger` now automatically processes **all videos** uploaded to `site-assets/` in addition to user uploads.

## Changes Made

### 1. Lambda Function Updated
- **Function:** `video-processor-trigger`
- **Region:** `us-east-2`
- **Code:** Updated to handle both `user-uploads/` and `site-assets/` paths
- **Status:** ✅ Deployed (CodeSha256: KQ4RfRGMRllm6d1oJo6Gtyyz41fPTBQRLRC3abFUwQ4=)

### 2. S3 Event Triggers Configured
Two separate triggers now fire the Lambda:

#### Trigger 1: User Uploads
- **ID:** `TriggerMediaConvertUserUploads`
- **Prefix:** `user-uploads/`
- **Behavior:** 
  - Converts videos to 1080p, 720p, original MP4
  - Generates thumbnails
  - Updates Supabase database with processed URLs
  - Outputs to `/processed/` subfolder

#### Trigger 2: Site Assets (NEW)
- **ID:** `TriggerMediaConvertSiteAssets`
- **Prefix:** `site-assets/`
- **Behavior:**
  - Converts videos to 1080p, 720p, original MP4
  - Generates thumbnails
  - **No database updates** (site assets don't need DB tracking)
  - Outputs to **same folder** with quality suffixes

### 3. Processing Logic
The Lambda now:
- Detects if upload is under `site-assets/` or `user-uploads/`
- Skips already-processed variants (files with `-1080p`, `-720p`, `-original`, `-thumb` suffixes)
- Routes outputs appropriately:
  - User uploads → `user-uploads/{userId}/{folder}/processed/`
  - Site assets → `site-assets/{path}/` (same folder as source)

## How It Works

### Example: Marketing Video Upload

**You upload:**
```
s3://vibration-fit-client-storage/site-assets/video/marketing/hero/intro-video.mov
```

**Lambda automatically creates:**
```
site-assets/video/marketing/hero/intro-video-1080p.mp4    (5 Mbps, optimized)
site-assets/video/marketing/hero/intro-video-720p.mp4     (2.5 Mbps, mobile)
site-assets/video/marketing/hero/intro-video-original.mp4 (8 Mbps, high quality)
site-assets/video/marketing/hero/intro-video-thumb.jpg    (thumbnail at 1s)
```

**CDN URLs:**
```
https://media.vibrationfit.com/site-assets/video/marketing/hero/intro-video-1080p.mp4
https://media.vibrationfit.com/site-assets/video/marketing/hero/intro-video-720p.mp4
https://media.vibrationfit.com/site-assets/video/marketing/hero/intro-video-original.mp4
https://media.vibrationfit.com/site-assets/video/marketing/hero/intro-video-thumb.jpg
```

### Processing Time
- **Upload:** 10-30 seconds (original file)
- **MediaConvert:** 2-3 minutes (background)
- **Result:** 3 optimized videos + 1 thumbnail ready for CDN

### Cost
- **MediaConvert:** ~$0.0075/minute of video
- **10-minute video:** ~$0.075 per upload
- **Storage:** Compressed files are ~80% smaller than originals

## Testing

### Test Upload via Admin Panel
1. Go to admin assets uploader
2. Upload a video to any `site-assets/` subfolder
3. Wait 2-3 minutes
4. Check S3 for `-1080p.mp4`, `-720p.mp4`, `-original.mp4`, `-thumb.jpg`

### Test Upload via CLI
```bash
# Upload a test video
aws s3 cp test-video.mov s3://vibration-fit-client-storage/site-assets/video/test/ --region us-east-2

# Wait 2-3 minutes, then check for outputs
aws s3 ls s3://vibration-fit-client-storage/site-assets/video/test/ --region us-east-2
```

### Check Lambda Logs
```bash
# View recent logs
aws logs tail /aws/lambda/video-processor-trigger --follow --region us-east-2
```

**Expected log output for site asset:**
```
📁 Processing: s3://vibration-fit-client-storage/site-assets/video/test/test-video.mov
🎬 Triggering MediaConvert for video: { isSiteAsset: true, ... }
✅ MediaConvert job created: [job-id]
   Outputs: Thumbnail, Original, 1080p, 720p
```

## Environment Variables (Already Set)
```
AWS_REGION=us-east-2
BUCKET_NAME=vibration-fit-client-storage
MEDIACONVERT_ROLE_ARN=arn:aws:iam::428923191740:role/MediaConvertRole
MEDIACONVERT_ENDPOINT=https://mediaconvert.us-east-2.amazonaws.com
SUPABASE_URL=https://nxjhqibnlbwzzphewncj.supabase.co
SUPABASE_SERVICE_KEY=[configured]
```

## Next Steps

### 1. Update Existing Site Asset References
If you have existing videos in the codebase that reference raw files, update them to use the optimized versions:

**Before:**
```tsx
<video src="https://media.vibrationfit.com/site-assets/video/hero.mov" />
```

**After:**
```tsx
<video src="https://media.vibrationfit.com/site-assets/video/hero-1080p.mp4" />
```

### 2. Batch Process Existing Videos
If you have existing videos in `site-assets/` that need processing, you can:

**Option A: Re-upload via Admin Panel**
- Download existing videos
- Re-upload through admin assets uploader
- Lambda will auto-process

**Option B: Trigger via Copy (preserves metadata)**
```bash
# Copy to trigger Lambda (copies within S3, fast)
aws s3 cp \
  s3://vibration-fit-client-storage/site-assets/video/existing-video.mov \
  s3://vibration-fit-client-storage/site-assets/video/existing-video.mov \
  --metadata-directive REPLACE \
  --region us-east-2
```

### 3. Monitor First Few Uploads
- Check CloudWatch logs for any errors
- Verify outputs appear in S3
- Test CDN URLs work correctly

## Troubleshooting

### Lambda Not Triggering
```bash
# Check S3 event configuration
aws s3api get-bucket-notification-configuration \
  --bucket vibration-fit-client-storage \
  --region us-east-2
```

### MediaConvert Job Fails
```bash
# List recent jobs
aws mediaconvert list-jobs \
  --endpoint https://mediaconvert.us-east-2.amazonaws.com \
  --region us-east-2 \
  --max-results 10

# Get job details
aws mediaconvert get-job \
  --endpoint https://mediaconvert.us-east-2.amazonaws.com \
  --region us-east-2 \
  --id [job-id]
```

### Check Lambda Execution Role
```bash
# View role policies
aws iam get-role \
  --role-name LambdaVideoProcessorRole \
  --region us-east-2
```

## Files Modified
- `lambda-video-processor/index.js` - Added site-assets handling logic
- `lambda-video-processor/README.md` - Updated documentation
- S3 bucket notification configuration - Added site-assets trigger

## Summary
✅ Lambda function updated and deployed  
✅ S3 triggers configured for both user-uploads and site-assets  
✅ Processing logic handles both paths correctly  
✅ No database pollution from site asset processing  
✅ Ready for production use  

**Your site asset videos will now be automatically optimized on upload!** 🎉

