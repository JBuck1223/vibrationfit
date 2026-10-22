#!/usr/bin/env tsx
/**
 * Seed the system themes with generated images.
 *
 * Usage:
 *   npx tsx scripts/themes/seed-themes.ts                 # every theme, only missing slots
 *   npx tsx scripts/themes/seed-themes.ts beach           # one theme
 *   npx tsx scripts/themes/seed-themes.ts beach --force   # regenerate every slot
 *   npx tsx scripts/themes/seed-themes.ts --dry-run       # print prompts, generate nothing
 *   npx tsx scripts/themes/seed-themes.ts --force --slots=hero   # only slots containing "hero"
 *
 * For each theme and slot it generates one image with fal.ai (nano-banana, the
 * same model the app uses), uploads it to S3 under site-assets/themes/{slug}/,
 * and inserts a theme_images row. Re-running fills only what is missing.
 *
 * Requires in .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 * FAL_KEY, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY (and AWS_REGION).
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { fal } from '@fal-ai/client'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { trimLetterbox } from './letterbox'
import { ALL_SLOTS, IMAGELESS_THEMES, THEME_WORLDS, buildSlotPrompt, slotDimension, type ThemeSlot } from '../../src/lib/app-shell/theme-slots'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const FAL_KEY = process.env.FAL_KEY
const BUCKET = 'vibration-fit-client-storage'
const CDN = 'https://media.vibrationfit.com'
const FAL_MODEL = process.env.THEME_IMAGE_MODEL || 'fal-ai/nano-banana'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const force = args.includes('--force')
const onlySlug = args.find((a) => !a.startsWith('--'))
const slotFilter = args.find((a) => a.startsWith('--slots='))?.slice('--slots='.length) ?? null

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
if (!dryRun && !FAL_KEY) {
  console.error('Missing FAL_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

async function generate(prompt: string, slot: ThemeSlot): Promise<{ bytes: Buffer; width?: number; height?: number }> {
  fal.config({ credentials: FAL_KEY })
  const aspect = slotDimension(slot) === 'square' ? '1:1' : '16:9'
  const result = await fal.subscribe(FAL_MODEL, {
    input: { prompt, aspect_ratio: aspect, num_images: 1, output_format: 'png' },
    logs: false,
  })
  const data = (result as any)?.data ?? result
  const image = data?.images?.[0]
  if (!image?.url) throw new Error('fal returned no image')
  const res = await fetch(image.url)
  if (!res.ok) throw new Error(`download failed: ${res.status}`)
  return { bytes: Buffer.from(await res.arrayBuffer()), width: image.width, height: image.height }
}

async function upload(slug: string, slot: ThemeSlot, bytes: Buffer): Promise<{ key: string; url: string }> {
  const key = `site-assets/themes/${slug}/${slot.replace('.', '-')}-${Date.now()}.png`
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: bytes,
      ContentType: 'image/png',
      CacheControl: 'max-age=31536000',
    }),
  )
  return { key, url: `${CDN}/${key}` }
}

async function main() {
  const { data: themes, error } = await supabase
    .from('themes')
    .select('id, slug, name')
    .eq('kind', 'system')
    .order('sort_order')
  if (error) throw error

  const targets = (themes ?? []).filter((t) => !onlySlug || t.slug === onlySlug)
  if (targets.length === 0) {
    console.error(onlySlug ? `No system theme with slug "${onlySlug}"` : 'No system themes found; run the migration first')
    process.exit(1)
  }

  for (const theme of targets) {
    if ((IMAGELESS_THEMES as readonly string[]).includes(theme.slug)) continue
    if (!THEME_WORLDS[theme.slug]) {
      console.warn(`Skipping ${theme.slug}: no world description in THEME_WORLDS`)
      continue
    }
    const { data: existing } = await supabase.from('theme_images').select('id, slot').eq('theme_id', theme.id)
    const have = new Set((existing ?? []).map((r) => r.slot))

    console.log(`\n== ${theme.name} (${theme.slug}) ==`)
    for (const slot of ALL_SLOTS) {
      if (slotFilter && !slot.includes(slotFilter)) continue
      if (have.has(slot) && !force) {
        console.log(`  ${slot}: exists, skipping`)
        continue
      }
      const prompt = buildSlotPrompt(theme.slug, slot)
      if (dryRun) {
        console.log(`  ${slot}: ${prompt}`)
        continue
      }
      try {
        process.stdout.write(`  ${slot}: generating... `)
        const generated = await generate(prompt, slot)
        const trimmed = await trimLetterbox(generated.bytes)
        const bytes = trimmed.buffer
        const width = generated.width
        const height = generated.height ? generated.height - trimmed.top - trimmed.bottom : undefined
        const { key, url } = await upload(theme.slug, slot, bytes)
        if (force && have.has(slot)) {
          await supabase.from('theme_images').delete().eq('theme_id', theme.id).eq('slot', slot)
        }
        const { error: insertError } = await supabase.from('theme_images').insert({
          theme_id: theme.id,
          slot,
          image_url: url,
          s3_key: key,
          prompt,
          width: width ?? null,
          height: height ?? null,
        })
        if (insertError) throw insertError
        console.log('done')
      } catch (err) {
        console.log('FAILED')
        console.error(`    ${(err as Error).message}`)
      }
    }
  }
  console.log('\nSeed complete.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
