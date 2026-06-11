// Proxy media fetches to avoid CORS when client needs to download audio/video bytes
// GET /api/media/proxy?url=<encoded-url>

import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_HOSTS = [
  'mureka.ai',
  'cdn.mureka.ai',
  'api.mureka.ai',
  'amazonaws.com',
  'supabase.co',
  'media.vibrationfit.com',
  'fal.media',
  'v3.fal.media',
  'storage.googleapis.com',
]

function isAllowedUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false
    const host = url.hostname.toLowerCase()
    return ALLOWED_HOSTS.some((allowed) => host === allowed || host.endsWith('.' + allowed))
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get('url')
  if (!urlParam) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  let targetUrl: string
  try {
    targetUrl = decodeURIComponent(urlParam)
  } catch {
    return NextResponse.json({ error: 'Invalid url parameter' }, { status: 400 })
  }

  if (!isAllowedUrl(targetUrl)) {
    return NextResponse.json({ error: 'URL not allowed for proxy' }, { status: 403 })
  }

  try {
    const res = await fetch(targetUrl, { cache: 'no-store' })

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${res.status}` },
        { status: res.status === 404 ? 404 : 502 }
      )
    }

    const contentType = res.headers.get('content-type') || 'application/octet-stream'
    const contentLength = res.headers.get('content-length')

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=3600',
    }
    if (contentLength) {
      headers['Content-Length'] = contentLength
    }

    // Stream the response body directly instead of buffering in memory
    return new NextResponse(res.body, { headers })
  } catch (error) {
    console.error('Media proxy fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 502 }
    )
  }
}
