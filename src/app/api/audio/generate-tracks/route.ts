import { NextRequest } from 'next/server'
import { spawn } from 'child_process'
import { writeFileSync, mkdirSync, existsSync, readFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = 'vibration-fit-client-storage'

// Create Supabase client with service role for admin operations (bypasses RLS)
const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export const maxDuration = 900 // 15 minutes for generation

export async function POST(request: NextRequest) {
  const { type, selectedSolfeggio, selectedBrainwaves } = await request.json()
  
  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()
  
  const sendEvent = (data: any) => {
    writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
  }

  // Start generation in background
  ;(async () => {
    try {
      sendEvent({ type: 'status', status: 'generating', message: 'Starting generation...' })
      
      if (type === 'solfeggio') {
        await generateSolfeggioBinaural(sendEvent, {
          selectedSolfeggio: selectedSolfeggio || [],
          selectedBrainwaves: selectedBrainwaves || []
        })
      } else if (type === 'noise') {
        await generateNoiseTracks(sendEvent)
      } else {
        await generateBasicBinaural(sendEvent)
      }
      
      sendEvent({ type: 'complete', message: 'All done!' })
    } catch (error: any) {
      console.error('Generation error:', error)
      sendEvent({ type: 'error', message: error.message })
    } finally {
      writer.close()
    }
  })()

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

async function generateSolfeggioBinaural(
  sendEvent: Function,
  options: {
    selectedSolfeggio: number[]
    selectedBrainwaves: string[]
  }
) {
  const ALL_SOLFEGGIO = [
    { hz: 174, name: 'Pain Relief', description: 'Physical pain relief, grounding' },
    { hz: 285, name: 'Tissue Healing', description: 'Tissue regeneration, cellular repair' },
    { hz: 396, name: 'Liberation', description: 'Release fear, guilt, and negative patterns' },
    { hz: 417, name: 'Change', description: 'Facilitate change, undo negative situations' },
    { hz: 432, name: 'Natural Tuning', description: 'Natural universal frequency, cosmic harmony' },
    { hz: 528, name: 'DNA Repair', description: 'Love frequency, DNA repair, miracles' },
    { hz: 639, name: 'Connection', description: 'Relationships, connection, harmony' },
    { hz: 741, name: 'Awakening', description: 'Intuition, consciousness expansion' },
    { hz: 852, name: 'Spiritual Order', description: 'Return to spiritual order, inner strength' },
    { hz: 963, name: 'Divine Connection', description: 'Connection to divine, higher consciousness' },
    { hz: 1024, name: 'Cosmic Unity', description: 'Binary perfection, digital consciousness, universal oneness' }
  ]

  const ALL_BRAINWAVES = [
    { name: 'Delta', displayName: 'Delta', beatHz: 2.0, description: 'Deep sleep, healing' },
    { name: 'Theta', displayName: 'Theta', beatHz: 6.0, description: 'Deep meditation, creativity' },
    { name: 'Alpha', displayName: 'Alpha', beatHz: 10.0, description: 'Relaxed focus, learning' },
    { name: 'Beta', displayName: 'Beta', beatHz: 15.0, description: 'Alert focus, thinking' }
  ]

  // Filter based on user selection (case-insensitive for safety)
  const SOLFEGGIO_FREQUENCIES = ALL_SOLFEGGIO.filter(s => options.selectedSolfeggio.includes(s.hz))
  const BRAINWAVE_STATES = ALL_BRAINWAVES.filter(b => 
    options.selectedBrainwaves.some(selected => selected.toLowerCase() === b.name.toLowerCase())
  )

  const OUTPUT_DIR = join(process.cwd(), 'temp', 'solfeggio-binaural')
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  const pureSolfeggioCount = SOLFEGGIO_FREQUENCIES.length
  const combinationCount = SOLFEGGIO_FREQUENCIES.length * BRAINWAVE_STATES.length
  const totalFiles = pureSolfeggioCount + combinationCount
  let completedFiles = 0

  sendEvent({
    type: 'progress',
    progress: 0,
    completed: 0,
    message: `Generating ${totalFiles} tracks (${pureSolfeggioCount} pure + ${combinationCount} with binaural)`
  })

  // Step 1: Generate pure Solfeggio tones (no brainwave)
  for (const solfeggio of SOLFEGGIO_FREQUENCIES) {
    const fileName = `${solfeggio.hz}hz-pure.mp3`
    const outputPath = join(OUTPUT_DIR, fileName)
    
    sendEvent({
      type: 'progress',
      progress: Math.floor((completedFiles / totalFiles) * 100),
      completed: completedFiles,
      currentFile: fileName,
      message: `Generating ${fileName}...`
    })

    // Generate pure tone (mono, not binaural)
    await generatePureTone(solfeggio.hz, outputPath, 300)
    
    // Upload to S3
    sendEvent({ type: 'status', status: 'uploading', message: `Uploading ${fileName}...` })
    const s3Url = await uploadToS3(outputPath, `site-assets/audio/mixing-tracks/solfeggio/pure/${fileName}`)
    
    // Insert into database
    sendEvent({ type: 'status', status: 'inserting', message: `Adding ${fileName} to database...` })
    await insertIntoDatabase({
      name: `${solfeggio.hz}hz-pure`,
      display_name: `${solfeggio.hz}Hz`,
      category: 'solfeggio',
      file_url: s3Url,
      description: `Pure ${solfeggio.hz}Hz ${solfeggio.name} frequency`,
      sort_order: 100 + completedFiles,
      frequency_hz: solfeggio.hz
      // No brainwave_hz - this is pure frequency only
    })
    
    // Cleanup
    unlinkSync(outputPath)
    
    completedFiles++
  }

  // Step 2: Generate Solfeggio + Binaural combinations
  for (const solfeggio of SOLFEGGIO_FREQUENCIES) {
    for (const brainwave of BRAINWAVE_STATES) {
      const fileName = `${solfeggio.hz}hz-${brainwave.name.toLowerCase()}.mp3`
      const outputPath = join(OUTPUT_DIR, fileName)
      
      sendEvent({
        type: 'progress',
        progress: Math.floor((completedFiles / totalFiles) * 100),
        completed: completedFiles,
        currentFile: fileName,
        message: `Generating ${fileName}...`
      })

      await generateSingleTrack(solfeggio.hz, brainwave.beatHz, outputPath, 300)
      
      // Upload to S3
      sendEvent({ type: 'status', status: 'uploading', message: `Uploading ${fileName}...` })
      const s3Url = await uploadToS3(outputPath, `site-assets/audio/mixing-tracks/solfeggio/binaural/${fileName}`)
      
      // Insert into database
      sendEvent({ type: 'status', status: 'inserting', message: `Adding ${fileName} to database...` })
      await insertIntoDatabase({
        name: `${solfeggio.hz}hz-${brainwave.name.toLowerCase()}`,
        display_name: `${solfeggio.hz}Hz ${brainwave.displayName}`,
        category: 'solfeggio',
        file_url: s3Url,
        description: `${solfeggio.description} with ${brainwave.description}`,
        sort_order: 200 + completedFiles,
        // Binaural metadata ✨ (frequency + brainwave = Solfeggio+Binaural combo)
        frequency_hz: solfeggio.hz,
        brainwave_hz: brainwave.beatHz
      })
      
      // Cleanup
      unlinkSync(outputPath)
      
      completedFiles++
    }
  }

  // TODO: Generate journey tracks (similar process)
  // For now, we'll skip journeys to keep the example simpler
  
  sendEvent({
    type: 'progress',
    progress: 100,
    completed: completedFiles,
    message: `Generated ${completedFiles} tracks`
  })
}

async function generateBasicBinaural(sendEvent: Function) {
  // Similar to solfeggio but simpler - just 6 files
  sendEvent({ type: 'progress', progress: 50, completed: 3, message: 'Generating basic binaural beats...' })
  // Implementation similar to above
}

async function generateNoiseTracks(sendEvent: Function) {
  const NOISE_TYPES = [
    { type: 'white', name: 'White Noise', description: 'Equal energy across all frequencies, ideal for masking and focus' },
    { type: 'pink', name: 'Pink Noise', description: 'Natural 1/f spectrum, perfect for sleep and relaxation' },
    { type: 'brown', name: 'Brown Noise', description: 'Deeper 1/f² spectrum, excellent for deep focus and calm' }
  ]

  const OUTPUT_DIR = join(process.cwd(), 'temp', 'noise')
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  const totalFiles = NOISE_TYPES.length
  let completedFiles = 0

  sendEvent({
    type: 'progress',
    progress: 0,
    completed: 0,
    message: `Generating ${totalFiles} noise tracks`
  })

  for (const noise of NOISE_TYPES) {
    const fileName = `${noise.type}-noise.mp3`
    const outputPath = join(OUTPUT_DIR, fileName)
    
    sendEvent({
      type: 'progress',
      progress: Math.floor((completedFiles / totalFiles) * 100),
      completed: completedFiles,
      currentFile: fileName,
      message: `Generating ${fileName}...`
    })

    // Generate noise track (5 minutes)
    await generateNoiseTrack(noise.type as 'white' | 'pink' | 'brown', outputPath, 300)
    
    // Upload to S3
    sendEvent({ type: 'status', status: 'uploading', message: `Uploading ${fileName}...` })
    const s3Url = await uploadToS3(outputPath, `site-assets/audio/mixing-tracks/noise/${fileName}`)
    
    // Insert into database
    sendEvent({ type: 'status', status: 'inserting', message: `Adding ${fileName} to database...` })
    await insertIntoDatabase({
      name: `${noise.type}-noise`,
      display_name: noise.name,
      category: 'ambient',
      file_url: s3Url,
      description: noise.description,
      sort_order: 50 + completedFiles
    })
    
    // Cleanup
    unlinkSync(outputPath)
    
    completedFiles++
  }

  sendEvent({
    type: 'progress',
    progress: 100,
    completed: completedFiles,
    message: `Generated ${completedFiles} noise tracks`
  })
}

async function generateNoiseTrack(
  noiseType: 'white' | 'pink' | 'brown',
  outputPath: string,
  duration: number
): Promise<void> {
  // Map noise types to FFmpeg filter names
  const noiseFilters = {
    white: 'anoisesrc=color=white',
    pink: 'anoisesrc=color=pink',
    brown: 'anoisesrc=color=brown'
  }

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-y',
      '-f', 'lavfi',
      '-i', `${noiseFilters[noiseType]}:duration=${duration}`,
      '-af', 'loudnorm=I=-20:TP=-1.5:LRA=11',
      '-codec:a', 'libmp3lame',
      '-b:a', '192k',
      '-ar', '44100',
      outputPath
    ])

    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`FFmpeg failed with code ${code}`))
      } else {
        resolve()
      }
    })
  })
}

