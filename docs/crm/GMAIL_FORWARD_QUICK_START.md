# Gmail → SES Forwarding - Quick Start Checklist

**Goal:** Keep Google Workspace + Get instant CRM email notifications

**Time:** 1 hour  
**Cost:** $0.01/month extra  
**Result:** 3-second email updates in CRM ⚡

---

## ✅ Quick Checklist

### **Part 1: AWS Setup (30 minutes)**

- [ ] **SES:** Verify email address `crm+inbound@vibrationfit.com`
  - AWS SES Console → Create identity → Email address
  - Check Gmail for verification email
  - Click verification link

- [ ] **S3:** Create bucket `vibrationfit-ses-inbound-emails`
  - AWS S3 Console → Create bucket
  - Add bucket policy (allow SES to write)
  - Set lifecycle rule: Delete after 30 days

- [ ] **SNS:** Create topic `vibrationfit-inbound-emails`
  - AWS SNS Console → Create topic (Standard)
  - Copy ARN

- [ ] **SNS:** Create subscription to webhook
  - Protocol: HTTPS
  - Endpoint: `https://vibrationfit.com/api/webhooks/ses-inbound`
  - Wait for auto-confirmation (status: Confirmed)

- [ ] **SES:** Create receipt rule set `vibrationfit-gmail-forward`
  - AWS SES Console → Email receiving → Create rule set
  - Set as active

- [ ] **SES:** Create receipt rule `crm-inbound-forwarding`
  - Recipient: `crm+inbound@vibrationfit.com`
  - Action 1: S3 → `vibrationfit-ses-inbound-emails` (prefix: `forwarded/`)
  - Action 2: SNS → `vibrationfit-inbound-emails`

### **Part 2: Gmail Setup (15 minutes)**

- [ ] **Gmail:** Add forwarding address
  - Gmail Settings → Forwarding and POP/IMAP
  - Add: `crm+inbound@vibrationfit.com`
  - Verify (email arrives in same inbox)

- [ ] **Gmail:** Create auto-forward filter
  - Gmail Settings → Filters
  - Create filter: To = `team@vibrationfit.com`
  - Forward to: `crm+inbound@vibrationfit.com`
  - Create filter

### **Part 3: Deploy Code (15 minutes)**

- [ ] **Code:** Already created! ✅
  - Webhook: `/api/webhooks/ses-inbound/route.ts`
  - Migration: `20251213000002_add_ses_inbound_fields.sql`
  - Email log: `/admin/emails/sent/page.tsx`

- [ ] **Deploy:**
  ```bash
  git add .
  git commit -m "Add Gmail forwarding to SES"
  git push
  ```

- [ ] **Database:** Run migration
  - Supabase SQL Editor
  - Run: `20251213000002_add_ses_inbound_fields.sql`

### **Part 4: Test (10 minutes)**

- [ ] Send test email to `team@vibrationfit.com`
- [ ] Verify arrives in Gmail ✅
- [ ] Check app logs for webhook call ✅
- [ ] Check `/admin/emails/sent` for email ✅
- [ ] Reply to support ticket from customer email
- [ ] Verify reply links to ticket ✅

---

## 🎯 Visual Flow

```
Customer Email
     ↓
Gmail Inbox (YOU SEE IT HERE)
     ↓
Gmail Auto-Forwards
     ↓
AWS SES Receives
     ↓
SNS Webhook (3 seconds)
     ↓
CRM Updates (YOU SEE IT HERE TOO)
```

**You get BOTH:** Gmail interface + Instant CRM updates! 🎉

---

## 💡 Key Points

1. **No DNS changes** - Keep Google MX records
2. **No risk** - Email still works normally in Gmail
3. **Reversible** - Delete Gmail filter anytime
4. **Instant** - 3-second CRM updates
5. **Cheap** - ~$0.01/month

---

## 🆘 Troubleshooting

**Email in Gmail but not CRM?**
- Check Gmail filter is active
- Check SNS subscription is "Confirmed"
- Check app logs for webhook calls

**SNS not confirming?**
- Deploy webhook first
- Check webhook is accessible
- Manually click SubscribeURL in SNS console

**Wrong sender in CRM?**
- Webhook extracts original sender from headers
- Check email_messages table for `from_email`

---

## 📖 Full Guide

See: `GMAIL_FORWARDING_TO_SES_SETUP.md` for detailed step-by-step instructions.

---

**Ready? Start with AWS SES Console → Verify email address!** 🚀

