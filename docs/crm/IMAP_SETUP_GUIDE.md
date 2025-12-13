# IMAP Setup Guide - Receive Customer Email Replies

**Last Updated:** December 13, 2025  
**Status:** ⚠️ DEPRECATED - Use AWS SES Inbound instead (see: AWS_SES_INBOUND_SETUP.md)

> ⚠️ **Note:** This guide is for IMAP polling (5-minute delay). For instant email notifications with AWS SES Inbound, see `AWS_SES_INBOUND_SETUP.md` instead!

## 📧 Overview

IMAP allows VibrationFit to automatically pull customer email replies from `team@vibrationfit.com` into your CRM system.

---

## 🔧 Step-by-Step Setup

### **Step 1: Enable 2-Factor Authentication**

Google requires 2FA to generate app passwords.

1. Go to **Google Account Settings**: https://myaccount.google.com/
2. Sign in with `team@vibrationfit.com`
3. Navigate to: **Security** → **2-Step Verification**
4. Click **Get Started**
5. Follow the prompts to set up 2FA (phone number or authenticator app)
6. ✅ Verify it works by logging out and back in

---

### **Step 2: Generate App Password**

1. Go to: https://myaccount.google.com/apppasswords
   - Or: **Google Account** → **Security** → **2-Step Verification** → **App Passwords**
2. You may need to sign in again
3. Click **"Select app"** dropdown → Choose **"Mail"**
4. Click **"Select device"** dropdown → Choose **"Other (Custom name)"**
5. Enter: **"VibrationFit CRM IMAP"**
6. Click **Generate**
7. 📋 **Copy the 16-character password** (looks like: `abcd efgh ijkl mnop`)
8. ⚠️ **Save it immediately** - you can't see it again!

---

### **Step 3: Update .env.local**

Open your `.env.local` file and update these lines:

```bash
# IMAP Configuration (for receiving customer email replies)
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=team@vibrationfit.com
IMAP_PASSWORD=abcdefghijklmnop        ← Paste your 16-char app password (no spaces)
IMAP_MAILBOX=INBOX
```

**Important:**
- Remove all spaces from the app password
- Use the raw 16 characters: `abcdefghijklmnop`

---

### **Step 4: Test IMAP Connection**

Create a test endpoint or use this command:

```bash
curl -X POST http://localhost:3000/api/messaging/sync-emails
```

Or visit: `/api/messaging/sync-emails` in your browser

**Expected Result:**
```json
{
  "success": true,
  "emailsFetched": 0,
  "emailsLogged": 0
}
```

---

### **Step 5: Enable Auto-Sync with Cron**

#### **Option A: Vercel Cron (Production)**

Create `/vercel.json`:

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

This runs every 5 minutes automatically on Vercel.

#### **Option B: Manual Cron (Server)**

If self-hosting, add to your crontab:

```bash
# Edit crontab
crontab -e

# Add this line:
*/5 * * * * curl -X POST https://vibrationfit.com/api/messaging/sync-emails
```

#### **Option C: Development (Manual)**

During development, manually trigger sync:

```bash
curl -X POST http://localhost:3000/api/messaging/sync-emails
```

---

## 🧪 Testing

### **Test the Full Flow:**

1. **Send a support ticket reply** from admin CRM
2. **Reply to that email** from your personal inbox
3. **Wait 5 minutes** (or manually trigger `/api/messaging/sync-emails`)
4. **Check** `/admin/emails/sent` to see the incoming reply

---

## 🔍 Troubleshooting

### **"Invalid credentials" Error**

❌ **Problem:** App password is wrong

✅ **Fix:**
- Regenerate app password in Google
- Make sure you copied it correctly (16 chars, no spaces)
- Update `.env.local` and restart server

### **"Authentication failed" Error**

❌ **Problem:** 2FA not enabled or IMAP disabled

✅ **Fix:**
- Enable 2FA in Google Account
- Enable IMAP in Gmail settings:
  - Gmail → Settings → Forwarding and POP/IMAP → Enable IMAP

### **"Connection timeout" Error**

❌ **Problem:** Wrong host or port

✅ **Fix:**
- Verify: `IMAP_HOST=imap.gmail.com`
- Verify: `IMAP_PORT=993`
- Check firewall isn't blocking port 993

### **No Emails Showing Up**

❌ **Problem:** Sync job not running

✅ **Fix:**
- Manually trigger: `curl -X POST http://localhost:3000/api/messaging/sync-emails`
- Check server logs for errors
- Verify cron job is configured

---

## 📊 How It Works

```
Customer replies → team@vibrationfit.com (Gmail)
                      ↓
          IMAP Sync Job (every 5 min)
                      ↓
          Parse email & extract ticket #
                      ↓
          Log to email_messages table
                      ↓
          Display in CRM ticket thread
```

---

## 🔐 Security Notes

- ✅ App passwords are more secure than your actual password
- ✅ Limited to IMAP access only (not full account access)
- ✅ Can be revoked anytime from Google Account settings
- ✅ Store in `.env.local` (never commit to git)

---

## 📝 Quick Reference

| Setting | Value |
|---------|-------|
| **IMAP Host** | `imap.gmail.com` |
| **IMAP Port** | `993` (SSL) |
| **Username** | `team@vibrationfit.com` |
| **Password** | App Password (16 chars) |
| **Mailbox** | `INBOX` |

---

## 🚀 After Setup

Once configured:
- ✅ Customer replies automatically sync to CRM
- ✅ No manual email checking needed
- ✅ Complete conversation history in one place
- ✅ Support team sees all context

---

**Questions?** Check the IMAP sync code at `/src/lib/messaging/imap-sync.ts`

