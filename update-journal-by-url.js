// Update journal entry to use processed video URL - find by URL
const originalUrl = 'https://media.vibrationfit.com/user-uploads/720adebb-e6c0-4f6c-a5fc-164d128e083a/journal/uploads/1761408357222-h5zd1mep6le-oliver-test.mov'
const processedUrl = 'https://media.vibrationfit.com/user-uploads/720adebb-e6c0-4f6c-a5fc-164d128e083a/journal/uploads/processed/oliver-test.mov'

async function updateJournalEntryByUrl() {
  try {
    console.log('🔄 Finding and updating journal entry by video URL...')
    console.log('📹 Original URL:', originalUrl)
    console.log('📹 Processed URL:', processedUrl)
    
    // First, find the journal entry by URL
    const findResponse = await fetch('http://localhost:3000/api/journal/find-by-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoUrl: originalUrl
      })
    })
    
    if (!findResponse.ok) {
      const errorData = await findResponse.json()
      throw new Error(errorData.error || 'Find failed')
    }
    
    const findResult = await findResponse.json()
    console.log('🔍 Found journal entry:', findResult)
    
    if (!findResult.entry) {
      throw new Error('No journal entry found with this video URL')
    }
    
    // Now update the entry
    const updateResponse = await fetch('http://localhost:3000/api/journal/update-video-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        originalUrl,
        processedUrl,
        entryId: findResult.entry.id
      })
    })
    
    if (!updateResponse.ok) {
      const errorData = await updateResponse.json()
      throw new Error(errorData.error || 'Update failed')
    }
    
    const result = await updateResponse.json()
    console.log('✅ Journal entry updated successfully!')
    console.log('📊 Result:', result)
    
    return result
    
  } catch (error) {
    console.error('❌ Failed to update journal entry:', error.message)
    throw error
  }
}

// Run the update
updateJournalEntryByUrl()
  .then(result => {
    console.log('🎉 Success! Journal entry updated.')
    console.log('🔗 New video URL:', result.processedUrl)
  })
  .catch(error => {
    console.error('💥 Failed to update journal entry:', error.message)
  })
