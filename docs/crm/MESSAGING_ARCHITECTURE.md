# Messaging Architecture - Visual Guide

**Last Updated:** November 26, 2025

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         VIBRATIONFIT CRM                            │
│                  (Member Communication System)                       │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                ┌──────────────────┴──────────────────┐
                │                                     │
         ┌──────▼──────┐                     ┌───────▼────────┐
         │     SMS      │                     │     EMAIL      │
         │  (Twilio)    │                     │  (SES + IMAP)  │
         └──────────────┘                     └────────────────┘
                │                                     │
    ┌───────────┴──────────┐              ┌─────────┴──────────┐
    │                      │              │                    │
┌───▼────┐           ┌────▼───┐      ┌───▼────┐        ┌─────▼─────┐
│ SEND   │           │RECEIVE │      │ SEND   │        │  RECEIVE  │
│Outbound│           │Inbound │      │Outbound│        │  Inbound  │
└───┬────┘           └────┬───┘      └───┬────┘        └─────┬─────┘
    │                     │              │                    │
    │   ┌─────────────────┘              │   ┌────────────────┘
    │   │                                │   │
    ▼   ▼                                ▼   ▼
┌─────────────────────┐          ┌──────────────────────┐
│   sms_messages      │          │   email_messages     │
│  (Database Table)   │          │   (Database Table)   │
└─────────────────────┘          └──────────────────────┘
```

---

## SMS Flow (Twilio)

### Outbound (Admin → Member)

```
┌────────────┐
│ Admin CRM  │  1. Clicks "Send SMS"
└─────┬──────┘
      │
      ▼
┌────────────────────────┐
│ POST /api/messaging/   │  2. API endpoint
│      send              │
└─────┬──────────────────┘
      │
      ├─────► 3. Call Twilio API
      │       (sendSMS function)
      │
      ├─────► 4. Log to sms_messages table
      │       {
      │         direction: 'outbound',
      │         status: 'sent',
      │         twilio_sid: 'SMxxxxx'
      │       }
      │
      ▼
┌────────────────────────┐
│   Member's Phone       │  5. SMS delivered
│   +1 555-123-4567      │
└────────────────────────┘
      │
      │  6. Twilio status update
      ▼
┌────────────────────────┐
│ POST /api/messaging/   │  7. Webhook updates DB
│   webhook/twilio       │     status: 'delivered'
└────────────────────────┘
```

### Inbound (Member → Admin)

```
┌────────────────────────┐
│   Member's Phone       │  1. Member sends SMS
│   +1 555-123-4567      │
└─────┬──────────────────┘
      │
      ▼
┌────────────────────────┐
│   Twilio receives      │  2. Twilio webhook fires
└─────┬──────────────────┘
      │
      ▼
┌────────────────────────┐
│ POST /api/messaging/   │  3. Log inbound message
│   webhook/twilio       │     {
└─────┬──────────────────┘       direction: 'inbound',
      │                          from_phone: '+15551234567',
      │                          body: 'Hey, thanks!'
      ├─────► 4. Find user_id    }
      │       by phone number
      │
      ├─────► 5. Save to DB
      │
      ▼
┌────────────────────────┐
│ sms_messages table     │  6. Message logged
│ ├─ id: uuid            │
│ ├─ user_id: member     │
│ ├─ direction: inbound  │
│ └─ body: 'Hey, thanks!'│
└────────────────────────┘
      │
      ▼
┌────────────────────────┐
│ CRM UI refreshes       │  7. Admin sees reply
│ Messages tab updated   │
└────────────────────────┘
```

---

## Email Flow (AWS SES + IMAP)

### Outbound (Admin → Member)

```
┌────────────┐
│ Admin CRM  │  1. Composes email
│ Email Tab  │     Subject + Body
└─────┬──────┘
      │
      ▼
┌──────────────────────────┐
│ POST /api/crm/members/   │  2. Send email API
│      [id]/email          │
└─────┬────────────────────┘
      │
      ├─────► 3. Call AWS SES
      │       sendEmail({
      │         to: member@email.com,
      │         subject: 'Hello!',
      │         replyTo: 'team@vibrationfit.com'
      │       })
      │
      ├─────► 4. Log to email_messages
      │       {
      │         direction: 'outbound',
      │         ses_message_id: '0000...',
      │         status: 'sent'
      │       }
      │
      ▼
