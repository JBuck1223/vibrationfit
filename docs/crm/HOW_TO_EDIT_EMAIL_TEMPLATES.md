# How to Edit Email Templates

**Last Updated:** December 13, 2025  
**Status:** Active

## 📧 Email Template System

VibrationFit uses a **file-based email template system**. Templates are TypeScript files that generate HTML, plain text, and subject lines.

---

## 🗂️ Template Files Location

All email templates live in:

```
/src/lib/email/templates/
├── index.ts                           ← Registry (add new templates here)
├── household-invitation.ts            ← Household invite email
├── support-ticket-created.ts          ← Support ticket confirmation
└── [your-new-template].ts             ← Add new templates here
```

---

## ✏️ How to Edit an Existing Template

### Step 1: Locate the Template File

1. Go to `/admin/emails/list` in your browser
2. Click on the template you want to edit
3. Find the **"How to Edit This Template"** section
4. Copy the file path (e.g., `/src/lib/email/templates/support-ticket-created.ts`)

### Step 2: Open the File

Open the file in your code editor:

```bash
# Example:
code /src/lib/email/templates/support-ticket-created.ts
```

### Step 3: Edit the Content

Each template file has three main parts:

```typescript
export function generateYourTemplateEmail(data: YourDataInterface) {
  const { variable1, variable2 } = data

  // 1. SUBJECT LINE
  const subject = `Your Subject Line: ${variable1}`

  // 2. HTML BODY (full HTML email)
  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <body>
        <h1>Your content here</h1>
        <p>Use ${variable1} anywhere</p>
      </body>
    </html>
  `

  // 3. TEXT BODY (plain text fallback)
  const textBody = `
    Your content here
    Use ${variable1} anywhere
  `

  return { subject, htmlBody, textBody }
}
```

### Step 4: Save & Deploy

1. **Save the file** in your editor
2. **Restart dev server** (if running locally):
   ```bash
   # Stop (Ctrl+C) and restart:
   npm run dev
   ```
3. **Deploy** (if on production):
   ```bash
   git add .
   git commit -m "Update email template"
   git push
   ```

Changes go live immediately after deployment!

---

## 🆕 How to Create a New Template

### Step 1: Create the Template File

Create a new file in `/src/lib/email/templates/`:

```bash
# Example: password-reset.ts
touch /src/lib/email/templates/password-reset.ts
```

### Step 2: Write the Template

Use this template structure:

```typescript
// /src/lib/email/templates/password-reset.ts

export interface PasswordResetEmailData {
  userName: string
  resetLink: string
  expiresInMinutes: number
}

export function generatePasswordResetEmail(
  data: PasswordResetEmailData
): { subject: string; htmlBody: string; textBody: string } {
  const { userName, resetLink, expiresInMinutes } = data

  const subject = `Reset Your VibrationFit Password`

  const htmlBody = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #000000; color: #ffffff;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">
              
              <tr>
                <td style="padding: 40px; background-color: #1F1F1F; border-radius: 16px; border: 2px solid #333333;">
                  <h1 style="margin: 0 0 24px; font-size: 28px; font-weight: bold; color: #199D67;">
                    Reset Your Password
                  </h1>
                  
                  <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #E5E5E5;">
                    Hi ${userName},
                  </p>
                  
                  <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.6; color: #E5E5E5;">
                    Click the button below to reset your password. This link expires in ${expiresInMinutes} minutes.
                  </p>
                  
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                    <tr>
                      <td align="center">
                        <a href="${resetLink}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #199D67, #14B8A6); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 50px; box-shadow: 0 4px 14px rgba(25, 157, 103, 0.4);">
                          Reset Password
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 0; font-size: 13px; color: #999999;">
                    If you didn't request this, you can safely ignore this email.
                  </p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  const textBody = `
Reset Your Password

Hi ${userName},

Click the link below to reset your password. This link expires in ${expiresInMinutes} minutes.

${resetLink}

If you didn't request this, you can safely ignore this email.
  `

  return { subject, htmlBody, textBody }
}
```

### Step 3: Register the Template

Add it to `/src/lib/email/templates/index.ts`:

```typescript
import { generatePasswordResetEmail } from './password-reset'

export const EMAIL_TEMPLATES = [
  // ... existing templates
  {
    id: 'password-reset',
    name: 'Password Reset',
    description: 'Sent when a user requests to reset their password',
    category: 'security',
    status: 'active' as const,
    variables: ['userName', 'resetLink', 'expiresInMinutes'],
    triggers: [
      'User clicks "Forgot Password"',
      'User requests password reset from settings',
    ],
    templateFile: 'password-reset.ts',
  },
]

