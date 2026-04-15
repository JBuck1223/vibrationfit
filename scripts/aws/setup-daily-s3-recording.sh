#!/usr/bin/env bash
#
# One-time setup: Configure Daily.co to write recordings directly to your S3 bucket.
#
# Prerequisites:
#   - AWS CLI configured with admin-level credentials
#   - DAILY_API_KEY env var set (or pass as argument)
#   - The S3 bucket "vibration-fit-client-storage" must already exist
#
# Usage:
#   DAILY_API_KEY=your_key ./scripts/aws/setup-daily-s3-recording.sh
#
# What this does:
#   1. Enables versioning on the S3 bucket (required by Daily)
#   2. Creates an IAM policy granting Daily write access
#   3. Creates an IAM role that Daily's AWS account can assume
#   4. Configures the Daily domain to use the bucket for recordings

set -euo pipefail

BUCKET_NAME="vibration-fit-client-storage"
BUCKET_REGION="us-east-2"
DAILY_DOMAIN="vibrationfit"
DAILY_ACCOUNT_ID="291871421005"
ROLE_NAME="DailyRecordingRole"
POLICY_NAME="DailyRecordingS3Access"

DAILY_API_KEY="${DAILY_API_KEY:-}"
if [ -z "$DAILY_API_KEY" ]; then
  echo "ERROR: DAILY_API_KEY environment variable is required"
  exit 1
fi

echo "=== Daily.co Direct-to-S3 Recording Setup ==="
echo "Bucket:  $BUCKET_NAME"
echo "Region:  $BUCKET_REGION"
echo "Domain:  $DAILY_DOMAIN"
echo ""

# 1. Enable S3 versioning (required by Daily)
echo "[1/4] Enabling S3 bucket versioning..."
aws s3api put-bucket-versioning \
  --bucket "$BUCKET_NAME" \
  --versioning-configuration Status=Enabled
echo "  Done."

# 2. Create IAM policy
echo "[2/4] Creating IAM policy: $POLICY_NAME..."
POLICY_DOC=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:AbortMultipartUpload"
      ],
      "Resource": "arn:aws:s3:::${BUCKET_NAME}/*"
    }
  ]
}
EOF
)

POLICY_ARN=$(aws iam create-policy \
  --policy-name "$POLICY_NAME" \
  --policy-document "$POLICY_DOC" \
  --query 'Policy.Arn' \
  --output text 2>/dev/null || \
  aws iam list-policies --query "Policies[?PolicyName=='$POLICY_NAME'].Arn" --output text)

echo "  Policy ARN: $POLICY_ARN"

# 3. Create IAM role
echo "[3/4] Creating IAM role: $ROLE_NAME..."
TRUST_POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::${DAILY_ACCOUNT_ID}:root"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "sts:ExternalId": "${DAILY_DOMAIN}"
        }
      }
    }
  ]
}
EOF
)

ROLE_ARN=$(aws iam create-role \
  --role-name "$ROLE_NAME" \
  --assume-role-policy-document "$TRUST_POLICY" \
  --max-session-duration 43200 \
  --query 'Role.Arn' \
  --output text 2>/dev/null || \
  aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text)

echo "  Role ARN: $ROLE_ARN"

aws iam attach-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-arn "$POLICY_ARN" 2>/dev/null || true
echo "  Policy attached."

# 4. Configure Daily domain
echo "[4/4] Configuring Daily.co domain..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "https://api.daily.co/v1" \
  -H "Authorization: Bearer $DAILY_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"properties\": {
      \"recordings_bucket\": {
        \"bucket_name\": \"${BUCKET_NAME}\",
        \"bucket_region\": \"${BUCKET_REGION}\",
        \"assume_role_arn\": \"${ROLE_ARN}\",
        \"allow_api_access\": true,
        \"allow_streaming_from_bucket\": true
      },
      \"recordings_template\": \"session-recordings/{room_name}/{recording_id}-{epoch_time}.mp4\"
    }
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
  echo "  Daily domain configured successfully!"
  echo ""
  echo "=== Setup Complete ==="
  echo ""
  echo "Daily will now write recordings directly to:"
  echo "  s3://${BUCKET_NAME}/session-recordings/{room_name}/{recording_id}-{epoch_time}.mp4"
  echo ""
  echo "Accessible via CDN at:"
  echo "  https://media.vibrationfit.com/session-recordings/..."
  echo ""
  echo "Role ARN (save this): $ROLE_ARN"
else
  echo "  ERROR: Daily API returned HTTP $HTTP_CODE"
  echo "  $BODY"
  exit 1
fi
