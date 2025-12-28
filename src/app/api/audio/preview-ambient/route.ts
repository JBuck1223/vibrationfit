import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { writeFileSync, readFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

export async function POST(request: NextRequest) {
  try {
    const { type, config } = await request.json()
    
    const tempPath = join(tmpdir(), `preview-${Date.now()}.mp3`)
    
    // Generate 10-second preview
    await generateAmbientSound(type, config, tempPath, 10)
    
    // Read and return the file
    const audioBuffer = readFileSync(tempPath)
    unlinkSync(tempPath) // Cleanup
    
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
      },
    })
  } catch (error: any) {
    console.error('Preview generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Preview generation failed' },
      { status: 500 }
    )
  }
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

