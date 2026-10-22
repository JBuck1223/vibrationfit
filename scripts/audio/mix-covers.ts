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
 *   npx tsx scripts/audio/mix-covers.ts --preview    # generate locally only, no upload
 *   npx tsx scripts/audio/mix-covers.ts --upload-only --version=v2  # upload approved previews
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
  'Premium square album cover art, cinematic and luminous, deep near-black violet background, soft volumetric light, subtle film grain. ' +
  'Abstract and symbolic: no landscapes, no scenery, no buildings, no people, no faces. No text, letters, logos or borders. Full-bleed edge to edge.'

const COVERS: Record<string, string> = {
  'voice-only': 'A classic studio microphone drawn in glowing white and soft silver light lines, centered in darkness, elegant and minimal, a single clear voice with no instruments.',
  power: 'A radiant burst of golden and electric orange energy exploding outward from the center, streaks of light, bold and energizing.',
  meditation: 'A softly glowing lotus flower made of violet and lavender light floating in darkness, symmetrical, calm, gentle halo.',
  sleep: 'A large luminous crescent moon in deep indigo darkness with a few soft stars and a faint misty glow, restful and hushed.',
  personal: 'A glowing fingerprint whose ridges are flowing neon green sound waves of light, centered in darkness, unique and personal, elegant and minimal.',
}

const args = process.argv.slice(2)
const version = args.find((a) => a.startsWith('--version='))?.slice('--version='.length) ?? 'v1'
const preview = args.includes('--preview')
// Upload the previews already in the output folder instead of generating new ones.
const uploadOnly = args.includes('--upload-only')
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
    if (uploadOnly) {
      const jpg = fs.readFileSync(path.join(outDir, `${type}.jpg`))
      const key = `site-assets/audio/mix-covers/${type}-${version}.jpg`
      await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: jpg, ContentType: 'image/jpeg', CacheControl: 'max-age=31536000' }))
      console.log(`${type}: ${CDN}/${key}`)
      continue
    }
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
    if (preview) {
      console.log(`${type}: ${path.join(outDir, `${type}.jpg`)}`)
      continue
    }
    const key = `site-assets/audio/mix-covers/${type}-${version}.jpg`
    await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: jpg, ContentType: 'image/jpeg', CacheControl: 'max-age=31536000' }))
    console.log(`${type}: ${CDN}/${key}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
