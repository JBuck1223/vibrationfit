import { NextRequest, NextResponse } from 'next/server'

/**
 * Receives client-side errors from the logger and logs them server-side.
 * These show up in Vercel Runtime Logs (and any log drain you configure),
 * so you can see why functionality failed for users without relying on
 * browser console. No PII is logged by default; add carefully if needed.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, stack, type, url, label } = body as {
      message?: string
      stack?: string
      type?: string
      url?: string
      label?: string
    }
    const prefix = '[VibrationFit Client Error]'
    const meta = [type && `type=${type}`, url && `url=${url}`, label && `label=${label}`]
      .filter(Boolean)
      .join(' ')
    console.error(prefix, meta, '\n', message ?? 'Unknown error')
    if (stack) console.error(prefix, 'stack:', stack)
    return new NextResponse(null, { status: 204 })
  } catch {
    return new NextResponse(null, { status: 400 })
  }
}
