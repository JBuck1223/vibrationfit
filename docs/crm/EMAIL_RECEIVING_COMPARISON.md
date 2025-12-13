# Email Receiving: IMAP vs AWS SES Inbound

**Last Updated:** December 13, 2025  
**Recommendation:** ✅ AWS SES Inbound

---

## 🆚 Quick Comparison

| Feature | IMAP Polling | AWS SES Inbound |
|---------|--------------|-----------------|
| **Speed** | 5-minute delay | Instant (<1 second) |
| **Cost** | $6-18/month (Google) | ~$0.01/month |
| **Setup** | 30 minutes | 2 hours |
| **Reliability** | Dependent on Google | AWS infrastructure |
| **Scalability** | Limited by polling | Infinite |
| **Webhook** | ❌ No | ✅ Yes |
| **Real-time** | ❌ No | ✅ Yes |

---

## 📊 Detailed Comparison

### **IMAP Polling (Google Workspace)**

**How it works:**
1. Customer sends email to `team@vibrationfit.com`
2. Email lands in Google Workspace inbox
3. Vercel cron job runs every 5 minutes
4. Job connects via IMAP to Gmail
5. Job fetches new emails
6. Job parses and stores in database

**Pros:**
- ✅ Keep Gmail web interface
- ✅ Email management in familiar Gmail
- ✅ Easy to forward/archive manually

**Cons:**
- ❌ 5-minute delay (not instant)
- ❌ Costs $6-18/month per user
- ❌ Requires Google Workspace account
- ❌ Polling is resource-intensive
- ❌ Can hit rate limits
- ❌ Requires cron job

**Best for:**
- Teams that already use Google Workspace
- Need Gmail interface for other emails
- Multiple team members need access
- Don't mind 5-minute delay

---

### **AWS SES Inbound (Recommended)**

**How it works:**
1. Customer sends email to `team@vibrationfit.com`
2. AWS SES receives email (you control MX records)
3. SES stores email in S3
4. SES triggers SNS notification
5. SNS calls your webhook instantly
6. Webhook parses and stores in database

**Pros:**
- ✅ Instant (webhook fires immediately)
- ✅ Extremely cheap (~$0.01/month)
- ✅ No polling/cron jobs needed
- ✅ Scales infinitely
- ✅ No external service dependency
- ✅ Already using AWS SES for sending

**Cons:**
- ❌ No Gmail web interface
- ❌ 2-hour setup (DNS, S3, SNS, webhooks)
- ❌ More technical configuration
- ❌ Can't manually reply from Gmail

**Best for:**
- Teams using CRM for all customer communication
- Want instant notifications
- Want to minimize costs
- Already using AWS SES for sending
- Don't need Gmail interface

---

## 🎯 Decision Matrix

### **Choose IMAP Polling IF:**

You answer YES to:
- [ ] Do you use Google Workspace for team collaboration?
- [ ] Do you need Gmail web interface?
- [ ] Do multiple team members need email access?
- [ ] Is 5-minute delay acceptable?
- [ ] Are you okay paying $6-18/month?

### **Choose AWS SES Inbound IF:**

You answer YES to:
- [ ] Do you want instant email notifications?
- [ ] Do you want to minimize costs?
- [ ] Do you manage ALL customer communication in your CRM?
- [ ] Do you NOT need Gmail web interface?
- [ ] Are you comfortable with 2-hour AWS setup?

---

## 💰 Cost Analysis

### **Scenario: 100 support emails/month**

**IMAP (Google Workspace):**
```
Google Workspace: $6/month (Business Starter)
Vercel Cron: Free (included in hobby/pro plan)
Total: $6/month = $72/year
```

**AWS SES Inbound:**
```
Receiving 100 emails: $0.01
Storing in S3: $0.001
SNS notifications: $0.00005
Total: $0.01/month = $0.12/year
```

**Savings: $71.88/year** 💰

---

## 🚀 Migration Path

### **If Currently Using Google:**

**Option 1: Full Switch to AWS SES**
1. Set up AWS SES Inbound
2. Test on subdomain first
3. Update MX records
4. Cancel Google Workspace

**Option 2: Gradual Migration**
1. Keep Google for team emails (`jordan@vibrationfit.com`)
2. Use AWS SES for support (`team@vibrationfit.com`)
3. Update MX records for support only

**Option 3: Keep Both (Not Recommended)**
1. Use Google for team
2. Forward `team@` to AWS SES
3. Defeats purpose of instant notifications

---

## ⚡ Performance Comparison

### **Email Response Time:**

**Customer sends email at 2:00:00 PM**

**IMAP Polling:**
- 2:00:00 PM - Email sent
- 2:00:01 PM - Lands in Gmail
- 2:05:00 PM - Cron job runs, fetches email
- 2:05:05 PM - Email appears in CRM
- **Total delay: ~5 minutes**

**AWS SES Inbound:**
- 2:00:00 PM - Email sent
- 2:00:01 PM - AWS SES receives
- 2:00:02 PM - Webhook fires
- 2:00:03 PM - Email appears in CRM
- **Total delay: ~3 seconds** ⚡

---

## 🔧 Technical Comparison

### **IMAP Polling Stack:**

```
Google Workspace (Gmail)
    ↓
IMAP Protocol (port 993)
    ↓
Vercel Cron Job (every 5 min)
    ↓
mailparser (email parsing)
    ↓
Supabase (database)
```

### **AWS SES Inbound Stack:**

```
AWS SES (MX records)
    ↓
S3 Bucket (email storage)
    ↓
SNS Topic (notification)
    ↓
Webhook Endpoint (instant)
    ↓
Supabase (database)
```

---

## ✅ Recommendation: AWS SES Inbound

**Why:**
1. **600x faster** (3 seconds vs 5 minutes)
2. **600x cheaper** ($0.12/year vs $72/year)
3. **Already have AWS SES** for sending
4. **No cron jobs** to maintain
5. **Infinite scalability**

**When to choose IMAP instead:**
- You need Gmail web interface
- Multiple team members need access
- Already paying for Google Workspace anyway

---

## 📚 Setup Guides

- **AWS SES Inbound:** `AWS_SES_INBOUND_SETUP.md` (2 hours)
- **IMAP Polling:** `IMAP_SETUP_GUIDE.md` (30 minutes, deprecated)

---

**Decision made? Follow the appropriate setup guide!** 🚀

