# 🚀 Complete Lambda Deployment Guide

## ✅ What We Built

1. **Lambda Function** (`lambda-video-processor/index.js`) - Auto-triggers MediaConvert
2. **VideoProcessingOverlay Component** - Shows "VIVA is processing your video!"
3. **720p Output** - Fast playback optimized video

## 📋 Step-by-Step Deployment

### Step 1: Install Dependencies
```bash
cd lambda-video-processor
npm install
```

### Step 2: Create Deployment Package
```bash
zip -r function.zip index.js node_modules package.json
```

### Step 3: Create Lambda Function in AWS Console

1. Go to [AWS Lambda Console](https://console.aws.amazon.com/lambda)
2. Click "Create function"
3. Choose "Author from scratch"
4. Configuration:
   - **Function name**: `video-processor-trigger`
   - **Runtime**: Node.js 20.x
   - **Architecture**: x86_64
5. Click "Create function"

### Step 4: Upload Function Code

1. In the Lambda function page, scroll to "Code source"
2. Click "Upload from" → ".zip file"
3. Upload `function.zip`

### Step 5: Set Environment Variables

Scroll to "Configuration" → "Environment variables" → "Edit":

```bash
AWS_REGION=us-east-2
BUCKET_NAME=vibration-fit-client-storage
MEDIACONVERT_ROLE_ARN=arn:aws:iam::428923191740:role/MediaConvertRole
MEDIACONVERT_ENDPOINT=https://mediaconvert.us-east-2.amazonaws.com
AWS_ACCESS_KEY_ID=(from your Vercel env)
AWS_SECRET_ACCESS_KEY=(from your Vercel env)
```

### Step 6: Increase Timeout

1. Go to "Configuration" → "General configuration" → "Edit"
2. Set "Timeout" to **5 minutes**

### Step 7: Add S3 Trigger

1. Go to [S3 Console](https://console.aws.amazon.com/s3)
2. Select `vibration-fit-client-storage` bucket
3. Go to "Properties" tab
4. Scroll to "Event notifications"
5. Click "Create event notification"
6. Configure:
   - **Event name**: `trigger-video-processing`
   - **Prefix**: `user-uploads/`
   - **Event types**: ✅ `All object create events`
   - **Destination**: `Lambda function` → `video-processor-trigger`
7. Click "Save changes"

### Step 8: Add Lambda Permissions

The Lambda needs permission to call MediaConvert. Add to Lambda execution role:

1. Go to [IAM Console](https://console.aws.amazon.com/iam)
2. Find the Lambda execution role (e.g., `video-processor-trigger-role`)
3. Click "Add permissions" → "Create inline policy"
4. Use this JSON:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "MediaConvertAccess",
      "Effect": "Allow",
      "Action": [
        "mediaconvert:CreateJob",
        "mediaconvert:GetJob",
        "mediaconvert:ListJobs"
      ],
      "Resource": "*"
    }
  ]
}
```

## 🧪 Testing

1. Upload a video (>20MB) via your journal page
2. Go to Lambda console → Monitor tab
3. Watch for invocations and logs
4. Check MediaConvert console for new jobs
5. File should appear in `/processed/` folder after ~5 minutes

## 🎨 Frontend Integration

The `VideoProcessingOverlay` component is ready to use:

```tsx
import { VideoProcessingOverlay } from '@/components/VideoProcessingOverlay'

<VideoProcessingOverlay
  videoKey={s3Key}
  originalUrl={originalUrl}
  onProcessed={(processedUrl) => {
    // Video is ready!
    setVideoUrl(processedUrl)
  }}
/>
```

## 🎉 Done!

Now when videos are uploaded:
1. They appear immediately (original)
2. Lambda triggers MediaConvert
3. User sees "VIVA is processing your video!" overlay
4. After ~5 minutes, 720p version appears
5. Overlay disappears, shows optimized video

## 📝 Notes

- Original video is hidden while processing (for clean UX)
- 720p version is much smaller and faster to load
- If processing fails, original video still works
- Check CloudWatch logs for debugging

