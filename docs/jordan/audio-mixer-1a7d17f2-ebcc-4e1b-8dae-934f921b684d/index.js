const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3')
const { exec } = require('child_process')
const { promisify } = require('util')
const { createWriteStream, unlink } = require('fs')
const { pipeline } = require('stream/promises')

const execAsync = promisify(exec)

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  // Don't specify credentials - use Lambda execution role (audio-mixer-lambda-role)
})

const BUCKET_NAME = process.env.BUCKET_NAME || 'vibration-fit-client-storage'
const ffmpegPath = '/opt/ffmpeg-layer/bin/ffmpeg'
const ffprobePath = '/opt/ffmpeg-layer/bin/ffprobe'

exports.handler = async (event) => {
  console.log('Raw Event:', JSON.stringify(event, null, 2))
  
  let eventData = event
  if (typeof event.body === 'string') {
    try {
      eventData = JSON.parse(event.body)
    } catch (e) {
      console.log('Event body is not JSON, using as-is')
    }
  }
  
  console.log('Parsed Event Data:', JSON.stringify(eventData, null, 2))
  
  // Route based on action
  if (eventData.action === 'concatenate') {
    return handleConcatenate(eventData)
  }
  
  // Default: mixing action
  return handleMix(eventData)
}

// ─── MIXING ──────────────────────────────────────────────────────────────────

async function handleMix(eventData) {
  const { voiceUrl, bgUrl, binauralUrl, outputKey, variant, voiceVolume, bgVolume, binauralVolume, trackId } = eventData
  
  console.log('[Mixing] Extracted parameters:', {
    voiceUrl: voiceUrl || 'MISSING',
    bgUrl: bgUrl || 'MISSING',
    binauralUrl: binauralUrl || 'none',
    voiceVolume: voiceVolume || 'DEFAULT',
    bgVolume: bgVolume || 'DEFAULT',
    binauralVolume: binauralVolume || 'DEFAULT',
    trackId
  })
  
  try {
    if (!voiceUrl) {
      throw new Error('voiceUrl is required but was not provided')
    }
    if (!bgUrl) {
      throw new Error('bgUrl is required but was not provided')
    }
    
    const voicePath = `/tmp/voice-${Date.now()}.mp3`
    console.log('[Mixing] Downloading voice from:', voiceUrl)
    await downloadFromS3(voiceUrl, voicePath)
    
    const bgPath = `/tmp/bg-${Date.now()}.mp3`
    console.log('[Mixing] Downloading background from:', bgUrl)
    await downloadFromS3(bgUrl, bgPath)
    
    let binauralPath = null
    if (binauralUrl && typeof binauralUrl === 'string' && binauralUrl.trim() !== '') {
      binauralPath = `/tmp/binaural-${Date.now()}.mp3`
      await downloadFromS3(binauralUrl, binauralPath)
      console.log('[Mixing] Including binaural track in mix')
    } else if (binauralUrl) {
      console.log('[Mixing] Binaural URL provided but invalid, skipping:', binauralUrl)
    }
    
    const outputPath = `/tmp/mixed-${Date.now()}.mp3`
    await mixAudio(voicePath, bgPath, binauralPath, outputPath, voiceVolume || 0.7, bgVolume || 0.3, binauralVolume || 0.2)
    
    const mixedUrl = await uploadToS3(outputPath, outputKey)
    
    if (trackId) {
      await updateMixStatus(trackId, 'completed', mixedUrl, outputKey)
    }
    
    const filesToClean = [voicePath, bgPath, outputPath]
    if (binauralPath) filesToClean.push(binauralPath)
    await Promise.all(filesToClean.map(removeFile))
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        outputKey,
        mixedUrl,
        message: 'Audio mixed successfully'
      })
    }
  } catch (error) {
    console.error('Error:', error)
    
    if (eventData.trackId) {
      await updateMixStatus(eventData.trackId, 'failed', null, null, error.message)
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    }
  }
}

// ─── CONCATENATION ───────────────────────────────────────────────────────────
//
// Concatenates multiple audio tracks into a single file using FFmpeg stream
// copy (-c copy). No re-encoding, so it's fast even for 60+ minute files.
//
// Payload: { action: 'concatenate', trackUrls: string[], outputKey: string, trackId: string }

