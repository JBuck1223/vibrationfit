# Vibration Fit Partners

**Last Updated:** October 18, 2026
**Status:** Phase 1 (ledger) live in shadow mode — credits recorded, not applied; nothing paid out

How the referral and sponsored-partner program maps onto the existing billing system. Build order follows the spec: ledger first, dashboards are views of it.

Migration: `supabase/migrations/20261018120000_partners_ledger.sql` (applied October 18, 2026).
Code: `src/lib/partners/` (`math.ts` + tests, `attribution.ts`, `costs.ts`, `ledger.ts`, `daily.ts`, `settings.ts`), daily cron `src/app/api/cron/partners/route.ts`.

## Shadow mode

`partner_program_settings.credits_live = false`. While it is off:

- Referral credits are computed before every renewal and recorded as `referral_credit` entries with status `void` / `shadow_mode`. The member is charged the full bill.
- Referral commissions, holds, reversals, and profit snapshots are written exactly as they will be live. Nothing pays out because payouts (phase 3) don't exist yet.

To go live with credits, set `credits_live = true`. Billing is PayPal-only, so legacy Stripe subscriptions are not processed by the ledger.

### Where it is wired

| Event | Code |
|---|---|
| Lead signup with a referral code | `/api/leads`: `referrals` row `signed_up` |
| First membership payment (PayPal checkout) | `fulfillPayPalPurchase`: attribution, then a `payment_history` row (it used to be `orders` only), then `processPaymentEvent` |
| Renewal | `/api/cron/billing`: `referralCreditFor` before the charge, payment details on `payment_history`, then `processPaymentEvent` |
| Failed renewal / past due / cancel at period end | `/api/cron/billing`: referral `failed_payment` / `paused` / `cancelled` |
| Refund (dashboard or API) | PayPal webhook `PAYMENT.CAPTURE.REFUNDED`: `reversePayment` (deduped per refund id) |
| Chargeback | PayPal webhook `CUSTOMER.DISPUTE.CREATED`: `reversePayment` and an admin notification. `RESOLVED` sends a notification only. |
| Hold release, cost finalization | `/api/cron/partners` daily at 08:00 UTC |

**PayPal dashboard:** subscribe the webhook to `CUSTOMER.DISPUTE.CREATED` and `CUSTOMER.DISPUTE.RESOLVED`, or chargebacks are never seen.

**Backfill:** 14 referrals were inserted from past `paid_conversion` events (`scripts/archive/backfill-partner-referrals.ts`). 3 are active, all under the founder code `jordan` (internal, earns nothing); the other 11 are cancelled.

---

## 1. Program rules (settled)

**Membership.** Vibration Fit is membership-only: $99 billed every 28 days (not monthly; say so at checkout and in renewal terms). Commissions and credits are worked out from what was actually collected, so a future higher tier needs no ledger changes.

**Who can earn.** Only active, paying members. The referrer must hold an active paid membership when the referred member's payment clears, or that payment earns them nothing (recorded as `void`, reason `referrer_not_member`, so it is visible). Founder and staff codes (`is_internal`) are attributed and reported but never earn.

**Referral credit (referrals 1–3).** Each active referral takes $33 off the referrer's next bill, up to three ($99):

| Active referrals | Bill |
|---|---|
| 0 | $99 |
| 1 | $66 |
| 2 | $33 |
| 3+ | $0 (free cycle) |

Recalculated at every one of the referrer's billing events. If a referral goes inactive, that $33 comes off the credit. If one becomes active, it goes back on.

**Cash commission (referral 4 onward).** 20% of net collected revenue on the whole bill, including household seats. That's $19.80 per $99 cycle, recurring with no cap. Among a referrer's currently active referrals, the three earliest by `activated_at` fill the credit slots and the rest earn cash. So if an early referral churns, the next one moves into its credit slot. The referrer's total stays whole, and nothing is ever paid twice.

**Attribution.** One referrer per customer, the first verified one wins, and it lasts for life unless fraud is confirmed. It requires a link, a code, or an admin-approved event. No self-referrals, duplicate accounts, or second level.

