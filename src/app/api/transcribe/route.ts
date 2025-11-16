import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { trackTokenUsage } from '@/lib/tokens/tracking'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the audio file from the request
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    console.log('🎙️ Transcribing audio:', {
      fileName: audioFile.name,
      fileSize: audioFile.size,
      fileType: audioFile.type,
      userId: user.id
    })

    // Convert File to Buffer for OpenAI
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Create a File object that OpenAI expects
    const file = new File([buffer], audioFile.name || 'recording.webm', {
      type: audioFile.type || 'audio/webm'
    })

    // Transcribe with OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'en', // Optional: specify language for better accuracy
      response_format: 'verbose_json', // Get timestamps and other metadata
      timestamp_granularities: ['word'] // Optional: get word-level timestamps
    })

    console.log('✅ Transcription complete:', {
      duration: transcription.duration,
      wordCount: transcription.text.split(' ').length
    })

    // Track token usage for transcription
    // Whisper pricing: $0.006 per minute of audio
    const costInCents = Math.round(transcription.duration * 0.006 * 100) // Convert to cents
    
    await trackTokenUsage({
      user_id: user.id,
      action_type: 'transcription',
      model_used: 'whisper-1',
      tokens_used: Math.ceil(transcription.duration * 60), // Estimate tokens based on duration
      input_tokens: Math.ceil(transcription.duration * 60),
      output_tokens: transcription.text.split(' ').length, // Word count as output tokens
      actual_cost_cents: costInCents, // Changed from cost_estimate to actual_cost_cents
      // OpenAI reconciliation fields (if available - Whisper API may not include these)
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

    // Return the transcript
    return NextResponse.json({
      transcript: transcription.text,
      duration: transcription.duration,
      language: transcription.language,
      words: transcription.words, // Word-level timestamps if requested
      success: true
    })

  } catch (error: any) {
    console.error('❌ Transcription error:', error)
    
    // Handle specific OpenAI errors
    if (error?.status === 401) {
      return NextResponse.json({ 
        error: 'OpenAI API key is invalid or missing' 
      }, { status: 500 })
    }
    
    if (error?.status === 413) {
      return NextResponse.json({ 
        error: 'Audio file is too large. Maximum size is 25MB.' 
      }, { status: 413 })
    }

    return NextResponse.json({ 
      error: 'Failed to transcribe audio',
      details: error?.message || 'Unknown error'
    }, { status: 500 })
  }
}

// Optional: Add a GET endpoint to check if transcription is available
export async function GET() {
  const hasApiKey = !!process.env.OPENAI_API_KEY
  
  return NextResponse.json({
    available: hasApiKey,
    message: hasApiKey 
      ? 'Transcription service is available' 
      : 'OpenAI API key is not configured'
  })
}

