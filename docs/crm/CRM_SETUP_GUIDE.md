# VibrationFit CRM System - Setup & Usage Guide

**Last Updated:** November 26, 2025

## Overview

A complete, integrated CRM system for VibrationFit with marketing campaign tracking, lead management, support tickets, and SMS messaging via Twilio.

---

## 🚀 Quick Start

### 1. Run Database Migration

```bash
cd /Users/jordanbuckingham/Desktop/vibrationfit
npx supabase migration up
```

This creates all CRM tables:
- `marketing_campaigns`
- `leads`
- `user_activity_metrics`
- `user_revenue_metrics`
- `support_tickets`
- `support_ticket_replies`
- `sms_messages`
- `lead_tracking_events`

### 2. Set Up Twilio

1. Create account at https://twilio.com
2. Get phone number
3. Add credentials to `.env.local`:

```env
TWILIO_ACCOUNT_SID=your_sid_here
TWILIO_AUTH_TOKEN=your_token_here
TWILIO_PHONE_NUMBER=+15555551234
```

4. Set webhook URL in Twilio console:
   - **Webhook URL:** `https://vibrationfit.com/api/messaging/webhook/twilio`
   - **Method:** POST

### 3. Verify AWS SES

Ensure AWS SES is still configured (you already have this):
- Confirmation emails for leads
- Support ticket notifications
- Campaign communications

---

## 📍 System Architecture

### Public Pages (Lead Capture)

- `/contact` - Contact form
- `/demo` - Demo request
- `/intensive-intake` - 72-Hour Intensive application
- `/support` - Support ticket submission

All forms capture:
- UTM parameters (source, medium, campaign, content, term)
- Referrer
- Landing page
- Session data

### Admin CRM (`/admin/crm/`)

- `/campaigns` - Campaign management
  - List, create, edit campaigns
  - Track ROI, cost per lead
  - View attributed leads
- `/campaigns/[id]` - Campaign detail
- `/utm-builder` - UTM parameter generator

- `/leads` - Lead management
  - Table view with filters
  - Full attribution display
  - SMS conversation threads
- `/leads/[id]` - Lead detail
- `/leads/board` - Kanban board (drag-and-drop status)

- `/support/board` - Support ticket Kanban
  - Drag tickets between statuses
  - Priority and category badges

### API Endpoints

**Campaigns:**
- `GET /api/crm/campaigns` - List campaigns
- `POST /api/crm/campaigns` - Create campaign
- `GET /api/crm/campaigns/[id]` - Get campaign
- `PATCH /api/crm/campaigns/[id]` - Update campaign

**Leads:**
- `POST /api/leads` - Create lead (public)
- `GET /api/crm/leads` - List leads (admin)
- `GET /api/crm/leads/[id]` - Get lead details
- `PATCH /api/crm/leads/[id]` - Update lead

**Support:**
- `POST /api/support/tickets` - Create ticket
- `GET /api/support/tickets` - List tickets
- `GET /api/support/tickets/[id]` - Get ticket
- `POST /api/support/tickets/[id]/replies` - Add reply

**Messaging:**
- `POST /api/messaging/send` - Send SMS
- `POST /api/messaging/webhook/twilio` - Receive SMS
- `GET /api/messaging/conversation/[id]` - Get thread

---

## 📊 Campaign Workflow

### 1. Create Campaign

Go to `/admin/crm/campaigns/new`:
- Set campaign name, type, budget
- Add UTM parameters
- Set start/end dates
- Upload creatives (optional)

### 2. Generate Tracking URLs

Go to `/admin/crm/utm-builder`:
- Enter base URL
- Fill in UTM parameters
- Copy generated URL
- Use in your ads/emails

### 3. Track Performance

Campaign metrics auto-update when leads come in:
- **Total Leads** - Count of leads from campaign
- **Conversions** - Leads marked as "converted"
- **Cost Per Lead** - `total_spent / total_leads`
- **ROI** - `(revenue_generated - total_spent) / total_spent`

Update `total_spent` in campaign edit page as you spend.

---

## 📥 Lead Management

### Lead Statuses

Leads flow through these statuses:
- **New** - Just submitted
- **Contacted** - You've reached out
- **Qualified** - Good fit, interested
- **Converted** - Became a customer
- **Lost** - Not interested or no response

### Attribution Data Captured

Every lead captures:
- UTM parameters (campaign tracking)
- Referrer URL
- Landing page
- Time on site
- Pages visited
- Video engagement (if applicable)

### Lead Actions

On lead detail page (`/admin/crm/leads/[id]`):
- **Text** - Send SMS (if phone number provided)
- **Email** - Opens mailto link
- **Update Status** - Change lead status
- **Add Notes** - Internal notes
- **View Campaign** - See campaign that brought them in

### Using Kanban Board

Go to `/admin/crm/leads/board`:
- Drag cards between columns to change status
- Cards update in real-time
- Color-coded by status
- Click card to see full details

---

## 🎫 Support Ticket System

### For Users

Public form at `/support`:
- Enter email, subject, description
- Choose category
- Auto-generates ticket number (e.g., SUPP-0001)
- Sends confirmation email

### For Admins

Kanban board at `/admin/crm/support/board`:
- **Open** - New tickets
- **In Progress** - Being worked on
- **Waiting Reply** - Waiting for customer
- **Resolved** - Fixed
- **Closed** - Complete

Drag tickets to change status. Click to view details and replies.

### Ticket Replies

On ticket detail page:
- View full conversation
- Add replies
- Email notifications sent automatically
- Staff vs. customer replies clearly marked

---

## 💬 SMS Messaging (Twilio)

### Sending Messages

