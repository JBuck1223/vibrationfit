# AWS Lambda Function for Automatic Video Processing

## 🎯 Goal
Automatically process videos when they arrive in S3, without manual trigger.

## 📋 Implementation Options

### Option 1: S3 Event → Lambda → MediaConvert (Recommended)
- S3 PUT event triggers Lambda
- Lambda checks if it's a video
- Lambda triggers MediaConvert job
- MediaConvert processes video
- Result goes to `/processed/` folder

### Option 2: S3 Event → Lambda → FFmpeg
- S3 PUT event triggers Lambda
- Lambda downloads video
- Lambda uses FFmpeg to convert
- Lambda uploads processed version
- Higher Lambda costs, but simpler

### Option 3: S3 Event → EventBridge → MediaConvert
- S3 event → EventBridge rule
- EventBridge triggers MediaConvert
- Fully serverless, no Lambda needed
- Requires MediaConvert job template

## 🚀 Recommended: Option 1

### Why Lambda?
- Automatically triggers on S3 upload
- Only runs when needed (cost-efficient)
- Can check file type before processing
- Can route to different processors (FFmpeg vs MediaConvert)

### Why Not?
- Need to write Lambda function
- Need IAM permissions
- Need to deploy Lambda to AWS

## 💡 Simpler Alternative: Client-Side Processing

Instead of backend processing, convert `.mov` to `.mp4` on the CLIENT before upload:

```typescript
// Convert .mov to .mp4 in browser before upload
const convertedFile = await convertToMP4(file)
await uploadFile(convertedFile)
```

Benefits:
- No server processing needed
- Works immediately
- No AWS Lambda cost

## ❓ Your Preference

1. **Set up AWS Lambda** (automatic, requires AWS setup)
2. **Use client-side conversion** (immediate, no AWS needed)
3. **Keep current manual trigger** (works, but not automatic)

What would you prefer?

