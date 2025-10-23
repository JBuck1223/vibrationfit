#!/bin/bash

# VibrationFit AWS Lambda Backup Deployment Script
# Creates and deploys the Lambda function for automated S3 backups

set -e

echo "🚀 VibrationFit AWS Lambda Backup Deployment"
echo "============================================="
echo ""

# Configuration
FUNCTION_NAME="vibrationfit-s3-backup"
ROLE_NAME="VibrationFitBackupRole"
SCHEDULE_EXPRESSION="cron(0 7 * * ? *)"  # 2 AM EST = 7 AM UTC
REGION="us-east-2"

echo "📋 Configuration:"
echo "   Function name: $FUNCTION_NAME"
echo "   Role name: $ROLE_NAME"
echo "   Schedule: Daily at 2 AM EST (7 AM UTC)"
echo "   Region: $REGION"
echo ""

# Check if AWS CLI is configured
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo "❌ Error: AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

echo "✅ AWS CLI configured"
echo ""

# Create IAM role for Lambda
echo "🔧 Creating IAM role for Lambda function..."

# Trust policy for Lambda
cat > lambda-trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# IAM policy for S3 access
cat > lambda-s3-policy.json << EOF
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
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
EOF

# Create the role
if aws iam get-role --role-name "$ROLE_NAME" >/dev/null 2>&1; then
    echo "✅ IAM role $ROLE_NAME already exists"
else
    aws iam create-role \
        --role-name "$ROLE_NAME" \
        --assume-role-policy-document file://lambda-trust-policy.json \
        --description "Role for VibrationFit S3 backup Lambda function"
    
    echo "✅ IAM role $ROLE_NAME created"
fi

# Attach policies
aws iam put-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-name "S3BackupPolicy" \
    --policy-document file://lambda-s3-policy.json

echo "✅ IAM policies attached"
echo ""

# Wait for role to be ready
echo "⏳ Waiting for IAM role to be ready..."
sleep 10

# Get role ARN
ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text)
echo "✅ Role ARN: $ROLE_ARN"
echo ""

# Create deployment package
echo "📦 Creating Lambda deployment package..."

# Create a temporary directory
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

# Copy the Lambda function code
cp /Users/jordanbuckingham/Desktop/vibrationfit/s3-backup/lambda-backup.py lambda_function.py

# Create deployment package
zip -r lambda-deployment.zip lambda_function.py

echo "✅ Deployment package created"
echo ""

# Create or update Lambda function
echo "🚀 Deploying Lambda function..."

if aws lambda get-function --function-name "$FUNCTION_NAME" >/dev/null 2>&1; then
    echo "📝 Updating existing Lambda function..."
    aws lambda update-function-code \
        --function-name "$FUNCTION_NAME" \
        --zip-file fileb://lambda-deployment.zip
    
    aws lambda update-function-configuration \
        --function-name "$FUNCTION_NAME" \
        --role "$ROLE_ARN" \
        --timeout 900 \
        --memory-size 512 \
        --description "Automated S3 backup for VibrationFit client storage"
    
    echo "✅ Lambda function updated"
else
    echo "🆕 Creating new Lambda function..."
    aws lambda create-function \
        --function-name "$FUNCTION_NAME" \
        --runtime python3.9 \
        --role "$ROLE_ARN" \
        --handler lambda_function.lambda_handler \
        --zip-file fileb://lambda-deployment.zip \
        --timeout 900 \
        --memory-size 512 \
        --description "Automated S3 backup for VibrationFit client storage"
    
    echo "✅ Lambda function created"
fi

echo ""

# Create EventBridge rule for scheduling
echo "⏰ Setting up EventBridge schedule..."

RULE_NAME="vibrationfit-backup-schedule"

if aws events describe-rule --name "$RULE_NAME" >/dev/null 2>&1; then
    echo "✅ EventBridge rule $RULE_NAME already exists"
else
    aws events put-rule \
        --name "$RULE_NAME" \
        --schedule-expression "$SCHEDULE_EXPRESSION" \
        --description "Daily trigger for VibrationFit S3 backup"
    
    echo "✅ EventBridge rule created"
fi

# Add Lambda permission for EventBridge
aws lambda add-permission \
    --function-name "$FUNCTION_NAME" \
    --statement-id "AllowExecutionFromEventBridge" \
    --action "lambda:InvokeFunction" \
    --principal events.amazonaws.com \
    --source-arn "arn:aws:events:$REGION:$(aws sts get-caller-identity --query Account --output text):rule/$RULE_NAME" \
    2>/dev/null || echo "✅ Permission already exists"

# Add Lambda target to EventBridge rule
aws events put-targets \
    --rule "$RULE_NAME" \
    --targets "Id"="1","Arn"="arn:aws:lambda:$REGION:$(aws sts get-caller-identity --query Account --output text):function:$FUNCTION_NAME"

echo "✅ EventBridge target configured"
echo ""

# Test the function
echo "🧪 Testing Lambda function..."
aws lambda invoke \
    --function-name "$FUNCTION_NAME" \
    --payload '{}' \
    response.json

if [ $? -eq 0 ]; then
    echo "✅ Lambda function test successful"
    echo "📄 Response:"
    cat response.json | python3 -m json.tool
else
    echo "❌ Lambda function test failed"
fi

echo ""

# Cleanup
cd /Users/jordanbuckingham/Desktop/vibrationfit
rm -rf "$TEMP_DIR"
rm -f lambda-trust-policy.json lambda-s3-policy.json

echo "🎉 AWS Lambda backup system deployed successfully!"
echo ""
echo "📋 Summary:"
echo "   ✅ Lambda function: $FUNCTION_NAME"
echo "   ✅ IAM role: $ROLE_NAME"
echo "   ✅ Schedule: Daily at 2 AM EST"
echo "   ✅ EventBridge rule: $RULE_NAME"
echo ""
echo "🔍 Monitor your backups:"
echo "   AWS Console: https://console.aws.amazon.com/lambda/"
echo "   CloudWatch Logs: /aws/lambda/$FUNCTION_NAME"
echo ""
echo "🧪 Manual test:"
echo "   aws lambda invoke --function-name $FUNCTION_NAME --payload '{}' test-response.json"
echo ""
echo "🛡️ Your VibrationFit S3 backups now run automatically on AWS!"