async function handleConcatenate(eventData) {
  const { trackUrls, outputKey, trackId } = eventData
  const fs = require('fs')
  const timestamp = Date.now()
  const filesToClean = []

  console.log(`[Concat] Starting concatenation of ${trackUrls?.length} tracks`)
  console.log(`[Concat] Output key: ${outputKey}`)
  console.log(`[Concat] Track ID: ${trackId}`)

  try {
    if (!Array.isArray(trackUrls) || trackUrls.length === 0) {
      throw new Error('trackUrls array is required and must not be empty')
    }
    if (!outputKey) {
      throw new Error('outputKey is required')
    }

    // Download all section tracks
    const downloadedPaths = []
    for (let i = 0; i < trackUrls.length; i++) {
      const localPath = `/tmp/concat-${timestamp}-${i.toString().padStart(2, '0')}.mp3`
      const filename = trackUrls[i].substring(trackUrls[i].lastIndexOf('/') + 1)
      console.log(`[Concat] Downloading track ${i + 1}/${trackUrls.length}: ${filename}`)
      await downloadFromS3(trackUrls[i], localPath)
      downloadedPaths.push(localPath)
      filesToClean.push(localPath)
    }

    console.log(`[Concat] All ${downloadedPaths.length} tracks downloaded`)

    // Build FFmpeg concat list
    const concatListPath = `/tmp/concat-${timestamp}-list.txt`
    const concatContent = downloadedPaths.map(f => `file '${f}'`).join('\n')
    fs.writeFileSync(concatListPath, concatContent)
    filesToClean.push(concatListPath)

    // Concatenate with stream copy (no re-encoding)
    const outputPath = `/tmp/concat-${timestamp}-output.mp3`
    filesToClean.push(outputPath)

    const concatCommand = `${ffmpegPath} -f concat -safe 0 -i "${concatListPath}" -c copy -y "${outputPath}"`
    console.log(`[Concat] Running FFmpeg concat...`)
    await execAsync(concatCommand)

    const outputStats = fs.statSync(outputPath)
    console.log(`[Concat] Output file size: ${(outputStats.size / 1024 / 1024).toFixed(1)}MB`)

    // Get duration via ffprobe
    let durationSeconds = 0
    try {
      const { stdout } = await execAsync(
        `${ffprobePath} -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${outputPath}"`
      )
      durationSeconds = Math.round(parseFloat(stdout.trim()))
      console.log(`[Concat] Duration: ${durationSeconds}s (${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s)`)
    } catch (e) {
      console.warn('[Concat] Could not determine duration via ffprobe:', e.message)
    }

    // Upload to S3
    const audioUrl = await uploadToS3(outputPath, outputKey)
    console.log(`[Concat] Uploaded to: ${audioUrl}`)

    // Update the full track record in Supabase
    if (trackId) {
      await updateTrackStatus(trackId, 'completed', audioUrl, outputKey, durationSeconds)
    }

    // Cleanup
    await Promise.all(filesToClean.map(removeFile))

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        outputKey,
        audioUrl,
        durationSeconds,
        tracksConcat: trackUrls.length,
        message: 'Audio concatenated successfully'
      })
    }
  } catch (error) {
    console.error('[Concat] Error:', error)

    if (trackId) {
      await updateTrackStatus(trackId, 'failed', null, null, 0, error.message)
    }

    await Promise.all(filesToClean.map(removeFile))

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    }
  }
}

// ─── SHARED UTILITIES ────────────────────────────────────────────────────────

async function downloadFromS3(s3Url, localPath) {
  if (!s3Url || typeof s3Url !== 'string' || s3Url.trim() === '') {
    throw new Error(`Invalid S3 URL: ${s3Url}`)
  }
  
  let key
  if (s3Url.includes(BUCKET_NAME + '/')) {
    key = s3Url.split(BUCKET_NAME + '/')[1]
  } else if (s3Url.includes('media.vibrationfit.com/')) {
    key = s3Url.split('media.vibrationfit.com/')[1]
  } else {
    throw new Error(`Invalid URL format: ${s3Url}`)
  }
  
  console.log(`Downloading from S3: bucket=${BUCKET_NAME}, key=${key}`)
  
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key
  })
  
  const response = await s3Client.send(command)
  
  const fileStream = createWriteStream(localPath)
  await pipeline(response.Body, fileStream)
  
  const fs = require('fs')
  const stats = fs.statSync(localPath)
  console.log(`Downloaded ${key} -> ${localPath} (${stats.size} bytes)`)
}

