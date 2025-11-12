// Simple script to check MediaConvert status and trigger if needed
const jobId = 'test-job-id' // We'll get this from the API

async function checkMediaConvertStatus() {
  try {
    console.log('🔍 Checking MediaConvert status...')
    
    const response = await fetch(`http://localhost:3000/api/upload/mediaconvert-status?jobId=${jobId}`)
    
    if (!response.ok) {
      console.log('❌ Status check failed:', response.status)
      return
    }
    
    const result = await response.json()
    console.log('📊 MediaConvert Status:', result)
    
  } catch (error) {
    console.error('❌ Error checking status:', error.message)
  }
}

// Check status
checkMediaConvertStatus()
