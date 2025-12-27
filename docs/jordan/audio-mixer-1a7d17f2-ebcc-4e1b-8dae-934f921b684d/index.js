import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { exec } from 'child_process'
import { promisify } from 'util'
import { createWriteStream, unlink } from 'fs'
import { pipeline } from 'stream/promises'

const execAsync = promisify(exec)

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  // Don't specify credentials - use Lambda execution role (audio-mixer-lambda-role)
})

const BUCKET_NAME = process.env.BUCKET_NAME || 'vibration-fit-client-storage'

export const handler = async (event) => {
  console.log('Raw Event:', JSON.stringify(event, null, 2))
  
  // Parse event body if it's a string (from API Gateway/Lambda invoke)
  let eventData = event
  if (typeof event.body === 'string') {
    try {
      eventData = JSON.parse(event.body)
    } catch (e) {
      console.log('Event body is not JSON, using as-is')
    }
  }
  
  console.log('Parsed Event Data:', JSON.stringify(eventData, null, 2))
  
  const { voiceUrl, bgUrl, binauralUrl, outputKey, variant, voiceVolume, bgVolume, binauralVolume, trackId } = eventData
  
  console.log('[Mixing] Extracted URLs:', {
    voiceUrl: voiceUrl || 'MISSING',
    bgUrl: bgUrl || 'MISSING',
    binauralUrl: binauralUrl || 'none',
    trackId
  })
  
  try {
    // Validate required URLs
    if (!voiceUrl) {
      throw new Error('voiceUrl is required but was not provided')
    }
    if (!bgUrl) {
      throw new Error('bgUrl is required but was not provided')
    }
    
    // Download voice track
    const voicePath = `/tmp/voice-${Date.now()}.mp3`
    console.log('[Mixing] Downloading voice from:', voiceUrl)
    await downloadFromS3(voiceUrl, voicePath)
    
    // Download background track
    const bgPath = `/tmp/bg-${Date.now()}.mp3`
    console.log('[Mixing] Downloading background from:', bgUrl)
    await downloadFromS3(bgUrl, bgPath)
    
    // Download binaural track (optional)
    let binauralPath = null
    if (binauralUrl && typeof binauralUrl === 'string' && binauralUrl.trim() !== '') {
      binauralPath = `/tmp/binaural-${Date.now()}.mp3`
      await downloadFromS3(binauralUrl, binauralPath)
      console.log('[Mixing] Including binaural track in mix')
    } else if (binauralUrl) {
      console.log('[Mixing] Binaural URL provided but invalid, skipping:', binauralUrl)
    }
    
    // Mix audio using FFmpeg (requires ffmpeg layer)
    const outputPath = `/tmp/mixed-${Date.now()}.mp3`
    await mixAudio(voicePath, bgPath, binauralPath, outputPath, voiceVolume || 0.7, bgVolume || 0.3, binauralVolume || 0.2)
    
    // Upload mixed audio to S3
    const mixedUrl = await uploadToS3(outputPath, outputKey)
    
    // Update Supabase with mixed audio URL
    if (trackId) {
      await updateMixStatus(trackId, 'completed', mixedUrl, outputKey)
    }
    
    // Cleanup
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
    
    // Update Supabase with error
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

async function downloadFromS3(s3Url, localPath) {
  // Validate URL
  if (!s3Url || typeof s3Url !== 'string' || s3Url.trim() === '') {
    throw new Error(`Invalid S3 URL: ${s3Url}`)
  }
  
  // Extract key from CloudFront URL or S3 URL
  let key
  if (s3Url.includes(BUCKET_NAME + '/')) {
    // S3 URL format
    key = s3Url.split(BUCKET_NAME + '/')[1]
  } else if (s3Url.includes('media.vibrationfit.com/')) {
    // CloudFront URL format - extract path after domain
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
}

async function mixAudio(voicePath, bgPath, binauralPath, outputPath, voiceVolume, bgVolume, binauralVolume) {
  // Use FFmpeg from layer
  const ffmpegPath = '/opt/ffmpeg-layer/bin/ffmpeg'
  
  let command
  if (binauralPath) {
    // 3-track mix: Voice + Background + Binaural
    command = `${ffmpegPath} -i ${voicePath} -i ${bgPath} -i ${binauralPath} ` +
      `-filter_complex "[0:a]volume=${voiceVolume}[a0];[1:a]volume=${bgVolume},aloop=loop=-1:size=2e+09[a1];[2:a]volume=${binauralVolume},aloop=loop=-1:size=2e+09[a2];[a0][a1][a2]amix=inputs=3:duration=first" ` +
      `-codec:a libmp3lame -b:a 192k -y ${outputPath}`
    
    console.log(`[Mixing] 3-track mix: Voice (${voiceVolume}) + Background (${bgVolume}) + Binaural (${binauralVolume})`)
  } else {
    // 2-track mix: Voice + Background only
    command = `${ffmpegPath} -i ${voicePath} -i ${bgPath} ` +
      `-filter_complex "[0:a]volume=${voiceVolume}[a0];[1:a]volume=${bgVolume},aloop=loop=-1:size=2e+09[a1];[a0][a1]amix=inputs=2:duration=first" ` +
      `-codec:a libmp3lame -b:a 192k -y ${outputPath}`
    
    console.log(`[Mixing] 2-track mix: Voice (${voiceVolume}) + Background (${bgVolume})`)
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

async function removeFile(path) {
  try {
    const fs = await import('fs')
    await fs.promises.unlink(path)
  } catch (e) {
    // Ignore
  }
}
