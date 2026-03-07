#!/usr/bin/env bash
# setup-ses-inbound.sh
#
# Sets up SES to receive inbound emails on inbound.vibrationfit.com
# and forward them to the /api/ses/inbound webhook via SNS.
#
# Prerequisites:
#   - AWS CLI v2 configured with SES + SNS permissions
#   - You've already added the DNS records (see step 1 below)
#
# DNS records to add BEFORE running this script:
#   MX:  inbound.vibrationfit.com  ->  10 inbound-smtp.us-east-1.amazonaws.com
#   (Add this in Cloudflare)
#
# After running:
#   1. In Gmail Settings -> Forwarding, add: team@inbound.vibrationfit.com
#   2. Gmail will send a confirmation email; SES receives it, webhook processes it
#   3. Confirm the forwarding in Gmail
#
# Usage:
#   bash scripts/aws/setup-ses-inbound.sh

set -euo pipefail

REGION="us-east-1"
DOMAIN="inbound.vibrationfit.com"
RULE_SET_NAME="vibrationfit-inbound"
RULE_NAME="forward-to-webhook"
TOPIC_NAME="vibrationfit-ses-inbound"
WEBHOOK_URL="${WEBHOOK_URL:-https://vibrationfit.com/api/ses/inbound}"

echo "=== SES Inbound Email Setup ==="
echo "Region:       $REGION"
echo "Domain:       $DOMAIN"
echo "Rule Set:     $RULE_SET_NAME"
echo "SNS Topic:    $TOPIC_NAME"
echo "Webhook URL:  $WEBHOOK_URL"
echo ""

# 1. Verify the inbound domain in SES
echo "[1/6] Verifying domain in SES..."
aws ses verify-domain-identity \
  --domain "$DOMAIN" \
  --region "$REGION" 2>/dev/null || true
echo "  Domain verification initiated for $DOMAIN"
echo "  (Check SES console for any TXT verification record needed)"

# 2. Create SNS topic for inbound emails
echo "[2/6] Creating SNS topic..."
TOPIC_ARN=$(aws sns create-topic \
  --name "$TOPIC_NAME" \
  --region "$REGION" \
  --query 'TopicArn' \
  --output text)
echo "  Topic ARN: $TOPIC_ARN"

# 3. Subscribe the webhook to the SNS topic
echo "[3/6] Subscribing webhook..."
aws sns subscribe \
  --topic-arn "$TOPIC_ARN" \
  --protocol https \
  --notification-endpoint "$WEBHOOK_URL" \
  --region "$REGION" > /dev/null
echo "  Subscribed: $WEBHOOK_URL"
echo "  (SNS will POST SubscriptionConfirmation to your webhook)"

# 4. Allow SES to publish to the SNS topic
echo "[4/6] Setting SNS topic policy for SES..."
ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)
aws sns set-topic-attributes \
  --topic-arn "$TOPIC_ARN" \
  --attribute-name Policy \
  --attribute-value '{
    "Version": "2012-10-17",
    "Statement": [{
      "Sid": "AllowSESPublish",
      "Effect": "Allow",
      "Principal": { "Service": "ses.amazonaws.com" },
      "Action": "sns:Publish",
      "Resource": "'"$TOPIC_ARN"'",
      "Condition": {
        "StringEquals": { "AWS:SourceAccount": "'"$ACCOUNT_ID"'" }
      }
    }]
  }' \
  --region "$REGION"
echo "  Policy set: SES can publish to topic"

# 5. Create SES Receipt Rule Set (if not exists)
echo "[5/6] Creating Receipt Rule Set..."
aws ses create-receipt-rule-set \
  --rule-set-name "$RULE_SET_NAME" \
  --region "$REGION" 2>/dev/null \
  && echo "  Created: $RULE_SET_NAME" \
  || echo "  Already exists: $RULE_SET_NAME"

# Activate the rule set
aws ses set-active-receipt-rule-set \
  --rule-set-name "$RULE_SET_NAME" \
  --region "$REGION" 2>/dev/null || true
echo "  Activated: $RULE_SET_NAME"

# 6. Create Receipt Rule
echo "[6/6] Creating Receipt Rule..."
aws ses create-receipt-rule \
  --rule-set-name "$RULE_SET_NAME" \
  --rule '{
    "Name": "'"$RULE_NAME"'",
    "Enabled": true,
    "TlsPolicy": "Optional",
    "Recipients": ["'"$DOMAIN"'"],
    "Actions": [{
      "SNSAction": {
        "TopicArn": "'"$TOPIC_ARN"'",
        "Encoding": "UTF-8"
      }
    }],
    "ScanEnabled": true
  }' \
  --region "$REGION" 2>/dev/null \
  && echo "  Created rule: $RULE_NAME" \
  || echo "  Rule already exists: $RULE_NAME"

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Remaining manual steps:"
echo ""
echo "  1. Add DNS record in Cloudflare:"
echo "     MX  inbound.vibrationfit.com  ->  10 inbound-smtp.us-east-1.amazonaws.com"
echo ""
echo "  2. Deploy your app (so /api/ses/inbound is live)"
echo ""
echo "  3. In Gmail Settings -> Forwarding and POP/IMAP:"
echo "     Add forwarding address: team@inbound.vibrationfit.com"
echo "     Gmail sends a confirmation code -- the webhook will receive it"
echo "     Confirm forwarding in Gmail"
echo "     Set to: 'Forward a copy of incoming mail to team@inbound.vibrationfit.com'"
echo ""
echo "  4. Run the Supabase migration for Realtime:"
echo "     supabase/migrations/20260307145710_email_messages_realtime.sql"
echo ""
echo "  SNS Inbound Topic ARN: $TOPIC_ARN"
