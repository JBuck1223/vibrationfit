import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Load environment variables
dotenv.config({ path: '.env.local' })

const PREVIEW_TEXT = "This is a sample of the voice you will hear for your life vision audio. This voice will read your vision and create audio tracks for you to listen to for multi-layered vision activation."

const ELEVENLABS_VOICES = [
  { id: 'elevenlabs-rachel', name: 'Rachel', voiceId: '21m00Tcm4TlvDq8ikWAM', modelId: 'eleven_multilingual_v2' },
  { id: 'elevenlabs-clyde', name: 'Clyde', voiceId: '2EiwWnXFnvU5JabPnv8n', modelId: 'eleven_multilingual_v2' },
  { id: 'elevenlabs-domi', name: 'Domi', voiceId: 'AZnzlk1XvdvUeBnXmlld', modelId: 'eleven_multilingual_v2' },
  { id: 'elevenlabs-dave', name: 'Dave', voiceId: 'CYw3kZ02Hs0563khs1Fj', modelId: 'eleven_multilingual_v2' },
  { id: 'elevenlabs-fin', name: 'Fin', voiceId: 'D38z5RcWu1voky8WS1ja', modelId: 'eleven_multilingual_v2' },
  { id: 'elevenlabs-sarah', name: 'Sarah', voiceId: 'EXAVITQu4vr4xnSDxMaL', modelId: 'eleven_multilingual_v2' },
  { id: 'elevenlabs-antoni', name: 'Antoni', voiceId: 'ErXwobaYiN019PkySvjV', modelId: 'eleven_multilingual_v2' },
  { id: 'elevenlabs-thomas', name: 'Thomas', voiceId: 'GBv7mTt0atIp3Br8iCZE', modelId: 'eleven_multilingual_v2' },
  { id: 'elevenlabs-charlie', name: 'Charlie', voiceId: 'IKne3meq5aSn9XLyUdCD', modelId: 'eleven_multilingual_v2' },
  { id: 'elevenlabs-emily', name: 'Emily', voiceId: 'LcfcDJNUP1GQjkzn1xUU', modelId: 'eleven_multilingual_v2' },
]

const BUCKET_NAME = 'vibration-fit-client-storage'
const CDN_PREFIX = 'https://media.vibrationfit.com'

async function generateVoicePreview(voiceId: string, modelId: string): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY not found in environment')
  }

  console.log(`  Generating audio with ElevenLabs...`)
  
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: PREVIEW_TEXT,
      model_id: modelId,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true
      }
    }),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    throw new Error(`ElevenLabs API failed: ${response.status} ${response.statusText} ${errText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

async function uploadToS3(buffer: Buffer, fileName: string): Promise<string> {
  const s3 = new S3Client({
    region: process.env.AWS_REGION || 'us-east-2',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  })

  const timestamp = Date.now()
  const s3Key = `site-assets/voice-previews/${fileName}-v${timestamp}.mp3`

  console.log(`  Uploading to S3: ${s3Key}`)

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    Body: buffer,
    ContentType: 'audio/mpeg',
    CacheControl: 'max-age=31536000', // 1 year
  })

  await s3.send(command)

  const url = `${CDN_PREFIX}/${s3Key}`
  console.log(`  ✓ Uploaded: ${url}`)
  
  return url
}

async function main() {
  console.log('🎤 Generating ElevenLabs Voice Previews\n')
  console.log(`Preview text: "${PREVIEW_TEXT}"\n`)
  
  const results: Record<string, string> = {}

  for (const voice of ELEVENLABS_VOICES) {
    console.log(`\n📢 ${voice.name} (${voice.id})`)
    
    try {
      // Generate audio
      const audioBuffer = await generateVoicePreview(voice.voiceId, voice.modelId)
      console.log(`  Generated ${audioBuffer.length} bytes`)
      
      // Upload to S3
      const url = await uploadToS3(audioBuffer, voice.id)
      results[voice.id] = url
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
      
    } catch (error) {
      console.error(`  ❌ Failed: ${error}`)
      continue
    }
  }

  console.log('\n\n✅ Generation Complete!\n')
  console.log('📋 Copy these URLs to your code:\n')
  console.log('```typescript')
  console.log('const voiceSamples = {')
  console.log('  // OpenAI voices')
  console.log("  'alloy': 'https://media.vibrationfit.com/site-assets/voice-previews/alloy-v1759856713602.mp3',")
  console.log("  'ash': 'https://media.vibrationfit.com/site-assets/voice-previews/ash-v1759856717540.mp3',")
  console.log("  'coral': 'https://media.vibrationfit.com/site-assets/voice-previews/coral-v1759856721577.mp3',")
  console.log("  'echo': 'https://media.vibrationfit.com/site-assets/voice-previews/echo-v1759856727354.mp3',")
  console.log("  'fable': 'https://media.vibrationfit.com/site-assets/voice-previews/fable-v1759856734156.mp3',")
  console.log("  'onyx': 'https://media.vibrationfit.com/site-assets/voice-previews/onyx-v1759856739405.mp3',")
  console.log("  'nova': 'https://media.vibrationfit.com/site-assets/voice-previews/nova-v1759856746503.mp3',")
  console.log("  'sage': 'https://media.vibrationfit.com/site-assets/voice-previews/sage-v1759856752077.mp3',")
  console.log("  'shimmer': 'https://media.vibrationfit.com/site-assets/voice-previews/shimmer-v1759856756423.mp3',")
  console.log('  // ElevenLabs voices')
  
  for (const [id, url] of Object.entries(results)) {
    console.log(`  '${id}': '${url}',`)
  }
  
  console.log('}')
  console.log('```')
  
  console.log('\n💰 Total cost: ~$0.0005 (less than a tenth of a cent)')
  console.log('🚀 These previews will be served from S3 forever for FREE!')
}

main().catch(console.error)








