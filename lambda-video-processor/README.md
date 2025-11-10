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

### 3. Add S3 Event Triggers
**Two triggers are configured:**
1. **User Uploads Trigger**
   - Prefix: `user-uploads/`
   - Processes user-generated videos
   - Updates database after processing
   
2. **Site Assets Trigger**
   - Prefix: `site-assets/`
   - Processes marketing/admin videos
   - No database updates (site assets only)

**To update via CLI:**
```bash
aws s3api put-bucket-notification-configuration \
  --bucket vibration-fit-client-storage \
  --notification-configuration '{
    "LambdaFunctionConfigurations": [
      {
        "Id": "TriggerMediaConvertUserUploads",
        "LambdaFunctionArn": "arn:aws:lambda:us-east-2:428923191740:function:video-processor-trigger",
        "Events": ["s3:ObjectCreated:*"],
        "Filter": {
          "Key": {
            "FilterRules": [{"Name": "prefix", "Value": "user-uploads/"}]
          }
        }
      },
      {
        "Id": "TriggerMediaConvertSiteAssets",
        "LambdaFunctionArn": "arn:aws:lambda:us-east-2:428923191740:function:video-processor-trigger",
        "Events": ["s3:ObjectCreated:*"],
        "Filter": {
          "Key": {
            "FilterRules": [{"Name": "prefix", "Value": "site-assets/"}]
          }
        }
      }
    ]
  }'
```

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
5. Output goes to `/processed/` folder (user uploads) or the same directory with `-1080p` / `-720p` suffixes (site assets)
6. User sees processing overlay, then processed video appears

### Site Asset Videos
- Add an additional S3 event notification with prefix `site-assets/`
- When a video is uploaded under `site-assets/`, MediaConvert generates `-1080p`, `-720p`, and `-original` MP4 variants plus a `-thumb` image in the same folder
- Processed site asset variants will not trigger database updates

## 🧪 Testing

Upload a video and watch Lambda logs in CloudWatch to verify it's working!