async function mixAudio(voicePath, bgPath, binauralPath, outputPath, voiceVolume, bgVolume, binauralVolume) {
  console.log(`[Mixing] Input volumes: Voice=${voiceVolume}, BG=${bgVolume}, Binaural=${binauralVolume || 'none'}`)
  
  let command
  if (binauralPath) {
    console.log(`[Mixing] Using volume filters: Voice=${voiceVolume}, BG=${bgVolume}, Binaural=${binauralVolume}`)
    
    command = `${ffmpegPath} -i ${voicePath} -i ${bgPath} -i ${binauralPath} ` +
      `-filter_complex "[0:a]volume=${voiceVolume}[v];[1:a]aloop=loop=-1:size=2e+09,volume=${bgVolume}[bg];[2:a]aloop=loop=-1:size=2e+09,volume=${binauralVolume}[bin];[v][bg][bin]amix=inputs=3:duration=first:normalize=0" ` +
      `-codec:a libmp3lame -b:a 192k -y ${outputPath}`
    
    console.log(`[Mixing] 3-track mix with volume filters`)
  } else {
    console.log(`[Mixing] Using volume filters: Voice=${voiceVolume}, BG=${bgVolume}`)
    
    command = `${ffmpegPath} -i ${voicePath} -i ${bgPath} ` +
      `-filter_complex "[0:a]volume=${voiceVolume}[v];[1:a]aloop=loop=-1:size=2e+09,volume=${bgVolume}[bg];[v][bg]amix=inputs=2:duration=first:normalize=0" ` +
      `-codec:a libmp3lame -b:a 192k -y ${outputPath}`
    
    console.log(`[Mixing] 2-track mix with volume filters`)
  }
  
  console.log(`[Mixing] FFmpeg command: ${command}`)
  await execAsync(command)
}

async function uploadToS3(localPath, s3Key) {
  const fs = await import('fs')
  const fileContent = await fs.promises.readFile(localPath)
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    Body: fileContent,
    ContentType: 'audio/mpeg',
    CacheControl: 'max-age=31536000',
  })
  
  await s3Client.send(command)
  
  const CDN_PREFIX = 'https://media.vibrationfit.com'
  return `${CDN_PREFIX}/${s3Key}`
}

/**
 * Update mix_status fields on an audio_tracks record (used by mixing action)
 */
async function updateMixStatus(trackId, status, mixedUrl, mixedS3Key, errorMessage) {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials not configured, skipping status update')
    return
  }
  
  try {
    const updateData = {
      mix_status: status,
      mixed_audio_url: mixedUrl,
      mixed_s3_key: mixedS3Key,
    }
    
    if (errorMessage) {
      updateData.error_message = errorMessage
    }
    
    await fetch(`${supabaseUrl}/rest/v1/audio_tracks?id=eq.${trackId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(updateData),
    })
    
    console.log(`[Mixing] Updated track ${trackId} with status: ${status}`)
  } catch (error) {
    console.error('Failed to update Supabase:', error)
  }
}

/**
 * Update primary track status fields (used by concatenation action)
 */
async function updateTrackStatus(trackId, status, audioUrl, s3Key, durationSeconds, errorMessage) {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials not configured, skipping status update')
    return
  }
  
  try {
    const updateData = {
      status: status,
    }
    
    if (audioUrl) {
      updateData.audio_url = audioUrl
    }
    if (s3Key) {
      updateData.s3_key = s3Key
    }
    if (durationSeconds > 0) {
      updateData.duration_seconds = durationSeconds
    }
    if (errorMessage) {
      updateData.error_message = errorMessage
    }
    
    await fetch(`${supabaseUrl}/rest/v1/audio_tracks?id=eq.${trackId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(updateData),
    })
    
    console.log(`[Concat] Updated track ${trackId}: status=${status}, duration=${durationSeconds}s`)
  } catch (error) {
    console.error('Failed to update Supabase:', error)
  }
}

async function removeFile(path) {
  try {
    const fs = require('fs')
    await fs.promises.unlink(path)
  } catch (e) {
    // Ignore cleanup errors
  }
}
