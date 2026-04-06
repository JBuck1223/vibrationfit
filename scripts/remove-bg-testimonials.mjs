import { fal } from '@fal-ai/client'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import https from 'https'
import http from 'http'

fal.config({ credentials: process.env.FAL_KEY })

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

const BUCKET = 'vibration-fit-client-storage'
const S3_PREFIX = 'site-assets/proof-wall/testimonial-screenshots/testimonial-screenshots/4-6-26'
const CDN_BASE = 'https://media.vibrationfit.com'

const IMAGES = [
  'vfit-messages-0000s-0002-4.jpg',
  'vfit-messages-0000s-0003-5.jpg',
  'vfit-messages-0000s-0004-7.jpg',
  'vfit-messages-0000s-0005-8.jpg',
  'vfit-messages-0000s-0006-9.jpg',
  'vfit-messages-0000s-0007-13.jpg',
  'vfit-messages-0000s-0008-jeanie.jpg',
  'vfit-messages-0000s-0009-11.jpg',
  'vfit-messages-0000s-0010-12.jpg',
  'vfit-messages-0000s-0011-14.jpg',
  'vfit-messages-0000s-0012-15.jpg',
  'vfit-messages-0000s-0013-16.jpg',
  'vfit-messages-0000s-0014-17.jpg',
]

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http
    client.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchBuffer(res.headers.location).then(resolve, reject)
      }
      const chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => resolve(Buffer.concat(chunks)))
      res.on('error', reject)
    }).on('error', reject)
  })
}

async function processImage(filename) {
  const sourceUrl = `${CDN_BASE}/${S3_PREFIX}/${filename}`
  const pngFilename = filename.replace(/\.jpg$/i, '-nobg.png')

  console.log(`  Processing: ${filename}`)

  const result = await fal.subscribe('fal-ai/birefnet/v2', {
    input: {
      image_url: sourceUrl,
      model: 'General Use (Light)',
      output_format: 'png',
    },
  })

  const outputUrl = result.data?.image?.url
  if (!outputUrl) {
    console.error(`  FAILED: No output URL for ${filename}`, result)
    return null
  }

  console.log(`  Background removed, downloading...`)
  const pngBuffer = await fetchBuffer(outputUrl)

  const s3Key = `${S3_PREFIX}/${pngFilename}`
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: s3Key,
    Body: pngBuffer,
    ContentType: 'image/png',
    CacheControl: 'public, max-age=31536000',
  }))

  const cdnUrl = `${CDN_BASE}/${s3Key}`
  console.log(`  Uploaded: ${cdnUrl}`)
  return { original: filename, png: pngFilename, url: cdnUrl }
}

async function main() {
  console.log(`Processing ${IMAGES.length} testimonial images through BiRefNet...\n`)

  const results = []
  for (const filename of IMAGES) {
    try {
      const result = await processImage(filename)
      if (result) results.push(result)
    } catch (err) {
      console.error(`  ERROR on ${filename}:`, err.message)
    }
  }

  console.log(`\nDone! ${results.length}/${IMAGES.length} images processed.\n`)
  console.log('New URLs:')
  results.forEach((r) => console.log(`  ${r.url}`))
}

main().catch(console.error)