┌────────────────────────┐
│  Member's Gmail        │  5. Email delivered
│  member@gmail.com      │
└────────────────────────┘
```

### Inbound (Member → Admin via IMAP)

```
┌────────────────────────┐
│  Member's Gmail        │  1. Member clicks "Reply"
│  member@gmail.com      │     Sends to team@vibrationfit.com
└─────┬──────────────────┘
      │
      ▼
┌────────────────────────┐
│  Google Workspace      │  2. Email arrives in
│  team@vibrationfit     │     team inbox
└─────┬──────────────────┘
      │
      │  (Email sits in inbox, unread)
      │
      ▼
┌────────────────────────┐
│   Cron Job (5 min)     │  3. Scheduled job triggers
│   Vercel Cron or       │
│   Uptime Robot         │
└─────┬──────────────────┘
      │
      ▼
┌──────────────────────────┐
│ POST /api/messaging/     │  4. IMAP sync job
│      sync-emails         │
└─────┬────────────────────┘
      │
      ├─────► 5. Connect to Gmail via IMAP
      │       imap.gmail.com:993
      │       username: team@vibrationfit.com
      │       password: app_password
      │
      ├─────► 6. Search for unread emails
      │       ['UNSEEN', 'SINCE 30 days ago']
      │
      ├─────► 7. Parse each email
      │       - Extract: from, to, subject, body
      │       - Get Message-ID (for deduplication)
      │
      ├─────► 8. Match sender to user_id
      │       - Search auth.users by email
      │       - Or user_profiles by email
      │       - Or store as guest_email
      │
      ├─────► 9. Check for duplicates
      │       SELECT WHERE imap_message_id = ?
      │       (Skip if already exists)
      │
      ├─────► 10. Save to DB
      │        {
      │          direction: 'inbound',
      │          from_email: 'member@gmail.com',
      │          to_email: 'team@vibrationfit.com',
      │          subject: 'Re: Hello!',
      │          body_html: '<p>Thanks!</p>',
      │          imap_message_id: '<abc@gmail.com>',
      │          status: 'delivered'
      │        }
      │
      └─────► 11. Mark email as read in Gmail
              (Prevents re-syncing)
```

---

## Database Schema

### `sms_messages`

```sql
CREATE TABLE sms_messages (
  id UUID PRIMARY KEY,
  user_id UUID → auth.users(id),
  
  -- Phone numbers
  from_phone TEXT,
  to_phone TEXT,
  
  -- Content
  body TEXT,
  
  -- Direction & Status
  direction TEXT ('inbound' | 'outbound'),
  status TEXT ('sent' | 'delivered' | 'failed' | 'received'),
  
  -- Twilio tracking
  twilio_sid TEXT,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

### `email_messages`

```sql
CREATE TABLE email_messages (
  id UUID PRIMARY KEY,
  user_id UUID → auth.users(id),
  guest_email TEXT,  -- For non-registered users
  
  -- Email addresses
  from_email TEXT,
  to_email TEXT,
  cc_emails TEXT[],
  bcc_emails TEXT[],
  
  -- Content
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  
  -- Direction & Status
  direction TEXT ('inbound' | 'outbound'),
  status TEXT ('sent' | 'delivered' | 'failed' | 'opened'),
  
  -- Provider tracking
  ses_message_id TEXT,      -- AWS tracking (outbound)
  imap_message_id TEXT,     -- Gmail Message-ID (inbound, for deduplication)
  imap_uid INTEGER,         -- IMAP UID
  
  -- Threading
  is_reply BOOLEAN,
  reply_to_message_id UUID → email_messages(id),
  thread_id TEXT,
  
  -- Attachments
  has_attachments BOOLEAN,
  attachment_urls TEXT[],
  
  -- Timestamps
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

---

## UI Components

### Member Detail Page Structure

```
┌────────────────────────────────────────────────────┐
│  Jordan Buckingham                    [Edit]       │
│  jordan@example.com | +1 555-234-5678              │
│  Member since Jan 2025 | Solo Pro $29/mo           │
├────────────────────────────────────────────────────┤
│  [Overview] [Activity] [Features] [Revenue]        │
│  [Messages] [Email] [Support]                      │
├────────────────────────────────────────────────────┤
│                                                    │
│  MESSAGES TAB (SMS):                               │
│  ┌──────────────────────────────────────────────┐ │
│  │  [Inbound]  Hey, can you help me?            │ │
│  │                        9:15 AM                │ │
│  │                                               │ │
│  │            Of course! What do you need?  [→]  │ │
│  │            9:17 AM                            │ │
│  │                                               │ │
│  │  [Inbound]  Thanks! All set now.             │ │
│  │                        9:20 AM                │ │
│  └──────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────┐ │
│  │  Type your message...                        │ │
│  │  [Send]                                      │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  EMAIL TAB:                                        │
│  ┌──────────────────────────────────────────────┐ │
│  │  [← Received] From: jordan@example.com       │ │
│  │  Subject: Question about my vision           │ │
│  │  Jan 20, 2025 9:15 AM                        │ │
│  │                                               │ │
│  │  Hi! I was wondering how to...               │ │
│  └──────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────┐ │
│  │  [→ Sent] To: jordan@example.com             │ │
│  │  Subject: Re: Question about my vision       │ │
│  │  Jan 20, 2025 9:30 AM                        │ │
│  │                                               │ │
│  │  Great question! Here's how...               │ │
│  └──────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────┐ │
│  │  Subject: _______________________________    │ │
│  │  Message: ______________________________     │ │
│  │  [Send Email]                                │ │
│  └──────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────┘
```

---

## Security & Permissions

### RLS (Row Level Security) Policies

```sql
-- Users can view their own messages
CREATE POLICY "users_view_own_sms" ON sms_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_view_own_email" ON email_messages
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can manage all messages
CREATE POLICY "admins_all_sms" ON sms_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND email IN ('buckinghambliss@gmail.com', 'admin@vibrationfit.com')
    )
  );

