# AWS SES Email Setup for VibrationFit

**Last Updated:** November 14, 2025

## 📧 Overview

VibrationFit uses **AWS Simple Email Service (SES)** to send transactional emails, including household invitations, password resets, and notifications.

---

## 🔑 Required Environment Variables

Add these to your `.env.local`:

```bash
# AWS Credentials (you likely already have these for S3)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key

# AWS SES Configuration
AWS_SES_FROM_EMAIL="Vibration Fit" <team@vibrationfit.com>
# Format: "Display Name" <email@domain.com>
# Note: team@vibrationfit.com must be verified in AWS SES
```

---

## 🚀 AWS SES Setup Steps

### **Step 1: Verify Your Domain or Email**

#### **Option A: Domain Verification (Production - Recommended)**

1. Go to [AWS SES Console](https://console.aws.amazon.com/ses/) → **Verified identities**
2. Click **Create identity**
3. Select **Domain**
4. Enter your domain: `vibrationfit.com`
5. AWS will provide DNS records (TXT, CNAME, MX records)
6. Add these records to your DNS provider (e.g., Vercel, Cloudflare, Route53)
7. Wait for verification (usually 1-72 hours)

**Benefits:**
- Can send from any address at your domain (`team@vibrationfit.com`, `support@vibrationfit.com`, etc.)
- No sandbox restrictions
- Professional appearance

#### **Option B: Email Verification (Testing/Sandbox)**

1. Go to [AWS SES Console](https://console.aws.amazon.com/ses/) → **Verified identities**
2. Click **Create identity**
3. Select **Email address**
4. Enter your email (e.g., `team@vibrationfit.com`)
5. Check your email and click the verification link

**Limitations (Sandbox Mode):**
- Can only send TO verified email addresses
- Sending limits: 200 emails/day, 1 email/second
- Need to request production access for real use

---

### **Step 2: Request Production Access (If Not Already Done)**

If you're in **SES Sandbox mode**, you need to request production access:

1. Go to [AWS SES Console](https://console.aws.amazon.com/ses/) → **Account dashboard**
2. Click **Request production access** (if button is visible)
3. Fill out the form:
   - **Mail type:** Transactional
   - **Website URL:** `https://vibrationfit.com`
   - **Use case description:**
     ```
     VibrationFit is a personal development platform that sends transactional emails including:
     - Household invitation emails (when users invite family members)
     - Password reset emails
     - Purchase confirmations
     - Subscription notifications
     
     We send approximately 100-500 emails per day.
     We have opt-out mechanisms and comply with CAN-SPAM regulations.
     ```
   - **Bounce/complaint handling:** We process bounce and complaint notifications
4. Submit and wait for approval (usually 24 hours)

**Once approved:**
- Can send to ANY email address
- Higher sending limits (50,000 emails/day by default)
- No restrictions

---

### **Step 3: Configure IAM Permissions**

Your AWS IAM user (the one with `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`) needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail",
        "ses:GetSendQuota",
        "ses:GetSendStatistics"
      ],
      "Resource": "*"
    }
  ]
}
```

**To add these permissions:**
1. Go to [IAM Console](https://console.aws.amazon.com/iam/) → **Users**
2. Select your user
3. Click **Add permissions** → **Attach policies directly**
4. Search for **AmazonSESFullAccess** (or create a custom policy with the JSON above)
5. Attach the policy

---

## 🧪 Testing Email Sending

### **Option 1: Test in Sandbox Mode**

If you're in sandbox mode and haven't requested production access yet:

1. Verify both sender and recipient emails:
   - Verify `noreply@vibrationfit.com` (or whatever you use for `AWS_SES_FROM_EMAIL`)
   - Verify your personal email (for testing)

2. Send a test household invitation to your verified email

3. Check your inbox!

### **Option 2: Use SES Email Simulator (Sandbox or Production)**

AWS provides email simulator addresses for testing:

```bash
# These work in sandbox mode without verification
success@simulator.amazonses.com  # Successful delivery
bounce@simulator.amazonses.com   # Hard bounce
complaint@simulator.amazonses.com # Complaint
```

**To test:**
1. Go to `/household/settings` (as household admin)
2. Invite `success@simulator.amazonses.com`
3. Check AWS SES Console → **Email sending** → **Sending statistics**
4. You should see 1 successful send

### **Option 3: Test with AWS CLI**

```bash
aws ses send-email \
  --from noreply@vibrationfit.com \
  --destination "ToAddresses=your-email@example.com" \
  --message "Subject={Data=Test Email},Body={Text={Data=This is a test}}" \
  --region us-east-1
