# Email & SMS Logging - Complete Setup Guide

**Last Updated:** November 26, 2025  
**Status:** Active

## Overview

VibrationFit now logs **every message** (email and SMS) sent to or received from members, creating a complete communication history in your own database.

---

## What This Gives You

### **Your Data, Your Asset**

✅ **Complete conversation history** - Never lose a message  
✅ **Full searchability** - Find any conversation instantly  
✅ **AI-ready data** - Feed to your own AI for insights  
✅ **No vendor lock-in** - Own your data forever  
✅ **Compliance & legal protection** - Prove consent, keep receipts  
✅ **Business intelligence** - Response rates, engagement patterns  

---

## Database Tables

### `sms_messages`
Stores all SMS conversations (outbound via Twilio, inbound via webhooks)

**Key Fields:**
- `user_id` - Links to member
- `direction` - 'inbound' or 'outbound'
- `body` - Message content
- `status` - 'sent', 'delivered', 'failed', 'received'
- `twilio_sid` - Twilio Message ID

### `email_messages`
Stores all email conversations (outbound via AWS SES, inbound via IMAP from Google Workspace)

**Key Fields:**
- `user_id` - Links to member
- `direction` - 'inbound' or 'outbound'
- `from_email`, `to_email` - Sender/recipient
- `subject`, `body_text`, `body_html` - Email content
- `status` - 'sent', 'delivered', 'failed', 'opened'
- `ses_message_id` - AWS SES tracking ID
- `imap_message_id` - For deduplication
- `thread_id` - Groups conversation threads

---

## Architecture

### Outbound Messages

**SMS (via Twilio):**
1. Admin sends SMS from CRM → `/api/messaging/send`
2. API calls Twilio SDK
3. API logs to `sms_messages` table
4. Twilio webhook updates status (delivered/failed)

**Email (via AWS SES):**
1. Admin sends email from CRM → `/api/crm/members/[id]/email`
2. API calls AWS SES SDK
3. API logs to `email_messages` table
4. Email sent with `replyTo: team@vibrationfit.com`

### Inbound Messages

**SMS (via Twilio Webhook):**
1. Member sends SMS to your Twilio number
2. Twilio posts to `/api/messaging/webhook/twilio`
3. API logs to `sms_messages` table (direction: 'inbound')
4. (Optional) Trigger notification to admin

**Email (via IMAP Sync):**
1. Member replies to email at `team@vibrationfit.com`
2. Email arrives in Google Workspace inbox
3. Cron job runs `/api/messaging/sync-emails` every 5 min
4. IMAP job fetches unread emails
5. API logs to `email_messages` table (direction: 'inbound')
6. Email marked as read in Gmail

---

## Environment Variables

Add to `.env.local`:

