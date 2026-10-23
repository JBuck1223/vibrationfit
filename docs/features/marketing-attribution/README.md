# Marketing Attribution & Meta Signal System

**Last Updated:** October 21, 2026
**Status:** Active

The full pipeline from ad click to revenue: first-party attribution (visitors → sessions → customers waterfall), engagement signals (video milestones + page engagement), and server-side conversion mirroring to Meta CAPI / GA4 / TikTok / Google Ads with event deduplication.

## Architecture

```
Ad click (fbclid, gclid, UTMs, Google Ads kw/mt/ag/cr/dev)
  └─ TrackingProvider → initTracking() → /api/tracking/session
       ├─ visitors (first-touch UTMs, click IDs, first_fbp/first_fbc, first_ppc_*)
       └─ sessions (per-visit UTMs, click IDs, fbp/fbc, ppc_*)

On-page engagement
  ├─ PageEngagementTracker (PUBLIC pages only)
  │    threshold: 15s active dwell OR 50% scroll → PageEngaged
  └─ Video component / HeroPreviewVideo
       video_start → VideoStarted
       25/50/75/95% → VideoWatched25/50/75/95
       ended → VideoCompleted

Every engagement event:
  1. Browser pixel fires with eventID (fbq trackCustom)
  2. POST /api/tracking/events → engagement_events row (same event_id)
  3. Server mirrors to Meta CAPI + GA4 MP with that event_id → Meta dedups

Conversions
  ├─ Lead:            /api/leads, /api/activation/start → CAPI + Google Ads upload
  │                    (click IDs + fbp/fbc enriched; activation event_id = activation id)
  ├─ InitiateCheckout: /api/cart → CAPI, event_id = cartId (browser pairs it)
  └─ Purchase:        Stripe webhook / PayPal fulfillment → CAPI + Google Ads upload,
                       event_id = payment intent id (PayPal: order id)
                       (browser fires the same id on /checkout/success)

Reporting
  └─ /admin/crm/marketing → get_marketing_performance(start, end)
       first-touch visitor cohorts → engagement → leads → revenue → ROAS
```

## Event taxonomy (Meta)

| Event | Type | Fired when | Use for |
|---|---|---|---|
| PageView | standard | every page (pixel) | baseline |
| PageEngaged | custom | 15s active dwell or 50% scroll on a public page | engaged-visitor audiences |
| VideoStarted | custom | intentional video play | top-of-funnel audience |
| VideoWatched25/50/75/95 | custom | milestone reached | tiered retargeting audiences |
| VideoCompleted | custom | video ended | hottest video audience |
| Lead | standard | lead form submitted | lead optimization |
| InitiateCheckout | standard | cart created | abandonment retargeting |
| Purchase | standard | payment succeeded | value optimization / ROAS |

All events fire browser + server with a shared event ID, so Meta counts each once while surviving ad blockers and iOS.

Distinct names per milestone are deliberate: Custom Audiences can be built directly from an event name without parameter filtering.

## Key tables

| Table | Role |
|---|---|
| `visitors` | First-touch SSOT: UTMs, click IDs, `first_fbp`, `first_fbc`, `first_ppc_*` |
| `sessions` | Per-visit attribution incl. `fbp`, `fbc`, `ppc_*` |
| `engagement_events` | Every video milestone / page engagement, with the dedup `event_id` |
| `page_views` | `time_on_page_seconds` now populated by the page-engagement exit beacon |
| `customers` | Attribution waterfalled from visitor at purchase |
| `marketing_campaigns` | Enter `total_spent` per campaign (matched by `utm_campaign`) to get ROAS/CPA on the dashboard |

## Key files

| File | Role |
|---|---|
| `src/lib/tracking/client.ts` | Visitor/session cookies, `getFbp()`/`getFbc()` |
| `src/lib/tracking/engagement.ts` | Client engagement reporter (pixel + beacon, shared event ID) |
| `src/lib/tracking/pixels.ts` | Browser pixel events (Meta/GA4/TikTok/Google Ads) |
| `src/lib/tracking/server-conversions.ts` | Meta CAPI / GA4 MP / TikTok / Google Ads offline upload |
| `src/components/PageEngagementTracker.tsx` | Dwell + scroll measurement on public pages |
| `src/app/api/tracking/events/route.ts` | Engagement ingestion + CAPI mirroring |
| `src/app/api/tracking/session/route.ts` | Visitor/session upserts |
| `src/app/admin/crm/marketing/page.tsx` | Ad Performance dashboard |
| `docs/features/marketing-attribution/META_CAMPAIGN_PLAYBOOK.md` | Campaign structure, audiences, UTM conventions |

## Environment variables

