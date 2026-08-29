# Meta Campaign Playbook (Facebook + Instagram)

**Last Updated:** August 29, 2026
**Status:** Active

How to run the launch structure on top of the attribution system. Companion to `README.md` in this folder (the technical reference).

## Prerequisites (one-time, in Meta Business Suite / Events Manager)

1. Pixel installed (already live via `NEXT_PUBLIC_META_PIXEL_ID`) and Conversions API token set (`META_CONVERSIONS_API_TOKEN`).
2. Verify the domain (vibrationfit.com) in Business Settings → Brand Safety.
3. In Events Manager → Test Events, confirm these arrive from both Browser and Server with dedup: `PageView`, `PageEngaged`, `VideoWatched25/50/75/95`, `Lead`, `InitiateCheckout`, `Purchase`.

## Custom Audiences to create (Events Manager → Audiences)

| Audience | Definition | Retention | Purpose |
|---|---|---|---|
| Engaged Visitors 30d | Website: `PageEngaged` | 30 days | warm retargeting |
| Video 25 180d | Website: `VideoWatched25` | 180 days | light interest |
| Video 50 180d | Website: `VideoWatched50` | 180 days | medium interest |
| Video 75 180d | Website: `VideoWatched75` | 180 days | high intent |
| Video 95 180d | Website: `VideoWatched95` | 180 days | hottest video viewers |
| Checkout Abandoners 14d | `InitiateCheckout` minus `Purchase` | 14 days | recovery |
| Leads 90d | `Lead` | 90 days | nurture |
| Purchasers 180d | `Purchase` | 180 days | exclusion + lookalike seed |
| IG Engagers 90d | Instagram account engagement | 90 days | follower growth retargeting |
| FB Engagers 90d | Facebook Page engagement | 90 days | follower growth retargeting |

Lookalikes (once ~100+ events exist): 1% LAL of Video 75, 1% LAL of Leads, 1% LAL of Purchasers.

## Campaign structure

### Campaign 1 — Homepage Traffic (cold)

- **Objective:** Traffic → landing page views (switch to Leads or Sales objective once Purchase volume supports it — Meta needs ~50 conversion events/week to optimize).
- **Audience:** broad or interest stacks; EXCLUDE Purchasers 180d.
- **Destination:** homepage with UTM template (below).
- **What feeds back to Meta automatically:** PageEngaged + all four video milestones + Lead + InitiateCheckout + Purchase — so even a Traffic campaign trains the pixel on quality, not just clicks.

### Campaign 2 — Warm Retargeting (sales)

- **Objective:** Sales (Purchase).
- **Ad sets by heat tier, budget weighted to the hottest:**
  - Video 75 + Video 95 + Checkout Abandoners (hottest)
  - Video 25/50 + Engaged Visitors 30d
  - Leads 90d
- **Creative:** customer testimonials; Jordan & Vanessa on camera sharing real member actualizations (Vibe Tribe wins). Always exclude Purchasers 180d.

### Campaign 3 — Social Presence Growth (followers)

- **Objective:** Engagement (page likes / IG profile visits).
- **Audience:** IG Engagers 90d + FB Engagers 90d + Engaged Visitors 30d + Video 25+ tiers — people who already met the brand.
- **Creative:** testimonial clips and member-win conversations; end cards inviting the follow.

## UTM conventions

Build links in `/admin/crm/utm-builder` (or `/go/` short links, which pass UTMs through).

```
https://vibrationfit.com/?utm_source=facebook&utm_medium=paid&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}
```

- `utm_source`: `facebook` or `instagram` (Meta's `{{site_source_name}}` placeholder also works)
- `utm_medium`: `paid` (organic posts: `social`; DMs: `dm`; bio links: `bio`)
- `utm_campaign`: mirror the Meta campaign name, kebab-case
- `utm_content`: the ad/creative — this is the "creator" field in the attribution admin (e.g. `vanessa-testimonial-01`)
- `utm_term`: the ad set / audience

Meta's dynamic placeholders (`{{campaign.name}}`, `{{adset.name}}`, `{{ad.name}}`) fill these automatically when set in the ad's Tracking → URL parameters, so every ad self-labels.

## Reading results

1. **`/admin/crm/marketing` (Ad Performance):** the full funnel per campaign — visitors → engaged → video tiers → leads → purchases → revenue, with ROAS/CPA when spend is entered.
2. **Spend entry:** create the campaign in `/admin/crm/campaigns` with the matching `utm_campaign` and keep `total_spent` updated. That's what powers ROAS/CPA. (Automated spend sync via the Marketing API is a future upgrade.)
3. **`/admin/crm/attribution`:** individual visitor journeys, session timelines, click-ID badges.
4. Meta's own reporting will disagree with first-party numbers (view-through attribution, modeled conversions). Treat the VibrationFit dashboard as the source of truth for money decisions and Meta's columns as directional.

## Weekly rhythm

- Check Ad Performance: kill ad sets with engaged-rate < ~25% of visitors or zero video-50 after meaningful spend.
- Feed winners: creative whose Video-75 rate is high gets budget and gets cloned into the retargeting campaigns.
- Refresh testimonial creative every 2–3 weeks for the retargeting audiences (small pools burn out fast).
