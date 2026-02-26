# Stripe Webhook Setup

**Last Updated:** February 25, 2026  
**Status:** Active

## Overview

The app expects Stripe to send events to a webhook endpoint. Without this, one-time payments (e.g. Activation Intensive with LAUNCH2026) will not create the user, order, or enrollment—payment will succeed in Stripe but the success page will never get a "ready" order.

Your app already has:

- **Endpoint:** `POST /api/stripe/webhook` (Next.js API route)
- **Env:** `STRIPE_WEBHOOK_SECRET` in `.env.local` (must match the secret Stripe gives you when you create the webhook)

## Steps in Stripe Dashboard

1. **Open Webhooks**
   - Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Developers** → **Webhooks**.

2. **Add endpoint**
   - Click **Add endpoint**.
   - **Endpoint URL:**  
     `https://<your-production-domain>/api/stripe/webhook`  
     Example: `https://vibrationfit.com/api/stripe/webhook`  
     For local testing you can use Stripe CLI (see below).
   - **Description (optional):** e.g. "VibrationFit production".

3. **Select events**
   - Choose **Select events** and add at least:
     - `payment_intent.succeeded` (required for post-payment user/order/enrollment)
     - `checkout.session.completed` (if you use Stripe Checkout for subscriptions)
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `customer.subscription.trial_will_end`
     - `customer.updated`
   - Or use **Receive all events** if you prefer (the handler ignores unknown types).

4. **Create and copy the signing secret**
   - Click **Add endpoint**.
   - Open the new webhook → **Signing secret** → **Reveal** → **Copy**.

5. **Set the secret in your app**
   - **Production:** Set `STRIPE_WEBHOOK_SECRET` in your hosting env (Vercel, etc.) to the value you copied.
   - **Local:** Put the same value in `.env.local` as `STRIPE_WEBHOOK_SECRET` (you already have a placeholder; replace it with the secret from the endpoint you use for local testing).

## Local testing with Stripe CLI

1. Install [Stripe CLI](https://stripe.com/docs/stripe-cli).
2. Log in: `stripe login`.
3. Forward events to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. The CLI prints a **webhook signing secret** (e.g. `whsec_...`). Set that as `STRIPE_WEBHOOK_SECRET` in `.env.local`.
5. Trigger a test payment or use `stripe trigger payment_intent.succeeded` to test.

## Verify

- In Stripe Dashboard → **Developers** → **Webhooks** → your endpoint, check **Recent deliveries**.
- After a successful payment, you should see `payment_intent.succeeded` with response 200.
- If you get 400 "Invalid signature", the signing secret in your app does not match the endpoint (or you’re using the wrong endpoint’s secret).
