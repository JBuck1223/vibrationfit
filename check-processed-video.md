# Check Processed Video Status

## 1. Check the Journal Page

Refresh `/journal` and check the browser console for:

```
✅ Using processed video: https://media.vibrationfit.com/...
📡 Response status: 200 true
```

If you see this, the frontend detected the processed video.

## 2. Check CloudWatch Logs (If Lambda is Deployed)

```bash
# View recent Lambda logs
aws logs tail /aws/lambda/video-processor-database-updater --follow

# Or check MediaConvert trigger Lambda
aws logs tail /aws/lambda/video-processor-trigger --follow
```

Look for:
- `✅ Successfully updated journal entry`
- `🎬 Processing completed video`

## 3. Check Database Directly

Query the journal table to see if the URL was updated:

```sql
SELECT id, title, image_urls 
FROM journal 
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC 
LIMIT 1;
```

Look for URLs ending in `-720p.mp4`.

## 4. Manual Database Update (If Lambda Not Deployed)

If the database wasn't updated automatically, you can manually update it:

```bash
# In browser console on /journal page
# The getProcessedVideoUrl function already detected the processed video
# Just refresh the page to see it work
```

## 5. Check S3

Verify the processed file exists:

```bash
aws s3 ls s3://vibration-fit-client-storage/user-uploads/YOUR_USER_ID/journal/uploads/processed/ --recursive | grep -720p
```

## Quick Test Commands

```bash
# Check what Lambda functions exist
aws lambda list-functions --region us-east-2 | grep video-processor

# Check if database updater Lambda exists
aws lambda get-function --function-name video-processor-database-updater --region us-east-2

# If it doesn't exist, you need to deploy it (see README-DATABASE-UPDATER.md)
```

