// One-off: finalize the session that looped MediaConvert jobs on Jul 23-24.
// Lists the S3 optimized/ output folder and points the session at the file.
// Run: node --env-file=.env.local scripts/database/finalize-looped-session.mjs
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { createClient } from '@supabase/supabase-js'

const SESSION_ID = 'a887e168-d5d6-4db3-ad7b-825d17516847'
const PREFIX = 'session-recordings/vf-mrxp4g4s-wvlbjt/optimized/'
const BUCKET = 'vibration-fit-client-storage'
const CDN_URL = 'https://media.vibrationfit.com'

const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-2' })
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const { Contents: objects } = await s3.send(
  new ListObjectsV2Command({ Bucket: BUCKET, Prefix: PREFIX })
)

const mp4 = (objects || [])
  .filter((o) => o.Key?.endsWith('.mp4'))
  .sort((a, b) => (b.LastModified?.getTime() || 0) - (a.LastModified?.getTime() || 0))[0]

if (!mp4?.Key) {
  console.log('No optimized mp4 found under', PREFIX)
  console.log('Objects:', (objects || []).map((o) => o.Key))
  process.exit(1)
}

const sizeMb = ((mp4.Size || 0) / 1024 / 1024).toFixed(0)
console.log(`Found: ${mp4.Key} (${sizeMb} MB, modified ${mp4.LastModified?.toISOString()})`)

const optimizedUrl = `${CDN_URL}/${mp4.Key}`
const { error } = await supabase
  .from('video_sessions')
  .update({
    recording_url: optimizedUrl,
    recording_s3_key: mp4.Key,
    recording_status: 'uploaded',
  })
  .eq('id', SESSION_ID)

if (error) {
  console.log('DB update failed:', error.message)
  process.exit(1)
}
console.log('Session finalized with optimized URL:', optimizedUrl)
