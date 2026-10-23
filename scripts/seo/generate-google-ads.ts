/**
 * Writes the Google Ads Editor import CSVs from the SEO page registry, so every
 * ad group's keywords, ads and final URL come from the same config as its
 * landing page. The same export is downloadable at /admin/seo/ads.
 *
 *   npx tsx scripts/seo/generate-google-ads.ts
 *
 * Output: docs/marketing/google-ads/{campaigns,ad-groups,keywords,ads,negatives}.csv
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildGoogleAdsExport, EXPORT_FILES } from '../../src/lib/seo/google-ads-export'

const OUT_DIR = join(__dirname, '../../docs/marketing/google-ads')

const { files, problems, counts } = buildGoogleAdsExport()

mkdirSync(OUT_DIR, { recursive: true })
for (const file of EXPORT_FILES) writeFileSync(join(OUT_DIR, `${file}.csv`), files[file])

console.log(`Wrote ${counts.campaigns} campaigns, ${counts.adGroups} ad groups, ${counts.keywords} keywords, ${counts.ads} ads, ${counts.negatives} negatives to ${OUT_DIR}`)
if (problems.length) {
  console.error(`\n${problems.length} ad text problem(s):\n- ${problems.join('\n- ')}`)
  process.exitCode = 1
}
