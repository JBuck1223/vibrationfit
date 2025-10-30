// Client-side helper to download Vision PDF via API
// Uses server-side Puppeteer for high-quality PDF generation
// Path: /src/lib/pdf/download-vision-pdf.ts

export async function downloadVisionPDF(id: string): Promise<void> {
  if (!id) {
    throw new Error('Vision ID is required')
  }

  console.log('[PDF] Starting download for vision:', id)
  
  try {
    const res = await fetch('/api/pdf/vision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    
    console.log('[PDF] Response status:', res.status, res.statusText)
    
    if (!res.ok) {
      let errorMessage = 'PDF generation failed'
      let errorDetails: any = {}
      
      try {
        const errorData = await res.json()
        errorMessage = errorData.error || errorData.message || errorMessage
        errorDetails = errorData
        console.error('[PDF] API error response:', errorData)
      } catch {
        // If response isn't JSON, try to get text
        const text = await res.text().catch(() => '')
        errorMessage = text || `Server returned ${res.status} ${res.statusText}`
        console.error('[PDF] API error (non-JSON):', text)
      }
      
      const fullError = errorDetails.details 
        ? `${errorMessage}\n\nDetails: ${errorDetails.details}`
        : errorMessage
        
      throw new Error(fullError)
    }
    
    console.log('[PDF] Response OK, creating blob...')
    const blob = await res.blob()
    
    if (blob.size === 0) {
      throw new Error('PDF file is empty')
    }
    
    console.log('[PDF] Blob created, size:', blob.size, 'bytes')
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Life_I_Choose_${id}.pdf`
    a.style.display = 'none'
    
    document.body.appendChild(a)
    console.log('[PDF] Triggering download...')
    a.click()
    
    // Clean up after a short delay
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      console.log('[PDF] Download completed and cleaned up')
    }, 100)
    
  } catch (error) {
    console.error('[PDF] Error in download process:', error)
    throw error
  }
}

