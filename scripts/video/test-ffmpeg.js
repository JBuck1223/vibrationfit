// Test FFmpeg compression
import ffmpeg from 'fluent-ffmpeg'
import { PassThrough } from 'stream'

async function testFFmpeg() {
  try {
    console.log('🧪 Testing FFmpeg compression...')
    
    // Create a simple test buffer (1MB of zeros)
    const testBuffer = Buffer.alloc(1024 * 1024, 0)
    const inputStream = new PassThrough()
    const outputStream = new PassThrough()
    const chunks = []
    
    // Collect output chunks
    outputStream.on('data', (chunk) => {
      chunks.push(chunk)
    })
    
    outputStream.on('end', () => {
      const compressedBuffer = Buffer.concat(chunks)
      console.log(`✅ FFmpeg test completed:`)
      console.log(`   Input: ${testBuffer.length} bytes`)
      console.log(`   Output: ${compressedBuffer.length} bytes`)
    })
    
    outputStream.on('error', (error) => {
      console.error('❌ FFmpeg output error:', error)
    })
    
    // Write test buffer to stream
    inputStream.write(testBuffer)
    inputStream.end()
    
    // Test FFmpeg with simple options
    const command = ffmpeg()
      .input(inputStream)
      .outputOptions([
        '-c:v libx264',
        '-preset fast',
        '-crf 23',
        '-maxrate 2M',
        '-bufsize 4M',
        '-vf scale=1280:720',
        '-r 30',
        '-c:a aac',
        '-b:a 128k',
        '-movflags +faststart',
        '-f mp4'
      ])
      .output(outputStream)
      .on('error', (error) => {
        console.error('❌ FFmpeg command error:', error)
      })
      .on('end', () => {
        console.log('🎉 FFmpeg command completed')
      })
      .run()
      
  } catch (error) {
    console.error('❌ FFmpeg test failed:', error)
  }
}

testFFmpeg()