```

---

## 📊 Monitoring & Logs

### **AWS SES Console**
- [Email sending statistics](https://console.aws.amazon.com/ses/home#/account)
- View sent emails, bounces, complaints
- Monitor your sending quota

### **Your Application Logs**
- Check Vercel logs or local terminal for:
  - `✅ Email sent successfully: { messageId: ..., to: [...], subject: ... }`
  - `❌ Failed to send email: [error details]`

### **Common Issues:**

| **Issue** | **Solution** |
|-----------|--------------|
| `Email address not verified` | Verify the sender email in SES Console |
| `MessageRejected: Email address is not verified` | You're in sandbox mode - verify recipient email OR request production access |
| `Throttling: Maximum sending rate exceeded` | You hit the rate limit (sandbox: 1/second, production: higher) |
| `Access Denied` | IAM user doesn't have `ses:SendEmail` permission |
| `Missing credentials in config` | Add `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` to `.env.local` |

---

## 📧 Email Types & Templates

### **Currently Implemented:**

1. **Household Invitation** (`/src/lib/email/templates/household-invitation.ts`)
   - Sent when household admin invites a new member
   - Includes branded HTML email with CTA button
   - Expires in 7 days

### **Future Email Templates (TODO):**

2. **Password Reset**
3. **Purchase Confirmation**
4. **Subscription Renewal Reminder**
5. **Trial Ending Notification**
6. **Token Low Balance Alert**

---

## 🎨 Email Template Structure

All email templates are located in `/src/lib/email/templates/` and follow this pattern:

```typescript
export function generateEmailTemplate(data: EmailData): {
  subject: string
  htmlBody: string
  textBody: string
} {
  // Return structured email content
}
```

**Design Guidelines:**
- Dark theme (black background, white text)
- VibrationFit brand colors (green, teal, purple)
- Responsive design (mobile-friendly)
- Plain text fallback for email clients that don't support HTML
- Clear CTA buttons with high contrast

---

## 🔒 Best Practices

### **Security:**
- Never commit AWS credentials to git
- Use IAM roles with minimum required permissions
- Rotate access keys regularly
- Use environment variables for all sensitive data

### **Deliverability:**
- Always include unsubscribe links (for marketing emails)
- Monitor bounce and complaint rates
- Use authenticated sending (SPF, DKIM, DMARC records)
- Send from a consistent domain

### **Performance:**
- SES is asynchronous - don't block API responses waiting for email confirmation
- We gracefully handle email failures (invitation still created even if email fails)
- Log all email attempts for debugging

### **Testing:**
- Test emails in sandbox mode before production
- Use AWS simulator addresses for automated tests
- Verify HTML renders correctly across email clients (Gmail, Outlook, Apple Mail)

---

## 🔗 Useful Links

- [AWS SES Console](https://console.aws.amazon.com/ses/)
- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
- [SES Sending Limits](https://docs.aws.amazon.com/ses/latest/dg/manage-sending-quotas.html)
- [Email Templates Guide](https://www.goodemailcopy.com/)

---

## ✅ Quick Checklist

- [ ] AWS SES domain or email verified
- [ ] Production access requested/approved (if needed)
- [ ] IAM user has `ses:SendEmail` permission
- [ ] Environment variables added to `.env.local`:
  - `AWS_REGION`
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_SES_FROM_EMAIL`
- [ ] Test email sent successfully
- [ ] Household invitation email tested

---

**🎉 Once these steps are complete, your household invitation emails will be automatically sent when admins invite new members!**

