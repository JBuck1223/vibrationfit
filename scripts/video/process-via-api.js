// Simple script to trigger video processing via existing API
const inputKey = 'user-uploads/720adebb-e6c0-4f6c-a5fc-164d128e083a/journal/uploads/1761408357222-h5zd1mep6le-oliver-test.mov'
const filename = 'oliver-test.mov'
const userId = '720adebb-e6c0-4f6c-a5fc-164d128e083a'
const folder = 'journal/uploads'

async function processVideoViaAPI() {
  try {
    console.log('🎬 Processing video via API...')
    console.log('📁 Input file:', filename)
    
    // Create a FormData object to simulate file upload
    const formData = new FormData()
    
    // We need to create a mock file object
    // Since we can't easily create a File object in Node.js, let's try a different approach
    // Let's create a simple API endpoint that processes existing S3 files
    
    console.log('📞 Calling processing API...')
    const response = await fetch('http://localhost:3000/api/upload/process-existing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputKey,
        filename,
        userId,
        folder
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Processing failed')
    }
    
    const result = await response.json()
    console.log('✅ Video processing completed!')
    console.log('📊 Result:', result)
    
    return result
    
  } catch (error) {
    console.error('❌ Video processing failed:', error.message)
    throw error
  }
}

// Run the processing
processVideoViaAPI()
  .then(result => {
    console.log('🎉 Success! Video processed.')
    console.log('🔗 Processed video URL:', result.outputUrl)
  })
  .catch(error => {
    console.error('💥 Failed to process video:', error.message)
  })
