#!/usr/bin/env bash
# setup-ses-configuration-set.sh
#
# Creates an SES Configuration Set with SNS event publishing so that
# delivery, bounce, complaint, open, and click events flow back to
# the /api/ses/webhook endpoint via SNS.
#
# Prerequisites:
#   - AWS CLI v2 configured with credentials that have SES + SNS permissions
#   - SES identity (vibrationfit.com) already verified in us-east-1
#
# Usage:
#   bash scripts/aws/setup-ses-configuration-set.sh
#
# After running, add these to your .env.local / Vercel env vars:
#   AWS_SES_CONFIGURATION_SET=vibrationfit-tracking
#   AWS_SES_SNS_TOPIC_ARN=<printed at the end>

set -euo pipefail

REGION="us-east-1"
CONFIG_SET_NAME="vibrationfit-tracking"
TOPIC_NAME="vibrationfit-ses-events"
WEBHOOK_URL="${WEBHOOK_URL:-https://vibrationfit.com/api/ses/webhook}"

echo "=== SES Configuration Set Setup ==="
echo "Region:           $REGION"
echo "Config Set:       $CONFIG_SET_NAME"
echo "SNS Topic:        $TOPIC_NAME"
echo "Webhook URL:      $WEBHOOK_URL"
echo ""

# 1. Create the Configuration Set (idempotent -- ignores AlreadyExists)
echo "[1/5] Creating SES Configuration Set..."
aws sesv2 create-configuration-set \
  --configuration-set-name "$CONFIG_SET_NAME" \
  --sending-options SendingEnabled=true \
  --region "$REGION" 2>/dev/null \
  && echo "  Created: $CONFIG_SET_NAME" \
  || echo "  Already exists: $CONFIG_SET_NAME"

# 2. Create the SNS Topic
echo "[2/5] Creating SNS Topic..."
TOPIC_ARN=$(aws sns create-topic \
  --name "$TOPIC_NAME" \
  --region "$REGION" \
  --query 'TopicArn' \
  --output text)
echo "  Topic ARN: $TOPIC_ARN"

# 3. Subscribe the webhook URL to the topic
echo "[3/5] Subscribing webhook to SNS topic..."
SUBSCRIPTION_ARN=$(aws sns subscribe \
  --topic-arn "$TOPIC_ARN" \
  --protocol https \
  --notification-endpoint "$WEBHOOK_URL" \
  --region "$REGION" \
  --query 'SubscriptionArn' \
  --output text)
echo "  Subscription: $SUBSCRIPTION_ARN"
echo "  (SNS will POST a SubscriptionConfirmation to your webhook -- it auto-confirms)"

# 4. Add SNS event destination to the Configuration Set
echo "[4/5] Adding event destination to Configuration Set..."
aws sesv2 create-configuration-set-event-destination \
  --configuration-set-name "$CONFIG_SET_NAME" \
  --event-destination-name "sns-all-events" \
  --event-destination '{
    "Enabled": true,
    "MatchingEventTypes": ["SEND", "DELIVERY", "BOUNCE", "COMPLAINT", "OPEN", "CLICK", "REJECT"],
    "SnsDestination": {
      "TopicArn": "'"$TOPIC_ARN"'"
    }
  }' \
  --region "$REGION" 2>/dev/null \
  && echo "  Event destination created" \
  || echo "  Event destination already exists (updating...)" \
  && aws sesv2 update-configuration-set-event-destination \
    --configuration-set-name "$CONFIG_SET_NAME" \
    --event-destination-name "sns-all-events" \
    --event-destination '{
      "Enabled": true,
      "MatchingEventTypes": ["SEND", "DELIVERY", "BOUNCE", "COMPLAINT", "OPEN", "CLICK", "REJECT"],
      "SnsDestination": {
        "TopicArn": "'"$TOPIC_ARN"'"
      }
    }' \
    --region "$REGION" 2>/dev/null || true

# 5. Enable open and click tracking on the Configuration Set
echo "[5/5] Enabling open & click tracking..."
aws sesv2 put-configuration-set-tracking-options \
  --configuration-set-name "$CONFIG_SET_NAME" \
  --region "$REGION" 2>/dev/null || true

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Add these environment variables:"
echo ""
echo "  AWS_SES_CONFIGURATION_SET=$CONFIG_SET_NAME"
echo "  AWS_SES_SNS_TOPIC_ARN=$TOPIC_ARN"
echo ""
echo "Once your app is deployed with the webhook at $WEBHOOK_URL,"
echo "SNS will auto-confirm the subscription and events will start flowing."
