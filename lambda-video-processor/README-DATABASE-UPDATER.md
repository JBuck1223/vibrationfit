# Video Processor Database Updater Lambda

This Lambda function updates the database when MediaConvert completes processing.

## Setup

### 1. Create Lambda Function

```bash
cd lambda-video-processor

# Create deployment package
zip -r index-database-updater.zip index-database-updater.js package.json

# Create function
aws lambda create-function \
  --function-name video-processor-database-updater \
  --runtime nodejs20.x \
  --role arn:aws:iam::428923191740:role/LambdaVideoProcessorRole \
  --handler index.handler \
  --zip-file fileb://index-database-updater.zip \
  --timeout 60 \
  --memory-size 256
```

### 2. Configure S3 Event Trigger

```bash
# Add S3 notification for processed videos
aws s3api put-bucket-notification-configuration \
  --bucket vibration-fit-client-storage \
  --notification-configuration '{
    "LambdaFunctionConfigurations": [{
      "Id": "ProcessedVideoDatabaseUpdater",
      "LambdaFunctionArn": "arn:aws:lambda:us-east-2:428923191740:function:video-processor-database-updater",
      "Events": ["s3:ObjectCreated:Put"],
      "Filter": {
        "Key": {
          "FilterRules": [{
            "Name": "suffix",
            "Value": "-720p.mp4"
          }, {
            "Name": "prefix",
            "Value": "user-uploads/"
          }]
        }
      }
    }]
  }'

# Grant permission for S3 to invoke Lambda
aws lambda add-permission \
  --function-name video-processor-database-updater \
  --principal s3.amazonaws.com \
  --statement-id s3-invoke \
  --action "lambda:InvokeFunction" \
  --source-arn arn:aws:s3:::vibration-fit-client-storage
```

### 3. Test

Upload a video to `/journal/uploads/` and verify:
1. MediaConvert processes it to `/journal/uploads/processed/file-720p.mp4`
2. Database updater Lambda detects the new processed file
3. Database entry is updated to use the processed URL

## How It Works

1. **User uploads video** → S3: `user-uploads/{userId}/journal/uploads/file.mov`
2. **MediaConvert processes it** → S3: `user-uploads/{userId}/journal/uploads/processed/file-720p.mp4`
3. **S3 event triggers** this Lambda
4. **Lambda calls API** → `/api/media/process-completed`
5. **API finds journal entry** by searching for original URL
6. **API updates database** to use processed URL

## Manual Test

Create test event:

```json
{
  "Records": [{
    "eventSource": "aws:s3",
    "s3": {
      "bucket": {
        "name": "vibration-fit-client-storage"
      },
      "object": {
        "key": "user-uploads/test-user/journal/uploads/processed/test-video-720p.mp4"
      }
    }
  }]
}
```

Then invoke:

```bash
aws lambda invoke \
  --function-name video-processor-database-updater \
  --payload file://test-event.json \
  --region us-east-2 \
  response.json
```