**Holds and payouts.** Commissions are held 30 days past payment (the refund window), then approved. Payouts are monthly with a $25 minimum, through PayPal Payouts, and need a W-9 for US partners.

**Profit floor.** $40 contribution profit per member per cycle, after every cost (§5). Below the floor, the commission is `held`, never deleted. An admin approves, reduces, or releases it.

## 2. What already exists

| Need | Existing piece | Notes |
|---|---|---|
| Recurring billing | `src/app/api/cron/billing/route.ts` | The database is the billing engine. A daily cron charges the member's saved PayPal card for `customer_subscriptions.amount_cents` every `billing_interval_days`. A $0 renewal already runs as a free cycle. |
| Payment record | `payment_history` | One `succeeded` row per charge. First payments come through `src/lib/billing/fulfillment.ts`. |
| Refunds | `PAYMENT.CAPTURE.REFUNDED` in `src/app/api/paypal/webhook/route.ts`, `src/app/api/admin/refund/route.ts` | Updates `orders` only. Renewal refunds never reach `payment_history`. |
| Chargebacks | none | No `CUSTOMER.DISPUTE.*` handling. |
| Partner identity | `referral_participants`, `referral_events`, `referral_code_history` | Every member is auto-enrolled. Reused as the partner record. |
| Per-member usage cost | `token_usage` (`provider`, `actual_cost_cents` / `calculated_cost_cents`) | VIVA (`vercel_gateway`), music (`mureka`), images (`fal`, `openai`), voice (`elevenlabs`). Reconciled against vendor billing. |
| Platform cost | `provider_costs_daily` via `src/lib/billing/sync-infra-costs.ts` and `sync-provider-costs.ts` | AWS (Cost Explorer), Vercel, Supabase (configured monthly), plus vendor totals. |
| Payouts | `src/lib/paypal/client.ts` | Same credentials work for the Payouts API once Payouts is enabled on the business account. |

## 3. Data model

All of this is in the draft migration. Writes are service-role only. Members and partners read their own rows; admins read everything.

- **`partner_program_settings`**: one row holding the 20% rate, credit slots (3) × $33, the $40 floor, max commission %, minimum referral age, the 30-day hold, the $25 payout minimum, the sponsored cash share, the processing-fee fallback, and support cost.
- **`referral_participants`** (extended): `partner_level`, terms acceptance, `is_suspended`, `is_internal` (set for `jordan`, `jordanb`, `vanessa`).
- **`referrals`**: one row per referred customer. Unique on user and email (one referrer per customer). Has `source` (organic / paid influencer audience / broad paid creative / admin approved), the spec's statuses, and `activated_at` for credit-slot ranking.
- **`commission_ledger`**: append-only. Entry types are `referral_commission`, `referral_credit`, `adjustment`, `reversal`. Every accrual is tied to one `payment_history` row and is unique per payment + type + beneficiary, so re-running a payment is safe. Status moves `pending → approved → paid`, or `held` / `void`. Corrections are new rows.
- **`payment_history`** (extended): list price, discount, referral credit, tax, PayPal fee, refunded, chargeback, tier, cycle dates.
- **`profit_snapshots`**: one per collected payment, with every cost line and a per-provider `cost_breakdown`. `costs_final` flips after the cycle ends.
- **`sponsored_campaigns`** / **`ad_recovery_ledger`** / view **`sponsored_campaign_balances`**.
- **`partner_payout_accounts`** / **`partner_payouts`**.

## 4. Billing-event workflow

All of this lives in one domain module, `src/lib/partners/`, called from every place money moves.

### Before each renewal charge: `referralCreditFor(subscription)`

1. Find the referrer's participant row. Skip if `is_internal` or suspended.
2. Count their `referrals` with `status = active`: `credit = min(active, credit_slots) × credit_per_referral_cents`, capped at the bill.
3. Charge `amount_cents − credit`. If that is $0, the existing free-cycle path runs.
4. Record `payment_history.referral_credit_cents` and a `referral_credit` ledger entry.

### On every successful charge: `processPaymentEvent(paymentHistoryId)`