```bash
# === SMS (Twilio) ===
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+15551234567

# === Email Outbound (AWS SES) ===
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=AKIAxxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_SES_FROM_EMAIL=no-reply@vibrationfit.com

# === Email Inbound (Google Workspace IMAP) ===
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=team@vibrationfit.com
IMAP_PASSWORD=your_app_password  # Google App Password (NOT your main password)

# === Supabase Admin (for CRM access) ===
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## Setup Steps

### 1. Run Migration

```bash
npx supabase migration up
```

This creates the `email_messages` table.

### 2. Configure Google Workspace for IMAP

#### A. Enable IMAP in Gmail

1. Go to Gmail Settings → Forwarding and POP/IMAP
2. Enable IMAP access
3. Save changes

#### B. Create App Password

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification (required)
3. Go to App Passwords
4. Create new app password for "Mail"
5. Copy the 16-character password
6. Add to `.env.local` as `IMAP_PASSWORD`

### 3. Test Email Sync

**Manual test:**

```bash
curl -X POST http://localhost:3000/api/messaging/sync-emails \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT"
```

**Or use the CRM Dashboard "Sync Emails" button.**

### 4. Set Up Cron Job (Production)

Use Vercel Cron or external service to call `/api/messaging/sync-emails` every 5 minutes.

**Vercel Cron (vercel.json):**

```json
{
  "crons": [
    {
      "path": "/api/messaging/sync-emails",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**Or use an external service like:**
- Uptime Robot (free, pings endpoint every 5 min)
- EasyCron
- AWS EventBridge

---

## How It Works in the CRM

### Member Detail Page → Messages Tab

Shows **SMS conversation**:
- Threaded view (sent/received)
- Real-time updates from Twilio webhooks
- Send new SMS from composer

### Member Detail Page → Email Tab

Shows **email conversation**:
- All sent + received emails
- Full HTML rendering
- Send new email from composer

### Everything is logged to your database!

Every message = 1 row in `sms_messages` or `email_messages`

---

## IMAP Sync Logic

### What Gets Synced

- ✅ Unread emails from last 30 days
- ✅ Emails sent TO `team@vibrationfit.com`
- ✅ Automatically matches sender email to member

### Deduplication

- Each email has unique `imap_message_id`
- Before inserting, checks if already exists
- Prevents duplicate logging

### User Matching

1. Tries to find user by `email` in `auth.users`
2. Falls back to `user_profiles.email`
3. If no match, stores in `guest_email` field (for leads)

---

## Testing Checklist

- [ ] Send SMS to member from CRM → Check `sms_messages` table
- [ ] Member replies to SMS → Check webhook logs + `sms_messages` table
- [ ] Send email to member from CRM → Check `email_messages` table
- [ ] Member replies to email → Run sync → Check `email_messages` table
- [ ] View Messages tab → See full SMS thread
- [ ] View Email tab → See full email thread
- [ ] Send new message from each tab → Appears in thread

---

## API Endpoints

### SMS

- `POST /api/messaging/send` - Send SMS (logs to DB)
- `POST /api/messaging/webhook/twilio` - Receive inbound SMS (logs to DB)

### Email

- `POST /api/crm/members/[id]/email` - Send individual email (logs to DB)
- `POST /api/crm/members/bulk-message` - Send bulk email/SMS (logs to DB)
- `POST /api/messaging/sync-emails` - Sync inbound emails via IMAP (logs to DB)

### Conversation History

- `GET /api/crm/members/[id]` - Returns `smsMessages` and `emailMessages` arrays

---

## Security Notes

### IMAP Credentials

- ❌ **NEVER** use your main Google password
- ✅ **ALWAYS** use App Password (16-char generated password)
- ✅ Rotate App Password periodically
- ✅ Store in environment variables, never commit to git

### Database Access

- SMS/Email messages use RLS (Row Level Security)
- Users can only see their own messages
- Admins can see all messages (buckinghambliss@gmail.com, etc.)

### Reply-To Address

All outbound emails set `replyTo: team@vibrationfit.com` so replies go to your Google Workspace inbox and get synced back via IMAP.

---

## Cost Breakdown

**Twilio SMS:**
- Outbound: ~$0.0075/message
- Inbound: ~$0.0075/message
- Phone number: ~$1.15/month

**AWS SES:**
- First 62,000 emails/month: **FREE** (AWS Free Tier)
- After: $0.10 per 1,000 emails

**Google Workspace:**
- Already using for email ($6-18/user/month)
- IMAP access included

**Database Storage:**
- Text-only messages are tiny (~1KB each)
- 10,000 messages = ~10MB

**Total ongoing cost:** ~$1-5/month for messaging at low volume

---

## Future Enhancements

### Phase 1 (Current)
✅ Outbound SMS/Email  
✅ Inbound SMS via webhook  
✅ Inbound Email via IMAP  
✅ Complete conversation history  

### Phase 2 (Future)
- [ ] Email open tracking (SES + pixel)
- [ ] Link click tracking
- [ ] Automated responses based on keywords
- [ ] Email templates library
- [ ] Scheduled messages
- [ ] Bulk import conversations from old CRM

### Phase 3 (Advanced)
- [ ] AI-powered response suggestions
- [ ] Sentiment analysis on conversations
- [ ] Auto-categorize support tickets from emails
- [ ] Unified inbox (SMS + Email in one view)

---

## Troubleshooting

### IMAP Connection Failed

**Error:** `"IMAP connection error: ..."`

**Fix:**
1. Verify `IMAP_HOST`, `IMAP_PORT`, `IMAP_USER` are correct
2. Ensure you're using App Password (not main password)
3. Check Gmail IMAP is enabled
4. Test credentials with mail client (Thunderbird, Apple Mail)

### Emails Not Syncing

**Error:** No new emails appearing

**Fix:**
1. Check `/api/messaging/sync-emails` logs
2. Verify emails are unread in Gmail
3. Check emails are less than 30 days old
4. Manually trigger sync via CRM dashboard

### SMS Webhook Not Working

**Error:** Inbound SMS not appearing

**Fix:**
1. Verify Twilio webhook URL is set correctly
2. Check webhook logs in Twilio console
3. Ensure webhook URL is publicly accessible (use ngrok for local dev)
4. Check `/api/messaging/webhook/twilio` logs

### Duplicate Emails

**Error:** Same email appearing multiple times

**Fix:**
- IMAP sync uses `imap_message_id` for deduplication
- If seeing duplicates, check DB for duplicate `imap_message_id` values
- May need to add unique constraint

---

## Success!

You now have a **world-class communication logging system** that rivals enterprise CRMs, but you **own the data** and **control the costs**.

Every conversation with your members is now:
- ✅ Stored in your database forever
- ✅ Searchable and analyzable
- ✅ Ready for AI insights
- ✅ Exportable and portable
- ✅ Compliant and secure

**Your CRM is now enterprise-grade!** 🚀