export { generatePasswordResetEmail }
```

### Step 4: Use in Your Code

Import and use it in your API routes:

```typescript
import { generatePasswordResetEmail } from '@/lib/email/templates/password-reset'
import { sendEmail } from '@/lib/messaging/email'

// In your API route:
const emailContent = generatePasswordResetEmail({
  userName: user.name,
  resetLink: `https://vibrationfit.com/reset-password/${token}`,
  expiresInMinutes: 30,
})

await sendEmail({
  to: user.email,
  subject: emailContent.subject,
  htmlBody: emailContent.htmlBody,
  textBody: emailContent.textBody,
  replyTo: 'team@vibrationfit.com',
})
```

---

## 🎨 Design Guidelines

### Colors (Use These Hex Values)

```css
Primary Green:    #199D67  /* Main brand color */
Secondary Teal:   #14B8A6  /* Accents */
Background Black: #000000  /* Email background */
Card Dark:        #1F1F1F  /* Content cards */
Border:           #333333  /* Borders */
Text White:       #FFFFFF  /* Main text */
Text Gray:        #E5E5E5  /* Body text */
Text Muted:       #999999  /* Small text */
```

### Button Styles

```html
<a href="{{link}}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #199D67, #14B8A6); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 50px; box-shadow: 0 4px 14px rgba(25, 157, 103, 0.4);">
  Button Text
</a>
```

### Card Container

```html
<table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">
  <tr>
    <td style="padding: 40px; background-color: #1F1F1F; border-radius: 16px; border: 2px solid #333333;">
      <!-- Your content here -->
    </td>
  </tr>
</table>
```

---

## 🧪 Testing Templates

### Test in Browser

1. Go to `/admin/emails/templates/[template-id]`
2. Click **"Show Preview"** to see the HTML rendered
3. Enter your email in **"Send Test Email"**
4. Click **"Send Test"**
5. Check your inbox!

### Test in Code

Use the test email API:

```typescript
// POST /api/admin/emails/test
{
  "to": "your@email.com",
  "templateId": "support-ticket-created",
  "templateData": {
    "ticketNumber": "TEST-001",
    "ticketSubject": "Test subject",
    "ticketStatus": "open",
    "ticketUrl": "https://vibrationfit.com/test"
  }
}
```

---

## 📋 Template Checklist

Before deploying a new template:

- [ ] Subject line is clear and concise
- [ ] HTML body uses VibrationFit brand colors
- [ ] Text body (plain text) is readable
- [ ] All variables are used correctly
- [ ] Links work (test with real URLs)
- [ ] Buttons have proper styling
- [ ] Mobile-responsive (600px max width)
- [ ] Test email sent and reviewed
- [ ] Registered in `index.ts`
- [ ] Used in relevant API routes

---

## 🔍 Where Templates Are Used

| Template | Used In | API Route |
|----------|---------|-----------|
| `support-ticket-created` | Support ticket submission | `/api/support/tickets` (POST) |
| `household-invitation` | Household member invite | `/api/household/invitations` (POST) |

---

## 💡 Pro Tips

1. **Use inline CSS** - Email clients don't support `<style>` tags well
2. **Use tables for layout** - Flexbox/Grid don't work in most email clients
3. **Test on multiple devices** - Desktop, mobile, different email clients
4. **Keep it simple** - Complex layouts often break in email
5. **Always provide plain text** - Some users disable HTML emails
6. **Use absolute URLs** - Relative paths don't work in emails

---

## 🚨 Common Mistakes

❌ **Using external stylesheets** - Won't work in emails  
❌ **Forgetting plain text body** - Required for accessibility  
❌ **Not testing on mobile** - 60%+ of emails are opened on mobile  
❌ **Using JavaScript** - Doesn't work in emails  
❌ **Relative URLs** - Use full URLs like `https://vibrationfit.com/...`

---

## 📚 Resources

- **Current Templates:** `/src/lib/email/templates/`
- **Template Registry:** `/src/lib/email/templates/index.ts`
- **Email Sending:** `/src/lib/messaging/email.ts`
- **Admin UI:** `/admin/emails/list`
- **Brand Guide:** `vibrationfit-brand-kit.html`

---

**Questions?** Check the template detail page at `/admin/emails/templates/[id]` for live examples and testing!




