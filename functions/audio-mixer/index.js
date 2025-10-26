import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { exec } from 'child_process'
import { promisify } from 'util'
import { createWriteStream, unlink } from 'fs'
import { pipeline } from 'stream/promises'

const execAsync = promisify(exec)

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

const BUCKET_NAME = process.env.BUCKET_NAME || 'vibration-fit-client-storage'

export const handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2))
  
  const { voiceUrl, bgUrl, outputKey, variant, voiceVolume, bgVolume } = event
  
  try {
    // Download voice track
    const voicePath = `/tmp/voice-${Date.now()}.mp3`
    await downloadFromS3(voiceUrl, voicePath)
    
    // Download background track
    const bgPath = `/tmp/bg-${Date.now()}.mp3`
    await downloadFromS3(bgUrl, bgPath)
    
    // Mix audio using FFmpeg (requires ffmpeg layer)
    const outputPath = `/tmp/mixed-${Date.now()}.mp3`
    await mixAudio(voicePath, bgPath, outputPath, voiceVolume || 0.7, bgVolume || 0.3)
    
    // Upload mixed audio to S3
    await uploadToS3(outputPath, outputKey)
    
    // Cleanup
    await Promise.all([
      removeFile(voicePath),
      removeFile(bgPath),
      removeFile(outputPath)
    ])
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        outputKey,
        message: 'Audio mixed successfully'
      })
    }
  } catch (error) {
    console.error('Error:', error)
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
  // Extract key from S3 URL
  const key = s3Url.split(BUCKET_NAME + '/')[1]
  
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key
  })
  
  const response = await s3Client.send(command)
  
  const fileStream = createWriteStream(localPath)
  await pipeline(response.Body, fileStream)
}

async function mixAudio(voicePath, bgPath, outputPath, voiceVolume, bgVolume) {
  // Use FFmpeg to mix audio
  const command = `ffmpeg -i ${voicePath} -i ${bgPath} ` +
    `-filter_complex "[0:a]volume=${voiceVolume}[a0];[1:a]volume=${bgVolume},aloop=loop=-1:size=2e+09[a1];[a0][a1]amix=inputs=2:duration=first" ` +
    `-codec:a libmp3lame -b:a 192k -y ${outputPath}`
  
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
}

async function removeFile(path) {
  try {
    const fs = await import('fs')
    await fs.promises.unlink(path)
  } catch (e) {
    // Ignore
  }
}
