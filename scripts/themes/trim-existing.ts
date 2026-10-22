#!/usr/bin/env tsx
/**
 * One-off repair: crop baked-in letterbox bars from every stored theme image.
 * Images that need it are re-uploaded under a new key and their theme_images
 * row is pointed at the new file. Images without bars are left alone.
 *
 *   npx tsx scripts/themes/trim-existing.ts            # fix
 *   npx tsx scripts/themes/trim-existing.ts --dry-run  # report only
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { execFileSync } from 'node:child_process'
import { trimLetterbox } from './letterbox'

const dryRun = process.argv.includes('--dry-run')
const BUCKET = 'vibration-fit-client-storage'
const CDN = 'https://media.vibrationfit.com'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
})
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID!, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY! },
})

// The CDN rejects Node's fetch user agent; curl gets the file.
function download(url: string): Buffer {
  return execFileSync('curl', ['-sf', url], { maxBuffer: 64 * 1024 * 1024 })
}

async function main() {
  const { data: rows, error } = await supabase.from('theme_images').select('id, image_url, s3_key, height')
  if (error) throw error
  let fixed = 0
  for (const row of rows ?? []) {
    const { buffer, top, bottom } = await trimLetterbox(download(row.image_url))
    if (top === 0 && bottom === 0) continue
    console.log(`${row.image_url.split('/themes/')[1]}: trim top ${top}px, bottom ${bottom}px`)
    if (dryRun) continue
    const key = (row.s3_key ?? row.image_url.replace(`${CDN}/`, '')).replace(/\.png$/, '-trim.png')
    await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buffer, ContentType: 'image/png', CacheControl: 'max-age=31536000' }))
    const { error: updateError } = await supabase.from('theme_images').update({ image_url: `${CDN}/${key}`, s3_key: key }).eq('id', row.id)
    if (updateError) throw updateError
    fixed++
  }
  console.log(dryRun ? 'Dry run complete.' : `Fixed ${fixed} image(s).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
