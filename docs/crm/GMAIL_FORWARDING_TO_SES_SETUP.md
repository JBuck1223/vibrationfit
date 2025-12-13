# Gmail Forwarding to AWS SES - Instant CRM Updates

**Last Updated:** December 13, 2025  
**Status:** Active  
**Time to Complete:** 1 hour  
**Best For:** Teams already using Google Workspace

---

## 🎯 What This Does

**Keep Google Workspace for everything, but also get instant CRM notifications:**

```
Customer Email Flow:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Customer sends to: team@vibrationfit.com
   ↓
2. Gmail receives (normal Google Workspace)
   ↓
3. Gmail auto-forwards to: crm+inbound@vibrationfit.com
   ↓
4. AWS SES receives forwarded email
   ↓
5. SES triggers SNS webhook (INSTANT)
   ↓
6. Your CRM logs and displays email
   ↓
7. You can ALSO see/reply in Gmail

Total time: ~3-5 seconds ⚡
```

---

## ✅ Benefits

- ⚡ **Instant** - 3-second CRM updates (not 5-minute polling)
- 💼 **Keep Google** - Still use Gmail, Drive, Calendar, etc.
- 📧 **Two places** - See emails in Gmail AND CRM
- 💰 **Cheap** - ~$0.01/month extra
- 🔐 **Safe** - No DNS changes, no risk to email
- 🔄 **Reversible** - Delete Gmail filter anytime

---

## 📋 Prerequisites

- ✅ Google Workspace account (already have)
- ✅ AWS Account with SES configured for sending
- ✅ Domain: `vibrationfit.com` verified in SES
- ✅ Webhook endpoint deployed

---

## 🔧 Setup Steps

### **Step 1: Create SES Forwarding Email Address**

We'll create a special email address just for forwarding: `crm+inbound@vibrationfit.com`

1. Go to: **AWS SES Console** → **Verified identities**
2. Click **"Create identity"**
3. **Identity type:** Email address
4. **Email address:** `crm+inbound@vibrationfit.com`
5. Click **"Create identity"**

**Verify the email:**
1. AWS will send verification email to `crm+inbound@vibrationfit.com`
2. This will arrive in your Gmail: `team@vibrationfit.com`
3. Open the email and click the verification link
4. Status changes to ✅ "Verified"

---

### **Step 2: Create S3 Bucket for Email Storage**

Same as full SES setup:

1. Go to: **AWS S3 Console** → **Create bucket**
2. **Bucket name:** `vibrationfit-ses-inbound-emails`
3. **Region:** Same as SES (probably `us-east-1`)
4. **Block public access:** ✅ Enable
5. Click **"Create bucket"**

**Set lifecycle rule:**
1. Bucket → **Management** → **Lifecycle rules** → **Create rule**
2. Name: `delete-old-emails`
3. Apply to all objects
4. Expiration: **Delete after 30 days**
5. Save

---

### **Step 3: Update S3 Bucket Policy**

1. Go to bucket → **Permissions** → **Bucket policy**
2. Paste:

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

3. Replace `YOUR_AWS_ACCOUNT_ID` with your AWS account ID
4. Save

---

### **Step 4: Create SNS Topic**

1. Go to: **AWS SNS Console** → **Topics** → **Create topic**
2. **Type:** Standard
3. **Name:** `vibrationfit-inbound-emails`
4. Click **"Create topic"**
5. 📋 Copy the ARN

---

### **Step 5: Create SNS Subscription (Your Webhook)**

1. In the topic, click **"Create subscription"**
2. **Protocol:** HTTPS
3. **Endpoint:** `https://vibrationfit.com/api/webhooks/ses-inbound`
4. Click **"Create subscription"**
5. **Status** will be "Pending confirmation"

**Auto-confirmation:**
- Your webhook (already deployed) will auto-confirm
- Wait 1-2 minutes
- Refresh page - status changes to ✅ "Confirmed"

---

### **Step 6: Create SES Receipt Rule Set**

1. Go to: **AWS SES Console** → **Email receiving** → **Receipt rule sets**
2. Click **"Create rule set"**
3. **Name:** `vibrationfit-gmail-forward`
4. Click **"Create rule set"**
5. **Set as active** ✅

