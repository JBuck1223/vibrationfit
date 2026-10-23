# Google Ads build (generated)

These CSVs are generated from the SEO page registry in `src/content/seo/`, so every ad group's keywords, ads and final URL match its landing page. **Don't edit the CSVs by hand.** Change the page config (`ppc` block), then regenerate:

```bash
npx tsx scripts/seo/generate-google-ads.ts
```

The script also checks Google's limits (30-character headlines, 90-character descriptions). It exits non-zero if any ad text is too long.

## Import into Google Ads Editor

Import these files in order: `campaigns.csv` → `ad-groups.csv` → `keywords.csv` → `ads.csv` → `negatives.csv`. Use Account → Import → From file for each one.

Campaigns import **Paused**. Only enable ad groups whose `Landing Page Status` is `published`. Draft pages are noindex until founder review.

## Account-level setting: Final URL suffix

Set this once, at account level:

```
kw={keyword}&mt={matchtype}&ag={adgroupid}&cr={creative}&dev={device}&utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_term={keyword}
```

`kw` is what triggers the keyword-matched landing page. `src/proxy.ts` checks it against the page's `ppc.keywords` allowlist and, on a match, serves the pre-rendered variant at `/<page>/k/<keyword-slug>`. The variant's H1, subhead and CTA say the exact keyword that won the auction. A keyword that isn't on the allowlist falls back to the normal page.

## How the match works (Quality Score)

| Layer | Source |
|---|---|
| Keyword | `ppc.keywords` (exported as both exact and phrase match) |
| Ad | Headline 1 is pinned as `{KeyWord:<defaultHeadline>}`; headlines 2–15 and the descriptions come from `ppc.headlines` and `ppc.descriptions` |
| Landing page | The variant H1 is the keyword (or `ppc.overrides[keyword].h1`); the subhead comes from `ppc.subTemplate` |

## Bidding

Start every campaign on Maximize Clicks with a max CPC of `ppc.maxCpc`. Move to Maximize Conversions after about 30 Free Activation conversions in 30 days. Then move to Target CPA.