From lead detail page:
1. Click "📱 Text" button
2. Enter message
3. Message sent via Twilio
4. Stored in database
5. Thread displays in lead detail

### Receiving Messages

When customer replies:
1. Twilio sends webhook to your app
2. Message stored in database
3. Associated with lead automatically
4. You see it in the conversation thread

### Message Templates

Pre-built templates in `src/lib/messaging/templates.ts`:
- Lead confirmation
- Lead follow-up
- Demo reminder (24h, 1h)
- Support updates
- Customer welcome

Use these for consistent messaging.

### Opt-Out Handling

If customer texts "STOP":
- Automatically marked as opted out
- `sms_opt_in` set to false
- `sms_opt_out_date` recorded
- No more messages sent

---

## 📈 Tracking & Analytics

### What's Tracked

**Per Lead:**
- Source (Facebook, Google, etc.)
- Campaign attribution
- Landing page
- Time on site
- Page views
- Video engagement

**Per Campaign:**
- Total leads
- Conversion rate
- Cost per lead
- ROI

### Email Confirmations

Automated emails sent for:
- Lead submissions (all types)
- Support ticket creation
- Support ticket replies

Templates use your existing AWS SES setup.

---

## 🛠️ Customization

### Adding Campaign Types

Edit campaign type options in:
- `src/app/admin/crm/campaigns/new/page.tsx`
- `src/app/admin/crm/campaigns/[id]/edit/page.tsx`

Add new options to the select dropdown.

### Adding Lead Statuses

To add custom lead statuses:
1. Update status check in database migration
2. Add column to Kanban in `src/app/admin/crm/leads/board/page.tsx`
3. Add badge color in leads list page

### Adding Support Categories

Edit support categories in:
- `src/app/support/page.tsx` (public form)
- Database `category` check constraint

---

## 🔐 Security

### RLS Policies

All tables have Row Level Security enabled:
- **Campaigns** - Admin only
- **Leads** - Admin only
- **Support Tickets** - Users see their own, admins see all
- **SMS Messages** - Admin only

### Admin Check

Admin permissions checked via:
```typescript
const isAdmin =
  user.email === 'buckinghambliss@gmail.com' ||
  user.email === 'admin@vibrationfit.com' ||
  user.user_metadata?.is_admin === true
```

Add more admins by:
- Email comparison (hardcoded)
- Setting `is_admin: true` in user metadata

---

## 📝 Next Steps

### Recommended Improvements

1. **Customer Success Metrics** (from plan)
   - Activity tracking job
   - Engagement scoring
   - Health monitoring
   - Revenue metrics sync from Stripe

2. **Attribution Reporting**
   - Campaign comparison charts
   - Source performance analysis
   - Conversion funnel visualization

3. **S3 Creative Uploads**
   - Upload ad creatives to campaigns
   - Visual campaign history
   - A/B testing tracking

4. **Enhanced Messaging**
   - Rich message composer UI
   - Message templates selector
   - Scheduled messages
   - Bulk messaging

5. **Advanced Kanban**
   - Custom fields for grouping
   - Saved views
   - Filters and search
   - Export functionality

### Testing Checklist

Before going live, test:

- [ ] Submit contact form → Verify lead created
- [ ] Submit demo request → Verify email sent
- [ ] Create campaign → Add UTM link → Submit lead → Verify attribution
- [ ] Send SMS to lead → Receive reply → Verify thread displays
- [ ] Submit support ticket → Add reply → Verify emails sent
- [ ] Drag lead/ticket on Kanban → Verify status updates
- [ ] Update campaign spend → Verify CPL/ROI calculate correctly

---

## 🐛 Troubleshooting

### SMS Not Sending

Check:
- Twilio credentials in `.env.local`
- Phone number format (E.164: +15555551234)
- Twilio account is not suspended
- Sufficient Twilio balance

### Emails Not Sending

Check:
- AWS SES credentials still valid
- Email address is verified in SES
- Production access enabled (not sandbox)
- Check CloudWatch logs for errors

### Attribution Not Working

Check:
- UTM parameters in URL are lowercase
- Campaign exists in database
- Campaign ID or UTM campaign matches
- RLS policies allow lead creation

### Kanban Not Updating

Check:
- User is admin
- API route returns success
- Browser console for errors
- Database connection working

---

## 📚 Additional Resources

- **Design System:** `src/lib/design-system/components.tsx`
- **Messaging Service:** `src/lib/messaging/`
- **Email Service:** `src/lib/email/aws-ses.ts`
- **UTM Tracking Hook:** `src/hooks/useUTMTracking.ts`
- **Kanban Component:** `src/components/crm/Kanban.tsx`

---

## 💡 Usage Tips

**For Campaigns:**
- Always use lowercase in UTM parameters
- Be consistent with naming (facebook vs Facebook)
- Update `total_spent` regularly for accurate ROI
- Review leads weekly to keep pipeline moving

**For Leads:**
- Respond within 24 hours for best conversion
- Use SMS for quick follow-ups
- Add notes after every interaction
- Move to "lost" instead of deleting (data retention)

**For Support:**
- Prioritize "urgent" tickets first
- Move to "waiting_reply" when ball is in their court
- Use categories to identify common issues
- Close tickets only after customer confirms resolution

---

## 🎯 Success Metrics

Track these KPIs:
- **Lead Volume** - Leads per campaign/source
- **Conversion Rate** - % of leads that convert
- **Cost Per Lead** - How much each lead costs
- **Cost Per Acquisition** - Cost to convert a customer
- **Response Time** - Time to first contact
- **Support Resolution Time** - Ticket open to closed
- **Customer Satisfaction** - Track in support ticket notes

---

**You now have a world-class, integrated CRM!** 🚀




