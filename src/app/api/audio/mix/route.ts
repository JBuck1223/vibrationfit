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
  try {
    const { trackId, voiceUrl, variant, outputKey } = await request.json()

    if (!trackId || !voiceUrl || !variant || !outputKey) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get volume levels from database
    const supabase = await createClient()
    const { data: variantData, error } = await supabase
      .from('audio_variants')
      .select('voice_volume, bg_volume, background_track')
      .eq('id', variant)
      .single()

    // Fallback to default volumes if variant not found in database
    let voiceVolume: number
    let bgVolume: number
    let bgTrack: string

    if (error || !variantData) {
      console.error('Error fetching variant data:', error)
      // Fallback to hardcoded volumes
      voiceVolume = variant === 'sleep' ? 0.3 : variant === 'meditation' ? 0.5 : 0.8
      bgVolume = variant === 'sleep' ? 0.7 : variant === 'meditation' ? 0.5 : 0.2
      bgTrack = 'Ocean-Waves-1.mp3'
    } else {
      // Convert percentages (0-100) to decimal (0-1) for Lambda
      voiceVolume = variantData.voice_volume / 100
      bgVolume = variantData.bg_volume / 100
      bgTrack = variantData.background_track || 'Ocean-Waves-1.mp3'
    }

    // Background track URL
    const bgUrl = `https://media.vibrationfit.com/site-assets/audio/mixing-tracks/${bgTrack}`

    // Invoke Lambda function
    const command = new InvokeCommand({
      FunctionName: 'audio-mixer',
      Payload: JSON.stringify({
        voiceUrl,
        bgUrl,
        outputKey,
        variant,
        voiceVolume,
        bgVolume,
        trackId,
      }),
      InvocationType: 'Event', // Async invocation
    })

    await lambda.send(command)

    return NextResponse.json({
      success: true,
      message: 'Mixing job triggered',
      trackId,
    })
  } catch (error) {
    console.error('Error triggering audio mix:', error)
    return NextResponse.json(
      { error: 'Failed to trigger audio mixing' },
      { status: 500 }
    )
  }
}