---

### **Step 7: Create Receipt Rule for Forwarded Email**

1. In your rule set, click **"Create rule"**
2. **Rule name:** `crm-inbound-forwarding`

**Recipients:**
- Add: `crm+inbound@vibrationfit.com`

**Actions (in order):**

**Action 1: S3**
- S3 bucket: `vibrationfit-ses-inbound-emails`
- Object key prefix: `forwarded/`

**Action 2: SNS**
- SNS topic: `vibrationfit-inbound-emails`
- Encoding: UTF-8

3. Click **"Create rule"**

---

### **Step 8: Set Up Gmail Forwarding**

Now the magic part - configure Gmail to auto-forward support emails:

#### **8.1: Add Forwarding Address in Gmail**

1. Go to: https://mail.google.com (as `team@vibrationfit.com`)
2. Click ⚙️ **Settings** → **See all settings**
3. Go to **"Forwarding and POP/IMAP"** tab
4. Click **"Add a forwarding address"**
5. Enter: `crm+inbound@vibrationfit.com`
6. Click **"Next"** → **"Proceed"**

**Verify forwarding:**
- Gmail sends confirmation to `crm+inbound@vibrationfit.com`
- This arrives back at `team@vibrationfit.com` (same inbox!)
- Open the confirmation email
- Click the verification link
- Return to Gmail settings

#### **8.2: Create Gmail Filter for Auto-Forwarding**

We'll create a filter that forwards ALL emails to the CRM:

1. In Gmail settings → **"Filters and Blocked Addresses"** tab
2. Click **"Create a new filter"**
3. **To:** `team@vibrationfit.com`
4. Click **"Create filter"**
5. ✅ Check **"Forward it to"**
6. Select: `crm+inbound@vibrationfit.com`
7. ✅ Check **"Also apply filter to matching conversations"** (optional - applies to existing)
8. Click **"Create filter"**

**Result:** Every email to `team@vibrationfit.com` is now auto-forwarded to SES!

---

### **Step 9: Deploy Code (Already Done!)**

The webhook endpoint we built works for both regular SES inbound AND forwarded emails:
- ✅ `/api/webhooks/ses-inbound/route.ts` (already created)
- ✅ Database migration (already created)
- ✅ Email log viewer (already updated)

Just deploy:

```bash
cd /Users/jordanbuckingham/Desktop/vibrationfit
git add .
git commit -m "Add Gmail forwarding to SES inbound"
git push
```

---

### **Step 10: Test the Flow**

#### **Test 1: Direct SES Email (if you want to test)**

```bash
# Send email directly to crm+inbound@vibrationfit.com
echo "Test direct SES" | mail -s "Direct Test" crm+inbound@vibrationfit.com
```

#### **Test 2: Gmail Forwarding (the real flow)**

1. Send email to `team@vibrationfit.com` from personal email
2. Check Gmail - email should arrive normally ✅
3. Check application logs - webhook should fire ✅
4. Check `/admin/emails/sent` - email should appear ✅

**Expected timeline:**
- 0s: Email sent
- 1s: Arrives in Gmail
- 2s: Gmail forwards to SES
- 3s: SES triggers webhook
- 4s: Appears in CRM ⚡

---

## 🧪 Testing Checklist

- [ ] SNS subscription confirmed
- [ ] Gmail forwarding address verified
- [ ] Gmail filter created
- [ ] Send test email to `team@vibrationfit.com`
- [ ] Email arrives in Gmail
- [ ] Email appears at `/admin/emails/sent` within 5 seconds
- [ ] Reply to support ticket
- [ ] Reply appears in ticket thread

---

## 💰 Cost Breakdown

**Existing costs (you already pay):**
- Google Workspace: $6-18/month

**New costs:**
- Receiving 100 forwarded emails: $0.01/month
- S3 storage: $0.001/month
- SNS notifications: $0.00005/month
- **Total additional: ~$0.01/month** 💰

**You're basically getting instant CRM updates for free!**

---

## 🎯 What You Get

