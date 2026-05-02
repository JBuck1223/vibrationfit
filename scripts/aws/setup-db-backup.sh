#!/usr/bin/env bash
#
# Deploy the VibrationFit Supabase database backup Lambda.
#
# This creates:
#   1. ECR repository for the Lambda Docker image
#   2. Builds and pushes the Docker image
#   3. IAM role with S3 + Secrets Manager permissions
#   4. Lambda function (Docker-based, runs pg_dump)
#   5. EventBridge rule to trigger daily at 4 AM UTC
#   6. Stores your Supabase DB URL in Secrets Manager
#
# Prerequisites:
#   - AWS CLI configured with sufficient permissions
#   - Docker running locally
#   - SUPABASE_DB_URL env var set (your Postgres connection string)
#
# Usage:
#   SUPABASE_DB_URL="postgresql://postgres.xxx:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres" \
#     ./scripts/aws/setup-db-backup.sh
#
# To update the Lambda after code changes:
#   ./scripts/aws/setup-db-backup.sh --update
#

set -euo pipefail

REGION="us-east-2"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
FUNCTION_NAME="vibrationfit-db-backup"
ROLE_NAME="vibrationfit-db-backup-role"
ECR_REPO="vibrationfit-db-backup"
S3_BUCKET="vibration-fit-client-storage-backup"
S3_PREFIX="db-backups"
SECRET_ID="vibrationfit/supabase-db-url"
RULE_NAME="vibrationfit-daily-db-backup"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="${SCRIPT_DIR}/db-backup"
UPDATE_ONLY=false

if [[ "${1:-}" == "--update" ]]; then
  UPDATE_ONLY=true
fi

echo "============================================"
echo "  VibrationFit Database Backup - Deploy"
echo "============================================"
echo ""
echo "Region:     ${REGION}"
echo "Account:    ${ACCOUNT_ID}"
echo "Function:   ${FUNCTION_NAME}"
echo "S3 Target:  s3://${S3_BUCKET}/${S3_PREFIX}/"
echo "Schedule:   Daily at 4:00 AM UTC (12:00 AM ET)"
echo ""

# --------------------------------------------------
# Step 1: Store Supabase DB URL in Secrets Manager
# --------------------------------------------------
if [[ "$UPDATE_ONLY" == false ]]; then
  SUPABASE_DB_URL="${SUPABASE_DB_URL:-}"
  if [ -z "$SUPABASE_DB_URL" ]; then
    echo "ERROR: SUPABASE_DB_URL environment variable is required"
    echo ""
    echo "Find it in Supabase Dashboard > Settings > Database > Connection string (URI)"
    echo "Format: postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
    exit 1
  fi

  echo "[1/6] Storing database URL in Secrets Manager..."
  if aws secretsmanager describe-secret --secret-id "$SECRET_ID" --region "$REGION" &>/dev/null; then
    aws secretsmanager put-secret-value \
      --secret-id "$SECRET_ID" \
      --secret-string "$SUPABASE_DB_URL" \
      --region "$REGION" >/dev/null
    echo "  Updated existing secret."
  else
    aws secretsmanager create-secret \
      --name "$SECRET_ID" \
      --description "Supabase PostgreSQL connection string for VibrationFit DB backups" \
      --secret-string "$SUPABASE_DB_URL" \
      --region "$REGION" >/dev/null
    echo "  Created new secret."
  fi
else
  echo "[1/6] Skipping secrets (--update mode)."
fi

# --------------------------------------------------
# Step 2: Create ECR repository
# --------------------------------------------------
echo "[2/6] Setting up ECR repository..."
if ! aws ecr describe-repositories --repository-names "$ECR_REPO" --region "$REGION" &>/dev/null; then
  aws ecr create-repository \
    --repository-name "$ECR_REPO" \
    --region "$REGION" \
    --image-scanning-configuration scanOnPush=true >/dev/null
  echo "  Created ECR repository: ${ECR_REPO}"
else
  echo "  ECR repository already exists."
fi

ECR_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${ECR_REPO}"

# --------------------------------------------------
# Step 3: Build and push Docker image
# --------------------------------------------------
echo "[3/6] Building and pushing Docker image..."
aws ecr get-login-password --region "$REGION" | \
  docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

IMAGE_TAG="latest"
docker build --platform linux/amd64 -t "${ECR_REPO}:${IMAGE_TAG}" "$DOCKER_DIR"
docker tag "${ECR_REPO}:${IMAGE_TAG}" "${ECR_URI}:${IMAGE_TAG}"
docker push "${ECR_URI}:${IMAGE_TAG}"
echo "  Pushed image: ${ECR_URI}:${IMAGE_TAG}"

