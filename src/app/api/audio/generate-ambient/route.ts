import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { writeFileSync, readFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { createClient } from '@supabase/supabase-js'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const { type, config } = await request.json()
    
    const tempPath = join(tmpdir(), `ambient-${Date.now()}.mp3`)
    const fileName = `${config.name.toLowerCase().replace(/\s+/g, '-')}.mp3`
    
    // Generate 5-minute track
    console.log(`[Ambient Generator] Generating ${type}:`, config)
    await generateAmbientSound(type, config, tempPath, 300)
    
    // Upload to S3
    console.log(`[Ambient Generator] Uploading to S3...`)
    const s3Key = `site-assets/audio/mixing-tracks/ambient/${fileName}`
    const fileBuffer = readFileSync(tempPath)
    
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET || 'vibration-fit-client-storage',
        Key: s3Key,
        Body: fileBuffer,
        ContentType: 'audio/mpeg',
      })
    )
    
    const s3Url = `https://media.vibrationfit.com/${s3Key}`
    console.log(`[Ambient Generator] Uploaded to:`, s3Url)
    
    // Insert into database
    console.log(`[Ambient Generator] Inserting into database...`)
    const { error: dbError } = await supabaseAdmin
      .from('audio_background_tracks')
      .upsert({
        name: config.name.toLowerCase().replace(/\s+/g, '-'),
        display_name: config.name,
        category: 'ambient',
        file_url: s3Url,
        description: generateDescription(type, config),
        sort_order: 100,
        is_active: true
      }, {
        onConflict: 'name'
      })
    
    if (dbError) {
      console.error('[Ambient Generator] Database error:', dbError)
      throw new Error(`Database insert failed: ${dbError.message}`)
    }
    
    // Cleanup
    unlinkSync(tempPath)
    
    console.log(`[Ambient Generator] Complete!`)
    
    return NextResponse.json({
      success: true,
      s3Url,
      name: config.name
    })
  } catch (error: any) {
    console.error('[Ambient Generator] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Generation failed' },
      { status: 500 }
    )
  }
}

function generateDescription(type: string, config: any): string {
  if (type === 'rain') {
    return `Rain sound at ${config.centerFreq}Hz center frequency with ${config.bandwidth}Hz bandwidth`
  } else if (type === 'ocean') {
    return `Ocean waves at ${config.waveSpeed}Hz (${(1/config.waveSpeed).toFixed(1)}s per wave) with ${(config.waveDepth * 100).toFixed(0)}% intensity`
  } else if (type === 'waterfall') {
    return `Waterfall at ${config.centerFreq}Hz with ${(config.intensity * 100).toFixed(0)}% flow intensity`
  }
  return 'Custom ambient sound'
}

async function generateAmbientSound(
  type: 'rain' | 'ocean' | 'waterfall',
  config: any,
  outputPath: string,
  duration: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    let filterChain = ''
    
    if (type === 'rain') {
      // Rain: white noise → bandpass
      filterChain = `anoisesrc=color=white,bandpass=f=${config.centerFreq}:width_type=h:width=${config.bandwidth},loudnorm=I=-20:TP=-1.5:LRA=11`
    } else if (type === 'ocean') {
      // Ocean: brown noise → tremolo (waves) → bandpass
      filterChain = `anoisesrc=color=brown,tremolo=f=${config.waveSpeed}:d=${config.waveDepth},bandpass=f=${config.centerFreq}:width_type=h:width=${config.bandwidth},loudnorm=I=-20:TP=-1.5:LRA=11`
    } else if (type === 'waterfall') {
      // Waterfall: white noise → volume → bandpass
      const intensityVolume = config.intensity || 0.8
      filterChain = `anoisesrc=color=white,volume=${intensityVolume},bandpass=f=${config.centerFreq}:width_type=h:width=${config.bandwidth},loudnorm=I=-20:TP=-1.5:LRA=11`
    }
    
    const ffmpeg = spawn('ffmpeg', [
      '-y',
      '-f', 'lavfi',
      '-i', filterChain,
      '-codec:a', 'libmp3lame',
      '-b:a', '192k',
      '-ar', '44100',
      '-t', duration.toString(),
      outputPath
    ])
    
    let stderr = ''
    ffmpeg.stderr?.on('data', (data) => {
      stderr += data.toString()
    })
    
    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        console.error('FFmpeg stderr:', stderr)
        reject(new Error(`FFmpeg failed with code ${code}`))
      } else {
        resolve()
      }
    })
    
    ffmpeg.on('error', (err) => {
      reject(err)
    })
  })
}

