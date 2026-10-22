#!/usr/bin/env tsx
/**
 * Generate the fixed cover art for each Life Vision mix type (Voice Only,
 * Power, Meditation, Sleep, Your Voice). These never change with the theme,
 * so a member always recognizes their Sleep mix by the same picture.
 *
 * Usage:
 *   npx tsx scripts/audio/mix-covers.ts              # every type
 *   npx tsx scripts/audio/mix-covers.ts sleep power  # only these
 *   npx tsx scripts/audio/mix-covers.ts --version=v2 # new keys (CDN caches a year)
 *
 * Writes local previews to the path in MIX_COVER_OUT (default ./tmp-mix-covers)
 * and uploads to S3 at site-assets/audio/mix-covers/{type}-{version}.jpg.
 * Paste the printed URLs into src/lib/audio/mix-covers.ts.
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import * as fs from 'fs'
import * as path from 'path'
import { execFileSync } from 'child_process'
import sharp from 'sharp'
import { fal } from '@fal-ai/client'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { trimLetterbox } from '../themes/letterbox'

const BUCKET = 'vibration-fit-client-storage'
const CDN = 'https://media.vibrationfit.com'
const FAL_MODEL = process.env.THEME_IMAGE_MODEL || 'fal-ai/nano-banana'

const STYLE =
  'Cinematic square album cover photograph. Pure natural landscape only: no buildings, structures, boats, roads, people or animals. ' +
  'No text, letters, logos or borders. Full-bleed frame edge to edge: no letterboxing. Serene, premium, slightly dreamy, rich color, soft film grain, deep shadows.'

const COVERS: Record<string, string> = {
  'voice-only': 'Clear early-morning light over a perfectly calm alpine lake, crisp air, soft blue and silver tones with a hint of violet, focused and clear.',
  power: 'The sun bursting over a dramatic mountain ridge at sunrise, rays of gold and electric light across the sky, bold, energizing and expansive.',
  meditation: 'A mirror-still lake at twilight reflecting lavender and violet clouds, perfect symmetry, deep calm, a faint glow on the horizon.',
  sleep: 'A quiet moonlit night over gentle sand dunes beneath a deep indigo sky full of soft stars, a calm crescent moon, restful and hushed.',
  personal: 'Warm golden-hour light across a soft wildflower meadow with gentle rolling hills, intimate, tender and glowing.',
}

const args = process.argv.slice(2)
const version = args.find((a) => a.startsWith('--version='))?.slice('--version='.length) ?? 'v1'
const only = args.filter((a) => !a.startsWith('--'))
const outDir = process.env.MIX_COVER_OUT || path.resolve('tmp-mix-covers')

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID!, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY! },
})

async function main() {
  fal.config({ credentials: process.env.FAL_KEY })
  fs.mkdirSync(outDir, { recursive: true })
  const types = only.length ? only : Object.keys(COVERS)
  for (const type of types) {
    const prompt = `${COVERS[type]} ${STYLE}`
    const result = await fal.subscribe(FAL_MODEL, {
      input: { prompt, aspect_ratio: '1:1', num_images: 1, output_format: 'png' },
      logs: false,
    })
    const url = ((result as any)?.data ?? result)?.images?.[0]?.url
    if (!url) throw new Error(`no image for ${type}`)
    // fal's CDN rejects Node's fetch user agent; curl works.
    const raw = execFileSync('curl', ['-sSL', url], { maxBuffer: 64 * 1024 * 1024 })
    const { buffer: trimmed } = await trimLetterbox(raw)
    const jpg = await sharp(trimmed).resize(900, 900, { fit: 'cover' }).jpeg({ quality: 84, mozjpeg: true }).toBuffer()
    fs.writeFileSync(path.join(outDir, `${type}.jpg`), jpg)
    const key = `site-assets/audio/mix-covers/${type}-${version}.jpg`
    await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: jpg, ContentType: 'image/jpeg', CacheControl: 'max-age=31536000' }))
    console.log(`${type}: ${CDN}/${key}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
