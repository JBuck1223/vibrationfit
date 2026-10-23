#!/usr/bin/env tsx
/**
 * Test a single Home hero image for one member without touching the shared
 * themes: generates the image, then makes a private copy of a base theme for
 * that member with only `home.hero` replaced, and makes it their active theme.
 *
 *   npx tsx scripts/themes/home-hero-test.ts <member-email> [base-theme-slug]
 *   npx tsx scripts/themes/home-hero-test.ts <member-email> [base-theme-slug] --image <path>
 *
 * With --image, uses that file instead of generating one.
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { fal } from '@fal-ai/client'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { trimLetterbox } from './letterbox'

const argv = process.argv.slice(2)
const imageFlag = argv.indexOf('--image')
const imagePath = imageFlag >= 0 ? argv[imageFlag + 1] : null
const [email, baseSlug = 'sunset'] = argv.filter((a, i) => !a.startsWith('--') && (imageFlag < 0 || i !== imageFlag + 1))
if (!email) {
  console.error('Usage: npx tsx scripts/themes/home-hero-test.ts <member-email> [base-theme-slug]')
  process.exit(1)
}

const PROMPT =
  'Twilight just after sunset, the scene dominated by deep purples, violet and indigo, dark and serene. ' +
  'A woman seen from behind, long wavy hair catching a faint warm rim of light, wrapped in a soft knit blanket, ' +
  'sitting on a terrace above a calm sea and dark cliffs. The last thin glow of a small sun on the far horizon, ' +
  'a narrow band of muted amber under a violet and plum sky; the rest of the frame in shadowy purple tones. ' +
  'Soft out-of-focus flowers in deep magenta in the dark foreground. Moody, quiet, dreamy, low-key lighting, ' +
  'rich blacks, cinematic, shallow depth of field, photorealistic. She sits slightly right of center. ' +
  'Full-bleed frame edge to edge: no letterboxing, no black bars, no borders. No text, no logos, no watermarks. ' +
  'Keep the upper-left and left side dark, calm and uncluttered.'

const BUCKET = 'vibration-fit-client-storage'
const CDN = 'https://media.vibrationfit.com'

async function main() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  })
  const s3 = new S3Client({
    region: process.env.AWS_REGION || 'us-east-2',
    credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID!, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY! },
  })

  const { data: users } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const member = users?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
  if (!member) throw new Error(`No member with email ${email}`)

  const { data: base } = await supabase.from('themes').select('id, name').eq('slug', baseSlug).maybeSingle()
  if (!base) throw new Error(`No theme "${baseSlug}"`)

  let buffer: Buffer
  let ext = 'png'
  let contentType = 'image/png'
  if (imagePath) {
    buffer = readFileSync(imagePath)
    ext = imagePath.split('.').pop()?.toLowerCase() || 'png'
    contentType = ext === 'webp' ? 'image/webp' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png'
  } else {
    console.log('Generating image...')
    fal.config({ credentials: process.env.FAL_KEY })
    const result = await fal.subscribe(process.env.THEME_IMAGE_MODEL || 'fal-ai/nano-banana', {
      input: { prompt: PROMPT, aspect_ratio: '16:9', num_images: 1, output_format: 'png' },
      logs: false,
    })
    const imageUrl = ((result as any)?.data ?? result)?.images?.[0]?.url
    if (!imageUrl) throw new Error('No image returned')
    const raw = execFileSync('curl', ['-sf', imageUrl], { maxBuffer: 64 * 1024 * 1024 })
    buffer = (await trimLetterbox(raw)).buffer
    writeFileSync(process.env.PREVIEW_PATH || '/tmp/home-hero-test.png', buffer)
  }

  const key = `site-assets/themes/tests/home-hero-${member.id.slice(0, 8)}-${Date.now()}.${ext}`
  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buffer, ContentType: contentType, CacheControl: 'max-age=31536000' }))
  const heroUrl = `${CDN}/${key}`

  // A private copy of the base theme: same images everywhere except Home.
  const slug = `${baseSlug}-home-test-${member.id.slice(0, 8)}`
  const { data: existing } = await supabase.from('themes').select('id').eq('slug', slug).maybeSingle()
  let themeId = existing?.id as string | undefined
  if (!themeId) {
    const { data: created, error } = await supabase
      .from('themes')
      .insert({ slug, name: `${base.name} (Home test)`, kind: 'custom', owner_user_id: member.id, is_published: false, sort_order: 100 })
      .select('id')
      .single()
    if (error) throw error
    themeId = created.id
  }
  await supabase.from('theme_images').delete().eq('theme_id', themeId)
  const { data: baseImages } = await supabase
    .from('theme_images')
    .select('slot, image_url, s3_key, prompt, width, height, sort_order')
    .eq('theme_id', base.id)
  const rows = (baseImages ?? [])
    .filter((r) => r.slot !== 'home.hero')
    .map((r) => ({ ...r, theme_id: themeId }))
  rows.push({ theme_id: themeId, slot: 'home.hero', image_url: heroUrl, s3_key: key, prompt: imagePath ? 'Uploaded image' : PROMPT, width: null, height: null, sort_order: 0 })
  const { error: insertError } = await supabase.from('theme_images').insert(rows)
  if (insertError) throw insertError

  const { data: account } = await supabase.from('user_accounts').select('theme_id').eq('id', member.id).maybeSingle()
  await supabase.from('user_accounts').update({ theme_id: themeId }).eq('id', member.id)

  console.log(JSON.stringify({ heroUrl, themeId, previousThemeId: account?.theme_id ?? null }, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