CREATE POLICY "admins_all_email" ON email_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND email IN ('buckinghambliss@gmail.com', 'admin@vibrationfit.com')
    )
  );
```

---

## Environment Variables

```bash
# SMS (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+15551234567

# Email Outbound (AWS SES)
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=AKIAxxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_SES_FROM_EMAIL=no-reply@vibrationfit.com

# Email Inbound (Google IMAP)
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=team@vibrationfit.com
IMAP_PASSWORD=your_app_password  # NOT your main Google password!

# Supabase (for admin CRM access)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## Deduplication Strategy

### SMS
- Uses `twilio_sid` (unique per message)
- Webhook updates existing row by `twilio_sid`

### Email Outbound
- Uses `ses_message_id` from AWS SES
- One insert per send

### Email Inbound
- Uses `imap_message_id` (Gmail's Message-ID header)
- Before inserting, checks:
  ```sql
  SELECT id FROM email_messages 
  WHERE imap_message_id = ?
  ```
- If exists, skip
- Prevents duplicate logging on each IMAP sync

---

## Cron Job Setup

### Option 1: Vercel Cron (Recommended)

**vercel.json:**
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

### Option 2: External Service

**Uptime Robot (Free):**
1. Create HTTP(s) monitor
2. URL: `https://vibrationfit.com/api/messaging/sync-emails`
3. Interval: 5 minutes
4. Include authentication header

**EasyCron:**
1. Create new cron job
2. URL: `https://vibrationfit.com/api/messaging/sync-emails`
3. Schedule: `*/5 * * * *`

---

## Performance & Scalability

### Current Scale
- **10,000 messages** = ~10MB database storage
- **IMAP sync** = ~5 seconds per 100 emails
- **Cost** = ~$5/month (low volume)

### At 100k Messages/Month
- **Database** = ~100MB (negligible)
- **AWS SES** = $10-20/month
- **Twilio** = $75/month (10k SMS)
- **IMAP sync** = Still < 30 seconds per sync

### Optimization Tips
- Index on `user_id`, `created_at`, `direction`
- Partition `email_messages` by year (if > 1M rows)
- Archive old messages to cold storage (> 2 years)
- Use Redis cache for recent conversations

---

## Success Metrics

**You now track:**
- ✅ Total messages sent/received per member
- ✅ Response rate (% of outbound that get replies)
- ✅ Average response time
- ✅ Most active members
- ✅ Support load by day/week/month
- ✅ Email vs SMS preference by member

**Future analytics:**
- Sentiment analysis (positive/negative tone)
- AI-powered categorization (support, sales, feedback)
- Engagement score based on reply frequency
- Churn prediction (members who stop replying)

---

This is **enterprise-grade messaging infrastructure** that you **own and control**! 🚀