# --------------------------------------------------
# Step 4: Create IAM role
# --------------------------------------------------
if [[ "$UPDATE_ONLY" == false ]]; then
  echo "[4/6] Creating IAM role..."
  TRUST_POLICY=$(cat <<'TRUSTEOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "lambda.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
TRUSTEOF
)

  ROLE_ARN=$(aws iam create-role \
    --role-name "$ROLE_NAME" \
    --assume-role-policy-document "$TRUST_POLICY" \
    --query 'Role.Arn' \
    --output text 2>/dev/null || \
    aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text)

  echo "  Role ARN: ${ROLE_ARN}"

  PERMISSIONS_POLICY=$(cat <<PERMEOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject"],
      "Resource": "arn:aws:s3:::${S3_BUCKET}/${S3_PREFIX}/*"
    },
    {
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": "arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:${SECRET_ID}-*"
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
PERMEOF
)

  POLICY_NAME="vibrationfit-db-backup-policy"
  POLICY_ARN=$(aws iam create-policy \
    --policy-name "$POLICY_NAME" \
    --policy-document "$PERMISSIONS_POLICY" \
    --query 'Policy.Arn' \
    --output text 2>/dev/null || \
    aws iam list-policies --query "Policies[?PolicyName=='${POLICY_NAME}'].Arn" --output text)

  aws iam attach-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-arn "$POLICY_ARN" 2>/dev/null || true

  echo "  Policy attached."
  echo "  Waiting 10s for IAM propagation..."
  sleep 10
else
  echo "[4/6] Skipping IAM (--update mode)."
  ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text)
fi

# --------------------------------------------------
# Step 5: Create or update Lambda function
# --------------------------------------------------
echo "[5/6] Deploying Lambda function..."
if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" &>/dev/null; then
  aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --image-uri "${ECR_URI}:${IMAGE_TAG}" \
    --region "$REGION" >/dev/null
  echo "  Updated existing function."
else
  aws lambda create-function \
    --function-name "$FUNCTION_NAME" \
    --package-type Image \
    --code "ImageUri=${ECR_URI}:${IMAGE_TAG}" \
    --role "$ROLE_ARN" \
    --timeout 300 \
    --memory-size 512 \
    --ephemeral-storage '{"Size": 2048}' \
    --environment "Variables={S3_BUCKET=${S3_BUCKET},S3_PREFIX=${S3_PREFIX},DB_SECRET_ID=${SECRET_ID}}" \
    --region "$REGION" >/dev/null
  echo "  Created function: ${FUNCTION_NAME}"
fi

echo "  Waiting for function to be active..."
aws lambda wait function-active-v2 --function-name "$FUNCTION_NAME" --region "$REGION"
echo "  Function is active."

# --------------------------------------------------
# Step 6: Create EventBridge schedule (daily 4 AM UTC)
# --------------------------------------------------
if [[ "$UPDATE_ONLY" == false ]]; then
  echo "[6/6] Creating EventBridge daily schedule..."
  RULE_ARN=$(aws events put-rule \
    --name "$RULE_NAME" \
    --schedule-expression "cron(0 4 * * ? *)" \
    --state ENABLED \
    --description "Daily VibrationFit Supabase database backup" \
    --region "$REGION" \
    --query 'RuleArn' \
    --output text)

  LAMBDA_ARN=$(aws lambda get-function \
    --function-name "$FUNCTION_NAME" \
    --region "$REGION" \
    --query 'Configuration.FunctionArn' \
    --output text)

  aws lambda add-permission \
    --function-name "$FUNCTION_NAME" \
    --statement-id "eventbridge-daily-backup" \
    --action "lambda:InvokeFunction" \
    --principal "events.amazonaws.com" \
    --source-arn "$RULE_ARN" \
    --region "$REGION" 2>/dev/null || true

  aws events put-targets \
    --rule "$RULE_NAME" \
    --targets "Id=db-backup-target,Arn=${LAMBDA_ARN}" \
    --region "$REGION" >/dev/null

  echo "  Schedule created: Daily at 4:00 AM UTC (12:00 AM ET)"
else
  echo "[6/6] Skipping EventBridge (--update mode)."
fi

echo ""
echo "============================================"
echo "  Deployment Complete"
echo "============================================"
echo ""
echo "Lambda:     ${FUNCTION_NAME}"
echo "Schedule:   Daily at 4:00 AM UTC (12:00 AM ET)"
echo "Backups:    s3://${S3_BUCKET}/${S3_PREFIX}/"
echo "Secret:     ${SECRET_ID}"
echo "Logs:       https://${REGION}.console.aws.amazon.com/cloudwatch/home?region=${REGION}#logsV2:log-groups/log-group/\$252Faws\$252Flambda\$252F${FUNCTION_NAME}"
echo ""
echo "Test it now:"
echo "  aws lambda invoke --function-name ${FUNCTION_NAME} --region ${REGION} /dev/stdout"
echo ""
echo "To update after code changes:"
echo "  ./scripts/aws/setup-db-backup.sh --update"
echo ""
