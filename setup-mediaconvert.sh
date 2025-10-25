#!/bin/bash

# AWS MediaConvert Setup Script
# Run this script with AWS admin credentials

echo "🎬 Setting up AWS MediaConvert..."

# Step 1: Create MediaConvert Role
echo "Creating MediaConvert IAM role..."
aws iam create-role \
  --role-name MediaConvertRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "mediaconvert.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      }
    ]
  }'

# Step 2: Attach S3 policies
echo "Attaching S3 policies to MediaConvert role..."
aws iam attach-role-policy \
  --role-name MediaConvertRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

# Step 3: Get MediaConvert endpoint
echo "Getting MediaConvert endpoint..."
aws mediaconvert describe-endpoints

# Step 4: Get account ID
echo "Getting AWS account ID..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "Account ID: $ACCOUNT_ID"

# Step 5: Display role ARN
echo "MediaConvert Role ARN:"
echo "arn:aws:iam::${ACCOUNT_ID}:role/MediaConvertRole"

echo "✅ MediaConvert setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy the MediaConvert endpoint URL"
echo "2. Copy the Role ARN above"
echo "3. Add these to your .env.local file"