async function generatePureTone(
  frequency: number,
  outputPath: string,
  duration: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-y',
      '-f', 'lavfi',
      '-i', `sine=frequency=${frequency}:duration=${duration}`,
      '-af', 'volume=0.25',  // -12dB to match voice/noise with loudnorm
      '-codec:a', 'libmp3lame',
      '-b:a', '128k',
      '-ar', '44100',
      outputPath
    ])

    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`FFmpeg failed with code ${code}`))
      } else {
        resolve()
      }
    })
  })
}

async function generateSingleTrack(
  baseFreq: number,
  beatFreq: number,
  outputPath: string,
  duration: number
): Promise<void> {
  const leftFreq = baseFreq - (beatFreq / 2)
  const rightFreq = baseFreq + (beatFreq / 2)

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-y',
      '-f', 'lavfi',
      '-i', `sine=frequency=${leftFreq}:duration=${duration}`,
      '-f', 'lavfi',
      '-i', `sine=frequency=${rightFreq}:duration=${duration}`,
      '-filter_complex',
      '[0:a][1:a]join=inputs=2:channel_layout=stereo[a];[a]volume=0.25[out]',  // -12dB to match voice/noise with loudnorm
      '-map', '[out]',
      '-codec:a', 'libmp3lame',
      '-b:a', '128k',
      '-ar', '44100',
      outputPath
    ])

    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`FFmpeg failed with code ${code}`))
      } else {
        resolve()
      }
    })
  })
}

async function uploadToS3(localPath: string, s3Key: string): Promise<string> {
  const fileContent = readFileSync(localPath)
  
  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    Body: fileContent,
    ContentType: 'audio/mpeg',
    CacheControl: 'max-age=31536000',
  }))

  return `https://media.vibrationfit.com/${s3Key}`
}

async function insertIntoDatabase(track: {
  name: string
  display_name: string
  category: string
  file_url: string
  description: string
  sort_order: number
  frequency_hz?: number
  brainwave_hz?: number
}) {
  const { error } = await supabaseAdmin
    .from('audio_background_tracks')
    .upsert({
      ...track,
      is_active: true
    }, {
      onConflict: 'name'
    })

  if (error) {
    console.error('Database insert error:', error)
    throw error
  }
}

