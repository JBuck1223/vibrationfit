import { NextRequest, NextResponse } from 'next/server'
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda'
import { createClient } from '@/lib/supabase/server'

const lambda = new LambdaClient({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function POST(request: NextRequest) {
  let trackId: string | undefined
  
  try {
    const body = await request.json()
    console.log('📥 [MIX-CUSTOM API] Received body:', JSON.stringify(body, null, 2))
    
    const { trackId: extractedTrackId, voiceUrl, backgroundTrackUrl, voiceVolume, bgVolume, binauralTrackUrl, binauralVolume, outputKey } = body
    trackId = extractedTrackId

    if (!trackId || !voiceUrl || !backgroundTrackUrl || !outputKey || voiceVolume === undefined || bgVolume === undefined) {
      console.error('❌ [MIX-CUSTOM API] Missing fields:', {
        trackId: !!trackId,
        voiceUrl: !!voiceUrl,
        backgroundTrackUrl: !!backgroundTrackUrl,
        outputKey: !!outputKey,
        voiceVolume: voiceVolume !== undefined,
        bgVolume: bgVolume !== undefined
      })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate URLs
    if (!voiceUrl || typeof voiceUrl !== 'string' || voiceUrl.trim() === '') {
      throw new Error(`Invalid voice URL: ${voiceUrl}`)
    }
    if (!backgroundTrackUrl || typeof backgroundTrackUrl !== 'string' || backgroundTrackUrl.trim() === '') {
      throw new Error(`Invalid background URL: ${backgroundTrackUrl}`)
    }

    console.log('🎵 [MIX CUSTOM] Starting custom mix:', {
      trackId,
      voiceUrl,
      backgroundTrackUrl,
      voiceVolume: `${voiceVolume}%`,
      bgVolume: `${bgVolume}%`,
      binauralTrackUrl: binauralTrackUrl || 'none',
      binauralVolume: binauralVolume ? `${binauralVolume}%` : '0%'
    })

    // Convert percentages (0-100) to decimal (0-1) for Lambda
    const voiceVolumeDecimal = voiceVolume / 100
    const bgVolumeDecimal = bgVolume / 100
    const binauralVolumeDecimal = binauralVolume ? binauralVolume / 100 : 0
    
    console.log('📊 [MIX CUSTOM] Decimal volumes for FFmpeg:', {
      voice: voiceVolumeDecimal.toFixed(3),
      background: bgVolumeDecimal.toFixed(3),
      binaural: binauralVolumeDecimal.toFixed(3)
    })

    // Prepare Lambda payload
    const lambdaPayload: any = {
      voiceUrl,
      bgUrl: backgroundTrackUrl,
      voiceVolume: voiceVolumeDecimal,
      bgVolume: bgVolumeDecimal,
      outputKey,
      trackId, // Lambda will update Supabase with mix status
    }
    
    // Add optional binaural track (only if valid)
    if (binauralTrackUrl && typeof binauralTrackUrl === 'string' && binauralTrackUrl.trim() !== '' && binauralVolume && binauralVolume > 0) {
      lambdaPayload.binauralUrl = binauralTrackUrl
      lambdaPayload.binauralVolume = binauralVolumeDecimal
    }

    console.log('🚀 [MIX CUSTOM] Lambda payload:', JSON.stringify(lambdaPayload, null, 2))

    // Invoke Lambda function
    const command = new InvokeCommand({
      FunctionName: 'audio-mixer',
      Payload: JSON.stringify(lambdaPayload),
    })

    const response = await lambda.send(command)
    const payload = JSON.parse(Buffer.from(response.Payload!).toString())

    if (payload.statusCode !== 200) {
      throw new Error(payload.body || 'Lambda function failed')
    }

    const result = JSON.parse(payload.body)
    const mixedUrl = result.url

    // Update track record with mixed version URL and mix_status
    const supabase = await createClient()
    await supabase
      .from('audio_tracks')
      .update({
        mixed_audio_url: mixedUrl,
        mixed_s3_key: outputKey,
        status: 'completed',
        mix_status: 'completed'
      })
      .eq('id', trackId)

    console.log('✅ [MIX CUSTOM] Mix completed:', { trackId, mixedUrl })

    return NextResponse.json({
      success: true,
      mixedUrl,
      trackId
    })
  } catch (error: any) {
    console.error('❌ [MIX CUSTOM] Error:', error)
    
    // Update track status to failed
    if (trackId) {
      try {
        const supabase = await createClient()
        await supabase
          .from('audio_tracks')
          .update({
            mix_status: 'failed',
            error_message: error.message
          })
          .eq('id', trackId)
      } catch (updateError) {
        console.error('Failed to update track status:', updateError)
      }
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

