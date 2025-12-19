# AWS SES Inbound Email Setup - Instant Customer Replies

**Last Updated:** December 13, 2025  
**Status:** Active  
**Time to Complete:** 2 hours

## 🎯 Overview

AWS SES Inbound allows you to receive emails at `team@vibrationfit.com` with **instant** webhook notifications to your CRM - no polling, no delay!

**Benefits:**
- ⚡ **Instant** - Webhooks fire the moment email arrives
- 💰 **Cheap** - $0.10 per 1,000 emails received
- 🔄 **No polling** - No cron jobs needed
- 🏗️ **Scalable** - AWS infrastructure

---

## 📋 Prerequisites

- ✅ AWS Account with SES sending already configured
- ✅ Domain: `vibrationfit.com` (must control DNS)
- ✅ Webhook endpoint deployed: `/api/webhooks/ses-inbound`

---

## 🔧 Setup Steps

### **Step 1: Verify Domain for Receiving (AWS SES Console)**

1. Go to: **AWS SES Console** → **Verified identities**
2. Click your domain: `vibrationfit.com`
3. Verify you see **"DKIM", "Mail FROM"** as verified
4. If not, follow domain verification steps

---

### **Step 2: Create S3 Bucket for Email Storage**

SES needs a place to store incoming emails temporarily.

1. Go to: **AWS S3 Console**
2. Click **"Create bucket"**
3. **Bucket name:** `vibrationfit-ses-inbound-emails`
4. **Region:** Same as your SES region (probably `us-east-1`)
5. **Block all public access:** ✅ Enable (keep private)
6. Click **"Create bucket"**

**Set lifecycle policy** (auto-delete old emails):
1. Click on bucket → **Management** → **Lifecycle rules**
2. **Create rule:**
   - Name: `delete-old-emails`
   - Rule scope: Apply to all objects
   - Expiration: **Delete after 30 days**
3. Save

---

### **Step 3: Create IAM Policy for SES → S3**

SES needs permission to write emails to your S3 bucket.

