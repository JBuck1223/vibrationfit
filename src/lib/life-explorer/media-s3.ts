import { createHash } from 'crypto'
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'

export const LIFE_EXPLORER_BUCKET = 'vibration-fit-client-storage'
export const LIFE_EXPLORER_CDN = 'https://media.vibrationfit.com'

export function lifeExplorerS3() {
  return new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  })
}

export function speakCacheKey(text: string): string {
  const norm = text.trim().toLowerCase().replace(/\s+/g, ' ')
  const hash = createHash('sha256').update(`nova|0.85|${norm}`).digest('hex').slice(0, 32)
  return `homeschool/life-explorer/tts/${hash}.mp3`
}

export async function objectExists(key: string): Promise<boolean> {
  try {
    await lifeExplorerS3().send(new HeadObjectCommand({ Bucket: LIFE_EXPLORER_BUCKET, Key: key }))
    return true
  } catch {
    return false
  }
}

export async function putLifeExplorerObject(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  await lifeExplorerS3().send(
    new PutObjectCommand({
      Bucket: LIFE_EXPLORER_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000',
    })
  )
  return `${LIFE_EXPLORER_CDN}/${key}`
}
