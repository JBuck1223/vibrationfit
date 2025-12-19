# AWS SES Inbound - Quick Start Checklist

**Goal:** Receive customer emails instantly at `team@vibrationfit.com`

---

## ✅ Quick Checklist

### **1. AWS Console Setup (1 hour)**

- [ ] Create S3 bucket: `vibrationfit-ses-inbound-emails`
- [ ] Set S3 lifecycle rule: Delete after 30 days
- [ ] Update S3 bucket policy (allow SES to write)
- [ ] Create SNS topic: `vibrationfit-inbound-emails`
- [ ] Create SNS subscription: HTTPS to your webhook
- [ ] Create SES receipt rule set: `vibrationfit-inbound`
- [ ] Create receipt rule: `team-inbox` with S3 + SNS actions
- [ ] Set rule set as active

### **2. Code Deployment (30 minutes)**

- [ ] Webhook endpoint created: `/api/webhooks/ses-inbound/route.ts` ✅
- [ ] Migration created: `20251213000002_add_ses_inbound_fields.sql` ✅
- [ ] Email log viewer updated: `/admin/emails/sent` ✅
- [ ] Deploy to production

### **3. Database Migration (5 minutes)**

```bash
# Run the migration
npm run db:migrate

# Or manually in Supabase SQL Editor:
-- Run: supabase/migrations/20251213000002_add_ses_inbound_fields.sql
```

### **4. DNS Configuration (30 minutes)**

⚠️ **WARNING:** This will break existing Google Workspace email!

- [ ] Get SES inbound endpoint: `inbound-smtp.us-east-1.amazonaws.com`
- [ ] Update MX record in DNS:
  ```
  Type: MX
  Name: @
  Priority: 10
  Value: inbound-smtp.us-east-1.amazonaws.com
  ```
- [ ] Wait 5-30 minutes for DNS propagation
- [ ] Verify with: https://mxtoolbox.com/SuperTool.aspx?action=mx%3avibrationfit.com

### **5. Test (10 minutes)**

- [ ] Check SNS subscription status is "Confirmed"
- [ ] Send test email to `team@vibrationfit.com`
- [ ] Check application logs for "📨 SES Inbound webhook received"
- [ ] Go to `/admin/emails/sent` and verify email appears
- [ ] Reply to a support ticket from customer email
- [ ] Verify reply appears in ticket thread

---

## 🚀 One-Line Summary

1. **AWS Console:** Create S3 bucket, SNS topic, SES receipt rule
2. **Deploy:** Push webhook endpoint to production
3. **DNS:** Point MX record to AWS SES
4. **Test:** Send email, verify it arrives instantly

---

## 📖 Full Documentation

- **Detailed Setup:** `AWS_SES_INBOUND_SETUP.md`
- **Comparison:** `EMAIL_RECEIVING_COMPARISON.md`
- **IMAP Alternative:** `IMAP_SETUP_GUIDE.md` (deprecated)

---

## 💡 Pro Tips

1. **Test on subdomain first** - Use `support.vibrationfit.com` before switching main domain
2. **Keep Google temporarily** - Don't cancel Google Workspace until AWS is proven working
3. **Monitor logs** - Watch webhook logs during first 24 hours
4. **Check S3 costs** - Should be pennies, but monitor anyway

---

## 🆘 Need Help?

**Common Issues:**
- SNS not confirming? Check webhook endpoint is accessible
- Email not received? Verify MX record with mxtoolbox.com
- Webhook not called? Check SNS topic delivery logs
- Email logged but not linked to ticket? Check subject has `[SUPP-0001]` format

**Full troubleshooting:** See `AWS_SES_INBOUND_SETUP.md` (Step 11: Troubleshooting)

---

**Ready? Start with Step 1: Create S3 Bucket!** 🚀