| Variable | Side | Purpose |
|---|---|---|
| `NEXT_PUBLIC_META_PIXEL_ID` | browser + server fallback | Meta Pixel |
| `META_PIXEL_ID` | server (optional, defaults to public var) | CAPI pixel ID |
| `META_CONVERSIONS_API_TOKEN` | server | CAPI access token (required for server events) |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | browser + server fallback | GA4 |
| `GA4_API_SECRET` | server | GA4 Measurement Protocol |
| `NEXT_PUBLIC_TIKTOK_PIXEL_ID` / `TIKTOK_ACCESS_TOKEN` | browser / server | TikTok |
| `NEXT_PUBLIC_GOOGLE_ADS_ID` | browser | Google Ads tag (`AW-XXXXXXXXX`) |
| `NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL` | browser | Lead conversion label (optional) |
| `NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL` | browser | Purchase conversion label (optional; falls back to legacy `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL`) |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | server | Google Ads API developer token |
| `GOOGLE_ADS_CLIENT_ID` / `GOOGLE_ADS_CLIENT_SECRET` | server | OAuth client for the Google Ads API |
| `GOOGLE_ADS_REFRESH_TOKEN` | server | OAuth refresh token (scope `https://www.googleapis.com/auth/adwords`) |
| `GOOGLE_ADS_CUSTOMER_ID` | server | Ads account that owns the conversion actions (dashes optional) |
| `GOOGLE_ADS_LOGIN_CUSTOMER_ID` | server (optional) | Manager (MCC) account ID when access is through a manager |
| `GOOGLE_ADS_LEAD_CONVERSION_ACTION_ID` / `GOOGLE_ADS_PURCHASE_CONVERSION_ACTION_ID` | server | Numeric IDs of the "Import → Clicks" conversion actions |
| `GOOGLE_ADS_API_VERSION` | server (optional) | Defaults to `v24`; bump before Google sunsets it |

Server IDs fall back to the `NEXT_PUBLIC_*` values, so a single pixel ID entry configures both sides and they can never drift apart.

## Google Ads

### Keyword capture

Search ads use this Final URL suffix:

```
kw={keyword}&mt={matchtype}&ag={adgroupid}&cr={creative}&dev={device}&utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_term={keyword}
```

`/api/tracking/session` stores `kw/mt/ag/cr/dev` on `sessions.ppc_keyword / ppc_match_type / ppc_ad_group_id / ppc_creative_id / ppc_device`, and first-touch on `visitors.first_ppc_*`. Google adds `gclid` (auto-tagging must stay on). For a returning visitor whose first visit was organic, the first paid click backfills `first_gclid` and `first_ppc_*` (offline uploads match on gclid, so it can't stay empty). Migration: `20261021170000_ppc_keyword_attribution.sql`.

### Browser conversions

`trackConversion('lead' | 'purchase')` fires `gtag('event', 'conversion', { send_to: AW-ID/label, transaction_id })` when the matching label is set. `transaction_id` is the same event ID Meta dedups on (activation id, lead id, or payment intent id). When the email is known (activation, demo, contact and assessment forms), `gtag('set', 'user_data', { email })` sends it for enhanced conversions (gtag hashes it). `/checkout/success` doesn't know the email, so purchases rely on the server upload for that. Turn on "Enhanced conversions" in the conversion action settings as well.

Every `lead` event fires the Lead conversion, matching Meta: Free Activation start, demo, contact and assessment.

### Server offline click conversions

`sendServerConversion()` also calls the Google Ads API `customers/{id}:uploadClickConversions` for `lead` and `purchase` when the visitor has a `first_gclid`:

- `orderId` = event ID (payment intent id / activation id / lead id / PayPal order id). Google dedups on it, so the Stripe `checkout.session.completed` and `payment_intent.succeeded` paths count once.
- `conversionValue` + `currencyCode` for purchases; hashed email as a user identifier.
- `partialFailure: true`. Rejected rows (expired gclid older than 90 days, click from another account) are logged as `[Google Ads] Conversion rejected`, never thrown.
- Skips silently when any credential, the action ID, or the gclid is missing.

**Avoid double counting:** the browser tag and the upload must be **different** conversion actions (Website vs Import → Clicks). Make one of each pair Primary (counts toward bidding) and the other Secondary. The upload is the more complete signal (no ad blockers or cookie loss), so the usual setup is the uploaded action as Primary and the tag as Secondary for real-time checks.

## Attribution model

First-touch. A visitor's first UTMs and click IDs are frozen on the `visitors` row, waterfalled onto `customers` at purchase, and the Ad Performance dashboard credits all downstream engagement/leads/revenue to that first touch. Last-touch UTMs are also stored on `visitors` (`last_utm_*`) and each session carries its own attribution for deeper analysis.

## Verifying events

1. Meta Events Manager → Test Events → browse the site with `?fbclid=test`: PageView, PageEngaged, VideoWatched events should appear from both Browser and Server with "Deduplicated" status.
2. `SELECT event_name, milestone_percent, engaged, count(*) FROM engagement_events GROUP BY 1,2,3 ORDER BY 1;`
3. `/admin/crm/marketing` should show funnel numbers within a minute of traffic arriving.
4. Google Ads: visit a landing page with `?gclid=test&kw=test+keyword&mt=e` and check the new `sessions` row has `ppc_keyword`. Tag Assistant should show the `conversion` hit with `transaction_id` on lead/purchase. Uploaded conversions appear under Goals → Conversions → Uploads (about 3 hours later); upload errors show in the server logs as `[Google Ads]`.
