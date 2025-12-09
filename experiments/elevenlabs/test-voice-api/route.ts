import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const BUCKET_NAME = 'vibration-fit-client-storage'
const CDN_PREFIX = 'https://media.vibrationfit.com'

// Test text for voice testing (short!)
const TEST_TEXT = "This is a test of your voice. If you can hear this clearly, your voice clone is working perfectly."

async function synthesizeWithElevenLabs(text: string, voiceId: string, modelId: string = 'eleven_turbo_v2_5'): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    throw new Error('❌ ELEVENLABS_API_KEY not configured')
  }

  console.log(`[Test] Calling ElevenLabs with voiceId: ${voiceId}`)
  
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
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
    throw new Error(`ElevenLabs failed: ${response.status} - ${errText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

async function synthesizeWithOpenAI(text: string, voice: string): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured')

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      voice,
      input: text,
      format: 'mp3',
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI TTS failed: ${response.status}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { voice, text } = await request.json() as { voice: string; text?: string }
    
    if (!voice) {
      return NextResponse.json({ error: 'Voice ID required' }, { status: 400 })
    }

    const testText = text || TEST_TEXT
    console.log(`🎤 [Test] Testing voice: ${voice}`)
    console.log(`🎤 [Test] Text length: ${testText.length} characters`)
    console.log(`🎤 [Test] Estimated cost: ~${testText.length} credits`)

    // Detect provider
    const isClonedVoice = voice.startsWith('clone-')
    const isElevenLabs = voice.startsWith('elevenlabs-') || isClonedVoice
    
    let audioBuffer: Buffer

    if (isElevenLabs) {
      let elevenLabsVoiceId: string
      
      if (isClonedVoice) {
        elevenLabsVoiceId = voice.replace('clone-', '')
      } else {
        // Extract from elevenlabs-{voiceId}
        elevenLabsVoiceId = voice.replace('elevenlabs-', '')
      }
      
      console.log(`🎤 [Test] Using ElevenLabs with voice ID: ${elevenLabsVoiceId}`)
      audioBuffer = await synthesizeWithElevenLabs(testText, elevenLabsVoiceId)
    } else {
      console.log(`🎤 [Test] Using OpenAI with voice: ${voice}`)
      audioBuffer = await synthesizeWithOpenAI(testText, voice)
    }

    // Upload to S3
    const s3 = new S3Client({
      region: process.env.AWS_REGION || 'us-east-2',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })

    const timestamp = Date.now()
    const s3Key = `user-uploads/${user.id}/voice-tests/test-${timestamp}.mp3`

    await s3.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: audioBuffer,
      ContentType: 'audio/mpeg',
      CacheControl: 'max-age=3600', // Short cache for tests
    }))

    const audioUrl = `${CDN_PREFIX}/${s3Key}`
    
    console.log(`✅ [Test] Audio generated successfully: ${audioUrl}`)

    return NextResponse.json({
      success: true,
      audioUrl,
      provider: isElevenLabs ? 'elevenlabs' : 'openai',
      voiceId: voice,
      charactersUsed: testText.length,
      estimatedCredits: testText.length
    })
  } catch (error) {
    console.error('❌ [Test] Error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Test failed'
    }, { status: 500 })
  }
}

