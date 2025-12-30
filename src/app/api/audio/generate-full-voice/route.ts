import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export const maxDuration = 300 // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const { audioSetId, visionId, userId } = await request.json()

    if (!audioSetId || !visionId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user || user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🎵 [FULL VOICE] Starting full voice generation:', { audioSetId, visionId, userId })

    // Fetch all section tracks (exclude any existing full track)
    const { data: tracks, error: tracksError } = await supabase
      .from('audio_tracks')
      .select('*')
      .eq('audio_set_id', audioSetId)
      .neq('section_key', 'full')
      .eq('status', 'completed')
      .order('created_at', { ascending: true })

    if (tracksError || !tracks || tracks.length === 0) {
      console.error('❌ [FULL VOICE] Failed to fetch tracks:', tracksError)
      return NextResponse.json(
        { error: 'No completed tracks found for this audio set' },
        { status: 400 }
      )
    }

    console.log(`✅ [FULL VOICE] Found ${tracks.length} tracks to concatenate`)

    // Create temp directory
    const tempDir = path.join('/tmp', `full-voice-${Date.now()}`)
    fs.mkdirSync(tempDir, { recursive: true })

    try {
      // Download all tracks from S3
      const downloadedFiles: string[] = []

      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i]
        const localPath = path.join(tempDir, `section-${i.toString().padStart(2, '0')}.mp3`)
        
        console.log(`📥 [FULL VOICE] Downloading track ${i + 1}/${tracks.length}: ${track.section_key}`)
        
        // Parse S3 URL to get bucket and key
        const url = new URL(track.audio_url)
        const s3Key = track.s3_key || url.pathname.slice(1) // Remove leading slash
        
        const getCommand = new GetObjectCommand({
          Bucket: track.s3_bucket || 'vibration-fit-client-storage',
          Key: s3Key
        })
        const s3Object = await s3Client.send(getCommand)

        const buffer = await s3Object.Body?.transformToByteArray()
        if (!buffer) throw new Error(`Failed to download track: ${track.section_key}`)
        
        fs.writeFileSync(localPath, Buffer.from(buffer))
        downloadedFiles.push(localPath)
      }

      console.log('✅ [FULL VOICE] All tracks downloaded')

      // Create FFmpeg concat file
      const concatListPath = path.join(tempDir, 'concat-list.txt')
      const concatContent = downloadedFiles.map(f => `file '${f}'`).join('\n')
      fs.writeFileSync(concatListPath, concatContent)

      // Concatenate with FFmpeg
      const outputPath = path.join(tempDir, 'full-voice.mp3')
      console.log('🔧 [FULL VOICE] Concatenating tracks with FFmpeg...')
      
      execSync(
        `ffmpeg -f concat -safe 0 -i "${concatListPath}" -c copy "${outputPath}"`,
        { stdio: 'pipe' }
      )

      console.log('✅ [FULL VOICE] Concatenation complete')

      // Get duration
      const durationOutput = execSync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${outputPath}"`,
        { encoding: 'utf-8' }
      )
      const duration = Math.round(parseFloat(durationOutput.trim()))

      // Upload to S3
      const fileBuffer = fs.readFileSync(outputPath)
      const s3Key = `user-uploads/${userId}/life-vision/audio/${visionId}/full-${audioSetId}.mp3`
      
      console.log('📤 [FULL VOICE] Uploading to S3...')
      
      const putCommand = new PutObjectCommand({
        Bucket: 'vibration-fit-client-storage',
        Key: s3Key,
        Body: fileBuffer,
        ContentType: 'audio/mpeg',
      })
      await s3Client.send(putCommand)

      const audioUrl = `https://media.vibrationfit.com/${s3Key}`
      console.log('✅ [FULL VOICE] Uploaded to S3:', audioUrl)

      // Insert full track record
      const contentHash = crypto.createHash('sha256').update('full-vision-audio').digest('hex').substring(0, 16)
      
      const { data: fullTrack, error: insertError } = await supabase
        .from('audio_tracks')
        .insert({
          audio_set_id: audioSetId,
          user_id: userId,
          vision_id: visionId,
          section_key: 'full',
          content_hash: contentHash,
          text_content: 'Full Vision Audio - All Sections Combined',
          voice_id: tracks[0].voice_id,
          s3_bucket: 'vibration-fit-client-storage',
          s3_key: s3Key,
          audio_url: audioUrl,
          duration_seconds: duration,
          status: 'completed'
        })
        .select()
        .single()

      if (insertError) {
        console.error('❌ [FULL VOICE] Failed to insert track record:', insertError)
        throw insertError
      }

      console.log('✅ [FULL VOICE] Full track record created:', fullTrack.id)

      // Cleanup temp files
      fs.rmSync(tempDir, { recursive: true, force: true })

      return NextResponse.json({ 
        success: true, 
        trackId: fullTrack.id,
        audioUrl,
        duration
      })

    } catch (error) {
      // Cleanup on error
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true })
      }
      throw error
    }

  } catch (error) {
    console.error('❌ [FULL VOICE] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate full voice track' },
      { status: 500 }
    )
  }
}

