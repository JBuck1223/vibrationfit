# 🚀 AWS Lambda Backup Setup Guide

Since we have IAM permission limitations, here's how to set up AWS-native backups manually:

## **Option 1: AWS Console Setup (Recommended)**

### **Step 1: Create Lambda Function**
1. Go to [AWS Lambda Console](https://console.aws.amazon.com/lambda/)
2. Click "Create function"
3. Choose "Author from scratch"
4. Function name: `vibrationfit-s3-backup`
5. Runtime: Python 3.9
6. Click "Create function"

### **Step 2: Add Function Code**
1. In the Lambda function, go to "Code" tab
2. Replace the default code with the contents of `lambda-backup.py`
3. Click "Deploy"

### **Step 3: Configure Function Settings**
1. Go to "Configuration" → "General configuration"
2. Click "Edit"
3. Timeout: 15 minutes (900 seconds)
4. Memory: 512 MB
5. Click "Save"

### **Step 4: Set Up IAM Role**
1. Go to "Configuration" → "Permissions"
2. Click on the execution role
3. Add this policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket",
                "s3:GetBucketLocation",
                "s3:HeadBucket"
            ],
            "Resource": [
                "arn:aws:s3:::vibration-fit-client-storage",
                "arn:aws:s3:::vibration-fit-client-storage/*",
                "arn:aws:s3:::vibration-fit-client-storage-backup",
                "arn:aws:s3:::vibration-fit-client-storage-backup/*"
            ]
        }
    ]
}
```

### **Step 5: Set Up EventBridge Schedule**
1. Go to [EventBridge Console](https://console.aws.amazon.com/events/)
2. Click "Rules" → "Create rule"
3. Name: `vibrationfit-backup-schedule`
4. Schedule expression: `cron(0 7 * * ? *)` (2 AM EST = 7 AM UTC)
5. Add target: Lambda function `vibrationfit-s3-backup`
6. Click "Create"

## **Option 2: Vercel Serverless Function**

Since you mentioned Vercel, we could also create a serverless function on Vercel:

### **Create API Route**
Create `src/app/api/backup/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command, CopyObjectCommand } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function POST(request: NextRequest) {
  try {
    const PRIMARY_BUCKET = "vibration-fit-client-storage"
    const BACKUP_BUCKET = "vibration-fit-client-storage-backup"
    
    // Your backup logic here
    // Similar to the Lambda function but in TypeScript
    
    return NextResponse.json({ 
      success: true, 
      message: "Backup completed successfully" 
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Backup failed' },
      { status: 500 }
    )
  }
}
```

### **Set Up Vercel Cron**
Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/backup",
      "schedule": "0 7 * * *"
    }
  ]
}
```

## **Option 3: Keep Current Setup**

Your current Mac-based cron job is actually working well! The only downside is it requires your Mac to be on at 2 AM.

## **Recommendation**

I recommend **Option 1 (AWS Lambda)** because:
- ✅ Runs on AWS infrastructure (always available)
- ✅ No dependency on your Mac being on
- ✅ Better monitoring and logging
- ✅ Cost: ~$0.20/month
- ✅ More reliable than Vercel cron

Would you like me to help you set up Option 1 through the AWS Console, or would you prefer Option 2 (Vercel serverless)?
