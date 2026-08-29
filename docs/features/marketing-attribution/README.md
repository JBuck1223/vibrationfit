# Marketing Attribution & Meta Signal System

**Last Updated:** August 29, 2026
**Status:** Active

The full pipeline from ad click to revenue: first-party attribution (visitors → sessions → customers waterfall), engagement signals (video milestones + page engagement), and server-side conversion mirroring to Meta CAPI / GA4 / TikTok with event deduplication.

## Architecture

```
Ad click (fbclid, UTMs)
  └─ TrackingProvider → initTracking() → /api/tracking/session
       ├─ visitors (first-touch UTMs, click IDs, first_fbp/first_fbc)
       └─ sessions (per-visit UTMs, click IDs, fbp/fbc)

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
  ├─ Lead:            /api/leads → CAPI Lead (click IDs + fbp/fbc enriched)
  ├─ InitiateCheckout: /api/cart → CAPI, event_id = cartId (browser pairs it)
  └─ Purchase:        Stripe webhook → CAPI, event_id = payment intent id
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
| `visitors` | First-touch SSOT: UTMs, click IDs, `first_fbp`, `first_fbc` |
| `sessions` | Per-visit attribution incl. `fbp`, `fbc` |
| `engagement_events` | Every video milestone / page engagement, with the dedup `event_id` |
| `page_views` | `time_on_page_seconds` now populated by the page-engagement exit beacon |
| `customers` | Attribution waterfalled from visitor at purchase |
| `marketing_campaigns` | Enter `total_spent` per campaign (matched by `utm_campaign`) to get ROAS/CPA on the dashboard |

## Key files

| File | Role |
|---|---|
| `src/lib/tracking/client.ts` | Visitor/session cookies, `getFbp()`/`getFbc()` |
| `src/lib/tracking/engagement.ts` | Client engagement reporter (pixel + beacon, shared event ID) |
| `src/lib/tracking/pixels.ts` | Browser pixel events (Meta/GA4/TikTok) |
| `src/lib/tracking/server-conversions.ts` | Meta CAPI / GA4 MP / TikTok server events |
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
| `NEXT_PUBLIC_GOOGLE_ADS_ID` / `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL` | browser | Google Ads purchase conversion |

Server IDs fall back to the `NEXT_PUBLIC_*` values, so a single pixel ID entry configures both sides and they can never drift apart.

## Attribution model

First-touch. A visitor's first UTMs and click IDs are frozen on the `visitors` row, waterfalled onto `customers` at purchase, and the Ad Performance dashboard credits all downstream engagement/leads/revenue to that first touch. Last-touch UTMs are also stored on `visitors` (`last_utm_*`) and each session carries its own attribution for deeper analysis.

## Verifying events

1. Meta Events Manager → Test Events → browse the site with `?fbclid=test`: PageView, PageEngaged, VideoWatched events should appear from both Browser and Server with "Deduplicated" status.
2. `SELECT event_name, milestone_percent, engaged, count(*) FROM engagement_events GROUP BY 1,2,3 ORDER BY 1;`
3. `/admin/crm/marketing` should show funnel numbers within a minute of traffic arriving.
