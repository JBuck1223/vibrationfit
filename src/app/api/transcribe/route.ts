import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { trackTokenUsage } from '@/lib/tokens/tracking'

export const maxDuration = 300

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB - OpenAI Whisper limit

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    if (audioFile.size > MAX_FILE_SIZE) {
      const sizeMB = (audioFile.size / (1024 * 1024)).toFixed(1)
      return NextResponse.json({ 
        error: `Audio file is too large (${sizeMB}MB). Maximum size is 25MB. Try a shorter recording.`,
        code: 'FILE_TOO_LARGE'
      }, { status: 413 })
    }

    if (audioFile.size === 0) {
      return NextResponse.json({ 
        error: 'Audio file is empty. The recording may not have captured any data.',
        code: 'FILE_EMPTY'
      }, { status: 400 })
    }

    console.log('Transcribing audio:', {
      fileName: audioFile.name,
      fileSize: audioFile.size,
      fileSizeMB: (audioFile.size / (1024 * 1024)).toFixed(2),
      fileType: audioFile.type,
      userId: user.id
    })

    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    const file = new File([buffer], audioFile.name || 'recording.webm', {
      type: audioFile.type || 'audio/webm'
    })

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'en',
      response_format: 'verbose_json',
      timestamp_granularities: ['word']
    })

    console.log('Transcription complete:', {
      duration: transcription.duration,
      wordCount: transcription.text.split(' ').length
    })

    const costInCents = Math.round(transcription.duration * 0.006 * 100)
    
    const formatDuration = (seconds: number): string => {
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }
    
    await trackTokenUsage({
      user_id: user.id,
      action_type: 'transcription',
      model_used: 'whisper-1',
      tokens_used: Math.ceil(transcription.duration * 60),
      input_tokens: Math.ceil(transcription.duration * 60),
      output_tokens: transcription.text.split(' ').length,
      audio_seconds: transcription.duration,
      audio_duration_formatted: formatDuration(transcription.duration),
      actual_cost_cents: costInCents,
      openai_request_id: (transcription as any).id,
      openai_created: (transcription as any).created,
      system_fingerprint: (transcription as any).system_fingerprint,
      success: true,
      metadata: {
        audio_duration: transcription.duration,
        word_count: transcription.text.split(' ').length,
        language: transcription.language,
        file_size: audioFile.size,
        file_type: audioFile.type
      }
    })

    return NextResponse.json({
      transcript: transcription.text,
      duration: transcription.duration,
      language: transcription.language,
      words: transcription.words,
      success: true
    })

  } catch (error: any) {
    console.error('Transcription error:', error)
    
    if (error?.status === 401) {
      return NextResponse.json({ 
        error: 'OpenAI API key is invalid or missing',
        code: 'AUTH_ERROR'
      }, { status: 500 })
    }
    
    if (error?.status === 413) {
      return NextResponse.json({ 
        error: 'Audio file is too large. Maximum size is 25MB.',
        code: 'FILE_TOO_LARGE'
      }, { status: 413 })
    }

    if (error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT') {
      return NextResponse.json({ 
        error: 'Connection to transcription service timed out. Please try again.',
        code: 'TIMEOUT',
        retryable: true
      }, { status: 504 })
    }

    return NextResponse.json({ 
      error: 'Failed to transcribe audio. Please try again.',
      details: error?.message || 'Unknown error',
      code: 'TRANSCRIPTION_ERROR',
      retryable: true
    }, { status: 500 })
  }
}

export async function GET() {
  const hasApiKey = !!process.env.OPENAI_API_KEY
  
  return NextResponse.json({
    available: hasApiKey,
    message: hasApiKey 
      ? 'Transcription service is available' 
      : 'OpenAI API key is not configured'
  })
}
