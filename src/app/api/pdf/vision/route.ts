// PDF Generation API Route - Simplified: Just opens browser print dialog
// User can save as PDF directly from their browser
// Path: /src/app/api/pdf/vision/route.ts

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  // This endpoint is no longer needed - we use browser's native print
  // Keeping for backward compatibility, but the preview page handles it client-side
  return Response.json({ 
    message: 'Use browser print (Cmd/Ctrl + P) to save as PDF',
    method: 'browser_print'
  }, { status: 200 })
}