This is called from the billing cron (after the `payment_history` insert) and from `fulfillment.ts` (first payment).

1. Confirm `succeeded` and amount > 0. Free cycles stop here.
2. Net collected = amount − discount − tax. Refunds and chargebacks arrive later as reversals.
3. Load the tier and the member's `referrals` row.
4. **Referral commission.** Check the referrer: is it internal? Is it an active member right now? Is the referral older than `minimum_referral_age_days`? Then rank this referral among the referrer's active referrals. If it is outside the first three: `net × 20%`. If the referrer isn't a member: a `void` row with the reason.
5. **Sponsored**: if the referral came from a paid source, split the commission 50% cash and 50% into the campaign's ad recovery ledger. Once the recovery balance is zero, 100% goes to cash.
6. Write a provisional `profit_snapshots` row (§5).
7. If projected contribution is below $40, or total commissions exceed the maximum commission %: entries go to `held` with the reason. Otherwise `pending` with `hold_until = paid_at + 30 days`.
8. Update the referral status and invalidate dashboards (Realtime on `commission_ledger` and `referrals`).

### Referral status transitions

| Event | Hook | `referrals.status` |
|---|---|---|
| Link click | `/api/referral/track` | `clicked` (only if no row exists yet) |
| Lead / account created | `/api/leads`, auth trigger | `signed_up` |
| Checkout started | PayPal create-order | `payment_pending` |
| Payment succeeds | `processPaymentEvent` | `active` (+ `first_paid_at`, `activated_at` once) |
| Renewal fails | `recordFailure` in billing cron | `failed_payment` |
| Past due (3 fails) | `markPastDue` | `paused` |
| Member cancels | cancel flow / cron close | `cancelled` |
| Refund | refund webhook + admin refund | `refunded` |
| Dispute | new `CUSTOMER.DISPUTE.CREATED` handler | `chargeback` |
| Admin confirms fraud | admin action | `fraud` (all unpaid entries `void`) |

### Refunds and chargebacks: `reversePayment(paymentHistoryId, cents, kind)`

Update `refunded_cents` / `chargeback_cents` on `payment_history`, recompute the snapshot, and write pro-rated `reversal` rows for every accrual on that payment. Already-paid amounts become a negative balance carried into the next payout.

### Daily cron

- Release: `pending` entries past `hold_until` with no refund or dispute become `approved`.
- Finalize snapshots: for cycles that ended, recompute with final usage and the reconciled vendor cost. Set `costs_final`. Re-check the floor on still-`pending` entries.

### Monthly payout cron

Group `approved` entries per beneficiary. Skip anyone under $25, without a payout account or W-9, or suspended. Create `draft` payouts. An admin approves the batch, the cron sends it with PayPal Payouts (`POST /v1/payments/payouts`), and the `PAYMENT.PAYOUTSBATCH.*` / `PAYMENT.PAYOUTS-ITEM.*` webhooks mark payouts and their entries `paid`, `failed`, or `returned`.

## 5. Contribution profit (all costs)

```text
net_collected      = charge − discount − tax − refunds − chargebacks
contribution       = net_collected
                   − referral_commission
                   − processing          (PayPal fee from the capture; fallback 3.49% + $0.49)
                   − usage_cost          (this member's token_usage in the cycle)
                   − shared_cost         (platform costs ÷ active paying members)
                   − support_cost        (setting; no tracking yet)
                   − ad_recovery         (sponsored only)
below_floor        = contribution < $40
```

**Usage cost.** The sum of `COALESCE(actual_cost_cents, calculated_cost_cents)` from `token_usage` for the member and their household seats, `cycle_start ≤ created_at < cycle_end`. Grouped by `provider`: VIVA (`vercel_gateway`), music (`mureka`), images (`fal`, `openai`), voice (`elevenlabs`). It is recorded in `cost_breakdown`.

**Shared cost.** For the same 28 days: AWS, Vercel, and Supabase from `provider_costs_daily`, plus AI spend with no member on it (`token_usage` rows with no `user_id` or `billable = false`, e.g. background jobs). Divided by the number of members who paid in that window.