### **In Gmail:**
- ✅ See all customer emails
- ✅ Reply directly from Gmail
- ✅ Use Gmail search, labels, filters
- ✅ Access from mobile Gmail app
- ✅ Team can collaborate on emails

### **In CRM:**
- ⚡ Instant notifications (3-5 seconds)
- 📊 Full email log at `/admin/emails/sent`
- 🎫 Auto-link replies to support tickets
- 📈 Track email conversations
- 🔍 Search and filter emails
- 👥 See email history per user

---

## 🔄 Email Headers

**Note:** Forwarded emails will have these headers:

```
From: original-sender@example.com
To: crm+inbound@vibrationfit.com
X-Forwarded-For: team@vibrationfit.com
X-Forwarded-To: crm+inbound@vibrationfit.com
```

Our webhook is smart enough to extract the original sender!

---

## 🐛 Troubleshooting

### **"Email arrives in Gmail but not in CRM"**

Check:
- [ ] Gmail forwarding is enabled
- [ ] Gmail filter is created correctly
- [ ] SNS subscription is "Confirmed"
- [ ] Webhook endpoint is accessible
- [ ] Check application logs for webhook calls

### **"SNS subscription not confirming"**

- Webhook might not be deployed yet
- Check webhook logs in your app
- Manually visit the SubscribeURL from SNS console

### **"Forwarded email has wrong sender"**

- Webhook should extract original sender from headers
- Check `X-Original-From` or parse from body
- May need to update webhook logic

---

## ⚠️ Important Notes

### **Gmail Forwarding Limits:**

- Google allows forwarding up to **500 emails/day** automatically
- For higher volume, use "Send mail as" instead
- Monitor Gmail's forwarding status

### **SES Receiving Limits:**

- **Receiving quota:** 1,000 emails/day (free tier)
- After free tier: $0.10 per 1,000
- Request increase if needed

### **Reply Behavior:**

When you reply from Gmail:
- ✅ Customer receives reply (normal Gmail)
- ❌ Reply does NOT go through SES
- ❌ Reply is NOT logged in CRM automatically

**Solution:** For CRM-tracked replies:
- Reply from CRM admin panel
- OR: Set up "Send mail as" with SES (advanced)

---

## 🔐 Security Considerations

1. **SES email address is public** - Anyone can send to `crm+inbound@vibrationfit.com`
2. **Solution:** SES receipt rules only accept forwarded emails
3. **Webhook is public** - But only AWS SNS calls it
4. **Future:** Add SNS signature verification

---

## 🎉 Benefits Over IMAP Polling

| Feature | IMAP Polling | Gmail → SES Forward |
|---------|--------------|---------------------|
| **Speed** | 5 minutes | 3 seconds |
| **Gmail access** | ✅ Yes | ✅ Yes |
| **Cron jobs** | ❌ Required | ✅ Not needed |
| **Real-time** | ❌ No | ✅ Yes |
| **Cost** | $0 extra | $0.01/month |
| **Reliability** | Polling (can fail) | Webhook (guaranteed) |

---

## 📚 Related Documentation

- **Webhook Code:** `/src/app/api/webhooks/ses-inbound/route.ts`
- **Database Migration:** `20251213000002_add_ses_inbound_fields.sql`
- **Email Log Viewer:** `/src/app/admin/emails/sent/page.tsx`
- **Full SES Setup:** `AWS_SES_INBOUND_SETUP.md` (if you ever drop Google)
- **Comparison Guide:** `EMAIL_RECEIVING_COMPARISON.md`

---

## ✅ Success Checklist

- [ ] SES email address verified: `crm+inbound@vibrationfit.com`
- [ ] S3 bucket created and configured
- [ ] SNS topic and subscription created
- [ ] SNS subscription confirmed
- [ ] SES receipt rule set created and active
- [ ] Gmail forwarding address verified
- [ ] Gmail filter created
- [ ] Code deployed to production
- [ ] Test email flows through correctly
- [ ] Email appears in both Gmail AND CRM
- [ ] Ticket replies link correctly

---

**Ready to set it up?** Start with Step 1: Verify `crm+inbound@vibrationfit.com` in SES Console! 🚀

**Estimated time:** 1 hour  
**Result:** Instant CRM updates while keeping Gmail! ⚡

