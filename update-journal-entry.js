// Update journal entry to use processed video URL
const originalUrl = 'https://media.vibrationfit.com/user-uploads/720adebb-e6c0-4f6c-a5fc-164d128e083a/journal/uploads/1761408357222-h5zd1mep6le-oliver-test.mov'
const processedUrl = 'https://media.vibrationfit.com/user-uploads/720adebb-e6c0-4f6c-a5fc-164d128e083a/journal/uploads/processed/oliver-test.mov'

async function updateJournalEntry() {
  try {
    console.log('🔄 Updating journal entry to use processed video...')
    console.log('📹 Original URL:', originalUrl)
    console.log('📹 Processed URL:', processedUrl)
    
    // Update the database
    const response = await fetch('http://localhost:3000/api/journal/update-video-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        originalUrl,
        processedUrl,
        entryId: '8f4b43fb-337a-47fb-b6a1-5cc8ba0aebbb' // From your database insert
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Update failed')
    }
    
    const result = await response.json()
    console.log('✅ Journal entry updated successfully!')
    console.log('📊 Result:', result)
    
    return result
    
  } catch (error) {
    console.error('❌ Failed to update journal entry:', error.message)
    throw error
  }
}

// Run the update
updateJournalEntry()
  .then(result => {
    console.log('🎉 Success! Journal entry updated.')
    console.log('🔗 New video URL:', result.newUrl)
  })
  .catch(error => {
    console.error('💥 Failed to update journal entry:', error.message)
  })