1. Go to: **IAM Console** → **Policies** → **Create policy**
2. **JSON tab**, paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowSESPuts",
      "Effect": "Allow",
      "Principal": {
        "Service": "ses.amazonaws.com"
      },
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::vibrationfit-ses-inbound-emails/*",
      "Condition": {
        "StringEquals": {
          "aws:Referer": "YOUR_AWS_ACCOUNT_ID"
        }
      }
    }
  ]
}
```

3. Replace `YOUR_AWS_ACCOUNT_ID` with your AWS account ID
4. **Name:** `SESInboundS3Access`
5. Click **"Create policy"**

---

### **Step 4: Update S3 Bucket Policy**

1. Go to **S3** → `vibrationfit-ses-inbound-emails` → **Permissions**
2. **Bucket policy**, paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowSESPuts",
      "Effect": "Allow",
      "Principal": {
        "Service": "ses.amazonaws.com"
      },
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::vibrationfit-ses-inbound-emails/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceAccount": "YOUR_AWS_ACCOUNT_ID"
        }
      }
    }
  ]
}
```

3. Replace `YOUR_AWS_ACCOUNT_ID`
4. **Save changes**

---

### **Step 5: Create SNS Topic for Notifications**

1. Go to: **AWS SNS Console** → **Topics** → **Create topic**
2. **Type:** Standard
3. **Name:** `vibrationfit-inbound-emails`
4. Click **"Create topic"**
5. 📋 **Copy the ARN** (looks like: `arn:aws:sns:us-east-1:123456:vibrationfit-inbound-emails`)

---

### **Step 6: Create SNS Subscription (Webhook)**

1. In the topic you just created, click **"Create subscription"**
2. **Protocol:** HTTPS
3. **Endpoint:** `https://vibrationfit.com/api/webhooks/ses-inbound`
4. Click **"Create subscription"**
5. **Status** will show "Pending confirmation"

**Confirm subscription:**
- When you deploy your webhook, AWS will send a confirmation request
- Your webhook auto-confirms it
- Status changes to "Confirmed" ✅

---

### **Step 7: Create SES Receipt Rule Set**

1. Go to: **AWS SES Console** → **Email receiving** → **Receipt rule sets**
2. Click **"Create rule set"**
3. **Name:** `vibrationfit-inbound`
4. Click **"Create rule set"**
5. **Set as active** (toggle the button)

---

### **Step 8: Create Receipt Rule**

1. In your rule set, click **"Create rule"**
2. **Rule name:** `team-inbox`

**Recipients:**
- Add: `team@vibrationfit.com`
- (Add more if needed: `support@vibrationfit.com`, etc.)

**Actions** (in order):
1. **First Action:** S3
   - S3 bucket: `vibrationfit-ses-inbound-emails`
   - Object key prefix: `emails/` (optional)

2. **Second Action:** SNS
   - SNS topic: Select your `vibrationfit-inbound-emails` topic
   - Encoding: UTF-8

3. Click **"Create rule"**

---

### **Step 9: Update DNS Records**

**Critical:** Update your domain's MX records to point to AWS SES.

#### **Find Your SES Inbound Endpoint:**
1. Go to: **SES Console** → **Email receiving**
2. Look for: **"Inbound SMTP endpoint"**
3. Will look like: `inbound-smtp.us-east-1.amazonaws.com`

#### **Update DNS Records:**

Go to your DNS provider (Cloudflare, Route53, GoDaddy, etc.) and add/update:

```
Type: MX
Name: @  (or vibrationfit.com)
Priority: 10
Value: inbound-smtp.us-east-1.amazonaws.com
TTL: 3600
```

**Important:** If you have existing MX records (pointing to Google), you'll need to:
- Remove Google MX records
- Add AWS SES MX record
- ⚠️ This will break existing Google email delivery

---

### **Step 10: Deploy Webhook**

Deploy your updated app with the webhook endpoint:

```bash
git add .
git commit -m "Add AWS SES inbound webhook"
git push
```

---

### **Step 11: Test the Flow**

1. **Wait 5 minutes** for DNS propagation
2. **Send a test email** to `team@vibrationfit.com` from your personal email
3. **Check your app logs** for webhook notifications
4. **Go to** `/admin/emails/sent` (should show the inbound email)

---

## 🧪 Testing Checklist

- [ ] SNS subscription confirmed
- [ ] DNS MX record updated and propagated
- [ ] Send test email to `team@vibrationfit.com`
- [ ] Check webhook logs (should see "📨 SES Inbound webhook received")
- [ ] Verify email appears in `/admin/emails/sent`
- [ ] Reply to a support ticket from customer email
- [ ] Verify reply appears in ticket thread

---

## 🔐 Environment Variables (Not Needed!)

**Good news:** You don't need any new environment variables! 

The webhook is public (AWS SNS calls it), but it's safe because:
- ✅ Only AWS SNS can reach it
- ✅ We can verify SNS signatures (optional enhancement)
- ✅ No sensitive data exposed

---

## 📊 Cost Breakdown

**AWS SES Inbound:**
- Receiving: $0.10 per 1,000 emails
- S3 storage: ~$0.023 per GB/month
- SNS notifications: $0.50 per 1 million requests

**Example (100 support emails/month):**
- 100 received emails: $0.01
- S3 storage (~50 MB): $0.001
- SNS notifications: $0.00005
- **Total: ~$0.01/month** 🎉

---

## 🚨 Important: Email Migration

### **Before You Switch DNS:**

**If you're currently using Google Workspace:**
1. ⚠️ Moving MX records will stop Google from receiving emails
2. ✅ All emails will go to AWS SES instead
3. ✅ Your CRM will handle everything
4. ❌ Gmail web interface won't receive new emails

**Options:**
- **Full switch:** Remove all Google MX records, use only AWS
- **Gradual migration:** Keep Google for personal@, use AWS for team@
- **Forwarding:** Forward from Google to AWS (but defeats the purpose)

---

## 🎯 Recommended Path

### **Phase 1: Test First (Don't Touch Google)**
1. Set up AWS SES Inbound
2. Use a TEST subdomain: `support.vibrationfit.com`
3. Test thoroughly
4. Verify it works perfectly

### **Phase 2: Switch Production**
1. Update MX records to AWS
2. Monitor for 24 hours
3. Cancel Google Workspace if not needed

---

## 🔍 Troubleshooting

### **"Email not received"**

Check:
- [ ] MX record is set correctly
- [ ] DNS propagated (use: https://mxtoolbox.com/)
- [ ] SES receipt rule is active
- [ ] S3 bucket has correct permissions
- [ ] SNS subscription is confirmed

### **"Webhook not called"**

Check:
- [ ] SNS subscription status is "Confirmed"
- [ ] Webhook URL is correct (`https://vibrationfit.com/api/webhooks/ses-inbound`)
- [ ] Your app is deployed and accessible
- [ ] Check SNS topic delivery logs

### **"Email logged but not linked to ticket"**

Check:
- [ ] Subject line contains ticket number: `[SUPP-0001]`
- [ ] Ticket exists in database
- [ ] `support_ticket_replies` permissions are correct

---

## 📚 Resources

- **AWS SES Receiving:** https://docs.aws.amazon.com/ses/latest/dg/receiving-email.html
- **SNS HTTPS Subscriptions:** https://docs.aws.amazon.com/sns/latest/dg/sns-http-https-endpoint-as-subscriber.html
- **MX Records:** https://mxtoolbox.com/SuperTool.aspx

---

## ✅ Next Steps

1. **Now:** Create S3 bucket
2. **Now:** Create SNS topic
3. **Now:** Create SES receipt rule
4. **Later:** Update DNS (test subdomain first!)
5. **Test:** Send test emails
6. **Launch:** Switch production MX records

---

**Ready to start?** Begin with Step 2 (create S3 bucket) in AWS Console! 🚀




