# Instagram DM Automation — Setup (Multi-Account, Instagram Login)

**Last Updated:** July 4, 2026
**Status:** Active

Self-hosted ManyChat-style automation: keyword-triggered DM auto-replies and
comment-to-DM private replies, running on multiple Instagram
professional accounts (Jordan, Vanessa, VibrationFit) from one Meta app.
Rules and connected accounts are managed at `/admin/instagram`.

Uses Meta's **"Instagram API with Instagram Login"** flow: each IG account
logs in directly and gets its own token — no Facebook Page linking required.

## Architecture

| Piece | Location |
|---|---|
| Webhook receiver | `src/app/api/webhooks/meta/route.ts` |
| Graph API client | `src/lib/meta/messaging.ts` |
| Connected accounts | `meta_accounts` table (token per account) |
| Rules + activity log | `meta_automation_rules`, `meta_messages` |
| Token refresh cron | `src/app/api/cron/meta-refresh-tokens/route.ts` (daily 8:00 UTC) |
| Admin UI | `/admin/instagram` |
| Admin API | `src/app/api/admin/instagram/` |

Flow: Meta POSTs DM/comment events to `/api/webhooks/meta` → route verifies
the `X-Hub-Signature-256` HMAC → resolves which connected account the event
belongs to via `entry.id` → matches text against that account's active rules →
sends the reply with that account's token → logs to `meta_messages`.

## 1. Prerequisites (per account)

- The IG account must be a **professional account** (Business or Creator).
  Personal accounts: Instagram app → Settings → Account type and tools →
  Switch to professional account → Creator. Free, reversible, looks the same.
- While the Meta app is in dev mode, each account must be added as an
  **Instagram Tester**: app dashboard → App roles → Roles → Add people →
  Instagram Tester → enter the IG username. Then accept the invite at
  instagram.com → Settings → Website permissions → Apps and websites →
  Tester invites.
- On each phone: Instagram app → Settings → Messages and story replies →
  Message controls → Connected tools → **Allow access to messages** ON.

## 2. Meta app configuration (once)

1. App dashboard → use case **"Manage messaging & content on Instagram"** →
   Customize → **API setup with Instagram login**.
2. Note the **Instagram app secret** on that screen — this is `META_APP_SECRET`
   (NOT the one under Settings → Basic).
3. Permissions to have on the use case: `instagram_business_basic`,
   `instagram_business_manage_messages`, `instagram_business_manage_comments`
   (+ `instagram_business_content_publish`, `instagram_business_manage_insights`
   for future marketing use).

## 3. Connect each account

1. On the "API setup with Instagram login" screen, click **Add account** and
   log in as the IG account (do this for Jordan's, Vanessa's, and the
   VibrationFit accounts).
2. Generate the account's access token (starts with `IGAA…`).
3. Paste it into `/admin/instagram` → Connected accounts → **Connect account**.
   The server identifies the account, normalizes the token to long-lived, and
   stores it in `meta_accounts`.

Tokens last ~60 days; the daily cron refreshes any token expiring within
15 days, so accounts stay connected indefinitely once added.

## 4. Environment variables (Vercel + `.env.local`)

| Variable | Value |
|---|---|
| `META_APP_SECRET` | Instagram app secret (step 2) |
| `META_WEBHOOK_VERIFY_TOKEN` | Any random string (used in step 5) |

Per-account tokens live in the database, not in env vars.

## 5. Register the webhook (after deploying)

The code must be deployed first so the endpoint can answer Meta's
verification handshake.

1. On the "API setup with Instagram login" screen → **Configure webhooks**.
2. Callback URL: `https://vibrationfit.com/api/webhooks/meta`
3. Verify token: the exact value of `META_WEBHOOK_VERIFY_TOKEN`.
4. Subscribe to fields: **`messages`**, **`comments`**.

Webhook events for every connected account arrive at the same endpoint; the
route matches them to accounts by `entry.id` (= the account's IG user ID).

## 6. Test (dev mode)

Before App Review, automation only works when the *sender* also has a role on
the app (add test senders as Instagram Testers too).

1. Create a rule at `/admin/instagram` (e.g. DM keyword `TEST`, scoped to one
   account or "All accounts").
2. From a tester account, DM the target account: `TEST`.
3. The auto-reply should arrive within seconds, and the exchange appears in
   Recent Activity.
4. Repeat with a comment keyword rule.

## 7. App Review (to go live for the public)

Submit `instagram_business_manage_messages` and
`instagram_business_manage_comments` for Advanced Access with a screencast of
the dev-mode test flow. Once approved, the automation works for DMs/comments
from anyone.

## Platform rules to remember

- **24-hour window:** DM replies only within 24h of the user's last inbound
  message. No cold outreach — same rule ManyChat has.
- **Private replies:** one per comment, within 7 days of the comment.
- The webhook always returns 200 to Meta, even on internal errors, so the
  subscription never gets auto-disabled. Check Vercel logs (`[meta-webhook]`
  prefix) when debugging.
- The Facebook (Messenger/Page) path is still supported by the code
  (`meta_accounts.platform = 'facebook'` + `object: "page"` webhooks) but is
  not part of the current setup.