**Timing.** Usage keeps accruing until the cycle ends, so the snapshot written at payment time projects from the member's previous cycle. It is finalized at cycle end. Holds always use the latest snapshot; the 30-day hold covers most of the cycle.

## 6. Existing referrals (backfill)

A read-only preview on October 18, 2026 (`temp/partners-backfill-preview.ts`):

- 14 `paid_conversion` events, 14 unique referred customers, 4 referral codes.
- 3 of the 4 codes are founders (`jordan`, `jordanb`, `vanessa`) and are flagged `is_internal`. The only outside referrer is `mistyb`.
- 4 referred customers are still active members. All 4 came in through founder codes.
- The other 10 are no longer members.
- Cost of backfilling: **$0 per cycle in credits and $0 in commissions.**

**Plan.** Create a `referrals` row for each of the 14 at their first verified event: `active` for the 4 current members, `cancelled` for the rest. `activated_at` is the original purchase date. Commissions start with each member's next payment, with no back pay.

## 7. Changes to existing code

1. **Billing cron.** Apply the referral credit before the charge. Record list price, discount, credit, tier, and cycle on `payment_history`. Call `processPaymentEvent` after success. Update referral status in `recordFailure` / `markPastDue`.
2. **`fulfillment.ts`.** Create the `referrals` row at first payment and call `processPaymentEvent`. Done. (Stripe is legacy; billing is PayPal-only.)
3. **PayPal webhook.**
   - On `PAYMENT.CAPTURE.REFUNDED`, also match `payment_history.paypal_capture_id`, then call `reversePayment`.
   - Handle `CUSTOMER.DISPUTE.CREATED` / `RESOLVED`.
   - Store `seller_receivable_breakdown.paypal_fee` from the capture.
4. **Admin refund route.** Call `reversePayment`.
5. **Referral join.** `/api/referral/join` lets anyone with an email join. Earning now requires a membership, so non-members can still get a link (attribution is recorded) but the page explains they earn once they're a member.
6. **Referral RLS.** The current policies let anyone insert `referral_events` and update `referral_invites` (`WITH CHECK (true)`), so clicks can be faked today. Move these writes to the service role before money depends on the data.
7. **Retire `referral_reward_tiers` / `referral_rewards_earned`.** The app no longer uses them. Drop them in a later migration once the ledger is live.
8. **Intensive leftovers.** The billing cron still has 2-pay intensive installment logic. Partners ignores `plan_category = 'intensive'`. Removing that code is a separate cleanup.

## 8. Build phases

1. **Ledger.**
   - Apply the migration and build `src/lib/partners/` (attribution, credit, `processPaymentEvent`, `reversePayment`, profit snapshots).
   - Add the billing cron, fulfillment, and webhook hooks, plus the daily cron and the backfill.
   - Write `node:test` tests for the money math, credit slots, and status transitions.
   - Run in **shadow mode** for one or two cycles: the ledger is written and credits are computed but not applied, nothing is paid. Reconcile it against PayPal.
2. **Member Partners page and widget.** Active referrals, progress to three, current credit, commission balance (pending / approved / paid), payout history, payout account + W-9, terms. Rename `/referral` to Partners.
3. **Payouts.** Monthly batch, admin approval, PayPal Payouts send + webhooks. Turn on live credits.
4. **Admin dashboards.** Revenue, referral conversion, referred retention, profit per member with cost breakdown, commission liability, holds queue (approve / reduce / release), refunds and chargebacks, payout exceptions.
5. **Sponsored partners.** Partner levels, campaigns, spend entry, ad recovery split, stop-loss.

## 9. Before launch (outside the code)

- Ask PayPal to enable Payouts on the business account (review takes days).
- Write partner terms with your lawyer: earnings disclosure, required disclosure in partners' posts, no medical or guaranteed-results claims, and the 28-day billing cadence.
- Confirm the 1099-NEC threshold and W-9 process with your accountant.
- Get a real number for support time per member, or leave it at $0 and accept that the floor is slightly optimistic.
