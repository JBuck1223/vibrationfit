// Simple script to trigger MediaConvert via API
const userId = '720adebb-e6c0-4f6c-a5fc-164d128e083a'
const filename = 'oliver-test.mov'
const inputKey = 'user-uploads/720adebb-e6c0-4f6c-a5fc-164d128e083a/journal/uploads/1761408357222-h5zd1mep6le-oliver-test.mov'

async function triggerMediaConvert() {
  try {
    console.log('🎬 Triggering MediaConvert job via API...')
    console.log('📁 Input file:', filename)
    console.log('🔗 S3 key:', inputKey)
    
    const response = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'trigger-mediaconvert',
        inputKey: inputKey,
        filename: filename,
        userId: userId,
        folder: 'journal/uploads'
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'API call failed')
    }
    
    const result = await response.json()
    console.log('✅ MediaConvert job triggered successfully!')
    console.log('🆔 Job ID:', result.jobId)
    console.log('📊 Status:', result.status)
    
    return result
    
  } catch (error) {
    console.error('❌ Failed to trigger MediaConvert:', error.message)
    throw error
  }
}

// Run the processing
triggerMediaConvert()
  .then(result => {
    console.log('🎉 Video processing started!')
    console.log('Job ID:', result.jobId)
    console.log('Check status with: curl "http://localhost:3000/api/upload/mediaconvert-status?jobId=' + result.jobId + '"')
  })
  .catch(error => {
    console.error('💥 Failed to start video processing:', error.message)
  })
