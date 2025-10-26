# Lambda Video Processor - Auto-Trigger MediaConvert

This Lambda function automatically triggers MediaConvert jobs when videos are uploaded to S3.

## 🚀 Deployment Steps

### 1. Create Lambda Function
```bash
cd lambda-video-processor
npm install
zip -r function.zip index.js node_modules package.json
```

### 2. Upload to AWS Lambda
1. Go to AWS Lambda Console
2. Click "Create function"
3. Choose "Author from scratch"
4. Function name: `video-processor-trigger`
5. Runtime: Node.js 20.x
6. Upload `function.zip`
7. Set these environment variables:
   - `AWS_REGION`: us-east-2
   - `BUCKET_NAME`: vibration-fit-client-storage
   - `MEDIACONVERT_ROLE_ARN`: (your MediaConvert role ARN)
   - `MEDIACONVERT_ENDPOINT`: (your MediaConvert endpoint)
   - `AWS_ACCESS_KEY_ID`: (from Vercel env)
   - `AWS_SECRET_ACCESS_KEY`: (from Vercel env)

### 3. Add S3 Event Trigger
1. Go to S3 Console
2. Select `vibration-fit-client-storage` bucket
3. Go to "Properties" → "Event notifications"
4. Click "Create event notification"
5. Configure:
   - Event name: `trigger-video-processing`
   - Prefix: `user-uploads/`
   - Suffix: (leave empty or add video extensions)
   - Event types: `PUT` (ObjectCreated)
6. Destination: Lambda function → `video-processor-trigger`

### 4. Set Permissions
Lambda needs permission to:
- Read from S3 (already has this from event)
- Call MediaConvert CreateJob

Add IAM policy to Lambda execution role:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
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

## ✅ What Happens

1. User uploads video via presigned URL → File lands in S3
2. S3 triggers Lambda function
3. Lambda creates MediaConvert job
4. MediaConvert processes video to 720p
5. Output goes to `/processed/` folder
6. User sees processing overlay, then processed video appears

## 🧪 Testing

Upload a video and watch Lambda logs in CloudWatch to verify it's working!

